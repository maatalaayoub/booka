-- ============================================================
-- WORKER SCHEDULES
-- Each team member can have their own working hours per business.
-- ============================================================

CREATE TABLE IF NOT EXISTS worker_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_info_id UUID NOT NULL REFERENCES business_info(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sun…6=Sat
  is_open BOOLEAN DEFAULT true,
  open_time TIME,
  close_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One entry per worker per day per business
  CONSTRAINT unique_worker_day_schedule UNIQUE (business_info_id, worker_id, day_of_week)
);

-- Indexes
CREATE INDEX idx_worker_schedules_business ON worker_schedules(business_info_id);
CREATE INDEX idx_worker_schedules_worker ON worker_schedules(worker_id);
CREATE INDEX idx_worker_schedules_business_worker ON worker_schedules(business_info_id, worker_id);

-- RLS
ALTER TABLE worker_schedules ENABLE ROW LEVEL SECURITY;

-- Service role can do anything
CREATE POLICY "Service role full access on worker_schedules"
  ON worker_schedules
  FOR ALL
  USING (true)
  WITH CHECK (true);
