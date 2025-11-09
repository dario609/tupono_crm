import api from "./axiosInstance";

const ChatApi = {
  myThread: () => api.get("/chat/my-thread"),
  threadByUser: (userId) => api.get(`/chat/thread-by-user/${userId}`),
  messages: (threadId) => api.get(`/chat/threads/${threadId}/messages`),
  send: (threadId, text, clientId) => api.post(`/chat/threads/${threadId}/messages`, { text, clientId }),
  markRead: (threadId) => api.post(`/chat/threads/${threadId}/read`),
  unreadCount: () => api.get("/chat/unread-count"),
  users: (q) => api.get("/chat/users", { params: { q } }),
};

export default ChatApi;
