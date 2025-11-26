import React from "react";

export default function EngageMinutesForm({ value, error, onChange }) {
    const fileInputRef = React.useRef(null);
    
    // Reset file input when form is reset (value becomes null)
    React.useEffect(() => {
        if (!value && fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [value]);
    
    return (
        <div className="col-12 mb-3">
            <label className="form-label">Attach Meeting Minutes</label>
            <input
                ref={fileInputRef}
                type="file"
                className={`form-control ${error ? "is-invalid" : ""}`}
                onChange={(e) => onChange(e.target.files[0] || null)}
            />
            {error && <div className="invalid-feedback">{error}</div>}
        </div>
    )
}