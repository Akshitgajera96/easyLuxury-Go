// const Ticket = require("../models/Ticket");
// const Booking = require("../models/Booking");
// const WalletTransaction = require("../models/WalletTransaction");
// const User = require("../models/User");
// const { calculateRefundAmount } = require("../utils/refundCalculator");

// // Cancel a ticket and process refund
// exports.cancelTicket = async (req, res) => {
//   try {
//     const ticketId = req.params.id;
//     const userId = req.user.id;
//     const { cancellationReason } = req.body;

//     // Validate input
//     if (!ticketId) {
//       return res.status(400).json({ msg: "Ticket ID is required" });
//     }

//     // Find the ticket and populate related data
//     const ticket = await Ticket.findById(ticketId)
//       .populate('user', 'name email walletBalance')
//       .populate('booking', 'bus departureTime status');

//     if (!ticket) {
//       return res.status(404).json({ msg: "Ticket not found" });
//     }

//     if (ticket.user._id.toString() !== userId) {
//       return res.status(403).json({ msg: "Unauthorized to cancel this ticket" });
//     }

//     if (ticket.status === 'cancelled') {
//       return res.status(400).json({ msg: "Ticket is already cancelled" });
//     }

//     // Check if the associated booking exists and is cancellable
//     const booking = await Booking.findById(ticket.booking);
//     if (!booking) {
//       return res.status(404).json({ msg: "Associated booking not found" });
//     }

//     if (booking.status === 'cancelled') {
//       return res.status(400).json({ msg: "Booking is already cancelled" });
//     }

//     // Calculate refund amount based on cancellation policy
//     const refundDetails = await calculateRefundAmount(booking, ticket);
    
//     if (!refundDetails.refundable) {
//       return res.status(400).json({ 
//         msg: "Ticket is not refundable",
//         details: refundDetails.reason
//       });
//     }

//     // Start a transaction session for atomic operations
//     const session = await Ticket.startSession();
//     session.startTransaction();

//     try {
//       // Update ticket status
//       ticket.status = 'cancelled';
//       ticket.cancelledAt = new Date();
//       ticket.cancellationReason = cancellationReason || 'User requested cancellation';
//       ticket.refundAmount = refundDetails.amount;
//       await ticket.save({ session });

//       // Update booking status if all tickets are cancelled
//       const activeTickets = await Ticket.countDocuments({
//         booking: ticket.booking,
//         status: { $ne: 'cancelled' }
//       }).session(session);

//       if (activeTickets === 0) {
//         booking.status = 'cancelled';
//         await booking.save({ session });
//       }

//       // Record refund transaction in wallet
//       const refundTransaction = new WalletTransaction({
//         user: userId,
//         amount: refundDetails.amount,
//         type: "refund",
//         description: `Refund for canceled ticket ${ticket.ticketNumber}`,
//         referenceType: 'ticket',
//         referenceId: ticket._id,
//         status: 'completed'
//       });

//       await refundTransaction.save({ session });

//       // Update user's wallet balance
//       await User.findByIdAndUpdate(
//         userId,
//         { 
//           $inc: { walletBalance: refundDetails.amount },
//           $push: { walletTransactions: refundTransaction._id }
//         },
//         { session }
//       );

//       // Commit the transaction
//       await session.commitTransaction();
//       session.endSession();

//       // Emit socket event for real-time updates
//       // require('../sockets/bookingSocket').emitRefundProcessed(userId, refundTransaction);

//       return res.status(200).json({
//         msg: "Ticket canceled and refund processed successfully",
//         refundAmount: refundDetails.amount,
//         refundPercentage: refundDetails.percentage,
//         ticketNumber: ticket.ticketNumber,
//         transactionId: refundTransaction._id
//       });

//     } catch (transactionError) {
//       // If anything fails, abort the transaction
//       await session.abortTransaction();
//       session.endSession();
//       throw transactionError;
//     }

//   } catch (err) {
//     console.error("Refund Error:", err);
    
//     if (err.name === 'CastError') {
//       return res.status(400).json({ msg: "Invalid ticket ID format" });
//     }
    
//     return res.status(500).json({ 
//       msg: "Server error during refund processing", 
//       error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
//     });
//   }
// };

