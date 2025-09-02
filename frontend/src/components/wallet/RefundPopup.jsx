// src/components/wallet/RefundPopup.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle, 
  HelpCircle,
  Calendar,
  Receipt,
  Clock
} from "lucide-react";
import { 
  requestRefund, 
  calculateRefundAmount, 
  getRefundReasons,
  isRefundPossible 
} from "../../services/refundService";

import { useUser } from "../../context/UserContext";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const RefundPopup = ({ 
  bookingId, 
  onClose, 
  onSuccess,
  show = true 
}) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bookingDetails, setBookingDetails] = useState(null);
  const [refundAmount, setRefundAmount] = useState(0);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [refundReasons, setRefundReasons] = useState([]);

  useEffect(() => {
    if (show && bookingId) {
      loadBookingDetails();
    }
  }, [show, bookingId]);

  useEffect(() => {
    setRefundReasons(getRefundReasons());
  }, []);

  const loadBookingDetails = async () => {
    try {
      setFetching(true);
      setError("");
      
      const [bookingData, refundEligibility] = await Promise.all([
        getBookingDetails(bookingId),
        isRefundPossible(bookingId)
      ]);

      if (!refundEligibility.eligible) {
        setError(refundEligibility.message || "Refund not available for this booking");
        return;
      }

      setBookingDetails(bookingData);
      
      // Calculate refund amount
      const calculatedAmount = calculateRefundAmount(
        bookingData.totalAmount,
        bookingData.departureTime,
        bookingData.cancellationPolicy
      );
      
      setRefundAmount(calculatedAmount.refundAmount);
    } catch (error) {
      console.error("Failed to load booking details:", error);
      setError("Failed to load booking information. Please try again.");
    } finally {
      setFetching(false);
    }
  };

  const handleRefundRequest = async () => {
    if (!selectedReason) {
      setError("Please select a reason for refund");
      return;
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      setError("Please provide details for your refund request");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const reasonText = selectedReason === 'other' ? customReason : selectedReason;
      
      const result = await requestRefund(bookingId, {
        reason: reasonText,
        requestedAmount: refundAmount,
        cancellationPolicy: bookingDetails.cancellationPolicy
      });

      if (result.success) {
        setSuccess("Refund request submitted successfully!");
        toast.success("Refund request submitted");
        
        // Call success callback after delay
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        setError(result.message || "Failed to process refund request");
      }
    } catch (error) {
      console.error("Refund request error:", error);
      setError(error.message || "An error occurred while processing your request");
    } finally {
      setLoading(false);
    }
  };

  const getReasonText = (reasonId) => {
    const reason = refundReasons.find(r => r.id === reasonId);
    return reason ? reason.label : reasonId;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <RotateCcw className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Request Refund</CardTitle>
                <CardDescription>Booking #{bookingId}</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-6 overflow-y-auto max-h-[60vh]">
            {fetching ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner message="Loading booking details..." />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </div>
            ) : success ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-green-600 dark:text-green-400 mb-4">{success}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your refund request is being processed
                </p>
              </div>
            ) : bookingDetails && (
              <>
                {/* Booking Summary */}
                <Card className="bg-gray-50 dark:bg-gray-800">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Original Amount:</span>
                        <span className="font-semibold">{formatCurrency(bookingDetails.totalAmount)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Refund Amount:</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(refundAmount)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Departure:</span>
                        <span>
                          {formatDate(bookingDetails.departureTime)} at {formatTime(bookingDetails.departureTime)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Policy:</span>
                        <span className="capitalize">{bookingDetails.cancellationPolicy}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Refund Reasons */}
                <div className="space-y-4">
                  <Label className="flex items-center text-sm font-medium">
                    Reason for Refund
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 ml-2 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm max-w-xs">Select the primary reason for your refund request</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>

                  <RadioGroup
                    value={selectedReason}
                    onValueChange={setSelectedReason}
                    className="space-y-3"
                  >
                    {refundReasons.map((reason) => (
                      <div key={reason.id} className="flex items-center space-x-3">
                        <RadioGroupItem value={reason.id} id={reason.id} />
                        <Label htmlFor={reason.id} className="text-sm font-normal cursor-pointer">
                          {reason.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  {/* Custom Reason Input */}
                  {selectedReason === 'other' && (
                    <div className="space-y-2">
                      <Label htmlFor="customReason" className="text-sm font-medium">
                        Please specify
                      </Label>
                      <Textarea
                        id="customReason"
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Provide details about your refund request..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p>
                    By submitting this request, you agree to our refund policy. 
                    Refund processing may take 5-7 business days. 
                    The final refund amount is subject to our cancellation policy.
                  </p>
                </div>
              </>
            )}
          </CardContent>

          {/* Footer Actions */}
          {!fetching && !error && !success && bookingDetails && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRefundRequest}
                  loading={loading}
                  disabled={!selectedReason || (selectedReason === 'other' && !customReason.trim())}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {loading ? "Processing..." : "Request Refund"}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RefundPopup;