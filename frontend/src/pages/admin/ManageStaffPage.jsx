/**
 * Manage Staff Page - View and manage pending staff registrations
 */

import React, { useState, useEffect } from 'react'
import { UserPlus, Check, Mail, Phone, Hash, Calendar, Clock, X } from 'lucide-react'
import adminService from '../../services/adminService'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const ManageStaffPage = () => {
  const [pendingStaff, setPendingStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Fetch pending staff
  const fetchPendingStaff = async () => {
    try {
      setLoading(true)
      const response = await adminService.getPendingStaff()
      setPendingStaff(response.data.staff || [])
    } catch (error) {
      console.error('Error fetching pending staff:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingStaff()
  }, [])

  // Approve staff
  const handleApprove = async (staffId, staffName) => {
    if (!confirm(`Approve ${staffName} to access the system?`)) {
      return
    }

    try {
      setActionLoading(staffId)
      await adminService.approveStaffRegistration(staffId)
      alert(`${staffName} has been approved successfully!`)
      await fetchPendingStaff()
    } catch (error) {
      console.error('Error approving staff:', error)
      alert('Failed to approve staff. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  // Open reject modal
  const openRejectModal = (staff) => {
    setSelectedStaff(staff)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  // Reject staff
  const handleReject = async () => {
    if (!selectedStaff) return

    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    try {
      setActionLoading(selectedStaff._id)
      await adminService.rejectStaffRegistration(selectedStaff._id, rejectionReason)
      alert(`${selectedStaff.name} has been rejected.`)
      setShowRejectModal(false)
      setSelectedStaff(null)
      await fetchPendingStaff()
    } catch (error) {
      console.error('Error rejecting staff:', error)
      alert('Failed to reject staff. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  // Cancel staff
  const handleCancel = async (staffId, staffName) => {
    const reason = prompt(`Cancel ${staffName}'s registration?\n\nEnter cancellation reason (optional):`)
    
    if (reason === null) return // User clicked cancel

    try {
      setActionLoading(staffId)
      await adminService.cancelStaffRegistration(staffId, reason || 'Cancelled by admin')
      alert(`${staffName}'s registration has been cancelled.`)
      await fetchPendingStaff()
    } catch (error) {
      console.error('Error cancelling staff:', error)
      alert('Failed to cancel registration. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header - Sky Blue Primary */}
        <div className="bg-accent rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center">
                <UserPlus className="w-10 h-10 mr-3" />
                Pending Staff Registrations
              </h1>
              <p className="text-white/90 text-lg">
                Review and approve staff registration requests
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white rounded-xl p-6 text-center border-2 border-white shadow-md">
                <div className="text-5xl font-bold text-gray-900">{pendingStaff.length}</div>
                <div className="text-sm text-gray-600 mt-1 font-medium">Pending</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Banner - Mobile */}
        <div className="md:hidden bg-accent rounded-xl shadow-lg p-4 mb-6 flex items-center">
          <div className="bg-white rounded-full p-3 mr-4">
            <Clock className="w-6 h-6 text-accent-dark" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">
              {pendingStaff.length} Pending Request{pendingStaff.length !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-white/90">
              Awaiting your approval
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" variant="primary" />
          </div>
        ) : pendingStaff.length === 0 ? (
          /* Empty State */
          <div className="bg-gray-50 rounded-2xl shadow-lg p-16 text-center border-2 border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="bg-success w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
              <Check className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">
              All Caught Up!
            </h3>
            <p className="text-gray-600 text-lg mb-4">
              No pending staff registrations at the moment.
            </p>
            <p className="text-sm text-gray-500">
              New registration requests will appear here for your review.
            </p>
          </div>
        ) : (
          /* Staff List */
          <div className="space-y-6">
            {pendingStaff.map((staff, index) => (
              <div
                key={staff._id}
                className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 hover:border-accent hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  {/* Staff Info */}
                  <div className="flex-1">
                    <div className="flex items-center mb-4">
                      <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-white font-bold text-2xl mr-4 shadow-md">
                        {staff.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {staff.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-accent-light text-accent-dark rounded-full text-xs font-semibold border border-accent">
                            {staff.designation}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold border border-gray-300">
                            {staff.department}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center text-sm text-gray-700">
                          <Mail className="w-5 h-5 mr-3 text-accent" />
                          <span className="font-medium">{staff.email}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-700">
                          <Phone className="w-5 h-5 mr-3 text-accent" />
                          <span className="font-medium">{staff.phone}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-700">
                          <Hash className="w-5 h-5 mr-3 text-info" />
                          <span className="font-medium">{staff.employeeId}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-700">
                          <Calendar className="w-5 h-5 mr-3 text-info" />
                          <span className="font-medium">{formatDate(staff.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center bg-accent-light border-2 border-accent rounded-lg px-4 py-2 text-sm">
                      <Clock className="w-5 h-5 mr-2 text-accent-dark" />
                      <span className="text-accent-dark font-semibold">
                        ⏳ Awaiting Approval
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col lg:flex-row gap-3 lg:ml-6">
                    <button
                      onClick={() => handleApprove(staff._id, staff.name)}
                      disabled={actionLoading === staff._id}
                      className="flex items-center justify-center px-6 py-3 bg-success text-white rounded-xl font-semibold shadow-md hover:bg-success-dark hover:shadow-lg transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      {actionLoading === staff._id ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : 'Approve'}
                    </button>
                    
                    <button
                      onClick={() => openRejectModal(staff)}
                      disabled={actionLoading === staff._id}
                      className="flex items-center justify-center px-6 py-3 bg-error text-white rounded-xl font-semibold shadow-md hover:bg-error-dark hover:shadow-lg transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Reject
                    </button>
                    
                    <button
                      onClick={() => handleCancel(staff._id, staff.name)}
                      disabled={actionLoading === staff._id}
                      className="flex items-center justify-center px-6 py-3 bg-gray-700 text-white rounded-xl font-semibold shadow-md hover:bg-gray-800 hover:shadow-lg transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 border-2 border-gray-200">
            <div className="flex items-center mb-6">
              <div className="bg-error rounded-full p-3 mr-4">
                <X className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Reject Registration
              </h3>
            </div>
            
            <div className="bg-gray-50 border-l-4 border-error p-4 mb-6 rounded">
              <p className="text-gray-900">
                You are about to reject <strong className="text-error">{selectedStaff.name}</strong>'s registration request.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                This action cannot be undone. The applicant will be notified.
              </p>
            </div>

            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Reason for rejection *
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              rows="4"
              placeholder="Please provide a detailed reason for rejection..."
            />

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleReject}
                disabled={actionLoading === selectedStaff._id}
                className="flex-1 bg-error text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-error-dark hover:shadow-lg transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {actionLoading === selectedStaff._id ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Rejecting...
                  </span>
                ) : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading === selectedStaff._id}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold border-2 border-gray-300 hover:bg-gray-200 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ManageStaffPage
