const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("❌ MONGO_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10, // maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // timeout after 5s
      socketTimeoutMS: 45000, // close sockets after 45s of inactivity
      family: 4, // use IPv4 only
      serverApi: {
        version: "1",
        strict: true,
        deprecationErrors: true,
      },
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Connection event listeners
    mongoose.connection.on("error", (err) => {
      console.error(`❌ MongoDB error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        console.log("🔒 MongoDB connection closed due to app termination");
        process.exit(0);
      } catch (err) {
        console.error("❌ Error closing MongoDB connection:", err);
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);

    if (error.name === "MongooseServerSelectionError") {
      console.error("⚠️ Server selection error - check your connection string or server status.");
    } else if (error.name === "MongoNetworkError") {
      console.error("⚠️ Network error - is MongoDB running?");
    }

    // retry logic instead of immediate exit
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
