import React, { useEffect, useMemo, useState, useRef } from 'react';
import DocsApi from '../../../api/docsApi';
import UsersApi from '../../../api/usersApi';
import TeamsApi from '../../../api/teamsApi';
import { useNotifications } from '../../../context/NotificationProvider';
import AclSelectDropdown from '../../../components/docs/AclSelectDropdown';
import ViewWebLinkModal from '../../../components/docs/ViewWebLinkModal';
import CreateWebLinkModal from '../../../components/docs/CreateWebLinkModal';
import AclEditModal from '../../../components/docs/AclEditModal';
import FileUploadModal from '../../../components/docs/FileUploadModal';
import { tileStyles, colors, btnFilled, btnOutline } from '../../../components/docs/DocsStyles';

import '../../../styles/engagementAdd.css';

const DocumentsPage = () => {
  const { pushNotification } = useNotifications();
  const [cwd, setCwd] = useState('/');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(null); // path
  const [toasts, setToasts] = useState([]);
  const [contextMenu, setContextMenu] = useState(null); // {x,y,item}
  const [confirm, setConfirm] = useState(null); // {name, path}
  const [rename, setRename] = useState(null); // {path, name, value}
  const [deleting, setDeleting] = useState(false); // Track if delete is in progress
  const [folderUploadModal, setFolderUploadModal] = useState(null); // {folderName, fileCount, files}
  const [uploadProgress, setUploadProgress] = useState(0); // Upload progress percentage
  const [viewportW, setViewportW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [webLinkModal, setWebLinkModal] = useState(null); // {name, url} for creating
  const [viewWebLinkModal, setViewWebLinkModal] = useState(null); // {name, url} for viewing
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [aclModal, setAclModal] = useState(null); // {item, acl} for editing ACL
  const [uploadAcl, setUploadAcl] = useState({ users: [], teams: [] }); // Simplified: single access list
  const [hoveredItem, setHoveredItem] = useState(null); // For showing access list on hover
  const [fileUploadModal, setFileUploadModal] = useState(null); // {file} for file upload with ACL
  const [updatingAcl, setUpdatingAcl] = useState(false); // Loading state for ACL update
  const [creatingWebLink, setCreatingWebLink] = useState(false); // Loading state for web link creation
  const [uploadingFolder, setUploadingFolder] = useState(false); // Loading state for folder upload
  const [uploadingFile, setUploadingFile] = useState(false); // Loading state for file upload
  const [webLinkNameError, setWebLinkNameError] = useState(''); // Error message for duplicate web link name
  const [createActionsDropdown, setCreateActionsDropdown] = useState(false); // Dropdown menu visibility
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [searchText, setSearchText] = useState(''); // Search query for files/folders
  const filteredItems = useMemo(() => {
    const q = (searchText || '').trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => (i?.name || '').toLowerCase().includes(q));
  }, [items, searchText]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  const isArchiveFile = (name) => {
    if (!name || typeof name !== 'string') return false;
    const ext = name.split('.').pop()?.toLowerCase();
    return ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext || '');
  };
  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return '-';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
  };
  const formatDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '-';
    return dt.toLocaleString();
  };
  const formatDateOnly = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '-';
    return dt.toLocaleDateString();
  };
  const getAclDisplay = (it) => {
    if (!it?.acl) return 'Public';
    const parts = [];
    const rUsers = it.acl.readUsers || [];
    const rTeams = it.acl.readTeams || [];
    if (rUsers.length > 0) {
      const names = rUsers.map(uid => {
        const u = users.find(us => String(us._id) === String(uid._id || uid));
        return u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email : String(uid);
      }).filter(Boolean);
      if (names.length) parts.push(names.join(', '));
    }
    if (rTeams.length > 0) {
      const tnames = rTeams.map(tid => {
        const t = teams.find(te => String(te._id) === String(tid._id || tid));
        return t ? t.title : String(tid);
      }).filter(Boolean);
      if (tnames.length) parts.push(tnames.join(', '));
    }
    return parts.length ? parts.join(' • ') : 'Public';
  };
  // Pagination for table view
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredItems.slice(start, start + perPage);
  }, [filteredItems, page, perPage]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [filteredItems.length, perPage]);

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

  // Load users and teams for ACL
  useEffect(() => {
    (async () => {
      try {
        const [uJson, tJson] = await Promise.all([
          UsersApi.list({ perpage: -1 }),
          TeamsApi.list({ perpage: -1 }),
        ]);
        setUsers(uJson?.data || []);
        setTeams(tJson?.data || []);
      } catch { }
    })();
  }, []);

  // Track viewport width for responsive tweaks (prevents toolbar wrap glitches)
  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth || 1200);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu && !e.target.closest('[data-context-menu]')) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      // Use mousedown instead of click to close before other click handlers fire
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [contextMenu]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCreateActionsDropdown(false);
      }
    };

    if (createActionsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [createActionsDropdown]);

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
    e.target.value = ''; // Reset file input

    // Show modal with access control
    setFileUploadModal({ file: f });
  };

  const doUploadFile = async () => {
    if (!fileUploadModal || uploading || uploadingFile) return;

    const f = fileUploadModal.file;
    setUploading(true);
    setUploadingFile(true);
    const fileName = f.name;

    try {
      // Convert simplified ACL to backend format (both read and write)
      const aclToSend = (uploadAcl.users.length > 0 || uploadAcl.teams.length > 0) ? {
        readUsers: uploadAcl.users,
        writeUsers: uploadAcl.users,
        readTeams: uploadAcl.teams,
        writeTeams: uploadAcl.teams,
      } : null;

      const result = await DocsApi.upload(cwd, f, aclToSend);

      // Create detailed notification message
      const sizeMB = (f.size / (1024 * 1024)).toFixed(2);
      const aclInfo = (uploadAcl.users.length > 0 || uploadAcl.teams.length > 0)
        ? `Access restricted to ${uploadAcl.users.length} user(s) and ${uploadAcl.teams.length} team(s).`
        : "Public access (no restrictions).";

      if (result?.notificationId) {
        pushNotification({
          _id: result.notificationId,
          title: "File Uploaded",
          body: `File "${fileName}" (${sizeMB} MB) has been uploaded successfully. ${aclInfo}`,
          isRead: false,
          createdAt: new Date(),
        });
      }

      // Reset ACL selection and close modal
      setUploadAcl({ users: [], teams: [] });
      setFileUploadModal(null);

      // Success toast
      setToasts((t) => {
        const id = Date.now();
        setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 2200);
        return [...t, { id, text: `Uploaded ${fileName}` }];
      });

      await load();
    } catch (err) {
      const errorMsg = err?.message || err?.response?.data?.message || 'Upload failed';
      console.error('Upload error:', err);
      setToasts((t) => {
        const id = Date.now();
        setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 3000);
        return [...t, { id, text: `Upload failed: ${errorMsg}` }];
      });
    } finally {
      setUploading(false);
      setUploadingFile(false);
    }
  };

  const onUploadFolderSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) {
      e.target.value = '';
      return;
    }

    // Prevent concurrent uploads
    if (uploading) {
      e.target.value = '';
      return;
    }

    // Extract folder name from the first file's webkitRelativePath
    const folderName = files[0]?.webkitRelativePath?.split('/')[0] || 'folder';

    // Show confirmation modal
    setFolderUploadModal({
      folderName,
      fileCount: files.length,
      files: files
    });

    e.target.value = ''; // Reset file input
  };

  const doUploadFolder = async () => {
    if (!folderUploadModal || uploading || uploadingFolder) return;

    const { folderName, files } = folderUploadModal;
    setUploading(true);
    setUploadingFolder(true);
    setUploadProgress(0);

    // Simulate progress (since we can't track actual upload progress easily)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Convert simplified ACL to backend format
      const aclToUse = (uploadAcl.users.length > 0 || uploadAcl.teams.length > 0) ? {
        readUsers: uploadAcl.users,
        writeUsers: uploadAcl.users,
        readTeams: uploadAcl.teams,
        writeTeams: uploadAcl.teams,
      } : null;

      const result = await DocsApi.uploadFolder(cwd, files, folderName, aclToUse);
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Create detailed notification message
      const aclInfo = (uploadAcl.users.length > 0 || uploadAcl.teams.length > 0)
        ? `Access restricted to ${uploadAcl.users.length} user(s) and ${uploadAcl.teams.length} team(s).`
        : "Public access (no restrictions).";

      if (result?.notificationId) {
        pushNotification({
          _id: result.notificationId,
          title: "Folder Uploaded",
          body: `Folder "${folderName}" with ${files.length} file(s) has been uploaded successfully. ${aclInfo}`,
          isRead: false,
          createdAt: new Date(),
        });
      }

      // Reset ACL selection
      setUploadAcl({ users: [], teams: [] });

      // Success toast
      setToasts((t) => {
        const id = Date.now();
        setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 2200);
        return [...t, { id, text: `Uploaded folder "${folderName}" with ${files.length} file(s)` }];
      });

      // Close modal and reload
      setTimeout(async () => {
        setFolderUploadModal(null);
        setUploadProgress(0);
        await load();
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      const errorMsg = err?.message || err?.response?.data?.message || 'Upload failed';
      console.error('Folder upload error:', err);
      setToasts((t) => {
        const id = Date.now();
        setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 3000);
        return [...t, { id, text: `Folder upload failed: ${errorMsg}` }];
      });
      setFolderUploadModal(null);
      setUploadProgress(0);
    } finally {
      setUploading(false);
      setUploadingFolder(false);
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

  const onCreateWebLink = async () => {
    if (!webLinkModal?.name?.trim() || !webLinkModal?.url?.trim()) {
      setToasts((t) => {
        const id = Date.now();
        setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 3000);
        return [...t, { id, text: 'Name and URL are required' }];
      });
      return;
    }

    // Clear previous error
    setWebLinkNameError('');
    setCreatingWebLink(true);
    try {
      // Convert simplified ACL to backend format
      const aclToUse = (uploadAcl.users.length > 0 || uploadAcl.teams.length > 0) ? {
        readUsers: uploadAcl.users,
        writeUsers: uploadAcl.users,
        readTeams: uploadAcl.teams,
        writeTeams: uploadAcl.teams,
      } : null;

      const result = await DocsApi.createWebLink(cwd, webLinkModal.name.trim(), webLinkModal.url.trim(), aclToUse);

      // Create detailed notification message
      const aclInfo = (uploadAcl.users.length > 0 || uploadAcl.teams.length > 0)
        ? `Access restricted to ${uploadAcl.users.length} user(s) and ${uploadAcl.teams.length} team(s).`
        : "Public access (no restrictions).";

      if (result?.notificationId) {
        pushNotification({
          _id: result.notificationId,
          title: "Web Link Created",
          body: `Web link "${webLinkModal.name}" (${webLinkModal.url.trim()}) has been created. ${aclInfo}`,
          isRead: false,
          createdAt: new Date(),
        });
      }

      setWebLinkModal(null);
      setUploadAcl({ users: [], teams: [] });
      setWebLinkNameError('');
      setToasts((t) => {
        const id = Date.now();
        setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 2200);
        return [...t, { id, text: `Web link "${webLinkModal.name}" created` }];
      });
      await load();
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || 'Server error';

      // Check if error is about duplicate name
      if (errorMessage.toLowerCase().includes('duplicate') ||
        errorMessage.toLowerCase().includes('already exists') ||
        errorMessage.toLowerCase().includes('invalid')) {
        setWebLinkNameError(errorMessage);
      }
      else {
        setWebLinkNameError('Failed to create web link')
      }
    } finally {
      setCreatingWebLink(false);
    }
  };

  const confirmDelete = (p, name) => {
    // Prevent opening delete modal if a delete is already in progress
    if (deleting) return;
    setConfirm({ path: p, name });
  };

  const doDelete = async () => {
    if (!confirm || deleting) return; // Prevent concurrent deletes

    const p = confirm.path;
    const name = confirm.name;
    setConfirm(null);
    setDeleting(true); // Mark delete as in progress

    // Optimistically remove the item from UI using functional update
    const deletedPath = p;
    setItems((prev) => {
      // Use functional update to ensure consistency even with rapid deletions
      const filtered = prev.filter((item) => item.path !== deletedPath);
      return filtered;
    });

    // Clear selection if deleted item was selected
    if (selected === deletedPath) {
      setSelected(null);
    }

    try {
      await DocsApi.remove(p);
      setToasts((t) => {
        const id = Date.now();
        setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 2200);
        return [...t, { id, text: `Deleted ${name}` }];
      });
      // No need to reload - UI already updated optimistically
    } catch (err) {
      // On error, reload to restore correct state
      const errorMsg = err?.message || err?.response?.data?.message || 'Failed to delete item';
      console.error('Delete error:', err);
      await load();
      setToasts((t) => {
        const id = Date.now();
        setTimeout(() => setToasts((tt) => tt.filter(x => x.id !== id)), 3000);
        return [...t, { id, text: `Delete failed: ${errorMsg}` }];
      });
    } finally {
      setDeleting(false); // Always clear the deleting flag
    }
  };
  const handleSaveAcl = async () => {
    if (!aclModal || updatingAcl) return;

    setUpdatingAcl(true);

    try {
      const { item, acl } = aclModal;

      // Normalize path: ensure consistent format
      let normalizedPath = (item.path || '').replace(/\\/g, '/').replace(/\/+/g, '/');
      if (!normalizedPath.startsWith('/')) {
        normalizedPath = '/' + normalizedPath;
      }

      // Convert simplified ACL to backend format
      const aclToSend = {
        readUsers: acl.users,
        writeUsers: acl.users,
        readTeams: acl.teams,
        writeTeams: acl.teams,
      };

      const result = await DocsApi.setAcl(normalizedPath, aclToSend);

      // Push notification (if server returned one)
      if (result?.notificationId) {
        pushNotification({
          _id: result.notificationId,
          title: "Access Control Updated",
          body: `Access for "${item.name}" has been updated.`,
          isRead: false,
          createdAt: new Date(),
        });
      }

      // Toast success
      setToasts((t) => {
        const id = Date.now();
        setTimeout(() => {
          setToasts((tt) => tt.filter((x) => x.id !== id));
        }, 2200);
        return [...t, { id, text: "Access control updated" }];
      });

      // Close modal
      setAclModal(null);

      // Reload folder content
      await load();
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err.message || "Failed to update ACL";

      setToasts((t) => {
        const id = Date.now();
        setTimeout(() => {
          setToasts((tt) => tt.filter((x) => x.id !== id));
        }, 3000);
        return [...t, { id, text: `Error: ${errorMsg}` }];
      });
    } finally {
      setUpdatingAcl(false);
    }
  };

  const selectedItem = items.find(i => i.path === selected);


  return (
    <div className="card mt-3" style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', borderRadius: 16, border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
      {/* Modern Toasts */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1060, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            padding: '14px 18px',
            borderRadius: 14,
            boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3), 0 4px 10px rgba(0,0,0,0.15)',
            transform: 'translateY(0)',
            opacity: 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: 280,
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }}></div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{t.text}</div>
          </div>
        ))}
      </div>
      <h5 className="fw-bold mb-0" style={{ color: '#1e293b', fontSize: 20, padding: '16px 24px' }}>Ngā Mahi</h5>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 p-4" style={{ borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(to right, #f8fafc, #ffffff)' }}>

        <div className="d-flex align-items-center gap-2 flex-wrap" style={{ rowGap: 10 }}>
          <button
            className="btn btn-sm"
            style={{
              ...btnOutline(colors.primary, `${colors.primary}15`),
              opacity: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            onClick={goUp}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${colors.primary}15`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <i className="mdi mdi-arrow-up-bold"></i>
          </button>

          {/* Create Actions Dropdown */}
          <div 
            ref={dropdownRef}
            style={{ position: 'relative', display: 'inline-block' }}
          >
            <button
              className="btn btn-sm"
              style={{
                ...btnFilled(colors.indigo, colors.primaryLight),
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              onClick={() => setCreateActionsDropdown(!createActionsDropdown)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)'; }}
            >
              <i className="mdi mdi-plus"></i> Create
              <i className={`mdi ${createActionsDropdown ? 'mdi-chevron-up' : 'mdi-chevron-down'}`} style={{ fontSize: 16, marginLeft: 2 }}></i>
            </button>

            {/* Dropdown Menu */}
            {createActionsDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 4,
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.07)',
                  zIndex: 1000,
                  minWidth: 220,
                  padding: '8px'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Create Folder Option */}
                <div style={{ padding: '8px 0' }}>
                  <div style={{ display: 'flex', gap: 8, padding: '8px 12px' }}>
                    <input
                      className="form-control form-control-sm"
                      style={{
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                        padding: '6px 10px',
                        fontSize: 13
                      }}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Folder name"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          onMkdir();
                          setCreateActionsDropdown(false);
                        }
                      }}
                    />
                    <button
                      className="btn btn-sm"
                      style={{
                        ...btnFilled(colors.indigo, colors.primaryLight),
                        opacity: !newName ? 0.5 : 1,
                        cursor: !newName ? 'not-allowed' : 'pointer',
                        padding: '6px 12px',
                        fontSize: 12
                      }}
                      onClick={() => {
                        onMkdir();
                        setCreateActionsDropdown(false);
                      }}
                      disabled={!newName}
                      onMouseEnter={(e) => { if (newName) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.3)'; } }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)'; }}
                    >
                      <i className="mdi mdi-check"></i>
                    </button>
                  </div>
                </div>

                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>

                {/* Upload File Option */}
                <label
                  style={{
                    padding: '10px 12px',
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all 0.15s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <i className="mdi mdi-file-upload-outline" style={{ color: '#10b981', fontSize: 18 }}></i>
                  Upload File
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    hidden 
                    onChange={(e) => {
                      onUpload(e);
                      setCreateActionsDropdown(false);
                    }} 
                    disabled={uploading} 
                  />
                </label>

                {/* Upload Folder Option */}
                <label
                  style={{
                    padding: '10px 12px',
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all 0.15s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <i className="mdi mdi-folder-upload-outline" style={{ color: '#f59e0b', fontSize: 18 }}></i>
                  Upload Folder
                  <input 
                    ref={folderInputRef}
                    type="file" 
                    hidden 
                    webkitdirectory="" 
                    directory="" 
                    multiple 
                    onChange={(e) => {
                      onUploadFolderSelect(e);
                      setCreateActionsDropdown(false);
                    }} 
                    disabled={uploading} 
                  />
                </label>

                {/* Create Web Link Option */}
                <button
                  style={{
                    padding: '10px 12px',
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all 0.15s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setWebLinkModal({ name: '', url: '' });
                    setCreateActionsDropdown(false);
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <i className="mdi mdi-link-variant" style={{ color: '#6366f1', fontSize: 18 }}></i>
                  Create Web Link
                </button>
              </div>
            )}
          </div>

          {/* Search bar */}
          <div style={{ marginLeft: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
              className="form-control form-control-sm"
              placeholder="Search files & folders"
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
              onKeyDown={(e) => { if (e.key === 'Escape') { setSearchText(''); setPage(1); } }}
              style={{ width: 'min(320px, 40vw)', borderRadius: 8, border: '1px solid #e2e8f0', padding: '8px 12px', fontSize: 14 }}
            />
            {searchText && (
              <button className="btn btn-sm" style={{ ...btnOutline(colors.primary, `${colors.primary}15`), padding: '6px 10px' }} onClick={() => setSearchText('')}>Clear</button>
            )}

            {/* View toggle */}
            <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
              <button
                className="btn btn-sm"
                title="Grid view"
                onClick={() => setViewMode('grid')}
                style={{ ...(viewMode === 'grid' ? btnFilled(colors.primary, colors.primaryLight) : btnOutline(colors.primary, `${colors.primary}15`)), padding: '6px 8px' }}
              >
                <i className="mdi mdi-view-grid" />
              </button>
              <button
                className="btn btn-sm"
                title="Table view"
                onClick={() => setViewMode('table')}
                style={{ ...(viewMode === 'table' ? btnFilled(colors.primary, colors.primaryLight) : btnOutline(colors.primary, `${colors.primary}15`)), padding: '6px 8px' }}
              >
                <i className="mdi mdi-table" />
              </button>
            </div>

          </div>

          {/* Action buttons with modern styling */}
          <div className="d-flex align-items-center gap-2 flex-wrap"
            style={{
              paddingLeft: viewportW < 768 ? 0 : 12,
              paddingTop: viewportW < 768 ? 8 : 0,
              borderLeft: viewportW < 768 ? 'none' : '2px solid #e2e8f0',
              borderTop: viewportW < 768 ? '2px solid #e2e8f0' : 'none',
              width: viewportW < 768 ? '100%' : 'auto',
              rowGap: 8
            }}>
            <button
              className="btn btn-sm"
              style={{
                ...btnOutline(colors.primary, `${colors.primary}15`),
                opacity: selectedItem ? 1 : 0.4,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              disabled={!selectedItem}
              onClick={() => { if (!selectedItem) return; onRename(selectedItem.path); }}
              onMouseEnter={(e) => { if (selectedItem) { e.currentTarget.style.background = `${colors.primary}15`; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <i className="mdi mdi-rename-box"></i> Rename
            </button>
            <button
              className="btn btn-sm"
              style={{
                ...btnOutline(colors.danger, `${colors.danger}15`),
                opacity: (selectedItem && !deleting) ? 1 : 0.4,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              disabled={!selectedItem || deleting}
              onClick={() => { if (!selectedItem || deleting) return; confirmDelete(selectedItem.path, selectedItem.name); }}
              onMouseEnter={(e) => { if (selectedItem && !deleting) { e.currentTarget.style.background = `${colors.danger}15`; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <i className="mdi mdi-trash-can-outline"></i> {deleting ? 'Deleting...' : 'Delete'}
            </button>
            {selectedItem && selectedItem.type === 'file' && (
              <a
                className="btn btn-sm"
                style={{
                  ...btnOutline(colors.green, `${colors.green}15`),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  textDecoration: 'none'
                }}
                href={DocsApi.downloadUrl(selectedItem.path)}
                target="_blank"
                rel="noreferrer"
                onMouseEnter={(e) => { e.currentTarget.style.background = `${colors.green}15`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <i className="mdi mdi-download"></i> Download
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="row card-body pt-0" style={{ flex: 1, display: 'flex' }} onClick={() => setSelected(null)}>
        <div className="col-12" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Modern Breadcrumb */}
          <div className="mb-3 d-flex flex-wrap align-items-center gap-2" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <i className="mdi mdi-folder-outline" style={{ color: '#6366f1', fontSize: 18 }}></i>
            <a
              href="#"
              onClick={(e) => (e.preventDefault(), load('/'))}
              style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
            >
              Kāinga
            </a>
            {parts.map((seg, idx) => {
              const p = '/' + parts.slice(0, idx + 1).join('/');
              return (
                <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="mdi mdi-chevron-right" style={{ color: '#94a3b8', fontSize: 16 }}></i>
                  <a
                    href="#"
                    onClick={(e) => (e.preventDefault(), load(p))}
                    style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                  >
                    {seg}
                  </a>
                </span>
              );
            })}
          </div>
          {error && (
            <div className="alert alert-danger alert-dismissible fade show mb-2" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
            </div>
          )}

          {/* Desktop-like grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))', gap: 8 }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={`sk-${i}`} style={tileStyles.tile(false)}>
                  <div className="skeleton" style={{ width: 40, height: 32, borderRadius: 6 }} />
                  <div className="skeleton skeleton-line" style={{ width: 80, height: 10, marginTop: 8 }} />
                </div>
              ))}
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12, minHeight: 180, flex: 1, padding: '16px' }} onClick={() => setContextMenu(null)}>
                  {filteredItems.map((it, index) => (
                    <div
                      key={`${it.type}-${it.path}-${index}`}
                      style={{
                        ...tileStyles.tile(selected === it.path),
                        position: 'relative'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(it.path);
                        setContextMenu(null);
                      }}
                      onContextMenu={(e) => { e.preventDefault(); setSelected(it.path); setContextMenu({ x: e.clientX, y: e.clientY, item: it }); }}
                      onDoubleClick={() => {
                        if (it.type === 'folder') {
                          goInto(it.name);
                        } else if (it.type !== 'weblink') {
                          window.open(DocsApi.downloadUrl(it.path), '_blank');
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (selected !== it.path) {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selected !== it.path) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = selected === it.path
                            ? '0 4px 12px rgba(99, 102, 241, 0.15), 0 2px 4px rgba(0,0,0,0.1)'
                            : '0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
                          e.currentTarget.style.borderColor = selected === it.path ? '#6366f1' : 'transparent';
                        }
                      }}
                    >
                      <div style={{ fontSize: 48, transition: 'transform 0.2s ease' }}>
                        {it.type === 'folder' ? (
                          <i className="mdi mdi-folder" style={{ color: '#f59e0b', filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.2))' }}></i>
                        ) : it.type === 'weblink' ? (
                          <i className="mdi mdi-link-variant" style={{ color: '#6366f1', filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.2))' }}></i>
                        ) : isArchiveFile(it.name) ? (
                          <i className="mdi mdi-zip-box" style={{ color: '#64748b' }}></i>
                        ) : (
                          <i className="mdi mdi-file" style={{ color: '#64748b' }}></i>
                        )}
                      </div>
                      <div style={tileStyles.name} title={it.name}>{it.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>{formatDateOnly(it.createdAt)}</div>
                    </div>
                  ))}
                  {filteredItems.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
                      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 16, opacity: 0.5 }}>
                          <i className="mdi mdi-folder-open-outline"></i>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 500, color: '#64748b' }}>No items match your search</div>
                        <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>Try a different search term or clear the filter</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '12px 16px', flex: 1, overflow: 'auto' }}>
                  <table className="table table-sm table-hover" style={{ minWidth: 900 }}>
                    <thead>
                      <tr>
                        <th style={{ width: '30%' }}>Name</th>
                        <th style={{ width: '10%' }}>Type</th>
                        <th style={{ width: '10%' }}>Size</th>
                        <th style={{ width: '20%' }}>Access</th>
                        <th style={{ width: '15%' }}>Owner</th>
                        <th style={{ width: '15%' }}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedItems.map((it, idx) => (
                        <tr key={`${it.path}-${idx}`} onClick={(e) => { e.stopPropagation(); setSelected(it.path); setContextMenu(null); }} onDoubleClick={() => { if (it.type === 'folder') goInto(it.name); else if (it.type !== 'weblink') window.open(DocsApi.downloadUrl(it.path), '_blank'); }} style={{ cursor: 'pointer' }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ fontSize: 20 }}>
                                {it.type === 'folder' ? <i className="mdi mdi-folder" style={{ color: '#f59e0b' }}></i> : it.type === 'weblink' ? <i className="mdi mdi-link-variant" style={{ color: '#6366f1' }}></i> : isArchiveFile(it.name) ? <i className="mdi mdi-zip-box" style={{ color: '#64748b' }}></i> : <i className="mdi mdi-file" style={{ color: '#64748b' }}></i>}
                              </div>
                              <div style={{ fontWeight: 600 }}>{it.name}</div>
                            </div>
                          </td>
                          <td>{it.type || '-'}</td>
                          <td>{it.size ? formatBytes(it.size) : (it.type === 'folder' ? '-' : '-')}</td>
                          <td style={{ maxWidth: 240, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getAclDisplay(it)}</td>
                          <td>{(() => { const o = it.owner || it.ownerId || null; if (!o) return '-'; const u = users.find(us => String(us._id) === String(o)); return u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email : String(o); })()}</td>
                          <td>{formatDateOnly(it.createdAt)}</td>
                        </tr>
                      ))}
                      {filteredItems.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>No items match your search</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {/* Pagination Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px' }}>
                    
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select className="form-select form-select-sm" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} style={{ width: 80 }}>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                      <div style={{ minWidth: 64, textAlign: 'center' }}>{page} / {totalPages}</div>
                      <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
                    </div>
                  </div>
                </div>
              )}
              {/* Modern Context Menu */}
              {contextMenu && (
                <div 
                  data-context-menu
                  style={{
                    position: 'fixed',
                    top: contextMenu.y,
                    left: contextMenu.x,
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.1)',
                    zIndex: 1100,
                    overflow: 'hidden',
                    minWidth: 200,
                    padding: '4px'
                  }} 
                  onClick={(e) => e.stopPropagation()}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {contextMenu.item.type === 'weblink' && (
                    <button
                      className="dropdown-item"
                      style={{
                        padding: '10px 16px',
                        width: '100%',
                        textAlign: 'left',
                        border: 'none',
                        background: 'transparent',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        transition: 'all 0.15s ease'
                      }}
                      onClick={() => { setViewWebLinkModal({ name: contextMenu.item.name, url: contextMenu.item.webLink }); setContextMenu(null); }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <i className="mdi mdi-open-in-new" style={{ color: '#6366f1' }}></i> Open Link
                    </button>
                  )}
                  <button
                    className="dropdown-item"
                    style={{
                      padding: '10px 16px',
                      width: '100%',
                      textAlign: 'left',
                      border: 'none',
                      background: 'transparent',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => { onRename(contextMenu.item.path); setContextMenu(null); }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <i className="mdi mdi-rename-box" style={{ color: '#6366f1' }}></i> Rename
                  </button>
                  <button
                    className="dropdown-item"
                    style={{
                      padding: '10px 16px',
                      width: '100%',
                      textAlign: 'left',
                      border: 'none',
                      background: 'transparent',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => {
                      const itemAcl = contextMenu.item.acl || {};
                      // Combine read and write users/teams into single lists
                      const allUsers = [...new Set([
                        ...(itemAcl.readUsers || []).map(u => String(u._id || u)),
                        ...(itemAcl.writeUsers || []).map(u => String(u._id || u))
                      ])];
                      const allTeams = [...new Set([
                        ...(itemAcl.readTeams || []).map(t => String(t._id || t)),
                        ...(itemAcl.writeTeams || []).map(t => String(t._id || t))
                      ])];
                      setAclModal({
                        item: contextMenu.item,
                        acl: {
                          users: allUsers,
                          teams: allTeams
                        }
                      });
                      setContextMenu(null);
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <i className="mdi mdi-shield-account" style={{ color: '#6366f1' }}></i> Edit Access Control
                  </button>
                  <button
                    className="dropdown-item"
                    style={{
                      padding: '10px 16px',
                      width: '100%',
                      textAlign: 'left',
                      border: 'none',
                      color: '#ef4444',
                      background: 'transparent',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'all 0.15s ease',
                      opacity: deleting ? 0.5 : 1
                    }}
                    disabled={deleting}
                    onClick={() => { if (deleting) return; confirmDelete(contextMenu.item.path, contextMenu.item.name); setContextMenu(null); }}
                    onMouseEnter={(e) => { if (!deleting) { e.currentTarget.style.background = '#fef2f2'; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <i className="mdi mdi-trash-can-outline"></i> Delete
                  </button>
                </div>
              )}

              {/* Custom Confirm Modal */}
              {confirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => !deleting && setConfirm(null)}>
                  <div className="card" style={{ width: 'min(420px, 92vw)', borderRadius: 16, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', border: 'none' }} onClick={(e) => e.stopPropagation()}>
                    <div className="card-body" style={{ padding: '24px' }}>
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className="mdi mdi-alert-circle" style={{ fontSize: 24, color: '#ef4444' }}></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <h6 className="fw-semibold mb-1" style={{ fontSize: 18, color: '#111827' }}>Delete {confirm.name.includes('.') ? 'file' : 'folder'}?</h6>
                          <p className="mb-0" style={{ fontSize: 14, color: '#6b7280' }}>This action cannot be undone.</p>
                        </div>
                      </div>
                      <div style={{ background: '#f9fafb', borderRadius: 8, padding: '12px', marginBottom: '20px' }}>
                        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Item to delete:</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', wordBreak: 'break-word' }}>
                          <i className={`mdi ${confirm.name.includes('.') ? (isArchiveFile(confirm.name) ? 'mdi-zip-box' : 'mdi-file') : 'mdi-folder'}`} style={{ marginRight: 6, color: confirm.name.includes('.') ? '#64748b' : '#f59e0b' }}></i>
                          {confirm.name}
                        </div>
                      </div>
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-sm" style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600 }} onClick={() => setConfirm(null)} disabled={deleting}>Cancel</button>
                        <button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, opacity: deleting ? 0.7 : 1 }} onClick={doDelete} disabled={deleting}>
                          {deleting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <i className="mdi mdi-trash-can-outline me-1"></i>
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Folder Upload Modal */}
              {folderUploadModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => !uploading && setFolderUploadModal(null)}>
                  <div className="card" style={{ width: 'min(500px, 92vw)', borderRadius: 16, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', border: 'none' }} onClick={(e) => e.stopPropagation()}>
                    <div className="card-body" style={{ padding: '24px' }}>
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                          <i className="mdi mdi-folder-upload" style={{ fontSize: 28, color: '#fff' }}></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <h5 className="fw-bold mb-1" style={{ fontSize: 20, color: '#111827' }}>Upload Folder</h5>
                          <p className="mb-0" style={{ fontSize: 14, color: '#6b7280' }}>
                            {uploading ? 'Uploading files...' : `Ready to upload "${folderUploadModal.folderName}"`}
                          </p>
                        </div>
                      </div>

                      {/* Folder Info */}
                      <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <i className="mdi mdi-folder" style={{ fontSize: 24, color: '#f59e0b' }}></i>
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{folderUploadModal.folderName}</div>
                              <div style={{ fontSize: 13, color: '#64748b' }}>{folderUploadModal.fileCount} file{folderUploadModal.fileCount !== 1 ? 's' : ''} selected</div>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {uploading && (
                          <div style={{ marginTop: 16 }}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>Uploading...</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#6366f1' }}>{uploadProgress}%</span>
                            </div>
                            <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${uploadProgress}%`,
                                  height: '100%',
                                  background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                                  borderRadius: 999,
                                  transition: 'width 0.3s ease',
                                  boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)'
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Warning Message */}
                      {!uploading && (
                        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px', marginBottom: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'start', gap: 10 }}>
                            <i className="mdi mdi-alert-circle" style={{ fontSize: 20, color: '#d97706', flexShrink: 0, marginTop: 2 }}></i>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 2 }}>Upload Warning</div>
                              <div style={{ fontSize: 12, color: '#78350f' }}>
                                This will upload all {folderUploadModal.fileCount} file{folderUploadModal.fileCount !== 1 ? 's' : ''} from "{folderUploadModal.folderName}".
                                Only proceed if you trust this source.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Access Control */}
                      <div className="mb-4">
                        <label className="form-label" style={{ fontWeight: 600, color: '#374151', marginBottom: 8 }}>Access Control</label>
                        <AclSelectDropdown
                          users={users}
                          teams={teams}
                          selectedUsers={uploadAcl.users}
                          selectedTeams={uploadAcl.teams}
                          onAdd={(type, id) => {
                            if (type === 'user') {
                              setUploadAcl({ ...uploadAcl, users: [...uploadAcl.users, id] });
                            } else {
                              setUploadAcl({ ...uploadAcl, teams: [...uploadAcl.teams, id] });
                            }
                          }}
                          onRemove={(type, id) => {
                            if (type === 'user') {
                              setUploadAcl({ ...uploadAcl, users: uploadAcl.users.filter(uid => String(uid) !== String(id)) });
                            } else {
                              setUploadAcl({ ...uploadAcl, teams: uploadAcl.teams.filter(tid => String(tid) !== String(id)) });
                            }
                          }}
                        />
                        <small className="text-muted d-block mt-2">Leave empty for public access.</small>
                      </div>

                      {/* Action Buttons */}
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-sm"
                          style={{
                            background: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: 10,
                            padding: '10px 20px',
                            fontWeight: 600,
                            fontSize: 14
                          }}
                          onClick={() => { setFolderUploadModal(null); setUploadProgress(0); setUploadAcl({ users: [], teams: [] }); }}
                          disabled={uploading}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{
                            background: (uploading || uploadingFolder) ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            padding: '10px 20px',
                            fontWeight: 600,
                            fontSize: 14,
                            boxShadow: (uploading || uploadingFolder) ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                            transition: 'all 0.2s ease',
                            cursor: (uploading || uploadingFolder) ? 'not-allowed' : 'pointer'
                          }}
                          onClick={doUploadFolder}
                          disabled={uploading || uploadingFolder}
                          onMouseEnter={(e) => { if (!uploading && !uploadingFolder) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'; } }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'; }}
                        >
                          {(uploading || uploadingFolder) ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <i className="mdi mdi-upload me-1"></i>
                              Upload {folderUploadModal.fileCount} File{folderUploadModal.fileCount !== 1 ? 's' : ''}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rename Modal */}
              {rename && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setRename(null)}>
                  <div className="card" style={{ width: 'min(480px, 92vw)', borderRadius: 12 }} onClick={(e) => e.stopPropagation()}>
                    <div className="card-body">
                      <h6 className="fw-semibold mb-2">Rename item</h6>
                      <div className="mb-3">
                        <label className="form-label small text-muted">New name</label>
                        <input className="form-control" autoFocus value={rename.value} onChange={(e) => setRename({ ...rename, value: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') doRename(); if (e.key === 'Escape') setRename(null); }} />
                      </div>
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-sm btn-secondary" onClick={() => setRename(null)}>Cancel</button>
                        <button className="btn btn-sm btn-primary" onClick={doRename} disabled={!rename.value || rename.value.trim() === rename.name}>Save</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <FileUploadModal
                open={!!fileUploadModal}
                onClose={() => setFileUploadModal(null)}
                users={users}
                teams={teams}
                acl={uploadAcl}
                setAcl={setUploadAcl}
                file={fileUploadModal?.file}
                setFile={(newFile) =>
                  setFileUploadModal((prev) => ({ ...prev, file: newFile }))
                }
                loading={uploading}
                onSubmit={doUploadFile}
              />

              <AclEditModal
                open={!!aclModal}
                onClose={() => setAclModal(null)}
                item={aclModal?.item}
                acl={aclModal?.acl}
                setAcl={(newAcl) =>
                  setAclModal((prev) => ({ ...prev, acl: newAcl }))
                }
                users={users}
                teams={teams}
                onSave={handleSaveAcl}
              />

              <CreateWebLinkModal
                open={!!webLinkModal}
                onClose={() => setWebLinkModal(null)}
                onSubmit={onCreateWebLink}
                data={webLinkModal || { name: "", url: "" }}
                setData={(v) => setWebLinkModal(v)}
                users={users}
                teams={teams}
                acl={uploadAcl}
                setAcl={setUploadAcl}
                loading={creatingWebLink}
                error={webLinkNameError}
              />

              <ViewWebLinkModal
                open={viewWebLinkModal}
                onClose={() => setViewWebLinkModal(null)}
                data={viewWebLinkModal}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;


