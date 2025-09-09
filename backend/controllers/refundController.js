// backend/controllers/refundController.js
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Booking = require('../models/Booking');
const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');
let Refund;
try { Refund = require('../models/Refund'); } catch (e) { Refund = null; }

/**
 * Helpers
 */
function parseDateTime(dateOrBooking, time) {
  // Accepts booking.departureTime (ISO or string) or (date, time)
  try {
    if (!dateOrBooking) return null;
    if (typeof dateOrBooking === 'string' && dateOrBooking.includes('T')) {
      const d = new Date(dateOrBooking);
      return isNaN(d) ? null : d;
    }
    // if booking object passed with departureTime
    if (typeof dateOrBooking === 'object' && dateOrBooking.departureTime) {
      const d = new Date(dateOrBooking.departureTime);
      return isNaN(d) ? null : d;
    }
    // if passed date string and time
    if (typeof dateOrBooking === 'string' && time) {
      const combined = `${dateOrBooking}T${time}`;
      const d = new Date(combined);
      return isNaN(d) ? null : d;
    }
    const d = new Date(dateOrBooking);
    return isNaN(d) ? null : d;
  } catch (e) {
    return null;
  }
}

/**
 * Refund policy calculation - can be customized or moved to util
 */
async function calculateRefund(booking, ticket) {
  // Determine departure time; booking may have departureTime or date+time
  const departureTime = parseDateTime(booking.departureTime || booking.date || booking);
  const now = new Date();
  if (!departureTime) {
    // If we can't compute departure time, disallow refund (safe default)
    return { refundable: false, amount: 0, percentage: 0, reason: 'Unable to determine departure time' };
  }
  const hoursUntilDeparture = (departureTime - now) / (1000 * 60 * 60);
  const totalPaid = Number(ticket.paidAmount ?? booking.totalAmount ?? 0);

  if (isNaN(totalPaid)) {
    return { refundable: false, amount: 0, percentage: 0, reason: 'Unable to determine paid amount' };
  }

  if (hoursUntilDeparture > 48) {
    return { refundable: true, amount: +(totalPaid * 0.8).toFixed(2), percentage: 80, reason: 'Refund 80% (>48 hrs before departure)' };
  } else if (hoursUntilDeparture > 24) {
    return { refundable: true, amount: +(totalPaid * 0.5).toFixed(2), percentage: 50, reason: 'Refund 50% (24-48 hrs)' };
  } else if (hoursUntilDeparture > 4) {
    return { refundable: true, amount: +(totalPaid * 0.25).toFixed(2), percentage: 25, reason: 'Refund 25% (4-24 hrs)' };
  } else {
    return { refundable: false, amount: 0, percentage: 0, reason: 'No refund (<4 hrs before departure)' };
  }
}

/**
 * Cancel ticket & process automatic refund (user)
 * POST /api/refunds/cancel/:id
 */
