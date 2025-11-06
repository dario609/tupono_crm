import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import CalendarApi from "../../api/calendarApi";

const CalendarPage = () => {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'calendar'
  const [currentDate, setCurrentDate] = useState(new Date()); // anchor for calendar view
  const [calendarView, setCalendarView] = useState('month'); // 'day' | 'week' | 'month' | 'schedule'
  const [now, setNow] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await CalendarApi.list({});
      setEvents(res?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const onDelete = async (id) => { try { await CalendarApi.remove(id); await load(); } catch {} };

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
  const formatTime = (d) => {
    try {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch { return ''; }
  };
  const formatDate = (d) => {
    try {
      return d.toLocaleString([], { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
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
  const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const monthLabel = (d) => d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const dayLabel = (d) => d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const weekLabel = (d) => {
    const s = startOfWeek(d);
    const e = addDays(s, 6);
    return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
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
      <div className="d-flex justify-content-end align-items-center gap-2 mb-2 mt-2">
        <div className="btn-group" role="group" aria-label="mode">
          <button type="button" className={`btn btn-sm ${viewMode==='table'?'btn-primary':'btn-outline-primary'}`} onClick={()=> setViewMode('table')}>Table</button>
          <button type="button" className={`btn btn-sm ${viewMode==='calendar'?'btn-primary':'btn-outline-primary'}`} onClick={()=> setViewMode('calendar')}>Calendar</button>
        </div>
        <NavLink to="/calendar/create" className="btn btn-primary btn-sm">Add Meeting</NavLink>
      </div>

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
                    <th>Start</th>
                    <th>End</th>
                    <th>Color</th>
                    <th>Link</th>
                    <th style={{ width: 180 }} className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody aria-busy={loading}>
                  {(loading ? Array.from({ length: 8 }) : events).map((ev, idx) => (
                    loading ? (
                      <tr key={`sk-${idx}`} aria-hidden="true">
                        <td><div className="skeleton skeleton-line" style={{ width: "70%" }} /></td>
                        <td><div className="skeleton skeleton-line" style={{ width: "80%" }} /></td>
                        <td><div className="skeleton skeleton-line" style={{ width: "80%" }} /></td>
                        <td><div className="skeleton" style={{ width: 16, height: 16, borderRadius: 3 }} /></td>
                        <td><div className="skeleton skeleton-line" style={{ width: "50%" }} /></td>
                        <td className="text-center">
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <div className="skeleton" style={{ width: 80, height: 28, borderRadius: 6 }} />
                            <div className="skeleton" style={{ width: 64, height: 28, borderRadius: 6 }} />
                          </div>
                        </td>
                      </tr>
                    ) : (
                    <tr key={ev._id}>
                      <td>{ev.title}</td>
                      <td>{ev.start ? new Date(ev.start).toLocaleString() : '-'}</td>
                      <td>{ev.end ? new Date(ev.end).toLocaleString() : '-'}</td>
                      <td><span style={{ display:'inline-block', width:16, height:16, background: ev.color, borderRadius: 3 }} /></td>
                      <td>{ev.link ? <a href={ev.link} target="_blank" rel="noreferrer">Open</a> : '-'}</td>
                      <td className="text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          <button className="btn btn-sm btn-secondary" onClick={async ()=> { try { await CalendarApi.invite(ev._id, {}); alert('Invites sent (if SMTP configured)'); } catch(e){ alert(e.message || 'Invite failed'); } }}>Email Invite</button>
                          <button className="btn btn-sm btn-danger" onClick={()=> onDelete(ev._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                    )
                  ))}
                  {!loading && events.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-3">No meetings yet</td></tr>
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
                <div className="fw-semibold">
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
                    if (calendarView === 'month') {
                      return (
                        <div className="row g-0" style={{ border: '1px solid #cbd5e1', borderBottom: 'none' }}>
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
                  <div className="row g-0" style={{ border: '1px solid #cbd5e1', borderBottom: 'none', display: 'grid', gridTemplateColumns: `70px repeat(${cols}, 1fr)` }}>
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
                    <div className="row g-0" style={{ border: '1px solid #cbd5e1', borderTop: 'none' }}>
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
                  ) : (
                    // day/week time grid with hour marks
                    <div style={{ position: 'relative' }}>
                      <div style={{ border: '1px solid #cbd5e1', borderTop: 'none', display: 'grid', gridTemplateColumns: `70px repeat(${calendarView==='day'?1:7}, 1fr)` }}>
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
                            const slotEvents = events.filter(ev => { try { const sd = new Date(ev.start); return isSameDay(sd, d) && sd.getHours() === h; } catch { return false; } });
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
                          if (list.length === 0) return <tr><td colSpan={5} className="text-center py-3">No meetings</td></tr>;
                          return list.map(ev => (
                            <tr key={`sc-${ev._id}`}>
                              <td>{new Date(ev.start).toLocaleDateString()}</td>
                              <td>{ev.title}</td>
                              <td>{formatTime(new Date(ev.start))} - {ev.end ? formatTime(new Date(ev.end)) : '-'}</td>
                              <td><span style={{ display:'inline-block', width:16, height:16, background: ev.color, borderRadius: 3 }} /></td>
                              <td>{ev.link ? <a href={ev.link} target="_blank" rel="noreferrer">Open</a> : '-'}</td>
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


