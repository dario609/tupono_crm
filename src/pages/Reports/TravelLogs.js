import React, { useEffect, useState, useRef, useCallback } from "react";
import Swal from "sweetalert2";
import { NavLink, useParams } from "react-router-dom";
import ReportsApi from "../../api/reportsApi";
import debounce from "lodash.debounce";

const initialFormData = {
  travel_date: "",
  travel_from: "",
  travel_to: "",
  total_km: "",
  reason: "",
};

const ReportTravelLogsPage = () => {
  const { reportId } = useParams();
  const [form, setForm] = useState(initialFormData);
  const [editId, setEditId] = useState(null);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [report, setReport] = useState({});
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef(null);

  // Generic error handler
  const showError = useCallback(
    (msg) => Swal.fire("Error", msg || "Something went wrong.", "error"),
    []
  );

  // Fetch report info + travel logs in parallel
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (controllerRef.current) controllerRef.current.abort();
      controllerRef.current = new AbortController();

      const [reportRes, logsRes] = await Promise.all([
        ReportsApi.getById(reportId, { signal: controllerRef.current.signal }),
        ReportsApi.travelLogs(reportId, { page, perpage: perPage, search }),
      ]);

      setReport(reportRes.data);
      setRows(logsRes.data || []);
      setTotal(logsRes.total || 0);
    } catch (err) {
      if (err.name !== "AbortError") showError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [reportId, page, perPage, search, showError]);

  // Debounced search
  const handleSearch = useCallback(
    debounce((val) => {
      setSearch(val);
      setPage(1);
    }, 500),
    []
  );

  useEffect(() => {
    fetchData();
    return () => controllerRef.current?.abort();
  }, [fetchData]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Submit add/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, report_id: reportId };

      if (editId) {
        await ReportsApi.updateTravelLog(editId, payload);
        await Swal.fire("Updated!", "Travel log updated successfully", "success");
      } else {
        await ReportsApi.createTravelLog(payload);
        await Swal.fire("Success!", "Travel log added successfully", "success");
      }

      setForm(initialFormData);
      setEditId(null);
      await fetchData();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      showError(err.response?.data?.message);
    }
  };

  // Edit record
  const handleEdit = (row) => {
    setEditId(row._id);
    setForm({
      travel_date: new Date(row.travel_date).toISOString().slice(0, 10),
      travel_from: row.travel_from,
      travel_to: row.travel_to,
      total_km: row.total_km,
      reason: row.reason,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete record
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete this log?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });
    if (!confirm.isConfirmed) return;

    try {
      await ReportsApi.deleteTravelLog(id);
      await Swal.fire("Deleted!", "Travel log deleted successfully", "success");
      await fetchData();
    } catch (err) {
      showError("Failed to delete travel log");
    }
  };

  // Pagination
  const handlePageChange = (nextPage) => {
    if (nextPage < 1) return;
    setPage(nextPage);
  };

  // Reset form
  const handleReset = () => {
    setForm(initialFormData);
    setEditId(null);
    document.querySelector("[name='travel_date']")?.focus();
  };

  return (
    <div className="card mt-3">
      <style>{`
        .table thead th {
          background:#0e2b61; color:#fff; font-weight:500; position:sticky; top:0;
        }
        .btn-rounded { border-radius: 2px; }
        .pagination .page-item.active .page-link {
          background:#0e2b61; border:none;
        }
        .spinner {
          width: 2rem; height: 2rem; border: 3px solid #ccc;
          border-top-color: #0e2b61; border-radius: 50%; animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .action-btn {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          color: #fff;
          border: none;
          transition: all 0.2s ease;
        }
        .edit-btn { background-color: #2043e0; }
        .edit-btn:hover { background-color: #1632ad; }
        .delete-btn { background-color: #ff4b4b; }
        .delete-btn:hover { background-color: #d73737; }

        .table td, .table th {
          vertical-align: middle !important;
          text-align: center;
        }
        .table th:last-child {
          width: 120px;
          text-align: center;
        }
        .table-responsive { overflow-x: auto; scrollbar-width: thin; }

        @media (max-width: 768px) {
          .action-btn { width: 30px; height: 30px; }
        }
      `}</style>

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 p-3">
        <h6 className="fw-semibold mb-0">
          Travel Logs ({report.project_title || "..."})
        </h6>
        <NavLink to="/projects" className="btn btn-primary btn-rounded">
          <i className="ti ti-arrow-circle-left ms-1"></i> Back
        </NavLink>
      </div>

      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-3">
              <label>Travel Date *</label>
              <input
                type="date"
                name="travel_date"
                value={form.travel_date}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-3">
              <label>Travel From *</label>
              <input
                type="text"
                name="travel_from"
                value={form.travel_from}
                onChange={handleChange}
                className="form-control"
                placeholder="Travel From"
                required
              />
            </div>
            <div className="col-md-3">
              <label>Travel To *</label>
              <input
                type="text"
                name="travel_to"
                value={form.travel_to}
                onChange={handleChange}
                className="form-control"
                placeholder="Travel To"
                required
              />
            </div>
            <div className="col-md-3">
              <label>Total KM *</label>
              <input
                type="number"
                name="total_km"
                value={form.total_km}
                onChange={handleChange}
                className="form-control"
                placeholder="Total KM"
                required
                min="1"
              />
            </div>
            <div className="col-12">
              <label>Reason *</label>
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                className="form-control"
                rows={3}
                placeholder="Reason"
                required
              />
            </div>
            <div className="col-12 text-center mt-3">
              <button
                type="button"
                className="btn btn-danger btn-rounded me-2"
                onClick={handleReset}
              >
                Reset
              </button>
              <button type="submit" className="btn btn-primary btn-rounded">
                {editId ? "Update Travel Log" : "Add Travel Log"}
              </button>
            </div>
          </div>
        </form>

        <hr />

        {/* 🔍 Search */}
        <div className="mb-3 w-25">
          <input
            type="text"
            placeholder="Search by location or reason..."
            className="form-control"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>SN</th>
                <th>Date</th>
                <th>From</th>
                <th>To</th>
                <th>Total KM</th>
                <th>Reason</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <div className="spinner mx-auto"></div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    No records found
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r._id}>
                    <td>{(page - 1) * perPage + i + 1}</td>
                    <td>{new Date(r.travel_date).toLocaleDateString("en-GB")}</td>
                    <td>{r.travel_from}</td>
                    <td>{r.travel_to}</td>
                    <td>{r.total_km}</td>
                    <td>{r.reason}</td>
                    <td
                      className="text-center align-middle"
                      style={{ width: "120px", whiteSpace: "nowrap" }}
                    >
                      <div className="d-flex justify-content-center align-items-center gap-2">
                        <button
                          className="btn btn-sm d-flex align-items-center justify-content-center action-btn edit-btn"
                          style={{padding: '10px 5px', borderRadius: '8px'}}
                          onClick={() => handleEdit(r)}
                          title="Edit"
                        >
                          <i className="ti ti-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm d-flex align-items-center justify-content-center action-btn delete-btn"
                          onClick={() => handleDelete(r._id)}
                          style={{padding: '10px 5px', borderRadius: '8px'}}
                          title="Delete"
                        >
                          <i className="ti ti-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > perPage && (
          <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
            <p className="mb-0">
              Showing {(page - 1) * perPage + 1}–
              {Math.min(page * perPage, total)} of {total} entries
            </p>
            <div>
              <button
                className="btn btn-sm btn-light me-1"
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
              >
                ‹ Prev
              </button>
              <button
                className="btn btn-sm btn-light"
                disabled={page * perPage >= total}
                onClick={() => handlePageChange(page + 1)}
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportTravelLogsPage;
