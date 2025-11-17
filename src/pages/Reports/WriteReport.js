import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReportsApi from "../../api/reportsApi";
import UsersApi from "../../api/usersApi";
import ProjectsApi from "../../api/projectsApi";
import ReportContentsApi from "../../api/reportContentsApi";

const createCell = () => ({ content: "", rowSpan: 1, colSpan: 1, hidden: false, master: null, bold: false, italic: false, align: "left", vAlign: "top" });

const WriteReport = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(6);
  const [grid, setGrid] = useState(() => Array.from({ length: 8 }, () => Array.from({ length: 6 }, createCell)));
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [meta, setMeta] = useState({ start_date: "", end_date: "", created_date: "", created_by: "", report_type: "", report_phase: "", project_id: "" });
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [showSaveChoice, setShowSaveChoice] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplDesc, setTplDesc] = useState("");
  const [tplBusy, setTplBusy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [delBusy, setDelBusy] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [focus, setFocus] = useState(null); // { r,c }
  const [pendingFocus, setPendingFocus] = useState(null);
  const editorRefs = useRef(new Map());
  // No area selection – merges are driven by buttons relative to focused cell

  const placeCaretAtEnd = (el) => {
    try {
      if (!el) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch { }
  };

  const deferPlaceCaret = (el) => {
    try {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => placeCaretAtEnd(el));
      });
    } catch { }
  };

  const normalizeMastersIn = (next, r1, r2, c1, c2) => {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        const cell = next[r][c];
        if ((!cell.hidden && (cell.rowSpan > 1 || cell.colSpan > 1)) || cell.hidden) {
          const mr = cell.hidden && cell.master ? cell.master.r : r;
          const mc = cell.hidden && cell.master ? cell.master.c : c;
          const master = next[mr][mc];
          for (let rr = 0; rr < master.rowSpan; rr++) {
            for (let cc = 0; cc < master.colSpan; cc++) {
              if (rr === 0 && cc === 0) continue;
              const tr = mr + rr, tc = mc + cc;
              next[tr][tc] = { ...next[tr][tc], hidden: false, master: null };
            }
          }
          next[mr][mc] = { ...master, rowSpan: 1, colSpan: 1 };
        }
      }
    }
  };

  const onMouseDown = (r, c) => {
    setFocus({ r, c });
    setPendingFocus({ r, c });
  };
  const onMouseEnter = () => { };

  // Utilities
  const getMasterCoords = (r, c) => {
    const cell = grid[r][c];
    if (cell.hidden && cell.master) return { r: cell.master.r, c: cell.master.c };
    return { r, c };
  };

  const canMergeRight = useMemo(() => {
    if (!focus) return false;
    const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c);
    const master = grid[mr][mc];
    const nextCol = mc + (master.colSpan || 1);
    if (nextCol >= cols) return false;
    for (let rr = mr; rr < mr + (master.rowSpan || 1); rr++) {
      const cell = grid[rr][nextCol];
      if (!cell || cell.hidden || (cell.rowSpan !== 1 || cell.colSpan !== 1)) return false;
    }
    return true;
  }, [focus, grid, cols]);

  const canMergeDown = useMemo(() => {
    if (!focus) return false;
    const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c);
    const master = grid[mr][mc];
    const nextRow = mr + (master.rowSpan || 1);
    if (nextRow >= rows) return false;
    for (let cc = mc; cc < mc + (master.colSpan || 1); cc++) {
      const cell = grid[nextRow][cc];
      if (!cell || cell.hidden || (cell.rowSpan !== 1 || cell.colSpan !== 1)) return false;
    }
    return true;
  }, [focus, grid, rows]);

  const mergeRight = () => {
    if (!canMergeRight) return;
    const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c);
    setGrid((g) => {
      const next = g.map((row) => row.map((cell) => ({ ...cell })));
      const master = next[mr][mc];
      const rs = master.rowSpan || 1;
      const nextCol = mc + (master.colSpan || 1);
      next[mr][mc] = { ...master, colSpan: (master.colSpan || 1) + 1 };
      for (let rr = 0; rr < rs; rr++) {
        const tr = mr + rr; const tc = nextCol;
        next[tr][tc] = { ...next[tr][tc], hidden: true, master: { r: mr, c: mc } };
      }
      return next;
    });
    setFocus(getMasterCoords(focus.r, focus.c));
  };

  const mergeDown = () => {
    if (!canMergeDown) return;
    const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c);
    setGrid((g) => {
      const next = g.map((row) => row.map((cell) => ({ ...cell })));
      const master = next[mr][mc];
      const cs = master.colSpan || 1;
      const nextRow = mr + (master.rowSpan || 1);
      next[mr][mc] = { ...master, rowSpan: (master.rowSpan || 1) + 1 };
      for (let cc = 0; cc < cs; cc++) {
        const tr = nextRow; const tc = mc + cc;
        next[tr][tc] = { ...next[tr][tc], hidden: true, master: { r: mr, c: mc } };
      }
      return next;
    });
    setFocus(getMasterCoords(focus.r, focus.c));
  };

  const split = () => {
    if (!focus) return;
    const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c);
    setGrid((g) => {
      const next = g.map((row) => row.map((cell) => ({ ...cell })));
      const master = next[mr][mc];
      const rs = master.rowSpan || 1;
      const cs = master.colSpan || 1;
      for (let rr = 0; rr < rs; rr++) {
        for (let cc = 0; cc < cs; cc++) {
          if (rr === 0 && cc === 0) continue;
          const tr = mr + rr; const tc = mc + cc;
          next[tr][tc] = { ...next[tr][tc], hidden: false, master: null };
        }
      }
      next[mr][mc] = { ...master, rowSpan: 1, colSpan: 1 };
      return next;
    });
    setFocus({ r: mr, c: mc });
  };

  // No global mouse handlers needed (no drag selection)

  // Focus the intended cell after state updates (prevents focusing wrong element)
  useEffect(() => {
    if (!pendingFocus) return;
    const { r, c } = pendingFocus;
    const key = `${r}-${c}`;
    const el = editorRefs.current.get(key);
    if (el && el.focus) {
      try { el.focus(); } catch { }
    }
    placeCaretAtEnd(el);
    setPendingFocus(null);
  }, [pendingFocus]);

  const addRow = () => { setGrid((g) => [...g, Array.from({ length: cols }, createCell)]); setRows((r) => r + 1); };
  const addCol = () => { setGrid((g) => g.map((row) => [...row, createCell()])); setCols((c) => c + 1); };
  const removeRow = () => { if (rows <= 1) return; setGrid((g) => g.slice(0, -1)); setRows((r) => r - 1); };
  const removeCol = () => { if (cols <= 1) return; setGrid((g) => g.map((row) => row.slice(0, -1))); setCols((c) => c - 1); };

  useEffect(() => {
    (async () => {
      try {
        setDataLoading(true);
        const [resp, pj, tp] = await Promise.all([
          UsersApi.list({ perpage: -1 }).catch(() => ({})),
          ProjectsApi.list({ perpage: -1 }).catch(() => ({})),
          ReportContentsApi.list({ perpage: -1, isTemplate: 1 }).catch(() => ({})),
        ]);
        setUsers(resp?.data || []);
        setProjects(pj?.data || []);
        setTemplates(tp?.data || []);
      } finally {
        setDataLoading(false);
      }
    })();
  }, []);

  // Auto-calculate total hours from the "Hours" column
  useEffect(() => {
    if (!grid || grid.length === 0) return;

    // Try to detect the hours column header
    let hoursCol = -1;
    const headers = grid[0].map((c) =>
      c.content.replace(/<[^>]*>/g, "").toLowerCase().trim()
    );

    const possibleMatches = ["hours", "hour", "total hours", "total hour"];

    headers.forEach((text, idx) => {
      if (possibleMatches.includes(text)) hoursCol = idx;
    });

    if (hoursCol === -1) return; // no hours column found

    // Sum values under the hours column
    let sum = 0;
    for (let r = 1; r < grid.length; r++) {
      const cell = grid[r][hoursCol];
      if (cell && !cell.hidden) {
        sum += parseNumber(cell.content);
      }
    }

    // Update hours in meta
    setMeta((m) => ({ ...m, hours: sum }));
  }, [grid]);


  const setFormatting = (patch) => {
    if (!focus) return; const { r, c } = focus;
    setGrid((g) => { const next = g.map((row) => row.map((cell) => ({ ...cell }))); next[r][c] = { ...next[r][c], ...patch }; return next; });
  };

  const handleInput = (r, c, html) => {
    setGrid((g) => { const next = g.map((row) => row.map((cell) => ({ ...cell }))); next[r][c].content = html; return next; });
    const el = editorRefs.current.get(`${r}-${c}`);
    // Ensure caret remains at the end after React updates
    deferPlaceCaret(el);
  };

  // After any grid update, keep caret at end for the focused cell
  useEffect(() => {
    if (!focus) return;
    const el = editorRefs.current.get(`${focus.r}-${focus.c}`);
    if (el) deferPlaceCaret(el);
  }, [grid, focus]);

  const serialize = () => {
    const masters = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const cell = grid[r][c]; if (!cell.hidden) masters.push({ r, c, rowSpan: cell.rowSpan || 1, colSpan: cell.colSpan || 1, content: cell.content || "", bold: !!cell.bold, italic: !!cell.italic, align: cell.align || "left" }); }
    return { rows, cols, cells: masters };
  };

  // Export/Import removed per request

  // Extract numeric value from cell content
  const parseNumber = (html) => {
    if (!html) return 0;
    const t = html.replace(/<[^>]*>/g, "").trim();
    const num = parseFloat(t);
    return isNaN(num) ? 0 : num;
  };


  const onSave = async (status = 'draft') => {
    try {
      setSaving(true); setError(""); setSuccess("");
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
      const json = await ReportsApi.create(payload);
      if (json?.success === false) throw new Error(json?.message || 'Failed to save');
      setSuccess(status === 'complete' ? 'Report completed successfully' : 'Draft saved successfully'); setTimeout(() => navigate('/reports'), 800);
    } catch (e) { setError(e.message || 'Server error'); } finally { setSaving(false); }
  };

  const handleBack = async () => {
    setShowConfirm(true);
  };

  const onConfirmSave = async () => {
    try {
      setConfirmBusy(true);
      await onSave();
    } finally {
      setConfirmBusy(false);
      setShowConfirm(false);
    }
  };

  const onConfirmDiscard = () => {
    setShowConfirm(false);
    navigate('/reports');
  };

  const onSaveTemplate = () => {
    setTplName(name || 'Template');
    setTplDesc(description || '');
    setShowSaveTemplate(true);
  };

  const confirmSaveTemplate = async () => {
    try {
      setTplBusy(true); setError(""); setSuccess("");
      const payload = {
        name: (tplName || name || 'Template').trim(),
        description: tplDesc || description || '',
        isTemplate: true,
        visibility: 'private',
        sheet: serialize(),
      };
      const resp = await ReportContentsApi.create(payload);
      const newId = resp?.data?.id;
      if (newId) {
        // Refresh templates list and keep the new one selected
        try {
          const listResp = await ReportContentsApi.list({ perpage: -1, isTemplate: 1 });
          const items = listResp?.data || [];
          setTemplates(items);
        } catch { }
        setSelectedTemplate(newId);
      }
      setSuccess('New Template created successfully');
      setShowSaveTemplate(false);
    } catch (e) {
      setError(e.message || 'Failed to save template');
    } finally {
      setTplBusy(false);
    }
  };

  const onUpdateCurrentTemplate = async () => {
    if (!selectedTemplate) {
      setError('Please select a template to update');
      return;
    }
    try {
      setTplBusy(true); setError(""); setSuccess("");
      const payload = { sheet: serialize() };
      const resp = await ReportContentsApi.update(selectedTemplate, payload);
      if (resp?.success === false) throw new Error(resp?.message || 'Failed to update');
      const got = await ReportContentsApi.getById(selectedTemplate).catch(() => null);
      const item = got?.data; if (item) setTemplates((list) => list.map((t) => t._id === selectedTemplate ? item : t));
      setSuccess('Template updated successfully');
    } catch (e) {
      setError(e.message || 'Failed to update template');
    } finally {
      setTplBusy(false);
    }
  };

  const onDeleteTemplate = () => {
    if (!selectedTemplate) { setError('Please select a template to delete'); return; }
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTemplate = async () => {
    try {
      setDelBusy(true); setError("");
      await ReportContentsApi.remove(selectedTemplate);
      // refresh list
      try {
        const listResp = await ReportContentsApi.list({ perpage: -1, isTemplate: 1 });
        setTemplates(listResp?.data || []);
      } catch { }
      setSelectedTemplate("");
      const r = 8, c = 6;
      setRows(r); setCols(c); setGrid(Array.from({ length: r }, () => Array.from({ length: c }, createCell)));
      setSuccess('Template deleted successfully');
    } catch (e) {
      setError(e.message || 'Failed to delete template');
    } finally {
      setDelBusy(false);
      setShowDeleteConfirm(false);
    }
  };

  // selection helpers removed

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24">
        <h6 className="fw-semibold mb-0 mt-3">Report Creator</h6>
        <div className="d-flex align-items-center gap-2 mt-3">
          <button className="btn btn-primary btn-sm" onClick={() => setShowSaveChoice(true)} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          <button onClick={handleBack} className="btn btn-primary btn-sm inner-pages-button" style={{ padding: '5px 10px' }}> Back</button>
        </div>
      </div>

      <section className="card mt-2">
        <div className="row card-body pt-0">
          <div className="col-12">
            <div className="box">
              <div className="box-body p-15 pt-0">
                <style>{`
                  .sheet-toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
                  .sheet-group { display: flex; align-items: center; background: #f9feff; border: 1px solid #cfe5ea; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,.04); }
                  .sheet-group .sheet-btn { appearance: none; border: 0; border-right: 1px solid #cfe5ea; background: transparent; padding: 6px 12px; color: #236472; font-weight: 600; line-height: 1; cursor: pointer; }
                  .sheet-group .sheet-btn:last-child { border-right: 0; }
                  .sheet-group .sheet-btn:hover { background: #eaf7fb; }
                  .sheet-group .sheet-btn:disabled { opacity: .45; cursor: not-allowed; }
                  .sheet-outer { border: 1px solid #e0e0e0; border-radius: 8px; background: #fff; }
                  .sheet-scroll { overflow: auto; -webkit-overflow-scrolling: touch; max-height: 68vh; }
                  .confirm-overlay { position: fixed; inset: 0; background: rgba(9,30,66,.35); display: flex; align-items: center; justify-content: center; z-index: 1080; }
                  .confirm-card { width: 92%; max-width: 420px; background: #fff; border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,.18); padding: 18px; }
                  .confirm-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }
                  .btn-soft { border: 1px solid #d4e2ff; color: #2b5cff; background: #f6f9ff; padding: 6px 12px; border-radius: 8px; font-weight: 600; }
                  .btn-soft:hover { background: #edf4ff; }
                  .btn-danger-soft { border: 1px solid #f5d0d0; background: #fff5f5; color: #d22; }
                  .template-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
                  .template-actions .btn { display: inline-flex; align-items: center; gap: 6px; }
                  @media (max-width: 576px) {
                    .sheet-scroll { max-height: 60vh; }
                    .sheet-toolbar { gap: 6px; }
                    .sheet-group .sheet-btn { padding: 6px 10px; }
                    .mobile-mt { margin-top: 5px !important; }
                    .mobile-mb { margin-bottom: 5px !important; }
                    .template-actions { margin-top: 8px; gap: 6px; }
                    .template-actions .btn { padding: 6px 10px; }
                    .template-actions .btn .label { font-size: 12px; }
                  }
                `}</style>
                {success && (<div className="alert alert-success alert-dismissible fade show mt-2 p-2"><ul style={{ listStyle: 'none', marginBottom: 0 }}><li>{success}</li></ul></div>)}
                {error && (<div className="alert alert-danger alert-dismissible fade show"><ul style={{ listStyle: 'none', marginBottom: 0 }}><li>{error}</li></ul></div>)}

                {/* Template chooser */}
                <div className="row mb-2 align-items-end">
                  <div className="col-sm-6 col-md-3 mobile-mb mt-2">
                    <label>Template</label>
                    <select className="form-control" value={selectedTemplate} onChange={(e) => {
                      const id = e.target.value; setSelectedTemplate(id);
                      if (!id) {
                        // reset to blank grid
                        const r = 8, c = 6;
                        setRows(r); setCols(c); setGrid(Array.from({ length: r }, () => Array.from({ length: c }, createCell)));
                        return;
                      }
                      const t = templates.find((x) => x._id === id);
                      const sheet = t?.sheet;
                      if (!sheet) return;
                      const srows = Math.max(1, parseInt(sheet.rows ?? 8, 10) || 8);
                      const scols = Math.max(1, parseInt(sheet.cols ?? 6, 10) || 6);
                      const base = Array.from({ length: srows }, () => Array.from({ length: scols }, createCell));
                      if (Array.isArray(sheet.cells)) {
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
                    }}>
                      <option value="">From scratch</option>
                      {templates.map((t) => (
                        <option key={t._id} value={t._id}>{t.name || 'Template'}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-sm-6 col-md-5 template-actions mt-3">
                    <button className="btn btn-warning btn-sm" onClick={onSaveTemplate} disabled={saving} title="Save as Template">
                      <span className="label">Save as new Template</span>
                    </button>
                    <button className="btn btn-success btn-sm" onClick={onUpdateCurrentTemplate} style={{ color: 'white', backgroundColor: 'darkgreen', border: 'none' }} disabled={tplBusy || !selectedTemplate} title="Update Template">
                      <span className="label">Update Template</span>
                    </button>
                    <button className="btn btn-danger btn-sm text-white" style={{ backgroundColor: 'red', border: 'none' }} onClick={onDeleteTemplate} disabled={delBusy || !selectedTemplate} title="Delete Template">
                      <span className="label">Delete Template</span>
                    </button>
                  </div>
                </div>

                {dataLoading ? (
                  <>
                    <div className="row mb-2 mt-2">
                      <div className="col-md-4 mobile-mb"><div className="skeleton skeleton-line" style={{ height: 38 }} /></div>
                      <div className="col-md-4 mobile-mb"><div className="skeleton skeleton-line" style={{ height: 38 }} /></div>
                      <div className="col-md-4 mobile-mb"><div className="skeleton skeleton-line" style={{ height: 38 }} /></div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-sm-6 col-md-3 mobile-mb"><div className="skeleton skeleton-line" style={{ height: 38 }} /></div>
                      <div className="col-sm-6 col-md-3 mobile-mb"><div className="skeleton skeleton-line" style={{ height: 38 }} /></div>
                      <div className="col-sm-6 col-md-3 mobile-mb"><div className="skeleton skeleton-line" style={{ height: 38 }} /></div>
                      <div className="col-sm-6 col-md-3 mobile-mb"><div className="skeleton skeleton-line" style={{ height: 38 }} /></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="row mb-2 mt-2">
                      <div className="col-md-4 mobile-mb"><label>Report Title</label><input className="form-control" placeholder="Report Name" value={name} onChange={(e) => setName(e.target.value)} /></div>
                      <div className="col-md-4 mobile-mb"><label>Project</label>
                        <select className="form-control" value={meta.project_id} onChange={(e) => setMeta((m) => ({ ...m, project_id: e.target.value }))}>
                          <option value="">Select project</option>
                          {projects.map((p) => (<option key={p._id} value={p._id}>{p.name || p.project_title || 'Project'}</option>))}
                        </select>
                      </div>
                      <div className="col-md-4 mobile-mb"><label>Description</label><input className="form-control" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-sm-6 col-md-3 mobile-mb"><label>Start Date</label><input type="date" className="form-control" value={meta.start_date} onChange={(e) => setMeta((m) => ({ ...m, start_date: e.target.value }))} onMouseDown={(e) => { try { e.currentTarget.showPicker && e.currentTarget.showPicker(); } catch { } }} /></div>
                      <div className="col-sm-6 col-md-3 mobile-mb"><label>End Date</label><input type="date" className="form-control" value={meta.end_date} onChange={(e) => setMeta((m) => ({ ...m, end_date: e.target.value }))} onMouseDown={(e) => { try { e.currentTarget.showPicker && e.currentTarget.showPicker(); } catch { } }} /></div>
                      <div className="col-sm-6 col-md-3 mobile-mb"><label>Created Date</label><input type="date" className="form-control" value={meta.created_date} onChange={(e) => setMeta((m) => ({ ...m, created_date: e.target.value }))} /></div>
                      <div className="col-sm-6 col-md-3 mobile-mb"><label>Created By</label>
                        <select className="form-control" value={meta.created_by} onChange={(e) => setMeta((m) => ({ ...m, created_by: e.target.value }))}>
                          <option value="">Select User</option>
                          {users.map((u) => (
                            <option key={u._id} value={u._id}>{`${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}
                <div className="row mb-2">
                  <div className="col-sm-4 col-md-4 mobile-mb"><label>Report Type</label>
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
                  <div className="col-sm-4 col-md-4 mobile-mb"><label>Report Phase</label>
                    <select className="form-control" value={meta.report_phase} onChange={(e) => setMeta((m) => ({ ...m, report_phase: e.target.value }))}>
                      <option value="">Select phase</option>
                      <option value="Phase1">Phase 1</option>
                      <option value="Phase2">Phase 2</option>
                      <option value="Phase3">Phase 3</option>
                    </select>
                  </div>
                  <div className="col-sm-4 col-md-4 mobile-mb"><label>Hours</label>
                    <input
                      type="number"
                      className="form-control"
                      value={meta.hours || 0}
                      readOnly
                    />

                  </div>
                </div>

                <div className="sheet-toolbar mb-2">
                  <div className="sheet-group">
                    <button className="sheet-btn" onClick={addRow}>+ Row</button>
                    <button className="sheet-btn" onClick={addCol}>+ Col</button>
                    <button className="sheet-btn" onClick={removeRow}>- Row</button>
                    <button className="sheet-btn" onClick={removeCol}>- Col</button>
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
                  {/* Save moved to header; export/import removed as requested */}
                </div>

                <div className="sheet-outer">
                  <div className="sheet-scroll">
                    <div
                      style={{ position: 'relative', minWidth: 900, display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(120px, 1fr))`, gridAutoRows: 'minmax(44px, auto)', gap: 1, padding: 1, background: '#e9ecef', userSelect: 'none' }}
                    >
                      {grid.map((row, r) => row.map((cell, c) => (
                        cell.hidden ? null : (
                          <div
                            key={`cell-${r}-${c}`}
                            data-r={r}
                            data-c={c}
                            onMouseDownCapture={(e) => { if (e.button !== 0) return; e.preventDefault(); onMouseDown(r, c); }}
                            onMouseEnter={() => onMouseEnter(r, c)}
                            style={{ gridColumn: `span ${cell.colSpan || 1}`, gridRow: `span ${cell.rowSpan || 1}`, background: '#fff', border: '1px solid #e9ecef', display: 'flex', alignItems: (cell.vAlign === 'middle' ? 'center' : (cell.vAlign === 'bottom' ? 'flex-end' : 'flex-start')) }}
                          >
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

                                // Important: prevent React from overwriting user-typed content
                                if (el.innerHTML !== cell.content) {
                                  el.innerHTML = cell.content || "";
                                }
                              }}
                              onFocus={() => {
                                setFocus({ r, c });
                                const el = editorRefs.current.get(`${r}-${c}`);
                                requestAnimationFrame(() => {
                                  requestAnimationFrame(() => {
                                    try {
                                      const range = document.createRange();
                                      range.selectNodeContents(el);
                                      range.collapse(false);
                                      const sel = window.getSelection();
                                      sel.removeAllRanges();
                                      sel.addRange(range);
                                    } catch { }
                                  });
                                });
                              }}
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

                {showConfirm && (
                  <div className="confirm-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false); }}>
                    <div className="confirm-card">
                      <h6 className="fw-semibold mb-1">Save before leaving?</h6>
                      <p className="text-muted mb-2" style={{ fontSize: 14 }}>You have unsaved changes. Save as draft or discard changes.</p>
                      <div className="confirm-actions">
                        <button className="btn btn-primary btn-sm" onClick={onConfirmSave} disabled={confirmBusy}>{confirmBusy ? 'Saving...' : 'Save as Draft'}</button>
                        <button className="btn btn-sm btn-soft btn-danger-soft" onClick={onConfirmDiscard}>Discard</button>
                      </div>
                    </div>
                  </div>
                )}

                {showSaveChoice && (
                  <div className="confirm-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setShowSaveChoice(false); }}>
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

                {showDeleteConfirm && (
                  <div className="confirm-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}>
                    <div className="confirm-card">
                      <h6 className="fw-semibold mb-1">Delete this template?</h6>
                      <p className="text-muted mb-2" style={{ fontSize: 14 }}>This action cannot be undone.</p>
                      <div className="confirm-actions">
                        <button className="btn btn-sm btn-soft" onClick={() => setShowDeleteConfirm(false)} disabled={delBusy}>Cancel</button>
                        <button className="btn btn-danger btn-sm" onClick={confirmDeleteTemplate} disabled={delBusy}>{delBusy ? 'Deleting...' : 'Delete'}</button>
                      </div>
                    </div>
                  </div>
                )}

                {showSaveTemplate && (
                  <div className="confirm-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setShowSaveTemplate(false); }}>
                    <div className="confirm-card">
                      <h6 className="fw-semibold mb-2">Save as a new Template</h6>
                      <div className="mb-2">
                        <label className="form-label" style={{ fontSize: 13 }}>Template Name</label>
                        <input className="form-control" value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="e.g. Monthly Summary" />
                      </div>
                      <div className="mb-1">
                        <label className="form-label" style={{ fontSize: 13 }}>Description (optional)</label>
                        <input className="form-control" value={tplDesc} onChange={(e) => setTplDesc(e.target.value)} placeholder="Short description" />
                      </div>
                      <div className="confirm-actions">
                        <button className="btn btn-sm btn-soft" onClick={() => setShowSaveTemplate(false)}>Cancel</button>
                        <button className="btn btn-primary btn-sm" onClick={confirmSaveTemplate} disabled={tplBusy}>{tplBusy ? 'Saving...' : 'Save Template'}</button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default WriteReport;
