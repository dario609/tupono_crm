import React from "react";

const ViewWebLinkModal = ({ open, onClose, data }) => {
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
          <h5 className="fw-bold mb-1">{data?.name}</h5>
          <p className="text-muted mb-3">Web Link</p>

          <div
            className="mb-4"
            style={{
              background: "#f8fafc",
              borderRadius: 12,
              padding: 16,
              border: "1px solid #e2e8f0",
            }}
          >
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              URL
            </label>

            <div
              style={{
                wordBreak: "break-all",
                background: "#fff",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 14,
                border: "1px solid #e2e8f0",
                color: "#6366f1",
              }}
            >
              {data?.url}
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-light" onClick={onClose}>
              Close
            </button>

            <button
              className="btn btn-primary"
              onClick={() => {
                window.open(data?.url, "_blank", "noopener,noreferrer");
              }}
            >
              <i className="mdi mdi-open-in-new me-1"></i>
              Open in New Tab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewWebLinkModal;