exports.cancelTicket = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const ticketId = req.params.id;
    const userId = req.user?.id || req.userId;
    const { cancellationReason } = req.body || {};

    if (!ticketId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, msg: 'Ticket ID is required' });
    }
    if (!userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ success: false, msg: 'Authentication required' });
    }

    const ticket = await Ticket.findById(ticketId).populate('user', 'name email walletBalance').populate('booking', 'departureTime totalAmount status').session(session);
    if (!ticket) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, msg: 'Ticket not found' });
    }

    if (String(ticket.user._id) !== String(userId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, msg: 'Unauthorized to cancel this ticket' });
    }

    if (ticket.status === 'cancelled') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, msg: 'Ticket is already cancelled' });
    }

    const booking = await Booking.findById(ticket.booking).session(session);
    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, msg: 'Associated booking not found' });
    }

    if (booking.status === 'cancelled') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, msg: 'Booking is already cancelled' });
    }

    const refundDetails = await calculateRefund(booking, ticket);
    if (!refundDetails.refundable) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, msg: 'Ticket is not refundable', details: refundDetails.reason });
    }

    // Mark ticket cancelled
    ticket.status = 'cancelled';
    ticket.cancelledAt = new Date();
    ticket.cancellationReason = cancellationReason || 'User requested cancellation';
    ticket.refundAmount = refundDetails.amount;
    await ticket.save({ session });

    // If no active tickets remain for booking => cancel booking
    const activeTicketCount = await Ticket.countDocuments({ booking: ticket.booking, status: { $ne: 'cancelled' } }).session(session);
    if (activeTicketCount === 0) {
      booking.status = 'cancelled';
      await booking.save({ session });
    }

    // Create wallet transaction (refund)
    const refundTransaction = new WalletTransaction({
      user: userId,
      amount: refundDetails.amount,
      type: 'refund',
      description: `Refund for cancelled ticket ${ticket.ticketNumber || ticket._id}`,
      referenceType: 'ticket',
      referenceId: ticket._id,
      status: 'completed',
      processedAt: new Date()
    });

    await refundTransaction.save({ session });

    // Update user wallet
    await User.findByIdAndUpdate(
      userId,
      { $inc: { walletBalance: refundDetails.amount }, $push: { walletTransactions: refundTransaction._id } },
      { session }
    );

    // Optionally persist Refund record (if model exists)
    if (Refund) {
      try {
        await Refund.create([{
          user: userId,
          ticket: ticket._id,
          booking: booking._id,
          amount: refundDetails.amount,
          percentage: refundDetails.percentage,
          status: 'completed',
          reason: refundDetails.reason,
          processedAt: new Date()
        }], { session });
      } catch (e) {
        // non-fatal — log and continue
        console.warn('Failed to create Refund record:', e.message || e);
      }
    }

    await session.commitTransaction();
    session.endSession();

    // Optionally emit a socket event here (if you have socket integration)
    // require('../sockets/bookingSocket').emitRefundProcessed(userId, refundTransaction);

    return res.status(200).json({
      success: true,
      msg: 'Ticket cancelled and refund processed successfully',
      refundAmount: refundDetails.amount,
      refundPercentage: refundDetails.percentage,
      ticketNumber: ticket.ticketNumber || ticket._id,
      transactionId: refundTransaction._id
    });
  } catch (err) {
    try { await session.abortTransaction(); } catch (e) { /* ignore */ }
    session.endSession();
    console.error('Refund Error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, msg: 'Invalid ticket ID format' });
    }
    return res.status(500).json({ success: false, msg: 'Server error during refund processing', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Get refund history for current user
 * GET /api/refunds/history
 */
exports.getRefundHistory = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) return res.status(401).json({ success: false, msg: 'Authentication required' });

    const { page = 1, limit = 10, status, startDate, endDate, type } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));

    const filter = { user: userId, type: 'refund' };
    if (status) filter.status = status;
    if (type) filter.refundType = type;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [refunds, total] = await Promise.all([
      WalletTransaction.find(filter).populate('referenceId').sort({ createdAt: -1 }).limit(limitNum).skip((pageNum - 1) * limitNum),
      WalletTransaction.countDocuments(filter)
    ]);

    return res.status(200).json({ success: true, refunds, total, currentPage: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    console.error('Get Refund History Error:', err);
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Get refund details (user or admin)
 * GET /api/refunds/:id
 */
exports.getRefundDetails = async (req, res, next) => {
  try {
    const refundId = req.params.id;
    const userId = req.user?.id || req.userId;
    const userRole = req.user?.role || 'user';

    if (!refundId) return res.status(400).json({ success: false, msg: 'Refund ID required' });

    const refund = await WalletTransaction.findById(refundId).populate('user', 'name email').populate('referenceId');
    if (!refund) return res.status(404).json({ success: false, msg: 'Refund not found' });

    // Ownership check
    if (String(refund.user._id) !== String(userId) && userRole !== 'admin') {
      return res.status(403).json({ success: false, msg: 'Unauthorized to view this refund' });
    }

    return res.status(200).json({ success: true, refund });
  } catch (err) {
    console.error('Get Refund Details Error:', err);
    if (err.name === 'CastError') return res.status(400).json({ success: false, msg: 'Invalid refund ID format' });
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Process manual refund (admin)
 * POST /api/refunds/manual
 */
exports.processManualRefund = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { ticketId, refundAmount, reason } = req.body;
    const adminId = req.user?.id;
    if (!adminId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ success: false, msg: 'Authentication required' });
    }
    if (!ticketId || !refundAmount || Number(refundAmount) <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, msg: 'Valid ticketId and refundAmount are required' });
    }

    const ticket = await Ticket.findById(ticketId).populate('user', 'name email walletBalance').session(session);
    if (!ticket) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, msg: 'Ticket not found' });
    }

    // If ticket not cancelled, optionally mark as cancelled (admin choice)
    if (ticket.status !== 'cancelled') {
      ticket.status = 'cancelled';
      ticket.cancelledAt = new Date();
      ticket.cancellationReason = reason || 'Admin initiated refund';
      ticket.refundAmount = refundAmount;
      await ticket.save({ session });
    }

    const refundTransaction = new WalletTransaction({
      user: ticket.user._id,
      amount: refundAmount,
      type: 'refund',
      description: `Manual refund for ticket ${ticket.ticketNumber || ticket._id}: ${reason || ''}`,
      referenceType: 'ticket',
      referenceId: ticket._id,
      status: 'completed',
      processedBy: adminId,
      processedAt: new Date()
    });

    await refundTransaction.save({ session });

    await User.findByIdAndUpdate(ticket.user._id, { $inc: { walletBalance: refundAmount }, $push: { walletTransactions: refundTransaction._id } }, { session });

    if (Refund) {
      try {
        await Refund.create([{
          user: ticket.user._id,
          ticket: ticket._id,
          booking: ticket.booking,
          amount: refundAmount,
          percentage: null,
          status: 'completed',
          reason: reason || 'Admin manual refund',
          processedBy: adminId,
          processedAt: new Date()
        }], { session });
      } catch (e) {
        console.warn('Failed to create Refund record (manual):', e.message || e);
      }
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, msg: 'Manual refund processed successfully', refundAmount, transactionId: refundTransaction._id });
  } catch (err) {
    try { await session.abortTransaction(); } catch (e) { /* ignore */ }
    session.endSession();
    console.error('Manual Refund Error:', err);
    if (err.name === 'CastError') return res.status(400).json({ success: false, msg: 'Invalid ticket ID format' });
    return res.status(500).json({ success: false, msg: 'Server error during manual refund', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Refund statistics (admin)
 * GET /api/refunds/stats
 */
exports.getRefundStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { type: 'refund' };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const totalRefunds = await WalletTransaction.countDocuments(filter);
    const totalRefundAmountAgg = await WalletTransaction.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRefundAmount = totalRefundAmountAgg[0]?.total || 0;

    const statusStats = await WalletTransaction.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const monthlyStats = await WalletTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    return res.status(200).json({ success: true, totalRefunds, totalRefundAmount, statusStats, monthlyStats });
  } catch (err) {
    console.error('Get Refund Stats Error:', err);
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Update refund status (admin)
 * PATCH /api/refunds/:id/status
 */
exports.updateRefundStatus = async (req, res, next) => {
  try {
    const refundId = req.params.id;
    const { status, notes } = req.body;

    if (!refundId) return res.status(400).json({ success: false, msg: 'Refund ID required' });

    const update = { status };
    if (notes) update.adminNotes = notes;

    const updated = await WalletTransaction.findByIdAndUpdate(refundId, update, { new: true, runValidators: true }).populate('user', 'name email').populate('referenceId');
    if (!updated) return res.status(404).json({ success: false, msg: 'Refund not found' });

    // Optionally update Refund model as well
    if (Refund) {
      try {
        await Refund.findOneAndUpdate({ ticket: updated.referenceId?._id || updated.referenceId }, { status, adminNotes: notes }, { new: true });
      } catch (e) {
        console.warn('Failed to sync Refund model status:', e.message || e);
      }
    }

    return res.status(200).json({ success: true, msg: 'Refund status updated successfully', refund: updated });
  } catch (err) {
    console.error('Update Refund Status Error:', err);
    if (err.name === 'CastError') return res.status(400).json({ success: false, msg: 'Invalid refund ID format' });
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Export refunds (admin)
 * GET /api/refunds/export?format=csv
 */
exports.exportRefunds = async (req, res, next) => {
  try {
    const { startDate, endDate, status, type, format = 'json' } = req.query;
    const filter = { type: 'refund' };
    if (status) filter.status = status;
    if (type) filter.refundType = type;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const refunds = await WalletTransaction.find(filter).populate('user', 'name email').populate('referenceId').sort({ createdAt: -1 });

    if (format === 'csv') {
      const rows = [['TransactionId', 'User', 'Email', 'Amount', 'Status', 'Reference', 'CreatedAt']];
      refunds.forEach(r => {
        rows.push([
          r._id,
          r.user?.name || '',
          r.user?.email || '',
          r.amount || 0,
          r.status || '',
          (r.referenceId && (r.referenceId.ticketNumber || r.referenceId._id)) || '',
          r.createdAt ? r.createdAt.toISOString() : ''
        ]);
      });
      const csv = rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
      res.header('Content-Type', 'text/csv');
      res.attachment('refunds_export.csv');
      return res.send(csv);
    }

    return res.status(200).json({ success: true, count: refunds.length, data: refunds });
  } catch (err) {
    console.error('Export Refunds Error:', err);
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};

/**
 * Get refund policy
 * GET /api/refunds/policy
 */
exports.getRefundPolicy = async (req, res, next) => {
  try {
    const refundPolicy = {
      policy: 'Refund Policy',
      rules: [
        { hoursBeforeDeparture: '> 48', refundPercentage: 80 },
        { hoursBeforeDeparture: '24-48', refundPercentage: 50 },
        { hoursBeforeDeparture: '4-24', refundPercentage: 25 },
        { hoursBeforeDeparture: '< 4', refundPercentage: 0 }
      ]
    };
    return res.status(200).json({ success: true, refundPolicy });
  } catch (err) {
    console.error('Get Refund Policy Error:', err);
    return res.status(500).json({ success: false, msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
  }
};
