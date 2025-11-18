import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import ReportsApi from "../../api/reportsApi";

const ReportsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [perpage, setPerpage] = useState(10);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const lastPage = useMemo(() => {
    if (perpage === -1) return 1;
    return Math.max(1, Math.ceil(total / (perpage || 10)));
  }, [total, perpage]);

  const load = async (opts = {}) => {
    const q = new URLSearchParams({
      perpage: String(opts.perpage ?? perpage),
      page: String(opts.page ?? page),
      search: String(opts.search ?? search),
    }).toString();
    setLoading(true);
    try {
      const json = await ReportsApi.list({ perpage: opts.perpage ?? perpage, page: opts.page ?? page, search: opts.search ?? search });
      setRows(json?.data || []);
      setTotal(json?.total || 0);
      setPage(json?.current_page || 1);
      setPerpage(json?.per_page ?? 10);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearchKeyDown = (e) => {
    if (e.key === "Enter") load({ page: 1 });
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this report? This action cannot be undone. Please confirm before proceeding.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if (!confirm.isConfirmed) return;
    try {
      const data = await ReportsApi.remove(id);
      if (data?.success === false) throw new Error(data?.message || 'Failed to delete report');
      await Swal.fire({ title: 'Deleted!', text: data?.message || 'Report deleted successfully', icon: 'success', timer: 2000, showConfirmButton: false });
      const newTotal = Math.max(0, total - 1);
      const newPage = rows.length === 1 && page > 1 ? page - 1 : page;
      setTotal(newTotal);
      await load({ page: newPage });
    } catch (err) {
      await Swal.fire({ title: 'Error!', text: err.message || 'There was an error deleting the report. Please try again', icon: 'error', timer: 3000, showConfirmButton: false });
    }
  };

  const pagesToShow = useMemo(() => {
    const items = [];
    if (lastPage <= 1) { items.push(1); return items; }
    const push = (n) => items.push(n);
    if (page > 3) push(1);
    if (page > 4) push("...");
    for (let j = 1; j <= lastPage; j++) {
      if (j >= page - 2 && j <= page + 2) push(j);
    }
    if (page < lastPage - 3) push("...");
    if (page < lastPage - 2) push(lastPage);
    return items;
  }, [page, lastPage]);

  const showingStarted = total === 0 ? 0 : (perpage === -1 ? 1 : (page - 1) * perpage + 1);
  const currentShowing = perpage === -1 ? total : Math.min(page * perpage, total);
  
  const handleExportReport = (id) => {
    try {
      // Build the full PDF URL — must match your backend route
      const pdfUrl = `${process.env.REACT_APP_TUPONO_API_URL}/admin/reports/${id}/export-pdf`;
  
      // Open PDF in a new browser tab
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Failed to open PDF:", error);
      Swal.fire("Error", "Failed to open report PDF", "error");
    }
  };

  const handleEmailReport = async (id) => {
    navigate(`/reports/${id}/send-email`)
  };

  // Skeleton rows for loading state
  const SkeletonRow = () => (
    <tr aria-hidden="true">
      <td><div className="skeleton skeleton-sm" style={{ width: 28 }} /></td>
      <td><div className="skeleton skeleton-line" style={{ width: "70%" }} /></td>
      <td><div className="skeleton skeleton-line" style={{ width: "60%" }} /></td>
      <td><div className="skeleton skeleton-line" style={{ width: "70%" }} /></td>
      <td><div className="skeleton skeleton-sm" style={{ width: 60 }} /></td>
      <td><div className="skeleton skeleton-sm" style={{ width: 90 }} /></td>
      <td><div className="skeleton skeleton-sm" style={{ width: 90 }} /></td>
      <td><div className="skeleton skeleton-sm" style={{ width: 90 }} /></td>
      <td><div className="skeleton skeleton-line" style={{ width: "70%" }} /></td>
      <td><div className="skeleton skeleton-line" style={{ width: "60%" }} /></td>
      <td><div className="skeleton skeleton-sm" style={{ width: 50 }} /></td>
      <td><div className="skeleton skeleton-sm" style={{ width: 50 }} /></td>
      <td>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
        </div>
      </td>
    </tr>
  );

  return (
    <div className="card mt-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">
        <h6 className="fw-semibold mb-0">Reports Management</h6>
        <div>
          <NavLink to="/reports/add" className="btn btn-primary btn-rounded btn-fw">
            <i className="menu-icon mdi mdi-file-plus"></i> Add Report
          </NavLink>
        </div>
      </div>

      <div className="row card-body pt-0">
        <div className="col-12 p-0">
          <div className="d-flex align-items-center justify-content-between p-2">
            <div className="d-flex align-items-center">
              <label className="mb-0 me-2" htmlFor="perpage">Show</label>
              <select id="perpage" className="form-control w-auto me-2" value={perpage} onChange={(e) => { const v = parseInt(e.target.value, 10); setPerpage(v); load({ perpage: v, page: 1 }); }}>
                <option value={-1}>All</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>

            <div className="input-group" style={{ maxWidth: 360 }}>
              <input type="text" placeholder="Search" className="form-control" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={onSearchKeyDown} />
              <button className="btn btn-success btn-sm" onClick={() => load({ page: 1 })}>
                <i className="fa fa-search" style={{ fontSize: "large" }}></i>
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th style={{ width: "5%" }}>SN</th>
                  <th>Report Title</th>
                  <th>Project</th>
                  <th>Assigned To</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Report Type</th>
                  <th>Report Phase</th>
                  <th>Hours</th>
                  <th style={{ width: 120, minWidth: 200 }} className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {(loading ? Array.from({ length: Math.min(10, perpage === -1 ? 10 : perpage) }) : rows).map((r, idx) => {
                  if (loading) return <SkeletonRow key={`sk-${idx}`} />;
                  const sn = perpage === -1 ? idx + 1 : (page - 1) * perpage + idx + 1;
                  const projectName = r.project_id?.name || r.project_id?.project_title || '-';
                  const createdName = r.created_by ? `${r.created_by.first_name ?? ''} ${r.created_by.last_name ?? ''}`.trim() || r.created_by.email : '-';
                  return (
                    <tr key={r._id}>
                      <td>{sn}</td>
                      <td>{r.project_title || '-'}</td>
                      <td>{projectName}</td>
                      <td>{createdName}</td>
                      <td>{r.project_description || '-'}</td>
                      <td>{r.report_status || r.project_status || '-'}</td>
                      <td>{r.start_date ? new Date(r.start_date).toLocaleDateString('en-GB') : '-'}</td>
                      <td>{r.end_date ? new Date(r.end_date).toLocaleDateString('en-GB') : '-'}</td>            
                      <td>{r.report_type || '-'}</td>
                      <td>{r.report_phase || '-'}</td>
                      <td>{typeof r.hours === 'number' ? r.hours : (r.hours || 0)}</td>
                      <td className="actions-column">
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'nowrap' }}>

                          <button
                            className="btn badge-secondary btn-sm btn-rounded btn-icon"
                            title="Export Report (PDF)"
                            onClick={() => handleExportReport(r._id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              className="feather feather-upload-cloud align-middle">
                              <polyline points="16 16 12 12 8 16" />
                              <line x1="12" y1="12" x2="12" y2="21" />
                              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                            </svg>
                          </button>
                          <button
                            className="btn badge-info btn-sm btn-rounded btn-icon"
                            title="Email Report"
                            onClick={() => handleEmailReport(r._id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              className="feather feather-mail align-middle">
                              <path d="M4 4h16v16H4z" />
                              <polyline points="22,6 12,13 2,6" />
                            </svg>
                          </button>
                          <NavLink
                            className="btn btn-sm btn-rounded btn-icon"
                            style={{ backgroundColor: "#d63384", color: "#fff" }}
                            title="Add Receipts"
                            to={`/reports/${r._id}/receipts`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
                              stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"
                              className="feather feather-edit-2 align-middle">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="12" x2="12" y1="18" y2="12" />
                              <line x1="9" x2="15" y1="15" y2="15" />
                            </svg>
                          </NavLink>

                          {/* 5. Add Travel Logs */}
                          <NavLink
                            className="btn badge-info btn-sm btn-rounded btn-icon"
                            title="Add Travel Logs"
                            to={`/reports/${r._id}/travel-logs`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"  fill="none"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              className="feather feather-navigation align-middle">
                              <polygon points="3 11 22 2 13 21 11 13 3 11" />
                            </svg>
                          </NavLink>
                          <NavLink className="btn badge-success btn-sm btn-rounded btn-icon" title="Edit" to={`/reports/${r._id}/edit`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-edit-2 align-middle">
                              <polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon>
                            </svg>
                          </NavLink>
                          <button className="btn badge-danger btn-sm btn-rounded btn-icon" title="Delete" onClick={() => handleDelete(r._id)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trash align-middle">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && rows.length === 0 && (
                  <tr className="text-center">
                    <td colSpan={13} className="py-4">{loading ? "Loading..." : "No Records found"}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {total > 0 && (
            <div className="row p-2">
              <div className="col-sm-12 col-md-5">
                <div className="dataTables_info" id="DataTables_Table_0_info" role="status" aria-live="polite">
                  <p>Showing {showingStarted} to {currentShowing} of {total} entries</p>
                </div>
              </div>
              <div className="col-sm-12 col-md-7">
                <div className="dataTables_paginate paging_simple_numbers">
                  <nav aria-label="Page navigation example">
                    <ul className="pagination justify-content-end">
                      <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                        <button className="page-link" aria-label="Previous" onClick={() => page > 1 && (setPage(page - 1), load({ page: page - 1 }))}>
                          <i className="fa fa-angle-left left-left-ang" aria-hidden="true"></i>
                        </button>
                      </li>
                      {pagesToShow.map((it, i) => (
                        <li key={i} className={`page-item ${it === page ? 'active' : ''} ${it === '...' ? 'disabled' : ''}`}>
                          {it === '...'
                            ? <span className="page-link">...</span>
                            : <button className="page-link popto" onClick={() => (setPage(it), load({ page: it }))}>{it}</button>}
                        </li>
                      ))}
                      <li className={`page-item ${page >= lastPage ? 'disabled' : ''}`}>
                        <button className="page-link" aria-label="Next" onClick={() => page < lastPage && (setPage(page + 1), load({ page: page + 1 }))}>
                          <i className="fa fa-angle-right left-left-ang" aria-hidden="true"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;


