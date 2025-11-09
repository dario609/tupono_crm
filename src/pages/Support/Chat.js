import React, { useMemo, useRef, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthProvider";
import ChatApi from "../../api/chatApi";
import { getSocket } from "../../utils/socket";

const Chat = () => {
  const { user, loading } = useAuth();
  const myId = String(user?._id || "me");
  const isSuper = user?.role_id?.role_name === "Super Admin";

  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeUser, setActiveUser] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [messagesByThread, setMessagesByThread] = useState({});
  const messagesByThreadRef = useRef({});
  const [unreadByUser, setUnreadByUser] = useState({});
  const [text, setText] = useState("");
  const endRef = useRef(null);
  const leftPanelRef = useRef(null);
  const searchInputRef = useRef(null);
  const [searching, setSearching] = useState(false);
  const activeUserId = activeUser?._id || null;
  useEffect(() => { messagesByThreadRef.current = messagesByThread; }, [messagesByThread]);

  // Helper: refresh unread map from the server (without disturbing current list)
  const refreshUnread = async () => {
    try {
      const list = await ChatApi.users("").catch(() => []);
      if (Array.isArray(list)) {
        const map = {};
        list.forEach((u) => { map[u._id] = u.unread || 0; });
        setUnreadByUser((prev) => ({ ...map, ...prev }));
      }
    } catch {}
  };

  // Debounce query to limit network calls
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(id);
  }, [query]);

  // Super Admin → fetch user list when query changes (only after auth ready)
  useEffect(() => {
    if (loading || !user || !isSuper) return;
    (async () => {
      const list = await ChatApi.users(debouncedQuery).catch(() => []);
      const filtered = (list || []).filter((u) => String(u._id) !== myId);
      setUsers(filtered);
      // Seed/refresh unread badge counts per user from server
      setUnreadByUser((prev) => {
        const next = { ...prev };
        filtered.forEach((u) => { next[u._id] = u.unread || 0; });
        return next;
      });
    })();
  }, [loading, user, isSuper, debouncedQuery, myId]);

  // Close search on outside click → reset to history list
  useEffect(() => {
    const onDown = (e) => {
      if (!leftPanelRef.current) return;
      if (leftPanelRef.current.contains(e.target)) return;
      if (searching) {
        setSearching(false);
        setQuery("");
        try { searchInputRef.current?.blur(); } catch {}
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [searching]);

  // End-user → open personal thread automatically (once after auth ready)
  useEffect(() => {
    if (loading || !user || isSuper) return;
    let cancelled = false;
    (async () => {
      const th = await ChatApi.myThread().catch(() => null);
      if (!th || cancelled) return;
      setActiveThread(th);
      const msgs = await ChatApi.messages(th._id).catch(() => []);
      setMessagesByThread((map) => ({ ...map, [th._id]: msgs || [] }));
      const s = getSocket();
      s.emit("chat:join", { threadId: th._id });
      ChatApi.markRead(th._id).catch(() => {});
      try { window.dispatchEvent(new CustomEvent("supportBadge:refresh")); } catch {}
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
    })();
    return () => { cancelled = true; };
  }, [loading, user, isSuper, myId]);

  // identify socket
  useEffect(() => {
    if (loading || !user) return;
    const s = getSocket();
    s.emit("chat:identify", { userId: myId });
  }, [myId, user, loading]);

  // Ensure room re-join on reconnects (otherwise realtime may stop)
  useEffect(() => {
    const s = getSocket();
    const onConnect = () => {
      try {
        s.emit("chat:identify", { userId: myId });
        if (activeThread?._id) {
          s.emit("chat:join", { threadId: activeThread._id });
        }
      } catch {}
    };
    s.on("connect", onConnect);
    s.on("reconnect", onConnect);
    return () => {
      s.off("connect", onConnect);
      s.off("reconnect", onConnect);
    };
  }, [myId, activeThread]);

  // realtime
  useEffect(() => {
    const s = getSocket();
    const handler = (msg) => {
      // If the incoming message was sent by me or matches the last optimistic client id, ignore.
      if (String(msg?.from?._id || msg?.from) === myId) {
        return;
      }
      const existing = activeThread ? (messagesByThreadRef.current[activeThread._id] || []) : [];
      const last = existing[existing.length - 1];
      if (last && last.client_id && msg?.client_id && last.client_id === msg.client_id) {
        return;
      }
      // message belongs to current thread?
      if (activeThread && String(activeThread._id) === String(msg.thread_id)) {
        // Dedupe: if the last message in this thread is effectively identical, skip append
        const existing = messagesByThreadRef.current[activeThread._id] || [];
        const last = existing[existing.length - 1];
        const lastFrom = String(last?.from?._id || last?.from || "");
        const curFrom = String(msg?.from?._id || msg?.from || "");
        const isSameAuthor = lastFrom === curFrom;
        const isSameText = (last?.text || "") === (msg?.text || "");
        const lastAt = last?.createdAt ? new Date(last.createdAt).getTime() : 0;
        const curAt = msg?.createdAt ? new Date(msg.createdAt).getTime() : 0;
        const closeInTime = Math.abs(curAt - lastAt) < 10000; // 10s window
        if (!(isSameAuthor && isSameText && closeInTime)) {
          setMessagesByThread((m) => ({
            ...m,
            [activeThread._id]: [...(m[activeThread._id] || []), msg],
          }));
        }
        // Clear badge and mark as read when viewing live
        if (activeUser?._id) setUnreadByUser((m) => ({ ...m, [activeUser._id]: 0 }));
        ChatApi.markRead(activeThread._id).catch(() => {});
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
      } else {
        // increment badge for that user
        const uid = String(msg.thread_user_id || "");
        if (uid) setUnreadByUser((map) => ({ ...map, [uid]: (map[uid] || 0) + 1 }));
      }
    };
    s.on("chat:new-message", handler);
    return () => s.off("chat:new-message", handler);
  }, [activeThread, myId, activeUserId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, query]);

  const currentMessages = useMemo(() => {
    if (!activeThread) return [];
    return messagesByThread[activeThread._id] || [];
  }, [messagesByThread, activeThread]);

  const openUser = async (u) => {
    if (!isSuper) return;
    const th = await ChatApi.threadByUser(u._id).catch(() => null);
    if (!th) return;
    setActiveUser(u);
    setActiveThread(th);
    setUnreadByUser((m) => ({ ...m, [u._id]: 0 }));
    const msgs = await ChatApi.messages(th._id).catch(() => []);
    setMessagesByThread((map) => ({ ...map, [th._id]: msgs || [] }));
    const s = getSocket();
    s.emit("chat:join", { threadId: th._id });
    ChatApi.markRead(th._id).catch(() => {});
    try { window.dispatchEvent(new CustomEvent("supportBadge:refresh")); } catch {}
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
  };

  const send = async () => {
    const t = text.trim();
    if (!t || !activeThread) return;
    setText("");
    const clientId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const optimistic = { thread_id: activeThread._id, from: myId, text: t, createdAt: new Date().toISOString(), client_id: clientId, mine: true };
    setMessagesByThread((m) => ({ ...m, [activeThread._id]: [...(m[activeThread._id] || []), optimistic] }));
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
    await ChatApi.send(activeThread._id, t, clientId).catch(() => {});
  };

  return (
    <div className="card mt-3">
      <div className="d-flex align-items-center justify-content-between px-3 pt-3 pb-2">
        <h6 className="fw-semibold mb-0">Support Management</h6>
      </div>
      <div className="row card-body pt-0" style={{ minHeight: 560 }}>
        {/* Left panel (Super Admin only) */}
        {isSuper && (
          <div ref={leftPanelRef} className="col-md-4 mb-3 mb-md-0" style={{ borderRight: "1px solid #eef2f7" }}>
            <div className="position-relative mb-2">
              <input
                ref={searchInputRef}
                className="form-control"
                placeholder="Search users…"
                value={query}
                onFocus={() => setSearching(true)}
                onChange={(e) => { setSearching(true); setQuery(e.target.value); }}
                style={{ borderRadius: 10, paddingLeft: 12, height: 40 }}
              />
            </div>
            <div style={{ maxHeight: "67vh", overflow: "auto" }}>
              {filtered.map((u) => {
                const isActive = activeUser && activeUser._id === u._id;
                const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
                const badge = (unreadByUser[u._id] ?? u.unread ?? 0);
                return (
                  <button
                    key={u._id}
                    onClick={() => openUser(u)}
                    className={`w-100 text-start btn ${isActive ? "" : "btn-ghost"}`}
                    style={{
                      background: isActive ? "linear-gradient(90deg, #eef5ff, #f7fbff)" : "transparent",
                      border: "1px solid #e8eef7",
                      borderRadius: 12,
                      padding: "10px 12px",
                      marginBottom: 8,
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            background: "#e8f0ff",
                            color: "#2b5cff",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 700,
                          }}
                        >
                          {name.slice(0, 1).toUpperCase() || "U"}
                        </div>
                        <div>
                          <div className="fw-semibold" style={{ lineHeight: 1.1 }}>
                            {name || "User"}
                          </div>
                          <div className="text-muted" style={{ fontSize: 12 }}>Click to open conversation</div>
                        </div>
                      </div>
                      {badge > 0 && (
                        <span className="badge bg-primary" style={{ borderRadius: 8 }}>{badge}</span>
                      )}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && <div className="text-muted small">No users</div>}
            </div>
          </div>
        )}

        {/* Right panel */}
        <div className={isSuper ? "col-md-8 d-flex flex-column" : "col-12 d-flex flex-column"}>
          <div
            className="flex-grow-1 p-3"
            style={{
              background: "linear-gradient(180deg,#fbfdff,#f6f9ff)",
              borderRadius: 12,
              border: "1px solid #e9eef7",
              minHeight: 360,
              maxHeight: "68vh",
              overflowY: "auto",
            }}
          >
            {!activeThread && (
              <div className="h-100 w-100 d-flex align-items-center justify-content-center text-muted">
                Select a user to start chatting
              </div>
            )}
            {activeThread && currentMessages.map((m, idx) => {
              const mine = typeof m.mine === "boolean" ? m.mine : (String(m.from?._id || m.from) === myId);
              const bubbleBg = mine ? "linear-gradient(90deg,#06b6d4,#0991c8)" : "#eef3fa";
              const tailBg = mine ? "#0991c8" : "#eef3fa";
              return (
                <div
                  key={idx}
                  className="mb-2 d-flex"
                  style={{ justifyContent: mine ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}
                >
                  <div
                    style={{
                      position: "relative",
                      background: bubbleBg,
                      color: mine ? "white" : "#0b1b34",
                      padding: "10px 12px",
                      maxWidth: "75%",
                      borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      boxShadow: mine ? "0 8px 20px rgba(0,140,200,.20)" : "0 6px 14px rgba(10,20,40,.06)",
                    }}
                  >
                    <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.text}</div>
                    <div className="text-muted" style={{ fontSize: 11, marginTop: 6, opacity: .85, color: mine ? "rgba(255,255,255,.8)" : "#6b7a90" }}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        bottom: 8,
                        [mine ? "right" : "left"]: -6,
                        width: 10,
                        height: 10,
                        background: tailBg,
                        transform: "rotate(45deg)",
                        borderRadius: 3,
                        boxShadow: mine ? "2px 2px 8px rgba(0,140,200,.18)" : "2px 2px 8px rgba(10,20,40,.06)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <div className="d-flex gap-2 mt-2">
            <input
              disabled={!activeThread}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="form-control"
              placeholder={activeThread ? "Write a message…" : "Select a user from the list"}
              style={{ borderRadius: 12, height: 44 }}
            />
            <button onClick={send} disabled={!activeThread || !text.trim()} className="btn btn-primary" style={{ borderRadius: 12, paddingInline: 20 }}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;


