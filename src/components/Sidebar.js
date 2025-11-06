import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const Sidebar = ({ user, permissions }) => {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menuId) => {
    setOpenMenu(openMenu === menuId ? null : menuId);
  };

  const isSuperAdmin = (user?.role_id?.role_name === "Super Admin");
  const canView = (key) => (isSuperAdmin || permissions?.[key]?.is_view === 1);
  const canAdd = (key) => (isSuperAdmin || permissions?.[key]?.is_add === 1);
  const canSeeProjects = isSuperAdmin || permissions?.["task_management"]?.is_view === 1 || !!user;

  return (
    <nav className="sidebar sidebar-offcanvas" id="sidebar">
      <ul className="nav">
        <li className="nav-item">
          <NavLink to="/admin/dashboard" className="nav-link">
            <i className="mdi text-primary mdi-home-account menu-icon"></i>
            <span className="menu-title">Dashboard</span>
          </NavLink>
        </li>

        {canView("roles_permissions") && (
          <li className="nav-item">
            <a
              href="#!"
              className="nav-link"
              onClick={() => toggleMenu("roles")}
            >
              <i className="menu-icon text-success mdi mdi-account-key"></i>
              <span className="menu-title">Roles & Permission</span>
              <i className="menu-arrow"></i>
            </a>
            <div className={`collapse ${openMenu === "roles" ? "show" : ""}`}>
              <ul className="nav flex-column sub-menu">
                <li className="nav-item">
                  <NavLink to="/admin/roles-permissions" className="nav-link">
                    <i className="bi bi-chevron-double-right"></i> Roles
                  </NavLink>
                </li>
              </ul>
            </div>
          </li>
        )} 

        {canView("user_management") && (
          <li className="nav-item">
            <a
              href="#!"
              className="nav-link"
              onClick={() => toggleMenu("users")}
            >
              <i className="menu-icon text-secondary mdi mdi-account-multiple-plus"></i>
              <span className="menu-title">Users Management</span>
              <i className="menu-arrow mdi mdi-chevron-down"></i>
            </a>
            <div className={`collapse ${openMenu === "users" ? "show" : ""}`}>
              <ul className="nav flex-column sub-menu">
                {canAdd("user_management") && (
                  <li className="nav-item">
                    <NavLink to="/users/create" className="nav-link">
                      <i className="bi bi-chevron-double-right"></i> Add User
                    </NavLink>
                  </li>
                )}
                <li className="nav-item">
                  <NavLink to="/users" className="nav-link">
                    <i className="bi bi-chevron-double-right"></i> All Users
                  </NavLink>
                </li>
              </ul>
            </div>
          </li>
        )}

        {/* Report Management */}
        {canView("project_management") && (
          <li className="nav-item">
            <a
              href="#!"
              className="nav-link"
              onClick={() => toggleMenu("reports")}
            >
              <i className="menu-icon text-danger mdi mdi-projector"></i>
              <span className="menu-title">Report Management</span>
              <i className="menu-arrow"></i>
            </a>
            <div className={`collapse ${openMenu === "reports" ? "show" : ""}`}>
              <ul className="nav flex-column sub-menu">
                {canAdd("project_management") && (
                  <li className="nav-item">
                    <NavLink to="/reports/add" className="nav-link">
                      <i className="bi bi-chevron-double-right"></i> Add Report
                    </NavLink>
                  </li>
                )}
                <li className="nav-item">
                  <NavLink to="/reports" className="nav-link">
                    <i className="bi bi-chevron-double-right"></i> All Reports
                  </NavLink>
                </li>
              </ul>
            </div>
          </li>
        )}

        {/* Project Management */}
        {canSeeProjects && (
          <li className="nav-item">
            <a
              href="#!"
              className="nav-link"
              onClick={() => toggleMenu("tasks")}
            >
              <i className="menu-icon text-warning mdi mdi-calendar-check"></i>
              <span className="menu-title">Project Management</span>
              <i className="menu-arrow"></i>
            </a>
            <div className={`collapse ${openMenu === "tasks" ? "show" : ""}`}>
              <ul className="nav flex-column sub-menu">
                {canAdd("task_management") && (
                  <li className="nav-item">
                    <NavLink to="/projects/create" className="nav-link">
                      <i className="bi bi-chevron-double-right"></i> Add Project
                    </NavLink>
                  </li>
                )}
                <li className="nav-item">
                  <NavLink to="/projects" className="nav-link">
                    <i className="bi bi-chevron-double-right"></i> All Projects
                  </NavLink>
                </li>
              </ul>
            </div>
          </li>
        )}

        {/* Calendar */}
        {canView("calendar_management") && (
          <li className="nav-item">
            <a href="#!" className="nav-link" onClick={() => toggleMenu("calendar")}>
              <i className="mdi mdi-calendar-check-outline text-info menu-icon"></i>
              <span className="menu-title">My Calendar</span>
              <i className="menu-arrow"></i>
            </a>
            <div className={`collapse ${openMenu === "calendar" ? "show" : ""}`}>
              <ul className="nav flex-column sub-menu">
              {canAdd("calendar_management") && (
                  <li className="nav-item">
                    <NavLink to="/calendar/create" className="nav-link">
                      <i className="bi bi-chevron-double-right"></i> Create Meeting
                    </NavLink>
                  </li>
                )}
                <li className="nav-item">
                  <NavLink to="/calendar" className="nav-link">
                    <i className="bi bi-chevron-double-right"></i> My Calendar
                  </NavLink>
                </li>
              </ul>
            </div>
          </li>
        )}

        {/* Document Management */}
        {canView("document_file_management") && (
          <li className="nav-item">
            <a
              href="#!"
              className="nav-link"
              onClick={() => toggleMenu("documents")}
            >
              <i className="menu-icon text-info mdi mdi-file-document-multiple"></i>
              <span className="menu-title">Document Management</span>
              <i className="menu-arrow"></i>
            </a>
            <div
              className={`collapse ${openMenu === "documents" ? "show" : ""}`}
            >
              <ul className="nav flex-column sub-menu">
                {canAdd("document_file_management") && (
                  <li className="nav-item">
                    <NavLink to="/teams/create" className="nav-link">
                      <i className="bi bi-chevron-double-right"></i> Add Team
                    </NavLink>
                  </li>
                )}
                <li className="nav-item">
                  <NavLink to="/teams" className="nav-link">
                    <i className="bi bi-chevron-double-right"></i> Teams List
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/docs/rohe-hapu" className="nav-link">
                    <i className="bi bi-chevron-double-right"></i> Rohe & Hapū
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/documents" className="nav-link">
                    <i className="bi bi-chevron-double-right"></i> Folders &
                    Documents
                  </NavLink>
                </li>
              </ul>
            </div>
          </li>
        )}

        {/* Support Management */}
        {canView("message_support_management") && (
          <li className="nav-item">
            <NavLink to="/support" className="nav-link">
              <i className="mdi mdi-message-reply-text-outline text-info menu-icon"></i>
              <span className="menu-title">Support Management</span>
            </NavLink>
          </li>
        )}

        {/* My Account */}
        <li className="nav-item">
          <a
            href="#!"
            className="nav-link"
            onClick={() => toggleMenu("account")}
          >
            <i className="menu-icon mdi mdi-cog-transfer text-success"></i>
            <span className="menu-title">My Account</span>
            <i className="menu-arrow mdi mdi-chevron-down"></i>
          </a>
          <div className={`collapse ${openMenu === "account" ? "show" : ""}`}>
            <ul className="nav flex-column sub-menu">
              <li className="nav-item">
                <NavLink to="/profile" className="nav-link">
                  <i className="bi bi-chevron-double-right"></i> Update Profile
                </NavLink>
              </li>
            </ul>
          </div>
        </li>

        {/* Activity Log (Admin only) */}
        {user?.id === 1 && (
          <li className="nav-item">
            <NavLink to="/activity-log" className="nav-link">
              <i className="menu-icon text-info mdi mdi-file-document"></i>
              <span className="menu-title">Activity Log</span>
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Sidebar;
