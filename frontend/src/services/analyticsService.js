// src/services/analyticsService.js
import { apiCall, BOOKING_API, BUS_API, USER_API, REFUND_API } from './api';

// Mock data generators
const generateMockStats = () => ({
  totalBookings: Math.floor(Math.random() * 1000) + 500,
  totalRevenue: Math.floor(Math.random() * 100000) + 50000,
  activeUsers: Math.floor(Math.random() * 500) + 200,
  occupancyRate: Math.floor(Math.random() * 40) + 60,
  cancelledBookings: Math.floor(Math.random() * 50) + 20,
  completedTrips: Math.floor(Math.random() * 800) + 400,
});

const generateTimeSeriesData = (days = 30, metric = 'bookings') => {
  const data = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    let value;
    switch(metric) {
      case 'revenue':
        value = Math.floor(Math.random() * 5000) + 2000;
        break;
      case 'occupancy':
        value = Math.floor(Math.random() * 30) + 50;
        break;
      default: // bookings
        value = Math.floor(Math.random() * 50) + 30;
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      value
    });
  }
  
  return data;
};

const generateTopRoutes = (limit = 10) => {
  const routes = [
    'New York - Boston',
    'Los Angeles - San Francisco',
    'Chicago - Detroit',
    'Miami - Orlando',
    'Seattle - Portland',
    'Dallas - Houston',
    'Denver - Phoenix',
    'Atlanta - Nashville',
    'Las Vegas - Los Angeles',
    'Washington DC - New York'
  ];
  
  return routes.slice(0, limit).map(route => ({
    route,
    bookings: Math.floor(Math.random() * 200) + 100,
    revenue: Math.floor(Math.random() * 50000) + 25000,
    occupancy: Math.floor(Math.random() * 30) + 60
  }));
};

const generateBusPerformance = (busId = null) => {
  const buses = [
    { id: 'bus-001', name: 'Volvo Express', capacity: 50 },
    { id: 'bus-002', name: 'Mercedes Luxury', capacity: 45 },
    { id: 'bus-003', name: 'Scania Comfort', capacity: 55 },
    { id: 'bus-004', name: 'MAN Traveler', capacity: 48 }
  ];
  
  if (busId) {
    const bus = buses.find(b => b.id === busId) || buses[0];
    return {
      ...bus,
      totalTrips: Math.floor(Math.random() * 50) + 30,
      avgOccupancy: Math.floor(Math.random() * 35) + 55,
      totalRevenue: Math.floor(Math.random() * 100000) + 50000,
      maintenanceCost: Math.floor(Math.random() * 5000) + 2000
    };
  }
  
  return buses.map(bus => ({
    ...bus,
    totalTrips: Math.floor(Math.random() * 50) + 30,
    avgOccupancy: Math.floor(Math.random() * 35) + 55,
    totalRevenue: Math.floor(Math.random() * 100000) + 50000
  }));
};

// 📊 Get dashboard overview statistics
export const getDashboardStats = async () => {
  try {
    // Try to get real data if available, otherwise use mock
    try {
      // Try to get booking stats from existing API
      const bookingStats = await apiCall('get', `${BOOKING_API.GET_ALL_BOOKINGS}/stats`);
      return bookingStats;
    } catch (error) {
      // Fallback to mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(generateMockStats());
        }, 500);
      });
    }
  } catch (error) {
    throw error || { message: 'Failed to fetch dashboard statistics' };
  }
};

// 📈 Get route-wise booking analytics
export const getRouteAnalytics = async (params = {}) => {
  try {
    // Try to get from bus API with route data
    const routeData = await apiCall('get', BUS_API.GET_BY_ROUTE, null, { params });
    
    if (routeData && routeData.routes) {
      return {
        routes: routeData.routes.slice(0, params.limit || 10).map(route => ({
          route: `${route.from} - ${route.to}`,
          bookings: route.bookings || Math.floor(Math.random() * 200) + 100,
          revenue: route.revenue || Math.floor(Math.random() * 50000) + 25000,
          occupancy: route.occupancy || Math.floor(Math.random() * 30) + 60
        })),
        period: params.period || 'month'
      };
    }
    
    // Fallback to mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          routes: generateTopRoutes(params.limit || 10),
          period: params.period || 'month'
        });
      }, 600);
    });
  } catch (error) {
    throw error || { message: 'Failed to fetch route analytics' };
  }
};

// 🚌 Get bus occupancy trends
export const getBusOccupancyTrends = async (params = {}) => {
  try {
    // Try to get from bus API
    const occupancyData = await apiCall('get', `${BUS_API.ANALYTICS}/occupancy`, null, { params });
    
    if (occupancyData) {
      return occupancyData;
    }
    
    // Fallback to mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          trends: generateTimeSeriesData(30, 'occupancy'),
          averageOccupancy: Math.floor(Math.random() * 30) + 55,
          period: params.period || 'month'
        });
      }, 500);
    });
  } catch (error) {
    throw error || { message: 'Failed to fetch bus occupancy trends' };
  }
};

