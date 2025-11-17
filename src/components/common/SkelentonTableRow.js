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

  
export { SkeletonTableRow, EditProjectSkeleton };