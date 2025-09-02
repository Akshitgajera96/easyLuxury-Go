// src/components/dashboard/AnalyticsCard.jsx
import React from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  TrendingDown,
  HelpCircle,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";

const AnalyticsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType = "percent", // 'percent' or 'value'
  isPositive = true, 
  bg = "bg-white dark:bg-gray-800", 
  text = "text-gray-800 dark:text-white",
  secondaryValue,
  secondaryLabel,
  tooltip,
  onClick,
  loading = false,
  formatValue,
  size = "medium", // 'small', 'medium', 'large'
  trendData,
  comparePeriod = "last week"
}) => {
  const formatNumber = (num) => {
    if (formatValue) return formatValue(num);
    
    if (typeof num === 'number') {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toLocaleString();
    }
    return num;
  };

  const getChangeIcon = () => {
    if (change === undefined || change === null) return null;
    
    if (isPositive) {
      return changeType === 'percent' ? 
        <TrendingUp className="w-4 h-4 mr-1" /> : 
        <ArrowUpRight className="w-4 h-4 mr-1" />;
    } else {
      return changeType === 'percent' ? 
        <TrendingDown className="w-4 h-4 mr-1" /> : 
        <ArrowDownRight className="w-4 h-4 mr-1" />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'p-3';
      case 'large':
        return 'p-6';
      default:
        return 'p-4';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 'text-2xl';
      case 'large':
        return 'text-4xl';
      default:
        return 'text-3xl';
    }
  };

  if (loading) {
    return (
      <motion.div
        className={`rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${getSizeClasses()} ${bg} animate-pulse`}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </motion.div>
    );
  }

  return (
    <TooltipProvider>
      <motion.div
        className={`rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${getSizeClasses()} ${bg} transition-all duration-300 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer group`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium text-gray-600 dark:text-gray-400 ${size === 'small' ? 'text-xs' : ''}`}>
              {title}
            </span>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm max-w-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {Icon && (
              <div className={`p-2 rounded-lg ${
                isPositive ? 
                'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 
                'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                <Icon className={`${size === 'small' ? 'w-3 h-3' : 'w-4 h-4'}`} />
              </div>
            )}
            {onClick && (
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Main Value */}
        <div className={`font-bold ${getTextSize()} ${text} mb-2`}>
          {formatNumber(value)}
        </div>

        {/* Secondary Value */}
        {secondaryValue && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {secondaryLabel && (
              <span className="mr-1">{secondaryLabel}:</span>
            )}
            <span className="font-medium">{formatNumber(secondaryValue)}</span>
          </div>
        )}

        {/* Change Indicator */}
        {change !== undefined && change !== null && (
          <div className={`flex items-center text-sm font-medium ${
            isPositive ? 
            'text-green-600 dark:text-green-400' : 
            'text-red-600 dark:text-red-400'
          }`}>
            {getChangeIcon()}
            <span>
              {changeType === 'percent' ? `${Math.abs(change)}%` : formatNumber(Math.abs(change))}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              vs {comparePeriod}
            </span>
          </div>
        )}

        {/* Trend Visualization */}
        {trendData && trendData.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-end h-8 space-x-px">
              {trendData.map((value, index) => {
                const maxValue = Math.max(...trendData);
                const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                
                return (
                  <div
                    key={index}
                    className={`flex-1 rounded-t ${
                      isPositive ? 
                      'bg-green-200 dark:bg-green-700' : 
                      'bg-red-200 dark:bg-red-700'
                    }`}
                    style={{ height: `${Math.max(height, 8)}%` }}
                    title={`${value}`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </TooltipProvider>
  );
};

AnalyticsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType,
  change: PropTypes.number,
  changeType: PropTypes.oneOf(['percent', 'value']),
  isPositive: PropTypes.bool,
  bg: PropTypes.string,
  text: PropTypes.string,
  secondaryValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  secondaryLabel: PropTypes.string,
  tooltip: PropTypes.string,
  onClick: PropTypes.func,
  loading: PropTypes.bool,
  formatValue: PropTypes.func,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  trendData: PropTypes.arrayOf(PropTypes.number),
  comparePeriod: PropTypes.string
};

// Pre-styled variants for common use cases
export const RevenueCard = (props) => (
  <AnalyticsCard
    bg="bg-green-50 dark:bg-green-900/20"
    text="text-green-900 dark:text-green-100"
    isPositive={true}
    {...props}
  />
);

export const BookingCard = (props) => (
  <AnalyticsCard
    bg="bg-blue-50 dark:bg-blue-900/20"
    text="text-blue-900 dark:text-blue-100"
    {...props}
  />
);

export const UserCard = (props) => (
  <AnalyticsCard
    bg="bg-purple-50 dark:bg-purple-900/20"
    text="text-purple-900 dark:text-purple-100"
    {...props}
  />
);

export const RefundCard = (props) => (
  <AnalyticsCard
    bg="bg-orange-50 dark:bg-orange-900/20"
    text="text-orange-900 dark:text-orange-100"
    {...props}
  />
);

export default AnalyticsCard;