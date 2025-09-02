import React from "react";
import AppRoutes from "./routes/index";
import Navbar from "./components/common/Navbar";
import { Toaster } from "react-hot-toast";
import "./index.css";

const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
    </div>
  );
};

export default App;