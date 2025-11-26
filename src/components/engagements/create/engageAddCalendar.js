export default function EngageAddCalendarForm({ value, error, onChange }) {
    return (
        <div className="col-12 mb-3">
            <div className="form-check">
                <input
                    className={`form-check-input ${error ? "is-invalid" : ""}`}
                    type="checkbox"
                    id="add_to_calendar"
                    checked={value}
                    style={{ marginLeft: "5px" }}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <label className="form-check-label" style={{ padding: "7px" }} htmlFor="add_to_calendar">
                    Add to Calendar
                </label>
            </div>
            {error && <div className="invalid-feedback">{error}</div>}
        </div>
    );
}