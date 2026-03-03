# Security Dashboard - Technical Documentation

## Architecture Overview

The Security Dashboard is built using React, TypeScript, Supabase (PostgreSQL), and real-time subscriptions for instant updates.

## File Structure

```
src/
├── pages/
│   └── security/
│       └── SecurityDashboard.tsx          # Main dashboard component
├── components/
│   └── security/
│       ├── VerifyOutpassDialog.tsx        # Outpass verification component
│       └── EmergencyRequestDialog.tsx     # Emergency request submission
```

## Database Schema

### Tables Used

#### 1. `outpass_requests`
```sql
CREATE TABLE outpass_requests (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES profiles(id),
    reason TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    return_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status outpass_status DEFAULT 'pending',  -- enum: pending, approved, rejected
    hod_remarks TEXT,
    approved_by UUID REFERENCES staff_members(id),
    gate_status TEXT DEFAULT 'on_campus',     -- on_campus, left, returned
    gate_verified_at TIMESTAMP WITH TIME ZONE,
    requested_by_security BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 2. `profiles`
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL,
    department TEXT,
    roll_number TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 3. `staff_members`
```sql
CREATE TABLE staff_members (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    email TEXT,
    department TEXT DEFAULT 'Computer Science',
    is_hod BOOLEAN DEFAULT false,
    profile_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Key Features Implementation

### 1. Real-Time Subscriptions

The dashboard uses Supabase real-time subscriptions to automatically update when data changes:

```typescript
useEffect(() => {
  const channel = supabase
    .channel("outpass-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "outpass_requests" },
      () => {
        fetchRequests();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

**How it works:**
- Subscribes to all changes (`*` = INSERT, UPDATE, DELETE) on `outpass_requests` table
- When any change occurs, `fetchRequests()` is called to refresh data
- Cleanup on component unmount to prevent memory leaks

### 2. Data Fetching with Joins

The dashboard fetches outpass requests with related student and staff data:

```typescript
const { data, error } = await supabase
  .from("outpass_requests")
  .select(`
    *,
    student:profiles!outpass_requests_student_id_fkey(
      full_name, 
      roll_number, 
      department, 
      email
    ),
    approver:staff_members!outpass_requests_approved_by_fkey(name)
  `)
  .order("created_at", { ascending: false });
```

**Key Points:**
- Uses PostgreSQL foreign key relationships for joins
- `student:profiles!...` creates a nested object with student details
- `approver:staff_members!...` includes staff approver information
- Orders by most recent first

### 3. Filtering System

Multi-dimensional filtering implementation:

```typescript
const filtered = requests.filter((r) => {
  const matchesStatus = statusFilter === "all" || r.status === statusFilter;
  const matchesGate = gateFilter === "all" || r.gate_status === gateFilter;
  const matchesEmergency = !emergencyFilter || r.requested_by_security;
  const q = searchQuery.toLowerCase();
  const matchesSearch =
    !q ||
    r.student?.full_name?.toLowerCase().includes(q) ||
    r.student?.roll_number?.toLowerCase().includes(q) ||
    r.id.toLowerCase().includes(q);
  return matchesStatus && matchesGate && matchesEmergency && matchesSearch;
});
```

**Filter Types:**
1. **Status Filter**: approval status (pending/approved/rejected)
2. **Gate Filter**: physical location (on_campus/left/returned)
3. **Emergency Filter**: boolean toggle for emergency requests
4. **Search Filter**: text search across name, roll number, and outpass ID

### 4. Gate Status Management

Gate actions (marking exits and returns):

```typescript
const handleGateAction = async (newStatus: "left" | "returned") => {
  const { error } = await supabase
    .from("outpass_requests")
    .update({
      gate_status: newStatus,
      gate_verified_at: new Date().toISOString(),
    })
    .eq("id", result.id);

  if (!error) {
    toast.success(`Student marked as ${newStatus === "left" ? "left campus" : "returned to campus"}`);
    onVerified?.();
  }
};
```

**Flow:**
1. Security clicks "Mark Exit" or "Mark Return"
2. Updates `gate_status` field in database
3. Sets `gate_verified_at` timestamp
4. Shows success toast notification
5. Triggers callback to refresh parent component
6. Real-time subscription updates all connected clients

### 5. Emergency Request Workflow

#### a) Student Search

```typescript
const searchStudents = async () => {
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, roll_number, department")
    .eq("role", "student")
    .or(`full_name.ilike.%${searchQuery}%,roll_number.ilike.%${searchQuery}%`)
    .limit(5);
  
  setStudents(data || []);
};
```

**Features:**
- Case-insensitive search using `ilike`
- Searches both name and roll number
- Limits to 5 results for performance
- Only searches users with role = "student"

#### b) Request Submission

```typescript
const handleSubmit = async () => {
  const { error } = await supabase
    .from("outpass_requests")
    .insert({
      student_id: selectedStudent.id,
      reason,
      destination,
      departure_time: new Date(departureTime).toISOString(),
      return_time: new Date(returnTime).toISOString(),
      requested_by_security: true,  // Key field marking emergency
    });

  if (!error) {
    toast.success("Emergency outpass request submitted for approval");
  }
};
```

**Key Fields:**
- `requested_by_security: true` - Marks the request as emergency
- `status` defaults to 'pending' (needs staff approval)
- Converts datetime-local inputs to ISO format

### 6. Outpass Verification Logic

```typescript
const isExpired = result ? new Date(result.return_time) < new Date() : false;
const isValid = result?.status === "approved" && !isExpired;
```

**Validation Rules:**
1. **VALID**: Status = approved AND current time < return_time
2. **NOT APPROVED**: Status != approved
3. **EXPIRED**: Status = approved BUT current time > return_time

## Component State Management

### SecurityDashboard State

```typescript
const [requests, setRequests] = useState<OutpassWithStudent[]>([]);
const [loading, setLoading] = useState(true);
const [searchQuery, setSearchQuery] = useState("");
const [statusFilter, setStatusFilter] = useState<string>("all");
const [gateFilter, setGateFilter] = useState<string>("all");
const [emergencyFilter, setEmergencyFilter] = useState<boolean>(false);
const [selectedOutpass, setSelectedOutpass] = useState<OutpassWithStudent | null>(null);
const [verifyOpen, setVerifyOpen] = useState(false);
const [emergencyOpen, setEmergencyOpen] = useState(false);
```

**State Purpose:**
- `requests`: Main data array of all outpass requests
- `loading`: Loading state for initial fetch
- Filter states: Control what data is displayed
- Dialog states: Control which dialogs are open

### VerifyOutpassDialog State

```typescript
const [outpassId, setOutpassId] = useState("");
const [loading, setLoading] = useState(false);
const [updating, setUpdating] = useState(false);
const [result, setResult] = useState<VerifiedOutpass | null>(null);
const [error, setError] = useState("");
```

**State Purpose:**
- `outpassId`: User input for search
- `result`: Fetched outpass data
- `error`: Error message display
- `loading`/`updating`: Different loading states for UX

## UI/UX Design Patterns

### 1. Badge System

```typescript
const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-600"><CheckCircle />Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive"><XCircle />Rejected</Badge>;
    default:
      return <Badge variant="secondary"><Clock />Pending</Badge>;
  }
};
```

**Color Coding:**
- 🟢 Green: Positive states (approved, returned, valid)
- 🔴 Red: Negative states (rejected, not approved)
- 🟡 Yellow: Neutral states (pending, awaiting)
- 🟠 Orange: Warning states (left campus, emergency)
- 🔵 Blue: Information states (staff approval highlight)
- 🟣 Purple: Special states (emergency count)

### 2. Prominent Approval Display

```typescript
{selectedOutpass.status === "approved" && selectedOutpass.approver?.name && (
  <div className="p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
    <div className="flex items-start gap-3">
      <CheckCircle className="w-5 h-5 text-blue-600" />
      <div>
        <p className="text-sm font-semibold">✓ Approved by Staff Authority</p>
        <p className="text-lg font-bold">{selectedOutpass.approver.name}</p>
        <p className="text-xs">Authorization verified - Student cleared for exit</p>
      </div>
    </div>
  </div>
)}
```

**Design Goal:**
- Make staff approval information impossible to miss
- Clear visual hierarchy
- Prominent staff name display
- Explicit authorization message

### 3. Emergency Request Alert Banner

```typescript
{emergencyPendingCount > 0 && (
  <Card className="col-span-full border-orange-200 bg-orange-50">
    <CardContent className="pt-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-600" />
        <div>
          <p className="font-semibold text-orange-900">
            {emergencyPendingCount} Emergency Request(s) Pending Approval
          </p>
          <p className="text-sm text-orange-700">
            These requests were submitted by security and require staff approval
          </p>
        </div>
        <Button onClick={() => setEmergencyFilter(!emergencyFilter)}>
          {emergencyFilter ? 'Show All' : 'View Emergency Requests'}
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

**Purpose:**
- Draws attention to pending emergency requests
- Only shows when there are pending emergencies
- Quick action button to filter view
- Explains the context

## Performance Optimizations

### 1. Memoization Opportunities

Consider adding `useMemo` for filtered results:

```typescript
const filtered = useMemo(() => {
  return requests.filter((r) => {
    // filter logic
  });
}, [requests, searchQuery, statusFilter, gateFilter, emergencyFilter]);
```

### 2. Debounced Search

For large datasets, debounce search input:

```typescript
const debouncedSearch = useDebounce(searchQuery, 300);

useEffect(() => {
  // Filter based on debouncedSearch
}, [debouncedSearch]);
```

### 3. Pagination

For scaling to thousands of records:

```typescript
const { data, error } = await supabase
  .from("outpass_requests")
  .select(`*`)
  .range(page * pageSize, (page + 1) * pageSize - 1)
  .order("created_at", { ascending: false });
```

## Security Considerations

### 1. Row Level Security (RLS)

Ensure RLS policies exist:

```sql
-- Security can view all outpass requests
CREATE POLICY "Security can view all outpasses"
ON outpass_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'security'
  )
);

-- Security can update gate status
CREATE POLICY "Security can update gate status"
ON outpass_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'security'
  )
)
WITH CHECK (
  -- Only gate_status and gate_verified_at can be updated
  old.student_id = new.student_id
  AND old.reason = new.reason
  AND old.destination = new.destination
);
```

### 2. Input Validation

Always validate inputs:

```typescript
if (!reason || !destination || !departureTime || !returnTime) {
  toast.error("Please fill all fields");
  return;
}

if (new Date(departureTime) >= new Date(returnTime)) {
  toast.error("Return time must be after departure time");
  return;
}
```

### 3. Authorization Checks

Verify user role before allowing actions:

```typescript
const { profile } = useAuth();

if (profile?.role !== 'security') {
  navigate('/');
  return null;
}
```

## Testing Scenarios

### Unit Tests

```typescript
describe('SecurityDashboard', () => {
  it('should filter by status correctly', () => {
    // Test filtering logic
  });

  it('should calculate emergency pending count', () => {
    // Test metrics calculation
  });

  it('should mark gate status correctly', () => {
    // Test gate action
  });
});
```

### Integration Tests

```typescript
describe('VerifyOutpassDialog', () => {
  it('should fetch and display outpass details', async () => {
    // Test full verification flow
  });

  it('should show error for invalid ID', async () => {
    // Test error handling
  });
});
```

## API Endpoints (Supabase Queries)

### Fetch All Requests
```
GET /rest/v1/outpass_requests
  ?select=*,student:profiles(*),approver:staff_members(*)
  &order=created_at.desc
```

### Verify Specific Outpass
```
GET /rest/v1/outpass_requests
  ?select=*,student:profiles(*),approver:staff_members(*)
  &id=eq.{outpass_id}
```

### Update Gate Status
```
PATCH /rest/v1/outpass_requests
  ?id=eq.{outpass_id}
Body: { gate_status: "left", gate_verified_at: "2026-02-28T10:00:00Z" }
```

### Create Emergency Request
```
POST /rest/v1/outpass_requests
Body: {
  student_id: "uuid",
  reason: "Emergency",
  destination: "Hospital",
  departure_time: "2026-02-28T10:00:00Z",
  return_time: "2026-02-28T18:00:00Z",
  requested_by_security: true
}
```

### Search Students
```
GET /rest/v1/profiles
  ?select=id,full_name,roll_number,department
  &role=eq.student
  &or=(full_name.ilike.%{query}%,roll_number.ilike.%{query}%)
  &limit=5
```

## Future Enhancements

1. **QR Code Scanning**: Integrate camera for direct QR scanning
2. **Photo Verification**: Show student photo during verification
3. **Analytics**: Track peak exit times, most common destinations
4. **Bulk Actions**: Mark multiple returns at once
5. **SMS Notifications**: Alert students when emergency request is approved
6. **Export Reports**: Download gate logs as CSV/PDF
7. **Offline Mode**: Cache data for working without internet
8. **Biometric Integration**: Fingerprint/face verification

## Troubleshooting Guide

### Common Issues

**Issue**: Real-time updates not working
- **Check**: Supabase real-time is enabled for the table
- **Check**: Channel subscription is active
- **Solution**: Verify subscription in browser console

**Issue**: Approval information not showing
- **Check**: Foreign key relationship exists
- **Check**: `.select()` includes the join
- **Solution**: Verify `approved_by` field is populated

**Issue**: Cannot update gate status
- **Check**: RLS policies allow security role to update
- **Check**: User is authenticated
- **Solution**: Review RLS policies in Supabase dashboard

## Deployment Notes

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Build Command
```bash
npm run build
```

### Database Migrations
Ensure all migrations are applied:
```bash
supabase db push
```

---

**Maintained by**: Development Team
**Last Updated**: February 28, 2026
**Version**: 2.0
