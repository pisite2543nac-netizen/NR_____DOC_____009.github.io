# TEST REPORT — CLEAN V1.4

## Backend E2E (transactional)
PASS
- one student -> one learning group
- auto-enroll 4 subjects for test group `ส.ทส.12`
- Digital Worksheet scoped to group
- submit once -> second self attempt blocked
- Gradebook subject A score isolated from subject B score
- Gradebook group scope PASS

## Acceptance
PASS
- RLS 31/31
- 13 subjects
- 6 learning groups
- all active offerings linked to a learning group
- no student approved across multiple learning groups
- 221 units / 4,420 slides / 221 unit worksheets / 221 unit exams
- anonymous Clean RPC = 0
- registration camera private
- Attendance/QR disabled

## Frontend
PASS
- Release Gate
- Admin desktop smoke
- Teacher desktop smoke
- Student desktop smoke
- Registration camera/consent layout
- Learning group page + bulk assign
- Gradebook subject/group selector
- Student mobile single-function scope
- Registration major option `ทธ เทคโนโลยีธุรกิจดิจิทัล` present in metadata/UI fallback
