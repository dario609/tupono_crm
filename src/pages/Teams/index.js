import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import TeamsApi from "../../api/teamsApi";

const TeamsPage = () => {
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
            const json = await TeamsApi.list({ perpage: opts.perpage ?? perpage, page: opts.page ?? page, search: opts.search ?? search });
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

    const pagesToShow = useMemo(() => {
        const items = [];
        if (lastPage <= 1) {
            if (total > 0) items.push(1);
            return items;
        }
        const push = (n) => items.push(n);
        if (page > 3) push(1);
        if (page > 4) push("...");
        for (let j = 1; j <= lastPage; j++) {
            if (j >= page - 2 && j <= page + 2) push(j);
        }
        if (page < lastPage - 3) push("...");
        if (page < lastPage - 2) push(lastPage);
        return items;
    }, [page, lastPage, total]);

    const showingStarted = total === 0 ? 0 : (perpage === -1 ? 1 : (page - 1) * perpage + 1);
    const currentShowing = perpage === -1 ? total : Math.min(page * perpage, total);

    const handleStatusToggle = async (teamId, nextChecked) => {
        const nextStatus = nextChecked ? 'active' : 'inactive';
        const confirm = await Swal.fire({
            text: 'Are you sure you want to change the status?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes',
            cancelButtonText: 'No'
        });
        if (!confirm.isConfirmed) return false;
        try {
            const data = await TeamsApi.setStatus(teamId, nextStatus);
            if (data?.success === false) throw new Error(data?.message || 'Failed to update status');
            await load({ page });
            return true;
        } catch (err) {
            await Swal.fire({ title: 'Error!', text: err.message || 'There was an error updating the status. Please try again.', icon: 'error', timer: 2500, showConfirmButton: false });
            return false;
        }
    };

    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: 'Are you sure?',
            text: 'Do you really want to delete this team? This action cannot be undone. Please confirm before proceeding.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });
        if (!confirm.isConfirmed) return;
        try {
            const data = await TeamsApi.remove(id);
            if (data?.success === false) throw new Error(data?.message || 'Failed to delete team');
            await Swal.fire({ title: 'Deleted!', text: data?.message || 'Team deleted successfully', icon: 'success', timer: 2000, showConfirmButton: false });
            const newTotal = Math.max(0, total - 1);
            const newPage = rows.length === 1 && page > 1 ? page - 1 : page;
            setTotal(newTotal);
            await load({ page: newPage });
        } catch (err) {
            await Swal.fire({ title: 'Error!', text: err.message || 'There was an error deleting. Please try again', icon: 'error', timer: 3000, showConfirmButton: false });
        }
    };

    const SkeletonRow = () => (
        <tr aria-hidden="true">
            <td><div className="skeleton skeleton-sm" style={{ width: 28 }} /></td>
            <td><div className="skeleton skeleton-line" style={{ width: "80%" }} /></td>
            <td><div className="skeleton skeleton-line" style={{ width: "70%" }} /></td>
            <td><div className="skeleton skeleton-sm" style={{ width: 90 }} /></td>
            <td><div className="skeleton skeleton-sm" style={{ width: 120 }} /></td>
        </tr>
    );

    return (
        <div className="card mt-3">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">
                <h6 className="fw-semibold mb-0">All Teams</h6>
                <div>
                    <NavLink to="/teams/create" className="btn btn-primary btn-rounded btn-fw" style={{ fontSize: '15px' }}>
                        <i className="menu-icon mdi mdi-account-plus-outline"></i> Add Team
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
                            <input type="text" placeholder="Search" className="form-control" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load({ page: 1 }); }} />
                            <button className="search-icon btn btn-success btn-sm" onClick={() => load({ page: 1 })}>
                                <i className="fa fa-search" style={{ fontSize: "large" }}></i>
                            </button>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>SN</th>
                                    <th>Name</th>
                                    <th>Assigned User</th>
                                    <th>Status</th>
                                    <th style={{ width: 120, minWidth: 120 }} className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody aria-busy={loading}>
                                {(loading ? Array.from({ length: Math.min(10, perpage === -1 ? 10 : perpage) }) : rows).map((r, idx) => {
                                    if (loading) return <SkeletonRow key={`sk-${idx}`} />;
                                    const sn = perpage === -1 ? idx + 1 : (page - 1) * perpage + idx + 1;
                                    const isActive = (r.status || '').toLowerCase() === 'active';
                                    return (
                                        <tr key={r._id} id={`row-${r._id}`}>
                                            <td>{sn}</td>
                                            <td>{r.title || '-'}</td>
                                            <td>{r.assigned_users || '-'}</td>
                                            <td>
                                                <div className="custom-switch-wrapper">
                                                    <input type="checkbox" id={`switch_status_${r._id}`} className="custom-switch-input" defaultChecked={isActive} onChange={async (e) => {
                                                        const ok = await handleStatusToggle(r._id, e.target.checked);
                                                        if (!ok) e.target.checked = !e.target.checked;
                                                    }} />
                                                    <label htmlFor={`switch_status_${r._id}`} className="custom-switch-label">
                                                        <span className="switch-text on">Active</span>
                                                        <span className="switch-text off">Inactive</span>
                                                        <span className="switch-handle"></span>
                                                    </label>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    id="btn-icon"
                                                    data-toggle="tooltip"
                                                    data-placement="top"
                                                    title="Edit"
                                                    className="btn badge-success btn-sm btn-rounded btn-icon ms-2"
                                                    onClick={() => navigate(`/teams/${r._id}/edit`)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-edit-2 align-middle">
                                                        <polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon>
                                                    </svg>
                                                </button>
                                                <button className="btn btn-danger btn-sm btn-rounded btn-icon" style={{marginLeft: '5px'}} title="Delete" onClick={() => handleDelete(r._id)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trash align-middle">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!loading && rows.length === 0 && (
                                    <tr className="text-center">
                                        <td colSpan={5} className="py-4">No Records found</td>
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
                                <div className="dataTables_paginate paging_simple_numbers" id="DataTables_Table_0_paginate">
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

export default TeamsPage;


