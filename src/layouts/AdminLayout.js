import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthProvider";
import ChatApi from "../api/chatApi";
import { getSocket } from "../utils/socket";

import "../assets/css/admin_layout.css"; // <-- we'll move your inline CSS here

const AdminLayout = ({ children }) => {
  const { user, permissions, loading } = useAuth();
  const [supportUnread, setSupportUnread] = React.useState(0);

  // Load global unread badge and keep it fresh
  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      const res = await ChatApi.unreadCount().catch(() => ({ count: 0 }));
      if (!cancelled) setSupportUnread(res?.count || 0);
    };
    load();
    const id = setInterval(load, 15000);
    // Also update on incoming messages
    const s = getSocket();
    const handler = () => load();
    s.on("chat:new-message", handler);
    s.on("chat:badge-update", handler);
    // Also allow manual refresh from any component
    const onManual = () => load();
    window.addEventListener("supportBadge:refresh", onManual);
    return () => { cancelled = true; clearInterval(id); s.off("chat:new-message", handler); s.off("chat:badge-update", handler); window.removeEventListener("supportBadge:refresh", onManual); };
  }, [user]);

  return (
    <div className="container-scroller with-welcome-text">
      <div className="loader-overlay" style={{ display: loading ? "flex" : "none" }}>
        <div className="loader"></div>
      </div>
      <Header />
      <div className="container-fluid page-body-wrapper">
        <Sidebar user={user} permissions={permissions} supportBadge={supportUnread} />
        <div className="main-panel">
          <div className="content-wrapper pt-0">{children ?? <Outlet />}</div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
