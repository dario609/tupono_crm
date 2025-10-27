import React from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";

export default function NotificationDropdown({
  totalUnreadCount = 0,
  unreadNotifications = [],
  adminNotifications = [],
  userId,
}) {
  const navigate = useNavigate();

  const handleViewAll = () => {
    navigate("/admin/notifications");
  };

  const handleClick = (notification) => {
    if (notification.type === "file") navigate("/admin/documents");
    else if (notification.type === "task") navigate("/admin/tasks");
  };

  return (
    <li className="nav-item dropdown">
      <a
        className="nav-link count-indicator"
        id="notificationDropdown"
        href="#"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <i className="icon-bell"></i>
        {totalUnreadCount > 0 && <span className="count"></span>}
      </a>

      <div
        className="dropdown-menu dropdown-menu-end notifi-dropdown navbar-dropdown preview-list pb-0"
        aria-labelledby="notificationDropdown"
      >
        {/* --- Header with total unread --- */}
        <div
          className="dropdown-item py-3 border-bottom d-flex justify-content-between align-items-center"
          style={{ cursor: "pointer" }}
          onClick={handleViewAll}
        >
          <p className="mb-0 fw-medium">
            You have {totalUnreadCount || 0} new notification
            {totalUnreadCount === 1 ? "" : "s"}
          </p>
          <span className="badge bg-primary rounded-pill">View all</span>
        </div>

        {/* --- User-specific notifications --- */}
        {unreadNotifications.length > 0 ? (
          unreadNotifications.map((notify) => (
            <React.Fragment key={notify.id}>
              {notify.created_by === userId && (
                <>
                  <div className="dropdown-divider"></div>
                  <h6 className="dropdown-header text-uppercase text-muted">
                    You Sent This Notification
                  </h6>
                </>
              )}

              <a
                className="dropdown-item preview-item py-3 notification-item d-flex align-items-start"
                onClick={() => handleClick(notify)}
                style={{ cursor: "pointer" }}
              >
                <div className="preview-thumbnail me-3">
                  <i className="mdi mdi-send text-primary fs-4"></i>
                </div>
                <div className="preview-item-content flex-grow-1">
                  <h6 className="preview-subject fw-normal text-dark mb-1">
                    {notify.title}
                  </h6>
                  <p className="fw-light small-text mb-0 text-wrap text-break">
                    {notify.message?.length > 40
                      ? notify.message.slice(0, 40) + "..."
                      : notify.message}
                  </p>
                  <p className="fw-light small-text text-muted mb-0">
                    {moment(notify.created_at).fromNow()}
                  </p>
                </div>
              </a>
            </React.Fragment>
          ))
        ) : adminNotifications.length === 0 ? (
          <a
            className="dropdown-item preview-item py-3 text-center text-muted"
            onClick={handleViewAll}
          >
            <i className="mdi mdi-bell-off-outline me-2"></i> No new notifications
          </a>
        ) : null}

        {/* --- Divider for Admin Notifications --- */}
        {adminNotifications.length > 0 && (
          <>
            <div className="dropdown-divider"></div>
            <h6 className="dropdown-header text-uppercase text-muted">
              Your Sent Notifications
            </h6>

            {adminNotifications.map((note) => (
              <a
                key={note.id}
                className="dropdown-item preview-item py-3 notification-item d-flex align-items-start"
                onClick={() => handleClick(note)}
                style={{ cursor: "pointer" }}
              >
                <div className="preview-thumbnail me-3">
                  <i className="mdi mdi-send text-primary fs-4"></i>
                </div>
                <div className="preview-item-content flex-grow-1">
                  <h6 className="preview-subject fw-normal text-dark mb-1">
                    {note.title}
                  </h6>
                  <p className="fw-light small-text mb-0 text-wrap text-break">
                    {note.message?.length > 40
                      ? note.message.slice(0, 40) + "..."
                      : note.message}{" "}
                    Sent to ({note.user
                      ? `${note.user.first_name} ${note.user.last_name}`
                      : ""})
                  </p>
                  <p className="fw-light small-text text-muted mb-0">
                    {moment(note.created_at).fromNow()}
                  </p>
                </div>
              </a>
            ))}
          </>
        )}
      </div>
    </li>
  );
}
