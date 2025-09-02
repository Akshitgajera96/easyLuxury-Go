const calculateRefund = (bookingAmount, cancellationTime, travelDate) => {
  const now = new Date();
  const travelDateTime = new Date(travelDate);
  const hoursUntilTravel = (travelDateTime - now) / (1000 * 60 * 60);
  
  if (hoursUntilTravel > 48) {
    // 48 hoursથી વધુ સમય હોય તો 80% refund
    return bookingAmount * 0.8;
  } else if (hoursUntilTravel > 24) {
    // 24-48 hours વચ્ચે હોય તો 50% refund
    return bookingAmount * 0.5;
  } else if (hoursUntilTravel > 4) {
    // 4-24 hours વચ્ચે હોય તો 25% refund
    return bookingAmount * 0.25;
  } else {
    // 4 hoursથી ઓછા સમય હોય તો no refund
    return 0;
  }
};

const calculateRefundPercentage = (cancellationTime, travelDate) => {
  const now = new Date();
  const travelDateTime = new Date(travelDate);
  const hoursUntilTravel = (travelDateTime - now) / (1000 * 60 * 60);
  
  if (hoursUntilTravel > 48) return 80;
  if (hoursUntilTravel > 24) return 50;
  if (hoursUntilTravel > 4) return 25;
  return 0;
};

module.exports = {
  calculateRefund,
  calculateRefundPercentage
};