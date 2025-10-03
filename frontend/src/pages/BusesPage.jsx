// src/pages/BusesPage.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAllBuses } from "../services/routeService"; // or busService.js
import LoadingSpinner from "../components/common/LoadingSpinner";
import RouteInfoCard from "../components/routes/RouteInfoCard";
import { toast } from "react-hot-toast";

const BusesPage = () => {
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("name"); // name | price | rating

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const data = await getAllBuses();
        setBuses(data);
        setFilteredBuses(data);
      } catch (error) {
        console.error("Error fetching buses:", error);
        toast.error("Failed to load buses");
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
  }, []);

  // Apply filters whenever search/price/sort changes
  useEffect(() => {
    let filtered = [...buses];

    // Search filter
    if (search) {
      filtered = filtered.filter(
        (bus) =>
          bus.name.toLowerCase().includes(search.toLowerCase()) ||
          bus.source.toLowerCase().includes(search.toLowerCase()) ||
          bus.destination.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Price filter
    if (minPrice) {
      filtered = filtered.filter((bus) => bus.price >= Number(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter((bus) => bus.price <= Number(maxPrice));
    }

    // Sorting
    if (sort === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "price") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    setFilteredBuses(filtered);
  }, [search, minPrice, maxPrice, sort, buses]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading buses..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Title */}
      <motion.h1
        className="text-3xl font-bold mb-6 text-gray-900 dark:text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Available Luxury Buses
      </motion.h1>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Search</label>
          <input
            type="text"
            placeholder="Search by bus, city or route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-2 focus:ring focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Min Price</label>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Price</label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sort By</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-2"
          >
            <option value="name">Name (A–Z)</option>
            <option value="price">Price (Low → High)</option>
            <option value="rating">Rating (High → Low)</option>
          </select>
        </div>
      </div>

      {/* Bus Cards */}
      {filteredBuses.length > 0 ? (
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
        >
          {filteredBuses.map((bus) => (
            <motion.div
              key={bus._id}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <RouteInfoCard route={bus} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <p className="text-gray-600 dark:text-gray-400">
          No buses match your filters.
        </p>
      )}
    </div>
  );
};

export default BusesPage;
