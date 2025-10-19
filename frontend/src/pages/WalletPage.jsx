/**
 * Wallet page for users to manage their wallet balance and transactions
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '../context/UserContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import PaymentMethodSelector from '../components/wallet/PaymentMethodSelector'
import { toast } from 'react-hot-toast'

const WalletPage = () => {
  const { walletBalance, addWalletBalance, loading } = useUser()
  const [amount, setAmount] = useState('')
  const [topupLoading, setTopupLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState(0)
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'credit', amount: 1000, description: 'Wallet Top-up via UPI', date: new Date().toISOString(), status: 'completed', method: 'UPI' },
    { id: 2, type: 'debit', amount: 450, description: 'Bus Booking - Mumbai to Pune', date: new Date(Date.now() - 86400000).toISOString(), status: 'completed', method: 'Wallet' },
  ])

  const presetAmounts = [100, 500, 1000, 2000, 5000]

  const handleTopup = (selectedAmount) => {
    setSelectedAmount(selectedAmount)
    setShowPaymentModal(true)
  }

  const handleCustomTopup = (e) => {
    e.preventDefault()
    const customAmount = parseInt(amount)
    if (customAmount && customAmount > 0) {
      handleTopup(customAmount)
    }
  }

  const handlePaymentSuccess = async (paymentData) => {
    setTopupLoading(true)
    setShowPaymentModal(false)
    
    try {
      const result = await addWalletBalance(selectedAmount)
      if (result.success) {
        // Add transaction to history
        const newTransaction = {
          id: transactions.length + 1,
          type: 'credit',
          amount: selectedAmount,
          description: `Wallet Top-up via ${paymentData.method.toUpperCase()}`,
          date: paymentData.timestamp,
          status: 'completed',
          method: paymentData.method.toUpperCase(),
          transactionId: paymentData.transactionId
        }
        setTransactions(prev => [newTransaction, ...prev])
        
        setSuccess(`Successfully added ₹${selectedAmount} to your wallet!`)
        setAmount('')
        setSelectedAmount(0)
        
        toast.success(`₹${selectedAmount} added successfully!`, {
          duration: 3000
        })
      }
    } catch (error) {
      toast.error('Failed to add money. Please try again.', {
        duration: 3000
      })
    } finally {
      setTopupLoading(false)
    }
  }

  const handlePaymentCancel = () => {
    setShowPaymentModal(false)
    setSelectedAmount(0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black40 text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Wallet</h1>
              <p className="text-accent mt-2">Manage your travel funds and transactions</p>
            </div>
            <div className="text-right">
              <div className="bg-accent text-black40 px-6 py-4 rounded-lg">
                <p className="text-sm font-semibold">Current Balance</p>
                <p className="text-3xl font-bold">₹{walletBalance}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Add Money */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 mb-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Money to Wallet</h2>
              
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <p className="text-sm text-green-700 font-semibold">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Amount Buttons */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Top-up</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {presetAmounts.map((presetAmount) => (
                    <button
                      key={presetAmount}
                      onClick={() => handleTopup(presetAmount)}
                      disabled={topupLoading}
                      className="p-4 border-2 border-accent text-accent rounded-lg font-semibold hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 hover:text-gray-900 transition-colors disabled:opacity-50"
                    >
                      ₹{presetAmount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Amount</h3>
                <form onSubmit={handleCustomTopup} className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={topupLoading || !amount || parseInt(amount) <= 0}
                    className="bg-gradient-to-r from-accent to-accent-dark text-gray-900 px-6 py-3 rounded shadow-lg hover:shadow-xl-accent hover:scale-105 transition-all duration-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {topupLoading && <LoadingSpinner size="sm" variant="primary" />}
                    Add Money
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Recent Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Transactions</h2>
              
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{transaction.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                          {transaction.method && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {transaction.method}
                            </span>
                          )}
                        </div>
                        {transaction.transactionId && (
                          <p className="text-xs text-gray-400 mt-1">
                            TXN: {transaction.transactionId}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold text-lg ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          transaction.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-accent/20 text-black40'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No transactions yet</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Wallet Benefits */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 sticky top-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Benefits</h3>
              
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <h4 className="font-semibold text-gray-900">Instant Payments</h4>
                  <p className="text-sm text-gray-600">Book tickets instantly without payment delays</p>
                </div>

                <div className="border-l-4 border-black40 pl-4 py-2">
                  <h4 className="font-semibold text-gray-900">Cashback Offers</h4>
                  <p className="text-sm text-gray-600">Get exclusive cashback on wallet recharges</p>
                </div>

                <div className="border-l-4 border-sky-500 pl-4 py-2">
                  <h4 className="font-semibold text-gray-900">Secure Storage</h4>
                  <p className="text-sm text-gray-600">Your money is safe with bank-level security</p>
                </div>

                <div className="border-l-4 border-accent pl-4 py-2">
                  <h4 className="font-semibold text-gray-900">Quick Refunds</h4>
                  <p className="text-sm text-gray-600">Instant refunds for cancelled bookings</p>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Security Notice</h4>
                <p className="text-sm text-gray-600">
                  � Never share your wallet PIN with anyone<br/>
                  � Log out after each session<br/>
                  � Report suspicious activity immediately
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Payment Method Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <PaymentMethodSelector
            amount={selectedAmount}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default WalletPage