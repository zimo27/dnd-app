'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';

export default function Header() {
  const { user, loading } = useAuth();

  // Debug: Log auth state changes
  useEffect(() => {
    console.log('Header auth state:', { user, loading });
  }, [user, loading]);

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link 
            href="/"
            className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600"
          >
            DnD App
          </Link>
          <div className="flex items-center space-x-4">
            {user ? (
              <Link
                href="/profile"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 transition-all duration-300 hover:shadow-lg"
                title={user.email || "Profile"}
              >
                {user.email ? user.email.charAt(0).toUpperCase() : "P"}
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 transition-colors duration-300"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 