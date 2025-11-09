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
  const debounceRef = React.useRef(null);
  const loadingRef = React.useRef(false);

  // Load global unread badge and keep it fresh
  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const refresh = async () => {
      if (cancelled || loadingRef.current) return;
      try {
        loadingRef.current = true;
        const res = await ChatApi.unreadCount().catch(() => ({ count: 0 }));
        if (!cancelled) setSupportUnread(res?.count || 0);
      } finally {
        loadingRef.current = false;
      }
    };
    const scheduleRefresh = () => {
      if (cancelled) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(refresh, 600);
    };
    // initial load
    refresh();
    // Update only on realtime events or when tab becomes visible
    const s = getSocket();
    s.on("chat:new-message", scheduleRefresh);
    s.on("chat:badge-update", scheduleRefresh);
    const onVisibility = () => {
      if (document.visibilityState === "visible") scheduleRefresh();
    };
    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", scheduleRefresh);
    // Allow manual refresh from anywhere in app
    const onManual = () => scheduleRefresh();
    window.addEventListener("supportBadge:refresh", onManual);
    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      s.off("chat:new-message", scheduleRefresh);
      s.off("chat:badge-update", scheduleRefresh);
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", scheduleRefresh);
      window.removeEventListener("supportBadge:refresh", onManual);
    };
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
