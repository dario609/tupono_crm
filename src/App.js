import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./api/PrivateRoute"; 
import NotFound from "./pages/auth/NotFound";
import ForgotPassword from "./pages/auth/ForgotPassword";
import RolesPermissions from "./pages/RolesPermissions";
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Route */}
        <Route element={<PrivateRoute />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/roles-permissions" element={<RolesPermissions />} />
        </Route>

        {/* 404 Fallback Route */}
         <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
