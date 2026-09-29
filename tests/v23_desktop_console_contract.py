from pathlib import Path
import re,sys
root=Path(__file__).resolve().parents[1]
site=root/'site'
index=(site/'index.html').read_text(encoding='utf-8')
app=(site/'app.js').read_text(encoding='utf-8')
css=(site/'styles.css').read_text(encoding='utf-8')
errors=[]
def need(cond,msg):
    if not cond: errors.append(msg)
need((site/'index.html').exists(),'missing site/index.html')
need((site/'app.js').exists(),'missing site/app.js')
need((site/'styles.css').exists(),'missing site/styles.css')
need('serviceWorker.register' not in app,'service worker registration must be removed')
need('device-camera-runtime' not in index+app,'legacy camera runtime referenced')
need('camera-registration' not in index+app,'legacy camera registration referenced')
need('<script type="module" src="./app.js?v=23.0.0"></script>' in index,'new V23 runtime not referenced')
need('@media(max-width:767px)' in css,'desktop/tablet guard missing')
for route in ['attendance','teaching','worksheets','exams','grading','reports','users','classrooms','room-groups','subjects','my-worksheets','my-exams','profile']:
    need(route in app,f'missing route {route}')
for rpc in ['staff_attendance_sessions_v206','staff_create_attendance_session_v100','attendance_session_roster_v161','staff_set_attendance_status_v206','staff_subject_teaching_plan_v220','staff_exam_dashboard_v206','staff_create_exam_preset_v206','staff_submission_queue_v206','staff_submission_detail_v206','staff_grade_submission_v206','staff_subject_gradebook_v206','admin_room_groups_v206','admin_replace_room_group_members_v206','admin_sync_room_group_v206','staff_worksheets_v23','staff_save_worksheet_v23','staff_publish_worksheet_v23','start_exam_v194','submit_exam_attempt_v194','admin_teacher_assignments_v206','admin_set_teacher_assignment_v206','staff_grade_exam_attempt_v206']:
    need(rpc in app,f'missing RPC {rpc}')
need('https://github.com/pisite2543nac-netizen/NR_____DOC_____009.github.io.git' in (root/'00_ONE_CLICK_UPDATE_GITHUB.bat').read_text(encoding='utf-8'),'fixed GitHub repository missing')
need('set /p REPO_URL' not in (root/'00_ONE_CLICK_UPDATE_GITHUB.bat').read_text(encoding='utf-8'),'installer must not ask for repo URL')
need((root/'supabase/migrations/20260929_v22_0_fix_classroom_teacher_rls_dependency.sql').exists(),'production RLS recovery migration missing')
need((root/'supabase/migrations/20260929_v23_0_staff_worksheet_workspace.sql').exists(),'V23 staff worksheet workspace migration missing')
need('profiles\').update' not in app, 'profile page must not attempt direct RLS-blocked self update')
need('student-fields' in app and 'birth_date' in app and 'grade_level' in app and 'room_label' in app and 'department' in app and 'major' in app, 'student create form missing required backend fields')
need('@docfullnr.local' in app, 'username/student-code login normalization missing')
need('value=\"practice\"' in app and 'value=\"quiz\"' not in app, 'exam UI must use backend-supported practice kind')
need('admin_set_teacher_assignment_v206' in app, 'teacher assignment management missing')
files={p.name for p in site.iterdir() if p.is_file()}
need(files=={'index.html','styles.css','app.js'},f'deployed runtime contains unexpected files: {sorted(files)}')
if errors:
    print('V23 DESKTOP CONSOLE CONTRACT: FAIL')
    for e in errors: print(' -',e)
    sys.exit(1)
print('V23 DESKTOP CONSOLE CONTRACT: PASS')
print('runtime_files=3 mobile_runtime=removed service_worker=removed routes=13 core_rpcs=22')
