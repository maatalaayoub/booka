import { requireAdmin } from '@/lib/admin';
import { apiError, apiData } from '@/lib/api-response';

/**
 * GET /api/admin/subscriptions
 * List business subscriptions along with their plan, owning business, and
 * latest payment. Also returns aggregate stats (total revenue, active count).
 * Supports ?search= (business name/email) and ?status= filters.
 * Degrades gracefully to empty data if the subscription tables do not exist yet.
 */
export async function GET(request) {
  const result = await requireAdmin();
  if (result.error) return result.error;
  const { supabase } = result;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const status = searchParams.get('status');

  try {
    let query = supabase
      .from('business_subscriptions')
      .select(`
        id, status, current_period_start, current_period_end, cancel_at_period_end, created_at,
        subscription_plans ( id, name, slug, price, currency, billing_interval ),
        business_info (
          id, business_category, professional_type,
          shop_salon_info ( business_name, city ),
          mobile_service_info ( business_name, city ),
          users ( email, username )
        ),
        subscription_payments ( id, amount, currency, status, payment_method, paid_at, created_at )
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    // If the tables are missing (feature not yet provisioned), return empty data.
    if (error) {
      return apiData({ subscriptions: [], stats: { totalRevenue: 0, activeCount: 0, currency: 'MAD' } });
    }

    let subscriptions = data || [];

    // Post-filter by business name / email (nested search not supported directly)
    if (search) {
      const q = search.toLowerCase();
      subscriptions = subscriptions.filter((s) => {
        const info = s.business_info;
        const name =
          info?.shop_salon_info?.business_name ||
          info?.mobile_service_info?.business_name ||
          info?.users?.username ||
          info?.users?.email ||
          '';
        const email = info?.users?.email || '';
        return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
      });
    }

    // Aggregate stats
    let totalRevenue = 0;
    let activeCount = 0;
    let currency = 'MAD';
    for (const sub of subscriptions) {
      if (sub.status === 'active' || sub.status === 'trialing') activeCount += 1;
      for (const pay of sub.subscription_payments || []) {
        if (pay.status === 'paid') {
          totalRevenue += Number(pay.amount) || 0;
          if (pay.currency) currency = pay.currency;
        }
      }
    }

    return apiData({
      subscriptions,
      stats: { totalRevenue, activeCount, currency },
    });
  } catch (err) {
    return apiError('Internal server error');
  }
}
