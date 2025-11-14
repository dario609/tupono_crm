import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthProvider";
import UsersApi from "../../api/usersApi";
import TeamsApi from "../../api/teamsApi";
import RoheApi from "../../api/roheApi";
import HapuListsApi from "../../api/hapulistsApi";
import ProjectsApi from "../../api/projectsApi";

const emptyTask = {
  assignee: "",
  assigned_by: "",
  duration: "",
  duration_type: "Daily",
  status: "Just starting",
  start_date: "",
  end_date: "",
  content: "",
};

const initialFormData = {
  name: "",
  start_date: "",
  end_date: "",
  owner: "",
  team_id: "",
  rohe: "",
  hapus: [],
  report_types: [],
  report_phase: "Phase 1",
  status: "0",
  description: "",
}

const CreateProject = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [rohes, setRohes] = useState([]);
  const [hapus, setHapus] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [form, setForm] = useState(initialFormData);
  const [hapuInput, setHapuInput] = useState("");

  const [tasks, setTasks] = useState([]);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [task, setTask] = useState(emptyTask);
  const [taskEditIndex, setTaskEditIndex] = useState(null);
  const [taskErrors, setTaskErrors] = useState({});

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
    (async () => {
      if (!form.rohe) { setHapus([]); return; }
      try {
        const json = await HapuListsApi.list({ rohe_id: form.rohe });
        setHapus(json?.data || []);
      } catch { }
    })();
  }, [form.rohe]);

  // Load team members when a team is selected
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

  const formatDateForDisplay = (v) => {
    if (!v) return "";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  useEffect(() => {
    const endInput = document.getElementById("end_date");
    if (endInput) endInput.min = form.start_date || "";
  }, [form.start_date]);

  const onChange = (e) => {
    const { name, value, multiple, options, type, checked } = e.target;
    if (multiple) {
      const values = Array.from(options).filter(o => o.selected).map(o => o.value);
      setForm((f) => ({ ...f, [name]: values }));
      return;
    }
    // no report type handling
    setForm((f) => ({ ...f, [name]: value }));
  };

  // removed add/remove Rohe/Hapu functions

  const parseHapuIdFromOption = (val) => {
    const match = hapus.find((x) => (x?.name || "").toLowerCase() === String(val).toLowerCase());
    return match?._id || null;
  };
  const addHapuByLabel = (val) => {
    const id = parseHapuIdFromOption(val);
    if (!id) return setHapuInput("");
    setForm((f) => ({ ...f, hapus: f.hapus.includes(id) ? f.hapus : [...f.hapus, id] }));
    setHapuInput("");
  };
  const removeHapuFromList = (id) => setForm((f) => ({ ...f, hapus: f.hapus.filter((x) => x !== id) }));
  // removed Assigned To helpers

  const openTaskModal = () => {
    setTask(emptyTask);
    setTaskEditIndex(null);
    setTaskModalOpen(true);
  };

  const editTask = (index) => {
    setTask(tasks[index]);
    setTaskEditIndex(index);
    setTaskModalOpen(true);
  };

  const getUserName = (id) => {
    if (!id) return "-";
    const u = users.find((x) => x._id === id);
    if (!u) return id; // fallback (optional)
    return `${u.first_name || ""} ${u.last_name || ""}`.trim();
  };

  const saveTask = () => {
    const errors = {};
  
    if (!task.assignee) errors.assignee = "Assignee is required";
    if (!task.start_date) errors.start_date = "Start Date is required";
    if (!task.end_date) errors.end_date = "End Date is required";
    if (!task.content) errors.content = "Content is required";
  
    // Apply errors
    if (Object.keys(errors).length > 0) {
      setTaskErrors(errors);
      return;
    }
  
    // Clear errors
    setTaskErrors({});
  
    // Auto-assign "Assigned By"
    task.assigned_by = user.id;
  
    const updated = [...tasks];
  
    if (taskEditIndex !== null) {
      updated[taskEditIndex] = task;
    } else {
      updated.push(task);
    }
  
    setTasks(updated);
    setTaskModalOpen(false);
  };
  

  const deleteTask = async (index) => {
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
    setTasks(tasks.filter((_, i) => i !== index));
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
        tasks: tasks,
      };
      const data = await ProjectsApi.create(payload);
      if (data?.success === false) throw new Error(data?.message || "Failed to create project");
      setSuccess("Project created successfully");
      setTimeout(() => navigate("/projects"), 900);
    } catch (err) {
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24">
        <h6 className="fw-semibold mb-0 mt-3">Add New Project</h6>
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
                        <input type="date" className="form-control" id="start_date" name="start_date" value={form.start_date} onChange={onChange} required placeholder="dd/mm/yyyy" onFocus={(e) => e.target.showPicker && e.target.showPicker()} onClick={(e) => e.target.showPicker && e.target.showPicker()} />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label>End Date <span className="text-danger">*</span></label>
                        <input type="date" className="form-control" id="end_date" name="end_date" value={form.end_date} onChange={onChange} required placeholder="dd/mm/yyyy" onFocus={(e) => e.target.showPicker && e.target.showPicker()} onClick={(e) => e.target.showPicker && e.target.showPicker()} />
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
                        <label>Status <span className="text-danger">*</span></label>
                        <select className="form-control form-select" name="status" value={form.status} onChange={onChange} required>
                          <option value="0">Active</option>
                          <option value="1">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>Assign a Rohe</label>
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


                    <div className="col-md-12">
                      <div className="form-group">
                        <label>Description</label>
                        <textarea className="form-control" maxLength={500} id="description" name="description" value={form.description} onChange={onChange} placeholder="Description" rows={3}></textarea>
                      </div>
                    </div>
                    {/* -------------------- TASKS SECTION -------------------- */}
                    <div className="col-md-12 mt-4">
                      <h5 className="fw-semibold" style={{ marginBottom: "10px" }}>Tasks</h5>

                      <button
                        type="button"
                        className="btn btn-primary btn-sm mb-2"
                        onClick={openTaskModal}
                        style={{ borderRadius: 20 }}
                      >
                        + Add Task
                      </button>

                      <div className="table-responsive">
                        <table className="table table-bordered table-hover">
                          <thead style={{ background: "#0d6efd", color: "#fff" }}>
                            <tr>
                              <th>#</th>
                              <th>Assignee</th>
                              <th>Assigned By</th>
                              <th>Duration</th>
                              <th>Type</th>
                              <th>Status</th>
                              <th>Start</th>
                              <th>End</th>
                              <th>Description</th>
                              <th style={{ width: "110px" }}>Actions</th>
                            </tr>
                          </thead>

                          <tbody>
                            {tasks.length === 0 && (
                              <tr>
                                <td colSpan="10" className="text-center text-muted">
                                  No tasks added yet.
                                </td>
                              </tr>
                            )}

                            {tasks.map((t, i) => (
                              <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{getUserName(t.assignee)}</td>
                                <td>{getUserName(t.assigned_by)}</td>
                                <td>{t.duration || "-"}</td>
                                <td>{t.duration_type}</td>

                                <td>
                                  {t.status === "Just starting" && (
                                    <span className="badge bg-secondary">Just Starting</span>
                                  )}
                                  {t.status === "Working" && (
                                    <span className="badge bg-info text-dark">Working On</span>
                                  )}
                                  {t.status === "Nearly Complete" && (
                                    <span className="badge bg-warning text-dark">Nearly Complete</span>
                                  )}
                                  {t.status === "Complete" && (
                                    <span className="badge bg-success">Complete</span>
                                  )}
                                </td>

                                <td>{t.start_date}</td>
                                <td>{t.end_date}</td>
                                <td>{t.content || "-"}</td>
                                <td className="text-center">
                                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                                    <a
                                      className="btn badge-success btn-sm btn-rounded btn-icon"
                                      title="Edit"
                                      onClick={() => editTask(i)}
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
                      </div>
                    </div>


                  </div>

                  <div className="modal-footer1 text-center mt-2">
                    <button type="button" className="btn btn-danger btn-rounded btn-fw" style={{ marginRight: '5px' }} onClick={() => navigate("/projects")}>Cancel</button>
                    <button type="submit" disabled={loading} className="btn btn-primary btn-rounded btn-fw">{loading ? "Saving..." : "Save"}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
      {taskModalOpen && (
        <div className="modal-backdrop" style={modalStyles.backdrop}>
          <div style={modalStyles.modal}>
            <h5>{taskEditIndex !== null ? "Edit Task" : "Add Task"}</h5>

            <div className="row mt-3">

              <div className="col-md-6">
                <label>Assignee *</label>
                <select
                  className="form-control"
                  value={task.assignee}
                  onChange={(e) => setTask({ ...task, assignee: e.target.value })}
                >
                  <option value="">Select Assignee</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.first_name} {u.last_name}
                    </option>
                  ))}
                </select>
                {taskErrors.assignee && (
                  <small className="text-danger">{taskErrors.assignee}</small>
                )}
              </div>



              <div className="col-md-6">
                <label>Assigned By</label>
                <input
                  className="form-control"
                  value={user.name}
                  disabled
                />
              </div>

              <div className="col-md-4 mt-2">
                <label>Duration (h)</label>
                <input type="number" className="form-control" value={task.duration}
                  onChange={(e) => setTask({ ...task, duration: e.target.value })} />
              </div>

              <div className="col-md-4 mt-2">
                <label>Duration Type</label>
                <select className="form-control" value={task.duration_type}
                  onChange={(e) => setTask({ ...task, duration_type: e.target.value })}>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              <div className="col-md-6 mt-2">
                <label>Start Date*</label>
                <input type="date" className="form-control" value={task.start}
                  onChange={(e) => setTask({ ...task, start_date: e.target.value })} />
                  {taskErrors.start_date && (
                    <small className="text-danger">{taskErrors.start_date}</small>
                  )}
              </div>

              <div className="col-md-6 mt-2">
                <label>End Date*</label>
                <input type="date" className="form-control" value={task.end}
                  onChange={(e) => setTask({ ...task, end_date: e.target.value })} />
                  {taskErrors.end_date && (
                    <small className="text-danger">{taskErrors.end_date}</small>
                  )}
              </div>

              <div className="col-md-4 mt-2">
                <label>Status</label>
                <select className="form-control" value={task.status}
                  onChange={(e) => setTask({ ...task, status: e.target.value })}>
                  <option value="Just starting">Just Starting</option>
                  <option value="Working">Working On</option>
                  <option value="Nearly Complete">Nearly Complete</option>
                  <option value="Complete">Complete</option>
                </select>
              </div>

              <div className="col-md-4">
                <div className="form-group mt-2">
                  <h5>Content</h5>
                  <select
                    className="form-control form-select"
                    name="content"
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
                    <small className="text-danger">{taskErrors.content}</small>
                  )}
                </div>
              </div>
            </div>

            <div className="text-end mt-3">
              <button className="btn btn-secondary me-2" onClick={() => setTaskModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveTask}>
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}

    </>
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
    padding: "25px 25px",
    width: "100%",
    maxWidth: "480px",
    borderRadius: "12px",
    boxShadow: "0 5px 25px rgba(0,0,0,0.25)",
    maxHeight: "90vh",
    overflowY: "auto",
    marginRight: "10px",
  },
};

export default CreateProject;


