// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../context/UserContext";
import {
  searchRoutes,
  getPopularRoutes,
  getFeaturedRoutes,
} from "../services/routeService";
import { toast } from "react-hot-toast";
import MapDisplay from "../components/routes/MapDisplay";
import RouteInfoCard from "../components/routes/RouteInfoCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MapPin,
  Navigation,
  Clock,
  Users,
  ArrowRight,
  Star,
  TrendingUp,
  Calendar,
  Search,
  Route,
} from "lucide-react";

const Home = () => {
  const { isAuthenticated } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const [searchData, setSearchData] = useState({
    from: "",
    to: "",
    date: new Date().toISOString().split("T")[0],
    passengers: 1,
  });
  const [suggestions, setSuggestions] = useState([]);
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [featuredRoutes, setFeaturedRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [popular, featured] = await Promise.all([
        getPopularRoutes({ limit: 6, city: 'Dhamdod' }),
        getFeaturedRoutes({ city: 'Dhamdod' }),
      ]);
      setPopularRoutes(popular?.data || []);      // ✅ optional chaining
      setFeaturedRoutes(featured?.data || []);    // ✅ optional chaining
    } catch (error) {
      toast.error("Failed to load route data");
      console.error(
        "Initial data error:",
        error.response?.status,
        error.response?.statusText,
        error.response?.data || error.message,
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const searchRoutesDebounced = async () => {
      if (searchData.from && searchData.to) {
        setSearchLoading(true);
        try {
          const results = await searchRoutes(searchData);
          setSuggestions(results || []);   // ✅ fallback to empty array
          setShowSuggestions(true);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timeoutId = setTimeout(searchRoutesDebounced, 800);
    return () => clearTimeout(timeoutId);
  }, [searchData.from, searchData.to, searchData.date, searchData.passengers]);

  const handleSearchChange = (field, value) => {
    setSearchData((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuickSelect = (from, to) => {
    setSearchData((prev) => ({ ...prev, from, to }));
  };

  const handleRouteSelect = (route) => {
    navigate("/booking", {
      state: {
        route,
        searchData,
      },
    });
  };

  const handleViewAllRoutes = () => {
    navigate("/routes", { state: { searchData } });
  };

  const quickRoutes = [
    { from: "New York", to: "Boston", emoji: "🗽" },
    { from: "Los Angeles", to: "San Francisco", emoji: "🌴" },
    { from: "Chicago", to: "Detroit", emoji: "🏙️" },
    { from: "Miami", to: "Orlando", emoji: "🌊" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading travel options..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-16 py-12"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Route className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Travel in{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Luxury
            </span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Experience premium comfort with easyLuxury Go. Your journey deserves
            the best - spacious seats, onboard amenities, and exceptional
            service.
          </p>

          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                onClick={() => navigate("/register")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Search Section */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <CardHeader className="text-center p-0 mb-8">
            <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Where would you like to go?
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
              Find the perfect luxury bus for your journey
            </CardDescription>
          </CardHeader>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="from" className="flex items-center text-sm font-medium">
                <MapPin className="w-4 h-4 mr-2" />
                From
              </Label>
              <Input
                id="from"
                placeholder="Departure city"
                value={searchData.from}
                onChange={(e) => handleSearchChange("from", e.target.value)}
                className="text-lg py-6"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to" className="flex items-center text-sm font-medium">
                <Navigation className="w-4 h-4 mr-2" />
                To
              </Label>
              <Input
                id="to"
                placeholder="Destination city"
                value={searchData.to}
                onChange={(e) => handleSearchChange("to", e.target.value)}
                className="text-lg py-6"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center text-sm font-medium">
                <Calendar className="w-4 h-4 mr-2" />
                Travel Date
              </Label>
              <Input
                id="date"
                type="date"
                value={searchData.date}
                onChange={(e) => handleSearchChange("date", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="py-6"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passengers" className="flex items-center text-sm font-medium">
                <Users className="w-4 h-4 mr-2" />
                Passengers
              </Label>
              <Input
                id="passengers"
                type="number"
                min="1"
                max="10"
                value={searchData.passengers}
                onChange={(e) =>
                  handleSearchChange("passengers", parseInt(e.target.value))
                }
                className="py-6"
              />
            </div>
          </div>

          <Button
            onClick={() => setShowSuggestions(true)}
            disabled={searchLoading}
            className="w-full py-6 text-lg"
            size="lg"
          >
            {searchLoading ? (
              "Searching..."
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Search Routes
              </>
            )}
          </Button>

          {/* Quick Routes */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Popular routes:
            </h3>
            <div className="flex flex-wrap gap-2">
              {quickRoutes.map((route, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(route.from, route.to)}
                  className="text-xs"
                >
                  <span className="mr-1">{route.emoji}</span>
                  {route.from} → {route.to}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Search Results */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              className="mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Available Routes
                </h2>
                <Button variant="outline" onClick={handleViewAllRoutes}>
                  View All
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {suggestions.slice(0, 6).map((route, index) => (
                  <RouteInfoCard
                    key={route._id || index}
                    route={route}
                    searchData={searchData}
                    onSelect={handleRouteSelect}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Featured Routes */}
        {featuredRoutes.length > 0 && (
          <motion.div
            className="mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center mb-6">
              <Star className="w-6 h-6 text-yellow-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Featured Routes
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredRoutes.map((route, index) => (
                <RouteInfoCard
                  key={route._id || index}
                  route={route}
                  featured={true}
                  onSelect={handleRouteSelect}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Popular Routes */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center mb-6">
            <TrendingUp className="w-6 h-6 text-blue-500 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Popular Routes
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {popularRoutes.map((route, index) => (
              <RouteInfoCard
                key={route._id || index}
                route={route}
                onSelect={handleRouteSelect}
              />
            ))}
          </div>
        </motion.div>

        {/* Map Display */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <MapDisplay
            pickup={searchData.from}
            destination={searchData.to}
            routes={suggestions.slice(0, 3)}
          />
        </motion.div>

        {/* Stats Section */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl font-bold text-blue-600">50K+</div>
              <div className="text-gray-600 dark:text-gray-300">
                Happy Travelers
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">100+</div>
              <div className="text-gray-600 dark:text-gray-300">
                Luxury Buses
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">25+</div>
              <div className="text-gray-600 dark:text-gray-300">
                Cities Covered
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">99%</div>
              <div className="text-gray-600 dark:text-gray-300">
                On-time Rate
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
