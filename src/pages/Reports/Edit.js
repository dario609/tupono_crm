import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReportsApi from "../../api/reportsApi";
import UsersApi from "../../api/usersApi";
import ProjectsApi from "../../api/projectsApi";

const createCell = () => ({ content: "", rowSpan: 1, colSpan: 1, hidden: false, master: null, bold: false, italic: false, align: "left", vAlign: "top" });

const EditReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  // form/meta
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [meta, setMeta] = useState({ start_date: "", end_date: "", created_date: "", created_by: "", report_type: "", report_phase: "", project_id: "", hours: 0, report_status: "draft" });

  // sheet
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(6);
  const [grid, setGrid] = useState(() => Array.from({ length: 8 }, () => Array.from({ length: 6 }, createCell)));
  const [focus, setFocus] = useState(null);
  const [pendingFocus, setPendingFocus] = useState(null);
  const editorRefs = useRef(new Map());
  const [saving, setSaving] = useState(false);
  const [showSaveChoice, setShowSaveChoice] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [json, usersRes, projectsRes] = await Promise.all([
          ReportsApi.getById(id),
          UsersApi.list({ perpage: -1 }).catch(() => ({})),
          ProjectsApi.list({ perpage: -1 }).catch(() => ({})),
        ]);
        const doc = json?.data;
        if (!doc) throw new Error('Not found');
        setUsers(usersRes?.data || []);
        setProjects(projectsRes?.data || []);
        setName(doc.project_title || '');
        setDescription(doc.project_description || '');
        setMeta({
          start_date: doc.start_date ? String(doc.start_date).slice(0, 10) : "",
          end_date: doc.end_date ? String(doc.end_date).slice(0, 10) : "",
          created_date: doc.created_date ? String(doc.created_date).slice(0, 10) : "",
          created_by: doc.created_by?._id || doc.created_by || "",
          report_type: doc.report_type || "",
          report_phase: doc.report_phase || "",
          project_id: doc.project_id?._id || doc.project_id || "",
          hours: typeof doc.hours === 'number' ? doc.hours : (doc.hours ? Number(doc.hours) : 0),
          report_status: doc.report_status || 'draft',
        });
        const sheet = doc?.report_content_id?.sheet;
        const srows = Math.max(1, parseInt(sheet?.rows ?? 8, 10) || 8);
        const scols = Math.max(1, parseInt(sheet?.cols ?? 6, 10) || 6);
        const base = Array.from({ length: srows }, () => Array.from({ length: scols }, createCell));
        if (Array.isArray(sheet?.cells)) {
          sheet.cells.forEach((cell) => {
            const r = cell.r, c = cell.c;
            if (r < srows && c < scols) {
              base[r][c] = { ...base[r][c], rowSpan: cell.rowSpan || 1, colSpan: cell.colSpan || 1, content: cell.content || "", bold: !!cell.bold, italic: !!cell.italic, align: cell.align || "left", vAlign: cell.vAlign || 'top' };
              for (let rr = 0; rr < (cell.rowSpan || 1); rr++) {
                for (let cc = 0; cc < (cell.colSpan || 1); cc++) {
                  if (rr === 0 && cc === 0) continue;
                  const tr = r + rr, tc = c + cc; if (tr < srows && tc < scols) base[tr][tc] = { ...base[tr][tc], hidden: true, master: { r, c } };
                }
              }
            }
          });
        }
        setRows(srows); setCols(scols); setGrid(base);
      } catch (e) {
        setError(e.message || 'Failed to load report');
      } finally { setLoading(false); }
    })();
  }, [id]);

  // Extract numeric value from cell content
  const parseNumber = (html) => {
    if (!html) return 0;
    const t = html.replace(/<[^>]*>/g, "").trim();
    const num = parseFloat(t);
    return isNaN(num) ? 0 : num;
  };

  // Auto-calculate total hours from the grid
  useEffect(() => {
    if (!grid || grid.length === 0) return;

    // Detect header row
    const headerRow = grid[0];
    if (!headerRow) return;

    let hoursCol = -1;

    // Normalize header cells
    const headers = headerRow.map((c) =>
      c.content.replace(/<[^>]*>/g, "").toLowerCase().trim()
    );

    const patterns = ["hours", "hour", "total hours", "total hour"];

    headers.forEach((h, idx) => {
      if (patterns.includes(h)) hoursCol = idx;
    });

    if (hoursCol === -1) return; // No hours column found

    let total = 0;

    // Sum all numeric values under that column
    for (let r = 1; r < grid.length; r++) {
      const cell = grid[r][hoursCol];
      if (cell && !cell.hidden) {
        total += parseNumber(cell.content);
      }
    }

    // Update meta.hours automatically
    setMeta((m) => ({ ...m, hours: total }));
  }, [grid]);


  const Skeleton = () => (
    <>
      <div className="row mb-3">
        <div className="col-md-4"><div className="skeleton skeleton-line" style={{ height: 38 }} /></div>
        <div className="col-md-4"><div className="skeleton skeleton-line" style={{ height: 38 }} /></div>
        <div className="col-md-4"><div className="skeleton skeleton-line" style={{ height: 38 }} /></div>
      </div>
      <div className="row mb-3">
        <div className="col-md-4"><div className="skeleton skeleton-line" style={{ height: 38 }} /></div>
        <div className="col-md-4"><div className="skeleton skeleton-line" style={{ height: 38 }} /></div>
        <div className="col-md-4"><div className="skeleton skeleton-line" style={{ height: 38 }} /></div>
      </div>
      <div className="row mb-3">
        <div className="col-md-4"><div className="skeleton skeleton-line" style={{ height: 38 }} /></div>
        <div className="col-md-4"><div className="skeleton skeleton-line" style={{ height: 38 }} /></div>
        <div className="col-md-4"><div className="skeleton skeleton-line" style={{ height: 38 }} /></div>
      </div>
      <div className="row mb-3">
        <div className="col-md-12"><div className="skeleton skeleton-line" style={{ height: 70 }} /></div>
      </div>
      <div className="skeleton skeleton-line" style={{ height: 200 }} />
    </>
  );


  useEffect(() => {
    if (!pendingFocus) return;
    const { r, c } = pendingFocus;
    const el = editorRefs.current.get(`${r}-${c}`);

    try {
      if (el?.focus) el.focus();
    } catch { }

    setPendingFocus(null);
  }, [pendingFocus]);

  const getMasterCoords = (r, c) => { const cell = grid[r][c]; if (cell.hidden && cell.master) return { r: cell.master.r, c: cell.master.c }; return { r, c }; };
  const onMouseDown = (r, c) => { setFocus({ r, c }); setPendingFocus({ r, c }); };
  const canMergeRight = useMemo(() => { if (!focus) return false; const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c); const master = grid[mr][mc]; const nextCol = mc + (master.colSpan || 1); if (nextCol >= cols) return false; for (let rr = mr; rr < mr + (master.rowSpan || 1); rr++) { const cell = grid[rr][nextCol]; if (!cell || cell.hidden || (cell.rowSpan !== 1 || cell.colSpan !== 1)) return false; } return true; }, [focus, grid, cols]);
  const canMergeDown = useMemo(() => { if (!focus) return false; const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c); const master = grid[mr][mc]; const nextRow = mr + (master.rowSpan || 1); if (nextRow >= rows) return false; for (let cc = mc; cc < mc + (master.colSpan || 1); cc++) { const cell = grid[nextRow][cc]; if (!cell || cell.hidden || (cell.rowSpan !== 1 || cell.colSpan !== 1)) return false; } return true; }, [focus, grid, rows]);
  const mergeRight = () => { if (!canMergeRight) return; const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c); setGrid((g) => { const next = g.map((row) => row.map((cell) => ({ ...cell }))); const master = next[mr][mc]; const rs = master.rowSpan || 1; const nextCol = mc + (master.colSpan || 1); next[mr][mc] = { ...master, colSpan: (master.colSpan || 1) + 1 }; for (let rr = 0; rr < rs; rr++) { const tr = mr + rr; const tc = nextCol; next[tr][tc] = { ...next[tr][tc], hidden: true, master: { r: mr, c: mc } }; } return next; }); setFocus(getMasterCoords(focus.r, focus.c)); };
  const mergeDown = () => { if (!canMergeDown) return; const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c); setGrid((g) => { const next = g.map((row) => row.map((cell) => ({ ...cell }))); const master = next[mr][mc]; const cs = master.colSpan || 1; const nextRow = mr + (master.rowSpan || 1); next[mr][mc] = { ...master, rowSpan: (master.rowSpan || 1) + 1 }; for (let cc = 0; cc < cs; cc++) { const tr = nextRow; const tc = mc + cc; next[tr][tc] = { ...next[tr][tc], hidden: true, master: { r: mr, c: mc } }; } return next; }); setFocus(getMasterCoords(focus.r, focus.c)); };
  const split = () => { if (!focus) return; const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c); setGrid((g) => { const next = g.map((row) => row.map((cell) => ({ ...cell }))); const master = next[mr][mc]; const rs = master.rowSpan || 1; const cs = master.colSpan || 1; for (let rr = 0; rr < rs; rr++) { for (let cc = 0; cc < cs; cc++) { if (rr === 0 && cc === 0) continue; const tr = mr + rr; const tc = mc + cc; next[tr][tc] = { ...next[tr][tc], hidden: false, master: null }; } } next[mr][mc] = { ...master, rowSpan: 1, colSpan: 1 }; return next; }); setFocus({ r: mr, c: mc }); };
  const addRow = () => { setGrid((g) => [...g, Array.from({ length: cols }, createCell)]); setRows((r) => r + 1); };
  const addCol = () => { setGrid((g) => g.map((row) => [...row, createCell()])); setCols((c) => c + 1); };
  const removeRow = () => { if (rows <= 1) return; setGrid((g) => g.slice(0, -1)); setRows((r) => r - 1); };
  const removeCol = () => { if (cols <= 1) return; setGrid((g) => g.map((row) => row.slice(0, -1))); setCols((c) => c - 1); };
  const setFormatting = (patch) => { if (!focus) return; const { r, c } = focus; setGrid((g) => { const next = g.map((row) => row.map((cell) => ({ ...cell }))); next[r][c] = { ...next[r][c], ...patch }; return next; }); };
  const handleInput = (r, c, html) => {
    const el = editorRefs.current.get(`${r}-${c}`);
    const saved = saveSelection(el);

    setGrid((g) => {
      const next = g.map((row) => row.map((cell) => ({ ...cell })));
      next[r][c].content = html;
      return next;
    });

    requestAnimationFrame(() => {
      const target = editorRefs.current.get(`${r}-${c}`);
      restoreSelection(target, saved);
    });
  };

  const serialize = () => { const masters = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const cell = grid[r][c]; if (!cell.hidden) masters.push({ r, c, rowSpan: cell.rowSpan || 1, colSpan: cell.colSpan || 1, content: cell.content || "", bold: !!cell.bold, italic: !!cell.italic, align: cell.align || "left", vAlign: cell.vAlign || 'top' }); } return { rows, cols, cells: masters }; };
  const onSave = async (status = 'draft') => {
    try {
      setSaving(true);
      const payload = {
        project_title: name || 'Untitled Report',
        project_description: description || '',
        report_status: status === 'complete' ? 'complete' : 'draft',
        project_id: meta.project_id || undefined,
        start_date: meta.start_date || undefined,
        end_date: meta.end_date || undefined,
        created_date: meta.created_date || undefined,
        created_by: meta.created_by || undefined,
        report_type: meta.report_type || '',
        report_phase: meta.report_phase || '',
        hours: meta.hours ? Number(meta.hours) : 0,
        sheet: serialize(),
      };
      const json = await ReportsApi.update(id, payload);
      if (json?.success === false) throw new Error(json?.message || 'Failed to update');
      navigate('/reports');
    } catch (e) { setError(e.message || 'Server error'); } finally { setSaving(false); }
  };
  const saveSelection = (el) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;

    const range = sel.getRangeAt(0);
    const pre = range.cloneRange();
    pre.selectNodeContents(el);
    pre.setEnd(range.startContainer, range.startOffset);

    const start = pre.toString().length;
    const end = start + range.toString().length;
    return { start, end };
  };

  const restoreSelection = (el, saved) => {
    if (!saved) return;
    const range = document.createRange();
    const sel = window.getSelection();
    let count = 0;

    const traverse = (node) => {
      if (!node) return;
      if (node.nodeType === Node.TEXT_NODE) {
        const next = count + node.length;

        if (saved.start >= count && saved.start <= next) {
          range.setStart(node, saved.start - count);
        }
        if (saved.end >= count && saved.end <= next) {
          range.setEnd(node, saved.end - count);
        }
        count = next;
      } else {
        node.childNodes.forEach(traverse);
      }
    };

    traverse(el);

    sel.removeAllRanges();
    sel.addRange(range);
  };


  return (
    <div className="card mt-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">
        <h6 className="fw-semibold mb-0">Edit Report</h6>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => setShowSaveChoice(true)} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          <button className="btn btn-outline-primary btn-sm" onClick={() => navigate('/reports')}>Back</button>
        </div>
      </div>
      <div className="row card-body pt-0">
        <div className="col-12">
          {loading && <Skeleton />}
          {error && <div className="alert alert-danger">{error}</div>}
          {!loading && (
            <>
              <style>{`
                .sheet-group { display: inline-flex; align-items: center; background: #f9feff; border: 1px solid #cfe5ea; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,.04); margin-right: 8px; }
                .sheet-btn { appearance: none; border: 0; border-right: 1px solid #cfe5ea; background: transparent; padding: 6px 12px; color: #236472; font-weight: 600; line-height: 1; cursor: pointer; }
                .sheet-btn:last-child { border-right: 0; }
                .sheet-btn:hover { background: #eaf7fb; }
                .sheet-outer { border: 1px solid #e0e0e0; border-radius: 8px; background: #fff; }
                .sheet-scroll { overflow: auto; -webkit-overflow-scrolling: touch; max-height: 68vh; }
                .confirm-overlay { position: fixed; inset: 0; background: rgba(9,30,66,.35); display: flex; align-items: center; justify-content: center; z-index: 1080; }
                .confirm-card { width: 92%; max-width: 420px; background: #fff; border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,.18); padding: 18px; }
                .confirm-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }
                .btn-soft { border: 1px solid #d4e2ff; color: #2b5cff; background: #f6f9ff; padding: 6px 12px; border-radius: 8px; font-weight: 600; }
                .btn-soft:hover { background: #edf4ff; }
                @media (max-width: 576px) {
                  .mobile-mt { margin-top: 3px !important; }
                  .mobile-mb { margin-bottom: 3px !important; }
                }
              `}</style>

              <div className="row mb-2 mt-2">
                <div className="col-md-4 mobile-mb mobile-mt"><label>Report Title</label><input className="form-control" value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="col-md-4 mobile-mb mobile-mt"><label>Project</label>
                  <select className="form-control" value={meta.project_id} onChange={(e) => setMeta((m) => ({ ...m, project_id: e.target.value }))}>
                    <option value="">Select project</option>
                    {projects.map((p) => (<option key={p._id} value={p._id}>{p.name || p.project_title || 'Project'}</option>))}
                  </select>
                </div>
                <div className="col-md-4 mobile-mb mobile-mt"><label>Description</label><input className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              </div>
              <div className="row mb-2">
                <div className="col-sm-6 col-md-3 mobile-mb mobile-mt"><label>Start Date</label><input type="date" className="form-control" value={meta.start_date} onChange={(e) => setMeta((m) => ({ ...m, start_date: e.target.value }))} onMouseDown={(e) => { try { e.currentTarget.showPicker && e.currentTarget.showPicker(); } catch { } }} /></div>
                <div className="col-sm-6 col-md-3 mobile-mb mobile-mt"><label>End Date</label><input type="date" className="form-control" value={meta.end_date} onChange={(e) => setMeta((m) => ({ ...m, end_date: e.target.value }))} onMouseDown={(e) => { try { e.currentTarget.showPicker && e.currentTarget.showPicker(); } catch { } }} /></div>
                <div className="col-sm-6 col-md-3 mobile-mb mobile-mt"><label>Created Date</label><input type="date" className="form-control" value={meta.created_date} onChange={(e) => setMeta((m) => ({ ...m, created_date: e.target.value }))} /></div>
                <div className="col-sm-6 col-md-3 mobile-mb mobile-mt"><label>Created By</label>
                  <select className="form-control" value={meta.created_by} onChange={(e) => setMeta((m) => ({ ...m, created_by: e.target.value }))}>
                    <option value="">Select User</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>{`${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="row mb-2">
                <div className="col-sm-4 col-md-4 mobile-mb mobile-mt"><label>Report Type</label>
                  <select className="form-control" value={meta.report_type} onChange={(e) => setMeta((m) => ({ ...m, report_type: e.target.value }))}>
                    <option value="">Select type</option>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="manager">Manager report</option>
                    <option value="national_manager">National manager's report</option>
                    <option value="engagement_project">Engagement report per project</option>
                    <option value="engagement_national">Engagement report national</option>
                  </select>
                </div>
                <div className="col-sm-4 col-md-4 mobile-mb mobile-mt"><label>Report Phase</label>
                  <select className="form-control" value={meta.report_phase} onChange={(e) => setMeta((m) => ({ ...m, report_phase: e.target.value }))}>
                    <option value="">Select phase</option>
                    <option value="Phase1">Phase 1</option>
                    <option value="Phase2">Phase 2</option>
                    <option value="Phase3">Phase 3</option>
                  </select>
                </div>
                <div className="col-sm-4 col-md-4 mobile-mb mobile-mt"><label>Hours</label>
                  <input
                    type="number"
                    className="form-control"
                    value={meta.hours || 0}
                    readOnly
                  />

                </div>
              </div>

              <div className="mb-2">
                <div className="sheet-group">
                  <button className="sheet-btn" onClick={() => { setGrid((g) => [...g, Array.from({ length: cols }, createCell)]); setRows((r) => r + 1); }}>+ Row</button>
                  <button className="sheet-btn" onClick={() => { setGrid((g) => g.map((row) => [...row, createCell()])); setCols((c) => c + 1); }}>+ Col</button>
                  <button className="sheet-btn" onClick={() => { if (rows > 1) { setGrid((g) => g.slice(0, -1)); setRows((r) => r - 1); } }}>- Row</button>
                  <button className="sheet-btn" onClick={() => { if (cols > 1) { setGrid((g) => g.map((row) => row.slice(0, -1))); setCols((c) => c - 1); } }}>- Col</button>
                  <button className="sheet-btn" disabled={!canMergeRight} onClick={mergeRight}>Merge →</button>
                  <button className="sheet-btn" disabled={!canMergeDown} onClick={mergeDown}>Merge ↓</button>
                  <button className="sheet-btn" onClick={split}>Split</button>
                </div>
                <div className="sheet-group">
                  <button className="sheet-btn" onClick={() => setFormatting({ bold: true })}>B</button>
                  <button className="sheet-btn" onClick={() => setFormatting({ bold: false, italic: false, align: 'left', vAlign: 'top' })}>Normal</button>
                  <button className="sheet-btn" onClick={() => setFormatting({ italic: true })}>I</button>
                  <button className="sheet-btn" onClick={() => setFormatting({ align: 'left' })}>Left</button>
                  <button className="sheet-btn" onClick={() => setFormatting({ align: 'right' })}>Right</button>
                  <button className="sheet-btn" onClick={() => setFormatting({ align: 'center' })}>Center</button>
                  <button className="sheet-btn" onClick={() => setFormatting({ vAlign: 'middle' })}>VCenter</button>
                </div>
              </div>

              <div className="sheet-outer">
                <div className="sheet-scroll">
                  <div style={{ position: 'relative', minWidth: 900, display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(120px, 1fr))`, gridAutoRows: 'minmax(44px, auto)', gap: 1, padding: 1, background: '#e9ecef', userSelect: 'none' }}>
                    {grid.map((row, r) => row.map((cell, c) => (
                      cell.hidden ? null : (
                        <div key={`cell-${r}-${c}`} onMouseDownCapture={(e) => { if (e.button !== 0) return; e.preventDefault(); onMouseDown(r, c); }} style={{ gridColumn: `span ${cell.colSpan || 1}`, gridRow: `span ${cell.rowSpan || 1}`, background: '#fff', border: '1px solid #e9ecef', display: 'flex', alignItems: (cell.vAlign === 'middle' ? 'center' : (cell.vAlign === 'bottom' ? 'flex-end' : 'flex-start')) }}>
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            ref={(el) => {
                              const k = `${r}-${c}`;
                              if (!el) {
                                editorRefs.current.delete(k);
                                return;
                              }

                              editorRefs.current.set(k, el);

                              // Only update innerHTML if the content actually changed
                              if (el.innerHTML !== cell.content) {
                                el.innerHTML = cell.content || "";
                              }
                            }}
                            onFocus={() => setFocus({ r, c })}
                            onInput={(e) => handleInput(r, c, e.currentTarget.innerHTML)}
                            style={{
                              minHeight: 36,
                              padding: "6px 8px",
                              outline: "none",
                              fontWeight: cell.bold ? 700 : 400,
                              fontStyle: cell.italic ? "italic" : "normal",
                              textAlign: cell.align || "left",
                              width: "100%",
                            }}
                          />

                        </div>
                      )
                    )))}
                  </div>
                </div>
              </div>

              {showSaveChoice && (
                <div className="confirm-overlay" role="dialog" aria-modal="true">
                  <div className="confirm-card">
                    <h6 className="fw-semibold mb-1">How do you want to save?</h6>
                    <p className="text-muted mb-2" style={{ fontSize: 14 }}>Choose to save as draft or complete the report.</p>
                    <div className="confirm-actions">
                      <button className="btn btn-sm btn-soft" onClick={() => { setShowSaveChoice(false); onSave('draft'); }} disabled={saving}>{saving ? 'Saving...' : 'Save as Draft'}</button>
                      <button className="btn btn-primary btn-sm" onClick={() => { setShowSaveChoice(false); onSave('complete'); }} disabled={saving}>{saving ? 'Saving...' : 'Complete & Save'}</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditReport;


