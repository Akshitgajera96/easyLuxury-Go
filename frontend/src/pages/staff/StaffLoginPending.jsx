import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import { toast } from 'react-hot-toast';

const StaffLoginPending = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestId, expiresAt } = location.state || {};

  const [status, setStatus] = useState('pending');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [message, setMessage] = useState('');
  const [pollingInterval, setPollingInterval] = useState(null);

  useEffect(() => {
    if (!requestId) {
      navigate('/staff/login');
      return;
    }

    // Calculate time remaining
    const updateTimeRemaining = () => {
      const now = new Date();
      const expires = new Date(expiresAt);
      const diff = expires - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        setStatus('expired');
        return false;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      return true;
    };

    // Initial update
    updateTimeRemaining();

    // Update every second
    const timeInterval = setInterval(() => {
      if (!updateTimeRemaining()) {
        clearInterval(timeInterval);
      }
    }, 1000);

    // Poll for status every 2 seconds
    const checkStatus = async () => {
      try {
        const response = await authService.checkStaffLoginStatus(requestId);
        const data = response.data;

        if (data.status === 'approved') {
          setStatus('approved');
          setMessage('Your login has been approved!');
          
          // Store token and redirect
          if (data.token && data.staff) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.staff));
            
            toast.success('Login approved! Redirecting...');
            setTimeout(() => {
              navigate('/staff/dashboard', { replace: true });
            }, 1500);
          }
        } else if (data.status === 'rejected') {
          setStatus('rejected');
          setMessage(data.rejectionReason || 'Your login request was rejected by admin');
        } else if (data.status === 'expired') {
          setStatus('expired');
          setMessage('Your login request has expired. Please try again.');
        }
      } catch (error) {
        console.error('Error checking status:', error);
        if (error.response?.status === 404) {
          setStatus('expired');
          setMessage('Login request not found or expired');
        }
      }
    };

    // Check immediately
    checkStatus();

    // Then poll every 2 seconds
    const statusInterval = setInterval(checkStatus, 2000);
    setPollingInterval(statusInterval);

    return () => {
      clearInterval(timeInterval);
      clearInterval(statusInterval);
    };
  }, [requestId, expiresAt, navigate]);

  const handleBackToLogin = () => {
    navigate('/staff/login', { replace: true });
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <div className="w-16 h-16 border-4 border-gray-200 border-t-black40 rounded-full animate-spin"></div>,
          title: 'Waiting for Admin Approval',
          subtitle: 'Your login request has been sent to the administrator',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          textColor: 'text-gray-700 dark:text-gray-300'
        };
      case 'approved':
        return {
          icon: <div className="w-16 h-16 bg-gradient-to-r from-success-light to-success shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-full flex items-center justify-center"><span className="text-4xl text-white">✓</span></div>,
          title: 'Login Approved!',
          subtitle: 'Redirecting you to your dashboard...',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-700 dark:text-green-300'
        };
      case 'rejected':
        return {
          icon: <div className="w-16 h-16 bg-gradient-to-r from-error-light to-error shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-full flex items-center justify-center"><span className="text-4xl text-white">×</span></div>,
          title: 'Login Rejected',
          subtitle: message,
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-700 dark:text-red-300'
        };
      case 'expired':
        return {
          icon: <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center"><span className="text-4xl text-white">!</span></div>,
          title: 'Request Expired',
          subtitle: message || 'Your login request has expired. Please try again.',
          bgColor: 'bg-accent/10 dark:bg-black40/90/20',
          borderColor: 'border-accent dark:border-black40/80',
          textColor: 'text-gray-700 dark:text-gray-300'
        };
      default:
        return {
          icon: <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center"><span className="text-3xl text-white">⏱</span></div>,
          title: 'Processing...',
          subtitle: '',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Main Card */}
        <div className={`${statusDisplay.bgColor} border-2 ${statusDisplay.borderColor} rounded-2xl shadow-2xl p-8 space-y-6`}>
          {/* Icon */}
          <div className="flex justify-center">
            {statusDisplay.icon}
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className={`text-3xl font-bold ${statusDisplay.textColor} mb-2`}>
              {statusDisplay.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {statusDisplay.subtitle}
            </p>
          </div>

          {/* Time Remaining (only for pending) */}
          {status === 'pending' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-2xl">⏱</span>
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  Time Remaining
                </span>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-black40 dark:text-gray-400 tabular-nums">
                  {timeRemaining}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Request will expire if not approved
                </p>
              </div>
            </div>
          )}

          {/* Instructions (only for pending) */}
          {status === 'pending' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-900 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                What happens next?
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-black40 rounded-full mt-1.5 flex-shrink-0" />
                  <span>Admin will receive a notification about your login request</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-black40 rounded-full mt-1.5 flex-shrink-0" />
                  <span>They can approve or reject your request</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-black40 rounded-full mt-1.5 flex-shrink-0" />
                  <span>You'll be automatically redirected once approved</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-black40 rounded-full mt-1.5 flex-shrink-0" />
                  <span>This page updates automatically - no need to refresh</span>
                </li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          {(status === 'rejected' || status === 'expired') && (
            <button
              onClick={handleBackToLogin}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-black40 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
            >
              <span>←</span>
              Back to Login
            </button>
          )}

          {status === 'pending' && (
            <button
              onClick={handleBackToLogin}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <span>←</span>
              Cancel and Go Back
            </button>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Having trouble? Contact your administrator for assistance.</p>
        </div>
      </div>
    </div>
  );
};

export default StaffLoginPending;
