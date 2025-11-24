import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CalendarApi from "../../api/calendarApi";
import UsersApi from "../../api/usersApi";
import TeamsApi from "../../api/teamsApi";
import EngagementApi from "../../api/engagementApi";
import ProjectsApi from "../../api/projectsApi";

const CalendarCreate = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [participantMode, setParticipantMode] = useState('users');
  const [teamMembersMap, setTeamMembersMap] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [addToEngagementTracker, setAddToEngagementTracker] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [u, t, p] = await Promise.all([
          UsersApi.list({ perpage: -1 }).catch(() => ({ data: [] })),
          TeamsApi.list({ perpage: -1 }).catch(() => ({ data: [] })),
          ProjectsApi.list({ perpage: -1 }).catch(() => ({ data: [] })),
        ]);
        setUsers(u?.data || []);
        setTeams(t?.data || []);
        setProjects(p?.data || []);
      } catch {}
    })();
  }, []);

  const changeMode = (mode) => {
    setParticipantMode(mode);
    if (mode === 'users') {
      // Clear teams when switching to users
      setSelectedTeamIds([]);
      setTeamMembersMap({});
    } else {
      // Clear users when switching to teams
      setSelectedUserIds([]);
    }
  };

  const onCreate = async () => {
    try {
      setError(""); setSaving(true);
      if (!title || !start || !end) { setError("Title, Start date and End date are required"); return; }
      
      // Validate project selection if adding to engagement tracker
      if (addToEngagementTracker && !selectedProject) {
        setError("Please select a project to add this meeting to the Engagement Tracker");
        setSaving(false);
        return;
      }
      
      const assignments = [
        ...selectedUserIds.map(id => ({ refType: 'user', refId: id, color })),
        ...selectedTeamIds.map(id => ({ refType: 'team', refId: id, color })),
      ];
      const res = await CalendarApi.create({ title, description, start, end, color, link, assignments });
      const newId = res?.data?.id || res?.data?.data?.id;
      try { if (newId) await CalendarApi.invite(newId, {}); } catch {}

      // If "Add to Engagement Tracker" is checked, create engagement record
      if (addToEngagementTracker && selectedProject) {
        try {
          const startDate = new Date(start);
          const engageDate = startDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
          
          // Determine engagement type based on link presence
          const engageType = link && link.trim() ? "Online meeting" : "In person meeting";
          
          // Default purpose to "Other" (required field)
          const purpose = "Other";
          
          // Calculate number of people (at least 1)
          const engageNum = Math.max(1, selectedUserIds.length + (selectedTeamIds.length * 2));
          
          // Create form data for engagement
          const formData = new FormData();
          formData.append('engage_date', engageDate);
          formData.append('engage_type', engageType);
          formData.append('purpose', purpose);
          formData.append('engage_num', engageNum.toString());
          formData.append('outcome', description || title || "Meeting scheduled");
          formData.append('project', selectedProject);
          
          // Note: Hapū is required but we can't determine it from calendar
          // We'll skip hapu for now - users can edit the engagement later to add proper hapus
          
          await EngagementApi.create(formData);
        } catch (engagementErr) {
          console.error("Failed to create engagement:", engagementErr);
          // Don't fail the whole operation if engagement creation fails
        }
      }

      navigate('/calendar');
    } catch (e) { setError(e.message || 'Failed to create'); }
    finally { setSaving(false); }
  };

  return (
    <div className="card mt-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">
        <h6 className="fw-semibold mb-0">Create Meeting</h6>
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/calendar')}>Back</button>
        </div>
      </div>

      <div className="row card-body pt-0">
        <div className="col-12">
          {error && (<div className="alert alert-danger">{error}</div>)}

            <div className="row g-2 mb-3">
            <div className="col-sm-12 col-md-3"><label>Title</label><input className="form-control" value={title} onChange={(e)=> setTitle(e.target.value)} placeholder="Meeting title" /></div>
            <div className="col-sm-6 col-md-2"><label>Start</label><input type="datetime-local" className="form-control" value={start} onChange={(e)=> setStart(e.target.value)} /></div>
            <div className="col-sm-6 col-md-2"><label>End</label><input type="datetime-local" className="form-control" value={end} onChange={(e)=> setEnd(e.target.value)} /></div>
            <div className="col-sm-6 col-md-1"><label>Color</label><input type="color" className="form-control form-control-color" value={color} onChange={(e)=> setColor(e.target.value)} /></div>
            <div className="col-sm-12 col-md-4"><label>Meeting Link (Teams/Zoom/etc)</label><input className="form-control" value={link} onChange={(e)=> setLink(e.target.value)} placeholder="Paste meeting link (optional)" /></div>
              <div className="col-12"><label>Description</label><textarea className="form-control" rows={3} value={description} onChange={(e)=> setDescription(e.target.value)} placeholder="Description"></textarea></div>

            <div className="col-12">
              <label>Participants</label>
              <div className="row g-2 align-items-center mb-2">
                <div className="col-auto">
                  <div className="btn-group" role="group" aria-label="participant-mode">
                    <button type="button" className={`btn btn-sm ${participantMode==='users'?'btn-primary':'btn-success'}`} onClick={()=> changeMode('users')}>Users</button>
                    <button type="button" className={`btn btn-sm ${participantMode==='teams'?'btn-primary':'btn-success'}`} onClick={()=> changeMode('teams')}>Teams</button>
                  </div>
                </div>
                <div className="col">
                  {participantMode==='users' ? (
                    <select className="form-control" value="" onChange={(e)=>{
                      const id = e.target.value; if (!id) return;
                      if (!selectedUserIds.includes(id)) setSelectedUserIds([...selectedUserIds, id]);
                      setTimeout(()=>{ try { e.target.value = ""; } catch {} }, 0);
                    }}>
                      <option value="">Select user…</option>
                      {users.map(u => (
                        <option key={u._id} value={u._id}>{`${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email}</option>
                      ))}
                    </select>
                  ) : (
                    <select className="form-control" value="" onChange={async (e)=>{
                      const id = e.target.value; if (!id) return;
                      if (!selectedTeamIds.includes(id)) setSelectedTeamIds([...selectedTeamIds, id]);
                      try {
                        const t = teams.find(x=>x._id===id);
                        if (t) {
                          const detail = await TeamsApi.getById(id);
                          const members = detail?.members || detail?.data?.members || [];
                          const names = members.map(m=> (m.name || `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim() || m.email)).filter(Boolean);
                          setTeamMembersMap(prev => ({ ...prev, [id]: names }));
                        }
                      } catch {}
                      setTimeout(()=>{ try { e.target.value = ""; } catch {} }, 0);
                    }}>
                      <option value="">Select team…</option>
                      {teams.map(t => (
                        <option key={t._id} value={t._id}>{t.title || t.name || 'Team'}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              {(selectedUserIds.length>0 || selectedTeamIds.length>0) && (
                <div className="d-flex flex-wrap gap-2">
                  <style>{`
                    .pill {
                      display: inline-flex; align-items: center; gap: 8px;
                      padding: 4px 10px; border-radius: 9999px;
                      border: 1px solid rgba(0,0,0,.1);
                      background: #f8fafc; color: #111827;
                    }
                    .pill.team { background: #eef6ff; border-color: #cfe0ff; color: #0b3d91; }
                    .pill .avatar { width: 18px; height: 18px; border-radius: 50%; background: #e5e7eb; display:inline-flex; align-items:center; justify-content:center; font-size: 10px; font-weight: 700; }
                    .pill .btn-x { border:0; background: transparent; font-weight:700; line-height:1; padding:0 2px; }
                  `}</style>
                  {selectedUserIds.map(id => {
                    const u = users.find(x=>x._id===id);
                    const label = u ? (`${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email) : id;
                    const initials = (label || '').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
                    return (
                      <span key={`u-${id}`} className="pill">
                        <span className="avatar">{initials}</span>
                        <span>{label}</span>
                        <button type="button" className="btn-x" onClick={()=> setSelectedUserIds(selectedUserIds.filter(x=>x!==id))}>×</button>
                      </span>
                    );
                  })}
                  {selectedTeamIds.map(id => {
                    const t = teams.find(x=>x._id===id);
                    const label = t ? (t.title || t.name || 'Team') : id;
                    return (
                      <span key={`t-${id}`} className="pill team">
                        <span>{label}</span>
                        <button type="button" className="btn-x" onClick={()=> setSelectedTeamIds(selectedTeamIds.filter(x=>x!==id))}>×</button>
                      </span>
                    );
                  })}
                </div>
              )}
              {selectedTeamIds.map(id => (
                <div key={`tm-${id}`} className="mt-2" style={{ marginLeft: 4 }}>
                  <small className="text-muted">Team members ({(teams.find(t=>t._id===id)?.title || teams.find(t=>t._id===id)?.name || 'Team')}): </small>
                  <div className="d-flex flex-wrap gap-1 mt-1">
                    {(teamMembersMap[id] || []).map((n, i) => (
                      <span key={i} className="badge bg-light text-dark">{n}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Project Selection */}
            <div className="col-12 mb-3">
              <label className="form-label">Project</label>
              <select 
                className="form-control" 
                value={selectedProject} 
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Add to Engagement Tracker Checkbox */}
            <div className="col-12 mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="add_to_engagement_tracker"
                  style={{ marginLeft: "5px" }}
                  checked={addToEngagementTracker}
                  onChange={(e) => setAddToEngagementTracker(e.target.checked)}
                />
                <label className="form-check-label" style={{padding: "7px"}} htmlFor="add_to_engagement_tracker">
                  Add to Engagement Tracker
                </label>
              </div>
            </div>
          </div>

          <button className="btn btn-primary btn-sm" onClick={onCreate} disabled={saving}>{saving ? 'Saving…' : 'Create Meeting'}</button>
        </div>
      </div>
    </div>
  );
};

export default CalendarCreate;


