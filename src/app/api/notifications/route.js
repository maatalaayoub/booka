import { getUserId } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError, apiData, apiSuccess } from '@/lib/api-response';
import {
  findNotificationsByUser,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/repositories/notification';

/**
 * GET /api/notifications
 * Fetch notifications for the current user.
 * Query params: ?countOnly=true to get just the unread count.
 */
export async function GET(request) {
  try {
    const clerkId = await getUserId(request);
    if (!clerkId) return apiError('Unauthorized', 401);

    const supabase = createServerSupabaseClient();

    // Look up internal user id from clerk_id
    const userId = await resolveUserId(supabase, clerkId);
    if (!userId) return apiError('User not found', 404);

    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get('countOnly') === 'true';

    if (countOnly) {
      const count = await getUnreadCount(supabase, userId);
      return apiData({ unreadCount: count });
    }

    const notifications = await findNotificationsByUser(supabase, userId);
    const unreadCount = await getUnreadCount(supabase, userId);

    return apiData({ notifications, unreadCount });
  } catch (err) {
    console.error('[notifications GET] Error:', err);
    return apiError('Internal server error');
  }
}

/**
 * PATCH /api/notifications
 * Mark notification(s) as read.
 * Body: { notificationId } to mark one, or { all: true } to mark all.
 */
export async function PATCH(request) {
  try {
    const clerkId = await getUserId(request);
    if (!clerkId) return apiError('Unauthorized', 401);

    const supabase = createServerSupabaseClient();
    const userId = await resolveUserId(supabase, clerkId);
    if (!userId) return apiError('User not found', 404);

    const body = await request.json();

    if (body.all === true) {
      await markAllNotificationsAsRead(supabase, userId);
      return apiSuccess({ message: 'All notifications marked as read' });
    }

    if (!body.notificationId) {
      return apiError('notificationId is required', 400);
    }

    const notification = await markNotificationAsRead(supabase, body.notificationId, userId);
    return apiSuccess({ notification });
  } catch (err) {
    console.error('[notifications PATCH] Error:', err);
    return apiError('Internal server error');
  }
}

/**
 * DELETE /api/notifications
 * Delete a single notification.
 * Body: { notificationId }
 */
export async function DELETE(request) {
  try {
    const clerkId = await getUserId(request);
    if (!clerkId) return apiError('Unauthorized', 401);

    const supabase = createServerSupabaseClient();
    const userId = await resolveUserId(supabase, clerkId);
    if (!userId) return apiError('User not found', 404);

    const body = await request.json();
    if (!body.notificationId) {
      return apiError('notificationId is required', 400);
    }

    await deleteNotification(supabase, body.notificationId, userId);
    return apiSuccess({ message: 'Notification deleted' });
  } catch (err) {
    console.error('[notifications DELETE] Error:', err);
    return apiError('Internal server error');
  }
}

// ─── HELPER ─────────────────────────────────────────────────────────────

/**
 * Resolve the internal `users.id` from a Clerk ID.
 */
async function resolveUserId(supabase, clerkId) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.id || null;
}
