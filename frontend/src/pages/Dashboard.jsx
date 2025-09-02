// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../context/UserContext";
import { 
  getDashboardStats, 
  getBookingAnalytics,
  getRevenueTrends,
  getRouteAnalytics 
} from "../services/analyticsService";
import { 
  getMyBookings,
  getUserBookings 
} from "../services/bookingService";
import { getRefundStats } from "../services/refundService";
import { toast } from "react-hot-toast";
import DashboardStats from "../components/dashboard/DashboardStats";
import AnalyticsCard from "../components/dashboard/AnalyticsCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Bus,
  RefreshCw,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { isAuthenticated, user: authUser } = useAuth();
  const { user: userDetails, getWalletBalance, refreshUserData } = useUser();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadDashboardStats(),
        loadRecentBookings(),
        loadAnalyticsData()
      ]);
    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const [statsData, refundStats, walletBalance] = await Promise.all([
        getDashboardStats(),
        getRefundStats(),
        getWalletBalance()
      ]);
      
      setStats({
        ...statsData,
        refundStats,
        walletBalance: walletBalance.currentBalance || 0
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const loadRecentBookings = async () => {
    try {
      const bookingsData = await getMyBookings({ 
        limit: 5, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      setBookings(bookingsData.data || []);
    } catch (error) {
      console.error("Failed to load bookings:", error);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      const [bookingAnalytics, revenueTrends, routeAnalytics] = await Promise.all([
        getBookingAnalytics({ period: 'month' }),
        getRevenueTrends({ period: 'month' }),
        getRouteAnalytics({ limit: 5 })
      ]);

      setAnalytics({
        booking: bookingAnalytics,
        revenue: revenueTrends,
        routes: routeAnalytics
      });
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    toast.success("Dashboard refreshed");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading your dashboard..." />
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
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {userDetails?.name || authUser?.user?.name}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Here's your travel dashboard overview
            </p>
          </div>
          
          <Button
            onClick={handleRefresh}
            loading={refreshing}
            variant="outline"
            className="mt-4 sm:mt-0"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardStats
                title="Total Bookings"
                value={stats?.totalBookings || 0}
                icon={<Calendar className="w-6 h-6" />}
                trend={stats?.bookingGrowth || 0}
                color="blue"
              />
              <DashboardStats
                title="Wallet Balance"
                value={`$${(stats?.walletBalance || 0).toFixed(2)}`}
                icon={<Wallet className="w-6 h-6" />}
                trend={stats?.revenueGrowth || 0}
                color="green"
              />
              <DashboardStats
                title="Active Trips"
                value={stats?.activeTrips || 0}
                icon={<Bus className="w-6 h-6" />}
                trend={stats?.occupancyRate || 0}
                color="purple"
              />
              <DashboardStats
                title="Total Refunds"
                value={stats?.refundStats?.totalRefunds || 0}
                icon={<DollarSign className="w-6 h-6" />}
                trend={stats?.refundStats?.approvalRate || 0}
                color="orange"
              />
            </div>

            {/* Quick Actions */}
            <QuickActions />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnalyticsCard
                title="Booking Trends"
                data={analytics.booking?.weeklyTrend || []}
                dataKey="count"
                labelKey="week"
                color="#3b82f6"
                type="line"
                icon={<TrendingUp className="w-5 h-5" />}
              />
              <AnalyticsCard
                title="Revenue Analysis"
                data={analytics.revenue?.monthlyRevenue || []}
                dataKey="amount"
                labelKey="month"
                color="#10b981"
                type="bar"
                icon={<DollarSign className="w-5 h-5" />}
              />
            </div>

            {/* Recent Bookings & Popular Routes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentBookings bookings={bookings} />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Popular Routes
                  </CardTitle>
                  <CardDescription>
                    Most traveled routes this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.routes?.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.routes.slice(0, 5).map((route, index) => (
                        <div key={index} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                          <div>
                            <p className="font-medium">{route.from} → {route.to}</p>
                            <p className="text-sm text-gray-500">{route.bookings} bookings</p>
                          </div>
                          <span className="text-green-600 font-semibold">
                            ${route.revenue}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No route data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Booking Management</CardTitle>
                <CardDescription>
                  View and manage your bus bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentBookings 
                  bookings={bookings} 
                  showViewAll={true}
                  showActions={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Analytics</CardTitle>
                  <CardDescription>
                    Comprehensive view of your travel patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AnalyticsCard
                      title="Monthly Bookings"
                      data={analytics.booking?.monthlyTrend || []}
                      dataKey="count"
                      labelKey="month"
                      color="#3b82f6"
                      type="area"
                    />
                    <AnalyticsCard
                      title="Revenue Trends"
                      data={analytics.revenue?.weeklyRevenue || []}
                      dataKey="amount"
                      labelKey="week"
                      color="#10b981"
                      type="bar"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Management</CardTitle>
                <CardDescription>
                  Manage your travel funds and transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Wallet Balance: ${(stats?.walletBalance || 0).toFixed(2)}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Add funds to your wallet for seamless bookings
                  </p>
                  <Button>Add Funds</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;