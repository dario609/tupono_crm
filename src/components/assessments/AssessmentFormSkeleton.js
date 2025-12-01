const AssessmentFormSkeleton = () => {
  return (
    <div className="card mt-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">
        <div className="skeleton skeleton-line" style={{ width: 200, height: 24 }} />
      </div>
      <div className="row card-body">
        <div className="col-12">
          <div className="row g-3">
            {/* Project field */}
            <div className="col-md-6">
              <div className="skeleton skeleton-line mb-2" style={{ width: 80, height: 16 }} />
              <div className="skeleton skeleton-line" style={{ width: "100%", height: 38 }} />
            </div>
            {/* Design Stage field */}
            <div className="col-md-6">
              <div className="skeleton skeleton-line mb-2" style={{ width: 100, height: 16 }} />
              <div className="skeleton skeleton-line" style={{ width: "100%", height: 38 }} />
            </div>
            {/* Title field */}
            <div className="col-md-6">
              <div className="skeleton skeleton-line mb-2" style={{ width: 60, height: 16 }} />
              <div className="skeleton skeleton-line" style={{ width: "100%", height: 38 }} />
            </div>
            {/* Review Date field */}
            <div className="col-md-6">
              <div className="skeleton skeleton-line mb-2" style={{ width: 100, height: 16 }} />
              <div className="skeleton skeleton-line" style={{ width: "100%", height: 38 }} />
            </div>
            {/* Participants field */}
            <div className="col-md-6">
              <div className="skeleton skeleton-line mb-2" style={{ width: 120, height: 16 }} />
              <div className="skeleton skeleton-line" style={{ width: "100%", height: 38 }} />
            </div>
            {/* Facilitating Agent field */}
            <div className="col-md-6">
              <div className="skeleton skeleton-line mb-2" style={{ width: 140, height: 16 }} />
              <div className="skeleton skeleton-line" style={{ width: "100%", height: 38 }} />
            </div>
            {/* Review Progress field */}
            <div className="col-md-6">
              <div className="skeleton skeleton-line mb-2" style={{ width: 120, height: 16 }} />
              <div className="skeleton skeleton-line" style={{ width: "100%", height: 38 }} />
            </div>
            {/* Checkbox field */}
            <div className="col-md-6">
              <div className="skeleton skeleton-line" style={{ width: 250, height: 20 }} />
            </div>
          </div>
          {/* Action buttons */}
          <div className="mt-3 d-flex gap-2">
            <div className="skeleton skeleton-line" style={{ width: 100, height: 38 }} />
            <div className="skeleton skeleton-line" style={{ width: 100, height: 38 }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentFormSkeleton;

