import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthProvider";

import "../assets/css/admin_layout.css"; // <-- we'll move your inline CSS here

const AdminLayout = ({ children }) => {
  const { user, permissions, loading } = useAuth();

  return (
    <div className="container-scroller with-welcome-text">
      <div className="loader-overlay" style={{ display: loading ? "block" : "none" }}>
        <div className="loader"></div>
      </div>
      <Header />
      <div className="container-fluid page-body-wrapper">
        <Sidebar user={user} permissions={permissions} />
        <div className="main-panel">
          <div className="content-wrapper pt-0">{children ?? <Outlet />}</div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
