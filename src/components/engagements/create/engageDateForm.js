import React, { useRef } from "react";

export default function EngageDateForm({ value, error, onChange }) {
    const dateInputRef = useRef(null);

    return (
        <div className="col-md-4 mb-3">
            <label className="form-label">Date of Engagement</label>

            <input
                ref={dateInputRef}
                type="date"
                value={value}
                className={`form-control ${error ? "is-invalid" : ""}`}
                style={{ cursor: "pointer" }}
                onChange={(e) => onChange(e.target.value)}
                onClick={(e) => {
                    // Only call showPicker on direct user click (user gesture)
                    if (dateInputRef.current?.showPicker) {
                        try {
                            dateInputRef.current.showPicker();
                        } catch (err) {
                            // Some browsers may not support showPicker or require different handling
                            // Fallback to default browser behavior
                        }
                    }
                }}
            />

            {error && <div className="invalid-feedback">{error}</div>}
        </div>
    );
}
