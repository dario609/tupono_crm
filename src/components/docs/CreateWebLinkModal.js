import React from "react";
import AclSelectDropdown from "./AclSelectDropdown";

const CreateWebLinkModal = ({
  open,
  onClose,
  onSubmit,
  data,
  setData,
  users,
  teams,
  acl,
  setAcl,
  loading,
  error,
}) => {
  if (!open) return null;
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
          <h5 className="fw-bold mb-3">Add Web Link</h5>

          <div className="mb-3">
            <label className="form-label fw-semibold">Link Name</label>
            <input
              className="form-control"
              value={data.name}
              onChange={(e) => {
                setData({ ...data, name: e.target.value });
              }}
              autoFocus
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">URL</label>
            <input
              className="form-control"
              type="url"
              value={data.url}
              onChange={(e) => {
                setData({ ...data, url: e.target.value });
              }}
            />
          </div>

          {/* Access Control */}
          <div className="mb-4">
            <label className="form-label fw-semibold">Access Control</label>
            <AclSelectDropdown
              users={users}
              teams={teams}
              selectedUsers={acl.users}
              selectedTeams={acl.teams}
              onAdd={(type, id) => {
                setAcl({
                  ...acl,
                  [type === "user" ? "users" : "teams"]: [
                    ...acl[type === "user" ? "users" : "teams"],
                    id,
                  ],
                });
              }}
              onRemove={(type, id) => {
                setAcl({
                  ...acl,
                  [type === "user" ? "users" : "teams"]: acl[
                    type === "user" ? "users" : "teams"
                  ].filter((x) => String(x) !== String(id)),
                });
              }}
            />
          </div>

          {error && <div className="text-danger mb-2">{error}</div>}

          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-light" onClick={onClose}>
              Cancel
            </button>

            <button
              className="btn btn-primary"
              disabled={loading || !data.name || !data.url}
              onClick={onSubmit}
            >
              {loading ? "Creating..." : "Create Link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateWebLinkModal;
