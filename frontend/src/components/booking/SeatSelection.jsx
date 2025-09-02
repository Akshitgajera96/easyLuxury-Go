// src/components/booking/SeatSelection.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, X, Info, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocket } from "../../context/SocketContext";
import { checkSeatAvailability } from "../../services/bookingService";
import toast from "react-hot-toast";

// Create a simple chair icon component since it's not available in lucide-react
const ChairIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM19 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zM19 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2zM7 7h10M7 17h10M7 11h10"
    />
  </svg>
);

const SeatSelection = ({
  busId,
  busNumber,
  busLayout = "2x2", // "2x2", "2x3", "3x3"
  totalSeats = 40,
  bookedSeats = [],
  maxSelectable = 5,
  basePrice = 0,
  onConfirm,
  onCancel,
  travelDate,
  isOpen = true,
}) => {
  const { isConnected, emitSeatLock, emitSeatRelease } = useSocket();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatStatus, setSeatStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [seatLockTimers, setSeatLockTimers] = useState({});

  // Bus layout configuration
  const getLayoutConfig = () => {
    switch (busLayout) {
      case "2x3":
        return { seatsPerRow: 3, aisleAfter: 1, rows: Math.ceil(totalSeats / 3) };
      case "3x3":
        return { seatsPerRow: 3, aisleAfter: 1, rows: Math.ceil(totalSeats / 3) };
      default: // 2x2
        return { seatsPerRow: 4, aisleAfter: 2, rows: Math.ceil(totalSeats / 4) };
    }
  };

  const { seatsPerRow, aisleAfter, rows } = getLayoutConfig();

  useEffect(() => {
    if (busId && travelDate) {
      loadSeatAvailability();
    }
  }, [busId, travelDate]);

  useEffect(() => {
    return () => {
      // Release all locked seats when component unmounts
      if (isConnected && selectedSeats.length > 0) {
        emitSeatRelease(busId, selectedSeats);
      }
      // Clear all timers
      Object.values(seatLockTimers).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const loadSeatAvailability = async () => {
    try {
      setLoading(true);
      const availability = await checkSeatAvailability({
        busId,
        date: travelDate,
        seats: Array.from({ length: totalSeats }, (_, i) => i + 1)
      });
      setSeatStatus(availability.seatStatus || {});
    } catch (error) {
      console.error("Failed to load seat availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeatStatus = (seatNumber) => {
    // Check if seat is already booked
    if (bookedSeats.includes(seatNumber)) {
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
      // Check max selectable limit
      if (selectedSeats.length >= maxSelectable) {
        toast.error(`You can only select up to ${maxSelectable} seats`);
        return;
      }
      
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
      toast.warning(`Seat ${seatNumber} reservation expired`);
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
      return "bg-green-500 text-white border-green-600 shadow-md";
    }
    
    switch (status) {
      case "booked":
        return "bg-red-300 text-red-800 border-red-400 cursor-not-allowed";
      case "locked":
        return "bg-yellow-300 text-yellow-800 border-yellow-400 cursor-not-allowed";
      case "available":
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 hover:shadow-md";
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
        return <Clock className="w-4 h-4" />;
      default:
        return <ChairIcon className="w-4 h-4" />;
    }
  };

  const handleConfirm = () => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }
    onConfirm(selectedSeats);
  };

  const totalPrice = selectedSeats.length * basePrice;

  const renderBusLayout = () => {
    const layout = [];

    for (let row = 0; row < rows; row++) {
      const rowSeats = [];
      
      for (let col = 0; col < seatsPerRow; col++) {
        const seatNumber = row * seatsPerRow + col + 1;
        
        if (seatNumber > totalSeats) {
          rowSeats.push(<div key={col} className="w-12 h-12" />);
          continue;
        }

        const isAisle = col === aisleAfter;
        
        rowSeats.push(
          <React.Fragment key={col}>
            {isAisle && <div className="w-8" />} {/* Aisle space */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleSeat(seatNumber)}
              disabled={getSeatStatus(seatNumber) !== "available" && !selectedSeats.includes(seatNumber)}
              className={`w-12 h-12 rounded-lg border-2 flex flex-col items-center justify-center font-semibold transition-all ${getSeatColor(seatNumber)}`}
              title={`Seat ${seatNumber} - ${getSeatStatus(seatNumber)}`}
            >
              <div className="flex items-center">
                {getSeatIcon(seatNumber)}
                <span className="text-xs ml-1">{seatNumber}</span>
              </div>
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Select Your Seats
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Bus {busNumber} • {selectedSeats.length} of {maxSelectable} seats selected
          </p>
        </div>

        {/* Bus Layout */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          {/* Driver Section */}
          <div className="text-center mb-4">
            <div className="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded-t-lg mx-auto mb-2"></div>
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
              <Shield className="w-4 h-4 mr-1" /> Driver
            </div>
          </div>
          
          {/* Seats */}
          <div className="space-y-3">
            {renderBusLayout()}
          </div>

          {/* Aisle */}
          <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-lg mt-4"></div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center mb-6 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
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

        {/* Selection Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Selected Seats
              </h3>
              <p className="text-blue-700 dark:text-blue-300">
                {selectedSeats.length > 0 
                  ? selectedSeats.sort((a, b) => a - b).join(", ")
                  : "No seats selected"
                }
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                ${totalPrice.toFixed(2)}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {selectedSeats.length} × ${basePrice.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || selectedSeats.length === 0}
            loading={loading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            Confirm {selectedSeats.length} Seat(s)
          </Button>
        </div>

        {/* Timer Warning */}
        {selectedSeats.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
              <Clock className="w-4 h-4 mr-1" />
              Your seat selection will be held for 5 minutes
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SeatSelection;