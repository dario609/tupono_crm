import React, { useEffect, useMemo, useState } from "react";
import TasksApi from "../../api/tasksApi";
import ProjectsApi from "../../api/projectsApi";
import Swal from "sweetalert2";

const emptyTask = { project_id: "", assignee: "", duration: 0, task_state: "todo", difficulty: "medium", description: "" };

const AllTasks = () => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [filterProject, setFilterProject] = useState("");
  const [perpage, setPerpage] = useState(10);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyTask);
  const [initializing, setInitializing] = useState(true);

  const load = async (opts = {}) => {
      const json = await TasksApi.list({ perpage: opts.perpage ?? perpage, page: opts.page ?? page, projectId: opts.projectId ?? filterProject });
      setRows(json?.data || []);
      setTotal(json?.total || 0);
      setPage(json?.current_page || 1);
      setPerpage(json?.per_page ?? 10);
    
  };

  const loadAssignees = async (projectId) => {
    if (!projectId) { setAssignees([]); return; }
    const json = await TasksApi.assignees(projectId).catch(()=>({}));
    setAssignees(json?.data || []);
  };

  useEffect(() => {
    (async () => {
      try {
        setInitializing(true);
        // Load projects and first page of tasks in parallel
        const [p] = await Promise.all([
          ProjectsApi.list({ perpage: -1 }).catch(()=>({ data: [] })),
        ]);
        setProjects(p?.data || []);
        await load({ page: 1 });
      } finally {
        setInitializing(false);
      }
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

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyTask, project_id: filterProject || "" });
    loadAssignees(filterProject || "");
    setModalOpen(true);
  };
  const openEdit = (t) => {
    setEditing(t);
    setForm({ project_id: t.project_id?._id || t.project_id, assignee: t.assignee?._id || t.assignee, duration: t.duration || 0, task_state: t.task_state || "todo", difficulty: t.difficulty || "medium", description: t.description || "" });
    loadAssignees(t.project_id?._id || t.project_id);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.project_id || !form.assignee) {
      await Swal.fire({ icon: "error", title: "Missing", text: "Project and Assignee are required", timer: 1500, showConfirmButton: false });
      return;
    }
    const payload = { ...form, duration: Number(form.duration || 0) };
    setLoading(true);
    try {
      if (editing) {
        await TasksApi.update(editing._id, payload);
      } else {
        await TasksApi.create(payload);
      }
      setModalOpen(false);
      await load({});
      await Swal.fire({ icon: "success", title: "Saved", timer: 900, showConfirmButton: false });
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Error", text: e.message || "Server error", timer: 2000, showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  };

  const remove = async (t) => {
    const ask = await Swal.fire({ icon: "warning", text: "Delete this task?", showCancelButton: true });
    if (!ask.isConfirmed) return;
    setLoading(true);
    try {
      await TasksApi.remove(t._id);
      await load({});
    } finally {
      setLoading(false);
    }
  };

  const SkeletonRow = () => (
    <tr aria-hidden="true">
      {/* # */}<td><div className="skeleton skeleton-sm" style={{ width: 24 }} /></td>
      {/* Project */}<td><div className="skeleton skeleton-line" style={{ width: "60%" }} /></td>
      {/* Assignee */}<td><div className="skeleton skeleton-line" style={{ width: "70%" }} /></td>
      {/* Assigned By */}<td><div className="skeleton skeleton-line" style={{ width: "65%" }} /></td>
      {/* Duration (h) */}<td><div className="skeleton skeleton-sm" style={{ width: 50 }} /></td>
      {/* Duration Type */}<td><div className="skeleton skeleton-sm" style={{ width: 80 }} /></td>
      {/* State */}<td><div className="skeleton skeleton-sm" style={{ width: 60 }} /></td>
      {/* Difficulty */}<td><div className="skeleton skeleton-sm" style={{ width: 70 }} /></td>
      {/* Start */}<td><div className="skeleton skeleton-sm" style={{ width: 90 }} /></td>
      {/* End */}<td><div className="skeleton skeleton-sm" style={{ width: 90 }} /></td>
      {/* Description */}<td><div className="skeleton skeleton-line" style={{ width: "80%" }} /></td>
      {/* Actions */}<td><div className="skeleton skeleton-sm" style={{ width: 80 }} /></td>
    </tr>
  );

  if (initializing) {
    // Full skeleton card until projects + first page are ready
    return (
      <div className="card mt-3">
        <div className="p-3 d-flex align-items-center justify-content-between gap-2">
          <div className="skeleton skeleton-line" style={{ width: 160, height: 20 }} />
          <div className="d-flex align-items-center gap-2">
            <div className="skeleton skeleton-sm" style={{ width: 220, height: 36 }} />
            <div className="skeleton skeleton-sm" style={{ width: 110, height: 36 }} />
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th style={{ width: "5%" }}>#</th>
                <th style={{ width: "14%" }}>Project</th>
                <th style={{ width: "16%" }}>Assignee</th>
                <th style={{ width: "10%" }}>Assigned By</th>
                <th style={{ width: "10%" }}>Duration (h)</th>
                <th style={{ width: "10%" }}>Duration Type</th>
                <th style={{ width: "12%" }}>State</th>
                <th style={{ width: "12%" }}>Difficulty</th>
                <th style={{ width: "5%" }}>Start</th>
                <th style={{ width: "5%" }}>End</th>
                <th>Description</th>
                <th style={{ width: 120 }} className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={`init-sk-${i}`} />)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="card mt-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">
        <h6 className="fw-semibold mb-0">All Tasks</h6>
        <div className="d-flex align-items-center gap-2 flex-wrap ms-auto">
          <select
            className="form-select"
            style={{ minWidth: 220 }}
            value={filterProject}
            onChange={(e)=> {
              const v = e.target.value;
              setFilterProject(v);
              setPage(1);
              // show skeleton immediately while switching
              setRows([]);
              load({ page: 1, projectId: v });
            }}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <button className="btn btn-primary btn-rounded px-4" onClick={openCreate} style={{ borderRadius: 20, minWidth: 110 }}>
            <span className="d-none d-sm-inline">Add Task</span>
            <span className="d-inline d-sm-none">Add +</span>
          </button>
        </div>
      </div>
      <div className="row card-body pt-0">
        <div className="col-12 p-0">
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th style={{ width: "5%" }}>#</th>
                  <th style={{ width: "14%" }}>Project</th>
                  <th style={{ width: "16%" }}>Assignee</th>
                  <th style={{ width: "16%" }}>Assigned By</th>
                  <th style={{ width: "10%" }}>Duration (h)</th>
                  <th style={{ width: "12%" }}>Duration Type</th>
                  <th style={{ width: "12%" }}>State</th>
                  <th style={{ width: "12%" }}>Difficulty</th>
                  <th style={{ width: "10%" }}>Start</th>
                  <th style={{ width: "10%" }}>End</th>
                  <th>Description</th>
                  <th style={{ width: 160 }} className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {((loading && rows.length === 0) ? Array.from({ length: Math.min(10, perpage === -1 ? 10 : perpage) }) : rows).map((t, idx) => {
                  if (loading) return <SkeletonRow key={`sk-${idx}`} />;
                  const sn = perpage === -1 ? idx + 1 : (page - 1) * perpage + idx + 1;
                  const proj = t.project_id?.name || "-";
                  const ass = t.assignee ? `${t.assignee.first_name || ""} ${t.assignee.last_name || ""}`.trim() : "-";
                  const by = t.assigned_by ? `${t.assigned_by.first_name || ""} ${t.assigned_by.last_name || ""}`.trim() : "-";
                  return (
                    <tr key={t._id}>
                      <td>{sn}</td>
                      <td>{proj}</td>
                      <td>{ass}</td>
                      <td>{by}</td>
                      <td>{t.duration ?? 0}</td>
                      <td className="text-capitalize">{t.duration_type || "-"}</td>
                      <td className="text-capitalize">{t.task_state}</td>
                      <td className="text-capitalize">{t.difficulty}</td>
                      <td>{t.start_date ? new Date(t.start_date).toLocaleDateString() : "-"}</td>
                      <td>{t.end_date ? new Date(t.end_date).toLocaleDateString() : "-"}</td>
                      <td style={{ maxWidth: 420, whiteSpace: "pre-wrap" }}>{t.description || "-"}</td>
                      <td className="text-center" style={{ whiteSpace: "nowrap", overflow: "visible" }}>
                        <button className="btn badge-success btn-sm btn-rounded btn-icon me-1" title="Edit" onClick={() => openEdit(t)}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-edit-2 align-middle"><polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon></svg>
                        </button>
                        <button className="btn badge-danger btn-sm btn-rounded btn-icon" title="Delete" onClick={() => remove(t)} style={{ verticalAlign: "middle" }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trash align-middle"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!loading && rows.length === 0 && (
                  <tr className="text-center"><td colSpan={12} className="py-4">No tasks</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {total > 0 && (
            <div className="row p-2">
              <div className="col-sm-12 col-md-5"><p className="mb-0" style={{ fontSize: 12 }}>Showing {rows.length} of {total} entries</p></div>
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

      {/* subtle overlay for in-place refresh while keeping table visible */}
      {loading && rows.length > 0 && !initializing && (
       <SkeletonRow />
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,.4)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editing ? "Edit Task" : "Add Task"}</h5>
                <button className="btn-close" onClick={() => setModalOpen(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Project</label>
                    <select className="form-select" value={form.project_id} onChange={(e)=> { const v = e.target.value; setForm(f=> ({ ...f, project_id: v, assignee: "" })); loadAssignees(v); }}>
                      <option value="">Select Project</option>
                      {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Assignee</label>
                    <select className="form-select" value={form.assignee} onChange={(e)=> setForm(f=> ({ ...f, assignee: e.target.value }))} disabled={!form.project_id}>
                      <option value="">{form.project_id ? "Select Assignee" : "Select a project first"}</option>
                      {assignees.map(u => <option key={u._id} value={u._id}>{`${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Duration (hours)</label>
                    <input type="number" className="form-control" value={form.duration} onChange={(e)=> setForm(f=> ({ ...f, duration: e.target.value }))} min="0" step="0.5" />
                  </div>
                    <div className="col-md-4">
                    <label className="form-label">Duration Type</label>
                    <select className="form-select" value={form.duration_type || "weekly"} onChange={(e)=> setForm(f=> ({ ...f, duration_type: e.target.value }))}>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                    <div className="col-md-4">
                    <label className="form-label">State</label>
                    <select className="form-select" value={form.task_state} onChange={(e)=> setForm(f=> ({ ...f, task_state: e.target.value }))}>
                      <option value="todo">To do</option>
                      <option value="in_progress">In progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Difficulty</label>
                    <select className="form-select" value={form.difficulty} onChange={(e)=> setForm(f=> ({ ...f, difficulty: e.target.value }))}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Start Date</label>
                    <input type="date" className="form-control" value={form.start_date || ""} onChange={(e)=> setForm(f=> ({ ...f, start_date: e.target.value }))} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">End Date</label>
                    <input type="date" className="form-control" value={form.end_date || ""} onChange={(e)=> setForm(f=> ({ ...f, end_date: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={3} value={form.description} onChange={(e)=> setForm(f=> ({ ...f, description: e.target.value }))}></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={()=> setModalOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={save} disabled={loading}>{loading? "Saving..." : "Save"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllTasks;

