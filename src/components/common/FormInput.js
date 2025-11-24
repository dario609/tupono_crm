export const FormInput = ({ label, error, ...props }) => (
    <div className="col-md-4 mb-3">
        <label className="form-label">{label}</label>
        <input {...props} className={`form-control ${error ? "is-invalid" : ""}`} />
        {error && <div className="invalid-feedback">{error}</div>}
    </div>
);
