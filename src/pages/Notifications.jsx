import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getUserNotifications, getRoleNotifications, markAsRead, markAllAsRead } from '../services/notificationService'
import Navbar from '../components/Navbar'
import Button from '../components/Button'

export default function Notifications() {
  const { user, userData } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && userData) {
      loadNotifications()
    }
  }, [user, userData])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const userNotifs = await getUserNotifications(user.uid)
      const roleNotifs = await getRoleNotifications(userData.role, user.uid)
      
      const allNotifs = [...userNotifs, ...roleNotifs]
      const uniqueNotifs = allNotifs.filter((notif, index, self) =>
        index === self.findIndex(n => n.id === notif.id)
      )

      setNotifications(uniqueNotifs)
    } catch (err) {
      console.error('Error loading notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId)
      loadNotifications()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(user.uid)
      loadNotifications()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Notifications</h1>
          {notifications.filter(n => !n.read).length > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              Mark All as Read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-farmlink-orange mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">No notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className={`bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow ${
                  !notif.read ? 'border-l-4 border-farmlink-orange' : ''
                }`}
                onClick={() => !notif.read && handleMarkAsRead(notif.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                    <p className="text-gray-600 mt-1">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {notif.createdAt?.toDate().toLocaleString()}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">New</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

