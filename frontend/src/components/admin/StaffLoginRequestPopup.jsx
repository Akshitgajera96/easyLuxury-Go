import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { toast } from 'react-hot-toast';

const StaffLoginRequestPopup = ({ requests, onClose, onUpdate }) => {
  const [processing, setProcessing] = useState(null);

  const formatTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;

    if (diff <= 0) return 'Expired';

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${minutes}m ${seconds}s`;
  };

  const [timeRemaining, setTimeRemaining] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining = {};
      requests.forEach((request) => {
        newTimeRemaining[request._id] = formatTimeRemaining(request.expiresAt);
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [requests]);

  const handleApprove = async (requestId) => {
    setProcessing(requestId);
    try {
      await adminService.approveLoginRequest(requestId);
      toast.success('Login request approved successfully');
      onUpdate();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId) => {
    setProcessing(requestId);
    try {
      await adminService.rejectLoginRequest(requestId, 'Rejected by admin');
      toast.success('Login request rejected');
      onUpdate();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  if (!requests || requests.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-black40 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Staff Login Requests</h2>
              <p className="text-sm text-gray-200">{requests.length} pending request(s)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-88px)] p-6 space-y-4">
          {requests.map((request) => (
            <div
              key={request._id}
              className="p-5 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">👤</span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {request.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <span className="text-sm">@</span>
                    <p className="text-sm">{request.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 dark:bg-black40/90/30 text-black40 dark:text-accent rounded-lg">
                  <span className="text-sm">⏱</span>
                  <span className="text-sm font-medium">
                    {timeRemaining[request._id] || formatTimeRemaining(request.expiresAt)}
                  </span>
                </div>
              </div>

              <div className="mb-4 p-3 bg-white dark:bg-gray-600 rounded-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Requested At</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {new Date(request.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">IP Address</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {request.ipAddress || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(request._id)}
                  disabled={processing === request._id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-success to-success-dark shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                >
                  <span className="text-lg">✓</span>
                  {processing === request._id ? 'Processing...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleReject(request._id)}
                  disabled={processing === request._id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-error to-error-dark shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                >
                  <span className="text-lg">×</span>
                  {processing === request._id ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaffLoginRequestPopup;
