import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CalendarApi from "../../api/calendarApi";
import UsersApi from "../../api/usersApi";
import TeamsApi from "../../api/teamsApi";

const CalendarEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");

  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [participantMode, setParticipantMode] = useState('users');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [teamMembersMap, setTeamMembersMap] = useState({});

  useEffect(() => {
    (async () => {
      const formatDateTimeInput = (v) => {
        try {
          if (!v) return "";
          const d = new Date(v);
          if (Number.isNaN(d.getTime())) return String(v).slice(0, 16);
          const pad = (n) => String(n).padStart(2, '0');
          const s = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          return s;
        } catch { return String(v).slice(0, 16); }
      };
      const normalizeEvent = (raw) => {
        const ev = raw || {};
        return {
          title: ev.title || ev.name || '',
          description: ev.description || ev.details || '',
          start: ev.start || ev.start_date || ev.startDate || '',
          end: ev.end || ev.end_date || ev.endDate || '',
          color: ev.color || '#2563eb',
          link: ev.link || ev.meeting_link || '',
          assignments: Array.isArray(ev.assignments) ? ev.assignments : [],
        };
      };
      try {
        setLoading(true);
        const [detail, u, t] = await Promise.all([
          CalendarApi.getById(id).catch(() => null),
          UsersApi.list({ perpage: -1 }).catch(() => ({ data: [] })),
          TeamsApi.list({ perpage: -1 }).catch(() => ({ data: [] })),
        ]);
        setUsers(u?.data || []);
        setTeams(t?.data || []);
        let candidate = detail?.data || detail?.event || detail?.data?.data || null;
        // Fallback: fetch from list if direct endpoint not available
        if (!candidate) {
          try {
            const all = await CalendarApi.list({ perpage: -1 });
            const arr = all?.data || [];
            candidate = arr.find((x) => x?._id === id || x?.id === id) || null;
          } catch {}
        }
        const doc = normalizeEvent(candidate || {});
        setTitle(doc.title);
        setDescription(doc.description);
        setStart(formatDateTimeInput(doc.start));
        setEnd(formatDateTimeInput(doc.end));
        setColor(doc.color);
        setLink(doc.link);
        const fromUsers = doc.assignments.filter(a => a?.refType === 'user').map(a => a?.refId).filter(Boolean);
        const fromTeams = doc.assignments.filter(a => a?.refType === 'team').map(a => a?.refId).filter(Boolean);
        if (fromTeams.length > 0) setParticipantMode('teams');
        setSelectedUserIds(fromUsers);
        setSelectedTeamIds(fromTeams);
      } catch (e) {
        setError(e.message || 'Failed to load meeting');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const changeMode = (mode) => {
    setParticipantMode(mode);
    if (mode === 'users') {
      setSelectedTeamIds([]);
      setTeamMembersMap({});
    } else {
      setSelectedUserIds([]);
    }
  };

  const onUpdate = async () => {
    try {
      setError(""); setSaving(true);
      if (!title || !start || !end) { setError("Title, Start date and End date are required"); return; }
      const assignments = [
        ...selectedUserIds.map(id => ({ refType: 'user', refId: id, color })),
        ...selectedTeamIds.map(id => ({ refType: 'team', refId: id, color })),
      ];
      try {
        await CalendarApi.update(id, { title, description, start, end, color, link, assignments });
      } catch (e) {
        // If backend lacks update endpoint, attempt alternative PATCH then POST fallback
        try {
          if (CalendarApi.patch) {
            await CalendarApi.patch(id, { title, description, start, end, color, link, assignments });
          } else {
            throw e;
          }
        } catch {
          throw e;
        }
      }
      navigate('/calendar');
    } catch (e) {
      setError(e.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card mt-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">
        <h6 className="fw-semibold mb-0">Edit Meeting</h6>
        <div>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/calendar')}>Back</button>
        </div>
      </div>

      <div className="row card-body pt-0">
        <div className="col-12">
          {error && (<div className="alert alert-danger">{error}</div>)}

          {loading ? (
            <div>
              <div className="skeleton skeleton-line" style={{ width: '40%', height: 22, marginBottom: 10 }} />
              <div className="skeleton skeleton-line" style={{ width: '60%', height: 22, marginBottom: 10 }} />
              <div className="skeleton skeleton-line" style={{ width: '80%', height: 22, marginBottom: 10 }} />
            </div>
          ) : (
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
                      <button type="button" className={`btn btn-sm ${participantMode==='users'?'btn-primary':'btn-outline-primary'}`} onClick={()=> changeMode('users')}>Users</button>
                      <button type="button" className={`btn btn-sm ${participantMode==='teams'?'btn-primary':'btn-outline-primary'}`} onClick={()=> changeMode('teams')}>Teams</button>
                    </div>
                  </div>
                  <div className="col">
                    {participantMode==='users' ? (
                      <select className="form-control" value="" onChange={(e)=>{
                        const uid = e.target.value; if (!uid) return;
                        if (!selectedUserIds.includes(uid)) setSelectedUserIds([...selectedUserIds, uid]);
                        setTimeout(()=>{ try { e.target.value = ""; } catch {} }, 0);
                      }}>
                        <option value="">Select user…</option>
                        {users.map(u => (
                          <option key={u._id} value={u._id}>{`${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email}</option>
                        ))}
                      </select>
                    ) : (
                      <select className="form-control" value="" onChange={async (e)=>{
                        const tid = e.target.value; if (!tid) return;
                        if (!selectedTeamIds.includes(tid)) setSelectedTeamIds([...selectedTeamIds, tid]);
                        try {
                          const t = teams.find(x=>x._id===tid);
                          if (t) {
                            const detail = await TeamsApi.getById(tid);
                            const members = detail?.members || detail?.data?.members || [];
                            const names = members.map(m=> (m.name || `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim() || m.email)).filter(Boolean);
                            setTeamMembersMap(prev => ({ ...prev, [tid]: names }));
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
                      .pill { display: inline-flex; align-items: center; gap: 8px; padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(0,0,0,.1); background: #f8fafc; color: #111827; }
                      .pill.team { background: #eef6ff; border-color: #cfe0ff; color: #0b3d91; }
                      .pill .avatar { width: 18px; height: 18px; border-radius: 50%; background: #e5e7eb; display:inline-flex; align-items:center; justify-content:center; font-size: 10px; font-weight: 700; }
                      .pill .btn-x { border:0; background: transparent; font-weight:700; line-height:1; padding:0 2px; }
                    `}</style>
                    {selectedUserIds.map(uid => {
                      const u = users.find(x=>x._id===uid);
                      const label = u ? (`${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email) : uid;
                      const initials = (label || '').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
                      return (
                        <span key={`u-${uid}`} className="pill">
                          <span className="avatar">{initials}</span>
                          <span>{label}</span>
                          <button type="button" className="btn-x" onClick={()=> setSelectedUserIds(selectedUserIds.filter(x=>x!==uid))}>×</button>
                        </span>
                      );
                    })}
                    {selectedTeamIds.map(tid => {
                      const t = teams.find(x=>x._id===tid);
                      const label = t ? (t.title || t.name || 'Team') : tid;
                      return (
                        <span key={`t-${tid}`} className="pill team">
                          <span>{label}</span>
                          <button type="button" className="btn-x" onClick={()=> setSelectedTeamIds(selectedTeamIds.filter(x=>x!==tid))}>×</button>
                        </span>
                      );
                    })}
                  </div>
                )}
                {selectedTeamIds.map(tid => (
                  <div key={`tm-${tid}`} className="mt-2" style={{ marginLeft: 4 }}>
                    <small className="text-muted">Team members ({(teams.find(t=>t._id===tid)?.title || teams.find(t=>t._id===tid)?.name || 'Team')}): </small>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {(teamMembersMap[tid] || []).map((n, i) => (
                        <span key={i} className="badge bg-light text-dark">{n}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="btn btn-primary btn-sm" onClick={onUpdate} disabled={saving || loading}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
};

export default CalendarEdit;



