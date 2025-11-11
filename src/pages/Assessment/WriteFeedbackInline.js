import React, { useEffect, useMemo, useRef, useState } from "react";
import FeedbackContentsApi from "../../api/feedbackContentsApi";
import axios from "../../api/axiosInstance";

const createCell = () => ({ content: "", rowSpan: 1, colSpan: 1, hidden: false, master: null, bold: false, italic: false, align: "left", vAlign: "top" });

const WriteFeedbackInline = ({ hapuId,hapuName,initialSheet }) => {
    const [rows, setRows] = useState(8);
    const [cols, setCols] = useState(6);
    const [grid, setGrid] = useState(() => Array.from({ length: 8 }, () => Array.from({ length: 6 }, createCell)));

    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [tplBusy, setTplBusy] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [tplName, setTplName] = useState("");
    const [tplDesc, setTplDesc] = useState("");
    const [dataLoading, setDataLoading] = useState(true);

    const [focus, setFocus] = useState(null);
    const [pendingFocus, setPendingFocus] = useState(null);
    const editorRefs = useRef(new Map());

    const deferPlaceCaret = (el) => {
        try { requestAnimationFrame(() => { requestAnimationFrame(() => { if (el) { const range = document.createRange(); range.selectNodeContents(el); range.collapse(false); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); } }); }); } catch { }
    };

    useEffect(() => {
        (async () => {
            try {
                setDataLoading(true);
                const tp = await FeedbackContentsApi.list({ perpage: -1, isTemplate: 1 }).catch(() => ({}));
                setTemplates(tp?.data || []);
            } finally {
                setDataLoading(false);
            }
        })();
    }, []);


    useEffect(() => {
        if (!initialSheet || !initialSheet.cells) return;
        try {
          const srows = Math.max(1, parseInt(initialSheet.rows ?? 8, 10) || 8);
          const scols = Math.max(1, parseInt(initialSheet.cols ?? 6, 10) || 6);
          const base = Array.from({ length: srows }, () => Array.from({ length: scols }, createCell));
      
          if (Array.isArray(initialSheet.cells)) {
            initialSheet.cells.forEach((cell) => {
              const r = cell.r, c = cell.c;
              if (r < srows && c < scols) {
                base[r][c] = {
                  ...base[r][c],
                  rowSpan: cell.rowSpan || 1,
                  colSpan: cell.colSpan || 1,
                  content: cell.content || "",
                  bold: !!cell.bold,
                  italic: !!cell.italic,
                  align: cell.align || "left",
                  vAlign: cell.vAlign || "top",
                };
                for (let rr = 0; rr < (cell.rowSpan || 1); rr++) {
                  for (let cc = 0; cc < (cell.colSpan || 1); cc++) {
                    if (rr === 0 && cc === 0) continue;
                    const tr = r + rr, tc = c + cc;
                    if (tr < srows && tc < scols)
                      base[tr][tc] = { ...base[tr][tc], hidden: true, master: { r, c } };
                  }
                }
              }
            });
          }
          setRows(srows);
          setCols(scols);
          setGrid(base);
        } catch (err) {
          console.error("Failed to preload feedback sheet:", err);
        }
      }, [initialSheet]);
    useEffect(() => {
        if (!pendingFocus) return;
        const { r, c } = pendingFocus;
        const key = `${r}-${c}`;
        const el = editorRefs.current.get(key);
        if (el && el.focus) { try { el.focus(); } catch { } }
        deferPlaceCaret(el);
        setPendingFocus(null);
    }, [pendingFocus]);

    const onMouseDown = (r, c) => { setFocus({ r, c }); setPendingFocus({ r, c }); };
    const getMasterCoords = (r, c) => { const cell = grid[r][c]; if (cell.hidden && cell.master) return { r: cell.master.r, c: cell.master.c }; return { r, c }; };

    const canMergeRight = useMemo(() => {
        if (!focus) return false; const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c);
        const master = grid[mr][mc]; const nextCol = mc + (master.colSpan || 1); if (nextCol >= cols) return false;
        for (let rr = mr; rr < mr + (master.rowSpan || 1); rr++) { const cell = grid[rr][nextCol]; if (!cell || cell.hidden || (cell.rowSpan !== 1 || cell.colSpan !== 1)) return false; }
        return true;
    }, [focus, grid, cols]);
    const canMergeDown = useMemo(() => {
        if (!focus) return false; const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c);
        const master = grid[mr][mc]; const nextRow = mr + (master.rowSpan || 1); if (nextRow >= rows) return false;
        for (let cc = mc; cc < mc + (master.colSpan || 1); cc++) { const cell = grid[nextRow][cc]; if (!cell || cell.hidden || (cell.rowSpan !== 1 || cell.colSpan !== 1)) return false; }
        return true;
    }, [focus, grid, rows]);

    const mergeRight = () => {
        if (!canMergeRight) return; const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c);
        setGrid((g) => {
            const next = g.map((row) => row.map((cell) => ({ ...cell })));
            const master = next[mr][mc]; const rs = master.rowSpan || 1; const nextCol = mc + (master.colSpan || 1);
            next[mr][mc] = { ...master, colSpan: (master.colSpan || 1) + 1 };
            for (let rr = 0; rr < rs; rr++) { const tr = mr + rr; const tc = nextCol; next[tr][tc] = { ...next[tr][tc], hidden: true, master: { r: mr, c: mc } }; }
            return next;
        });
    };
    const mergeDown = () => {
        if (!canMergeDown) return; const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c);
        setGrid((g) => {
            const next = g.map((row) => row.map((cell) => ({ ...cell })));
            const master = next[mr][mc]; const cs = master.colSpan || 1; const nextRow = mr + (master.rowSpan || 1);
            next[mr][mc] = { ...master, rowSpan: (master.rowSpan || 1) + 1 };
            for (let cc = 0; cc < cs; cc++) { const tr = nextRow; const tc = mc + cc; next[tr][tc] = { ...next[tr][tc], hidden: true, master: { r: mr, c: mc } }; }
            return next;
        });
    };
    const split = () => {
        if (!focus) return; const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c);
        setGrid((g) => {
            const next = g.map((row) => row.map((cell) => ({ ...cell })));
            const master = next[mr][mc]; const rs = master.rowSpan || 1; const cs = master.colSpan || 1;
            for (let rr = 0; rr < rs; rr++) for (let cc = 0; cc < cs; cc++) { if (rr === 0 && cc === 0) continue; const tr = mr + rr; const tc = mc + cc; next[tr][tc] = { ...next[tr][tc], hidden: false, master: null }; }
            next[mr][mc] = { ...master, rowSpan: 1, colSpan: 1 }; return next;
        });
    };

    const setFormatting = (patch) => { if (!focus) return; const { r, c } = focus; setGrid((g) => { const next = g.map((row) => row.map((cell) => ({ ...cell }))); next[r][c] = { ...next[r][c], ...patch }; return next; }); };
    const handleInput = (r, c, html) => { setGrid((g) => { const next = g.map((row) => row.map((cell) => ({ ...cell }))); next[r][c].content = html; return next; }); const el = editorRefs.current.get(`${r}-${c}`); deferPlaceCaret(el); };

    const serialize = () => {
        const masters = [];
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) 
            {  const cell = grid[r][c]; 
               if (!cell.hidden) 
                masters.push({ r, c, rowSpan: cell.rowSpan || 1, colSpan: cell.colSpan || 1, content: cell.content || "", bold: !!cell.bold, italic: !!cell.italic, align: cell.align || "left", vAlign: cell.vAlign || "top" }); }
        return { rows, cols, cells: masters };
    };
     // expose to parent
     useEffect(() => {
       const el = document.querySelector(`[data-hapu-id="${hapuId}"]`);
       if (el) el.__getSheetData = serialize;
       return () => { if (el) delete el.__getSheetData; };
     }, [grid]);
    const onSaveTemplate = () => { setTplName(hapuName ? `${hapuName} Template` : "Template"); setTplDesc(""); setShowSaveTemplate(true); };
    const confirmSaveTemplate = async () => {
        try {
            setTplBusy(true); setError(""); setSuccess("");
            const payload = { name: (tplName || "Template").trim(), description: tplDesc || "", isTemplate: true, visibility: "private", sheet: serialize() };
            await FeedbackContentsApi.create(payload);
            const listResp = await FeedbackContentsApi.list({ perpage: -1, isTemplate: 1 }).catch(() => ({}));
            setTemplates(listResp?.data || []);
            setSuccess("Feedback template saved");
            setShowSaveTemplate(false);
        } catch (e) { setError(e.message || "Failed"); } finally { setTplBusy(false); }
    };

    return (
        <div className="card mt-2" data-feedback-sheet data-hapu-id={hapuId} data-hapu-name={hapuName}>
            <div className="card-body pt-2">
                <style>{`
          .fb-toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
          .fb-group { display: flex; align-items: center; background: #f9feff; border: 1px solid #cfe5ea; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,.04); }
          .fb-group .fb-btn { appearance: none; border: 0; border-right: 1px solid #cfe5ea; background: transparent; padding: 6px 12px; color: #236472; font-weight: 600; line-height: 1; cursor: pointer; }
          .fb-group .fb-btn:last-child { border-right: 0; }
          .fb-group .fb-btn:hover { background: #eaf7fb; }
          .fb-group .fb-btn:disabled { opacity: .45; cursor: not-allowed; }
        `}</style>
                <div className="d-flex align-items-center justify-content-between">
                    <h6 className="fw-semibold mb-2">Feedback for: {hapuName || "Hapū"}</h6>
                    <div className="d-flex align-items-center gap-2">
                        <button type="button" className="btn btn-sm btn-warning" onClick={onSaveTemplate}>Save as Template</button>
                    </div>
                </div>
                <div className="row mb-2 align-items-end">
                    <div className="col-sm-6 col-md-4">
                        <label>Template</label>
                        <select className="form-control" value={selectedTemplate} onChange={async (e) => {
                            const id = e.target.value; setSelectedTemplate(id);
                            if (!id) { const r = 8, c = 6; setRows(r); setCols(c); setGrid(Array.from({ length: r }, () => Array.from({ length: c }, createCell))); return; }
                            const got = await FeedbackContentsApi.getById(id).catch(() => null);
                            const sheet = got?.data?.sheet; if (!sheet) return;
                            const srows = Math.max(1, parseInt(sheet.rows ?? 8, 10) || 8);
                            const scols = Math.max(1, parseInt(sheet.cols ?? 6, 10) || 6);
                            const base = Array.from({ length: srows }, () => Array.from({ length: scols }, createCell));
                            if (Array.isArray(sheet.cells)) {
                                sheet.cells.forEach((cell) => {
                                    const r = cell.r, c = cell.c; if (r < srows && c < scols) {
                                        base[r][c] = { ...base[r][c], rowSpan: cell.rowSpan || 1, colSpan: cell.colSpan || 1, content: cell.content || "", bold: !!cell.bold, italic: !!cell.italic, align: cell.align || "left", vAlign: cell.vAlign || "top" };
                                        for (let rr = 0; rr < (cell.rowSpan || 1); rr++) for (let cc = 0; cc < (cell.colSpan || 1); cc++) { if (rr === 0 && cc === 0) continue; const tr = r + rr, tc = c + cc; if (tr < srows && tc < scols) base[tr][tc] = { ...base[tr][tc], hidden: true, master: { r, c } }; }
                                    }
                                });
                            }
                            setRows(srows); setCols(scols); setGrid(base);
                        }}>
                            <option value="">From scratch</option>
                            {templates.map((t) => (<option key={t._id} value={t._id}>{t.name || "Template"}</option>))}
                        </select>
                    </div>
                </div>

                <div className="fb-toolbar mb-2">
                    <div className="fb-group">
                        <button type="button" className="fb-btn" onClick={() => setGrid((g) => [...g, Array.from({ length: cols }, createCell)])}>+ Row</button>
                        <button type="button" className="fb-btn" onClick={() => {
                            setGrid((g) => {
                                const next = g.map((row) => [...row, createCell()]);
                                return next;
                            });
                            setCols((c) => c + 1);
                        }}>+ Col</button>
                        <button type="button" className="fb-btn" onClick={() => { if (rows > 1) { setGrid((g) => g.slice(0, -1)); setRows((r) => r - 1); } }}>- Row</button>
                        <button type="button" className="fb-btn" onClick={() => { if (cols > 1) { setGrid((g) => g.map((row) => row.slice(0, -1))); setCols((c) => c - 1); } }}>- Col</button>
                        <button type="button" className="fb-btn" disabled={!canMergeRight} onClick={mergeRight}>Merge →</button>
                        <button type="button" className="fb-btn" disabled={!canMergeDown} onClick={mergeDown}>Merge ↓</button>
                        <button type="button" className="fb-btn" onClick={split}>Split</button>
                    </div>
                    <div className="fb-group">
                        <button type="button" className="fb-btn" onClick={() => setFormatting({ bold: true })}>B</button>
                        <button type="button" className="fb-btn" onClick={() => setFormatting({ bold: false, italic: false, align: "left", vAlign: "top" })}>Normal</button>
                        <button type="button" className="fb-btn" onClick={() => setFormatting({ italic: true })}>I</button>
                        <button type="button" className="fb-btn" onClick={() => setFormatting({ align: "left" })}>Left</button>
                        <button type="button" className="fb-btn" onClick={() => setFormatting({ align: "right" })}>Right</button>
                        <button type="button" className="fb-btn" onClick={() => setFormatting({ align: "center" })}>Center</button>
                        <button type="button" className="fb-btn" onClick={() => setFormatting({ vAlign: "middle" })}>VCenter</button>
                    </div>
                </div>

                <div className="sheet-outer">
                    <div className="sheet-scroll">
                        <div style={{ position: "relative", minWidth: 900, display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(120px, 1fr))`, gridAutoRows: "minmax(44px, auto)", gap: 1, padding: 1, background: "#e9ecef", userSelect: "none" }}>
                            {grid.map((row, r) => row.map((cell, c) => (cell.hidden ? null : (
                                <div key={`cell-${r}-${c}`} onMouseDownCapture={(e) => { if (e.button !== 0) return; e.preventDefault(); onMouseDown(r, c); }} style={{ gridColumn: `span ${cell.colSpan || 1}`, gridRow: `span ${cell.rowSpan || 1}`, background: "#fff", border: "1px solid #e9ecef", display: "flex", alignItems: (cell.vAlign === "middle" ? "center" : (cell.vAlign === "bottom" ? "flex-end" : "flex-start")) }}>
                                    <div contentEditable suppressContentEditableWarning ref={(el) => { const k = `${r}-${c}`; if (el) editorRefs.current.set(k, el); else editorRefs.current.delete(k); }} onFocus={() => { setFocus({ r, c }); const el = editorRefs.current.get(`${r}-${c}`); deferPlaceCaret(el); }} onInput={(e) => handleInput(r, c, e.currentTarget.innerHTML)} style={{ minHeight: 36, padding: "6px 8px", outline: "none", fontWeight: cell.bold ? 700 : 400, fontStyle: cell.italic ? "italic" : "normal", textAlign: cell.align || "left", width: "100%" }} dangerouslySetInnerHTML={{ __html: cell.content || "" }} />
                                </div>
                            ))))}
                        </div>
                    </div>
                </div>

                {showSaveTemplate && (
                    <div className="confirm-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setShowSaveTemplate(false); }}>
                        <div className="confirm-card">
                            <h6 className="fw-semibold mb-2">Save as a new Feedback Template</h6>
                            <div className="mb-2"><label className="form-label" style={{ fontSize: 13 }}>Template Name</label><input className="form-control" value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="e.g. Quarterly Feedback" /></div>
                            <div className="mb-1"><label className="form-label" style={{ fontSize: 13 }}>Description</label><input className="form-control" value={tplDesc} onChange={(e) => setTplDesc(e.target.value)} placeholder="Short description" /></div>
                            <div className="confirm-actions">
                                <button type="button" className="btn btn-sm btn-soft" onClick={() => setShowSaveTemplate(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary btn-sm" onClick={confirmSaveTemplate} disabled={tplBusy}>{tplBusy ? "Saving..." : "Save Template"}</button>
                            </div>
                        </div>
                    </div>
                )}
                {success && (<div className="alert alert-success mt-2 p-2">{success}</div>)}
                {error && (<div className="alert alert-danger mt-2 p-2">{error}</div>)}
            </div>
        </div>
    );
};

export default WriteFeedbackInline;


