export default function EngageProjectForm({ value, error, onChange, projects = [] }) {
    return (
        <div className="col-md-4 mb-3">
            <label className="form-label">Allocated Project</label>
            <select
                className={`form-control ${error ? "is-invalid" : ""}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="">Select Project</option>
                {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                        {p.name}
                    </option>
                ))}
            </select>
            {error && <div className="invalid-feedback">{error}</div>}
        </div>
    );
}