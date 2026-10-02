# Backend Status — CLEAN V1.4

Build: `CLEAN-V1.4-LEARNING-GROUP-INTEGRITY-SEM2-2569`

- Clean tables: 31 / RLS enabled: 31
- Anonymous Clean RPC executable: 0
- Subjects: 13
- Teaching units: 221
- Slides: 4,420
- Unit worksheet templates: 221
- Unit exam templates: 221
- Midterm templates: 13
- Final templates: 13
- Canonical learning groups: 6
- Active subject offerings without learning group: 0
- Student multi-learning-group conflict: 0
- Group code correction: `ทธ.11`
- Registration camera: private storage
- Student score visibility: disabled
- Attendance / QR runtime: disabled

## V1.4 integrity changes

1. Student has one canonical `learning_group_id`.
2. One learning group maps to multiple subject offerings.
3. Assigning a student to a group auto-enrolls all active subjects of that group.
4. Teacher assignment is Subject + Learning Group.
5. Teaching Digital Worksheet is scoped to the subject offering/group.
6. Teaching-flow Digital Worksheet defaults to one locked submission (`allow_resubmit=false`, `max_attempts=1`).
7. Gradebook now isolates worksheet scores by subject and supports group-scoped loading.
8. Gradebook uses the latest graded attempt per worksheet instead of averaging duplicate attempts.
9. Backup snapshot includes learning groups, offerings, teacher assignments and enrollments.
- Registration major option: `ทธ เทคโนโลยีธุรกิจดิจิทัล` (Edge Function `clean-registration-meta` v3)
