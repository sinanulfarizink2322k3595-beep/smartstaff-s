# Security Dashboard - User Guide

## Overview
The Security Dashboard is designed for security personnel to verify student outpasses, track gate movements, and handle emergency situations effectively.

## 🎯 Key Features

### 1. **Outpass Verification**
Security personnel can verify whether a student's outpass is approved and by which staff member.

#### How to Verify:
1. Click the **"Verify Outpass"** button in the dashboard header
2. Enter the Outpass ID (or scan QR code if available)
3. Click Search or press Enter
4. The system will display:
   - ✅ **VALID OUTPASS** - Student is authorized to exit
   - ❌ **NOT APPROVED** - Outpass not yet approved by staff
   - ⚠️ **EXPIRED** - Outpass approval has expired

#### Verification Details Shown:
- **Approval Status**: Clear visual indicator of validity
- **Staff Approver**: Name of the staff member who approved the request
- **Student Information**: Name, ID number, department
- **Destination & Reason**: Where the student is going and why
- **Time Period**: Departure and return times
- **Gate Status**: Current status (On Campus, Left, Returned)
- **QR Code**: For quick verification (shown for valid outpasses)

#### Gate Actions:
- **Mark Exit**: When a student with valid outpass leaves campus
- **Mark Return**: When a student returns to campus
- The system automatically timestamps each action

---

### 2. **Emergency Request Submission**
Security can request outpass approval on behalf of students in emergency situations.

#### Emergency Request Process:
1. Click **"Emergency Request"** button
2. Search for the student by name or roll number
3. Select the student from search results
4. Fill in the emergency details:
   - **Reason**: Describe the emergency situation
   - **Destination**: Where the student needs to go
   - **Departure Time**: When the student needs to leave
   - **Return Time**: Expected return time
5. Click **"Submit for Approval"**

#### After Submission:
- Request is marked as "Emergency" in the system
- Staff receives the request for approval
- Security can track the approval status in real-time
- Emergency requests are highlighted with an orange "Emergency" badge

---

### 3. **Dashboard Overview & Stats**

The dashboard displays six key metrics:

| Metric | Description |
|--------|-------------|
| **Approved** | Total outpasses approved by staff |
| **Rejected** | Total outpasses rejected |
| **Pending** | Outpasses awaiting staff approval |
| **Left Campus** | Students currently outside campus |
| **Emergency** | Total emergency requests submitted |
| **Emergency Pending Alert** | Highlighted banner showing emergency requests awaiting approval |

---

### 4. **Advanced Filtering**

#### Available Filters:
1. **Search Bar**: Search by student name, ID number, or outpass ID
2. **Approval Status**: Filter by approved/rejected/pending
3. **Gate Status**: Filter by on_campus/left/returned
4. **Emergency Only**: Toggle to show only emergency requests

#### Quick Filter Examples:
- View all students currently off campus: Set Gate Status = "Left Campus"
- Track pending emergency requests: Click "Emergency Only" + Status = "Pending"
- Find specific student: Type name or roll number in search

---

### 5. **Real-Time Tracking**

The dashboard automatically updates in real-time when:
- Staff approves or rejects an outpass
- Emergency requests are submitted
- Students are marked as left or returned
- Any changes occur in the system

**No page refresh needed** - Updates appear instantly.

---

### 6. **Full Outpass Details View**

Click **"View"** on any request to see complete details:

#### For Approved Outpasses:
- **QR Code**: For quick verification at gate
- **Approval Card**: Prominently displays:
  - "✓ Approved by Staff Authority"
  - Staff member's name in large text
  - "Authorization verified - Student cleared for exit"
- **Student Details**: Full name, ID, department
- **Travel Details**: Destination, reason, times
- **Status Indicators**: Approval and gate status
- **Timestamps**: When approved, when gate verified

#### For Pending Outpasses:
- Yellow alert: "Awaiting Staff Approval"
- All request details visible
- Cannot mark gate actions until approved

#### For Rejected Outpasses:
- Red alert: "Request Rejected - Exit Not Authorized"
- Rejection reason (if provided)
- Student should not be allowed to exit

---

## 📋 Security Workflow Examples

### Scenario 1: Student Wants to Leave Campus
1. Student presents outpass ID or QR code
2. Security clicks "Verify Outpass"
3. Enter/scan outpass ID
4. Check:
   - Is it VALID? (Green)
   - Who approved it? (Staff name displayed)
   - Is timingcorrect? (Check departure/return times)
