import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { useNotifications } from '../../context/NotificationProvider';
import { useAuth } from '../../context/AuthProvider';

const NotificationsPage = () => {
  const {
    notifications,
    unreadCount,
    loadNotifications,
    markOneRead,
    markAllRead,
    removeNotification,
  } = useNotifications();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await markAllRead();
    } catch (err) {
      console.error('Failed to mark all as read', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveNotification = async (id) => {
    await removeNotification(id);
  };

  const handleMarkRead = async (id) => {
    await markOneRead(id);
  };

  const safeNotifications = Array.isArray(notifications)
    ? notifications.filter(n => n && n._id)
    : [];

  const getNotificationIcon = (title) => {
    const titleLower = (title || '').toLowerCase();
    if (titleLower.includes('access') || titleLower.includes('control')) {
      return 'mdi-shield-account';
    } else if (titleLower.includes('upload') || titleLower.includes('file')) {
      return 'mdi-upload';
    } else if (titleLower.includes('link') || titleLower.includes('web')) {
      return 'mdi-link-variant';
    } else if (titleLower.includes('folder')) {
      return 'mdi-folder';
    } else if (titleLower.includes('user') || titleLower.includes('created')) {
      return 'mdi-account-plus';
    }
    return 'mdi-bell';
  };

  return (
    <div className="container-fluid" style={{ padding: '24px' }}>
      <div className="row">
        <div className="col-12">
          {/* Header Card */}
          <div className="card" style={{ 
            border: 'none', 
            borderRadius: '12px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            marginBottom: '24px'
          }}>
            <div className="card-body" style={{ padding: '24px' }}>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}>
                    <i className="mdi mdi-bell" style={{ fontSize: '28px', color: '#fff' }}></i>
                  </div>
                  <div>
                    <h4 className="mb-1" style={{ 
                      fontWeight: 700, 
                      color: '#1e293b',
                      fontSize: '24px'
                    }}>
                      Notifications
                    </h4>
                    <p className="mb-0 text-muted" style={{ fontSize: '14px' }}>
                      {unreadCount || 0} unread notification{unreadCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <button
                    className="btn"
                    onClick={handleMarkAllRead}
                    disabled={loading}
                    style={{
                      background: loading 
                        ? '#94a3b8' 
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 20px',
                      fontWeight: 600,
                      color: '#fff',
                      fontSize: '14px',
                      boxShadow: loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)',
                      transition: 'all 0.2s ease',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                      }
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Marking...
                      </>
                    ) : (
                      <>
                        <i className="mdi mdi-check-all me-2"></i>
                        Mark All as Read
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          {safeNotifications.length > 0 ? (
            <div className="card" style={{ 
              border: 'none', 
              borderRadius: '12px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <div className="card-body" style={{ padding: 0 }}>
                {safeNotifications.map((notify, index) => (
                  <div
                    key={notify._id}
                    onClick={() => {
                      if (!notify.isRead) {
                        handleMarkRead(notify._id);
                      }
                    }}
                    style={{
                      padding: '20px 24px',
                      borderBottom: index < safeNotifications.length - 1 ? '1px solid #e2e8f0' : 'none',
                      cursor: 'pointer',
                      background: !notify.isRead ? '#f8fafc' : '#fff',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = !notify.isRead ? '#f1f5f9' : '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = !notify.isRead ? '#f8fafc' : '#fff';
                    }}
                  >
                    {/* Unread indicator */}
                    {!notify.isRead && (
                      <div style={{
                        position: 'absolute',
                        left: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#667eea',
                        boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)'
                      }}></div>
                    )}

                    <div className="d-flex gap-3" style={{ marginLeft: !notify.isRead ? '20px' : '0' }}>
                      {/* Icon */}
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: !notify.isRead 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.2s ease'
                      }}>
                        <i 
                          className={`mdi ${getNotificationIcon(notify.title)}`}
                          style={{ 
                            fontSize: '24px', 
                            color: !notify.isRead ? '#fff' : '#64748b'
                          }}
                        ></i>
                      </div>

                      {/* Content */}
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        {/* Badges */}
                        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                          {notify.created_by === user?._id && (
                            <span 
                              className="badge"
                              style={{
                                background: '#dbeafe',
                                color: '#1e40af',
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '4px 10px',
                                borderRadius: '6px'
                              }}
                            >
                              <i className="mdi mdi-send me-1" style={{ fontSize: '10px' }}></i>
                              You Sent This
                            </span>
                          )}
                          {!notify.isRead && (
                            <span 
                              className="badge"
                              style={{
                                background: '#667eea',
                                color: '#fff',
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '4px 10px',
                                borderRadius: '6px'
                              }}
                            >
                              New
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h6 className="mb-2" style={{ 
                          fontWeight: !notify.isRead ? 700 : 600,
                          color: '#1e293b',
                          fontSize: '16px',
                          lineHeight: '1.4'
                        }}>
                          {notify.title || 'Untitled Notification'}
                        </h6>

                        {/* Body */}
                        <p className="mb-2" style={{ 
                          color: '#64748b',
                          fontSize: '14px',
                          lineHeight: '1.6',
                          wordWrap: 'break-word'
                        }}>
                          {notify.body}
                        </p>

                        {/* Timestamp */}
                        <div className="d-flex align-items-center gap-2">
                          <small style={{ 
                            color: '#94a3b8',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <i className="mdi mdi-clock-outline" style={{ fontSize: '14px' }}></i>
                            {notify.createdAt
                              ? moment(notify.createdAt).format('MMMM DD, YYYY [at] h:mm A')
                              : notify.created_at
                              ? moment(notify.created_at).format('MMMM DD, YYYY [at] h:mm A')
                              : ''}
                            {' • '}
                            {notify.createdAt
                              ? moment(notify.createdAt).fromNow()
                              : notify.created_at
                              ? moment(notify.created_at).fromNow()
                              : ''}
                          </small>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="d-flex align-items-start" style={{ flexShrink: 0 }}>
                        <button
                          className="btn btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveNotification(notify._id);
                          }}
                          title="Remove notification"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            padding: '8px',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#fee2e2';
                            e.currentTarget.style.color = '#dc2626';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#94a3b8';
                          }}
                        >
                          <i className="mdi mdi-close" style={{ fontSize: '18px' }}></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card" style={{ 
              border: 'none', 
              borderRadius: '12px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <div className="card-body" style={{ padding: '80px 24px' }}>
                <div className="text-center">
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px'
                  }}>
                    <i className="mdi mdi-bell-off-outline" style={{ 
                      fontSize: '64px', 
                      color: '#cbd5e1'
                    }}></i>
                  </div>
                  <h5 style={{ 
                    fontWeight: 600, 
                    color: '#475569',
                    marginBottom: '8px'
                  }}>
                    No notifications
                  </h5>
                  <p style={{ 
                    color: '#94a3b8',
                    fontSize: '14px',
                    margin: 0
                  }}>
                    You're all caught up! New notifications will appear here.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;

