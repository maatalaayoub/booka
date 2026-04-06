import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError, apiData } from '@/lib/api-response';
import { findTeamMembers } from '@/repositories/team';
import { findAllWorkerSchedules } from '@/repositories/workerSchedule';
import { findAppointmentsInRange } from '@/repositories/appointment';
import { toHHMM } from '@/services/bookingService';

/**
 * GET /api/book/available-workers?businessId=UUID&date=YYYY-MM-DD&startTime=HH:MM&endTime=HH:MM
 * Public endpoint – returns workers available for a specific time slot.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const dateStr = searchParams.get('date');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    if (!businessId || !dateStr || !startTime || !endTime) {
      return apiError('businessId, date, startTime, and endTime are required', 400);
    }

    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(businessId)) return apiError('Invalid businessId', 400);

    const supabase = createServerSupabaseClient();

    // Get active team members
    const members = await findTeamMembers(supabase, businessId);
    if (!members || members.length === 0) {
      return apiData({ workers: [] });
    }

    // Get all worker schedules for this business
    const workerSchedules = await findAllWorkerSchedules(supabase, businessId);

    // Get day of week for the requested date
    const [year, month, day] = dateStr.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    // Get all appointments for this day at this business
    const dayStart = `${dateStr}T00:00:00.000Z`;
    const dayEnd = `${dateStr}T23:59:59.999Z`;
    const appointments = await findAppointmentsInRange(supabase, businessId, dayStart, dayEnd);

    // Determine available workers
    const availableWorkers = [];

    for (const member of members) {
      const workerId = member.user_id;

      // Check worker's schedule for this day
      const workerDaySchedule = workerSchedules.find(
        ws => ws.worker_id === workerId && ws.day_of_week === dayOfWeek
      );

      // If no schedule is set for this worker, they follow the business hours (available by default)
      // If schedule exists but is_open is false, skip this worker
      if (workerDaySchedule) {
        if (!workerDaySchedule.is_open) continue;

        // Check if the requested time falls within the worker's hours
        const workerOpen = workerDaySchedule.open_time?.substring(0, 5);
        const workerClose = workerDaySchedule.close_time?.substring(0, 5);
        if (workerOpen && workerClose) {
          if (startTime < workerOpen || endTime > workerClose) continue;
        }
      }

      // Check if worker has conflicting appointments
      const slotStart = `${dateStr}T${startTime}:00.000Z`;
      const slotEnd = `${dateStr}T${endTime}:00.000Z`;

      const hasConflict = appointments.some(apt => {
        if (apt.assigned_worker_id !== workerId) return false;
        if (apt.status === 'cancelled') return false;
        // Check time overlap
        return apt.start_time < slotEnd && apt.end_time > slotStart;
      });

      if (hasConflict) continue;

      const profile = member.users?.user_profile;
      availableWorkers.push({
        id: workerId,
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        profileImageUrl: profile?.profile_image_url || null,
        role: member.role,
      });
    }

    return apiData({ workers: availableWorkers });
  } catch (err) {
    console.error('[available-workers GET]', err);
    return apiError('Internal server error');
  }
}
