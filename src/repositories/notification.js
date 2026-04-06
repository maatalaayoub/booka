// ─── NOTIFICATION REPOSITORY ────────────────────────────────────────────
// Reusable data-access functions for the `notifications` table.

/**
 * Fetch notifications for a user, ordered by newest first.
 */
export async function findNotificationsByUser(supabase, userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

/**
 * Get unread notification count for a user.
 */
export async function getUnreadCount(supabase, userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) throw error;
  return count || 0;
}

/**
 * Create a new notification.
 */
export async function createNotification(supabase, { userId, type, title, message, data = null }) {
  const { data: row, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      data,
    })
    .select()
    .single();

  if (error) throw error;
  return row;
}

/**
 * Mark a single notification as read (owned by user).
 */
export async function markNotificationAsRead(supabase, notificationId, userId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsAsRead(supabase, userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) throw error;
}

/**
 * Delete a single notification (owned by user).
 */
export async function deleteNotification(supabase, notificationId, userId) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) throw error;
}
