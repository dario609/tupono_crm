import React from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationProvider";
import { useAuth } from "../context/AuthProvider";

export default function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    markOneRead,
    markAllRead,
    pushNotification,
    removeNotification,
  } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  const safeNotifications = Array.isArray(notifications)
  ? notifications.filter(n => n && n._id) // remove null, undefined, objects without _id
  : [];

  const handleViewAll = () => {
    navigate("/admin/notifications");
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
        {unreadCount > 0 && <span className="count"></span>}
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
          <p className="mb-0 fw-medium" style={{ fontSize: '15px' }}>
            You have {unreadCount || 0} new notification
            {unreadCount === 1 ? "" : "s"}
          </p>
          <span className="badge bg-primary rounded-pill">View all</span>
        </div>
        {Array.isArray(safeNotifications) && safeNotifications.length > 0 ? (
          safeNotifications
            .filter((n) => n && typeof n === "object") // safety guard
            .map((notify) => (
              <React.Fragment key={notify?.['_id'] || Math.random()}>
                {/* If current user created this notification */}
                {notify.created_by === user?._id && (
                  <>
                    <div className="dropdown-divider"></div>
                    <h6 className="dropdown-header text-uppercase text-muted">
                      You Sent This Notification
                    </h6>
                  </>
                )}

                <a
                  className="dropdown-item preview-item py-3 notification-item d-flex align-items-start"
                  onClick={() => {
                    if (notify?._id) {
                      markOneRead(notify._id);
                      removeNotification(notify._id);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="preview-thumbnail me-3">
                    <i className="mdi mdi-send text-primary fs-4"></i>
                  </div>

                  <div className="preview-item-content flex-grow-1">
                    <h6 className="preview-subject fw-normal text-dark mb-1">
                      {notify.title || "Untitled Notification"}
                    </h6>

                    <p className="fw-light small-text mb-0 text-wrap text-break">
                      {notify.body}
                    </p>

                    <p className="fw-light small-text text-muted mb-0">
                      {notify.created_at
                        ? moment(notify.created_at).fromNow()
                        : ""}
                    </p>
                  </div>
                </a>
              </React.Fragment>
            ))
        ) : (
          <a
            className="dropdown-item preview-item py-3 text-center text-muted"
            onClick={handleViewAll}
          >
            <i className="mdi mdi-bell-off-outline me-2"></i>
            No new notifications
          </a>
        )}


        {/* --- Divider for Admin Notifications ---
        {notifications.length > 0 && (
          <>
            <div className="dropdown-divider"></div>
            <h6 className="dropdown-header text-uppercase text-muted">
              Your Sent Notifications
            </h6>

            {notifications.map((note) => (
              <a
                key={note._id}
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
                      ? `${note.created_by.first_name} ${note.created_by.last_name}`
                      : ""})
                  </p>
                  <p className="fw-light small-text text-muted mb-0">
                    {moment(note.createdAt).fromNow()}
                  </p>
                </div>
              </a>
            ))}
          </>
        )} */}
      </div>
    </li>
  );
}
