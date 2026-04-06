// ─── WORKER SCHEDULE REPOSITORY ─────────────────────────────────────────
// Data-access functions for the `worker_schedules` table.

/**
 * Get a worker's full weekly schedule for a business.
 */
export async function findWorkerSchedule(supabase, businessInfoId, workerId) {
  const { data, error } = await supabase
    .from('worker_schedules')
    .select('*')
    .eq('business_info_id', businessInfoId)
    .eq('worker_id', workerId)
    .order('day_of_week', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get schedules for ALL workers in a business.
 */
export async function findAllWorkerSchedules(supabase, businessInfoId) {
  const { data, error } = await supabase
    .from('worker_schedules')
    .select('*')
    .eq('business_info_id', businessInfoId)
    .order('worker_id')
    .order('day_of_week', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Upsert (insert or update) a worker's schedule for a specific day.
 */
export async function upsertWorkerDaySchedule(supabase, { businessInfoId, workerId, dayOfWeek, isOpen, openTime, closeTime }) {
  const { data, error } = await supabase
    .from('worker_schedules')
    .upsert({
      business_info_id: businessInfoId,
      worker_id: workerId,
      day_of_week: dayOfWeek,
      is_open: isOpen,
      open_time: openTime,
      close_time: closeTime,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'business_info_id,worker_id,day_of_week',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Upsert a full week of schedules for a worker (7 days).
 */
export async function upsertWorkerWeekSchedule(supabase, businessInfoId, workerId, weekSchedule) {
  const rows = weekSchedule.map((day) => ({
    business_info_id: businessInfoId,
    worker_id: workerId,
    day_of_week: day.dayOfWeek,
    is_open: day.isOpen,
    open_time: day.isOpen ? day.openTime : null,
    close_time: day.isOpen ? day.closeTime : null,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('worker_schedules')
    .upsert(rows, {
      onConflict: 'business_info_id,worker_id,day_of_week',
    })
    .select();

  if (error) throw error;
  return data;
}

/**
 * Delete all schedule entries for a worker at a business.
 */
export async function deleteWorkerSchedule(supabase, businessInfoId, workerId) {
  const { error } = await supabase
    .from('worker_schedules')
    .delete()
    .eq('business_info_id', businessInfoId)
    .eq('worker_id', workerId);

  if (error) throw error;
}
