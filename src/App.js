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
