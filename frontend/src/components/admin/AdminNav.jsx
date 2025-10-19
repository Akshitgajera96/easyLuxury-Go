/**
 * Admin navigation component for quick access to admin features
 */

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Bus, Route, Calendar, ClipboardList, Users, BarChart3, MapPin } from 'lucide-react'

const AdminNav = () => {
  const location = useLocation()

  const adminQuickLinks = [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & metrics'
    },
    {
      path: '/admin/buses',
      label: 'Buses',
      icon: Bus,
      description: 'Manage fleet'
    },
    {
      path: '/admin/routes',
      label: 'Routes',
      icon: Route,
      description: 'Manage routes'
    },
    {
      path: '/admin/trips',
      label: 'Trips',
      icon: Calendar,
      description: 'Schedule trips'
    },
    {
      path: '/admin/bookings',
      label: 'Bookings',
      icon: ClipboardList,
      description: 'View all bookings'
    },
    {
      path: '/admin/users',
      label: 'Users',
      icon: Users,
      description: 'Manage users'
    },
    {
      path: '/admin/analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Reports & insights'
    },
    {
      path: '/admin/live-tracking',
      label: 'Live Tracking',
      icon: MapPin,
      description: 'Track all buses'
    }
  ]

  const isActivePath = (path) => {
    return location.pathname === path
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Quick Access</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {adminQuickLinks.map((link) => {
          const IconComponent = link.icon
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                isActivePath(link.path)
                  ? 'border-accent bg-accent/10'
                  : 'border-gray-200 hover:border-accent'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <IconComponent className="w-8 h-8 mb-2 text-accent" />
                <h3 className="font-semibold text-gray-900 mb-1">{link.label}</h3>
                <p className="text-xs text-gray-500">{link.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default AdminNav