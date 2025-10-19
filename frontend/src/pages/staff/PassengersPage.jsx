/**
 * Staff Passengers page - View and manage passengers for current trip
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'

const PassengersPage = () => {
  const [searchTerm, setSearchTerm] = useState('')

  const passengers = [
    { id: 1, name: 'Raj Sharma', seat: 'U1-1', phone: '9876543210', status: 'Boarded', ticket: 'TK001' },
    { id: 2, name: 'Priya Patel', seat: 'L1-2', phone: '9876543211', status: 'Boarded', ticket: 'TK002' },
    { id: 3, name: 'Amit Kumar', seat: 'U2-1', phone: '9876543212', status: 'Pending', ticket: 'TK003' },
    { id: 4, name: 'Sneha Reddy', seat: 'L2-2', phone: '9876543213', status: 'Boarded', ticket: 'TK004' },
    { id: 5, name: 'Vikram Singh', seat: 'U3-1', phone: '9876543214', status: 'Pending', ticket: 'TK005' },
    { id: 6, name: 'Anjali Mehta', seat: 'L3-2', phone: '9876543215', status: 'Boarded', ticket: 'TK006' },
  ]

  const filteredPassengers = passengers.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.seat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ticket.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const boardedCount = passengers.filter((p) => p.status === 'Boarded').length
  const pendingCount = passengers.filter((p) => p.status === 'Pending').length

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Passenger Management</h2>
        <p className="text-gray-600">View and manage passengers for your current trip</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Passengers</p>
              <p className="text-3xl font-bold text-gray-900">{passengers.length}</p>
            </div>
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">??</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Boarded</p>
              <p className="text-3xl font-bold text-green-600">{boardedCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">?</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-3xl font-bold text-black40">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">?</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <input
          type="text"
          placeholder="Search by name, seat, or ticket number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
        />
      </div>

      {/* Passenger List */}
      <div className="bg-white rounded-xl shadow overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Passenger
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPassengers.map((passenger, index) => (
                <motion.tr
                  key={passenger.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-black40 rounded-full flex items-center justify-center text-white font-semibold">
                        {passenger.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{passenger.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-accent text-gray-900 rounded-full text-sm font-semibold">
                      {passenger.seat}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{passenger.ticket}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{passenger.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        passenger.status === 'Boarded'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-accent text-gray-900'
                      }`}
                    >
                      {passenger.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {passenger.status === 'Pending' ? (
                      <button className="bg-gradient-to-r from-success to-success-dark shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                        Mark Boarded
                      </button>
                    ) : (
                      <button className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                        View Details
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPassengers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No passengers found</p>
        </div>
      )}
    </div>
  )
}

export default PassengersPage
