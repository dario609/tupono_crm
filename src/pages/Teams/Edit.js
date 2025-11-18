import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import UsersApi from "../../api/usersApi";
import TeamsApi from "../../api/teamsApi";

const initialForm = {
  title: "",
  status: "active",
  description: "",
  user_id: [],
}
const EditTeam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [titleGhost, setTitleGhost] = useState("");
  const [descGhost, setDescGhost] = useState("");
  const [userInput, setUserInput] = useState("");

  const userLabel = (u) => `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || 'User';
  const combinedOptions = [
    ...teams.map(t => ({
      type: "team",
      label: `[Team] ${t.title}`,
      value: t._id
    })),
    ...users.map(u => ({
      type: "user",
      label: `[User] ${userLabel(u)}`,
      value: u._id
    }))
  ];
  

  useEffect(() => {
    (async () => {
      try {
        const [uJson, tJson, teamJson] = await Promise.all([
          UsersApi.list({ perpage: -1 }),
          TeamsApi.getById(id),
          TeamsApi.list()
        ]);
        setUsers(uJson?.data || []);
        setTeams(teamJson?.data || []);

        if (tJson?.data) {
          setForm({
            title: tJson.data.title || "",
            status: tJson.data.status || "active",
            description: tJson.data.description || "",
            user_id: Array.isArray(tJson.data.user_id) ? tJson.data.user_id : [],
          });
        }
      } catch { }
    })();
  }, [id]);
  const handleCombinedSelection = async (label) => {
    setUserInput("");

    const opt = combinedOptions.find(
      o => o.label.toLowerCase() === label.toLowerCase()
    );
    if (!opt) return;

    // USER SELECTED
    if (opt.type === "user") {
      if (!form.user_id.includes(opt.value)) {
        setForm((f) => ({
          ...f,
          user_id: [...f.user_id, opt.value]
        }));
      }
      return;
    }

    // TEAM SELECTED → import team members
    if (opt.type === "team") {
      try {
        const teamUsers = teams.find((t) => String(t._id) === String(opt.value)).assigned_users;

        setUsers((prev) => {
          const merged = [...prev];
          teamUsers.forEach((u) => {
            if (!merged.some((x) => x._id === u._id)) {
              merged.push({
                _id: u._id,
                first_name: u.name?.split(" ")[0] ?? "",
                last_name: u.name?.split(" ")[1] ?? "",
                email: u.email
              });
            }
          });
          return merged;
        });

        // 2) Add assigned user IDs into form.user_id
        setForm((f) => {
          const mergedIds = [...f.user_id];
          teamUsers.forEach((u) => {
            if (!mergedIds.includes(u._id)) mergedIds.push(u._id);
          });
          return { ...f, user_id: mergedIds };
        });

      } catch (err) {
        console.error("Team load failed", err);
      }
    }
  };


  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // ghost overlay placeholders (no backend suggestion yet)
  const handleSuggest = (_field, setter) => () => setter("");


  const parseUserIdFromOption = (val) => {
    const match = users.find((x) => userLabel(x).toLowerCase() === String(val).toLowerCase());
    return match?._id || null;
  };
  const addUser = (val) => {
    const idParsed = parseUserIdFromOption(val);
    if (!idParsed) return setUserInput("");
    setForm((f) => ({ ...f, user_id: f.user_id.includes(idParsed) ? f.user_id : [...f.user_id, idParsed] }));
    setUserInput("");
  };
  const removeUser = (uid) => setForm((f) => ({ ...f, user_id: f.user_id.filter((x) => x !== uid) }));

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
      const data = await TeamsApi.update(id, form);
      if (data?.success === false) throw new Error(data?.message || "Failed to update team");
      setSuccess("Team updated successfully");
      setTimeout(() => navigate("/teams"), 900);
    } catch (err) {
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mt-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">
        <h6 className="fw-semibold mb-0">Edit Team</h6>
        <div>
          <Link to="/teams" className="btn btn-primary btn-rounded btn-fw" style={{ fontSize: '15px' }}>
            <i className="ti ti-arrow-circle-left ms-1"></i> Back
          </Link>
        </div>
      </div>

      <div className="row card-body pt-0">
        <div className="col-12">
          <div className="box">
            <div className="box-body p-15 pt-0">
              {success && (
                <div className="alert alert-success alert-dismissible fade show">
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

              <form ref={formRef} onSubmit={onSubmit} noValidate className="col-md-12">
                <div className="modal-body pt-2">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Team Name <span className="text-danger">*</span></label>
                        <div className="autocomplete-wrapper" style={{ position: 'relative', width: '100%' }}>
                          <pre className="autocomplete-shadow" style={{ position: 'absolute', top: 0, left: 0, padding: '0.375rem 0.75rem', zIndex: 1, color: 'rgba(0,0,0,0.3)', width: '100%', height: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-word', pointerEvents: 'none', overflow: 'hidden', margin: 0, lineHeight: '22px', fontSize: 14 }}>{titleGhost}</pre>
                          <input type="text" className="form-control" placeholder="Enter Team Name" name="title" id="title" autoComplete="off" spellCheck={false} required maxLength={80} value={form.title} onChange={(e) => { onChange(e); handleSuggest('title', setTitleGhost)(e); }} />
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group mb-2">
                        <label>Status <span className="text-danger">*</span></label>
                        <select name="status" className="form-control form-select" required value={form.status} onChange={onChange}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-6 mt-0">
                      <div className="form-group">
                        <label className="form-label">Select Team members</label>
                        <input
                          className="form-control"
                          placeholder="Search and select team or user"
                          list="combinedOptionsList"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          onBlur={(e) => handleCombinedSelection(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCombinedSelection(userInput);
                            }
                          }}
                        />

                        <datalist id="combinedOptionsList">
                          {combinedOptions.map((opt) => (
                            <option key={opt.value} value={opt.label} />
                          ))}
                        </datalist>

                        {form.user_id.length > 0 && (
                          <div className="mt-2" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {form.user_id.map((uid) => {
                              const u = users.find((x) => x._id === uid);
                              if (!u) return null;
                              return (
                                <span key={`tag-user-${uid}`} className="badge badge-primary" style={{ padding: '0px 10px' }}>
                                  {userLabel(u)} <button type="button" className="btn btn-link btn-sm" onClick={() => removeUser(uid)} style={{ color: '#fff', textDecoration: 'none', marginLeft: 6 }}>×</button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="mb-0">Description</label>
                        <div className="autocomplete-wrapper" style={{ position: 'relative', width: '100%' }}>
                          <pre className="textarea-autocomplete-shadow" style={{ position: 'absolute', top: 0, left: 0, padding: '0.375rem 0.75rem', zIndex: 1, color: 'rgba(0,0,0,0.3)', width: '100%', height: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-word', pointerEvents: 'none', overflow: 'hidden', lineHeight: '39px', fontSize: 12, margin: 0 }}>{descGhost}</pre>
                          <textarea className="form-control" maxLength={500} id="description" name="description" placeholder="Description" autoComplete="off" spellCheck={false} rows={3} value={form.description} onChange={(e) => { onChange(e); handleSuggest('description', setDescGhost)(e); }}></textarea>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="modal-footer1 text-center mt-3">
                  <button type="button" className="btn btn-danger btn-rounded btn-fw" onClick={() => navigate('/teams')}>Cancel</button>
                  <button type="submit" disabled={loading} className="btn btn-primary btn-rounded btn-fw" style={{ marginLeft: '8px' }}>{loading ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTeam;


