/**
 * Payment Method Selector Component
 * Allows users to choose payment method when adding money to wallet
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PaymentMethodSelector = ({ amount, onSuccess, onCancel }) => {
  const [selectedMethod, setSelectedMethod] = useState('')
  const [paymentDetails, setPaymentDetails] = useState({})
  const [step, setStep] = useState(1) // 1: Select Method, 2: Enter Details, 3: Processing
  const [processing, setProcessing] = useState(false)

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      icon: '💳',
      description: 'Google Pay, PhonePe, Paytm',
      popular: true
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: '💳',
      description: 'Visa, Mastercard, RuPay',
      popular: true
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: '🏦',
      description: 'All major banks',
      popular: false
    },
    {
      id: 'wallet',
      name: 'Other Wallets',
      icon: '💰',
      description: 'Paytm, PhonePe, Amazon Pay',
      popular: false
    }
  ]

  const handleMethodSelect = (methodId) => {
    setSelectedMethod(methodId)
    setStep(2)
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    setProcessing(true)
    setStep(3)

    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false)
      onSuccess({
        method: selectedMethod,
        amount: amount,
        transactionId: `TXN${Date.now()}`,
        timestamp: new Date().toISOString()
      })
    }, 2000)
  }

  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case 'upi':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter UPI Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UPI ID
              </label>
              <input
                type="text"
                placeholder="yourname@upi"
                value={paymentDetails.upiId || ''}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Enter your UPI ID (e.g., yourname@paytm, yourname@gpay)
              </p>
            </div>
            
            <div className="bg-accent/10 border border-accent rounded-lg p-4">
              <h4 className="font-semibold text-black40 mb-2">Popular UPI Apps:</h4>
              <div className="grid grid-cols-3 gap-2">
                {['Google Pay', 'PhonePe', 'Paytm'].map(app => (
                  <div key={app} className="bg-white p-2 rounded text-center text-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    {app}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'card':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter Card Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Number
              </label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                value={paymentDetails.cardNumber || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
                  setPaymentDetails({ ...paymentDetails, cardNumber: value })
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  maxLength="5"
                  value={paymentDetails.expiry || ''}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '')
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + '/' + value.slice(2, 4)
                    }
                    setPaymentDetails({ ...paymentDetails, expiry: value })
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVV
                </label>
                <input
                  type="password"
                  placeholder="123"
                  maxLength="3"
                  value={paymentDetails.cvv || ''}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                placeholder="Name on card"
                value={paymentDetails.cardName || ''}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, cardName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input type="checkbox" id="saveCard" className="rounded" />
              <label htmlFor="saveCard" className="text-sm text-gray-600">
                Save card for future payments
              </label>
            </div>
          </div>
        )

      case 'netbanking':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Your Bank</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Bank
              </label>
              <select
                value={paymentDetails.bank || ''}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, bank: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                required
              >
                <option value="">Select Bank</option>
                <option value="sbi">State Bank of India</option>
                <option value="hdfc">HDFC Bank</option>
                <option value="icici">ICICI Bank</option>
                <option value="axis">Axis Bank</option>
                <option value="pnb">Punjab National Bank</option>
                <option value="bob">Bank of Baroda</option>
                <option value="kotak">Kotak Mahindra Bank</option>
                <option value="other">Other Banks</option>
              </select>
            </div>

            <div className="bg-accent/10 border border-accent rounded-lg p-4">
              <p className="text-sm text-black40">
                <strong>Note:</strong> You will be redirected to your bank's secure login page to complete the payment.
              </p>
            </div>
          </div>
        )

      case 'wallet':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Wallet</h3>
            <div className="grid grid-cols-2 gap-3">
              {['Paytm', 'PhonePe', 'Amazon Pay', 'Mobikwik', 'Freecharge', 'Airtel Money'].map(wallet => (
                <button
                  key={wallet}
                  type="button"
                  onClick={() => setPaymentDetails({ ...paymentDetails, walletName: wallet })}
                  className={`p-4 border-2 rounded-lg font-semibold transition-colors ${
                    paymentDetails.walletName === wallet
                      ? 'border-accent bg-accent text-gray-900'
                      : 'border-gray-300 hover:border-accent'
                  }`}
                >
                  {wallet}
                </button>
              ))}
            </div>

            <div className="bg-accent/10 border border-accent rounded-lg p-4 mt-4">
              <p className="text-sm text-black40">
                You will be redirected to {paymentDetails.walletName || 'your wallet'} to complete the payment.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add Money to Wallet</h2>
              <p className="text-gray-600 mt-1">Amount: <span className="font-bold text-accent">₹{amount}</span></p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Payment Method */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Payment Method</h3>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => handleMethodSelect(method.id)}
                      className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-accent hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300/10 transition-all group"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-3xl">{method.icon}</span>
                        <div className="text-left">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-gray-900">{method.name}</h4>
                            {method.popular && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{method.description}</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">🔒 Secure Payment</h4>
                  <p className="text-sm text-gray-600">
                    Your payment information is encrypted and secure. We never store your card details.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 2: Enter Payment Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => {
                    setStep(1)
                    setSelectedMethod('')
                    setPaymentDetails({})
                  }}
                  className="mb-4 flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back to payment methods</span>
                </button>

                <form onSubmit={handlePaymentSubmit}>
                  {renderPaymentForm()}

                  <div className="mt-6 flex space-x-3">
                    <button
                      type="button"
                      onClick={onCancel}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-accent text-gray-900 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 transition-colors"
                    >
                      Pay ₹{amount}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 3: Processing Payment */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-accent border-t-transparent mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment...</h3>
                <p className="text-gray-600">Please wait while we verify your payment</p>
                <div className="mt-6 bg-accent/10 border border-accent rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-black40">
                    <strong>Do not close this window</strong> or refresh the page
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

export default PaymentMethodSelector
