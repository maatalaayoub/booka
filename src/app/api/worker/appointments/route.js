import { getUserId, getInternalUserId } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError, apiData, apiSuccess } from '@/lib/api-response';
import { findTeamMember } from '@/repositories/team';
import { findAppointmentsForWorker, updateAppointmentByBusiness } from '@/repositories/appointment';

/**
 * GET /api/worker/appointments?businessId=X
 * Returns appointments assigned to the current worker for a specific business.
 */
export async function GET(request) {
  try {
    const clerkId = await getUserId(request);
    if (!clerkId) return apiError('Unauthorized', 401);

    const supabase = createServerSupabaseClient();
    const userId = await getInternalUserId(supabase, clerkId);
    if (!userId) return apiError('User not found', 404);

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) return apiError('businessId is required', 400);

    // Verify user is actually a team member of this business
    const membership = await findTeamMember(supabase, businessId, userId);
    if (!membership) return apiError('Not a team member', 403);

    // Check permission
    if (!membership.permissions?.canManageAppointments) {
      return apiError('No appointment permission', 403);
    }

    const appointments = await findAppointmentsForWorker(supabase, businessId, userId);

    return apiData(appointments);
  } catch (error) {
    console.error('[Worker Appointments]', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * PUT /api/worker/appointments
 * Worker updates status of their assigned appointment (confirm/complete/cancel).
 */
export async function PUT(request) {
  try {
    const clerkId = await getUserId(request);
    if (!clerkId) return apiError('Unauthorized', 401);

    const supabase = createServerSupabaseClient();
    const userId = await getInternalUserId(supabase, clerkId);
    if (!userId) return apiError('User not found', 404);

    const body = await request.json();
    const { id, businessId, status, start_time, end_time, rescheduled_by, previous_start_time, previous_end_time } = body;

    if (!id || !businessId) {
      return apiError('id and businessId are required', 400);
    }

    // Must provide either status or reschedule times
    if (!status && !start_time) {
      return apiError('status or start_time is required', 400);
    }

    if (status) {
      const ALLOWED_STATUSES = ['confirmed', 'completed', 'cancelled'];
      if (!ALLOWED_STATUSES.includes(status)) {
        return apiError('Invalid status', 400);
      }
    }

    // Verify team membership and permission
    const membership = await findTeamMember(supabase, businessId, userId);
    if (!membership) return apiError('Not a team member', 403);
    if (!membership.permissions?.canManageAppointments) {
      return apiError('No appointment permission', 403);
    }

    // Verify the appointment is assigned to this worker
    const { data: appt } = await supabase
      .from('appointments')
      .select('id, assigned_worker_id, status')
      .eq('id', id)
      .eq('business_info_id', businessId)
      .single();

    if (!appt) return apiError('Appointment not found', 404);
    if (appt.assigned_worker_id !== userId) {
      return apiError('Appointment not assigned to you', 403);
    }

    // Prevent invalid transitions
    if (appt.status === 'completed' || appt.status === 'cancelled') {
      return apiError(`Cannot change status from ${appt.status}`, 400);
    }

    // Build update fields
    const updateFields = {};
    if (status) updateFields.status = status;
    if (start_time) updateFields.start_time = start_time;
    if (end_time) updateFields.end_time = end_time;
    if (rescheduled_by !== undefined) updateFields.rescheduled_by = rescheduled_by;
    if (previous_start_time !== undefined) updateFields.previous_start_time = previous_start_time;
    if (previous_end_time !== undefined) updateFields.previous_end_time = previous_end_time;

    const updated = await updateAppointmentByBusiness(supabase, id, businessId, updateFields);

    return apiData({ appointment: updated });
  } catch (error) {
    console.error('[Worker Appointments PUT]', error);
    return apiError('Internal server error', 500);
  }
}
