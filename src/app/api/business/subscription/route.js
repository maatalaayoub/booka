import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserId } from '@/lib/auth';
import { apiError, apiData } from '@/lib/api-response';
import { getBusinessContext } from '@/lib/business';

/**
 * GET /api/business/subscription
 * Returns the current business's subscription, available plans, and payment history.
 * Degrades gracefully to empty data if the subscription tables do not exist yet.
 */
export async function GET(request) {
  try {
    const authId = await getUserId(request);
    if (!authId) return apiError('Unauthorized', 401);

    const supabase = createServerSupabaseClient();
    const ctx = await getBusinessContext(supabase, authId);
    if (!ctx) return apiData({ subscription: null, plans: [], payments: [] });

    // Available plans (public reference data)
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('id, name, slug, description, price, currency, billing_interval, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // Tables not provisioned yet → return empty, non-error payload
    if (plansError) {
      return apiData({ subscription: null, plans: [], payments: [] });
    }

    // Current subscription for this business (latest one)
    const { data: subscription } = await supabase
      .from('business_subscriptions')
      .select(`
        id, status, current_period_start, current_period_end, cancel_at_period_end, created_at,
        subscription_plans ( id, name, slug, description, price, currency, billing_interval )
      `)
      .eq('business_info_id', ctx.businessInfoId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Payment history for this business
    const { data: payments } = await supabase
      .from('subscription_payments')
      .select('id, amount, currency, status, payment_method, paid_at, created_at')
      .eq('business_info_id', ctx.businessInfoId)
      .order('created_at', { ascending: false });

    return apiData({
      subscription: subscription || null,
      plans: plans || [],
      payments: payments || [],
    });
  } catch (err) {
    console.error('[business/subscription GET]', err);
    return apiError(err.message);
  }
}

/**
 * POST /api/business/subscription
 * Subscribe to / change the current business's plan.
 * Body: { planId: string }
 * NOTE: Actual payment collection is not integrated; the free plan activates
 * immediately, paid plans are created in a 'past_due' state pending payment.
 */
export async function POST(request) {
  try {
    const authId = await getUserId(request);
    if (!authId) return apiError('Unauthorized', 401);

    const supabase = createServerSupabaseClient();
    const ctx = await getBusinessContext(supabase, authId);
    if (!ctx) return apiError('Business not found', 404);

    const body = await request.json().catch(() => ({}));
    const planId = body?.planId;
    if (!planId || typeof planId !== 'string') {
      return apiError('planId is required', 400);
    }

    // Validate the plan exists and is active
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id, price, billing_interval')
      .eq('id', planId)
      .eq('is_active', true)
      .maybeSingle();

    if (planError || !plan) {
      return apiError('Invalid plan', 400);
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (plan.billing_interval === 'year') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const isFree = Number(plan.price) === 0;
    const status = isFree ? 'active' : 'past_due';

    // Cancel any existing active subscription for this business
    await supabase
      .from('business_subscriptions')
      .update({ status: 'canceled', cancel_at_period_end: true, updated_at: now.toISOString() })
      .eq('business_info_id', ctx.businessInfoId)
      .in('status', ['active', 'trialing', 'past_due']);

    // Create the new subscription
    const { data: created, error: createError } = await supabase
      .from('business_subscriptions')
      .insert({
        business_info_id: ctx.businessInfoId,
        plan_id: plan.id,
        status,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
      })
      .select('id, status')
      .single();

    if (createError) {
      return apiError(createError.message);
    }

    return apiData({ subscription: created, requiresPayment: !isFree }, 201);
  } catch (err) {
    console.error('[business/subscription POST]', err);
    return apiError(err.message);
  }
}
