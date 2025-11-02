import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  getUserNotifications,
  getRoleNotifications,
  markAsRead,
  markAllAsRead,
} from '../services/notificationService'
import Button from './Button'

const MAX_ITEMS = 10
const REFRESH_MS = 30_000

export default function NotificationBell() {
  const { user, userData } = useAuth()
  const [notifications, setNotifications] = useState([])

  const unreadCount = useMemo(
    () => notifications.reduce((count, notif) => (notif.read ? count : count + 1), 0),
    [notifications]
  )

  const loadNotifications = useCallback(async () => {
    if (!user?.uid || !userData?.role) return
    try {
      const [userNotifs, roleNotifs] = await Promise.all([
        getUserNotifications(user.uid),
        getRoleNotifications(userData.role, user.uid),
      ])

      const deduped = Array.from(
        new Map([...userNotifs, ...roleNotifs].map(notif => [notif.id, notif]))
      )
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? 0
          const bTime = b.createdAt?.toMillis?.() ?? 0
          return bTime - aTime
        })
        .slice(0, MAX_ITEMS)

      setNotifications(deduped)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }, [user?.uid, userData?.role])

  useEffect(() => {
    loadNotifications()
    if (!user?.uid) return
    const interval = setInterval(loadNotifications, REFRESH_MS)
    return () => clearInterval(interval)
  }, [loadNotifications, user?.uid])

  const handleMarkAsRead = async notificationId => {
    try {
      await markAsRead(notificationId)
      setNotifications(prev =>
        prev.map(notif => (notif.id === notificationId ? { ...notif, read: true } : notif))
      )
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return
    try {
      await markAllAsRead(user.uid)
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setNotifications(prev => prev)}
        className="relative p-2 text-gray-300 hover:text-white focus:outline-none"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {Boolean(notifications.length) && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-farmlink-orange hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-gray-500 text-sm">No notifications</p>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    !notif.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleMarkAsRead(notif.id)}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{notif.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notif.createdAt?.toDate?.().toLocaleString() ?? ''}
                      </p>
                    </div>
                    {!notif.read && <div className="w-2 h-2 bg-blue-600 rounded-full mt-1" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
