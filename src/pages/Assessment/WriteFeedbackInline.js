import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import FeedbackContentsApi from "../../api/feedbackContentsApi";

const createCell = () => ({
    content: "",
    rowSpan: 1,
    colSpan: 1,
    hidden: false,
    master: null,
    bold: false,
    italic: false,
    align: "left",
    vAlign: "top",
});

const WriteFeedbackInline = ({ hapuId, hapuName, initialSheet }) => {
    const [rows, setRows] = useState(8);
    const [cols, setCols] = useState(6);
    const [grid, setGrid] = useState(() =>
        Array.from({ length: 8 }, () => Array.from({ length: 6 }, createCell))
    );

    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [tplBusy, setTplBusy] = useState(false);

    // modals
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const [tplName, setTplName] = useState("");
    const [tplDesc, setTplDesc] = useState("");

    const [focus, setFocus] = useState(null);
    const [pendingFocus, setPendingFocus] = useState(null);
    const editorRefs = useRef(new Map());

    // helper: move caret to end of editable field
    const deferPlaceCaret = (el) => {
        try {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (!el) return;
                    const range = document.createRange();
                    range.selectNodeContents(el);
                    range.collapse(false);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                });
            });
        } catch { }
    };

    // load available templates
    useEffect(() => {
        (async () => {
            try {
                const tp = await FeedbackContentsApi.list({
                    perpage: -1,
                    isTemplate: 1,
                }).catch(() => ({}));
                setTemplates(tp?.data || []);
            } catch { }
        })();
    }, []);

    // load sheet content (edit mode)
    useEffect(() => {
        if (!initialSheet || !initialSheet.cells) return;
        try {
            const srows = Math.max(1, parseInt(initialSheet.rows ?? 8, 10) || 8);
            const scols = Math.max(1, parseInt(initialSheet.cols ?? 6, 10) || 6);
            const base = Array.from({ length: srows }, () =>
                Array.from({ length: scols }, createCell)
            );

            base.forEach((row) =>
                row.forEach((cell) => {
                    cell.hidden = false;
                    cell.master = null;
                })
            );

            if (Array.isArray(initialSheet.cells)) {
                initialSheet.cells.forEach((cell) => {
                    const { r, c, rowSpan = 1, colSpan = 1 } = cell;
                    if (r >= srows || c >= scols) return;

                    base[r][c] = {
                        ...base[r][c],
                        rowSpan,
                        colSpan,
                        content: cell.content || "",
                        bold: !!cell.bold,
                        italic: !!cell.italic,
                        align: cell.align || "left",
                        vAlign: cell.vAlign || "top",
                        hidden: false,
                        master: null,
                    };

                    for (let rr = 0; rr < rowSpan; rr++) {
                        for (let cc = 0; cc < colSpan; cc++) {
                            if (rr === 0 && cc === 0) continue;
                            const tr = r + rr,
                                tc = c + cc;
                            if (tr < srows && tc < scols)
                                base[tr][tc] = { ...base[tr][tc], hidden: true, master: { r, c } };
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

    // pending focus
    useEffect(() => {
        if (!pendingFocus) return;
        const { r, c } = pendingFocus;
        const key = `${r}-${c}`;
        const el = editorRefs.current.get(key);
        if (el && el.focus) el.focus();
        setPendingFocus(null);
    }, [pendingFocus]);

    useEffect(() => {
        const el = document.querySelector(
            `[data-feedback-sheet][data-hapu-id="${hapuId}"]`
        );
        if (el) {
            el.__getSheetData = () => serialize();
        }
        return () => {
            if (el) delete el.__getSheetData;
        };
    }, [grid, rows, cols, hapuId]);

    const onMouseDown = (r, c) => setFocus({ r, c });
    const getMasterCoords = (r, c) => {
        // prevent undefined or invalid access
        if (!grid || !Array.isArray(grid) || !grid[r] || !grid[r][c]) {
            return { r: 0, c: 0 };
        }
        const cell = grid[r][c];
        if (!cell) return { r: 0, c: 0 };
        return cell.hidden && cell.master ? { ...cell.master } : { r, c };
    };

    /** merge logic **/
    const canMergeRight = useMemo(() => {
        if (!focus || !grid?.[focus.r]?.[focus.c]) return false;
        const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c);
        const master = grid?.[mr]?.[mc];
        if (!master) return false;
        const nextCol = mc + (master.colSpan || 1);
        if (nextCol >= cols) return false;
        for (let rr = mr; rr < mr + (master.rowSpan || 1); rr++) {
            const cell = grid[rr][nextCol];
            if (!cell || cell.hidden || cell.rowSpan !== 1 || cell.colSpan !== 1)
                return false;
        }
        return true;
    }, [focus, grid, cols]);

    const canMergeDown = useMemo(() => {
        if (!focus || !grid?.[focus.r]?.[focus.c]) return false;
        const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c);
        const master = grid?.[mr]?.[mc];
        if (!master) return false;
        const nextRow = mr + (master.rowSpan || 1);
        if (nextRow >= grid.length) return false;
        const targetRow = grid[nextRow];
        if (!targetRow) return false;
        for (let cc = mc; cc < mc + (master.colSpan || 1); cc++) {
            const cell = targetRow[cc];
            if (!cell || cell.hidden || cell.rowSpan !== 1 || cell.colSpan !== 1)
                return false;
        }
        return true;
    }, [focus, grid, rows, cols]);

    const mergeRight = () => {
        if (!canMergeRight) return;
        const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c);
        setGrid((g) => {
            const next = g.map((row) => row.map((cell) => ({ ...cell })));
            const master = next[mr][mc];
            const rs = master.rowSpan || 1;
            const nextCol = mc + (master.colSpan || 1);
            next[mr][mc] = { ...master, colSpan: master.colSpan + 1 };
            for (let rr = 0; rr < rs; rr++) {
                const tr = mr + rr,
                    tc = nextCol;
                next[tr][tc] = { ...next[tr][tc], hidden: true, master: { r: mr, c: mc } };
            }
            return next;
        });
    };

    const mergeDown = () => {
        if (!canMergeDown) return;
        const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c);
        setGrid((g) => {
            const next = g.map((row) => row.map((cell) => ({ ...cell })));
            const master = next[mr][mc];
            const cs = master.colSpan || 1;
            const nextRow = mr + (master.rowSpan || 1);
            next[mr][mc] = { ...master, rowSpan: master.rowSpan + 1 };
            for (let cc = 0; cc < cs; cc++) {
                const tr = nextRow,
                    tc = mc + cc;
                next[tr][tc] = { ...next[tr][tc], hidden: true, master: { r: mr, c: mc } };
            }
            return next;
        });
    };

    const split = () => {
        if (!focus) return;
        const { r: mr, c: mc } = getMasterCoords(focus.r, focus.c);
        setGrid((g) => {
            const next = g.map((row) => row.map((cell) => ({ ...cell })));
            const master = next[mr][mc];
            const rs = master.rowSpan || 1;
            const cs = master.colSpan || 1;
            for (let rr = 0; rr < rs; rr++)
                for (let cc = 0; cc < cs; cc++) {
                    if (rr === 0 && cc === 0) continue;
                    const tr = mr + rr,
                        tc = mc + cc;
                    next[tr][tc] = { ...next[tr][tc], hidden: false, master: null };
                }
            next[mr][mc] = { ...master, rowSpan: 1, colSpan: 1 };
            return next;
        });
    };

    /** formatting **/
    const setFormatting = (patch) => {
        if (!focus) return;
        const { r, c } = focus;
        setGrid((g) => {
            const next = g.map((row) => row.map((cell) => ({ ...cell })));
            next[r][c] = { ...next[r][c], ...patch };
            return next;
        });
    };

    const handleInput = (r, c, html) => {
        setGrid((g) => {
            if (g[r][c].content === html) return g;
            const next = g.map((row, ri) =>
                row.map((cell, ci) =>
                    ri === r && ci === c ? { ...cell, content: html } : cell
                )
            );
            return next;
        });
    };

    const serialize = () => {
        const masters = [];

        const rowCount = grid.length;
        const colCount = grid[0]?.length ?? 0;

        for (let r = 0; r < rowCount; r++)
            for (let c = 0; c < colCount; c++) {
                const cell = grid[r][c];
                if (!cell.hidden)
                    masters.push({
                        r,
                        c,
                        rowSpan: cell.rowSpan,
                        colSpan: cell.colSpan,
                        content: cell.content,
                        bold: cell.bold,
                        italic: cell.italic,
                        align: cell.align,
                        vAlign: cell.vAlign,
                    });
            }
        return { rows: rowCount, cols: colCount, cells: masters };
    };

    /** template actions **/
    const onSaveNewTemplate = () => {
        setTplName(`${hapuName || "Hapū"} Template`);
        setTplDesc("");
        setTimeout(() => setShowSaveModal(true), 100); // 🧠 add short delay
    };

    const confirmSaveNewTemplate = useCallback(async () => {
        try {
            setTplBusy(true);
            await new Promise((r) => setTimeout(r, 0));
            const current = serialize();

            const payload = {
                name: tplName.trim(),
                description: tplDesc.trim(),
                isTemplate: true,
                visibility: "private",
                sheet: current,
            };

            await FeedbackContentsApi.create(payload);
            const list = await FeedbackContentsApi.list({ perpage: -1, isTemplate: 1 });
            setTemplates(list?.data || []);
            setSuccess("Template created successfully");
            setShowSaveModal(false);
        } catch (e) {
            setError(e.message || "Failed to create template");
        } finally {
            setTplBusy(false);
        }
    }, [tplName, tplDesc, grid]);



    const confirmUpdateTemplate = async () => {
        try {
            setTplBusy(true);

            // Wait one render tick to ensure latest state after any add/remove
            await new Promise((r) => setTimeout(r, 0));

            const current = serialize(); // always recompute from grid
            await FeedbackContentsApi.update(selectedTemplate, {
                sheet: current, // ✅ no redundant overwrite
                updatedAt: new Date(),
            });

            setSuccess("Template updated successfully");
            setShowConfirmUpdate(false);
        } catch (e) {
            setError(e.message || "Failed to update template");
        } finally {
            setTplBusy(false);
        }
    };


    const confirmDeleteTemplate = async () => {
        try {
            setTplBusy(true);
            await FeedbackContentsApi.remove(selectedTemplate);
            setSelectedTemplate("");
            setTemplates((prev) => prev.filter((t) => t._id !== selectedTemplate));
            setRows(8);
            setCols(6);
            setGrid(Array.from({ length: 8 }, () => Array.from({ length: 6 }, createCell)));
            setSuccess("Template deleted");
            setShowConfirmDelete(false);
        } catch (e) {
            setError(e.message || "Failed to delete template");
        } finally {
            setTplBusy(false);
        }
    };
    const loadTemplate = async (id) => {
        if (!id) {
            setRows(8);
            setCols(6);
            setGrid(Array.from({ length: 8 }, () =>
                Array.from({ length: 6 }, createCell)
            ));
            setFocus(null);
            return;
        }
        const got = await FeedbackContentsApi.getById(id).catch(() => null);
        const sheet = got?.data?.sheet;
        if (!sheet) return;
        const srows = Math.max(1, parseInt(sheet.rows ?? 8, 10) || 8);
        const scols = Math.max(1, parseInt(sheet.cols ?? 6, 10) || 6);
        const base = Array.from({ length: srows }, () =>
            Array.from({ length: scols }, createCell)
        );

        base.forEach((row) =>
            row.forEach((cell) => {
                cell.hidden = false;
                cell.master = null;
            })
        );

        if (Array.isArray(sheet.cells)) {
            sheet.cells.forEach((cell) => {
                const { r, c, rowSpan = 1, colSpan = 1 } = cell;
                if (r >= srows || c >= scols) return;

                base[r][c] = {
                    ...base[r][c],
                    rowSpan,
                    colSpan,
                    content: cell.content || "",
                    bold: !!cell.bold,
                    italic: !!cell.italic,
                    align: cell.align || "left",
                    vAlign: cell.vAlign || "top",
                    hidden: false,
                    master: null,
                };

                for (let rr = 0; rr < rowSpan; rr++) {
                    for (let cc = 0; cc < colSpan; cc++) {
                        if (rr === 0 && cc === 0) continue;
                        const tr = r + rr,
                            tc = c + cc;
                        if (tr < srows && tc < scols)
                            base[tr][tc] = { ...base[tr][tc], hidden: true, master: { r, c } };
                    }
                }
            });
        }

        setRows(srows);
        setCols(scols);
        setGrid(base);
    };
    /** RENDER **/
    return (
        <div className="card mt-2" data-feedback-sheet data-hapu-id={hapuId} data-hapu-name={hapuName}>
            <style>{`
                .fb-toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
                .fb-group { display: flex; align-items: center; background: #f9feff; border: 1px solid #cfe5ea; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,.04); }
                .fb-group .fb-btn { appearance: none; border: 0; border-right: 1px solid #cfe5ea; background: transparent; padding: 6px 12px; color: #236472; font-weight: 600; line-height: 1; cursor: pointer; }
                .fb-group .fb-btn:last-child { border-right: 0; }
                .fb-group .fb-btn:hover { background: #eaf7fb; }
                .fb-group .fb-btn:disabled { opacity: .45; cursor: not-allowed; }
                .sheet-scroll {
                    overflow-x: auto;
                    overflow-y: hidden;
                    -webkit-overflow-scrolling: touch;
                    width: 100%;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    background: #f8f9fa;
                    }

                    .sheet-scroll::-webkit-scrollbar {
                    height: 8px;
                    }
                    .sheet-scroll::-webkit-scrollbar-thumb {
                    background-color: #ccc;
                    border-radius: 4px;
                    }
                `}</style>
            <div className="card-body pt-2">
                <div className="d-flex align-items-center justify-content-between">
                    <h6 className="fw-semibold mb-2">Feedback for: {hapuName || "Hapū"}</h6>
                    <div className="d-flex align-items-center gap-2">
                        <a className="btn btn-sm btn-success" onClick={(e) => {
                            e.stopPropagation(); // 🧠 prevents click bubbling
                            onSaveNewTemplate();
                        }}>
                            Save as New Template
                        </a>
                        {selectedTemplate && (
                            <>
                                <a className="btn btn-sm btn-warning" onClick={() => setShowConfirmUpdate(true)}>
                                    Update Template
                                </a>
                                <a className="btn btn-sm btn-danger" onClick={() => setShowConfirmDelete(true)}>
                                    Delete Template
                                </a>
                            </>
                        )}
                    </div>
                </div>

                {/* Template dropdown */}
                <div className="row mb-2 align-items-end">
                    <div className="col-sm-6 col-md-4">
                        <label>Template</label>
                        <select
                            className="form-control"
                            value={selectedTemplate}
                            onChange={async (e) => {
                                const id = e.target.value;
                                setSelectedTemplate(id);
                                loadTemplate(id)
                            }}
                        >
                            <option value="">From scratch</option>
                            {templates.map((t) => (
                                <option key={t._id} value={t._id}>
                                    {t.name || "Template"}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="fb-toolbar mb-2">
                    <div className="fb-group">
                        <button type="button" className="fb-btn" onClick={() => setGrid((g) => [...g, Array.from({ length: cols }, createCell)])}>+ Row</button>
                        <button type="button" className="fb-btn" onClick={() => { setGrid((g) => { const next = g.map((row) => [...row, createCell()]); return next; }); setCols((c) => c + 1); }}>+ Col</button>
                        <button type="button" className="fb-btn" onClick={() => { if (rows > 1) { setGrid((g) => g.slice(0, -1)); setRows((r) => r - 1); } }}>- Row</button>
                        <button type="button" className="fb-btn" onClick={() => { if (cols > 1) { setGrid((g) => g.map((row) => row.slice(0, -1))); setCols((c) => c - 1); } }}>- Col</button>
                        <button type="button" className="fb-btn" disabled={!canMergeRight} onClick={mergeRight}>Merge →</button>
                        <button type="button" className="fb-btn" disabled={!canMergeDown} onClick={mergeDown}>Merge ↓</button>
                        <button type="button" className="fb-btn" onClick={split}>Split</button> </div> <div className="fb-group">
                        <button type="button" className="fb-btn" onClick={() => setFormatting({ bold: true })}>B</button>
                        <button type="button" className="fb-btn" onClick={() => setFormatting({ bold: false, italic: false, align: "left", vAlign: "top" })}>Normal</button>
                        <button type="button" className="fb-btn" onClick={() => setFormatting({ italic: true })}>I</button> <button type="button" className="fb-btn" onClick={() => setFormatting({ align: "left" })}>Left</button>
                        <button type="button" className="fb-btn" onClick={() => setFormatting({ align: "right" })}>Right</button> <button type="button" className="fb-btn" onClick={() => setFormatting({ align: "center" })}>Center</button>
                        <button type="button" className="fb-btn" onClick={() => setFormatting({ vAlign: "middle" })}>VCenter</button> </div> </div>

                {/* table grid */}
                <div className="sheet-outer">
                    <div className="sheet-scroll">
                        <div
                            style={{
                                position: "relative",
                                minWidth: cols * 120,
                                display: "grid",
                                gridTemplateColumns: `repeat(${cols}, minmax(120px, 1fr))`,
                                gridAutoRows: "minmax(44px, auto)",
                                gap: 1,
                                padding: 1,
                                background: "#e9ecef",
                            }}
                        >
                            {grid.map((row, r) =>
                                row.map((cell, c) =>
                                    cell.hidden ? null : (
                                        <div
                                            key={`cell-${r}-${c}`}
                                            onMouseDown={(e) => {
                                                if (e.button !== 0) return;
                                                onMouseDown(r, c);
                                            }}
                                            style={{
                                                gridColumn: `span ${cell.colSpan}`,
                                                gridRow: `span ${cell.rowSpan}`,
                                                background: "#fff",
                                                border: "1px solid #e9ecef",
                                                display: "flex",
                                                alignItems:
                                                    cell.vAlign === "middle"
                                                        ? "center"
                                                        : cell.vAlign === "bottom"
                                                            ? "flex-end"
                                                            : "flex-start",
                                            }}
                                        >
                                            <div
                                                contentEditable
                                                suppressContentEditableWarning
                                                dir="ltr"
                                                lang="en"
                                                ref={(el) => {
                                                    const k = `${r}-${c}`;
                                                    if (el) {
                                                        editorRefs.current.set(k, el);
                                                        // only set content when cell changes externally
                                                        if (el.innerHTML !== (cell.content || "")) {
                                                            el.innerHTML = cell.content || "";
                                                        }
                                                    } else {
                                                        editorRefs.current.delete(k);
                                                    }
                                                }}
                                                onFocus={(e) => {
                                                    setFocus({ r, c });
                                                    if (e.currentTarget.innerHTML.trim() === "")
                                                        deferPlaceCaret(e.currentTarget);
                                                }}
                                                onInput={(e) => {
                                                    const html = e.currentTarget.innerHTML;
                                                    setGrid((g) => {
                                                        const next = g.map((row) => row.map((cell) => ({ ...cell })));
                                                        next[r][c].content = html;
                                                        return next;
                                                    });
                                                }}
                                                style={{
                                                    minHeight: 36,
                                                    padding: "6px 8px",
                                                    outline: "none",
                                                    fontWeight: cell.bold ? 700 : 400,
                                                    fontStyle: cell.italic ? "italic" : "normal",
                                                    textAlign: cell.align || "left",
                                                    width: "100%",
                                                    direction: "ltr",
                                                    unicodeBidi: "isolate",
                                                    whiteSpace: "pre-wrap",
                                                }}
                                            />
                                        </div>
                                    )
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* MODALS */}
                {showSaveModal && (
                    <Modal
                        title="Save as New Template"
                        onClose={() => setShowSaveModal(false)}
                        onConfirm={confirmSaveNewTemplate}
                        busy={tplBusy}
                    >
                        <div className="mb-3">
                            <label className="form-label">Template Name</label>
                            <input
                                className="form-control"
                                value={tplName}
                                onChange={(e) => setTplName(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Description</label>
                            <input
                                className="form-control"
                                value={tplDesc}
                                onChange={(e) => setTplDesc(e.target.value)}
                            />
                        </div>
                    </Modal>
                )}

                {showConfirmUpdate && (
                    <Modal
                        title="Update Template"
                        message="Are you sure you want to overwrite this template?"
                        onClose={() => setShowConfirmUpdate(false)}
                        onConfirm={confirmUpdateTemplate}
                        busy={tplBusy}
                    />
                )}

                {showConfirmDelete && (
                    <Modal
                        title="Delete Template"
                        message="This will permanently delete the selected template. Continue?"
                        onClose={() => setShowConfirmDelete(false)}
                        onConfirm={confirmDeleteTemplate}
                        busy={tplBusy}
                        danger
                    />
                )}

                {success && <div className="alert alert-success mt-2 p-2">{success}</div>}
                {error && <div className="alert alert-danger mt-2 p-2">{error}</div>}
            </div>
        </div>
    );
};

/** Shared Modal Component **/
const Modal = ({ title, message, children, onClose, onConfirm, busy, danger }) => (
    <div
        className="modal fade show"
        style={{ display: "block", backgroundColor: "rgba(0,0,0,0.45)" }}
    >
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 480 }}>
            <div className="modal-content">
                <div className="modal-header">
                    <h6 className="modal-title fw-semibold">{title}</h6>
                    <button type="button" className="btn-close" onClick={onClose} />
                </div>
                <div className="modal-body">
                    {message && <p>{message}</p>}
                    {children}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
                        onClick={() => {
                            if (!busy) onConfirm?.();  // ✅ safe conditional trigger
                        }}
                        disabled={busy}
                    >
                        {busy ? "Processing..." : "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default WriteFeedbackInline;
