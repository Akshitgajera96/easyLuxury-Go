import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const WalletCard = () => {
  const { user, token } = useAuth();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (token) fetchBalance();
  }, [token]);

  const fetchBalance = async () => {
    try {
      const data = await getWalletBalance(token);
      setBalance(data.balance);
    } catch (error) {
      console.error("Wallet fetch error:", error);
      toast.error(error.message || "Failed to fetch wallet balance");
    }
  };

  const handleAddFunds = async () => {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Enter a valid amount to add.");
      return;
    }

    try {
      const res = await addFundsToWallet(token, numericAmount);
      toast.success(`₹${numericAmount} added successfully!`);
      setAmount("");
      fetchBalance();
    } catch (error) {
      console.error("Add funds error:", error);
      toast.error(error.message || "Failed to add funds");
    }
  };

  return (
    <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        Wallet Balance
      </h2>

      <div className="flex items-center justify-between mb-4">
        <span className="text-xl font-semibold text-green-600">
          ₹{balance.toFixed(2)}
        </span>
        <button
          onClick={fetchBalance}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleAddFunds}
          className="w-full sm:w-1/3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
        >
          Add Funds
        </button>
      </div>
    </div>
  );
};

export default WalletCard;