// // Get refund history for a user
// exports.getRefundHistory = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { page = 1, limit = 10 } = req.query;

//     const refunds = await WalletTransaction.find({
//       user: userId,
//       type: 'refund'
//     })
//     .populate('referenceId', 'ticketNumber')
//     .sort({ createdAt: -1 })
//     .limit(limit * 1)
//     .skip((page - 1) * limit);

//     const total = await WalletTransaction.countDocuments({
//       user: userId,
//       type: 'refund'
//     });

//     res.status(200).json({
//       total,
//       page: parseInt(page),
//       pages: Math.ceil(total / limit),
//       refunds
//     });
//   } catch (err) {
//     console.error("Get Refund History Error:", err);
//     res.status(500).json({ 
//       msg: "Server error", 
//       error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
//     });
//   }
// };

// // Get specific refund details
// exports.getRefundDetails = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user.id;

//     const refund = await WalletTransaction.findOne({
//       _id: id,
//       user: userId,
//       type: 'refund'
//     }).populate('referenceId', 'ticketNumber bus seatNumber price');

//     if (!refund) {
//       return res.status(404).json({ msg: "Refund transaction not found" });
//     }

//     res.status(200).json(refund);
//   } catch (err) {
//     console.error("Get Refund Details Error:", err);
    
//     if (err.name === 'CastError') {
//       return res.status(400).json({ msg: "Invalid refund ID format" });
//     }
    
//     res.status(500).json({ 
//       msg: "Server error", 
//       error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
//     });
//   }
// };

// // Admin: Process manual refund
// exports.processManualRefund = async (req, res) => {
//   try {
//     const { ticketId, refundAmount, reason } = req.body;

//     if (!ticketId || !refundAmount || refundAmount <= 0) {
//       return res.status(400).json({ 
//         msg: "Valid ticket ID and refund amount are required" 
//       });
//     }

//     const ticket = await Ticket.findById(ticketId)
//       .populate('user', 'name email walletBalance');

//     if (!ticket) {
//       return res.status(404).json({ msg: "Ticket not found" });
//     }

//     if (ticket.status === 'cancelled') {
//       return res.status(400).json({ msg: "Ticket is already cancelled" });
//     }

//     const session = await Ticket.startSession();
//     session.startTransaction();

//     try {
//       // Update ticket
//       ticket.status = 'cancelled';
//       ticket.cancelledAt = new Date();
//       ticket.cancellationReason = reason || 'Admin initiated refund';
//       ticket.refundAmount = refundAmount;
//       await ticket.save({ session });

//       // Create refund transaction
//       const refundTransaction = new WalletTransaction({
//         user: ticket.user._id,
//         amount: refundAmount,
//         type: "refund",
//         description: `Manual refund for ticket ${ticket.ticketNumber}: ${reason}`,
//         referenceType: 'ticket',
//         referenceId: ticket._id,
//         status: 'completed',
//         processedBy: req.user.id
//       });

//       await refundTransaction.save({ session });

//       // Update user wallet
//       await User.findByIdAndUpdate(
//         ticket.user._id,
//         { 
//           $inc: { walletBalance: refundAmount },
//           $push: { walletTransactions: refundTransaction._id }
//         },
//         { session }
//       );

//       await session.commitTransaction();
//       session.endSession();

//       res.status(200).json({
//         msg: "Manual refund processed successfully",
//         refundAmount,
//         ticketNumber: ticket.ticketNumber,
//         transactionId: refundTransaction._id
//       });

//     } catch (transactionError) {
//       await session.abortTransaction();
//       session.endSession();
//       throw transactionError;
//     }

//   } catch (err) {
//     console.error("Manual Refund Error:", err);
    
//     if (err.name === 'CastError') {
//       return res.status(400).json({ msg: "Invalid ticket ID format" });
//     }
    
//     res.status(500).json({ 
//       msg: "Server error during manual refund processing", 
//       error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
//     });
//   }
// };




const Ticket = require("../models/Ticket");
const Booking = require("../models/Booking");
const WalletTransaction = require("../models/WalletTransaction");
const User = require("../models/User");
const Refund = require("../models/Refund"); // ✅ Make sure this model exists

