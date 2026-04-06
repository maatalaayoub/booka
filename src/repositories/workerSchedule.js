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

/**
 * Clamp a time string (HH:MM or HH:MM:SS) to be within [min, max].
 * Returns HH:MM.
 */
function clampTime(time, min, max) {
  const t = time?.substring(0, 5) || '09:00';
  if (min && t < min) return min;
  if (max && t > max) return max;
  return t;
}

/**
 * Sync ALL worker schedules for a business after business hours change.
 * - If a business day is now closed, mark corresponding worker days as closed.
 * - If a worker's open_time/close_time fall outside the new business range, clamp them.
 * @param {object} supabase
 * @param {string} businessInfoId
 * @param {Array<{dayOfWeek:number, isOpen:boolean, openTime?:string, closeTime?:string}>} newBusinessHours
 */
export async function syncWorkerSchedulesToBusinessHours(supabase, businessInfoId, newBusinessHours) {
  const allSchedules = await findAllWorkerSchedules(supabase, businessInfoId);
  if (!allSchedules.length) return;

  const bizByDay = {};
  for (const bh of newBusinessHours) {
    bizByDay[bh.dayOfWeek] = bh;
  }

  const updates = [];
  for (const ws of allSchedules) {
    const biz = bizByDay[ws.day_of_week];
    if (!biz || !biz.isOpen) {
      // Business is closed this day — close worker too
      if (ws.is_open) {
        updates.push({
          business_info_id: businessInfoId,
          worker_id: ws.worker_id,
          day_of_week: ws.day_of_week,
          is_open: false,
          open_time: null,
          close_time: null,
          updated_at: new Date().toISOString(),
        });
      }
    } else if (ws.is_open && ws.open_time && ws.close_time) {
      // Clamp worker times to business range
      const bizOpen = biz.openTime?.substring(0, 5);
      const bizClose = biz.closeTime?.substring(0, 5);
      const newOpen = clampTime(ws.open_time, bizOpen, bizClose);
      const newClose = clampTime(ws.close_time, bizOpen, bizClose);
      const oldOpen = ws.open_time.substring(0, 5);
      const oldClose = ws.close_time.substring(0, 5);

      if (newOpen !== oldOpen || newClose !== oldClose) {
        updates.push({
          business_info_id: businessInfoId,
          worker_id: ws.worker_id,
          day_of_week: ws.day_of_week,
          is_open: true,
          open_time: newOpen,
          close_time: newClose > newOpen ? newClose : newOpen,
          updated_at: new Date().toISOString(),
        });
      }
    }
  }

  if (updates.length > 0) {
    const { error } = await supabase
      .from('worker_schedules')
      .upsert(updates, { onConflict: 'business_info_id,worker_id,day_of_week' });

    if (error) throw error;
  }
}
