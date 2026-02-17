import api from './axiosInstance';

const DocsApi = {
  list: (path = '/') => api.get('/admin/docs', { params: { path } }).then(r => r.data),
  mkdir: (path, name) => api.post('/admin/docs/mkdir', { path, name }).then(r => r.data),
  upload: (path, file, acl = null) => {
    const fd = new FormData();
    fd.append('path', path);
    fd.append('file', file);
    if (acl && (acl.readUsers?.length > 0 || acl.readTeams?.length > 0 || acl.writeUsers?.length > 0 || acl.writeTeams?.length > 0)) {
      fd.append('acl', JSON.stringify(acl));
    }
    return api.post('/admin/docs/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
  uploadFolder: (path, files, folderName, acl = null) => {
    const fd = new FormData();
    fd.append('path', path);
    if (folderName) {
      fd.append('folderName', folderName);
    }
    if (acl && (acl.readUsers?.length > 0 || acl.readTeams?.length > 0 || acl.writeUsers?.length > 0 || acl.writeTeams?.length > 0)) {
      fd.append('acl', JSON.stringify(acl));
    }

    // Create an explicit array of relative paths to preserve folder structure
    const filePaths = [];
    for (const f of files) {
      // Use webkitRelativePath if available (for folder uploads), otherwise just the filename
      const relPath = f.webkitRelativePath || f.name;
      filePaths.push(relPath);
      // Append file with relative path as the filename so server can reconstruct directory structure
      fd.append('files', f, relPath);
    }

    // Send the file paths as a JSON array so backend can reliably reconstruct the folder structure
    fd.append('filePaths', JSON.stringify(filePaths));

    return api.post('/admin/docs/upload-folder', fd, { 
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000 // 60 second timeout for large folders
    }, { timeout: 300000 }).then(r => r.data); // increased timeout for large folder uploads (5 minutes)
  },
  rename: (p, name) => api.put('/admin/docs/rename', { path: p, name }).then(r => r.data),
  move: (fromPath, toPath) => api.put('/admin/docs/move', { fromPath, toPath }).then(r => r.data),
  copy: (fromPath, toPath) => api.put('/admin/docs/copy', { fromPath, toPath }).then(r => r.data),
  remove: (p) => api.delete('/admin/docs', { params: { path: p } }).then(r => r.data),
  downloadUrl: (p) => `${api.defaults.baseURL.replace(/\/$/, '')}/admin/docs/download?path=${encodeURIComponent(p)}`,
  setAcl: (p, acl) => api.put('/admin/docs/acl', { path: p, acl }).then(r => r.data),
  createWebLink: (path, name, webLink, acl = null) => {
    const payload = { path, name, webLink };
    if (acl && (acl.readUsers?.length > 0 || acl.readTeams?.length > 0 || acl.writeUsers?.length > 0 || acl.writeTeams?.length > 0)) {
      payload.acl = acl;
    }
    return api.post('/admin/docs/weblink', payload).then(r => r.data);
  },
};

export default DocsApi;


