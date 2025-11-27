// useAcl.js
import { useState } from "react";
import DocsApi from "../../api/docsApi";
import buildAclPayload from "../../utils/buildAclPayload";

export function useAcl(load) {
  const [saving, setSaving] = useState(false);

  const updateAcl = async (itemPath, aclState) => {
    setSaving(true);
    try {
      const payload = buildAclPayload(aclState);
      await DocsApi.setAcl(itemPath, payload);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return { saving, updateAcl };
}