// ✅ calculateRefund function directly in controller
const calculateRefund = async (booking, ticket) => {
  const now = new Date();
  const departureTime = new Date(booking.departureTime);
  const timeDifference = departureTime - now;
  const hoursUntilDeparture = timeDifference / (1000 * 60 * 60);

  // Calculate total paid amount for this ticket
  const totalPaid = ticket.paidAmount || booking.totalAmount;

  if (hoursUntilDeparture > 48) {
    // More than 48 hours before departure - 80% refund
    return {
      refundable: true,
      amount: totalPaid * 0.8,
      percentage: 80,
      reason: "Refund processed (80% of fare)"
    };
  } else if (hoursUntilDeparture > 24) {
    // 24-48 hours before departure - 50% refund
    return {
      refundable: true,
      amount: totalPaid * 0.5,
      percentage: 50,
      reason: "Refund processed (50% of fare)"
    };
  } else if (hoursUntilDeparture > 4) {
    // 4-24 hours before departure - 25% refund
    return {
      refundable: true,
      amount: totalPaid * 0.25,
      percentage: 25,
      reason: "Refund processed (25% of fare)"
    };
  } else {
    // Less than 4 hours before departure - no refund
    return {
      refundable: false,
      amount: 0,
      percentage: 0,
      reason: "No refund available (less than 4 hours before departure)"
    };
  }
};