5. If valid:
   - Click "Mark Exit"
   - Allow student to leave
6. If not valid/expired:
   - Inform student to get fresh approval
   - Do not allow exit

### Scenario 2: Emergency Situation
1. Student needs immediate exit (medical emergency, family emergency, etc.)
2. Security clicks "Emergency Request"
3. Search and select the student
4. Fill in emergency details
5. Submit for staff approval
6. Monitor the request in dashboard (orange "Emergency" badge)
7. Once approved by staff:
   - Verify the outpass
   - Mark exit
   - Allow student to leave

### Scenario 3: Student Returns to Campus
1. Student returns and presents ID
2. Find the student's active outpass in dashboard
3. Click "View" to see details
4. Verify identity matches
5. Click "Mark Return" (if outpass shows gate_status = "left")
6. Student is marked as back on campus

### Scenario 4: Tracking Emergency Requests
1. View the Emergency Pending Alert banner (if any)
2. Click "View Emergency Requests" button in banner, OR
3. Click "Emergency Only" filter button
4. See all emergency requests and their status
5. Monitor which ones are approved/pending/rejected

---

## 🔒 Security Best Practices

### DO:
✅ Always verify outpass approval before allowing exit
✅ Check that the staff approver name is displayed
✅ Verify student identity matches the outpass
✅ Mark exits and returns promptly for accurate tracking
✅ Use emergency requests for genuine emergencies only
✅ Monitor the emergency pending alerts regularly

### DON'T:
❌ Allow exit without approved outpass
❌ Ignore expired outpasses
❌ Skip marking gate actions (exits/returns)
❌ Process emergency requests for non-urgent matters

---

## 🚨 Special Indicators

| Indicator | Meaning |
|-----------|---------|
| 🟢 Green "VALID OUTPASS" | Approved and within time - OK to exit |
| 🔴 Red "NOT APPROVED" | No staff approval - Do not allow exit |
| 🟠 Orange "EXPIRED" | Past return time - Get fresh approval |
| 🟡 Yellow "Pending" | Awaiting staff decision |
| 🟣 "Emergency" Badge | Request submitted by security |
| 🔵 Staff Approval Card | Shows who authorized the outpass |

---

## 📱 Table Columns Explained

| Column | Information |
|--------|-------------|
| **Name** | Student's full name + Emergency badge if applicable |
| **ID Number** | Student roll number |
| **Department** | Student's department |
| **Date & Time** | When the outpass request was created |
| **Status** | Approval status (Approved/Rejected/Pending) |
| **Gate Status** | Current location (On Campus/Left/Returned) |
| **Authority** | Name of staff who approved (if approved) |
| **Action** | View button to see full details |

---

## 🔄 Real-Time Features

The dashboard uses real-time subscriptions, meaning:
- Changes appear instantly without refreshing
- Multiple security personnel can work simultaneously
- All see the same updated information
- No data conflicts or delays

---

## 💡 Tips for Efficient Usage

1. **Use Search**: Instead of scrolling, type student name/ID
2. **Filter Smart**: Combine filters for specific views
   - Example: Status="Approved" + Gate="On Campus" = Ready to exit
3. **Check Authority**: Always verify which staff approved
4. **Monitor Emergencies**: Keep the emergency banner in view
5. **Mark Actions**: Don't forget to mark exits and returns
6. **View Details**: Use the View button for complete information

---

## ❓ Troubleshooting

### Problem: Outpass shows as "Not Approved"
**Solution**: Student needs to wait for staff approval. They can check with their tutor.

### Problem: Cannot mark exit/return
**Solution**: Ensure the outpass is approved and not expired. Check gate status.

### Problem: Emergency request not showing
**Solution**: Check if emergency filter is off. Refresh if needed (though real-time should work).

### Problem: Staff name shows "—"
**Solution**: Outpass may not be approved yet, or approval data is missing.

---

## 🎓 System Access

- **Role**: Security Personnel
- **Login**: Use your assigned security credentials
- **Permissions**: 
  - View all outpass requests
  - Verify outpasses
  - Mark gate actions (exit/return)
  - Submit emergency requests
  - View all student details

---

## 📞 Support

For technical issues or questions:
- Contact your system administrator
- Report bugs via the Feedback page
- Emergency: Contact IT support team

---

**Last Updated**: February 28, 2026
**Version**: 2.0
