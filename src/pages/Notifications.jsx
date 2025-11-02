import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  getUserNotifications,
  getRoleNotifications,
  markAsRead,
  markAllAsRead,
} from '../services/notificationService'
import Navbar from '../components/Navbar'
import Button from '../components/Button'

const ROLES = ['farmer', 'customer', 'agent']

const toMillis = (value) => {
  if (!value) return 0
  if (typeof value === 'string') return new Date(value).getTime()
  if (value.toDate) return value.toDate().getTime()
  if (typeof value === 'number') return value
  if (value.seconds) return value.seconds * 1000
  return new Date(value).getTime()
}

const dedupeNotifications = (items) => {
  const seen = new Map()
  items.forEach((item) => {
    if (!item) return
    const key = item.id ?? `${item.title}-${toMillis(item.createdAt)}`
    if (!seen.has(key)) seen.set(key, item)
  })
  return Array.from(seen.values())
}

const sortNotifications = (items) =>
  items
    .slice()
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))

const formatCreatedAt = (value) => {
  const millis = toMillis(value)
  return millis ? new Date(millis).toLocaleString() : '—'
}

const formatRoleLabel = (role) =>
  role ? `From ${role.charAt(0).toUpperCase()}${role.slice(1)}` : null

export default function Notifications() {
  const { user, userData } = useAuth()
  const userId = user?.uid ?? null
  const userRole = userData?.role ?? null
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const roles = new Set([...ROLES])
      if (userRole) roles.add(userRole)

      const requests = [
        getUserNotifications(userId),
        ...Array.from(roles).map((role) =>
          getRoleNotifications(role, userId),
        ),
      ]

      const results = await Promise.all(requests)
      const merged = dedupeNotifications(results.flat())
      const sorted = sortNotifications(merged)
      setNotifications(sorted)
    } catch (error) {
      console.error('Error loading notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [userId, userRole])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const unreadCount = useMemo(
    () =>
      notifications.reduce(
        (count, notif) => count + (notif?.read ? 0 : 1),
        0,
      ),
    [notifications],
  )

  const handleMarkAsRead = async (notificationId) => {
    if (!notificationId) return
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif,
      ),
    )
    try {
      await markAsRead(notificationId)
    } catch (error) {
      console.error('Error:', error)
      loadNotifications()
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!userId) return
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
    try {
      await markAllAsRead(userId)
    } catch (error) {
      console.error('Error:', error)
      loadNotifications()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              Mark All as Read ({unreadCount})
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-farmlink-orange mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">No notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const roleLabel = formatRoleLabel(
                notif.actorRole ?? notif.role ?? notif.sourceRole,
              )
              const unread = !notif.read
              return (
                <div
                  key={notif.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => unread && handleMarkAsRead(notif.id)}
                  onKeyDown={(evt) =>
                    unread &&
                    (evt.key === 'Enter' || evt.key === ' ') &&
                    handleMarkAsRead(notif.id)
                  }
                  className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-farmlink-orange ${
                    unread ? 'border-l-4 border-farmlink-orange' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {notif.title}
                        </h3>
                        {roleLabel && (
                          <span className="text-xs uppercase tracking-wide text-gray-500">
                            {roleLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatCreatedAt(notif.createdAt)}
                      </p>
                    </div>
                    {unread && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        New
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