// Cancel a ticket and process refund
exports.cancelTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const userId = req.user.id;
    const { cancellationReason } = req.body;

    if (!ticketId) {
      return res.status(400).json({ msg: "Ticket ID is required" });
    }

    const ticket = await Ticket.findById(ticketId)
      .populate("user", "name email walletBalance")
      .populate("booking", "bus departureTime status totalAmount");

    if (!ticket) {
      return res.status(404).json({ msg: "Ticket not found" });
    }

    if (ticket.user._id.toString() !== userId) {
      return res.status(403).json({ msg: "Unauthorized to cancel this ticket" });
    }

    if (ticket.status === "cancelled") {
      return res.status(400).json({ msg: "Ticket is already cancelled" });
    }

    const booking = await Booking.findById(ticket.booking);
    if (!booking) {
      return res.status(404).json({ msg: "Associated booking not found" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ msg: "Booking is already cancelled" });
    }

    // ✅ Use the calculateRefund function
    const refundDetails = await calculateRefund(booking, ticket);

    if (!refundDetails.refundable) {
      return res.status(400).json({
        msg: "Ticket is not refundable",
        details: refundDetails.reason,
      });
    }

    const session = await Ticket.startSession();
    session.startTransaction();

    try {
      ticket.status = "cancelled";
      ticket.cancelledAt = new Date();
      ticket.cancellationReason =
        cancellationReason || "User requested cancellation";
      ticket.refundAmount = refundDetails.amount;
      await ticket.save({ session });

      const activeTickets = await Ticket.countDocuments({
        booking: ticket.booking,
        status: { $ne: "cancelled" },
      }).session(session);

      if (activeTickets === 0) {
        booking.status = "cancelled";
        await booking.save({ session });
      }

      const refundTransaction = new WalletTransaction({
        user: userId,
        amount: refundDetails.amount,
        type: "refund",
        description: `Refund for canceled ticket ${ticket.ticketNumber}`,
        referenceType: "ticket",
        referenceId: ticket._id,
        status: "completed",
      });

      await refundTransaction.save({ session });

      await User.findByIdAndUpdate(
        userId,
        {
          $inc: { walletBalance: refundDetails.amount },
          $push: { walletTransactions: refundTransaction._id },
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        msg: "Ticket canceled and refund processed successfully",
        refundAmount: refundDetails.amount,
        refundPercentage: refundDetails.percentage,
        ticketNumber: ticket.ticketNumber,
        transactionId: refundTransaction._id,
      });
    } catch (transactionError) {
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }
  } catch (err) {
    console.error("Refund Error:", err);

    if (err.name === "CastError") {
      return res.status(400).json({ msg: "Invalid ticket ID format" });
    }

    return res.status(500).json({
      msg: "Server error during refund processing",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
};

// ✅ Get refund history
exports.getRefundHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status, startDate, endDate, type } = req.query;

    const filter = { user: userId };
    
    if (status) filter.status = status;
    if (type) filter.refundType = type;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const refunds = await WalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WalletTransaction.countDocuments(filter);

    res.status(200).json({
      refunds,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ✅ Get refund details by ID
exports.getRefundDetails = async (req, res) => {
  try {
    const refundId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const refund = await WalletTransaction.findById(refundId)
      .populate("user", "name email")
      .populate("referenceId");

    if (!refund) {
      return res.status(404).json({ msg: "Refund not found" });
    }

    // Check if user owns the refund or is admin
    if (refund.user._id.toString() !== userId && userRole !== "admin") {
      return res.status(403).json({ msg: "Unauthorized to view this refund" });
    }

    res.status(200).json(refund);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "Invalid refund ID format" });
    }
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ✅ Process manual refund (admin)
exports.processManualRefund = async (req, res) => {
  try {
    const { ticketId, refundAmount, reason } = req.body;
    const adminId = req.user.id;

    const ticket = await Ticket.findById(ticketId)
      .populate("user", "name email walletBalance")
      .populate("booking", "departureTime");

    if (!ticket) {
      return res.status(404).json({ msg: "Ticket not found" });
    }

    if (ticket.status !== "cancelled") {
      return res.status(400).json({ msg: "Ticket is not cancelled" });
    }

    const session = await Ticket.startSession();
    session.startTransaction();

    try {
      const refundTransaction = new WalletTransaction({
        user: ticket.user._id,
        amount: refundAmount,
        type: "refund",
        description: `Manual refund: ${reason}`,
        referenceType: "ticket",
        referenceId: ticket._id,
        status: "completed",
        processedBy: adminId
      });

      await refundTransaction.save({ session });

      await User.findByIdAndUpdate(
        ticket.user._id,
        {
          $inc: { walletBalance: refundAmount },
          $push: { walletTransactions: refundTransaction._id },
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        msg: "Manual refund processed successfully",
        refundAmount,
        userId: ticket.user._id,
        transactionId: refundTransaction._id
      });
    } catch (transactionError) {
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "Invalid ticket ID format" });
    }
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ✅ Get refund statistics (admin)
exports.getRefundStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = { type: "refund" };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const totalRefunds = await WalletTransaction.countDocuments(filter);
    const totalRefundAmount = await WalletTransaction.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const statusStats = await WalletTransaction.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const monthlyStats = await WalletTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 }
    ]);

    res.status(200).json({
      totalRefunds,
      totalRefundAmount: totalRefundAmount[0]?.total || 0,
      statusStats,
      monthlyStats
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ✅ Update refund status (admin)
exports.updateRefundStatus = async (req, res) => {
  try {
    const refundId = req.params.id;
    const { status, notes } = req.body;

    const refund = await WalletTransaction.findByIdAndUpdate(
      refundId,
      { status, ...(notes && { adminNotes: notes }) },
      { new: true, runValidators: true }
    );

    if (!refund) {
      return res.status(404).json({ msg: "Refund not found" });
    }

    res.status(200).json({
      msg: "Refund status updated successfully",
      refund
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "Invalid refund ID format" });
    }
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ✅ Export refunds data (admin)
exports.exportRefunds = async (req, res) => {
  try {
    const { startDate, endDate, status, type } = req.query;

    const filter = { type: "refund" };
    if (status) filter.status = status;
    if (type) filter.refundType = type;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const refunds = await WalletTransaction.find(filter)
      .populate("user", "name email")
      .populate("referenceId")
      .sort({ createdAt: -1 });

    // Simple JSON export - you can implement CSV/Excel export here
    res.status(200).json({
      success: true,
      count: refunds.length,
      data: refunds
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ✅ Get refund policy
exports.getRefundPolicy = async (req, res) => {
  try {
    const refundPolicy = {
      policy: "Refund Policy",
      rules: [
        { hoursBeforeDeparture: "> 48", refundPercentage: 80 },
        { hoursBeforeDeparture: "24-48", refundPercentage: 50 },
        { hoursBeforeDeparture: "4-24", refundPercentage: 25 },
        { hoursBeforeDeparture: "< 4", refundPercentage: 0 }
      ]
    };
    res.status(200).json(refundPolicy);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};