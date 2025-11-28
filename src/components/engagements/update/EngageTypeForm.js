export default function EngageTypeForm({ value, error, onChange }) {
    return (
        <div className="col-md-4 mb-3">
            <label className="form-label">Type of Engagement</label>
            <select
                className={`form-control ${error ? "is-invalid" : ""}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="">Select Engagement Type</option>
                <option>In person meeting</option>
                <option>Online meeting</option>
                <option>Telephone Call</option>
            </select>
            {error && <div className="invalid-feedback">{error}</div>}
        </div>
    );
}