import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const ProjectsPage = () => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [perpage, setPerpage] = useState(10);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

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
      const res = await fetch(`http://localhost:5000/api/admin/projects?${q}`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setRows(json?.data || []);
        setTotal(json?.total || 0);
        setPage(json?.current_page || 1);
        setPerpage(json?.per_page ?? 10);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearchKeyDown = (e) => { if (e.key === "Enter") load({ page: 1 }); };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete project? This action cannot be undone. Please confirm before proceeding.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/projects/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) throw new Error(data?.message || 'Failed to delete project');
      await Swal.fire({ title: 'Deleted!', text: data?.message || 'Project deleted successfully', icon: 'success', timer: 2000, showConfirmButton: false });
      const newTotal = Math.max(0, total - 1);
      const newPage = rows.length === 1 && page > 1 ? page - 1 : page;
      setTotal(newTotal);
      await load({ page: newPage });
    } catch (err) {
      await Swal.fire({ title: 'Error!', text: err.message || 'There was an error deleting the project. Please try again', icon: 'error', timer: 3000, showConfirmButton: false });
    }
  };

  const pagesToShow = useMemo(() => {
    const items = [];
    if (lastPage <= 1) return items;
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
  
  // Table skeletons for smoother UX during fetches
  const SkeletonRow = () => (
    <tr aria-hidden="true">
      <td><div className="skeleton skeleton-sm" style={{ width: 28 }} /></td>
      <td><div className="skeleton skeleton-line" style={{ width: "80%" }} /></td>
      <td><div className="skeleton skeleton-sm" style={{ width: 90 }} /></td>
      <td><div className="skeleton skeleton-sm" style={{ width: 90 }} /></td>
      <td><div className="skeleton skeleton-sm" style={{ width: 70 }} /></td>
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

  return (
    <div className="card mt-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">
        <h6 className="fw-semibold mb-0">All Projects</h6>
        <div>
          <NavLink to="/projects/create" className="btn btn-primary btn-rounded btn-fw" style={{fontSize: '15px'}}>
            <i className="menu-icon mdi mdi-account-plus-outline"></i> Add Project
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
              <button className="btn btn.success btn-sm" onClick={() => load({ page: 1 })}>
                <i className="fa fa-search" style={{ fontSize: "large" }}></i>
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>SN</th>
                  <th>Project Name</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th style={{ width: 160, minWidth: 160 }} className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {(loading ? Array.from({ length: Math.min(10, perpage === -1 ? 10 : perpage) }) : rows).map((r, idx) => {
                  if (loading) return <SkeletonRow key={`sk-${idx}`} />;
                  const sn = perpage === -1 ? idx + 1 : (page - 1) * perpage + idx + 1;
                  const createdName = r.created_by ? `${r.created_by.first_name ?? ''} ${r.created_by.last_name ?? ''}`.trim() : '-';
                  const statusText = (() => {
                    if (typeof r.status === 'number') return r.status === 0 ? 'Active' : 'Inactive';
                    const s = (r.status || '').toString().toLowerCase();
                    if (s === '0' || s === 'active') return 'Active';
                    if (s === '1' || s === 'inactive') return 'Inactive';
                    return r.status || '-';
                  })();
                  return (
                    <tr key={r._id} id={`row-${r._id}`}>
                      <td>{sn}</td>
                      <td>
                        <NavLink to={`/projects/${r._id}/edit`} className="text-primary" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                          <span
                            title={r.name && r.name.length > 40 ? r.name : undefined}
                            data-toggle={r.name && r.name.length > 40 ? 'tooltip' : undefined}
                            data-placement={r.name && r.name.length > 40 ? 'top' : undefined}
                          >
                            {r.name?.length > 40 ? `${r.name.slice(0, 40)}...` : (r.name || '-')}
                          </span>
                        </NavLink>
                      </td>
                      <td>{r.start_date ? new Date(r.start_date).toLocaleDateString('en-GB') : ''}</td>
                      <td>{r.end_date ? new Date(r.end_date).toLocaleDateString('en-GB') : ''}</td>
                      <td>{statusText}</td>
                      <td>{createdName || '-'}</td>
                      <td className="text-center">
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                          <button
                            className="btn badge-success btn-sm btn-rounded btn-icon"
                            title="Edit"
                            onClick={() => navigate(`/projects/${r._id}/edit`)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-edit-2 align-middle">
                              <polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon>
                            </svg>
                          </button>
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
                    <td colSpan={7} className="py-4">{loading ? "Loading..." : "No Records found"}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {total > 0 && (
            <div className="row p-2">
              <div className="col-sm-12 col-md-5">
                <div className="dataTables_info" role="status" aria-live="polite">
                  <p>Showing {showingStarted} to {currentShowing} of {total} entries</p>
                </div>
              </div>
              <div className="col-sm-12 col-md-7">
                <div className="dataTables_paginate paging_simple_numbers">
                  <nav aria-label="Page navigation example">
                    <ul className="pagination justify-content-end">
                      <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                        <button className="page-link" aria-label="Previous" onClick={() => page > 1 && (setPage(page-1), load({ page: page-1 }))}>
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
                        <button className="page-link" aria-label="Next" onClick={() => page < lastPage && (setPage(page+1), load({ page: page+1 }))}>
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

export default ProjectsPage;


