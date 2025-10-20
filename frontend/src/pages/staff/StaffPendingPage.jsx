/**
 * Staff Pending Approval Page
 * Shown after staff registration while waiting for admin approval
 */

import React from 'react'
import { Link } from 'react-router-dom'

const StaffPendingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-800 animate-pulse">⏱</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Registration Pending Approval
          </h1>
          <p className="text-lg text-gray-600">
            Your registration is awaiting admin approval
          </p>
        </div>

        {/* Main Message */}
        <div className="bg-accent/10 border-2 border-accent rounded-xl p-6 mb-6">
          <div className="flex items-start space-x-4">
            <span className="inline-block w-6 h-6 bg-gradient-to-r from-accent to-accent-dark text-white rounded shadow-lg hover:shadow-xl-accent hover:scale-105 transition-all duration-300-full text-sm font-bold flex-shrink-0 mt-1 flex items-center justify-center">!</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens next?
              </h3>
              <p className="text-gray-800 text-sm leading-relaxed">
                An administrator has been notified of your registration request. 
                They will review your information and approve your account. 
                You will receive an email notification once your account is approved.
              </p>
            </div>
          </div>
        </div>

        {/* Status Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="inline-block w-5 h-5 bg-gradient-to-r from-accent to-accent-dark text-white rounded shadow-lg hover:shadow-xl-accent hover:scale-105 transition-all duration-300-full text-xs font-bold mr-2 flex items-center justify-center">✓</span>
            Registration Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-gradient-to-r from-success-light to-success shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-gray-900">Registration Complete</p>
                <p className="text-sm text-gray-600">Your information has been submitted successfully</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0 animate-pulse"></div>
              <div>
                <p className="font-medium text-gray-900">Awaiting Admin Approval</p>
                <p className="text-sm text-gray-600">An admin will review your registration shortly</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-gray-300 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-gray-400">Email Notification</p>
                <p className="text-sm text-gray-500">You'll receive an email once approved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Notification Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start space-x-3">
            <span className="inline-block w-6 h-6 bg-gray-200 text-gray-600 rounded-full text-sm font-bold flex-shrink-0 mt-1 flex items-center justify-center">@</span>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Check Your Email</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Once your account is approved, you will receive an email notification. 
                After approval, you can login using the credentials you provided during registration.
              </p>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Important Notes:</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-black40 mr-2">•</span>
              <span>You <strong>cannot login</strong> until your account is approved by an administrator.</span>
            </li>
            <li className="flex items-start">
              <span className="text-black40 mr-2">•</span>
              <span>The approval process typically takes a few hours during business hours.</span>
            </li>
            <li className="flex items-start">
              <span className="text-black40 mr-2">•</span>
              <span>If you have any questions, please contact the administrator.</span>
            </li>
            <li className="flex items-start">
              <span className="text-black40 mr-2">•</span>
              <span>Keep your login credentials safe for when your account is approved.</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            to="/staff/login"
            className="w-full bg-black40 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-colors flex items-center justify-center"
          >
            Try Login (If Already Approved)
          </Link>
          
          <Link
            to="/"
            className="w-full bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            Go to Home Page
          </Link>
        </div>

        {/* Contact Info */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Need help or have questions?
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Contact: <a href="mailto:admin@easyluxurygo.com" className="text-black40 hover:text-accent hover:underline">admin@easyluxurygo.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default StaffPendingPage
