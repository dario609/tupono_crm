import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { rolesLabel } from "../constants";
import { permissionsInputLabel } from "../constants";

const Sidebar = ({ user, permissions, supportBadge }) => {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menuId) => {
    setOpenMenu(openMenu === menuId ? null : menuId);
  };

  const isSuperAdmin = (user?.role_id?.role_name === rolesLabel.superAdmin);
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

        {canView(permissionsInputLabel.user_management) && (
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
        {canView(permissionsInputLabel.report_management) && (
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
                {canAdd(permissionsInputLabel.report_management) && (
                  <li className="nav-item">
                    <NavLink to="/reports/add" className="nav-link">
                      <i className="bi bi-chevron-double-right"></i> Create Report
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
        {canView(permissionsInputLabel.project_management) && (
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
                {canAdd(permissionsInputLabel.project_management) && (
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

        {/* Assessment Feedback */}
        {canView(permissionsInputLabel.assessment_management) && (
          <li className="nav-item">
            <a
              href="#!"
              className="nav-link"
              onClick={() => toggleMenu("assessment")}
            >
              <i className="mdi mdi-clipboard-text-search-outline text-warning menu-icon"></i>
              <span className="menu-title">Assessment Management</span>
              <i className="menu-arrow"></i>
            </a>
            <div className={`collapse ${openMenu === "assessment" ? "show" : ""}`}>
              <ul className="nav flex-column sub-menu">
                {canAdd(permissionsInputLabel.assessment_management) && (
                  <li className="nav-item">
                    <NavLink to="/assessment/add" className="nav-link">
                      <i className="bi bi-chevron-double-right"></i> Create Assessment
                    </NavLink>
                  </li>
                )}
                <li className="nav-item">
                  <NavLink to="/assessment" className="nav-link">
                    <i className="bi bi-chevron-double-right"></i> All Assessments
                  </NavLink>
                </li>
              </ul>
            </div>
          </li>
        )}

        {/* Calendar */}
        {canView(permissionsInputLabel.calendar_management) && (
          <li className="nav-item">
            <a href="#!" className="nav-link" onClick={() => toggleMenu("calendar")}>
              <i className="mdi mdi-calendar-check-outline text-info menu-icon"></i>
              <span className="menu-title">My Calendar</span>
              <i className="menu-arrow"></i>
            </a>
            <div className={`collapse ${openMenu === "calendar" ? "show" : ""}`}>
              <ul className="nav flex-column sub-menu">
                {canAdd(permissionsInputLabel.calendar_management) && (
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
        {canView(permissionsInputLabel.document_file_management) && (
          <li className="nav-item">
            <a
              href="#!"
              className="nav-link"
              onClick={() => toggleMenu("documents")}
            >
              <i className="menu-icon text-info mdi mdi-file-document-multiple"></i>
              <span className="menu-title">Ngā Mahi</span>
              <i className="menu-arrow"></i>
            </a>
            <div
              className={`collapse ${openMenu === "documents" ? "show" : ""}`}
            >
              <ul className="nav flex-column sub-menu">
                {canAdd(permissionsInputLabel.document_file_management) && (
                  <li className="nav-item">
                    <NavLink to="/teams/create" className="nav-link">
                      <i className="bi bi-chevron-double-right"></i> Rōpu Hou
                    </NavLink>
                  </li>
                )}
                <li className="nav-item">
                  <NavLink to="/teams" className="nav-link">
                    <i className="bi bi-chevron-double-right"></i> Ngā Ropu
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/docs/rohe-hapu" className="nav-link">
                    <i className="bi bi-chevron-double-right"></i> Rohe & Hapū
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/documents" className="nav-link">
                    <i className="bi bi-chevron-double-right"></i> Ngā Kopaki
                  </NavLink>
                </li>
              </ul>
            </div>
          </li>
        )}
        {canView(permissionsInputLabel.engagement_tracker) && (
          <li className="nav-item">
            <a
              href="#!"
              className="nav-link"
              onClick={() => toggleMenu("engagement")}
            >
              <i className="menu-icon text-info mdi mdi-camera-iris"></i>
              <span className="menu-title">Engagement Tracker</span>
              <i className="menu-arrow"></i>
            </a>
            <div
              className={`collapse ${openMenu === "engagement" ? "show" : ""}`}
            >
              <ul className="nav flex-column sub-menu">
                <li className="nav-item">
                  <NavLink to="/engagement-tracker/create" className="nav-link">
                    <span className="menu-title">Create Engagement</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/engagement-tracker" className="nav-link">
                    <span className="menu-title">Engagements</span>
                  </NavLink>
                </li>
              </ul>
            </div>
          </li>)}

        {/* Support Management */}
        {canView(permissionsInputLabel.message_support_management) && (
          <li className="nav-item">
            <NavLink to="/support" className="nav-link">
              <i className="mdi mdi-message-reply-text-outline text-info menu-icon"></i>
              <span className="menu-title">Support Management</span>
              {supportBadge > 0 && (
                <span className="badge bg-primary ms-2" style={{ borderRadius: 10 }}>{supportBadge}</span>
              )}
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


      </ul>
    </nav>
  );
};

export default Sidebar;
