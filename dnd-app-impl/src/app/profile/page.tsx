'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Header from '@/components/ui/Header';

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>
          
          <div className="space-y-6">
            {/* User Info Card */}
            <div className="bg-gray-700 rounded-lg p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{user.email}</h2>
                  <p className="text-gray-400">User ID: {user.id.substring(0, 8)}...</p>
                </div>
              </div>
              
              <div className="border-t border-gray-600 pt-4 mt-4">
                <h3 className="text-lg font-medium text-white mb-2">Account Details</h3>
                <div className="space-y-2 text-gray-300">
                  <p><span className="text-gray-400">Email:</span> {user.email}</p>
                  <p><span className="text-gray-400">Last Sign In:</span> {new Date(user.last_sign_in_at || '').toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col space-y-4">
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full py-3 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-300 disabled:opacity-50 flex justify-center items-center"
              >
                {isSigningOut ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                ) : null}
                Sign Out
              </button>
              
              <button
                onClick={() => router.push('/scenarios')}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 transition-colors duration-300"
              >
                My Scenarios
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 