"use client";

import { useState, useEffect } from 'react';

const MaintenanceMode = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if already authenticated
    const isAuth = sessionStorage.getItem("maintenanceAuth");
    setIsAuthenticated(!!isAuth);
  }, []);

  // Instead of returning null, render an empty div during hydration
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  // If authenticated, show content
  if (isAuthenticated) {
    return children;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'equibox2024') {
      sessionStorage.setItem("maintenanceAuth", "true");
      setIsAuthenticated(true);
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-95 z-[9999] flex items-center justify-center"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4 relative z-[10000]">
        <h1 className="text-2xl font-bold mb-6 text-center">Equibox</h1>
        <p className="text-gray-600 mb-6 text-center">
          This site is currently under maintenance. Please log in to access.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceMode; 