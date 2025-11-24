import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import CalendarApi from "../../api/calendarApi";
import UsersApi from "../../api/usersApi";
import TeamsApi from "../../api/teamsApi";

const CalendarPage = () => {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'calendar'
  const [currentDate, setCurrentDate] = useState(new Date()); // anchor for calendar view
  const [calendarView, setCalendarView] = useState('month'); // 'day' | 'week' | 'month' | 'schedule'
  const [now, setNow] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [invitingMap, setInvitingMap] = useState({}); // id -> boolean
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, title }
  const [viewportW, setViewportW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [usersMap, setUsersMap] = useState({}); // id -> display name
  const [teamsMap, setTeamsMap] = useState({}); // id -> { name, members: string[] }

  const load = async () => {
    setLoading(true);
    try {
      const [res, usersRes] = await Promise.all([
        CalendarApi.list({}),
        UsersApi.list({ perpage: -1 }).catch(() => ({ data: [] })),
      ]);
      setEvents(res?.data || []);
      const ulist = usersRes?.data || [];
      const umap = {};
      for (const u of ulist) {
        const name = (`${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()) || u.email || 'User';
        if (u._id) umap[u._id] = name;
      }
      setUsersMap(umap);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth || 1200);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onDelete = async (id) => { try { await CalendarApi.remove(id); await load(); } catch {} };

  const showToast = (text, kind = 'success', pos) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, text, kind, pos }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200);
  };

  const copyToClipboard = async (text, anchorEl) => {
    try {
      await navigator.clipboard.writeText(String(text || ''));
      let pos;
      try {
        if (anchorEl && anchorEl.getBoundingClientRect) {
          const r = anchorEl.getBoundingClientRect();
          pos = {
            top: Math.max(12, r.top + window.scrollY - 8),
            left: Math.min(window.scrollX + window.innerWidth - 240, r.right + window.scrollX + 8),
          };
        }
      } catch {}
      showToast('Meeting link copied', 'success', pos);
    } catch {
      showToast('Unable to copy', 'error');
    }
  };

  const handleInvite = async (ev) => {
    const id = ev?._id;
    if (!id || invitingMap[id]) return;
    setInvitingMap((m) => ({ ...m, [id]: true }));
    try {
      const startStr = ev.start ? formatDateTime(new Date(ev.start)) : '';
      const endStr = ev.end ? formatDateTime(new Date(ev.end)) : '';
      const subject = `Meeting invite: ${ev.title || 'Meeting'}`;
      const message = [
        'You are invited to a meeting.',
        `Title: ${ev.title || 'Meeting'}`,
        startStr ? `Start: ${startStr}` : '',
        endStr ? `End: ${endStr}` : '',
        ev.link ? `Link: ${ev.link}` : ''
      ].filter(Boolean).join('\n');
      await CalendarApi.invite(id, { subject, message });
      setEvents((prev) => prev.map(r => r._id === id ? { ...r, invite_sent: true } : r));
      showToast('Invites sent');
    } catch (e) {
      showToast(e?.message || 'Invite failed', 'error');
    } finally {
      setInvitingMap((m) => ({ ...m, [id]: false }));
    }
  };

  // Prompt to mark meeting done when user returns after opening the meeting link
  useEffect(() => {
    const onFocus = () => {
      try {
        const keys = Object.keys(sessionStorage).filter(k => k.startsWith('meeting_opened_'));
        for (const k of keys) {
          const id = k.replace('meeting_opened_', '');
          const ev = events.find(e => String(e._id) === String(id));
          if (!ev) continue;
          // Show modal-like prompt
          // setToasts((t) => [...t, { id: `prompt_${id}`, text: `Was "${ev.title || 'meeting'}" completed?`, kind: 'prompt', pos: { top: 70, left: 20 } }]);
          // attach a lightweight prompt handler via confirmDelete-style modal would be too intrusive; reuse toast as CTA
          // We will open a small modal below
          setDonePrompt({ id, title: ev.title || 'Meeting' });
          break;
        }
      } catch {}
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [events]);

  const [donePrompt, setDonePrompt] = useState(null); // { id, title }
  const markDone = async (id) => {
    try {
      await CalendarApi.update(id, { is_done: true });
      setEvents((prev) => prev.map(r => r._id === id ? { ...r, is_done: true } : r));
      try { sessionStorage.removeItem(`meeting_opened_${id}`); } catch {}
      showToast('Marked as done');
    } catch (e) {
      showToast(e?.message || 'Failed to mark done', 'error');
    } finally {
      setDonePrompt(null);
    }
  };
  // Load team members for teams referenced in current events
  useEffect(() => {
    (async () => {
      try {
        const teamIds = new Set();
        for (const ev of events) {
          const assigns = Array.isArray(ev?.assignments) ? ev.assignments : [];
          for (const a of assigns) if (a?.refType === 'team' && a?.refId) teamIds.add(a.refId);
        }
        const toFetch = Array.from(teamIds).filter(id => !teamsMap[id]);
        if (!toFetch.length) return;
        const results = await Promise.all(toFetch.map(id => TeamsApi.getById(id).catch(() => null)));
        const tmap = {};
        toFetch.forEach((id, i) => {
          const detail = results[i];
          const payload = detail?.data || detail || {};
          const name = payload?.title || payload?.name || 'Team';
          const members = (payload?.members || []).map(m => (m.name || `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim() || m.email)).filter(Boolean);
          tmap[id] = { name, members };
        });
        if (Object.keys(tmap).length) setTeamsMap(prev => ({ ...prev, ...tmap }));
      } catch {}
    })();
  }, [events]);

  const renderParticipants = (ev) => {
    try {
      // Prefer explicit participants/attendees if provided
      const direct = Array.isArray(ev.participants) ? ev.participants : (Array.isArray(ev.attendees) ? ev.attendees : null);
      if (direct) {
        const names = direct.map(p => p?.name || `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || p?.email).filter(Boolean);
        if (names.length) return names.join(', ');
      }
      const assigns = Array.isArray(ev.assignments) ? ev.assignments : [];
      if (!assigns.length) return '-';
      const parts = [];
      for (const a of assigns) {
        if (a?.refType === 'user' && a?.refId) {
          const uname = usersMap[a.refId] || 'User';
          parts.push(uname);
        } else if (a?.refType === 'team' && a?.refId) {
          const t = teamsMap[a.refId];
          if (t) {
            const label = t.members && t.members.length ? `${t.name}: ${t.members.join(', ')}` : t.name;
            parts.push(label);
          } else {
            parts.push('Team');
          }
        }
      }
      return parts.length ? parts.join(', ') : '-';
    } catch { return '-'; }
  };

  const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const startOfCalendar = (d) => {
    const first = startOfMonth(d);
    const offset = first.getDay(); // 0..6 (Sun..Sat)
    const s = new Date(first);
    s.setDate(first.getDate() - offset);
    return s;
  };
  const startOfWeek = (d) => { const s = new Date(d); s.setDate(s.getDate() - s.getDay()); return s; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const NZ_TZ = 'Pacific/Auckland';
  const formatTime = (d) => {
    try {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: NZ_TZ });
    } catch { return ''; }
  };
  const formatDate = (d) => {
    try {
      return d.toLocaleString([], { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', timeZone: NZ_TZ });
    } catch { return ''; }
  };
  const formatDateTime = (d) => {
    try {
      return d.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: NZ_TZ });
    } catch { return ''; }
  };
  const formatDuration = (start, end) => {
    try {
      const ms = Math.max(0, new Date(end) - new Date(start));
      const mins = Math.round(ms / 60000);
      const h = Math.floor(mins / 60); const m = mins % 60;
      if (h && m) return `${h}h ${m}m`;
      if (h) return `${h}h`;
      return `${m}m`;
    } catch { return ''; }
  };
  const getNZDateString = (d) => d.toLocaleDateString('en-NZ', { timeZone: NZ_TZ });
  const isSameDay = (a, b) => getNZDateString(a) === getNZDateString(b);
  const monthLabel = (d) => d.toLocaleString(undefined, { month: 'long', year: 'numeric', timeZone: NZ_TZ });
  const dayLabel = (d) => d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', timeZone: NZ_TZ });
  const weekLabel = (d) => {
    const s = startOfWeek(d);
    const e = addDays(s, 6);
    return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: NZ_TZ })} - ${e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: NZ_TZ })}`;
  };

  const shiftCurrent = (dir) => {
    if (calendarView === 'month' || calendarView === 'schedule') {
      const nd = new Date(currentDate);
      nd.setMonth(nd.getMonth() + dir);
      setCurrentDate(nd);
    } else if (calendarView === 'week') {
      setCurrentDate(addDays(currentDate, dir * 7));
    } else {
      setCurrentDate(addDays(currentDate, dir));
    }
  };

  return (
    <>
      {/* Top-right global toolbar */}
      {/* Toasts */}
      {/* Anchored toasts near triggers */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:1060 }}>
        {toasts.filter(t => !!t.pos).map(t => (
          <div key={t.id} style={{
            position:'absolute', top: t.pos.top, left: t.pos.left,
            display:'inline-flex', alignItems:'center', gap:10, pointerEvents:'none',
            background: t.kind === 'error' ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
            color:'#fff', padding:'8px 12px', borderRadius:10,
            boxShadow:'0 8px 16px rgba(0,0,0,0.15)', fontWeight:600, fontSize:12
          }}>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
      {/* Global stack (fallback) */}
      <div style={{ position:'fixed', top: 20, right: 20, zIndex: 1059, display:'flex', flexDirection:'column', gap:10 }}>
        {toasts.filter(t => !t.pos).map(t => (
          <div key={t.id} style={{
            display:'flex', alignItems:'center', gap:12,
            background: t.kind === 'error' ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
            color: '#fff', padding: '10px 14px', borderRadius: 12,
            boxShadow: '0 10px 20px rgba(0,0,0,0.15)', minWidth: 220
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', opacity: 0.9 }}></div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{t.text}</div>
          </div>
        ))}
      </div>
      {/* /Toasts */}

      <div className="d-flex justify-content-end align-items-center gap-2 mb-2 mt-2">
        <div className="btn-group" role="group" aria-label="mode">
          <button type="button" className={`btn btn-sm ${viewMode==='table'?'btn-primary':'btn-outline-primary'}`} onClick={()=> setViewMode('table')}>Table</button>
          <button type="button" className={`btn btn-sm ${viewMode==='calendar'?'btn-primary':'btn-outline-primary'}`} onClick={()=> setViewMode('calendar')}>Calendar</button>
        </div>
        <NavLink to="/calendar/create" className="btn btn-primary btn-sm">Create Meeting</NavLink>
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="modal-backdrop" onClick={()=> setConfirmDelete(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:1050, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div className="card" onClick={(e)=> e.stopPropagation()} style={{ maxWidth: 420, width: '92%', borderRadius: 12, boxShadow:'0 10px 30px rgba(0,0,0,0.2)', border: 'none' }}>
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between mb-2">
                <h6 className="fw-semibold mb-0" style={{ fontSize: 18 }}>Delete meeting?</h6>
                <button className="btn btn-sm" onClick={() => setConfirmDelete(null)} style={{ background: '#e5e7eb', color: '#111827', border: 'none', borderRadius: 999, padding: '6px 14px', fontWeight: 700 }}>Close</button>
              </div>
              <div className="text-muted" style={{ fontSize: 14 }}>This action cannot be undone.</div>
              <div className="mt-3" style={{ background:'#f9fafb', borderRadius:8, padding:'10px 12px' }}>
                <strong>Title:</strong> <span className="text-muted">{confirmDelete.title || 'Meeting'}</span>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button className="btn btn-secondary btn-sm" onClick={()=> setConfirmDelete(null)}>Cancel</button>
                <button className="btn btn-danger btn-sm" onClick={async ()=> { const id = confirmDelete.id; setConfirmDelete(null); await onDelete(id); showToast('Meeting deleted'); }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Done prompt modal */}
      {donePrompt && (
        <div className="modal-backdrop" onClick={()=> setDonePrompt(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:1050, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div className="card" onClick={(e)=> e.stopPropagation()} style={{ maxWidth: 500, width: '92%', borderRadius: 14, overflow:'hidden', border: 'none', boxShadow:'0 20px 40px rgba(0,0,0,0.25)' }}>
            <div style={{ background: 'linear-gradient(135deg,#3b82f6 0%, #06b6d4 100%)', color:'#fff', padding:'14px 18px' }}>
              <h6 className="mb-0" style={{ fontSize: 18, fontWeight: 700 }}>Mark meeting as completed</h6>
            </div>
            <div className="card-body" style={{ padding: '18px' }}>
              <div className="mb-2" style={{ fontSize: 15, color:'#111827' }}>Was this meeting completed?</div>
              <div className="text-muted mb-3" style={{ fontSize: 14 }}>{donePrompt.title}</div>
              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-secondary btn-sm" onClick={()=> { try { sessionStorage.removeItem(`meeting_opened_${donePrompt.id}`); } catch {}; setDonePrompt(null); }}>Not yet</button>
                <button className="btn btn-primary btn-sm" onClick={()=> markDone(donePrompt.id)} style={{ background:'linear-gradient(135deg,#10b981 0%, #34d399 100%)', border:'none' }}>Yes, mark done</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="card mt-1">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">
        <h6 className="fw-semibold mb-0">My Calendar</h6>
        <div className="d-flex align-items-center gap-2">
          {viewMode === 'calendar' && (() => {
            const primary = '#06b6d4';
            const inactive = '#0369a1';
            const seg = (active, isFirst, isLast) => ({
              background: active ? primary : '#ffffff',
              color: active ? '#ffffff' : inactive,
              border: 'none',
              borderLeft: isFirst ? 'none' : `1px solid ${primary}`,
              padding: '6px 16px',
              fontWeight: 700,
              borderRadius: 0,
            });
            return (
              <div style={{ display: 'inline-flex', border: `1px solid ${primary}`, borderRadius: 999, overflow: 'hidden', background: '#fff' }}>
                <button type="button" className="btn btn-sm" style={{ ...seg(calendarView==='day', true, false), borderTopLeftRadius: 999, borderBottomLeftRadius: 999 }} onClick={()=> setCalendarView('day')}>Day</button>
                <button type="button" className="btn btn-sm" style={seg(calendarView==='week', false, false)} onClick={()=> setCalendarView('week')}>Week</button>
                <button type="button" className="btn btn-sm" style={seg(calendarView==='month', false, false)} onClick={()=> setCalendarView('month')}>Month</button>
                <button type="button" className="btn btn-sm" style={{ ...seg(calendarView==='schedule', false, true), borderTopRightRadius: 999, borderBottomRightRadius: 999 }} onClick={()=> setCalendarView('schedule')}>By Schedule</button>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="row card-body pt-0">
        <div className="col-12">
          {error && (<div className="alert alert-danger">{error}</div>)}
          {viewMode === 'table' ? (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Color</th>
                    <th>Participants</th>
                    <th>Invited</th>
                    <th>Done</th>
                    <th>Link</th>
                    <th style={{ width: 180, minWidth: 140 }} className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody aria-busy={loading}>
                  {(loading ? Array.from({ length: 8 }) : events).map((ev, idx) => (
                    loading ? (
                      <tr key={`sk-${idx}`} aria-hidden="true">
                        <td><div className="skeleton skeleton-line" style={{ width: "70%" }} /></td>
                        <td><div className="skeleton skeleton-line" style={{ width: "80%" }} /></td>
                        <td><div className="skeleton skeleton-line" style={{ width: "80%" }} /></td>
                        <td><div className="skeleton skeleton-line" style={{ width: "80%" }} /></td>
                        <td><div className="skeleton" style={{ width: 16, height: 16, borderRadius: 3 }} /></td>
                        <td><div className="skeleton skeleton-line" style={{ width: "70%" }} /></td>
                        <td><div className="skeleton" style={{ width: 18, height: 18, borderRadius: 4 }} /></td>
                        <td><div className="skeleton" style={{ width: 18, height: 18, borderRadius: 4 }} /></td>
                        <td><div className="skeleton skeleton-line" style={{ width: "50%" }} /></td>
                        <td className="text-center">
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
                            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
                            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
                          </div>
                        </td>
                      </tr>
                    ) : (
                    <tr key={ev._id}>
                      <td>{ev.title}</td>
                      <td>
                        <span title={ev.description || ''} style={{ display:'inline-block', maxWidth:260, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', verticalAlign:'middle',}}>
                          {ev.description ? ev.description : '-'}
                        </span>
                      </td>
                      <td>{ev.start ? formatDateTime(new Date(ev.start)) : '-'}</td>
                      <td>{ev.end ? formatDateTime(new Date(ev.end)) : '-'}</td>
                      <td><span style={{ display:'inline-block', width:16, height:16, background: ev.color, borderRadius: 3 }} /></td>
                      <td>{renderParticipants(ev)}</td>
                      <td>
                        {ev.invite_sent ? (
                          <span title="Invites sent" style={{ color:'#16a34a' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </span>
                        ) : (
                          <span title="Not sent" style={{ color:'#94a3b8' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"></circle></svg>
                          </span>
                        )}
                      </td>
                      <td>
                        {ev.is_done ? (
                          <span title="Completed" style={{ color:'#16a34a' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </span>
                        ) : (
                          <span title="Not done" style={{ color:'#94a3b8' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"></circle></svg>
                          </span>
                        )}
                      </td>
                      <td>
                        {ev.link ? (
                          <div className="d-flex align-items-center gap-2">
                            <a href={ev.link} target="_blank" rel="noreferrer" onClick={()=> { try { sessionStorage.setItem(`meeting_opened_${ev._id}`, String(Date.now())); } catch {} }}>Join Meeting</a>
                            <button
                              className="btn btn-sm"
                              title="Copy link"
                              onClick={(e) => copyToClipboard(ev.link, e.currentTarget)}
                              style={{
                                width: 34,
                                height: 30,
                                padding: 0,
                                borderRadius: 8,
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#2563eb',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#2563eb'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-copy align-middle">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td className="text-center">
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', rowGap: 6 }}>
                          <button
                            className="btn badge-info btn-sm btn-rounded btn-icon"
                            title="Send Invite"
                            disabled={!!invitingMap[ev._id]}
                            onClick={() => handleInvite(ev)}
                          >
                            {invitingMap[ev._id] ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="align-middle" style={{ animation: 'spin 1s linear infinite' }}>
                                <circle cx="12" cy="12" r="9" style={{ opacity: 0.25 }}></circle>
                                <path d="M12 3a9 9 0 0 1 9 9" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-send align-middle">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                              </svg>
                            )}
                          </button>
                          <NavLink to={`/calendar/${ev._id}/edit`} className="btn badge-success btn-sm btn-rounded btn-icon" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-edit-2 align-middle">
                              <polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon>
                            </svg>
                          </NavLink>
                          <button className="btn badge-danger btn-sm btn-rounded btn-icon" title="Delete" onClick={()=> setConfirmDelete({ id: ev._id, title: ev.title })}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trash align-middle">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    )
                  ))}
                  {!loading && events.length === 0 && (
                    <tr><td colSpan={10} className="text-center py-3">No meetings yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              {/* Calendar navigation */}
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  {(() => {
                    const primary = '#06b6d4';
                    const circle = { width: 32, height: 32, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: primary, color: '#fff', border: 'none', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)' };
                    return (
                      <>
                        <button className="btn btn-sm" style={{ background: primary, color: '#fff', border: 'none', borderRadius: 999, padding: '6px 14px', fontWeight: 700 }} onClick={() => setCurrentDate(new Date())}>Today</button>
                        <button className="btn btn-sm" style={circle} onClick={() => shiftCurrent(-1)} aria-label="Previous">‹</button>
                        <button className="btn btn-sm" style={circle} onClick={() => shiftCurrent(1)} aria-label="Next">›</button>
                      </>
                    );
                  })()}
                </div>
                <div className="fw-semibold" style={{marginLeft: '30px',marginTop: '10px'}}>
                  {calendarView==='day' && dayLabel(currentDate)}
                  {calendarView==='week' && weekLabel(currentDate)}
                  {calendarView==='month' && monthLabel(currentDate)}
                  {calendarView==='schedule' && `Schedule – ${monthLabel(currentDate)}`}
                </div>
                <div style={{ width: 140 }}></div>
              </div>
              {calendarView !== 'schedule' && (
                <>
                  {/* Headers */}
                  {(() => {
                    const names = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                    const minMonthWidth = viewportW < 768 ? 720 : 'auto';
                    const minDWWidth = viewportW < 768 ? 900 : 'auto';
                    if (calendarView === 'month') {
                      return (
                        <div className="row g-0" style={{ minWidth: minMonthWidth, border: '1px solid #cbd5e1', borderBottom: 'none' }}>
                          {names.map((d, i) => (
                            <div key={`headm-${i}`} className="col" style={{ padding: 8, background: '#f8fafc', borderRight: i < 6 ? '1px solid #cbd5e1':'none', fontWeight: 600, fontSize: 12 }}>{d}</div>
                          ))}
                        </div>
                      );
                    }
                    // day/week header with time gutter
                    const cols = calendarView === 'day' ? 1 : 7;
                    const firstIdx = currentDate.getDay();
                    const labels = calendarView === 'day' ? [names[firstIdx]] : names;
                    return (
                      <div className="row g-0" style={{ minWidth: minDWWidth, border: '1px solid #cbd5e1', borderBottom: 'none', display: 'grid', gridTemplateColumns: `70px repeat(${cols}, 1fr)` }}>
                    <div style={{ padding: 8, background: '#f8fafc', borderRight: '1px solid #cbd5e1' }}></div>
                    {Array.from({ length: cols }).map((_, i) => {
                      const base = startOfWeek(currentDate);
                      const cellDate = calendarView === 'day' ? new Date(currentDate) : addDays(base, i);
                      const isTodayCell = isSameDay(cellDate, now);
                      return (
                        <div
                          key={`headh-${i}`}
                          style={{
                            padding: 10,
                            background: isTodayCell ? '#eef6ff' : '#f8fafc',
                            borderRight: i < cols-1 ? '1px solid #cbd5e1' : 'none',
                            fontWeight: 700,
                            fontSize: 13,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][cellDate.getDay()]}</span>
                            {isTodayCell && (
                              <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{cellDate.getDate()}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                    );
                  })()}

                  {/* Grid */}
                  {calendarView === 'month' ? (
                    <div style={{ overflowX: viewportW < 768 ? 'auto' : 'visible' }}>
                      <div className="row g-0" style={{ minWidth: viewportW < 768 ? 720 : 'auto', border: '1px solid #cbd5e1', borderTop: 'none' }}>
                      {(() => {
                        const start = startOfCalendar(currentDate);
                        const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
                        if (loading) {
                          return days.map((d, i) => (
                            <div key={`skm-${i}`} className="col" style={{ width: `${100/7}%`, flex: '0 0 auto', borderRight: (i % 7) !== 6 ? '1px solid #cbd5e1':'none', borderBottom: i < 35 ? '1px solid #cbd5e1':'none', minHeight: 120, padding: 6 }}>
                              <div className="skeleton skeleton-line" style={{ width: 40 }} />
                              <div className="skeleton" style={{ width: '90%', height: 16, borderRadius: 4, marginTop: 6 }} />
                              <div className="skeleton" style={{ width: '70%', height: 16, borderRadius: 4, marginTop: 6 }} />
                            </div>
                          ));
                        }
                        return days.map((d, i) => {
                          const dayEvents = events.filter(ev => { try { return isSameDay(new Date(ev.start), d); } catch { return false; } });
                          const isOtherMonth = d.getMonth() !== currentDate.getMonth();
                          const isTodayCell = isSameDay(d, now);
                          return (
                            <div key={`dm-${i}`} className="col" style={{ width: `${100/7}%`, flex: '0 0 auto', borderRight: (i % 7) !== 6 ? '1px solid #cbd5e1':'none', borderBottom: i < 35 ? '1px solid #cbd5e1':'none', minHeight: 120, padding: 6, background: 'white' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: isOtherMonth ? '#9ca3af' : '#111827', display:'flex', alignItems:'center', gap:6 }}>
                                {isTodayCell ? (
                                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{d.getDate()}</span>
                                ) : (
                                  <span>{d.getDate()}</span>
                                )}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                                {dayEvents.map(ev => (
                                  <div key={ev._id} title={ev.title} onClick={() => setSelectedEvent(ev)} style={{ background: ev.color || '#2563eb', color: 'white', borderRadius: 6, padding: '3px 6px', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                                    <span style={{ opacity: 0.9 }}>{formatTime(new Date(ev.start))}</span> {ev.title}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        });
                      })()}
                      </div>
                    </div>
                  ) : (
                    // day/week time grid with hour marks
                    <div style={{ position: 'relative', overflowX: viewportW < 768 ? 'auto' : 'visible' }}>
                      <div style={{ minWidth: viewportW < 768 ? 900 : 'auto', border: '1px solid #cbd5e1', borderTop: 'none', display: 'grid', gridTemplateColumns: `70px repeat(${calendarView==='day'?1:7}, 1fr)` }}>
                        {(() => {
                        const cols = calendarView === 'day' ? 1 : 7;
                        const base = calendarView === 'week' ? startOfWeek(currentDate) : new Date(currentDate);
                        const days = Array.from({ length: cols }, (_, i) => addDays(base, i));
                        const hours = Array.from({ length: 24 }, (_, h) => h);
                        if (loading) {
                          return hours.flatMap((h, ri) => [
                            <div key={`hlbl-${ri}`} style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #e2e8f0', padding: '8px 10px', fontSize: 12, color: '#475569', fontWeight: 600 }}>{`${h === 0 ? '12 AM' : (h < 12 ? `${h} AM` : (h === 12 ? '12 PM' : `${h-12} PM`))}`}</div>,
                            ...Array.from({ length: cols }).map((_, ci) => (
                              <div key={`skcell-${ri}-${ci}`} style={{ borderRight: ci<cols-1 ? '1px solid #e2e8f0':'none', borderBottom: '1px solid #e2e8f0', minHeight: 48, padding: 4 }}>
                                <div className="skeleton" style={{ width: '70%', height: 12, borderRadius: 4 }} />
                              </div>
                            ))
                          ]);
                        }
                        return hours.flatMap((h, ri) => [
                          <div key={`hour-${ri}`} style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #e2e8f0', padding: '8px 10px', fontSize: 12, color: '#475569', fontWeight: 600 }}>{`${h === 0 ? '12 AM' : (h < 12 ? `${h} AM` : (h === 12 ? '12 PM' : `${h-12} PM`))}`}</div>,
                          ...days.map((d, ci) => {
                            const slotEvents = events.filter(ev => { try { const sd = new Date(ev.start); const nzHour = Number(new Intl.DateTimeFormat('en-NZ', { hour: 'numeric', hour12: false, timeZone: NZ_TZ }).format(sd)); return isSameDay(sd, d) && nzHour === h; } catch { return false; } });
                            return (
                              <div key={`cell-${ri}-${ci}`} style={{ borderRight: ci<cols-1 ? '1px solid #e2e8f0':'none', borderBottom: '1px solid #e2e8f0', minHeight: 48, padding: 4 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {slotEvents.map(ev => (
                                    <div key={ev._id} title={ev.title} onClick={() => setSelectedEvent(ev)} style={{ background: ev.color || '#2563eb', color: 'white', borderRadius: 6, padding: '2px 6px', fontSize: 12, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                                      {ev.title}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })
                        ]);
                        })()}
                      </div>
                      {(() => {
                        // Current time indicator (only for today within range)
                        const hourHeight = 48; // px per hour
                        const minutesFromMidnight = now.getHours() * 60 + now.getMinutes();
                        const top = (minutesFromMidnight / 60) * hourHeight; // px
                        let show = false;
                        if (calendarView === 'day') show = isSameDay(currentDate, now);
                        if (calendarView === 'week') {
                          const s = startOfWeek(currentDate); const e = addDays(s, 6);
                          show = now >= s && now <= e;
                        }
                        if (!show) return null;
                        const cols = calendarView === 'day' ? 1 : 7;
                        const todayIdx = now.getDay();
                        const leftExpr = calendarView === 'day'
                          ? '70px'
                          : `calc(70px + ${todayIdx} * (100% - 70px) / ${cols})`;
                        const widthExpr = calendarView === 'day'
                          ? 'calc(100% - 70px)'
                          : `calc((100% - 70px) / ${cols})`;
                        return (
                          <div style={{ position: 'absolute', top, left: leftExpr, width: widthExpr, pointerEvents: 'none' }}>
                            <div style={{ borderTop: '2px solid #ef4444' }} />
                            <div style={{ position: 'absolute', left: -4, width: 8, height: 8, background: '#ef4444', borderRadius: '50%', marginTop: -4 }} />
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}

              {calendarView === 'schedule' && (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th style={{ width: '18%' }}>Date</th>
                        <th>Title</th>
                        <th style={{ width: '20%' }}>Time</th>
                        <th style={{ width: '10%' }}>Color</th>
                      <th style={{ width: '22%' }}>Participants</th>
                        <th style={{ width: '20%' }}>Link</th>
                      </tr>
                    </thead>
                    <tbody aria-busy={loading}>
                      {loading ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={`sks-${i}`} aria-hidden="true">
                          <td><div className="skeleton skeleton-line" style={{ width: '60%' }} /></td>
                          <td><div className="skeleton skeleton-line" style={{ width: '80%' }} /></td>
                          <td><div className="skeleton skeleton-line" style={{ width: '40%' }} /></td>
                          <td><div className="skeleton" style={{ width: 16, height: 16, borderRadius: 3 }} /></td>
                        <td><div className="skeleton skeleton-line" style={{ width: '70%' }} /></td>
                          <td><div className="skeleton skeleton-line" style={{ width: '60%' }} /></td>
                        </tr>
                      )) : (
                        (() => {
                          // Filter events within current month
                          const mStart = startOfMonth(currentDate); const mEnd = endOfMonth(currentDate);
                          const list = events.filter(ev => {
                            const s = new Date(ev.start);
                            return s >= mStart && s <= mEnd;
                          }).sort((a,b) => new Date(a.start) - new Date(b.start));
                        if (list.length === 0) return <tr><td colSpan={6} className="text-center py-3">No meetings</td></tr>;
                          return list.map(ev => (
                            <tr key={`sc-${ev._id}`}>
                              <td>{new Date(ev.start).toLocaleDateString()}</td>
                              <td>{ev.title}</td>
                              <td>{formatTime(new Date(ev.start))} - {ev.end ? formatTime(new Date(ev.end)) : '-'}</td>
                              <td><span style={{ display:'inline-block', width:16, height:16, background: ev.color, borderRadius: 3 }} /></td>
                            <td>{renderParticipants(ev)}</td>
                            <td>
                              {ev.link ? (
                                <div className="d-flex align-items-center gap-2">
                                  <a href={ev.link} target="_blank" rel="noreferrer" onClick={()=> { try { sessionStorage.setItem(`meeting_opened_${ev._id}`, String(Date.now())); } catch {} }}>Join Meeting</a>
                                  <button
                                    className="btn btn-sm"
                                    title="Copy link"
                                    onClick={(e) => copyToClipboard(ev.link, e.currentTarget)}
                                    style={{
                                      width: 34,
                                      height: 30,
                                      padding: 0,
                                      borderRadius: 8,
                                      border: '1px solid #cbd5e1',
                                      background: '#ffffff',
                                      color: '#2563eb',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#2563eb'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-copy align-middle">
                                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <span>-</span>
                              )}
                            </td>
                            </tr>
                          ));
                        })()
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    {selectedEvent && (
      <div className="modal-backdrop" onClick={() => setSelectedEvent(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:1050, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="card" onClick={(e)=> e.stopPropagation()} style={{ maxWidth: 520, width: '92%', borderRadius: 12, boxShadow:'0 10px 30px rgba(0,0,0,0.2)' }}>
          <div className="card-body">
            <div className="d-flex align-items-start justify-content-between mb-2">
              <h6 className="fw-semibold mb-0" style={{ fontSize: 18 }}>{selectedEvent.title || 'Meeting'}</h6>
              <button className="btn btn-sm" onClick={() => setSelectedEvent(null)} style={{ background: '#06b6d4', color: '#fff', border: 'none', borderRadius: 999, padding: '6px 14px', fontWeight: 700 }}>Close</button>
            </div>
            <div className="text-muted" style={{ fontSize: 13 }}>{formatDate(new Date(selectedEvent.start))}</div>
            <div className="mb-2" style={{ fontSize: 14 }}>
              {formatTime(new Date(selectedEvent.start))} – {selectedEvent.end ? formatTime(new Date(selectedEvent.end)) : '-'}
              {selectedEvent.end && (
                <span className="text-muted"> · {formatDuration(selectedEvent.start, selectedEvent.end)}</span>
              )}
            </div>
            {selectedEvent.description && (
              <div className="mb-2"><strong>Description:</strong> <span className="text-muted">{selectedEvent.description}</span></div>
            )}
            <div className="mb-2"><strong>Created by:</strong> <span className="text-muted">{(selectedEvent.created_by && (selectedEvent.created_by.first_name || selectedEvent.created_by.last_name)) ? `${selectedEvent.created_by.first_name ?? ''} ${selectedEvent.created_by.last_name ?? ''}`.trim() : (selectedEvent.created_by?.email || 'Unknown')}</span></div>
            {selectedEvent.link && (
              <div className="mb-2"><strong>Link:</strong> <a href={selectedEvent.link} target="_blank" rel="noreferrer">Open meeting</a></div>
            )}
            <div className="mb-1"><strong>Color:</strong> <span style={{ display:'inline-block', width:14, height:14, background: selectedEvent.color || '#2563eb', borderRadius:3, verticalAlign:'middle', marginLeft:6 }} /></div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default CalendarPage;


