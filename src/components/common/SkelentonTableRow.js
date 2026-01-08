const SkeletonTableRow = ({ rows, cols }) => {
  return (
    <>{Array.from({ length: rows }).map((_, i) => (
      <tr key={`sk-${i}`} aria-hidden="true">
        {Array.from({ length: cols }).map((_, j) => (
          <td key={`sk-${i}-${j}`}><div className="skeleton skeleton-line" style={{ width: "100%" }} /></td>
        ))}
      </tr>
    ))}</>
  );
};
const EditProjectSkeleton = () => {
  return (
    <section className="card mt-4">
      <div className="row card-body pt-0 mt-1">
        <div className="col-12">
          <div className="box">
            <div className="box-body p-15 pt-0">
              <div className="row p-1">

                {/* 6 inputs – same layout */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="col-md-4 mb-3">
                    <div className="skeleton skeleton-line" style={{ height: 38 }} />
                  </div>
                ))}

                {/* Description field */}
                <div className="col-md-12 mb-3">
                  <div className="skeleton skeleton-line" style={{ height: 90 }} />
                </div>

                {/* "Tasks" title */}
                <div className="col-md-12 mb-2 mt-2">
                  <div className="skeleton skeleton-line" style={{ width: 140, height: 24 }} />
                </div>

                {/* Add Task button */}
                <div className="col-md-12 mb-2">
                  <div className="skeleton skeleton-line" style={{ width: 100, height: 32, borderRadius: 20 }} />
                </div>

                {/* Tasks table header */}
                <div className="col-md-12">
                  <div className="skeleton skeleton-line mb-2" style={{ height: 40 }} />

                  {/* Table rows (5 rows by default) */}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton skeleton-line mb-2" style={{ height: 38 }} />
                  ))}
                </div>

                {/* Footer buttons */}
                <div className="col-md-12 mt-3 d-flex justify-content-end gap-2">
                  <div className="skeleton skeleton-line" style={{ width: 100, height: 38 }} />
                  <div className="skeleton skeleton-line" style={{ width: 120, height: 38 }} />
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
const ProfileSkeleton = () => {
  return (
    <section className="card mt-4">
      <div className="row card-body pt-0 mt-1">
        <div className="col-12">
          <div className="box">
            <div className="box-body p-15 pt-0">
              <div className="row p-1">
                {/* Left column: avatar card */}
                <div className="col-xl-4 col-lg-5 mb-3">
                  <div className="card text-center">
                    <div className="card-body">
                      <div className="skeleton" style={{ width: 200, height: 200, borderRadius: '50%', margin: '0 auto' }} />
                      <div style={{ height: 12 }} />
                      <div className="skeleton skeleton-line" style={{ width: 160, height: 18, margin: '10px auto' }} />
                      <div className="skeleton skeleton-line" style={{ width: 120, height: 14, margin: '6px auto' }} />
                    </div>
                  </div>
                </div>

                {/* Right column: form skeleton */}
                <div className="col-xl-8 col-lg-7">
                  <div className="card">
                    <div className="card-body">
                      <div className="skeleton skeleton-line" style={{ width: 220, height: 22, marginBottom: 16 }} />

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <div className="skeleton skeleton-line" style={{ height: 38 }} />
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="skeleton skeleton-line" style={{ height: 38 }} />
                        </div>

                        <div className="col-md-6 mb-3">
                          <div className="skeleton skeleton-line" style={{ height: 38 }} />
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="skeleton skeleton-line" style={{ height: 38 }} />
                        </div>

                        <div className="col-md-6 mb-3">
                          <div className="skeleton skeleton-line" style={{ height: 38 }} />
                        </div>

                        <div className="col-md-12 mt-3 d-flex justify-content-center">
                          <div className="skeleton skeleton-line" style={{ width: 120, height: 38, borderRadius: 20 }} />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ProjectSkeletonRow = () => {
  return (
    <tr aria-hidden="true">
      <td><div className="skeleton skeleton-sm" style={{ width: 28 }} /></td>
      <td><div className="skeleton skeleton-line" style={{ width: "80%" }} /></td>
      <td><div className="skeleton skeleton-sm" style={{ width: 90 }} /></td>
      <td><div className="skeleton skeleton-sm" style={{ width: 90 }} /></td>
      <td><div className="skeleton skeleton-sm" style={{ width: 70 }} /></td>
      <td><div className="skeleton skeleton-line" style={{ width: "70%" }} /></td>
      <td><div className="skeleton skeleton-line" style={{ width: "70%" }} /></td>
      <td><div className="skeleton skeleton-line" style={{ width: "60%" }} /></td>
      <td><div className="skeleton skeleton-line" style={{ width: "60%" }} /></td>
      <td>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
        </div>
      </td>
    </tr>
  );
};

export { SkeletonTableRow, EditProjectSkeleton, ProfileSkeleton, ProjectSkeletonRow };