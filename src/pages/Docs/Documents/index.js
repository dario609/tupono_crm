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
  const [clipboard, setClipboard] = useState(null);
  const [newName, setNewName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(null); // path
  const [toasts, setToasts] = useState([]);
  const [contextMenu, setContextMenu] = useState(null); // {x,y,item}

  const load = async (path = cwd) => {
    setLoading(true);
    try {
      const res = await DocsApi.list(path);
      setItems(res || []);
      setCwd(path);
      setSelected(null);
    } finally { setLoading(false); }
  };

  useEffect(() => { load('/'); }, []);

  const parts = useMemo(() => cwd.split('/').filter(Boolean), [cwd]);
  const goUp = () => { if (cwd === '/') return; const p = '/' + parts.slice(0, -1).join('/'); load(p || '/'); };
  const goInto = (name) => load((cwd === '/' ? '' : cwd) + '/' + name);

  const onMkdir = async () => {
    if (!newName.trim()) return;
    const res = await DocsApi.mkdir(cwd, newName.trim());
    setNewName('');
    await load();
  };
  const onUpload = async (e) => { const f = e.target.files?.[0]; if (!f) return; setUploading(true); try { await DocsApi.upload(cwd, f); await load(); } finally { setUploading(false); e.target.value=''; } };
  const onDelete = async (p) => { await DocsApi.remove(p); await load(); };
  const onRename = async (p) => { const nm = prompt('New name', p.split('/').pop()); if (!nm) return; await DocsApi.rename(p, nm); await load(); };
  const onCut = (p) => setClipboard({ type:'cut', path:p });
  const onCopy = (p) => setClipboard({ type:'copy', path:p });
  const pasteInto = async (targetFolderPath) => {
    if (!clipboard) return; const name = clipboard.path.split('/').pop(); const toPath = (targetFolderPath === '/' ? '' : targetFolderPath) + '/' + name;
    if (clipboard.type === 'cut') {
      await DocsApi.move(clipboard.path, toPath);
      setClipboard(null);
      setToasts((t) => {
        const id = Date.now(); setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 2200);
        return [...t, { id, text: `Moved to ${targetFolderPath}` }];
      });
    } else {
      await DocsApi.copy(clipboard.path, toPath);
      setClipboard(null);
      setToasts((t) => {
        const id = Date.now(); setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 2200);
        return [...t, { id, text: `Copied here` }];
      });
    }
    await load(targetFolderPath);
  };

  const onPaste = async () => pasteInto(cwd);

  const selectedItem = items.find(i => i.path === selected);

  // Button style helpers
  const colors = { primary:'#06b6d4', indigo:'#6366f1', green:'#22c55e', danger:'#ef4444', slate:'#475569' };
  const btnFilled = (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:999, padding:'8px 16px', fontWeight:700, boxShadow:'0 1px 2px rgba(0,0,0,0.06)' });
  const btnOutline = (color) => ({ background:'#fff', color, border:`1px solid ${color}`, borderRadius:999, padding:'8px 14px', fontWeight:700 });

  return (
    <div className="card mt-3">
      {/* Toasts */}
      <div style={{ position:'fixed', top: 16, right: 16, zIndex: 1060, display:'flex', flexDirection:'column', gap:8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background:'#111827', color:'#fff', padding:'8px 12px', borderRadius:8, boxShadow:'0 4px 12px rgba(0,0,0,0.2)' }}>
            {t.text}
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
          {selectedItem && (
            <>
              {/* Order: rename, copy, paste, cut, delete */}
              <button className="btn btn-sm" style={btnOutline(colors.primary)} onClick={()=> onRename(selectedItem.path)}><i className="mdi mdi-rename-box"></i> Rename</button>
              <button className="btn btn-sm" style={btnOutline(colors.primary)} onClick={()=> { onCopy(selectedItem.path); const id=Date.now(); setToasts((t)=> [...t, { id, text: `Copied ${selectedItem.name}` }]); setTimeout(()=> setToasts(tt=> tt.filter(x=> x.id!==id)), 2200); }}><i className="mdi mdi-content-copy"></i> Copy</button>
              <button className="btn btn-sm" style={btnOutline(colors.primary)} onClick={onPaste} disabled={!clipboard}><i className="mdi mdi-content-paste"></i> Paste</button>
              <button className="btn btn-sm" style={btnOutline(colors.primary)} onClick={()=> onCut(selectedItem.path)}><i className="mdi mdi-content-cut"></i> Cut</button>
              <button className="btn btn-sm" style={btnOutline(colors.danger)} onClick={()=> onDelete(selectedItem.path)}><i className="mdi mdi-trash-can-outline"></i> Delete</button>
              {selectedItem.type === 'file' && <a className="btn btn-sm" style={btnOutline(colors.green)} href={DocsApi.downloadUrl(selectedItem.path)} target="_blank" rel="noreferrer"><i className="mdi mdi-download"></i> Download</a>}
            </>
          )}
        </div>
      </div>

      <div className="row card-body pt-0" onClick={()=> setSelected(null)}>
        <div className="col-12">
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
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(112px, 1fr))', gap:8, minHeight: 180 }} onClick={()=> setContextMenu(null)}>
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
                <button className="dropdown-item" style={{ padding:'8px 14px', width:180, textAlign:'left', borderTop:'1px solid #f3f4f6', color:'#ef4444', background:'transparent' }} onClick={()=> { onDelete(contextMenu.item.path); setContextMenu(null); }}>Delete</button>
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


