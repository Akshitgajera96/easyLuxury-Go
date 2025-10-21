/**
 * Notification Bell Component for Admin
 * Displays notifications with dropdown panel
 */

import React, { useState, useEffect, useRef } from 'react'
import { Bell, X } from 'lucide-react'
import adminService from '../../services/adminService'

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await adminService.getNotifications(false, 50)
      setNotifications(response.data.notifications || [])
      setUnreadCount(response.data.unreadCount || 0)
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Error fetching notifications:', error)
      }
    }
  }

  // Fetch unread count (lighter call)
  const fetchUnreadCount = async () => {
    try {
      const response = await adminService.getUnreadNotificationCount()
      setUnreadCount(response.data.count || 0)
    } catch (error) {
      // Silently fail
    }
  }

  // Poll for notifications every 30 seconds
  useEffect(() => {
    fetchNotifications() // Initial fetch
    const interval = setInterval(fetchUnreadCount, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Toggle dropdown
  const toggleDropdown = async () => {
    if (!isOpen) {
      setLoading(true)
      await fetchNotifications()
      setLoading(false)
    }
    setIsOpen(!isOpen)
  }

  // Mark as read
  const markAsRead = async (notificationId) => {
    try {
      await adminService.markNotificationAsRead(notificationId)
      await fetchNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await adminService.markAllNotificationsAsRead()
      await fetchNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await adminService.deleteNotification(notificationId)
      await fetchNotifications()
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Format time ago
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    }

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit)
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`
      }
    }
    
    return 'Just now'
  }

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'staff_registration':
        return <div className="w-5 h-5 bg-black40 text-white rounded-full flex items-center justify-center text-xs font-bold">+</div>
      case 'staff_approved':
        return <div className="w-5 h-5 bg-gradient-to-r from-success-light to-success shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</div>
      case 'staff_rejected':
        return <div className="w-5 h-5 bg-gradient-to-r from-error-light to-error shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white rounded-full flex items-center justify-center text-xs font-bold">×</div>
      default:
        return <div className="w-5 h-5 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs font-bold">!</div>
    }
  }

  // Navigate to staff pending page
  const handleNotificationClick = (notification) => {
    if (notification.type === 'staff_registration' && !notification.actionTaken) {
      window.location.href = '/admin/staff-pending'
    }
    if (!notification.isRead) {
      markAsRead(notification._id)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'text-black40 animate-pulse' : 'text-gray-500'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-error-light to-error shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-accent">({unreadCount} new)</span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-accent hover:text-black40 font-medium text-sm"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black40"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-accent/10' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 break-words">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 break-words whitespace-normal">
                          {notification.message}
                        </p>
                        {notification.staffName && (
                          <p className="text-xs text-gray-500 mt-1">
                            Staff: {notification.staffName}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                          {notification.actionTaken && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              Actioned
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification._id)
                        }}
                        className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <a
                href="/admin/staff-pending"
                className="text-accent hover:text-black40 font-medium block text-center"
              >
                View all staff requests →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell

