// src/components/booking/BookingPopup.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { checkSeatAvailability } from "../../services/bookingService";
import toast from "react-hot-toast";

const BookingPopup = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  busId, 
  busNumber, 
  route, 
  travelDate,
  basePrice,
  existingBookings = [] 
}) => {
  const { user } = useAuth();
  const { isConnected, emitSeatLock } = useSocket();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatStatus, setSeatStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [seatLockTimers, setSeatLockTimers] = useState({});

  // Bus layout configuration
  const SEATS_PER_ROW = 4;
  const AISLE_AFTER = 2; // Aisle after every 2 seats
  const TOTAL_SEATS = 40;

  useEffect(() => {
    if (isOpen && busId) {
      loadSeatAvailability();
    }
  }, [isOpen, busId]);

  useEffect(() => {
    return () => {
      // Clear all lock timers on unmount
      Object.values(seatLockTimers).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const loadSeatAvailability = async () => {
    try {
      setLoading(true);
      const availability = await checkSeatAvailability({
        busId,
        date: travelDate,
        seats: Array.from({ length: TOTAL_SEATS }, (_, i) => i + 1)
      });
      
      setSeatStatus(availability.seatStatus || {});
    } catch (error) {
      toast.error("Failed to load seat availability");
      console.error("Seat availability error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeatStatus = (seatNumber) => {
    // Check if seat is already booked
    if (existingBookings.includes(seatNumber)) {
      return "booked";
    }
    
    // Check real-time status from server
    if (seatStatus[seatNumber]) {
      return seatStatus[seatNumber];
    }
    
    return "available";
  };

  const toggleSeat = async (seatNumber) => {
    const status = getSeatStatus(seatNumber);
    
    if (status === "booked") {
      toast.error("This seat is already booked");
      return;
    }
    
    if (status === "locked") {
      toast.error("This seat is currently being booked by another user");
      return;
    }

    if (selectedSeats.includes(seatNumber)) {
      // Unselect seat and release lock
      setSelectedSeats(prev => prev.filter(s => s !== seatNumber));
      if (isConnected) {
        emitSeatRelease(busId, [seatNumber]);
      }
      clearLockTimer(seatNumber);
    } else {
      // Select seat and create temporary lock
      setSelectedSeats(prev => [...prev, seatNumber]);
      if (isConnected) {
        emitSeatLock(busId, [seatNumber], 300); // Lock for 5 minutes
      }
      setLockTimer(seatNumber);
    }
  };

  const setLockTimer = (seatNumber) => {
    const timer = setTimeout(() => {
      setSelectedSeats(prev => prev.filter(s => s !== seatNumber));
      toast.warning(`Seat ${seatNumber} lock expired`);
    }, 5 * 60 * 1000); // 5 minutes

    setSeatLockTimers(prev => ({
      ...prev,
      [seatNumber]: timer
    }));
  };

  const clearLockTimer = (seatNumber) => {
    if (seatLockTimers[seatNumber]) {
      clearTimeout(seatLockTimers[seatNumber]);
      setSeatLockTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[seatNumber];
        return newTimers;
      });
    }
  };

  const getSeatColor = (seatNumber) => {
    const status = getSeatStatus(seatNumber);
    
    if (selectedSeats.includes(seatNumber)) {
      return "bg-green-500 text-white border-green-600";
    }
    
    switch (status) {
      case "booked":
        return "bg-red-300 text-red-800 border-red-400 cursor-not-allowed";
      case "locked":
        return "bg-yellow-300 text-yellow-800 border-yellow-400 cursor-not-allowed";
      case "available":
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getSeatIcon = (seatNumber) => {
    const status = getSeatStatus(seatNumber);
    
    if (selectedSeats.includes(seatNumber)) {
      return <User className="w-4 h-4" />;
    }
    
    switch (status) {
      case "booked":
        return <X className="w-4 h-4" />;
      case "locked":
        return <Info className="w-4 h-4" />;
      default:
        return <Chair className="w-4 h-4" />;
    }
  };

  const handleConfirm = async () => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }

    try {
      setLoading(true);
      await onConfirm(selectedSeats);
      setSelectedSeats([]);
      onClose();
    } catch (error) {
      toast.error("Failed to confirm booking");
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = selectedSeats.length * basePrice;

  const renderSeatLayout = () => {
    const rows = Math.ceil(TOTAL_SEATS / SEATS_PER_ROW);
    const layout = [];

    for (let row = 0; row < rows; row++) {
      const rowSeats = [];
      
      for (let col = 0; col < SEATS_PER_ROW; col++) {
        const seatNumber = row * SEATS_PER_ROW + col + 1;
        
        if (seatNumber > TOTAL_SEATS) {
          rowSeats.push(<div key={col} className="w-12 h-12" />);
          continue;
        }

        const isAisle = col === AISLE_AFTER;
        
        rowSeats.push(
          <React.Fragment key={col}>
            {isAisle && <div className="w-8" />} {/* Aisle space */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleSeat(seatNumber)}
              disabled={getSeatStatus(seatNumber) !== "available" && !selectedSeats.includes(seatNumber)}
              className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center font-semibold transition-all ${getSeatColor(seatNumber)}`}
              title={`Seat ${seatNumber} - ${getSeatStatus(seatNumber)}`}
            >
              {getSeatIcon(seatNumber)}
              <span className="text-xs ml-1">{seatNumber}</span>
            </motion.button>
          </React.Fragment>
        );
      }

      layout.push(
        <div key={row} className="flex items-center justify-center space-x-2 mb-3">
          {rowSeats}
        </div>
      );
    }

    return layout;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Select Your Seats
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Bus {busNumber} • {route} • {new Date(travelDate).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {/* Bus Layout Visualization */}
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="text-center mb-4">
                      <div className="w-20 h-8 bg-gray-300 dark:bg-gray-600 rounded-t-lg mx-auto mb-2"></div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Driver</div>
                    </div>
                    
                    <div className="space-y-3">
                      {renderSeatLayout()}
                    </div>

                    <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-lg mt-4"></div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 justify-center mb-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-100 border-2 border-blue-200 rounded"></div>
                      <span className="text-sm">Available</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 border-2 border-green-600 rounded"></div>
                      <span className="text-sm">Selected</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-300 border-2 border-red-400 rounded"></div>
                      <span className="text-sm">Booked</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-yellow-300 border-2 border-yellow-400 rounded"></div>
                      <span className="text-sm">Locked</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                <div className="text-center sm:text-left">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    Total: ${totalPrice.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedSeats.length} seat(s) × ${basePrice.toFixed(2)}
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={loading || selectedSeats.length === 0}
                    loading={loading}
                  >
                    Confirm {selectedSeats.length} Seat(s)
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingPopup;