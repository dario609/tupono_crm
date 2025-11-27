import React from "react";
import AclSelectDropdown from "../AclSelectDropdown";

const WebLinkModal = ({
  isOpen,
  name,
  url,
  acl,
  users,
  teams,
  loading,
  errorMessage,
  onClose,
  onChangeName,
  onChangeUrl,
  onAddAcl,
  onRemoveAcl,
  onSubmit
}) => {
  if (!isOpen) return null;

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
        backdropFilter: "blur(4px)"
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: "min(500px, 92vw)",
          borderRadius: 16,
          boxShadow:
            "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
          border: "none"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-body" style={{ padding: "24px" }}>
          {/* Header */}
          <div className="d-flex align-items-center gap-3 mb-3">
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
              }}
            >
              <i
                className="mdi mdi-link-variant"
                style={{ fontSize: 28, color: "#fff" }}
              ></i>
            </div>

            <div style={{ flex: 1 }}>
              <h5 className="fw-bold mb-1" style={{ fontSize: 20 }}>
                Add Web Link
              </h5>
              <p className="mb-0" style={{ fontSize: 14, color: "#6b7280" }}>
                Create a shortcut to a web page
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="mb-3">
            <label className="form-label fw-bold">Link Name</label>
            <input
              className={`form-control ${errorMessage ? "is-invalid" : ""}`}
              placeholder="e.g. Project Docs"
              value={name}
              onChange={(e) => onChangeName(e.target.value)}
            />
          </div>

          {/* URL */}
          <div className="mb-3">
            <label className="form-label fw-bold">URL</label>
            <input
              type="url"
              className={`form-control ${errorMessage ? "is-invalid" : ""}`}
              placeholder="https://example.com"
              value={url}
              onChange={(e) => onChangeUrl(e.target.value)}
            />
            {!!errorMessage && (
              <div className="invalid-feedback d-block">
                {errorMessage}
              </div>
            )}
          </div>

          {/* ACL */}
          <div className="mb-4">
            <label className="form-label fw-bold">Access Control</label>
            <AclSelectDropdown
              users={users}
              teams={teams}
              selectedUsers={acl.users}
              selectedTeams={acl.teams}
              onAdd={onAddAcl}
              onRemove={onRemoveAcl}
            />
            <small className="text-muted d-block mt-2">
              Leave empty for public access.
            </small>
          </div>

          {/* Buttons */}
          <div className="d-flex justify-content-end gap-2">
            <button
              className="btn btn-sm"
              style={{
                background: "#f3f4f6",
                border: "none",
                borderRadius: 10,
                padding: "10px 20px",
                fontWeight: 600
              }}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              className="btn btn-sm text-white"
              style={{
                background: loading
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                border: "none",
                borderRadius: 10,
                padding: "10px 20px",
                fontWeight: 600,
                opacity: !name || !url ? 0.5 : 1,
                cursor: !name || !url ? "not-allowed" : "pointer"
              }}
              onClick={onSubmit}
              disabled={!name || !url || loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Creating...
                </>
              ) : (
                "Create Link"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebLinkModal;