// 💰 Get revenue trends over time
export const getRevenueTrends = async (params = {}) => {
  try {
    // Try to get from booking API
    const revenueData = await apiCall('get', `${BOOKING_API.ANALYTICS}/revenue`, null, { params });
    
    if (revenueData) {
      return revenueData;
    }
    
    // Fallback to mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          trends: generateTimeSeriesData(30, 'revenue'),
          totalRevenue: Math.floor(Math.random() * 500000) + 250000,
          period: params.period || 'month'
        });
      }, 500);
    });
  } catch (error) {
    throw error || { message: 'Failed to fetch revenue trends' };
  }
};

// 📊 Get booking analytics (admin)
export const getBookingAnalytics = async (params = {}) => {
  try {
    // Use the existing booking analytics endpoint
    return await apiCall('get', BOOKING_API.ANALYTICS, null, { params });
  } catch (error) {
    // Fallback to mock data if the endpoint doesn't exist
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          bookings: generateTimeSeriesData(30, 'bookings'),
          totalBookings: Math.floor(Math.random() * 2000) + 1000,
          cancelled: Math.floor(Math.random() * 100) + 50,
          confirmed: Math.floor(Math.random() * 1900) + 950,
          period: params.period || 'month'
        });
      }, 600);
    });
  }
};

// 🚌 Get bus analytics (admin)
export const getBusAnalytics = async (params = {}) => {
  try {
    // Use the existing bus analytics endpoint
    return await apiCall('get', BUS_API.ANALYTICS, null, { params });
  } catch (error) {
    // Fallback to mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          buses: generateBusPerformance(),
          totalBuses: 4,
          averageOccupancy: Math.floor(Math.random() * 30) + 55,
          period: params.period || 'month'
        });
      }, 700);
    });
  }
};

// 👥 Get user statistics (admin)
export const getUserStats = async () => {
  try {
    // Use the existing user stats endpoint
    return await apiCall('get', USER_API.STATS);
  } catch (error) {
    // Fallback to mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalUsers: Math.floor(Math.random() * 1000) + 500,
          activeUsers: Math.floor(Math.random() * 800) + 300,
          newUsers: Math.floor(Math.random() * 50) + 20,
          returningUsers: Math.floor(Math.random() * 700) + 250
        });
      }, 500);
    });
  }
};

// 💸 Get refund statistics (admin)
export const getRefundStats = async () => {
  try {
    // Use the existing refund stats endpoint
    return await apiCall('get', REFUND_API.GET_STATS);
  } catch (error) {
    // Fallback to mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalRefunds: Math.floor(Math.random() * 50) + 20,
          refundAmount: Math.floor(Math.random() * 10000) + 5000,
          avgProcessingTime: Math.floor(Math.random() * 5) + 2,
          pendingRefunds: Math.floor(Math.random() * 10) + 5
        });
      }, 500);
    });
  }
};

// 📅 Get date range analytics
export const getDateRangeAnalytics = async (startDate, endDate, metrics = ['bookings', 'revenue', 'occupancy']) => {
  try {
    // Try to get from booking API
    const analyticsData = await apiCall('get', BOOKING_API.ANALYTICS, null, {
      params: { startDate, endDate, metrics: metrics.join(',') }
    });
    
    if (analyticsData) {
      return analyticsData;
    }
    
    // Fallback to mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = {};
        
        if (metrics.includes('bookings')) {
          result.bookings = generateTimeSeriesData(30, 'bookings');
        }
        
        if (metrics.includes('revenue')) {
          result.revenue = generateTimeSeriesData(30, 'revenue');
        }
        
        if (metrics.includes('occupancy')) {
          result.occupancy = generateTimeSeriesData(30, 'occupancy');
        }
        
        resolve(result);
      }, 800);
    });
  } catch (error) {
    throw error || { message: 'Failed to fetch date range analytics' };
  }
};

// 📍 Get top routes analytics
export const getTopRoutes = async (limit = 10, period = 'month') => {
  try {
    // Try to get from bus API
    const topRoutes = await apiCall('get', `${BUS_API.GET_BY_ROUTE}/top`, null, {
      params: { limit, period }
    });
    
    if (topRoutes) {
      return topRoutes;
    }
    
    // Fallback to mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          routes: generateTopRoutes(limit),
          period
        });
      }, 500);
    });
  } catch (error) {
    throw error || { message: 'Failed to fetch top routes analytics' };
  }
};

