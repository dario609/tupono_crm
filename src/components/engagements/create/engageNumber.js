export default function EngageNumberForm({ value, error, onChange }) {
    return (
        <div className="col-md-4 mb-3">
            <label className="form-label">Number of People in Engagement</label>
            <input
                type="number"
                name="engage_num"
                placeholder="0"
                className={`form-control ${error ? "is-invalid" : ""}`}
                value={value}
                onChange={(e) =>
                    onChange(e.target.value)
                }
            />
            {error && <div className="invalid-feedback">{error}</div>}
        </div>
    )
}