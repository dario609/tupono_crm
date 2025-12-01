import React from "react";
import { useAssessmentList } from "../../hooks/assessments/useAssessmentList";
import AssessmentTable from "../../components/assessments/AssessmentTable";
import { Pagination } from "../../components/common/Pagination";

const AssessmentList = () => {
  const {
    loading,
    rows,
    projects,
    filterProject,
    setFilterProject,
    page,
    setPage,
    perpage,
    total,
    pagesToShow,
    load,
    remove,
    edit,
  } = useAssessmentList();

  const handlePageChange = (newPage) => {
    setPage(newPage);
    load({ page: newPage });
  };

  const lastPage = Math.ceil(total / (perpage === -1 ? total || 1 : perpage));

  return (
    <div className="card mt-3">
      <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2 p-3 bg-white">
        <h4 className="mb-0">All Assessments</h4>

        <div className="d-flex align-items-center justify-content-between gap-2">
          <select
            className="form-select"
            value={filterProject}
            style={{ minWidth: 200 }}
            onChange={(e) => {
              setFilterProject(e.target.value);
              load({ page: 1, projectId: e.target.value });
            }}
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          <a href="/assessment/add" className="btn btn-primary btn-rounded px-4">
            Create
          </a>
        </div>
      </div>

      <div className="card-body p-3">
        <div className="table-responsive">
          <AssessmentTable
            loading={loading}
            rows={rows}
            page={page}
            perpage={perpage}
            onRemove={remove}
            onEdit={edit}
          />
        </div>

        {total > 0 && (
          <div className="row mt-3">
            <div className="col-12 col-md-5 mb-2 mb-md-0">
              <p className="mb-0 fs-6">Showing {rows.length} of {total} entries</p>
            </div>

            <div className="col-12 col-md-7">
              <Pagination 
                page={page} 
                lastPage={lastPage} 
                pages={pagesToShow} 
                onPageChange={handlePageChange} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentList;