// 🚌 Get bus performance analytics
export const getBusPerformance = async (busId = null, period = 'month') => {
  try {
    if (busId) {
      // Try to get specific bus performance
      const busPerformance = await apiCall('get', `${BUS_API.GET_BY_ID(busId)}/performance`, null, {
        params: { period }
      });
      
      if (busPerformance) {
        return busPerformance;
      }
    } else {
      // Try to get all buses performance
      const busesPerformance = await apiCall('get', `${BUS_API.ANALYTICS}/performance`, null, {
        params: { period }
      });
      
      if (busesPerformance) {
        return busesPerformance;
      }
    }
    
    // Fallback to mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(generateBusPerformance(busId));
      }, 600);
    });
  } catch (error) {
    throw error || { message: 'Failed to fetch bus performance analytics' };
  }
};

// 📊 Get financial analytics
export const getFinancialAnalytics = async (period = 'month', breakdown = false) => {
  try {
    // Try to get from booking API
    const financialData = await apiCall('get', `${BOOKING_API.ANALYTICS}/financial`, null, {
      params: { period, breakdown }
    });
    
    if (financialData) {
      return financialData;
    }
    
    // Fallback to mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = {
          totalRevenue: Math.floor(Math.random() * 500000) + 250000,
          totalExpenses: Math.floor(Math.random() * 200000) + 100000,
          netProfit: Math.floor(Math.random() * 300000) + 150000,
          period
        };
        
        if (breakdown) {
          data.breakdown = {
            ticketSales: Math.floor(Math.random() * 450000) + 200000,
            ancillaryServices: Math.floor(Math.random() * 50000) + 25000,
            fuelCosts: Math.floor(Math.random() * 80000) + 40000,
            maintenance: Math.floor(Math.random() * 40000) + 20000,
            staff: Math.floor(Math.random() * 60000) + 30000,
            other: Math.floor(Math.random() * 20000) + 10000
          };
        }
        
        resolve(data);
      }, 700);
    });
  } catch (error) {
    throw error || { message: 'Failed to fetch financial analytics' };
  }
};

// 👤 Get user engagement analytics
export const getUserEngagementAnalytics = async (period = 'month') => {
  try {
    // Try to get from user API
    const engagementData = await apiCall('get', `${USER_API.STATS}/engagement`, null, {
      params: { period }
    });
    
    if (engagementData) {
      return engagementData;
    }
    
    // Fallback to mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          avgSessionDuration: Math.floor(Math.random() * 10) + 5,
          pagesPerSession: Math.floor(Math.random() * 5) + 3,
          bounceRate: Math.floor(Math.random() * 30) + 40,
          returningVisitors: Math.floor(Math.random() * 60) + 30,
          period
        });
      }, 500);
    });
  } catch (error) {
    throw error || { message: 'Failed to fetch user engagement analytics' };
  }
};

// 📈 Get growth metrics
export const getGrowthMetrics = async (period = 'year', compareToPrevious = true) => {
  try {
    // Try to get from booking API
    const growthData = await apiCall('get', `${BOOKING_API.ANALYTICS}/growth`, null, {
      params: { period, compareToPrevious }
    });
    
    if (growthData) {
      return growthData;
    }
    
    // Fallback to mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        const current = {
          bookings: Math.floor(Math.random() * 2000) + 1000,
          revenue: Math.floor(Math.random() * 500000) + 250000,
          users: Math.floor(Math.random() * 1000) + 500
        };
        
        const result = { current, period };
        
        if (compareToPrevious) {
          result.previous = {
            bookings: Math.floor(current.bookings * (0.8 + Math.random() * 0.4)),
            revenue: Math.floor(current.revenue * (0.8 + Math.random() * 0.4)),
            users: Math.floor(current.users * (0.8 + Math.random() * 0.4))
          };
          
          result.growth = {
            bookings: ((current.bookings - result.previous.bookings) / result.previous.bookings * 100).toFixed(1),
            revenue: ((current.revenue - result.previous.revenue) / result.previous.revenue * 100).toFixed(1),
            users: ((current.users - result.previous.users) / result.previous.users * 100).toFixed(1)
          };
        }
        
        resolve(result);
      }, 600);
    });
  } catch (error) {
    throw error || { message: 'Failed to fetch growth metrics' };
  }
};

// 📊 Export analytics data
export const exportAnalyticsData = async (type, format = 'csv', params = {}) => {
  try {
    // Try to export from booking API
    const exportData = await apiCall('get', `${BOOKING_API.EXPORT}/${type}`, null, {
      params: { ...params, format },
      responseType: format === 'csv' ? 'blob' : 'json'
    });
    
    if (exportData) {
      return exportData;
    }
    
    // Fallback to mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        if (format === 'csv') {
          // Return a mock CSV string
          resolve(new Blob(['date,value\n2023-01-01,100\n2023-01-02,150'], { type: 'text/csv' }));
        } else {
          // Return mock JSON data
          resolve(generateTimeSeriesData(7, type));
        }
      }, 800);
    });
  } catch (error) {
    throw error || { message: 'Failed to export analytics data' };
  }
};