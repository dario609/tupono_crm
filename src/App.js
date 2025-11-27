import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotificationProvider } from "./context/NotificationProvider";
import { AuthProvider } from "./context/AuthProvider";

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
import SupportChat from "./pages/Support/Chat";
import CreateProject from "./pages/Projects/Create";
import EditProject from "./pages/Projects/Edit";
import AssessmentList from "./pages/Assessment";
import AddAssessment from "./pages/Assessment/Add";
import CreateTeam from "./pages/Teams/Create";
import TeamsPage from "./pages/Teams";
import EditTeam from "./pages/Teams/Edit";
import RoheHapuPage from "./pages/Docs/RoheHapu";
import DocumentsPage from "./pages/Docs/Documents";
import CalendarPage from "./pages/Calendar";
import CalendarCreate from "./pages/Calendar/Create";
import CalendarEdit from "./pages/Calendar/Edit";
import AdminLayout from "./layouts/AdminLayout";
import ProfileManagement from "./pages/Users/Profile";
import ReportReceiptsPage from "./pages/Reports/Receipts";
import ReportTravelLogsPage from "./pages/Reports/TravelLogs";
import ReportSendEmailPage from "./pages/Reports/ReportSendEmail";
import EngagementTrackerPage from "./pages/Engagement";
import EngagementTrackerCreatePage from "./pages/Engagement/create";
import EngagementTrackerEditPage from "./pages/Engagement/Edit";
import UserReport from "./pages/Users/UserReport";
import Profile from "./pages/Profile";
import NotificationsPage from "./pages/Notifications";
import './App.css';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    document.title = 'Tupono Consulting LTD';
    // Update favicon link
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = '/favicon.png';
    if (!document.querySelector("link[rel*='icon']")) {
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
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
                <Route path="/users/:id/report" element={<UserReport />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/reports/add" element={<WriteReport />} />
                <Route path="/reports/:id/edit" element={<EditReport />} />
                <Route path="/reports/:reportId/receipts" element={<ReportReceiptsPage />} />
                <Route path="/reports/:reportId/travel-logs" element={<ReportTravelLogsPage />} />
                <Route path="/reports/:reportId/send-email" element={<ReportSendEmailPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/create" element={<CreateProject />} />
                <Route path="/projects/:id/edit" element={<EditProject />} />
                <Route path="/assessment" element={<AssessmentList />} />
                <Route path="/assessment/add" element={<AddAssessment />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/teams/create" element={<CreateTeam />} />
                <Route path="/teams/:id/edit" element={<EditTeam />} />
                <Route path="/docs/rohe-hapu" element={<RoheHapuPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/engagement-tracker" element={<EngagementTrackerPage />} />
                <Route path="/engagement-tracker/create" element={<EngagementTrackerCreatePage />} />
                <Route path="/engagement-tracker/:id/edit" element={<EngagementTrackerEditPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/calendar/create" element={<CalendarCreate />} />
                <Route path="/calendar/:id/edit" element={<CalendarEdit />} />
                <Route path="/support" element={<SupportChat />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin/notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            {/* 404 Fallback Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
