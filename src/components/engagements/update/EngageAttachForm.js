export default function EngageAttachForm({ value, error, onChange, onDownloadTemplate, originalFile }) {
    return (
        <div className="col-12 mb-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
                <label className="form-label mb-0">Replace Meeting Minutes</label>
                <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    style={{ background: "#1f3fde" }}
                    onClick={onDownloadTemplate}
                >
                    <i className="mdi mdi-download me-1"></i>
                    Download Template
                </button>
            </div>
            <input
                type="file"
                className={`form-control ${error ? "is-invalid" : ""}`}
                onChange={(e) => onChange(e.target.files[0] || null)}
            />
            {error && (
                <div className="invalid-feedback">{error}</div>
            )}
            {originalFile && typeof originalFile === 'string' && (
                <div className="mt-2">
                    <small className="text-muted">Current file: </small>
                    <span style={{ color: "#667eea", fontWeight: 500 }}>
                        {originalFile.includes('/') ? originalFile.split('/').pop() : originalFile}
                    </span>
                </div>
            )}
            {value && value instanceof File && (
                <div className="mt-2">
                    <small className="text-muted">New file selected: </small>
                    <span style={{ color: "#667eea", fontWeight: 500 }}>
                        {value.name}
                    </span>
                </div>
            )}
        </div>
    );
}