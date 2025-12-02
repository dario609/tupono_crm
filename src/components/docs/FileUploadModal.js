import React, { useRef } from "react";
import AclSelectDropdown from "./AclSelectDropdown";

const FileUploadModal = ({
  open,
  onClose,
  onSubmit,
  file,
  setFile,
  acl,
  setAcl,
  users,
  teams,
  loading,
  error,
}) => {
  const fileInputRef = useRef(null);

  if (!open) return null;

  const handleAddAcl = (type, id) => {
    setAcl({
      ...acl,
      [type === "user" ? "users" : "teams"]: [
        ...acl[type === "user" ? "users" : "teams"],
        id,
      ],
    });
  };

  const handleRemoveAcl = (type, id) => {
    setAcl({
      ...acl,
      [type === "user" ? "users" : "teams"]: acl[
        type === "user" ? "users" : "teams"
      ].filter((x) => String(x) !== String(id)),
    });
  };

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
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
          width: "min(520px,92vw)",
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
                background: "linear-gradient(135deg,#10b981,#34d399)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(16,185,129,0.25)",
              }}
            >
              <i className="mdi mdi-file-upload" style={{ fontSize: 28, color: "#fff" }}></i>
            </div>

            <div style={{ flex: 1 }}>
              <h5 className="fw-bold mb-1" style={{ fontSize: 20 }}>
                Upload File
              </h5>
              <p className="mb-0 text-muted">Choose a file to upload</p>
            </div>
          </div>

          {/* Drag & Drop */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            style={{
              border: "2px dashed #e2e8f0",
              borderRadius: 14,
              padding: "30px 20px",
              textAlign: "center",
              cursor: "pointer",
              marginBottom: 20,
              background: "#f9fafb",
              transition: ".15s",
            }}
          >
            <i
              className="mdi mdi-cloud-upload-outline"
              style={{ fontSize: 40, color: "#6b7280" }}
            ></i>

            <p className="mt-3 mb-1" style={{ fontSize: 15, fontWeight: 600 }}>
              {file ? file.name : "Click or drag a file here"}
            </p>

            <small className="text-muted">
              Supported: Documents, images, videos, PDFs, archives
            </small>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={handleFileSelect}
          />

          {error && (
            <div className="text-danger mb-3" style={{ fontSize: 14 }}>
              {error}
            </div>
          )}

          {/* ACL */}
          <div className="mb-4">
            <label className="form-label fw-semibold">Access Control</label>

            <AclSelectDropdown
              users={users}
              teams={teams}
              selectedUsers={acl.users}
              selectedTeams={acl.teams}
              onAdd={handleAddAcl}
              onRemove={handleRemoveAcl}
            />

            <small className="text-muted d-block mt-2">
              Leave empty for public access.
            </small>
          </div>

          {/* Buttons */}
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button className="btn btn-light" disabled={loading} onClick={onClose}>
              Cancel
            </button>

            <button
              className="btn btn-primary"
              disabled={loading || !file}
              onClick={onSubmit}
              style={{
                background: !file
                  ? "#94a3b8"
                  : "linear-gradient(135deg,#10b981,#34d399)",
                border: "none",
                borderRadius: 10,
                padding: "10px 20px",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(16,185,129,0.25)",
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;
