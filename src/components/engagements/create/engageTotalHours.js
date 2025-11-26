import React from "react";

export default function EngageTotalHours({ value, error, onChange }) {
    return (
        <div className="col-md-4 mb-3">
            <label className="form-label">Total Hours</label>
            <input
                type="number"
                step="0.5"
                min="0"
                className={`form-control ${error ? "is-invalid" : ""}`}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder="0.0"
            />
            {error && <div className="invalid-feedback">{error}</div>}
        </div>
    );
}

