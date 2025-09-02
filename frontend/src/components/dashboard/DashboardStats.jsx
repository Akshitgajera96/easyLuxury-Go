// src/components/dashboard/DashboardStats.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  BusFront, 
  Wallet, 
  Undo2, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import { getDashboardStats, getBookingAnalytics, getRefundStats } from "../../services/analyticsService";
import { toast } from "react-hot-toast";
import AnalyticsCard from "./AnalyticsCard";
import LoadingSpinner from "../common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DashboardStats = ({ timeframe = "month", showRefresh = true }) => {
  const { isAuthenticated } = useAuth();
  const { user } = useUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);
      
      const [dashboardData, bookingAnalytics, refundStats] = await Promise.all([
        getDashboardStats(),
        getBookingAnalytics({ period: timeframe }),
        getRefundStats()
      ]);

      const processedStats = {
        // User Statistics
        totalUsers: dashboardData.totalUsers || 0,
        userGrowth: dashboardData.userGrowth || 0,
        activeUsers: dashboardData.activeUsers || 0,
        
        // Booking Statistics
        totalBookings: dashboardData.totalBookings || 0,
        bookingGrowth: dashboardData.bookingGrowth || 0,
        confirmedBookings: bookingAnalytics.confirmedBookings || 0,
        cancelledBookings: bookingAnalytics.cancelledBookings || 0,
        
        // Financial Statistics
        totalEarnings: dashboardData.totalEarnings || 0,
        earningGrowth: dashboardData.earningGrowth || 0,
        averageBookingValue: dashboardData.averageBookingValue || 0,
        
        // Refund Statistics
        totalRefunds: refundStats.totalRefunds || 0,
        refundRate: refundStats.refundRate || 0,
        refundChange: refundStats.refundChange || 0,
        pendingRefunds: refundStats.pendingRefunds || 0,
        
        // Additional Metrics
        occupancyRate: dashboardData.occupancyRate || 0,
        customerSatisfaction: dashboardData.customerSatisfaction || 0,
        monthlyRecurringRevenue: dashboardData.monthlyRecurringRevenue || 0
      };

      setStats(processedStats);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
      setError("Failed to load dashboard statistics. Please try again.");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [isAuthenticated, timeframe]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    toast.success("Dashboard refreshed");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={fetchStats} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Refresh Button */}
      {showRefresh && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Overview</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Statistics for {timeframe === 'month' ? 'this month' : 'this week'}
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            loading={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {/* Total Users */}
        <AnalyticsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          secondaryValue={`${stats.activeUsers.toLocaleString()} active`}
          change={stats.userGrowth}
          isPositive={stats.userGrowth >= 0}
          icon={Users}
          tooltip="Total registered users with active users count"
          size="medium"
        />

        {/* Total Bookings */}
        <AnalyticsCard
          title="Total Bookings"
          value={stats.totalBookings.toLocaleString()}
          secondaryValue={`${stats.confirmedBookings} confirmed`}
          change={stats.bookingGrowth}
          isPositive={stats.bookingGrowth >= 0}
          icon={BusFront}
          tooltip="Total bookings with confirmed bookings count"
          size="medium"
        />

        {/* Total Earnings */}
        <AnalyticsCard
          title="Total Revenue"
          value={formatCurrency(stats.totalEarnings)}
          secondaryValue={`Avg: ${formatCurrency(stats.averageBookingValue)}`}
          change={stats.earningGrowth}
          isPositive={stats.earningGrowth >= 0}
          icon={Wallet}
          tooltip="Total revenue with average booking value"
          size="medium"
        />

        {/* Refund Metrics */}
        <AnalyticsCard
          title="Refund Rate"
          value={`${stats.refundRate}%`}
          secondaryValue={`${stats.pendingRefunds} pending`}
          change={stats.refundChange}
          isPositive={stats.refundChange <= 0} // Lower refund rate is better
          icon={Undo2}
          tooltip="Refund rate with pending refund requests"
          size="medium"
          bg={stats.refundRate > 10 ? "bg-orange-50 dark:bg-orange-900/20" : "bg-white dark:bg-gray-800"}
          text={stats.refundRate > 10 ? "text-orange-900 dark:text-orange-100" : "text-gray-800 dark:text-white"}
        />
      </motion.div>

      {/* Additional Metrics Row */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Occupancy Rate */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Occupancy Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.occupancyRate}%
                </p>
              </div>
              <div className={`p-2 rounded-lg ${
                stats.occupancyRate >= 75 ? 
                'bg-green-100 text-green-600 dark:bg-green-900/20' :
                'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20'
              }`}>
                {stats.occupancyRate >= 75 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Satisfaction */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Satisfaction Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.customerSatisfaction}/5
                </p>
              </div>
              <div className={`p-2 rounded-lg ${
                stats.customerSatisfaction >= 4 ? 
                'bg-green-100 text-green-600 dark:bg-green-900/20' :
                'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20'
              }`}>
                ⭐
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Recurring Revenue */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">MRR</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.monthlyRecurringRevenue)}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${
                stats.monthlyRecurringRevenue > 0 ? 
                'bg-green-100 text-green-600 dark:bg-green-900/20' :
                'bg-gray-100 text-gray-600 dark:bg-gray-700'
              }`}>
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardStats;