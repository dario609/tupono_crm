import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { NavLink, useNavigate } from "react-router-dom";
import EngagementApi from "../../api/engagementApi";
import { SkeletonTableRow } from "../../components/common/SkelentonTableRow";



export default function EngagementTrackerPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [search, setSearch] = useState("");
    const [perpage, setPerpage] = useState(10);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const lastPage = useMemo(() => {
        if (perpage === -1) return 1;
        return Math.max(1, Math.ceil(total / perpage));
    }, [total, perpage]);

    const load = async (opts = {}) => {
        setLoading(true);
        try {
            const json = await EngagementApi.list({
                perpage: opts.perpage ?? perpage,
                page: opts.page ?? page,
                search: opts.search ?? search,
            });
            setRows(json?.data || []);
            setTotal(json?.total || 0);
            setPerpage(json?.per_page ?? 10);
            setPage(json?.current_page || 1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load({ page: 1 });
    }, []);

    const handleEdit = (id) => {
        navigate(`/engagement-tracker/${id}/edit`);
    };

    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: "Delete Engagement?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel"
        });
    
        if (!confirm.isConfirmed) return;
    
        try {
            const res = await EngagementApi.remove(id);
            if (res?.success === false) {
                throw new Error(res?.message || "Delete failed");
            }
    
            await Swal.fire({
                title: "Deleted",
                text: "Engagement removed successfully",
                icon: "success",
                timer: 1400,
                showConfirmButton: false,
            });

            setRows(rows.filter((r) => r._id !== id));
            // Reload table
            load({ page });
        } catch (err) {
            Swal.fire({
                title: "Error",
                text: err.message || "Could not delete engagement",
                icon: "error",
            });
        }
    };

    const onSearchKeyDown = (e) => {
        if (e.key === "Enter") load({ page: 1 });
    };

    // Pagination display logic
    const pagesToShow = useMemo(() => {
        const items = [];
        if (lastPage <= 1) {
            if (total > 0) items.push(1);
            return items;
        }

        const push = (n) => items.push(n);

        if (page > 3) push(1);
        if (page > 4) push("...");

        for (let i = 1; i <= lastPage; i++) {
            if (i >= page - 2 && i <= page + 2) push(i);
        }

        if (page < lastPage - 3) push("...");
        if (page < lastPage - 2) push(lastPage);

        return items;
    }, [page, lastPage, total]);

    const showingStart = total === 0 ? 0 : (perpage === -1 ? 1 : (page - 1) * perpage + 1);
    const showingEnd = perpage === -1 ? total : Math.min(page * perpage, total);

    return (

        <div className="card mt-3">
            <style>{`
            .table td, .table th {
                padding: 10px 15px !important;
                vertical-align: middle !important;
            }
            `}</style>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">
                <h6 className="fw-semibold mb-0" style={{ fontSize: "20px" }}>
                    Engagements Tracker
                </h6>

                <NavLink to="/engagement-tracker/create" className="btn btn-primary btn-rounded btn-fw">
                    <i className="mdi mdi-plus-circle-outline"></i> Add Engagement
                </NavLink>
            </div>

            {/* Table Controls */}
            <div className="row card-body pt-0">
                <div className="col-12 p-0">

                    <div className="d-flex align-items-center justify-content-between p-2">
                        <div className="d-flex align-items-center">
                            <label className="mb-0 me-2">Show</label>
                            <select
                                className="form-control w-auto me-2"
                                value={perpage}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value, 10);
                                    setPerpage(v);
                                    load({ perpage: v, page: 1 });
                                }}
                            >
                                <option value={-1}>All</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span>entries</span>
                        </div>

                        <div className="input-group" style={{ maxWidth: 360 }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={onSearchKeyDown}
                            />
                            <button className="btn btn-success btn-sm" onClick={() => load({ page: 1 })}>
                                <i className="fa fa-search"></i>
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th style={{ width: "5%" }}>SN</th>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Purpose</th>
                                    <th>People</th>
                                    <th>Hapū</th>
                                    <th>Project</th>
                                    <th>Outcome</th>
                                    <th>Minutes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, idx) => {
                                    const sn = perpage === -1 ? idx + 1 : (page - 1) * perpage + idx + 1;
                                    return (
                                        <tr key={r._id}>
                                            <td>{sn}</td>
                                            <td>{r.engage_date?.substring(0, 10) || "-"}</td>
                                            <td>{r.engage_type || "-"}</td>
                                            <td>{r.purpose || "-"}</td>
                                            <td>{r.engage_num || "-"}</td>
                                            <td>{r.hapus.map((h) => h.name).join(", ") || "-"}</td>
                                            <td>{r.project?.name || "-"}</td>
                                            <td style={{ maxWidth: 250 }}>{r.outcome}</td>
                                            <td>
                                                {/* EDIT */}
                                                <button
                                                    className="btn badge-success btn-sm btn-rounded btn-icon"
                                                    style={{ marginRight: 5 }}
                                                    title="Edit"
                                                    onClick={() => handleEdit(r._id)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                        viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                                        className="feather feather-edit-2 align-middle">
                                                        <polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon>
                                                    </svg>
                                                </button>

                                                {/* DELETE */}
                                                <button
                                                    className="btn badge-danger btn-sm btn-rounded btn-icon"
                                                    title="Delete"
                                                    onClick={() => handleDelete(r._id)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                        viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                                        className="feather feather-trash align-middle">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
                                                        </path>
                                                    </svg>
                                                </button>
                                            </td>

                                        </tr>
                                    );
                                })}

                                {rows.length === 0 &&
                                    (loading ? (
                                        <SkeletonTableRow rows={5} cols={9} />
                                    ) : (
                                        <tr>
                                            <td colSpan={9} className="text-center py-4">
                                                No Engagements found
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {total > 0 && (
                        <div className="row p-2">
                            <div className="col-sm-12 col-md-5" id="DataTables_Table_0_info">
                                <p>Showing {showingStart} to {showingEnd} of {total} entries</p>
                            </div>

                            <div className="col-sm-12 col-md-7">
                                <div className="dataTables_paginate paging_simple_numbers">
                                    <nav>
                                        <ul className="pagination justify-content-end">
                                            <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => {
                                                        if (page > 1) load({ page: page - 1 });
                                                    }}
                                                >
                                                    <i className="fa fa-angle-left"></i>
                                                </button>
                                            </li>

                                            {pagesToShow.map((pg, i) => (
                                                <li
                                                    key={i}
                                                    className={`page-item ${pg === page ? "active" : ""} ${pg === "..." ? "disabled" : ""}`}
                                                >
                                                    {pg === "..." ? (
                                                        <span className="page-link">…</span>
                                                    ) : (
                                                        <button
                                                            className="page-link"
                                                            onClick={() => load({ page: pg })}
                                                        >
                                                            {pg}
                                                        </button>
                                                    )}
                                                </li>
                                            ))}

                                            <li className={`page-item ${page >= lastPage ? "disabled" : ""}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => {
                                                        if (page < lastPage) load({ page: page + 1 });
                                                    }}
                                                >
                                                    <i className="fa fa-angle-right"></i>
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
}
