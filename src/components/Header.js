import React from "react";
import "../assets/css/header.css"; 
import logo from "../assets/images/logo.png";
import favicon from "../assets/images/favicon.png";
import defaultUser from "../assets/images/user.jpg";
import NotificationDropdown from "./NotificationDropdown";
import { AuthApi } from "../api/authApi";
import { useNavigate } from "react-router";
import { useNotifications } from "../context/NotificationProvider";

const Header = ({ user, adminUnreadCount = 0 }) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const toggleSidebar = () => {
    document.body.classList.toggle('sidebar-icon-only');
  }
  
  const toggleOffcanvas = () => {
    const sidebar = document.querySelector('.sidebar-offcanvas');
    if(sidebar) {
      sidebar.classList.toggle('active')
    }
  }

  const handleLogout = async () => {
    try {
      const res = await AuthApi.logout();
      sessionStorage.setItem("logoutMessage", res.msg);
      navigate("/");
    }
    catch(err) {
      console.log("Logout Failed", err)
    }
  }

  return (
    <nav className="navbar default-layout col-lg-12 col-12 p-0 fixed-top d-flex align-items-top flex-row">
      {/* Brand + Toggle */}
      <div className="text-center navbar-brand-wrapper d-flex align-items-center justify-content-start">
        <div className="me-3">
          {/* Desktop toggle */}
          <button
            className="navbar-toggler align-self-center"
            type="button"
            data-bs-toggle="minimize"
            onClick={toggleSidebar}
          >
            <span className="icon-menu"></span>
          </button>
        </div>
        <div>
          <a className="navbar-brand brand-logo" href="/dashboard">
            <img src={logo} alt="logo" />
          </a>
          <a className="navbar-brand brand-logo-mini" href="/dashboard">
            <img
              src={favicon}
              style={{ height: "45px", width: "40px" }}
              alt="logo-mini"
            />
          </a>
        </div>
      </div>

      {/* Main navbar content */}
      <div className="navbar-menu-wrapper d-flex align-items-center justify-content-center">
        {/* Centered Welcome Text */}
        <ul className="navbar-nav d-flex flex-row align-items-center">
          <li className="nav-item fw-semibold d-lg-block ms-0">
            <h5 className="welcome-text1">Nau mai ki Tupono.</h5>
          </li>
        </ul>

        {/* Right-side items */}
        <ul className="navbar-nav ms-auto">
          {/* Notifications */}
            <NotificationDropdown unreadCount={unreadCount} />

          {/* User Dropdown */}
          <li className="nav-item dropdown d-none d-lg-block user-dropdown">
            <a
              className="nav-link"
              id="UserDropdown"
              href="#"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <img
                src={user?.profile_image || defaultUser}
                className="img-xs rounded-circle"
                alt="profile"
              />
            </a>
            <div
              className="dropdown-menu dropdown-menu-right navbar-dropdown"
              aria-labelledby="UserDropdown"
            >
              <div className="dropdown-header text-center">
                <img
                  src={user?.profile_image || defaultUser}
                  className="img-md rounded-circle"
                  alt="profile"
                  style={{
                    height: "100px",
                    width: "100px",
                    objectFit: "cover",
                  }}
                />
                <p className="mb-1 mt-3 fw-semibold">
                  {user
                    ? `${user.first_name} ${user.last_name}`
                    : "Guest User"}
                </p>
                <p className="fw-light text-muted mb-0">
                  {user?.email || "guest@example.com"}
                </p>
              </div>

              <a href="/profile" className="dropdown-item">
                <i className="dropdown-item-icon mdi mdi-account-outline text-primary me-2"></i>
                My Profile
              </a>

              <a href="/support" className="dropdown-item">
                <i className="dropdown-item-icon mdi mdi-message-text-outline text-primary me-2"></i>
                Support Management
              </a>

              <a href="/change-password" className="dropdown-item">
                <i className="dropdown-item-icon mdi mdi-lock-check text-primary me-2"></i>
                Change Password
              </a>

              <a className="dropdown-item" onClick={handleLogout}>
                <i className="dropdown-item-icon mdi mdi-power text-primary me-2"></i>
                Sign Out
              </a>
            </div>
          </li>
        </ul>

        {/* Mobile toggle */}
        <button
          className="navbar-toggler navbar-toggler-right d-lg-none align-self-center"
          type="button"
          onClick={toggleOffcanvas}
        >
          <span className="mdi mdi-menu"></span>
        </button>
      </div>
    </nav>
  );
};

export default Header;
