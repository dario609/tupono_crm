import { useState } from "react";
import DocsApi from "../../api/docsApi";
export function useClipboard(load) {
    const [clipboard, setClipboard] = useState(null);
  
    const copy = (path) => setClipboard({ type: "copy", path });
    const cut = (path) => setClipboard({ type: "cut", path });
  
    const paste = async (cwd) => {
      if (!clipboard) return;
  
      const name = clipboard.path.split("/").pop();
      const target = `${cwd}/${name}`;
  
      if (clipboard.type === "copy") {
        await DocsApi.copy(clipboard.path, target);
      } else {
        await DocsApi.move(clipboard.path, target);
      }
  
      setClipboard(null);
      await load();
    };
  
    return { clipboard, copy, cut, paste };
  }
  