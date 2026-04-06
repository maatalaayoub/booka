import { getUserId, getInternalUserId } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError, apiData, apiSuccess, validationResponse } from '@/lib/api-response';
import { parseBody, parseQuery } from '@/lib/validate';
import { sanitizeText } from '@/lib/sanitize';
import { findTeamMember } from '@/repositories/team';
import {
  findWorkerSchedule,
  upsertWorkerWeekSchedule,
} from '@/repositories/workerSchedule';
import { createExceptionSchema, updateExceptionSchema, deleteExceptionSchema } from '@/schemas/schedule';

// ── Helper: auth + membership ───────────────────────────────
async function getWorkerContext(request) {
  const clerkId = await getUserId(request);
  if (!clerkId) return null;

  const supabase = createServerSupabaseClient();
  const userId = await getInternalUserId(supabase, clerkId);
  if (!userId) return null;

  return { supabase, userId };
}

// ── Helper: find worker exceptions ──────────────────────────
async function findWorkerExceptions(supabase, businessId, userId) {
  const { data, error } = await supabase
    .from('schedule_exceptions')
    .select('*')
    .eq('business_info_id', businessId)
    .eq('worker_id', userId)
    .order('date', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * GET /api/worker/schedule?businessId=X
 * Returns the current worker's schedule + exceptions for a business.
 */
export async function GET(request) {
  try {
    const ctx = await getWorkerContext(request);
    if (!ctx) return apiError('Unauthorized', 401);

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) return apiError('businessId is required', 400);

    const membership = await findTeamMember(ctx.supabase, businessId, ctx.userId);
    if (!membership) return apiError('Not a team member', 403);

    const [schedule, exceptions] = await Promise.all([
      findWorkerSchedule(ctx.supabase, businessId, ctx.userId),
      findWorkerExceptions(ctx.supabase, businessId, ctx.userId),
    ]);

    return apiData({ schedule, exceptions });
  } catch (error) {
    console.error('[Worker Schedule GET]', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * PUT /api/worker/schedule
 * Worker updates their own working hours (requires canEditSchedule).
 */
export async function PUT(request) {
  try {
    const ctx = await getWorkerContext(request);
    if (!ctx) return apiError('Unauthorized', 401);

    const body = await request.json();
    const { businessId, schedule } = body;

    if (!businessId || !schedule || !Array.isArray(schedule)) {
      return apiError('businessId and schedule array are required', 400);
    }

    const membership = await findTeamMember(ctx.supabase, businessId, ctx.userId);
    if (!membership) return apiError('Not a team member', 403);
    if (!membership.permissions?.canEditSchedule) {
      return apiError('No schedule edit permission', 403);
    }

    for (const day of schedule) {
      if (typeof day.dayOfWeek !== 'number' || day.dayOfWeek < 0 || day.dayOfWeek > 6) {
        return apiError('dayOfWeek must be 0-6', 400);
      }
      if (day.isOpen) {
        if (!day.openTime || !day.closeTime) {
          return apiError('openTime and closeTime required for open days', 400);
        }
        const timeRe = /^\d{2}:\d{2}$/;
        if (!timeRe.test(day.openTime) || !timeRe.test(day.closeTime)) {
          return apiError('Times must be in HH:MM format', 400);
        }
      }
    }

    const result = await upsertWorkerWeekSchedule(ctx.supabase, businessId, ctx.userId, schedule);
    return apiSuccess({ schedule: result });
  } catch (error) {
    console.error('[Worker Schedule PUT]', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * POST /api/worker/schedule
 * Worker adds a personal exception (requires canEditSchedule).
 */
export async function POST(request) {
  try {
    const ctx = await getWorkerContext(request);
    if (!ctx) return apiError('Unauthorized', 401);

    const body = await request.json();
    const { businessId, ...exceptionBody } = body;
    if (!businessId) return apiError('businessId is required', 400);

    const membership = await findTeamMember(ctx.supabase, businessId, ctx.userId);
    if (!membership) return apiError('Not a team member', 403);
    if (!membership.permissions?.canEditSchedule) {
      return apiError('No schedule edit permission', 403);
    }

    const { error: validationError, data: validated } = parseBody(createExceptionSchema, exceptionBody);
    if (validationError) return validationResponse(validationError);

    const fullDay = validated.isFullDay === true || (!validated.startTime && !validated.endTime);

    const { data, error } = await ctx.supabase
      .from('schedule_exceptions')
      .insert({
        business_info_id: businessId,
        worker_id: ctx.userId,
        title: sanitizeText(validated.title),
        type: validated.type,
        date: validated.date,
        end_date: fullDay && validated.endDate ? validated.endDate : null,
        start_time: fullDay ? null : (validated.startTime || null),
        end_time: fullDay ? null : (validated.endTime || null),
        is_full_day: fullDay,
        recurring: validated.recurring,
        recurring_day: validated.recurring ? validated.recurringDay : null,
        notes: sanitizeText(validated.notes) || null,
      })
      .select()
      .single();

    if (error) throw error;
    return apiSuccess({ exception: data });
  } catch (error) {
    console.error('[Worker Schedule POST]', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * DELETE /api/worker/schedule?id=X&businessId=Y
 * Worker deletes their own exception.
 */
export async function DELETE(request) {
  try {
    const ctx = await getWorkerContext(request);
    if (!ctx) return apiError('Unauthorized', 401);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const businessId = searchParams.get('businessId');
    if (!id || !businessId) return apiError('id and businessId are required', 400);

    const membership = await findTeamMember(ctx.supabase, businessId, ctx.userId);
    if (!membership) return apiError('Not a team member', 403);

    const { error } = await ctx.supabase
      .from('schedule_exceptions')
      .delete()
      .eq('id', id)
      .eq('business_info_id', businessId)
      .eq('worker_id', ctx.userId);

    if (error) throw error;
    return apiSuccess();
  } catch (error) {
    console.error('[Worker Schedule DELETE]', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * PATCH /api/worker/schedule
 * Worker updates an existing personal exception.
 */
export async function PATCH(request) {
  try {
    const ctx = await getWorkerContext(request);
    if (!ctx) return apiError('Unauthorized', 401);

    const body = await request.json();
    const { businessId, ...exceptionBody } = body;
    if (!businessId) return apiError('businessId is required', 400);

    const membership = await findTeamMember(ctx.supabase, businessId, ctx.userId);
    if (!membership) return apiError('Not a team member', 403);
    if (!membership.permissions?.canEditSchedule) {
      return apiError('No schedule edit permission', 403);
    }

    const { error: validationError, data: validated } = parseBody(updateExceptionSchema, exceptionBody);
    if (validationError) return validationResponse(validationError);

    const fullDay = validated.isFullDay === true || (!validated.startTime && !validated.endTime);

    const { data, error } = await ctx.supabase
      .from('schedule_exceptions')
      .update({
        title: sanitizeText(validated.title),
        type: validated.type,
        date: validated.date,
        end_date: fullDay && validated.endDate ? validated.endDate : null,
        start_time: fullDay ? null : (validated.startTime || null),
        end_time: fullDay ? null : (validated.endTime || null),
        is_full_day: fullDay,
        recurring: validated.recurring,
        recurring_day: validated.recurring ? validated.recurringDay : null,
        notes: sanitizeText(validated.notes) || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.id)
      .eq('business_info_id', businessId)
      .eq('worker_id', ctx.userId)
      .select()
      .single();

    if (error) throw error;
    return apiSuccess({ exception: data });
  } catch (error) {
    console.error('[Worker Schedule PATCH]', error);
    return apiError('Internal server error', 500);
  }
}
