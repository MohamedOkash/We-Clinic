import { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, CheckCircle } from 'lucide-react';
import { useClinic } from '../contexts/ClinicContext';

export function NotificationBell() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadCount, isAr } = useClinic();
  const [showPanel, setShowPanel] = useState(false);
  const unreadCount = getUnreadCount();

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors hover:scale-105 active:scale-95"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div
          className={`absolute ${isAr ? 'left-0' : 'right-0'} top-12 w-80 sm:w-96 max-h-96 overflow-y-auto bg-slate-950/95 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-2xl z-50`}
        >
          {/* Header */}
          <div className="sticky top-0 bg-slate-900 border-b border-cyan-500/10 p-3.5 flex items-center justify-between gap-2">
            <span className="text-white font-black text-sm flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-cyan-400" />
              {isAr ? 'الإشعارات' : 'Notifications'}
              {unreadCount > 0 && (
                <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full shrink-0">
                  {unreadCount}
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllNotificationsAsRead}
                  className="text-[10px] sm:text-xs font-black text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 bg-cyan-400/10 hover:bg-cyan-400/20 px-2 py-1 rounded-lg shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isAr ? 'تحديد الكل كمقروء' : 'Mark all read'}
                </button>
              )}
              <button onClick={() => setShowPanel(false)} className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
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
