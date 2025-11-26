export default function EngageOutcomeForm({ value, error, onChange }) {
    return (
        <div className="col-12 mb-3">
            <label className="form-label">Outcome of Meeting / Engagement</label>
            <textarea
                className={`form-control ${error ? "is-invalid" : ""}`}
                rows="4"
                placeholder="Describe the outcome..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
            ></textarea>
            {error && <div className="invalid-feedback">{error}</div>}
        </div>
    )
}