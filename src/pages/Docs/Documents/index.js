import React, { useEffect, useMemo, useState } from 'react';
import DocsApi from '../../../api/docsApi';

const tileStyles = {
  tile: (selected) => ({
    width: 112,
    height: 96,
    borderRadius: 10,
    border: 'none',
    background: selected ? 'rgba(6,182,212,0.08)' : '#fff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    padding: 6,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
  }),
  name: { marginTop: 6, fontSize: 12, textAlign: 'center', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};

const DocumentsPage = () => {
  const [cwd, setCwd] = useState('/');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clipboard, setClipboard] = useState(null);
  const [newName, setNewName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(null); // path
  const [toasts, setToasts] = useState([]);
  const [contextMenu, setContextMenu] = useState(null); // {x,y,item}
  const [confirm, setConfirm] = useState(null); // {name, path}
  const [rename, setRename] = useState(null); // {path, name, value}

  const load = async (path = cwd) => {
    setLoading(true);
    setError('');
    try {
      const res = await DocsApi.list(path);
      // res is already the array after axios interceptor and .then(r => r.data)
      setItems(Array.isArray(res) ? res : []);
      setCwd(path);
      setSelected(null);
    } catch (err) {
      console.error('Load error:', err);
      setItems([]);
      setError(err?.message || 'Failed to load directory');
    } finally { setLoading(false); }
  };

  useEffect(() => { load('/'); }, []);

  const parts = useMemo(() => cwd.split('/').filter(Boolean), [cwd]);
  const goUp = () => { if (cwd === '/') return; const p = '/' + parts.slice(0, -1).join('/'); load(p || '/'); };
  const goInto = (name) => load((cwd === '/' ? '' : cwd) + '/' + name);

  const onMkdir = async () => {
    if (!newName.trim()) return;
    try {
      await DocsApi.mkdir(cwd, newName.trim());
      setNewName('');
      await load();
    } catch (err) {
      setToasts((t) => {
        const id = Date.now();
        setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 3000);
        return [...t, { id, text: `Create folder failed: ${err?.response?.data?.message || err.message || 'Server error'}` }];
      });
    }
  };
  const onUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      await DocsApi.upload(cwd, f);
      setToasts((t) => {
        const id = Date.now();
        setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 2200);
        return [...t, { id, text: `Uploaded ${f.name}` }];
      });
      await load();
    } catch (err) {
      setToasts((t) => {
        const id = Date.now();
        setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 3000);
        return [...t, { id, text: `Upload failed: ${err?.response?.data?.message || err.message || 'Server error'}` }];
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };
  const onDelete = async (p) => {
    try {
      await DocsApi.remove(p);
      await load();
    } catch (err) {
      setToasts((t) => {
        const id = Date.now();
        setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 3000);
        return [...t, { id, text: `Delete failed: ${err?.response?.data?.message || err.message || 'Server error'}` }];
      });
    }
  };
  const onRename = (p) => {
    const old = p.split('/').pop();
    setRename({ path: p, name: old, value: old });
  };
  const doRename = async () => {
    if (!rename) return;
    const newName = (rename.value || '').trim();
    if (!newName || newName === rename.name) { setRename(null); return; }
    try {
      await DocsApi.rename(rename.path, newName);
      setRename(null);
      setToasts((t) => {
        const id = Date.now();
        setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 2200);
        return [...t, { id, text: `Renamed to ${newName}` }];
      });
      await load();
    } catch (err) {
      setToasts((t) => {
        const id = Date.now();
        setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 3000);
        return [...t, { id, text: `Rename failed: ${err?.response?.data?.message || err.message || 'Server error'}` }];
      });
    }
  };
  const onCut = (p) => setClipboard({ type:'cut', path:p });
  const onCopy = (p) => setClipboard({ type:'copy', path:p });
  const pasteInto = async (targetFolderPath) => {
    if (!clipboard) return;
    const name = clipboard.path.split('/').pop();
    const toPath = (targetFolderPath === '/' ? '' : targetFolderPath) + '/' + name;
    try {
      if (clipboard.type === 'cut') {
        await DocsApi.move(clipboard.path, toPath);
        setClipboard(null);
        setToasts((t) => {
          const id = Date.now();
          setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 2200);
          return [...t, { id, text: `Moved to ${targetFolderPath}` }];
        });
      } else {
        await DocsApi.copy(clipboard.path, toPath);
        setClipboard(null);
        setToasts((t) => {
          const id = Date.now();
          setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 2200);
          return [...t, { id, text: `Copied here` }];
        });
      }
      await load(targetFolderPath);
    } catch (err) {
      setToasts((t) => {
        const id = Date.now();
        setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 3000);
        return [...t, { id, text: `Paste failed: ${err?.response?.data?.message || err.message || 'Server error'}` }];
      });
    }
  };

  const onPaste = async () => pasteInto(cwd);

  const confirmDelete = (p, name) => setConfirm({ path: p, name });
  const doDelete = async () => {
    if (!confirm) return;
    const p = confirm.path;
    const name = confirm.name;
    setConfirm(null);
    try {
      await DocsApi.remove(p);
      setToasts((t) => {
        const id = Date.now();
        setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 2200);
        return [...t, { id, text: `Deleted ${name}` }];
      });
      await load();
    } catch (err) {
      setToasts((t) => {
        const id = Date.now();
        setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 3000);
        return [...t, { id, text: `Delete failed: ${err?.response?.data?.message || err.message || 'Server error'}` }];
      });
    }
  };

  const selectedItem = items.find(i => i.path === selected);

  // Button style helpers
  const colors = { primary:'#06b6d4', indigo:'#6366f1', green:'#22c55e', danger:'#ef4444', slate:'#475569' };
  const btnFilled = (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:999, padding:'8px 16px', fontWeight:700, boxShadow:'0 1px 2px rgba(0,0,0,0.06)' });
  const btnOutline = (color) => ({ background:'#fff', color, border:`1px solid ${color}`, borderRadius:999, padding:'8px 14px', fontWeight:700 });

  return (
    <div className="card mt-3" style={{ minHeight: 'calc(100vh - 120px)', display:'flex', flexDirection:'column' }}>
      {/* Toasts */}
      <div style={{ position:'fixed', top: 16, right: 16, zIndex: 1060, display:'flex', flexDirection:'column', gap:8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display:'flex', alignItems:'center', gap:8,
            background:'#0f172a', color:'#e2e8f0', padding:'10px 14px', borderRadius:12,
            boxShadow:'0 10px 20px rgba(0,0,0,0.25)', border:'1px solid #1e293b',
            transform: 'translateY(0)', opacity: 1,
            transition: 'opacity 200ms ease-out, transform 200ms ease-out'
          }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#22c55e' }}></span>
            <div style={{ fontWeight:700 }}>{t.text}</div>
          </div>
        ))}
      </div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">
        <h6 className="fw-semibold mb-0">Ngā Mahi</h6>
        <div className="d-flex align-items-center gap-2 flex-wrap" style={{ rowGap: 8 }}>
          <button className="btn btn-sm" style={btnOutline(colors.primary)} onClick={goUp}><i className="mdi mdi-arrow-up-bold"></i> Up</button>
          <div className="d-none d-md-flex align-items-center gap-2">
            <input className="form-control form-control-sm" style={{ width: 'min(240px, 60vw)', borderRadius:999 }} value={newName} onChange={(e)=> setNewName(e.target.value)} placeholder="New folder name" />
            <button className="btn btn-sm" style={btnFilled(colors.indigo)} onClick={onMkdir} disabled={!newName}><i className="mdi mdi-folder-plus-outline"></i> New Folder</button>
          </div>
          <label className="btn btn-sm mb-0" style={btnFilled(colors.green)}>
            <i className="mdi mdi-upload"></i> {uploading ? 'Uploading...' : 'Upload File'}
            <input type="file" hidden onChange={onUpload} />
          </label>
          {/* Always show actions; disable when inapplicable */}
          <button
            className="btn btn-sm"
            style={{ ...btnOutline(colors.primary), opacity: selectedItem ? 1 : 0.5 }}
            disabled={!selectedItem}
            onClick={() => { if (!selectedItem) return; onRename(selectedItem.path); }}
          >
            <i className="mdi mdi-rename-box"></i> Rename
          </button>
          <button
            className="btn btn-sm"
            style={{ ...btnOutline(colors.primary), opacity: selectedItem ? 1 : 0.5 }}
            disabled={!selectedItem}
            onClick={() => { if (!selectedItem) return; onCopy(selectedItem.path); const id=Date.now(); setToasts((t)=> [...t, { id, text: `Copied ${selectedItem.name}` }]); setTimeout(()=> setToasts(tt=> tt.filter(x=> x.id!==id)), 2200); }}
          >
            <i className="mdi mdi-content-copy"></i> Copy
          </button>
          <button
            className="btn btn-sm"
            style={{ ...btnOutline(colors.primary), opacity: clipboard ? 1 : 0.5 }}
            disabled={!clipboard}
            onClick={onPaste}
          >
            <i className="mdi mdi-content-paste"></i> Paste
          </button>
          <button
            className="btn btn-sm"
            style={{ ...btnOutline(colors.primary), opacity: selectedItem ? 1 : 0.5 }}
            disabled={!selectedItem}
            onClick={() => { if (!selectedItem) return; onCut(selectedItem.path); }}
          >
            <i className="mdi mdi-content-cut"></i> Cut
          </button>
          <button
            className="btn btn-sm"
            style={{ ...btnOutline(colors.danger), opacity: selectedItem ? 1 : 0.5 }}
            disabled={!selectedItem}
            onClick={() => { if (!selectedItem) return; confirmDelete(selectedItem.path, selectedItem.name); }}
          >
            <i className="mdi mdi-trash-can-outline"></i> Delete
          </button>
          {selectedItem && selectedItem.type === 'file' && (
            <a className="btn btn-sm" style={btnOutline(colors.green)} href={DocsApi.downloadUrl(selectedItem.path)} target="_blank" rel="noreferrer"><i className="mdi mdi-download"></i> Download</a>
          )}
        </div>
      </div>

      <div className="row card-body pt-0" style={{ flex: 1, display:'flex' }} onClick={()=> setSelected(null)}>
        <div className="col-12" style={{ display:'flex', flexDirection:'column', height: '100%' }}>
          {/* Breadcrumb */}
          <div className="mb-2 d-flex flex-wrap align-items-center gap-1">
            <small className="text-muted">Path:</small>
            <a href="#" onClick={(e)=> (e.preventDefault(), load('/'))}>Root</a>
            {parts.map((seg, idx) => {
              const p = '/' + parts.slice(0, idx+1).join('/');
              return (
                <span key={idx}>
                  <span className="text-muted"> / </span>
                  <a href="#" onClick={(e)=> (e.preventDefault(), load(p))}>{seg}</a>
                </span>
              );
            })}
          </div>
          {error && (
            <div className="alert alert-danger alert-dismissible fade show mb-2" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={()=> setError('')} aria-label="Close"></button>
            </div>
          )}

          {/* Desktop-like grid */}
          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(112px, 1fr))', gap:8 }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={`sk-${i}`} style={tileStyles.tile(false)}>
                  <div className="skeleton" style={{ width: 40, height: 32, borderRadius: 6 }} />
                  <div className="skeleton skeleton-line" style={{ width: 80, height: 10, marginTop: 8 }} />
                </div>
              ))}
            </div>
          ) : (
            <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(112px, 1fr))', gap:8, minHeight: 180, flex: 1 }} onClick={()=> setContextMenu(null)}>
              {items.map(it => (
                <div key={it.path} style={tileStyles.tile(selected === it.path)}
                  onClick={(e)=> { e.stopPropagation(); setSelected(it.path); setContextMenu(null); }}
                  onContextMenu={(e)=> { e.preventDefault(); setSelected(it.path); setContextMenu({ x: e.clientX, y: e.clientY, item: it }); }}
                  onDoubleClick={()=> { if (it.type === 'folder') goInto(it.name); else window.open(DocsApi.downloadUrl(it.path), '_blank'); }}
                >
                  <div style={{ fontSize: 44 }}>
                    {it.type === 'folder' ? (
                      <i className="mdi mdi-folder" style={{ color:'#f59e0b' }}></i>
                    ) : (
                      <i className="mdi mdi-file" style={{ color:'#64748b' }}></i>
                    )}
                  </div>
                  <div style={tileStyles.name} title={it.name}>{it.name}</div>
                </div>
              ))}
              {items.length === 0 && (
                <div style={{ gridColumn: '1 / -1', display:'flex', alignItems:'center', justifyContent:'center', padding: 24 }}>
                  <div style={{ textAlign:'center', color:'#64748b' }}>
                    <div style={{ fontSize: 64, lineHeight: 1 }}>
                      <i className="mdi mdi-folder-open-outline"></i>
                    </div>
                    <div style={{ marginTop: 6 }}>This folder is empty</div>
                  </div>
                </div>
              )}
            </div>
            {/* Context Menu */}
            {contextMenu && (
              <div style={{ position:'fixed', top: contextMenu.y, left: contextMenu.x, background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex: 1100, overflow:'hidden' }} onClick={(e)=> e.stopPropagation()}>
                <button className="dropdown-item" style={{ padding:'8px 14px', width:180, textAlign:'left', border:'none', background:'transparent' }} onClick={()=> { onRename(contextMenu.item.path); setContextMenu(null); }}>Rename</button>
                <button className="dropdown-item" style={{ padding:'8px 14px', width:180, textAlign:'left', border:'none', background:'transparent' }} onClick={()=> { onCopy(contextMenu.item.path); const id=Date.now(); setToasts((t)=> [...t, { id, text: `Copied ${contextMenu.item.name}` }]); setTimeout(()=> setToasts(tt=> tt.filter(x=> x.id!==id)), 2200); setContextMenu(null); }}>Copy</button>
                <button className="dropdown-item" style={{ padding:'8px 14px', width:180, textAlign:'left', border:'none', background:'transparent' }} disabled={!clipboard || contextMenu.item.type !== 'folder'} onClick={()=> { pasteInto(contextMenu.item.path); setContextMenu(null); }}>Paste</button>
                <button className="dropdown-item" style={{ padding:'8px 14px', width:180, textAlign:'left', border:'none', background:'transparent' }} onClick={()=> { onCut(contextMenu.item.path); setContextMenu(null); }}>Cut</button>
                <button className="dropdown-item" style={{ padding:'8px 14px', width:180, textAlign:'left', borderTop:'1px solid #f3f4f6', color:'#ef4444', background:'transparent' }} onClick={()=> { confirmDelete(contextMenu.item.path, contextMenu.item.name); setContextMenu(null); }}>Delete</button>
              </div>
            )}

            {/* Custom Confirm Modal */}
            {confirm && (
              <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=> setConfirm(null)}>
                <div className="card" style={{ width:'min(420px, 92vw)', borderRadius:12 }} onClick={(e)=> e.stopPropagation()}>
                  <div className="card-body">
                    <h6 className="fw-semibold mb-2">Delete item</h6>
                    <p className="mb-3">Are you sure you want to delete <strong>{confirm.name}</strong>? This action cannot be undone.</p>
                    <div className="d-flex justify-content-end gap-2">
                      <button className="btn btn-sm btn-secondary" onClick={()=> setConfirm(null)}>Cancel</button>
                      <button className="btn btn-sm btn-danger" onClick={doDelete}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rename Modal */}
            {rename && (
              <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=> setRename(null)}>
                <div className="card" style={{ width:'min(480px, 92vw)', borderRadius:12 }} onClick={(e)=> e.stopPropagation()}>
                  <div className="card-body">
                    <h6 className="fw-semibold mb-2">Rename item</h6>
                    <div className="mb-3">
                      <label className="form-label small text-muted">New name</label>
                      <input className="form-control" autoFocus value={rename.value} onChange={(e)=> setRename({ ...rename, value: e.target.value })} onKeyDown={(e)=> { if (e.key==='Enter') doRename(); if (e.key==='Escape') setRename(null); }} />
                    </div>
                    <div className="d-flex justify-content-end gap-2">
                      <button className="btn btn-sm btn-secondary" onClick={()=> setRename(null)}>Cancel</button>
                      <button className="btn btn-sm btn-primary" onClick={doRename} disabled={!rename.value || rename.value.trim()===rename.name}>Save</button>
                    </div>
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

export default DocumentsPage;


