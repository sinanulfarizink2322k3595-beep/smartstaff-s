CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'student', -- student, staff, admin, security
  department VARCHAR(255),
  roll_number VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  organization_code VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT role_check CHECK (role IN ('student', 'staff', 'admin', 'security'))
);

-- User logins tracking
CREATE TABLE IF NOT EXISTS user_logins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  logout_time TIMESTAMP WITH TIME ZONE
);

-- Outpass requests
CREATE TABLE IF NOT EXISTS outpasses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  from_date TIMESTAMP WITH TIME ZONE NOT NULL,
  to_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, COMPLETED
  approved_by UUID REFERENCES users(id),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT status_check CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'))
);

-- Meeting requests
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  purpose TEXT NOT NULL,
  requested_date TIMESTAMP WITH TIME ZONE NOT NULL,
  preferred_time VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED', -- REQUESTED, SCHEDULED, COMPLETED, CANCELLED
  room_id VARCHAR(100),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT meeting_status_check CHECK (status IN ('REQUESTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'PENDING', 'APPROVED', 'REJECTED'))
);

-- Staff availability
CREATE TABLE IF NOT EXISTS staff_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  day_of_week VARCHAR(20) NOT NULL, -- Monday, Tuesday, etc
  is_available BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(staff_id, day_of_week, start_time, end_time)
);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Security logs
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outpass_id UUID REFERENCES outpasses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  gate_action VARCHAR(50) NOT NULL, -- entry, exit
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  location VARCHAR(255)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50), -- outpass, meeting, alert, etc
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_logins_user_id ON user_logins(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logins_email ON user_logins(email);
CREATE INDEX IF NOT EXISTS idx_outpasses_student_id ON outpasses(student_id);
CREATE INDEX IF NOT EXISTS idx_outpasses_status ON outpasses(status);
CREATE INDEX IF NOT EXISTS idx_meetings_student_id ON meetings(student_id);
CREATE INDEX IF NOT EXISTS idx_meetings_staff_id ON meetings(staff_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff_id ON staff_availability(staff_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE outpasses ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_logins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = auth_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- Admins can read all users
CREATE POLICY "Admins can read all users" ON users
  FOR SELECT USING (
    (SELECT role FROM users WHERE auth_id = auth.uid()) = 'admin'
  );

-- Users can read their own outpasses
CREATE POLICY "Users can read own outpasses" ON outpasses
  FOR SELECT USING (
    student_id = (SELECT id FROM users WHERE auth_id = auth.uid()) OR
    (SELECT role FROM users WHERE auth_id = auth.uid()) = 'admin'
  );

-- Users can read their own meetings
CREATE POLICY "Users can read own meetings" ON meetings
  FOR SELECT USING (
    student_id = (SELECT id FROM users WHERE auth_id = auth.uid()) OR
    staff_id = (SELECT id FROM users WHERE auth_id = auth.uid()) OR
    (SELECT role FROM users WHERE auth_id = auth.uid()) = 'admin'
  );

-- Staff can read their availability
CREATE POLICY "Staff can read own availability" ON staff_availability
  FOR SELECT USING (
    staff_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Staff can update their availability
CREATE POLICY "Staff can update own availability" ON staff_availability
  FOR UPDATE USING (
    staff_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Users can create their own login records
CREATE POLICY "Users can insert own login records" ON user_logins
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE users.id = user_logins.user_id)
  );

-- Users can read their own login records
CREATE POLICY "Users can read own login records" ON user_logins
  FOR SELECT USING (user_id = auth.uid());
