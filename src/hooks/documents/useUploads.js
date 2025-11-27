// useUploads.js
import { useState } from 'react';
import DocsApi from '../../api/docsApi';
import buildAclPayload from '../../utils/buildAclPayload';

export function useUploads(load) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (cwd, file, acl) => {
    setUploading(true);
    try {
      const payload = buildAclPayload(acl);
      await DocsApi.upload(cwd, file, payload);
      await load();
    } finally {
      setUploading(false);
    }
  };

  const uploadFolder = async (cwd, folderName, files, acl) => {
    setUploading(true);
    setProgress(0);
    try {
      const payload = buildAclPayload(acl);
      await DocsApi.uploadFolder(cwd, files, folderName, payload);
      await load();
    } finally {
      setUploading(false);
      setProgress(100);
    }
  };

  return {
    uploading,
    progress,
    uploadFile,
    uploadFolder
  };
}
