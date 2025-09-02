// src/pages/WalletPage.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import { 
  getWalletBalance, 
  getWalletTransactions, 
  addFundsToWallet, 
  withdrawFromWallet,
  processPaymentWithWallet
} from "../services/walletService";
import { getRefundHistory, requestRefund } from "../services/refundService";
import { toast } from "react-hot-toast";
import WalletCard from "../components/wallet/WalletCard";
import RefundPopup from "../components/wallet/RefundPopup";


import LoadingSpinner from "../components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Minus, 
  Download, 
  Filter, 
  Search, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  Receipt,
  RefreshCw
} from "lucide-react";

const WalletPage = () => {
  const { user, refreshUserData, getWalletBalance: getUserWalletBalance } = useUser();
  const [activeTab, setActiveTab] = useState("transactions");
  const [transactions, setTransactions] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRefundPopup, setShowRefundPopup] = useState(false);
  const [showAddFundsPopup, setShowAddFundsPopup] = useState(false);
  const [showWithdrawPopup, setShowWithdrawPopup] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTransactions(),
        loadRefunds()
      ]);
    } catch (error) {
      toast.error("Failed to load wallet data");
      console.error("Wallet data error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const transactionsData = await getWalletTransactions({ 
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setTransactions(transactionsData.data || []);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    }
  };

  const loadRefunds = async () => {
    try {
      const refundsData = await getRefundHistory({
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setRefunds(refundsData.data || []);
    } catch (error) {
      console.error("Failed to load refunds:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    await refreshUserData();
    toast.success("Wallet data refreshed");
  };

  const handleAddFunds = async (amount, paymentMethod) => {
    try {
      const result = await addFundsToWallet(amount, paymentMethod);
      if (result.success) {
        toast.success(`$${amount} added to your wallet`);
        setShowAddFundsPopup(false);
        await loadWalletData();
        await refreshUserData();
      }
    } catch (error) {
      toast.error(error.message || "Failed to add funds");
    }
  };

  const handleWithdraw = async (amount, bankDetails) => {
    try {
      const result = await withdrawFromWallet(amount, bankDetails);
      if (result.success) {
        toast.success(`Withdrawal request submitted for $${amount}`);
        setShowWithdrawPopup(false);
        await loadWalletData();
        await refreshUserData();
      }
    } catch (error) {
      toast.error(error.message || "Failed to process withdrawal");
    }
  };

  const handleRequestRefund = async (refundData) => {
    try {
      const result = await requestRefund(refundData);
      if (result.success) {
        toast.success("Refund request submitted successfully");
        setShowRefundPopup(false);
        await loadRefunds();
      }
    } catch (error) {
      toast.error(error.message || "Failed to submit refund request");
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter !== "all" && transaction.type !== filter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.amount.toString().includes(searchTerm) ||
        transaction.type.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const filteredRefunds = refunds.filter(refund => {
    if (filter !== "all" && refund.status !== filter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        refund.reason?.toLowerCase().includes(searchLower) ||
        refund.amount.toString().includes(searchTerm) ||
        refund.status.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getTotalBalance = () => {
    return user?.wallet?.balance || 0;
  };

  const getStats = () => {
    const totalAdded = transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalSpent = transactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalRefunded = transactions
      .filter(t => t.type === 'refund')
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalAdded, totalSpent, totalRefunded };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading wallet data..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Wallet
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your funds and transaction history
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

        {/* Balance Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Current Balance</p>
                  <p className="text-3xl font-bold">${getTotalBalance().toFixed(2)}</p>
                </div>
                <Wallet className="w-8 h-8 opacity-90" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-600 mr-4" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Added</p>
                  <p className="text-xl font-bold text-green-600">+${stats.totalAdded.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingDown className="w-8 h-8 text-red-600 mr-4" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                  <p className="text-xl font-bold text-red-600">-${stats.totalSpent.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Receipt className="w-8 h-8 text-blue-600 mr-4" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Refunded</p>
                  <p className="text-xl font-bold text-blue-600">+${stats.totalRefunded.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-4 mb-8"
        >
          <Button
            onClick={() => setShowAddFundsPopup(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Funds
          </Button>
          
          <Button
            onClick={() => setShowWithdrawPopup(true)}
            variant="outline"
          >
            <Minus className="w-4 h-4 mr-2" />
            Withdraw
          </Button>
          
          <Button
            onClick={() => setShowRefundPopup(true)}
            variant="outline"
          >
            <Receipt className="w-4 h-4 mr-2" />
            Request Refund
          </Button>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="refunds">Refund History</TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  All your wallet transactions and payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Transactions</option>
                    <option value="deposit">Deposits</option>
                    <option value="payment">Payments</option>
                    <option value="refund">Refunds</option>
                    <option value="withdrawal">Withdrawals</option>
                  </select>
                </div>

                {/* Transactions List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No transactions found</p>
                    </div>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <WalletCard key={transaction._id} transaction={transaction} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Refunds Tab */}
          <TabsContent value="refunds" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Refund History</CardTitle>
                <CardDescription>
                  Your refund requests and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Refunds List */}
                <div className="space-y-3">
                  {filteredRefunds.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No refund requests found</p>
                    </div>
                  ) : (
                    filteredRefunds.map((refund) => (
                      <div key={refund._id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">${refund.amount}</p>
                            <p className="text-sm text-gray-600">{refund.reason}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(refund.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            refund.status === 'approved' ? 'bg-green-100 text-green-800' :
                            refund.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {refund.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Popups */}
        <AnimatePresence>
          {showRefundPopup && (
            <RefundPopup
              onClose={() => setShowRefundPopup(false)}
              onSubmit={handleRequestRefund}
            />
          )}
          
          {showAddFundsPopup && (
            <AddFundsPopup
              onClose={() => setShowAddFundsPopup(false)}
              onSubmit={handleAddFunds}
              currentBalance={getTotalBalance()}
            />
          )}
          
          {showWithdrawPopup && (
            <WithdrawPopup
              onClose={() => setShowWithdrawPopup(false)}
              onSubmit={handleWithdraw}
              currentBalance={getTotalBalance()}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WalletPage;