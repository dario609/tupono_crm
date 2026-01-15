import {useEffect, useState} from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthProvider";
import NotificationsApi from "../api/notificationsApi";
import PermissionsApi from "../api/permissionsApi";
import { useLocation } from "react-router-dom";

import "../assets/css/admin_layout.css"; // <-- we'll move your inline CSS here

const AdminLayout = ({ children }) => {
  const [permissions, setPermissions] = useState({});
  const { user, loading } = useAuth();
  const location = useLocation();
  const [supportUnread, setSupportUnread] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      const notifications = await NotificationsApi.list();
      const unreadCount = notifications.data.filter((n) => !n.isRead).length;
      setSupportUnread(unreadCount);
    };
  
    fetchNotifications();

    const fetchPermissions = async () => {
      if (!user) return;
      const perms = await PermissionsApi.me();
      setPermissions(perms?.data || {});
    };

    fetchPermissions(); 
  }, [user, location.pathname]);
  

    return (
      <div className="container-scroller with-welcome-text">
        <div className="loader-overlay" style={{ display: loading ? "flex" : "none" }}>
        <div className="loader"></div>
      </div>
      <Header user={user} unreadCount={supportUnread} adminUnreadCount={0} />
      <div className="container-fluid page-body-wrapper">
        <Sidebar user={user} permissions={permissions} supportBadge={0} />
        <div className="main-panel">
          <div className="content-wrapper pt-0">{children ?? <Outlet />}</div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
