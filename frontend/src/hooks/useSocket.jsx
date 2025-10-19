/**
 * Custom hook for socket functionality
 * Provides easy access to socket context with event handlers
 */

import { useSocket as useSocketContext } from '../context/SocketContext'
import { useEffect, useCallback } from 'react'

export const useSocket = () => {
  const socketContext = useSocketContext()

  // Hook to listen to seat updates
  const useSeatUpdate = (callback) => {
    useEffect(() => {
      if (socketContext.socket) {
        socketContext.socket.on('seat_updated', callback)
        return () => {
          socketContext.socket.off('seat_updated', callback)
        }
      }
    }, [socketContext.socket, callback])
  }

  // Hook to listen to booking confirmations
  const useBookingConfirmed = (callback) => {
    useEffect(() => {
      if (socketContext.socket) {
        socketContext.socket.on('booking_confirmed', callback)
        return () => {
          socketContext.socket.off('booking_confirmed', callback)
        }
      }
    }, [socketContext.socket, callback])
  }

  // Hook to listen to trip status updates
  const useTripStatusUpdate = (callback) => {
    useEffect(() => {
      if (socketContext.socket) {
        socketContext.socket.on('trip_status_updated', callback)
        return () => {
          socketContext.socket.off('trip_status_updated', callback)
        }
      }
    }, [socketContext.socket, callback])
  }

  return {
    ...socketContext,
    useSeatUpdate,
    useBookingConfirmed,
    useTripStatusUpdate,
  }
}