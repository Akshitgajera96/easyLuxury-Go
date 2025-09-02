// src/components/routes/RouteInfoCard.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Clock, 
  Route as RouteIcon, 
  Bus, 
  ChevronDown,
  ChevronUp,
  Users,
  DollarSign,
  Star,
  Calendar,
  Navigation,
  Phone,
  Wifi,
  Snowflake,
  Tv
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import { createBooking } from "../../services/bookingService";
import { toast } from "react-hot-toast";

const RouteInfoCard = ({ 
  route, 
  onBookNow, 
  onSelect, 
  showActions = true,
  variant = "default", // 'default', 'compact', 'featured'
  searchData,
  className = ""
}) => {
  const { isAuthenticated } = useAuth();
  const { user } = useUser();
  const [expanded, setExpanded] = useState(false);
  const [booking, setBooking] = useState(false);

  if (!route) return null;

  const {
    _id,
    busName,
    busNumber,
    operator,
    route: routeInfo,
    schedule,
    pricing,
    amenities = [],
    availableSeats,
    totalSeats,
    occupancyRate,
    rating,
    reviewsCount,
    ...rest
  } = route;

  const pickup = routeInfo?.from || route.pickup;
  const destination = routeInfo?.to || route.destination;
  const stops = routeInfo?.stops || route.stops || [];
  const distance = routeInfo?.distance || route.distance;
  const duration = routeInfo?.duration || route.duration;

  const handleBookNow = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to book this route");
      return;
    }

    setBooking(true);
    try {
      if (onBookNow) {
        await onBookNow(route);
      } else {
        // Default booking behavior
        const bookingData = {
          busId: _id,
          routeId: _id,
          passengers: searchData?.passengers || 1,
          travelDate: searchData?.date || new Date().toISOString().split('T')[0],
          totalAmount: pricing?.amount * (searchData?.passengers || 1)
        };

        const result = await createBooking(bookingData);
        if (result.success) {
          toast.success("Booking created successfully!");
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to create booking");
    } finally {
      setBooking(false);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(route);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs > 0 ? `${hrs}h ` : ""}${mins}m`;
  };

  const getAmenityIcon = (amenity) => {
    const amenityIcons = {
      wifi: <Wifi className="w-4 h-4" />,
      ac: <Snowflake className="w-4 h-4" />,
      entertainment: <Tv className="w-4 h-4" />,
      charging: <Phone className="w-4 h-4" />,
      legroom: <Users className="w-4 h-4" />
    };
    return amenityIcons[amenity] || <Star className="w-4 h-4" />;
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'p-4';
      case 'featured':
        return 'border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800';
      default:
        return 'p-6';
    }
  };

  const isFeatured = variant === 'featured';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleSelect}
      className={`cursor-pointer ${className}`}
    >
      <Card className={`overflow-hidden transition-all hover:shadow-lg ${getVariantClasses()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                {busName} ({busNumber})
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                {operator}
              </CardDescription>
            </div>
            
            {isFeatured && (
              <Badge variant="default" className="bg-blue-600">
                Featured
              </Badge>
            )}
          </div>

          {/* Rating */}
          {rating && (
            <div className="flex items-center mt-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(rating) 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                {rating} ({reviewsCount} reviews)
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent className="pb-3">
          {/* Route Information */}
          <div className="space-y-3">
            {/* Pickup and Destination */}
            <div className="flex items-start space-x-3">
              <div className="flex flex-col items-center pt-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="w-0.5 h-16 bg-gray-300 my-1"></div>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              
              <div className="flex-1 space-y-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {pickup?.name || pickup}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {schedule?.departure ? formatDate(schedule.departure, 'time') : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {destination?.name || destination}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {schedule?.arrival ? formatDate(schedule.arrival, 'time') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4 mr-1" />
                  Duration
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatDuration(duration)}
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                  <RouteIcon className="w-4 h-4 mr-1" />
                  Distance
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {distance ? `${(distance / 1000).toFixed(1)} km` : 'N/A'}
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4 mr-1" />
                  Seats
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {availableSeats}/{totalSeats}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(pricing?.amount || 0)}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                per seat
              </p>
            </div>

            {/* Amenities Preview */}
            {amenities.length > 0 && (
              <div className="flex justify-center space-x-2">
                {amenities.slice(0, 3).map((amenity, index) => (
                  <div
                    key={index}
                    className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
                    title={amenity}
                  >
                    {getAmenityIcon(amenity)}
                  </div>
                ))}
                {amenities.length > 3 && (
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
                    +{amenities.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>

        {/* Expandable Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-3 border-t border-gray-200 dark:border-gray-700">
                {/* Detailed Amenities */}
                {amenities.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-sm mb-2">Amenities</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          {getAmenityIcon(amenity)}
                          <span className="capitalize">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stops */}
                {stops.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-sm mb-2">Stops</h4>
                    <div className="space-y-1">
                      {stops.map((stop, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>{stop.name || `Stop ${index + 1}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bus Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Bus Type:</span>
                    <span className="font-medium ml-2">Luxury Coach</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Occupancy:</span>
                    <span className="font-medium ml-2">{occupancyRate}% full</span>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer with Actions */}
        {showActions && (
          <CardFooter className="flex flex-col space-y-3 pt-4">
            <div className="flex space-x-3 w-full">
              <Button
                onClick={handleBookNow}
                loading={booking}
                disabled={availableSeats === 0}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {availableSeats === 0 ? 'Sold Out' : 'Book Now'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setExpanded(!expanded)}
                className="px-3"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>

            {availableSeats > 0 && availableSeats < 10 && (
              <div className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                ⚠️ Only {availableSeats} seat{availableSeats !== 1 ? 's' : ''} left!
              </div>
            )}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
};

export default RouteInfoCard;