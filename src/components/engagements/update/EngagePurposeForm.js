export default function EngagePurposeForm({ value, error, onChange }) {
    return (
        <div className="col-md-4 mb-3">
            <label className="form-label">Purpose of Engagement</label>
            <select
                className={`form-control ${error ? "is-invalid" : ""}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="">Select Purpose</option>
                <option>Monthly Hapū Hui</option>
                <option>Workshop Meeting</option>
                <option>Review Meeting</option>
                <option>Other</option>
            </select>
            {error && <div className="invalid-feedback">{error}</div>}
        </div>
    );
}