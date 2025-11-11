import React, { useEffect, useMemo, useState } from "react";
import AssessmentApi from "../../api/assessmentApi";
import ProjectsApi from "../../api/projectsApi";
import Swal from "sweetalert2";
 

const AssessmentList = () => {
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [projects, setProjects] = useState([]);
    const [filterProject, setFilterProject] = useState("");
    const [page, setPage] = useState(1);
    const [perpage, setPerpage] = useState(10);
    const [total, setTotal] = useState(0);

    const load = async (opts = {}) => {
        try {
            const json = await AssessmentApi.list({ perpage: opts.perpage ?? perpage, page: opts.page ?? page, projectId: opts.projectId ?? filterProject });
            setRows(json?.data || []);
            setTotal(json?.total || 0);
            setPage(json?.current_page || 1);
            setPerpage(json?.per_page ?? 10);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        (async () => {
            const p = await ProjectsApi.list({ perpage: -1 }).catch(() => ({ data: [] }));
            setProjects(p?.data || []);
            load({ page: 1 });
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const pagesToShow = useMemo(() => {
        const lastPage = Math.ceil(total / (perpage === -1 ? (total || 1) : perpage));
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
    }, [page, perpage, total]);

    const remove = async (r) => {
        const ask = await Swal.fire({ icon: "warning", text: "Delete this record?", showCancelButton: true });
        if (!ask.isConfirmed) return;
        setLoading(true);
        try {
            await AssessmentApi.remove(r._id);
            await load({});
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card mt-3">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">
                <h6 className="fw-semibold mb-0">All Assessments</h6>
                <div className="d-flex align-items-center gap-2 ms-auto flex-nowrap flex-sm-nowrap flex-md-nowrap flex-lg-nowrap flex-xl-nowrap flex-xxl-nowrap">
                    <select
                        className="form-select"
                        style={{ minWidth: 220 }}
                        value={filterProject}
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
                    <a
                        className="btn btn-primary btn-rounded px-4"
                        href="/assessment/add"
                        style={{ borderRadius: 20, whiteSpace: "nowrap" }}
                    >
                        Add Assessment
                    </a>
                </div>

            </div>
            <div className="row card-body pt-0">
                <div className="col-12 p-0">
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th style={{ width: "5%" }}>#</th>
                                    <th>Project</th>
                                    <th>Design Stage</th>
                                    <th>Title</th>
                                    <th>Review Date</th>
                                    <th>Participants</th>
                                    <th>Facilitating Agent</th>
                                    <th>Review State</th>
                                    <th>Finished</th>
                                    <th style={{ width: 110 }} className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <>
                                        {[...Array(5)].map((_, i) => (
                                             <tr aria-hidden="true">
                                             <td><div className="skeleton skeleton-sm" style={{ width: 28 }} /></td>
                                             <td><div className="skeleton skeleton-line" style={{ width: "80%" }} /></td>
                                             <td><div className="skeleton skeleton-sm" style={{ width: 90 }} /></td>
                                             <td><div className="skeleton skeleton-sm" style={{ width: 90 }} /></td>
                                             <td><div className="skeleton skeleton-sm" style={{ width: 70 }} /></td>
                                             <td><div className="skeleton skeleton-sm" style={{ width: 70 }} /></td>
                                             <td><div className="skeleton skeleton-line" style={{ width: "70%" }} /></td>
                                             <td><div className="skeleton skeleton-line" style={{ width: "70%" }} /></td>
                                             <td><div className="skeleton skeleton-line" style={{ width: "60%" }} /></td>
                                             <td><div className="skeleton skeleton-line" style={{ width: "60%" }} /></td>
                                           </tr>
                                        ))}
                                    </>
                                )}

                                {!loading && rows.map((r, idx) => {
                                    const sn = perpage === -1 ? idx + 1 : (page - 1) * perpage + idx + 1;
                                    return (
                                        <tr key={r._id}>
                                            <td>{sn}</td>
                                            <td>{r.project_id?.name || "-"}</td>
                                            <td>{r.design_stage}</td>
                                            <td>{r.title}</td>
                                            <td>{r.review_date ? new Date(r.review_date).toLocaleDateString() : "-"}</td>
                                            <td>{Array.isArray(r.participants) ? r.participants.map(p => p.hapu_name || p.name).filter(Boolean).join(", ") : "-"}</td>
                                            <td>{r.facilitating_agent || "-"}</td>
                                             <td>
                                                 <span
                                                     className={`badge rounded-pill ${
                                                         (r.review_state || "").toLowerCase() === "complete"
                                                             ? "bg-success"
                                                             : "bg-danger text-white"
                                                     }`}
                                                     style={{ minWidth: 88 }}
                                                 >
                                                     {(r.review_state || "").charAt(0).toUpperCase() + (r.review_state || "").slice(1)}
                                                 </span>
                                             </td>
                                             <td>
                                                 <span
                                                     className={`badge rounded-pill ${r.isFinished ? "bg-success" : "bg-secondary"}`}
                                                     style={{ minWidth: 52 }}
                                                 >
                                                     {r.isFinished ? "Complete" : "Incomplete"}
                                                 </span>
                                             </td>
                                            <td className="text-center" style={{ whiteSpace: "nowrap", padding: '3px' }}>
                                                <a className="btn badge-success btn-sm btn-rounded btn-icon me-1" title="Edit" href={`/assessment/add?id=${r._id}`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-edit-2 align-middle"><polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon></svg>
                                                </a>
                                                <button className="btn badge-danger btn-sm btn-rounded btn-icon" title="Delete" onClick={() => remove(r)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trash align-middle"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!loading && rows.length === 0 && <tr><td colSpan={10} className="py-4 text-center">No feedback found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    {total > 0 && (
                        <div className="row p-2">
                            <div className="col-sm-12 col-md-5"><p className="mb-0" style={{ fontSize: '20px' }}>Showing {rows.length} of {total} entries</p></div>
                            <div className="col-sm-12 col-md-7">
                                <div className="dataTables_paginate paging_simple_numbers">
                                    <nav aria-label="Page navigation example">
                                        <ul className="pagination justify-content-end">
                                            {pagesToShow.map((it, i) => (
                                                <li key={i} className={`page-item ${it === page ? 'active' : ''} ${it === '...' ? 'disabled' : ''}`}>
                                                    {it === '...' ? <span className="page-link">...</span> : <button className="page-link" onClick={() => (setPage(it), load({ page: it }))}>{it}</button>}
                                                </li>
                                            ))}
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

export default AssessmentList;


