import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import { SocketProvider } from './context/SocketContext';
import AppRouter from './routes/AppRouter';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import keepAliveService from './services/keepAliveService';
import './app.css';

function App() {
  // Start keep-alive service to prevent Render free tier from sleeping
  useEffect(() => {
    // Only run in production or if VITE_API_BASE_URL is set
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    if (apiUrl && !apiUrl.includes('localhost')) {
      keepAliveService.start();
      console.log('🚀 Keep-alive service started for production backend');
    }
    
    // Cleanup on unmount
    return () => {
      keepAliveService.stop();
    };
  }, []);

  return (
    <AuthProvider>
      <UserProvider>
        <SocketProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow pt-16">
              <AppRouter />
            </main>
            <Footer />
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#90D7FF',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#90D7FF',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#90D7FF',
                  secondary: '#fff',
                },
              },
            }}
          />
        </SocketProvider>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
