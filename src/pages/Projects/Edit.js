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
import { tasksTemplates, taskDurationTypes, taskStatuses } from "../../constants/index.js";

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
  assigned_by: null,
  duration: 0,
  duration_type: "Daily",
  status: taskStatuses[0],
  start_date: new Date(),
  end_date: new Date(),
  content: "",
};

const EditProject = () => {
  const { id } = useParams();
  const [taskErrors, setTaskErrors] = useState({});
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [importing, setImporting] = useState(false);

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
  const [hapuInput, setHapuInput] = useState("");

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [task, setTask] = useState(emptyTask);
  const [editTaskId, setEditTaskId] = useState(null);
  const [taskEditIndex, setTaskEditIndex] = useState(null);
  const [ganttView, setGanttView] = useState(false);


  const userLabel = (u) => `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || 'User';
  const parseHapuIdFromOption = (val) => {
    const match = hapus.find((x) => (x?.name || "").toLowerCase() === String(val).toLowerCase());
    return match?._id || null;
  };

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


  const addHapuByLabel = (val) => {
    const idParsed = parseHapuIdFromOption(val);
    if (!idParsed) return setHapuInput("");
    setForm((f) => ({ ...f, hapus: f.hapus.includes(idParsed) ? f.hapus : [...f.hapus, idParsed] }));
    setHapuInput("");
  };
  const removeHapuFromList = (idVal) => setForm((f) => ({ ...f, hapus: f.hapus.filter((x) => x !== idVal) }));

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
              : "0",
          description: p.description || "",
        });

        // Load tasks
        setProjectTasks(p.tasks || []);

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
    setProjectTasks((prev) => prev.filter((t) => t._id !== taskId));
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

      setTaskModalOpen(false);
      setTaskErrors({});
    } catch (err) {
      setTaskErrors({ global: err.message || "Failed to save task." });
    }
  };


  const handleImportTasks = async () => {
    setImporting(true);
    setTaskErrors({});

    try {
      const newTasks = await Promise.all(tasksTemplates.tasks.map(async (t) => {
        const task = await TasksApi.create({
          project_id: id,
          duration: 0,
          duration_type: taskDurationTypes[1],
          content: t.content,
          status: taskStatuses[0],
          assignee: null,
          assigned_by: null,
          start_date: new Date(),
          end_date: new Date(),
        });
        return task.data;
      }));
      setProjectTasks([...projectTasks, ...newTasks]);
      setTaskModalOpen(false);

      Swal.fire({
        title: 'Tasks imported successfully',
        text: 'Tasks have been imported successfully',
        icon: 'success',
      });
    } catch (err) {
      setTaskErrors({ global: err.message || "Failed to import tasks. Please try again." });
    } finally {
      setImporting(false);
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

                    <form ref={formRef} onSubmit={onSubmit} noValidate>
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

                        <div className="col-md-4">
                          <div className="form-group mb-2">
                            <label>Assign Team</label>
                            <select className="form-control form-select" name="team_id" value={form.team_id} onChange={onChange}>
                              <option value="">Select Team</option>
                              {teams.map((t) => (
                                <option key={t._id} value={t._id}>{t.title}</option>
                              ))}
                            </select>
                            {teamMembers.length > 0 && (
                              <div className="mt-2" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {teamMembers.map((m) => (
                                  <span key={`tm-${m._id}`} className="badge badge-primary" style={{ padding: '3px 10px' }}>{m.name}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

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

                        <div className="col-md-4">
                          <div className="form-group mb-2">
                            <label>Assign Hapū (multiple)</label>
                            <input
                              className="form-control"
                              placeholder="Search and select hapū"
                              list="hapuOptions"
                              value={hapuInput}
                              onChange={(e) => setHapuInput(e.target.value)}
                              onBlur={(e) => addHapuByLabel(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHapuByLabel(hapuInput); } }}
                              disabled={!form.rohe}
                            />
                            <datalist id="hapuOptions">
                              {hapus.map((h) => (
                                <option key={`hapu-${h._id}`} value={h.name} />
                              ))}
                            </datalist>
                            {form.hapus?.length > 0 && (
                              <div className="mt-2" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {form.hapus.map((hid) => {
                                  const h = hapus.find((x) => x._id === hid);
                                  if (!h) return null;
                                  return (
                                    <span key={`tag-hapu-${hid}`} className="badge badge-primary" style={{ padding: '0px 7px' }}>
                                      {h.name}
                                      <button type="button" className="btn btn-link btn-sm" onClick={() => removeHapuFromList(hid)} style={{ color: '#fff', textDecoration: 'none', marginLeft: 6, padding: '3px 5px' }}>×</button>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="form-group mb-2">
                            <label>Status <span className="text-danger">*</span></label>
                            <select className="form-control form-select" name="status" value={form.status} onChange={onChange} required>
                              <option value="0">Active</option>
                              <option value="1">Inactive</option>
                            </select>
                          </div>
                        </div>

                        <div className="col-md-12">
                          <div className="form-group">
                            <label>Description</label>
                            <textarea className="form-control" maxLength={500} id="description" name="description" value={form.description} onChange={onChange} placeholder="Description" rows={3}></textarea>
                          </div>
                        </div>
                        <h5 className="mt-4 mb-2">Tasks</h5>
                        <div className="dropdown mb-2" style={{ marginLeft: "10px" }}>
                          <button
                            className="btn btn-primary btn-sm dropdown-toggle"
                            style={{ borderRadius: 20, width: "120px" }}
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            + Add
                          </button>

                          <ul className="dropdown-menu">
                            <li>
                              <a
                                className="dropdown-item"
                                href="#"
                                onClick={() => {
                                  openAddTask();
                                }}
                              >
                                Add Single Task
                              </a>
                            </li>
                            <li>
                              <a className="dropdown-item" onClick={handleImportTasks}>
                                {importing ? (
                                  <span>
                                    <i className="fa fa-spinner fa-spin me-2"></i> Importing...
                                  </span>
                                ) : (
                                  "Add From Template"
                                )}
                              </a>
                            </li>
                          </ul>
                        </div>

                        <div className="text-end mb-2 gantt-switch">
                          <label className="switch-option">
                            <input
                              type="radio"
                              name="viewMode"
                              checked={!ganttView}
                              onChange={() => setGanttView(false)}
                            />
                            <span>Table</span>
                          </label>

                          <label className="switch-option">
                            <input
                              type="radio"
                              name="viewMode"
                              checked={ganttView}
                              onChange={() => setGanttView(true)}
                            />
                            <span>Gantt</span>
                          </label>
                        </div>

                        {
                          !ganttView && (
                            <div className="table-responsive">
                              <table className="table table-bordered">
                                <thead className="bg-primary text-white">
                                  <tr>
                                    <th>#</th>
                                    <th>Assignee</th>
                                    <th>Assigned By</th>
                                    <th>Duration (h)</th>
                                    <th>Duration Type</th>
                                    <th>Status</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Content</th>
                                    <th style={{ width: "110px" }}>Actions</th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {projectTasks.length === 0 && (
                                    <tr>
                                      <td colSpan="9" className="text-center">No tasks found.</td>
                                    </tr>
                                  )}

                                  {projectTasks.map((t, i) => (
                                    <tr key={t._id}>
                                      <td>{i + 1}</td>
                                      <td>{getUserName(t.assignee)}</td>
                                      <td>{getUserName(t.assigned_by)}</td>
                                      <td>{t.duration || "-"}</td>
                                      <td>{t.duration_type || "-"}</td>
                                      <td>
                                        {t.status === taskStatuses[0] && (
                                          <span className="badge bg-secondary">Just Starting</span>
                                        )}
                                        {t.status === taskStatuses[1] && (
                                          <span className="badge bg-info text-dark">Working On</span>
                                        )}
                                        {t.status === taskStatuses[2] && (
                                          <span className="badge bg-warning text-dark">Nearly Complete</span>
                                        )}
                                        {t.status === taskStatuses[3] && (
                                          <span className="badge bg-success">Complete</span>
                                        )}
                                      </td>

                                      <td>{t.start_date ? t.start_date.slice(0, 10) : new Date().toISOString().split('T')[0]}</td>
                                      <td>{t.end_date ? t.end_date.slice(0, 10) : new Date().toISOString().split('T')[0]}</td>
                                      <td>{t.content || "-"}</td>

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
                  <label>Assigned By</label>
                  <select
                    className="form-control"
                    value={task.assigned_by}
                    onChange={(e) => setTask({ ...task, assigned_by: e.target.value })}
                  >
                    <option value="">Select</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>{getUserName(u._id)}</option>
                    ))}
                  </select>
                  {taskErrors.assigned_by && (
                    <div className="text-danger mt-1">{taskErrors.assigned_by}</div>
                  )}
                </div>

                <div className="col-md-4 mt-2">
                  <label>Duration (h)</label>
                  <input type="number"
                    className="form-control"
                    value={task.duration}
                    onChange={(e) => setTask({ ...task, duration: e.target.value })}
                  />
                </div>

                <div className="col-md-4 mt-2">
                  <label>Duration Type</label>
                  <select
                    className="form-control"
                    value={task.duration_type}
                    onChange={(e) =>
                      setTask({ ...task, duration_type: e.target.value })
                    }
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>

                <div className="col-md-4 mt-2">
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


