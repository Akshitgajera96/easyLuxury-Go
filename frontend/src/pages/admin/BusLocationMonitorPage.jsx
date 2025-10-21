/**
 * Admin Bus Location Monitor Page
 * Comprehensive monitoring dashboard for bus locations with status tracking,
 * reminders, and activity logs following 2-6-10 minute timing rules
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MapPin, 
  Navigation, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Bell,
  Activity,
  Bus,
  User,
  TrendingUp,
  Wifi,
  WifiOff,
  Moon
} from 'lucide-react'
import AdminNav from '../../components/admin/AdminNav'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import adminService from '../../services/adminService'
import { toast } from 'react-hot-toast'
import { useSocket } from '../../hooks/useSocket'

const BusLocationMonitorPage = () => {
  const { socket } = useSocket()
  const [loading, setLoading] = useState(true)
  const [buses, setBuses] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    sleep: 0,
    offline: 0,
    needingAttention: 0
  })
  const [selectedTab, setSelectedTab] = useState('all') // all, active, sleep, offline
  const [refreshing, setRefreshing] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(null)

  useEffect(() => {
    fetchMonitoredBuses()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMonitoredBuses, 30000)
    return () => clearInterval(interval)
  }, [])

  // Listen for real-time bus status updates
  useEffect(() => {
    if (socket) {
      socket.emit('join_room', 'admin_monitoring')

      socket.on('bus_status_update', (data) => {
        setBuses(prev => prev.map(bus => 
          bus.trip?._id === data.tripId 
            ? { 
                ...bus, 
                lastLocation: data.location,
                lastUpdated: data.lastUpdated,
                status: data.status
              }
            : bus
        ))
      })

      return () => {
        socket.emit('leave_room', 'admin_monitoring')
        socket.off('bus_status_update')
      }
    }
  }, [socket])

  const fetchMonitoredBuses = async () => {
    try {
      const response = await adminService.getAllMonitoredBuses()
      
      if (response?.success) {
        setBuses(response.data.buses || [])
        setStats(response.data.stats || stats)
      }
    } catch (error) {
      console.error('Failed to fetch monitored buses:', error)
      if (!loading) {
        toast.error('Failed to fetch bus status', { duration: 3000 })
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchMonitoredBuses()
    toast.success('Refreshing bus locations...', { duration: 2000 })
  }

  const handleSendReminder = async (tripId, busNumber) => {
    setSendingReminder(tripId)
    
    try {
      const response = await adminService.sendLocationReminder(tripId)
      
      if (response?.success) {
        toast.success(`Reminder sent to ${busNumber} staff successfully`, { duration: 4000 })
        
        // Update the bus with new reminder info
        setBuses(prev => prev.map(bus => 
          bus.trip?._id === tripId
            ? {
                ...bus,
                remindersSent: response.data.remindersSent,
                lastReminderSent: response.data.lastReminderSent
              }
            : bus
        ))
      }
    } catch (error) {
      console.error('Failed to send reminder:', error)
      const errorMessage = error.response?.data?.message || 'Failed to send reminder'
      toast.error(errorMessage, { duration: 4000 })
    } finally {
      setSendingReminder(null)
    }
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-500',
          description: 'Updated < 2 min ago'
        }
      case 'sleep':
        return {
          label: 'Sleep',
          icon: Moon,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-500',
          description: 'Updated 2-6 min ago'
        }
      case 'offline':
        return {
          label: 'Offline',
          icon: WifiOff,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-500',
          description: 'No update > 6 min'
        }
      default:
        return {
          label: 'Unknown',
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-500',
          description: 'Status unknown'
        }
    }
  }

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Never'
    
    const now = new Date()
    const lastUpdate = new Date(timestamp)
    const diffMs = now - lastUpdate
    const diffMin = Math.floor(diffMs / (1000 * 60))
    const diffSec = Math.floor(diffMs / 1000)
    
    if (diffSec < 60) return `${diffSec}s ago`
    if (diffMin < 60) return `${diffMin}m ago`
    
    const diffHrs = Math.floor(diffMin / 60)
    return `${diffHrs}h ${diffMin % 60}m ago`
  }

  const filteredBuses = buses.filter(bus => {
    if (selectedTab === 'all') return true
    return bus.status === selectedTab
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bus Location Monitor</h1>
            <p className="text-gray-600 mt-1">Real-time monitoring with 2-6-10 minute status rules</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-accent text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <StatCard
            title="Total Monitored"
            value={stats.total}
            icon={Bus}
            color="bg-blue-500"
            iconBg="bg-blue-100"
          />
          <StatCard
            title="Active"
            value={stats.active}
            icon={CheckCircle}
            color="bg-green-500"
            iconBg="bg-green-100"
          />
          <StatCard
            title="Sleep"
            value={stats.sleep}
            icon={Moon}
            color="bg-yellow-500"
            iconBg="bg-yellow-100"
          />
          <StatCard
            title="Offline"
            value={stats.offline}
            icon={WifiOff}
            color="bg-red-500"
            iconBg="bg-red-100"
          />
          <StatCard
            title="Need Attention"
            value={stats.needingAttention}
            icon={AlertCircle}
            color="bg-orange-500"
            iconBg="bg-orange-100"
          />
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow p-1 mb-6 flex space-x-1">
          {['all', 'active', 'sleep', 'offline'].map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${
                selectedTab === tab
                  ? 'bg-accent text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab !== 'all' && ` (${stats[tab] || 0})`}
            </button>
          ))}
        </div>

        {/* Buses List */}
        {filteredBuses.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {selectedTab === 'all' 
                ? 'No buses are being monitored currently'
                : `No buses in "${selectedTab}" status`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBuses.map((bus) => (
              <BusCard
                key={bus._id}
                bus={bus}
                onSendReminder={handleSendReminder}
                sendingReminder={sendingReminder}
                getStatusConfig={getStatusConfig}
                formatLastUpdate={formatLastUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Statistics Card Component
const StatCard = ({ title, value, icon: Icon, color, iconBg }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-all"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`${iconBg} p-3 rounded-lg`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </motion.div>
)

// Bus Card Component
const BusCard = ({ bus, onSendReminder, sendingReminder, getStatusConfig, formatLastUpdate }) => {
  const statusConfig = getStatusConfig(bus.status)
  const StatusIcon = statusConfig.icon
  const canSendReminder = bus.status === 'sleep' || bus.status === 'offline'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow p-6 hover:shadow-lg transition-all border-l-4 ${statusConfig.borderColor}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bus Info */}
        <div className="lg:col-span-4">
          <div className="flex items-start space-x-3">
            <div className={`${statusConfig.bgColor} p-3 rounded-lg`}>
              <Bus className={`w-6 h-6 ${statusConfig.color}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{bus.bus?.busNumber || 'N/A'}</h3>
              <p className="text-sm text-gray-600">{bus.bus?.operator || 'Unknown Operator'}</p>
              <p className="text-xs text-gray-500 capitalize">{bus.bus?.busType || bus.bus?.seatType || 'Type N/A'}</p>
              <div className="mt-2">
                <span className={`inline-flex items-center space-x-1 ${statusConfig.bgColor} ${statusConfig.color} px-3 py-1 rounded-full text-xs font-semibold`}>
                  <StatusIcon className="w-3 h-3" />
                  <span>{statusConfig.label}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Info */}
        <div className="lg:col-span-3">
          <div className="flex items-center space-x-2 text-gray-600 mb-2">
            <User className="w-4 h-4" />
            <span className="text-sm font-semibold">Staff</span>
          </div>
          <p className="text-gray-900 font-medium">{bus.staff?.name || 'Not Assigned'}</p>
          {bus.staff?.phone && (
            <p className="text-sm text-gray-600">{bus.staff.phone}</p>
          )}
          {bus.staff?.designation && (
            <p className="text-xs text-gray-500 mt-1">{bus.staff.designation}</p>
          )}
        </div>

        {/* Route Info */}
        <div className="lg:col-span-3">
          <div className="flex items-center space-x-2 text-gray-600 mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-semibold">Route</span>
          </div>
          <p className="text-gray-900 font-medium">
            {bus.trip?.route?.sourceCity || 'N/A'} → {bus.trip?.route?.destinationCity || 'N/A'}
          </p>
          <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600">
            <Clock className="w-3 h-3" />
            <span>Last update: {formatLastUpdate(bus.lastUpdated)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="lg:col-span-2">
          {canSendReminder && (
            <button
              onClick={() => onSendReminder(bus.trip?._id, bus.bus?.busNumber)}
              disabled={sendingReminder === bus.trip?._id}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingReminder === bus.trip?._id ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Remind Staff</span>
                </>
              )}
            </button>
          )}
          
          {bus.remindersSent > 0 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Reminders sent: {bus.remindersSent}
            </p>
          )}
        </div>
      </div>

      {/* Location Details */}
      {bus.lastLocation?.latitude && bus.lastLocation?.longitude && (
        <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Latitude:</span>
            <span className="ml-2 font-mono font-semibold">{bus.lastLocation.latitude.toFixed(6)}</span>
          </div>
          <div>
            <span className="text-gray-600">Longitude:</span>
            <span className="ml-2 font-mono font-semibold">{bus.lastLocation.longitude.toFixed(6)}</span>
          </div>
          <div>
            <span className="text-gray-600">Speed:</span>
            <span className="ml-2 font-semibold">{Math.round(bus.lastLocation.speed || 0)} km/h</span>
          </div>
          <div>
            <span className="text-gray-600">Heading:</span>
            <span className="ml-2 font-semibold">{bus.lastLocation.heading || 0}°</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default BusLocationMonitorPage
