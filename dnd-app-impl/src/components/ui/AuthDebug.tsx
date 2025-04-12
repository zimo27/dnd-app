'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';

/**
 * Debug component to display authentication state
 * Add this component to any page where you need to debug auth issues
 */
export default function AuthDebug() {
  const { user, loading } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-gray-800 text-white p-2 rounded-full shadow-lg"
      >
        🔑
      </button>
      
      {isExpanded && (
        <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg mt-2 max-w-xs">
          <h3 className="font-bold mb-2">Auth Debug</h3>
          <div>
            <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
            <p><strong>User:</strong> {user ? user.email : 'null'}</p>
            <p><strong>Authenticated:</strong> {user ? 'Yes' : 'No'}</p>
            <p><strong>User ID:</strong> {user?.id || 'none'}</p>
          </div>
        </div>
      )}
    </div>
  );
} 