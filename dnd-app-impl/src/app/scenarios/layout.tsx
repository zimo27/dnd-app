'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function ScenariosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Debug-only: Bypass auth check
    const bypassAuth = true; // Set to false to re-enable auth check
    
    console.log('[ScenariosLayout] Auth check bypass:', bypassAuth);
    
    if (!loading || bypassAuth) {
      if (!user && !bypassAuth) {
        console.log('[ScenariosLayout] Would redirect, but bypass is active');
        const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
        router.push(loginUrl);
      }
      setAuthChecked(true);
    }
  }, [user, loading, router, pathname]);

  // Show loading spinner while authentication is being checked
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // If user is null and auth check is complete, we're in the process of redirecting
  if (!user && authChecked) {
    return null;
  }

  // User is authenticated, show the children
  return <>{children}</>;
} 