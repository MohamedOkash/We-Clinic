import { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, CheckCircle } from 'lucide-react';
import { useClinic } from '../contexts/ClinicContext';

export function NotificationBell() {
  const { notifications, markNotificationAsRead, getUnreadCount, isAr } = useClinic();
  const [showPanel, setShowPanel] = useState(false);
  const unreadCount = getUnreadCount();

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-300 hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div
          className={`absolute ${isAr ? 'right-0' : 'left-0'} top-12 w-96 max-h-96 overflow-y-auto bg-slate-900 border border-cyan-500/20 rounded-lg shadow-2xl z-50`}
        >
          {/* Header */}
          <div className="sticky top-0 bg-slate-800 border-b border-cyan-500/20 p-3 flex items-center justify-between">
            <span className="text-white font-semibold text-sm">
              {isAr ? 'الإشعارات' : 'Notifications'}
            </span>
            <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              {isAr ? 'لا توجد إشعارات' : 'No notifications'}
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onRead={() => {
                    markNotificationAsRead(notif.id);
                    if (notif.actionUrl) {
                      window.location.href = notif.actionUrl;
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification, onRead }) {
  const { isAr } = useClinic();
  const getIcon = () => {
    switch (notification.type) {
      case 'lab_results_ready':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'order_received':
        return <AlertCircle className="w-5 h-5 text-blue-400" />;
      case 'prescription_sent':
        return <CheckCircle className="w-5 h-5 text-cyan-400" />;
      default:
        return <Bell className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div
      className={`p-4 cursor-pointer hover:bg-slate-800 transition-colors ${
        notification.read ? 'bg-slate-900/50 opacity-60' : 'bg-slate-900'
      }`}
      onClick={onRead}
    >
      <div className="flex items-start gap-3">
        <div className="pt-1">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {isAr ? notification.title : notification.titleEn}
          </p>
          <p className="text-gray-400 text-xs mt-1 line-clamp-2">
            {isAr ? notification.message : notification.messageEn}
          </p>
          <p className="text-gray-500 text-xs mt-2">
            {new Date(notification.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        {!notification.read && <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 shrink-0" />}
      </div>
    </div>
  );
}

export default NotificationBell;
