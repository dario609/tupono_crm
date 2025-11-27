// useDocuments.js
import { useState, useCallback } from "react";
import DocsApi from "../../api/docsApi";

export function useDocuments() {
  const [cwd, setCwd] = useState("/");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (path = cwd) => {
    setLoading(true);
    try {
      const data = await DocsApi.list(path);
      setItems(data || []);
      setCwd(path);
      setError("");
    } catch (err) {
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [cwd]);

  const remove = useCallback(async (path) => {
    await DocsApi.remove(path);
    await load();
  }, [load]);

  const rename = useCallback(async (path, newName) => {
    await DocsApi.rename(path, newName);
    await load();
  }, [load]);

  return {
    cwd,
    items,
    error,
    loading,
    load,
    rename,
    remove
  };
}
