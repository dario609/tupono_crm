import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./api/PrivateRoute"; 
import NotFound from "./pages/auth/NotFound";
import ForgotPassword from "./pages/auth/ForgotPassword";
import RolesPermissions from "./pages/RolesPermissions";
import UsersPage from "./pages/Users";
import CreateUser from "./pages/Users/Create";
import EditUser from "./pages/Users/Edit";
import ReportsPage from "./pages/Reports";
import WriteReport from "./pages/Reports/WriteReport";
import EditReport from "./pages/Reports/Edit";
import ProjectsPage from "./pages/Projects";
import CreateProject from "./pages/Projects/Create";
import EditProject from "./pages/Projects/Edit";
import CreateTeam from "./pages/Teams/Create";
import TeamsPage from "./pages/Teams";
import EditTeam from "./pages/Teams/Edit";
import RoheHapuPage from "./pages/Docs/RoheHapu";
import DocumentsPage from "./pages/Docs/Documents";
import CalendarPage from "./pages/Calendar";
import CalendarCreate from "./pages/Calendar/Create";
import { AuthProvider } from "./context/AuthProvider";
import AdminLayout from "./layouts/AdminLayout";
import './App.css';

function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Route */}
        <Route element={<PrivateRoute />}>
          <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/roles-permissions" element={<RolesPermissions />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/create" element={<CreateUser />} />
            <Route path="/users/:id/edit" element={<EditUser />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/add" element={<WriteReport />} />
            <Route path="/reports/:id/edit" element={<EditReport />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/create" element={<CreateProject />} />
            <Route path="/projects/:id/edit" element={<EditProject />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/create" element={<CreateTeam />} />
            <Route path="/teams/:id/edit" element={<EditTeam />} />
            <Route path="/docs/rohe-hapu" element={<RoheHapuPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/calendar/create" element={<CalendarCreate />} />
          </Route>
        </Route>

        {/* 404 Fallback Route */}
         <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
