// src/pages/BookingPage.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useUser } from "../context/UserContext";
import {  
  checkSeatAvailability, 
  createBooking 
} from "../services/bookingService";
import { toast } from "react-hot-toast";
import SeatSelection from "../components/booking/SeatSelection";
import BookingPopup from "../components/booking/BookingPopup";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Calendar, MapPin, Users, Clock, DollarSign } from "lucide-react";

const BookingPage = () => {
  const { isAuthenticated } = useAuth();
  const { user } = useUser();
  const { isConnected, emitEvent, onSeatUpdate, onBookingConfirmed } = useSocket();

  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState({
    from: "",
    to: "",
    date: new Date().toISOString().split('T')[0],
    passengers: 1
  });
  const [searchLoading, setSearchLoading] = useState(false);

  // Load initial buses or use sample data
  useEffect(() => {
    loadInitialBuses();
  }, []);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!isConnected) return;

    const handleSeatUpdate = (data) => {
      if (selectedBus && data.busId === selectedBus._id) {
        setBuses(prev => prev.map(bus => 
          bus._id === data.busId 
            ? { ...bus, bookedSeats: data.bookedSeats }
            : bus
        ));
        
        if (selectedBus._id === data.busId) {
          setSelectedBus(prev => ({ ...prev, bookedSeats: data.bookedSeats }));
        }
      }
    };

    const handleBookingConfirmation = (data) => {
      if (data.userId === user?._id) {
        toast.success("Booking confirmed successfully!");
        setShowBookingPopup(false);
        setSelectedSeats([]);
      }
    };

    const unsubscribeSeat = onSeatUpdate(handleSeatUpdate);
    const unsubscribeBooking = onBookingConfirmed(handleBookingConfirmation);

    return () => {
      unsubscribeSeat();
      unsubscribeBooking();
    };
  }, [isConnected, selectedBus, user]);

  const loadInitialBuses = async () => {
    try {
      setLoading(true);
      // You might want to load popular routes or recent searches
      const popularBuses = await getBusesForRoute({
        from: "New York",
        to: "Boston",
        date: searchFilters.date
      });
      setBuses(popularBuses);
      setFilteredBuses(popularBuses);
    } catch (error) {
      toast.error("Failed to load buses");
      console.error("Error loading buses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchFilters.from || !searchFilters.to) {
      toast.error("Please enter both departure and destination");
      return;
    }

    try {
      setSearchLoading(true);
      const results = await getBusesForRoute(searchFilters);
      setBuses(results);
      setFilteredBuses(results);
      
      if (results.length === 0) {
        toast.info("No buses found for your search criteria");
      }
    } catch (error) {
      toast.error("Failed to search buses");
      console.error("Search error:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSeatSelection = async (bus, seats) => {
    if (!isAuthenticated) {
      toast.error("Please login to book seats");
      return;
    }

    setSelectedBus(bus);
    setSelectedSeats(seats);
    setShowBookingPopup(true);

    // Lock selected seats
    if (isConnected) {
      emitEvent('seats:lock', {
        busId: bus._id,
        seatNumbers: seats,
        duration: 300 // 5 minutes
      });
    }
  };

  const confirmBooking = async () => {
    if (!selectedBus || selectedSeats.length === 0) return;

    try {
      const bookingData = {
        busId: selectedBus._id,
        seatNumbers: selectedSeats,
        date: searchFilters.date,
        passengers: searchFilters.passengers,
        totalAmount: selectedSeats.length * selectedBus.basePrice
      };

      const result = await createBooking(bookingData);
      
      if (result.success) {
        // Notify other users about the booking
        if (isConnected) {
          emitEvent('seats:booked', {
            busId: selectedBus._id,
            seatNumbers: selectedSeats,
            bookingId: result.booking._id
          });
        }

        toast.success("Booking confirmed! Check your email for details.");
        setShowBookingPopup(false);
        setSelectedSeats([]);
        
        // Refresh bus data to update seat availability
        handleSearch();
      }
    } catch (error) {
      toast.error(error.message || "Booking failed. Please try again.");
    }
  };

  const handleFilterChange = (key, value) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading available buses..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Book Your Journey
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find and book your perfect bus ride
          </p>
        </motion.div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Buses</CardTitle>
            <CardDescription>
              Find available buses for your journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="from">From</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="from"
                    placeholder="Departure city"
                    value={searchFilters.from}
                    onChange={(e) => handleFilterChange('from', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="to"
                    placeholder="Destination city"
                    value={searchFilters.to}
                    onChange={(e) => handleFilterChange('to', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Travel Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="date"
                    type="date"
                    value={searchFilters.date}
                    onChange={(e) => handleFilterChange('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passengers">Passengers</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="passengers"
                    type="number"
                    min="1"
                    max="10"
                    value={searchFilters.passengers}
                    onChange={(e) => handleFilterChange('passengers', parseInt(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSearch}
              loading={searchLoading}
              className="w-full md:w-auto"
            >
              <Search className="w-4 h-4 mr-2" />
              Search Buses
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Available Buses
          </h2>

          {filteredBuses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No buses found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search criteria or search for different routes.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredBuses.map((bus) => (
                <Card key={bus._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Bus Info */}
                      <div className="lg:col-span-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {bus.busName} ({bus.busNumber})
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          {bus.operator}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                          <Users className="w-4 h-4 mr-2" />
                          {bus.availableSeats} seats available
                        </div>
                      </div>

                      {/* Route Info */}
                      <div className="lg:col-span-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {bus.route.from}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {bus.route.to}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                          <Clock className="w-4 h-4 mr-2" />
                          {formatTime(bus.schedule.departure)} - {formatTime(bus.schedule.arrival)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Duration: {Math.floor(bus.route.duration / 60)}h {bus.route.duration % 60}m
                        </div>
                      </div>

                      {/* Price Info */}
                      <div className="lg:col-span-1">
                        <div className="flex items-center mb-2">
                          <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                          <span className="text-2xl font-bold text-green-600">
                            ${bus.basePrice}
                          </span>
                          <span className="text-gray-500 ml-1">/ seat</span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {bus.amenities?.join(' • ')}
                        </div>
                      </div>

                      {/* Action */}
                      <div className="lg:col-span-1 flex items-center justify-center">
                        <Button
                          onClick={() => setSelectedBus(bus)}
                          className="w-full"
                        >
                          View Seats
                        </Button>
                      </div>
                    </div>

                    {/* Seat Selection */}
                    {selectedBus?._id === bus._id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
                      >
                        <SeatSelection
                          busId={bus._id}
                          busNumber={bus.busNumber}
                          totalSeats={bus.totalSeats}
                          bookedSeats={bus.bookedSeats || []}
                          basePrice={bus.basePrice}
                          travelDate={searchFilters.date}
                          onConfirm={(seats) => handleSeatSelection(bus, seats)}
                          onCancel={() => setSelectedBus(null)}
                        />
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>

        {/* Booking Popup */}
        <AnimatePresence>
          {showBookingPopup && selectedBus && (
            <BookingPopup
              isOpen={showBookingPopup}
              onClose={() => {
                setShowBookingPopup(false);
                setSelectedSeats([]);
                // Release locked seats
                if (isConnected && selectedSeats.length > 0) {
                  emitEvent('seats:release', {
                    busId: selectedBus._id,
                    seatNumbers: selectedSeats
                  });
                }
              }}
              onConfirm={confirmBooking}
              busId={selectedBus._id}
              busNumber={selectedBus.busNumber}
              route={`${selectedBus.route.from} to ${selectedBus.route.to}`}
              travelDate={searchFilters.date}
              basePrice={selectedBus.basePrice}
              selectedSeats={selectedSeats}
              existingBookings={selectedBus.bookedSeats || []}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BookingPage;