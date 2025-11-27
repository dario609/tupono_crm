import React from "react";
import AclSelectDropdown from "./AclSelectDropdown";

const AclEditModal = ({
  open,
  onClose,
  item,
  acl,
  setAcl,
  users,
  teams,
  onSave,
  loading,
}) => {
  if (!open || !item) return null;

  const handleAdd = (type, id) => {
    setAcl({
      ...acl,
      [type === "user" ? "users" : "teams"]: [
        ...acl[type === "user" ? "users" : "teams"],
        id,
      ],
    });
  };

  const handleRemove = (type, id) => {
    setAcl({
      ...acl,
      [type === "user" ? "users" : "teams"]: acl[
        type === "user" ? "users" : "teams"
      ].filter((x) => String(x) !== String(id)),
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: "min(500px,92vw)",
          borderRadius: 16,
          border: "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-body" style={{ padding: 24 }}>
          {/* Header */}
          <div className="d-flex align-items-center gap-3 mb-3">
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              }}
            >
              <i className="mdi mdi-shield-account" style={{ fontSize: 28, color: "#fff" }}></i>
            </div>

            <div style={{ flex: 1 }}>
              <h5 className="fw-bold mb-1">{`Edit Access: ${item.name}`}</h5>
              <p className="text-muted mb-0">{item.type === "folder" ? "Folder" : "File"}</p>
            </div>
          </div>

          {/* ACL Selector */}
          <div className="mb-4">
            <label
              className="form-label"
              style={{ fontWeight: 600, color: "#374151", marginBottom: 8 }}
            >
              Access Control
            </label>

            <AclSelectDropdown
              users={users}
              teams={teams}
              selectedUsers={acl.users}
              selectedTeams={acl.teams}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />

            <small className="text-muted d-block mt-2">
              Leave empty for public access.
            </small>
          </div>

          {/* Buttons */}
          <div className="d-flex justify-content-end gap-2">
            <button
              className="btn btn-light"
              disabled={loading}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="btn btn-primary"
              style={{
                background: loading
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                border: "none",
                borderRadius: 10,
                padding: "10px 20px",
                fontWeight: 600,
                boxShadow: loading ? "none" : "0 4px 12px rgba(99, 102, 241, 0.3)",
              }}
              disabled={loading}
              onClick={onSave}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AclEditModal;
