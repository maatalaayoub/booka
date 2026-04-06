-- ============================================
-- TEAM MANAGEMENT MIGRATION
-- Phase 1: Database Foundation
-- ============================================

-- ============================================
-- 1. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'team_invite',
    'invite_accepted',
    'invite_declined',
    'member_removed',
    'appointment_assigned',
    'appointment_cancelled',
    'appointment_rescheduled',
    'general'
  )),
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- All reads/writes go through service-role API routes
DROP POLICY IF EXISTS "Notifications viewable by owner" ON notifications;
CREATE POLICY "Notifications viewable by owner"
  ON notifications FOR SELECT USING (true);


-- ============================================
-- 2. TEAM INVITATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_info_id UUID REFERENCES business_info(id) ON DELETE CASCADE NOT NULL,
  invited_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  invited_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  invited_username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Only one pending invitation per user per business
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_invitations_unique_pending
  ON team_invitations(business_info_id, invited_user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_team_invitations_business ON team_invitations(business_info_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_user ON team_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team invitations viewable" ON team_invitations;
CREATE POLICY "Team invitations viewable"
  ON team_invitations FOR SELECT USING (true);


-- ============================================
-- 3. TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_info_id UUID REFERENCES business_info(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('owner', 'worker')),
  permissions JSONB DEFAULT '{
    "canManageAppointments": true,
    "canEditSchedule": false,
    "canViewEarnings": false,
    "canManageServices": false
  }'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- One active membership per user per business
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_unique_active
  ON team_members(business_info_id, user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_team_members_business ON team_members(business_info_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members viewable" ON team_members;
CREATE POLICY "Team members viewable"
  ON team_members FOR SELECT USING (true);


-- ============================================
-- 4. ALTER APPOINTMENTS — add assigned worker
-- ============================================
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS assigned_worker_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_assigned_worker ON appointments(assigned_worker_id);


-- ============================================
-- 5. SEED: Insert existing business owners as team members
-- ============================================
INSERT INTO team_members (business_info_id, user_id, role, permissions, status)
SELECT
  bi.id,
  bi.user_id,
  'owner',
  '{"canManageAppointments": true, "canEditSchedule": true, "canViewEarnings": true, "canManageServices": true}'::jsonb,
  'active'
FROM business_info bi
WHERE bi.business_category IN ('business_owner', 'mobile_service')
  AND NOT EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.business_info_id = bi.id AND tm.user_id = bi.user_id
  );


-- Reload schema cache
NOTIFY pgrst, 'reload schema';
