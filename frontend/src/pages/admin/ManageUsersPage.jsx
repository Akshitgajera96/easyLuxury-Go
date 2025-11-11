/**
 * Admin page for managing users and their roles
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import adminService from '../../services/adminService'
import { toast } from 'react-hot-toast'

const ManageUsersPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newRole, setNewRole] = useState('')
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all'
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await adminService.getUsersManagement()
      
      if (response.success) {
        setUsers(response.data.users || [])
      } else {
        throw new Error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setError(error.response?.data?.message || error.message || 'Failed to load users')
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleUpdate = async () => {
    if (!selectedUser || !newRole) return
    
    setLoading(true)
    try {
      const response = await adminService.updateUserRole(selectedUser._id, newRole)
      
      if (response.data.success) {
        toast.success('User role updated successfully')
        setShowRoleModal(false)
        setSelectedUser(null)
        setNewRole('')
        fetchUsers()
      } else {
        throw new Error('Failed to update user role')
      }
    } catch (error) {
      console.error('Failed to update user role:', error)
      toast.error(error.response?.data?.message || 'Failed to update user role')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      const response = await adminService.toggleUserStatus(userId)
      
      if (response.data.success) {
        toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`)
        fetchUsers()
      } else {
        throw new Error('Failed to update user status')
      }
    } catch (error) {
      console.error('Failed to update user status:', error)
      toast.error(error.response?.data?.message || 'Failed to update user status')
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    
    setLoading(true)
    try {
      const response = await adminService.deleteUser(selectedUser._id)
      
      if (response.data.success) {
        toast.success('User deleted successfully')
        setShowDeleteDialog(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        throw new Error('Failed to delete user')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      toast.error(error.response?.data?.message || 'Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-sky-100 text-sky-800',
      staff: 'bg-accent/20 text-black40',
      customer: 'bg-green-100 text-green-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredUsers = users.filter(user => {
    if (filters.role !== 'all' && user.role !== filters.role) {
      return false
    }
    if (filters.status !== 'all') {
      if (filters.status === 'active' && !user.isActive) return false
      if (filters.status === 'inactive' && user.isActive) return false
    }
    return true
  })

  const userStats = {
    total: users.length,
    customers: users.filter(u => u.role === 'customer').length,
    admins: users.filter(u => u.role === 'admin').length,
    staff: users.filter(u => u.role === 'staff').length,
    active: users.filter(u => u.isActive).length
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        
        {/* Filters */}
        <div className="flex space-x-4">
          <select
            value={filters.role}
            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="admin">Admins</option>
            <option value="staff">Staff</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 text-center shadow hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <p className="text-2xl font-bold text-gray-900">{userStats.total}</p>
          <p className="text-sm text-gray-600">Total Users</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <p className="text-2xl font-bold text-green-600">{userStats.customers}</p>
          <p className="text-sm text-gray-600">Customers</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <p className="text-2xl font-bold text-sky-600">{userStats.admins}</p>
          <p className="text-sm text-gray-600">Admins</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <p className="text-2xl font-bold text-black40">{userStats.staff}</p>
          <p className="text-sm text-gray-600">Staff</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <p className="text-2xl font-bold text-green-600">{userStats.active}</p>
          <p className="text-sm text-gray-600">Active</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role & Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wallet & Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-gray-50"
                >
                  {/* User Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.phone}
                      </div>
                    </div>
                  </td>

                  {/* Role & Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role.toUpperCase()}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.isActive)}`}>
                        {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </td>

                  {/* Wallet & Bookings */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-accent">
                        ₹{user.walletBalance || 0}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.bookingsCount || 0} bookings
                      </div>
                    </div>
                  </td>

                  {/* Last Activity */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowRoleModal(true)
                        }}
                        className="text-black40 hover:text-black40 text-xs"
                      >
                        Change Role
                      </button>
                      <button
                        onClick={() => handleStatusToggle(user._id, user.isActive)}
                        className={`text-xs ${
                          user.isActive 
                            ? 'text-black40 hover:text-black40' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowDeleteDialog(true)
                        }}
                        className="text-red-600 hover:text-red-900 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600">No users match your current filters.</p>
        </motion.div>
      )}

      {/* Change Role Modal */}
      {showRoleModal && selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Change User Role</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">User: <span className="font-semibold">{selectedUser?.name}</span></p>
                  <p className="text-sm text-gray-600">Current Role: <span className="font-semibold capitalize">{selectedUser?.role}</span></p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select New Role
                  </label>
                  <select
                    value={newRole || selectedUser?.role}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="customer">Customer</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> Changing user roles may affect their access permissions. 
                    Admin roles have full system access.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowRoleModal(false)
                    setNewRole('')
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleUpdate}
                  disabled={loading}
                  className="flex-1 bg-accent text-white py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <LoadingSpinner size="sm" variant="white" />}
                  Update Role
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete User"
        message={`Are you sure you want to delete user ${selectedUser?.name}? This action cannot be undone and will permanently remove all user data.`}
        confirmText="Delete User"
        cancelText="Keep User"
        onConfirm={handleDeleteUser}
        onCancel={() => {
          setShowDeleteDialog(false)
          setSelectedUser(null)
        }}
        type="danger"
        isLoading={loading}
      />
    </div>
  )
}

export default ManageUsersPage