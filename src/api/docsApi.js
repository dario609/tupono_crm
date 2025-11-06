import api from './axiosInstance';

const DocsApi = {
  list: (path = '/') => api.get('/admin/docs', { params: { path } }).then(r => r.data),
  mkdir: (path, name) => api.post('/admin/docs/mkdir', { path, name }).then(r => r.data),
  upload: (path, file) => {
    const fd = new FormData();
    fd.append('path', path);
    fd.append('file', file);
    return api.post('/admin/docs/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
  uploadFolder: (path, files) => {
    const fd = new FormData();
    fd.append('path', path);
    for (const f of files) {
      // Use webkitRelativePath if available (for folder uploads), otherwise just the filename
      const relPath = f.webkitRelativePath || f.name;
      // Append file with relative path as the filename so server can reconstruct directory structure
      fd.append('files', f, relPath);
    }
    return api.post('/admin/docs/upload-folder', fd, { 
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000 // 60 second timeout for large folders
    }).then(r => r.data);
  },
  rename: (p, name) => api.put('/admin/docs/rename', { path: p, name }).then(r => r.data),
  move: (fromPath, toPath) => api.put('/admin/docs/move', { fromPath, toPath }).then(r => r.data),
  copy: (fromPath, toPath) => api.put('/admin/docs/copy', { fromPath, toPath }).then(r => r.data),
  remove: (p) => api.delete('/admin/docs', { params: { path: p } }).then(r => r.data),
  downloadUrl: (p) => `${api.defaults.baseURL.replace(/\/$/, '')}/admin/docs/download?path=${encodeURIComponent(p)}`,
  setAcl: (p, acl) => api.put('/admin/docs/acl', { path: p, acl }).then(r => r.data),
};

export default DocsApi;


