import {HashRouter,Route,Routes} from 'react-router-dom';
import {AuthProvider} from './contexts/AuthContext';
import {DesktopGuard} from './components/DesktopGuard';
import {ProtectedRoute} from './components/ProtectedRoute';
import {AppLayout} from './components/AppLayout';
import {LoginPage} from './pages/LoginPage';
import {DashboardPage} from './pages/DashboardPage';
import {UsersPage} from './pages/UsersPage';
import {ClassroomsPage} from './pages/ClassroomsPage';
import {RoomGroupsPage} from './pages/RoomGroupsPage';
import {SubjectsPage} from './pages/SubjectsPage';
import {AttendancePage} from './pages/AttendancePage';
import {TeachingPage} from './pages/TeachingPage';
import {WorksheetsPage} from './pages/WorksheetsPage';
import {WorksheetEditorPage} from './pages/WorksheetEditorPage';
import {MyWorksheetsPage} from './pages/MyWorksheetsPage';
import {SubmissionPage} from './pages/SubmissionPage';
import {ExamsPage} from './pages/ExamsPage';
import {GradingPage} from './pages/GradingPage';
import {ReportsPage} from './pages/ReportsPage';
import {AuditPage} from './pages/AuditPage';
import {ProfilePage} from './pages/ProfilePage';
import {PaperPage} from './pages/PaperPage';
import {NotFoundPage} from './pages/NotFoundPage';

const Staff=({children}:{children:JSX.Element})=><ProtectedRoute roles={['admin','teacher']}>{children}</ProtectedRoute>;
const Admin=({children}:{children:JSX.Element})=><ProtectedRoute roles={['admin']}>{children}</ProtectedRoute>;
const User=({children}:{children:JSX.Element})=><ProtectedRoute>{children}</ProtectedRoute>;

export default function App(){return <DesktopGuard><AuthProvider><HashRouter><Routes>
  <Route path="/login" element={<LoginPage/>}/>
  <Route element={<User><AppLayout/></User>}>
    <Route index element={<DashboardPage/>}/>
    <Route path="profile" element={<ProfilePage/>}/>
    <Route path="my-worksheets" element={<MyWorksheetsPage/>}/>
    <Route path="submit/:id" element={<SubmissionPage/>}/>
    <Route path="attendance" element={<Staff><AttendancePage/></Staff>}/>
    <Route path="teaching" element={<Staff><TeachingPage/></Staff>}/>
    <Route path="worksheets" element={<Staff><WorksheetsPage/></Staff>}/>
    <Route path="worksheets/new" element={<Staff><WorksheetEditorPage/></Staff>}/>
    <Route path="worksheets/:id" element={<Staff><WorksheetEditorPage/></Staff>}/>
    <Route path="paper/:id" element={<Staff><PaperPage/></Staff>}/>
    <Route path="exams" element={<Staff><ExamsPage/></Staff>}/>
    <Route path="grading" element={<Staff><GradingPage/></Staff>}/>
    <Route path="reports" element={<Staff><ReportsPage/></Staff>}/>
    <Route path="users" element={<Admin><UsersPage/></Admin>}/>
    <Route path="classrooms" element={<Admin><ClassroomsPage/></Admin>}/>
    <Route path="room-groups" element={<Admin><RoomGroupsPage/></Admin>}/>
    <Route path="subjects" element={<Admin><SubjectsPage/></Admin>}/>
    <Route path="audit" element={<Admin><AuditPage/></Admin>}/>
  </Route>
  <Route path="*" element={<NotFoundPage/>}/>
</Routes></HashRouter></AuthProvider></DesktopGuard>}
