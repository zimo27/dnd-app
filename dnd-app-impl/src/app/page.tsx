'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { fetchScenarios } from '@/lib/api';
import { Scenario } from '@/shared/types/game';
import Header from '@/components/ui/Header';
import AuthDebug from '@/components/ui/AuthDebug';

export default function HomePage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function loadScenarios() {
      try {
        const scenariosData = await fetchScenarios();
        setScenarios(scenariosData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading scenarios:', error);
        setLoading(false);
      }
    }

    loadScenarios();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Navigation Bar */}
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            {user ? 'Welcome to Your Adventures' : 'DnD Role-Playing App'}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
            {user 
              ? 'Choose a scenario to begin your role-playing journey'
              : 'Sign in to start your unique role-playing adventure'
            }
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {scenarios.map((scenario) => (
              <div 
                key={scenario.id}
                className="group relative bg-gray-800 rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-gray-700"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-8 space-y-4">
                  <h2 className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors duration-300">
                    {scenario.title}
                  </h2>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    {scenario.description}
                  </p>
                  {user ? (
                    <Link 
                      href={`/scenarios/${scenario.id}`}
                      className="inline-block w-full text-center bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transform transition-all duration-300 hover:from-purple-600 hover:to-pink-700 hover:shadow-lg"
                    >
                      Start Adventure
                    </Link>
                  ) : (
                    <Link
                      href={`/login?redirect=/scenarios/${scenario.id}`}
                      className="inline-block w-full text-center bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transform transition-all duration-300 hover:from-purple-600 hover:to-pink-700 hover:shadow-lg"
                    >
                      Sign In to Start
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Auth Debugging */}
      <AuthDebug />
    </div>
  );
} 