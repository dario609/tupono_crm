import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EditProjectSkeleton } from "../../components/common/SkelentonTableRow.js";
import Swal from "sweetalert2";
import UsersApi from "../../api/usersApi";
import TeamsApi from "../../api/teamsApi";
import RoheApi from "../../api/roheApi";
import HapuListsApi from "../../api/hapulistsApi";
import ProjectsApi from "../../api/projectsApi";
import TasksApi from "../../api/tasksApi";
import GanttChartTable from "../../components/projects/GanttChart.js";
import { taskStatuses } from "../../constants/index.js";
import AssignHapu from "../../components/projects/common/AssignHapu.js";
import AssignTeam from "../../components/projects/common/AssignTeam.js";
import ToggleButton from "../../components/common/ToggleButton.js";
import { TaskStatusBadge } from "../../utils/tasks/taskFormatters.js";  

const initialForm = {
  name: "",
  start_date: "",
  end_date: "",
  owner: "",
  team_id: "",
  rohe: "",
  hapus: [],
  status: "0",
  description: "",
};

const emptyTask = {
  assignee: null,
  duration: 0,
  status: taskStatuses[0],
  start_date: new Date(),
  end_date: new Date(),
  content: "",
  description: "",
};

const EditProject = () => {
  const { id } = useParams();
  const [taskErrors, setTaskErrors] = useState({});
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [rohes, setRohes] = useState([]);
  const [hapus, setHapus] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [projectTasks, setProjectTasks] = useState([]);
  const [taskStatusCounts, setTaskStatusCounts] = useState({
    just_starting: 0,
    working: 0,
    nearly_complete: 0,
    complete: 0,
  });

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [task, setTask] = useState(emptyTask);
  const [editTaskId, setEditTaskId] = useState(null);
  const [ganttView, setGanttView] = useState(false);
  const [ganttChartLink, setGanttChartLink] = useState("");
  const [ganttChartModalOpen, setGanttChartModalOpen] = useState(false);


  const userLabel = (u) => `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || 'User';

  const getUserName = (id) => {
    if (!id) return "-";
    const u = users.find((x) => x._id === id);
    if (!u) return "-";
    return `${u.first_name || ''} ${u.last_name || ''}`.trim();
  };

  const formatDate = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toISOString().slice(0, 10);
    } catch {
      return "";
    }
  };

  const addHapu = (id) => {
    if (!id) return;
    if (form.hapus.includes(id)) return;
    setForm((f) => ({ ...f, hapus: [...f.hapus, id] }));
  };

  const removeHapu = (id) => {
    setForm((f) => ({ ...f, hapus: f.hapus.filter((x) => x !== id) }));
  };

  useEffect(() => {
    (async () => {
      try {
        const [uJson, tJson, rJson] = await Promise.all([
          UsersApi.list({ perpage: -1 }),
          TeamsApi.list({ perpage: -1 }),
          RoheApi.list({ perpage: -1 }),
        ]);
        setUsers(uJson?.data || []);
        setTeams(tJson?.data || []);
        setRohes(rJson?.data || []);
      } catch { }
    })();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadProject = async () => {
      try {
        const res = await ProjectsApi.getById(id);
        const p = res?.data;
        if (!mounted || !p) return;

        setForm({
          name: p.name || "",
          start_date: p.start_date,
          end_date: p.end_date,
          owner: p.owner?._id || "",
          team_id: p.team_id?._id || "",
          rohe: p.rohe?._id || "",
          hapus: Array.isArray(p.hapus) ? p.hapus.map((h) => h._id) : [],
          status:
            p.status === "inactive" ||
              p.status === "1" ||
              p.status === 1
              ? "1"
              : p.status === "complete" ||
              p.status === "2" ||
              p.status === 2
              ? "2"
              : "0",
          description: p.description || "",
        });

        // Load tasks
        const tasks = p.tasks || [];
        setProjectTasks(tasks);
        
        // Calculate task status counts
        const counts = {
          just_starting: 0,
          working: 0,
          nearly_complete: 0,
          complete: 0,
        };
        tasks.forEach((t) => {
          const status = (t.status || "").toString();
          if (status === "Just starting") counts.just_starting++;
          else if (status === "Working") counts.working++;
          else if (status === "Nearly Complete") counts.nearly_complete++;
          else if (status === "Complete") counts.complete++;
        });
        setTaskStatusCounts(counts);
        
        // Load Gantt Chart link
        setGanttChartLink(p.gantt_chart_link || "");

        setPageLoading(false);

      } catch (err) {
        console.error(err);
        if (mounted) {
          setError("Failed to load project");
          setPageLoading(false);
        }
      }
    };

    loadProject();
    return () => (mounted = false);
  }, [id]);


  useEffect(() => {
    (async () => {
      if (!form.rohe) { setHapus([]); return; }
      try {
        const json = await HapuListsApi.list({ rohe_id: form.rohe });
        setHapus(json?.data || []);
      } catch { }
    })();
  }, [form.rohe]);

  // Load team members whenever team changes
  useEffect(() => {
    (async () => {
      if (!form.team_id) { setTeamMembers([]); return; }
      try {
        const json = await TeamsApi.getById(form.team_id);
        const members = json?.data?.members || [];
        setTeamMembers(members);
      } catch {
        setTeamMembers([]);
      }
    })();
  }, [form.team_id]);

  useEffect(() => {
    const endInput = document.getElementById("end_date");
    if (endInput) endInput.min = form.start_date || "";
  }, [form.start_date]);

  const onChange = (e) => {
    const { name, value, multiple, options } = e.target;
    if (multiple) {
      const values = Array.from(options).filter(o => o.selected).map(o => o.value);
      setForm((f) => ({ ...f, [name]: values }));
      return;
    }
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }
    try {
      setLoading(true);
      const payload = {
        name: form.name,
        start_date: form.start_date,
        end_date: form.end_date,
        owner: form.owner || undefined,
        team_id: form.team_id || undefined,
        rohe: form.rohe || undefined,
        hapus: form.hapus,
        status: form.status,
        description: form.description,
        tasks: projectTasks.map((t) => t._id),
        gantt_chart_link: ganttChartLink,
      };
      const data = await ProjectsApi.update(id, payload);
      if (data?.success === false) throw new Error(data?.message || "Failed to update project");
      setSuccess("Project updated successfully");
      setTimeout(() => navigate("/projects"), 900);
    } catch (err) {
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };
  const openAddTask = () => {
    setTaskErrors({})
    setTask(emptyTask);
    setEditTaskId(null);
    setTaskModalOpen(true);
  };

  // ---------------------- Open Edit Task Modal ----------------------
  const openEditTask = (taskObj) => {
    setTaskErrors({})
    setTask({ ...taskObj, start_date: formatDate(taskObj.start_date), end_date: formatDate(taskObj.end_date) });
    setEditTaskId(taskObj._id);
    setTaskModalOpen(true);
  };

  // ---------------------- Delete Task ----------------------
  const deleteTask = async (taskId) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this task? This action cannot be undone. Please confirm before proceeding.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if (!confirm.isConfirmed) return;
    await TasksApi.remove(taskId);
    Swal.fire({
      title: 'Deleted!',
      text: 'The task has been deleted successfully',
      icon: 'success',
      timer: 900,
      showConfirmButton: false,
    });
    const updatedTasks = projectTasks.filter((t) => t._id !== taskId);
    setProjectTasks(updatedTasks);
    
    // Update task status counts
    const counts = {
      just_starting: 0,
      working: 0,
      nearly_complete: 0,
      complete: 0,
    };
    updatedTasks.forEach((t) => {
      const status = (t.status || "").toString();
      if (status === "Just starting") counts.just_starting++;
      else if (status === "Working") counts.working++;
      else if (status === "Nearly Complete") counts.nearly_complete++;
      else if (status === "Complete") counts.complete++;
    });
    setTaskStatusCounts(counts);
  };
  // ---------------------- Save Task (Add or Edit) ----------------------
  const saveTask = async () => {
    const now = new Date();

    // --- VALIDATION: end_date must be >= start_date ---
    const s = task.start_date ? new Date(task.start_date) : now;
    const e = task.end_date ? new Date(task.end_date) : now;

    if (e < s) {
      setTaskErrors({
        end_date: "End Date cannot be earlier than Start Date.",
      });
      return; // abort save!
    }

    // build safe task
    const safeTask = {
      ...task,
      start_date: s,
      end_date: e,
      description: task.description || "",
    };

    try {
      let saved;

      if (editTaskId) {
        saved = await TasksApi.update(editTaskId, { ...safeTask, project_id: id });
        setProjectTasks((prev) =>
          prev.map((t) => (t._id === editTaskId ? saved.data : t))
        );
      } else {
        saved = await TasksApi.create({ ...safeTask, project_id: id });
        setProjectTasks((prev) => [...prev, saved.data]);
      }

      // Update task status counts
      const updatedTasks = editTaskId
        ? projectTasks.map((t) => (t._id === editTaskId ? saved.data : t))
        : [...projectTasks, saved.data];
      const counts = {
        just_starting: 0,
        working: 0,
        nearly_complete: 0,
        complete: 0,
      };
      updatedTasks.forEach((t) => {
        const status = (t.status || "").toString();
        if (status === "Just starting") counts.just_starting++;
        else if (status === "Working") counts.working++;
        else if (status === "Nearly Complete") counts.nearly_complete++;
        else if (status === "Complete") counts.complete++;
      });
      setTaskStatusCounts(counts);

      setTaskModalOpen(false);
      setTaskErrors({});
    } catch (err) {
      setTaskErrors({ global: err.message || "Failed to save task." });
    }
  };




  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24">
        <h6 className="fw-semibold mb-0 mt-3">Edit Project {pageLoading ? " " : ` (${form.name})`}</h6>
        <ul className="d-flex align-items-center mt-3 mb-1">
          <li className="fw-medium">
            <Link to="/projects" className="btn btn-primary btn-rounded btn-fw inner-pages-button">
              <i className="ti ti-arrow-circle-left ms-1"></i> Back
            </Link>
          </li>
        </ul>
      </div>

      <section className="card mt-3">
        <div className="row card-body pt-0">
          <div className="col-12">
            <div className="box">
              <div className="box-body p-15 pt-0">
                {pageLoading && <EditProjectSkeleton />}
                {!pageLoading && (
                  <>
                    {success && (
                      <div className="alert alert-success alert-dismissible fade show" style={{ marginTop: '10px' }}>
                        <ul style={{ listStyle: "none", marginBottom: 0 }}>
                          <li>{success}</li>
                        </ul>
                      </div>
                    )}
                    {error && (
                      <div className="alert alert-danger alert-dismissible fade show">
                        <ul style={{ listStyle: "none", marginBottom: 0 }}>
                          <li>{error}</li>
                        </ul>
                      </div>
                    )}

                    <form ref={formRef} onSubmit={onSubmit} className="mt-2" noValidate>
                      <div className="row p-1">
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Project Name <span className="text-danger">*</span></label>
                            <input type="text" className="form-control" name="name" value={form.name} onChange={onChange} maxLength={150} placeholder="Project Name" required />
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Start Date <span className="text-danger">*</span></label>
                            <input type="date" className="form-control" id="start_date" name="start_date" value={formatDate(form.start_date)} onChange={onChange} required placeholder="dd/mm/yyyy" onFocus={(e) => e.target.showPicker && e.target.showPicker()} onClick={(e) => e.target.showPicker && e.target.showPicker()} />
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="form-group">
                            <label>End Date <span className="text-danger">*</span></label>
                            <input type="date" className="form-control" id="end_date" name="end_date" value={formatDate(form.end_date)} onChange={onChange} required placeholder="dd/mm/yyyy" onFocus={(e) => e.target.showPicker && e.target.showPicker()} onClick={(e) => e.target.showPicker && e.target.showPicker()} />
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="form-group mb-2">
                            <label>Project Owner</label>
                            <select className="form-control form-select" name="owner" value={form.owner} onChange={onChange}>
                              <option value="">Select Owner</option>
                              {users.map((u) => (
                                <option key={u._id} value={u._id}>{`${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Assigned To removed */}

                        <AssignTeam 
                          teams={teams} 
                          teamMembers={teamMembers} 
                          team_id={form.team_id} 
                          onChange={onChange}
                          loading={pageLoading}
                        />

                        <div className="col-md-4">
                          <div className="form-group mb-2">
                            <label>Assign a Rohe (Region)</label>
                            <select className="form-control form-select" name="rohe" value={form.rohe} onChange={onChange}>
                              <option value="">Select Rohe</option>
                              {rohes.map((r) => (
                                <option key={r._id} value={r._id}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <AssignHapu 
                          hapus={hapus} 
                          selectedHapus={form.hapus} 
                          onAdd={addHapu} 
                          onRemove={removeHapu} 
                          disabled={!form.rohe} 
                        />

                        <div className="col-md-4">
                          <div className="form-group mb-2">
                            <label>Status <span className="text-danger">*</span></label>
                            <select className="form-control form-select" name="status" value={form.status} onChange={onChange} required>
                              <option value="0">Active</option>
                              <option value="1">Inactive</option>
                              <option value="2">Complete</option>
                            </select>
                          </div>
                        </div>

                        <div className="col-md-12">
                          <div className="form-group">
                            <label>Description</label>
                            <textarea className="form-control" maxLength={500} id="description" name="description" value={form.description} onChange={onChange} placeholder="Description" rows={3}></textarea>
                          </div>
                        </div>
                        <div className="d-flex align-items-center justify-content-between mb-2 mt-4">
                          <h5 className="mb-0">Tasks ({projectTasks.length} Tasks)</h5>
                          <div className="d-flex align-items-center gap-2" style={{ fontSize: "0.875rem", color: "#6c757d" }}>
                            <span>
                              <span className="badge bg-secondary me-1" style={{ padding: "2px 6px" }}></span>
                              Just Starting: {taskStatusCounts.just_starting}
                            </span>
                            <span>
                              <span className="badge bg-info me-1" style={{ padding: "2px 6px" }}></span>
                              Working: {taskStatusCounts.working}
                            </span>
                            <span>
                              <span className="badge bg-warning me-1" style={{ padding: "2px 6px" }}></span>
                              Nearly Complete: {taskStatusCounts.nearly_complete}
                            </span>
                            <span>
                              <span className="badge bg-success me-1" style={{ padding: "2px 6px" }}></span>
                              Complete: {taskStatusCounts.complete}
                            </span>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 mb-2" style={{ marginLeft: "10px" }}>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ borderRadius: 20 }}
                            type="button"
                            onClick={openAddTask}
                          >
                            + Add Task
                          </button>
                        {ganttChartLink && (
                          <button
                            className="btn btn-success btn-sm"
                            style={{ borderRadius: 20 }}
                            type="button"
                            onClick={() => window.open(ganttChartLink, '_blank', 'noopener,noreferrer')}
                          >
                            <i className="mdi mdi-link-variant me-1"></i> View Link
                          </button>
                        )}
                        </div>

                        <div className="text-end mb-2">
                          <ToggleButton
                            value={ganttView}
                            onChange={setGanttView}
                            leftLabel="Table"
                            rightLabel="Gantt"
                            leftValue={false}
                            rightValue={true}
                          />
                        </div>

                        {
                          !ganttView && (
                            <div className="table-responsive">
                              <table className="table table-bordered">
                                <thead className="bg-primary text-white">
                                  <tr>
                                    <th>SN</th>
                                    <th>Assignee</th>
                                    <th>Duration (h)</th>
                                    <th>Status</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Content</th>
                                    <th>Description</th>
                                    <th style={{ width: "110px" }}>Actions</th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {projectTasks.length === 0 && (
                                    <tr>
                                      <td colSpan="7" className="text-center">No tasks found.</td>
                                    </tr>
                                  )}

                                  {projectTasks.map((t, i) => (
                                    <tr key={t._id}>
                                      <td>{i + 1}</td>
                                      <td>{getUserName(t.assignee)}</td>
                                      <td>{t.duration || "-"}</td>
                                      <td>
                                        <TaskStatusBadge status={t.status} />
                                      </td>
                                      <td>{t.start_date ? t.start_date.slice(0, 10) : new Date().toISOString().split('T')[0]}</td>
                                      <td>{t.end_date ? t.end_date.slice(0, 10) : new Date().toISOString().split('T')[0]}</td>
                                      <td>{t.content || "-"}</td>
                                      <td>{t.description || "-"}</td>
                                      <td className="text-center">
                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                                          <a
                                            className="btn badge-success btn-sm btn-rounded btn-icon"
                                            title="Edit"
                                            onClick={() => openEditTask(t)}
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-edit-2 align-middle">
                                              <polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon>
                                            </svg>
                                          </a>
                                          <a className="btn badge-danger btn-sm btn-rounded btn-icon" title="Delete" onClick={() => deleteTask(t._id)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trash align-middle">
                                              <polyline points="3 6 5 6 21 6"></polyline>
                                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                          </a>
                                        </div>
                                      </td>

                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>)
                        }
                        {ganttView && <GanttChartTable tasks={projectTasks} onEditTask={(task) => openEditTask(task)} />}

                      </div>

                      <div className="modal-footer1 text-center mt-2">
                        <button type="button" className="btn btn-danger btn-rounded btn-fw" style={{ marginRight: '5px' }} onClick={() => navigate("/projects")}>
                          Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn btn-primary btn-rounded btn-fw">{loading ? "Saving..." : "Save"}</button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      {
        taskModalOpen && (
          <div style={modalStyles.backdrop}>
            <div style={modalStyles.modal}>
              <h5>{editTaskId ? "Edit Task" : "Add Task"}</h5>

              {/* FIELDS */}
              <div className="row">
                <div className="col-md-6 mt-2">
                  <label>Assignee *</label>
                  <select
                    className="form-control"
                    value={task.assignee}
                    onChange={(e) => setTask({ ...task, assignee: e.target.value })}
                  >
                    <option value="">Select</option>
                    {teamMembers.map((u) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                  {taskErrors.assignee && (
                    <div className="text-danger mt-1">{taskErrors.assignee}</div>
                  )}
                </div>

                <div className="col-md-6 mt-2">
                  <label>Duration (h)</label>
                  <input type="number"
                    className="form-control"
                    value={task.duration}
                    onChange={(e) => setTask({ ...task, duration: e.target.value })}
                  />
                </div>

                <div className="col-md-6 mt-2">
                  <label>Status</label>
                  <select
                    className="form-control"
                    value={task.status}
                    onChange={(e) => setTask({ ...task, status: e.target.value })}
                  >
                    <option value="Just starting">Just Starting</option>
                    <option value="Working">Working</option>
                    <option value="Nearly Complete">Nearly Complete</option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>

                <div className="col-md-6 mt-2">
                  <label>Start Date</label>
                  <input type="date"
                    className="form-control"
                    value={task.start_date}
                    onChange={(e) => setTask({ ...task, start_date: e.target.value })}
                  />
                  {taskErrors.start_date && (
                    <div className="text-danger mt-1">{taskErrors.start_date}</div>
                  )}
                </div>

                <div className="col-md-6 mt-2">
                  <label>End Date</label>
                  <input
                    type="date"
                    className={`form-control ${taskErrors.end_date ? "is-invalid" : ""}`}
                    value={task.end_date}
                    onChange={(e) =>
                      setTask({ ...task, end_date: e.target.value })
                    }
                  />
                  {taskErrors.end_date && (
                    <div className="invalid-feedback">{taskErrors.end_date}</div>
                  )}
                </div>

                <div className="col-md-12 mt-2">
                  <label>Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={task.description || ""}
                    onChange={(e) => setTask({ ...task, description: e.target.value })}
                    placeholder="Task description..."
                  />
                </div>


                <div className="col-md-12 mt-2">
                  <label>Content</label>
                  <select
                    className="form-control"
                    value={task.content}
                    onChange={(e) => setTask({ ...task, content: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    <option value="Admin">Admin</option>
                    <option value="Finance">Finance</option>
                    <option value="Other">Other</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Travel">Travel</option>
                    <option value="Report Support">Report Support</option>
                  </select>
                  {taskErrors.content && (
                    <div className="text-danger mt-1">{taskErrors.content}</div>
                  )}
                </div>
              </div>

              {taskErrors.global && (
                <div className="text-danger mt-2 text-center text-bold">{taskErrors.global}</div>
              )}

              {/* ACTION BUTTONS */}
              <div className="text-end mt-3">
                <button
                  className="btn btn-secondary me-2"
                  onClick={() => setTaskModalOpen(false)}
                >
                  Cancel
                </button>

                <button className="btn btn-primary" onClick={saveTask}>
                  Save Task
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Gantt Chart Link Modal */}
      {ganttChartModalOpen && (
        <div style={modalStyles.backdrop} onClick={() => setGanttChartModalOpen(false)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <h5>Import Gantt Chart</h5>
            <div className="mt-3">
              <label>Gantt Chart Web Link</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://example.com/gantt-chart"
                value={ganttChartLink}
                onChange={(e) => setGanttChartLink(e.target.value)}
                autoFocus
              />
              <small className="text-muted">Enter the web link to your Gantt Chart</small>
            </div>
            <div className="text-end mt-3">
              <button
                className="btn btn-secondary me-2"
                onClick={() => setGanttChartModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    // Save the link immediately
                    await ProjectsApi.update(id, { gantt_chart_link: ganttChartLink });
                    setGanttChartModalOpen(false);
                    Swal.fire({
                      title: 'Gantt Chart link saved',
                      text: 'The Gantt Chart link has been saved. Click "View Link" to open it.',
                      icon: 'success',
                      timer: 2000,
                      showConfirmButton: false,
                    });
                  } catch (err) {
                    Swal.fire({
                      title: 'Error',
                      text: err.message || 'Failed to save Gantt Chart link',
                      icon: 'error',
                    });
                  }
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};



const GanttChart = ({ tasks }) => {
  // Convert date safely and consistently
  const parseDate = (d) => {
    if (!d) return null;
    const v = d instanceof Date ? d : new Date(d);
    return isNaN(v.getTime()) ? null : v;
  };

  // Normalize tasks with parsed dates
  const normalized = tasks.map(t => ({
    ...t,
    _start: parseDate(t.start_date),
    _end: parseDate(t.end_date),
  }));

  // Only tasks with valid date ranges
  const validTasks = normalized.filter(t => t._start && t._end);

  if (validTasks.length === 0) {
    return (
      <div className="alert alert-info mt-2">
        No valid tasks to display in Gantt view (missing or invalid dates).
      </div>
    );
  }

  // Safe min/max
  const minDate = new Date(Math.min(...validTasks.map(t => t._start.getTime())));
  const maxDate = new Date(Math.max(...validTasks.map(t => t._end.getTime())));
  const totalMs = Math.max(maxDate - minDate, 1);

  const getLeft = (date) => {
    const v = ((date - minDate) / totalMs) * 100;
    return isNaN(v) ? 0 : Math.max(0, Math.min(100, v));
  };

  const getWidth = (s, e) => {
    const v = ((e - s) / totalMs) * 100;
    return isNaN(v) ? 0 : Math.max(0, v);
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: 15, borderRadius: 10 }}>
      <div style={{ fontWeight: 600, marginBottom: 10 }}>Gantt Timeline</div>

      {validTasks.map((t, i) => (
        <div key={t._id || i} style={{ marginBottom: 25 }}>
          <div style={{ marginBottom: 4, fontSize: 13 }}>
            <b>{i + 1}. {t.content}</b> —
            {t._start.toISOString().slice(0, 10)} → {t._end.toISOString().slice(0, 10)}
          </div>

          <div style={{ position: "relative", height: 22, background: "#eee", borderRadius: 4 }}>
            <div
              style={{
                position: "absolute",
                left: `${getLeft(t._start)}%`,
                width: `${getWidth(t._start, t._end)}%`,
                height: "100%",
                background: "#007bff",
                borderRadius: 4,
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};




const modalStyles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 20,
  },
  modal: {
    position: "relative",
    background: "white",
    padding: "25px 30px",
    width: "100%",
    maxWidth: "480px",
    borderRadius: "12px",
    boxShadow: "0 5px 25px rgba(0,0,0,0.25)",
    maxHeight: "90vh",
    overflowY: "auto",
  },
};


export default EditProject;


