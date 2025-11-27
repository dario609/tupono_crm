import React from "react";

export default function EngageTotalHours({ value, error, onChange, readOnly = false }) {
    return (
        <div className="col-md-4 mb-3">
            <label className="form-label">Total Hours {readOnly}</label>
            <input
                type="number"
                step="0.01"
                min="0"
                className={`form-control ${error ? "is-invalid" : ""}`}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder="0.0"
                readOnly={readOnly}
                style={readOnly ? { cursor: "not-allowed" } : {}}
            />
            {error && <div className="invalid-feedback">{error}</div>}
        </div>
    );
}

