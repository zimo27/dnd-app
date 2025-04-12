'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { fetchScenarioById } from '@/lib/api';
import { Scenario } from '@/shared/types/game';
import Header from '@/components/ui/Header';

export default function ScenarioPage() {
  const params = useParams();
  const { user } = useAuth();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScenario() {
      try {
        const scenarioData = await fetchScenarioById(params.id as string);
        setScenario(scenarioData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading scenario:', error);
        setLoading(false);
      }
    }

    loadScenario();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-white mb-4">Scenario Not Found</h1>
        <p className="text-gray-300 mb-8">The scenario you're looking for doesn't exist.</p>
        <Link
          href="/"
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <Header />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-2xl">
            <h1 className="text-4xl font-bold text-white mb-6">{scenario.title}</h1>
            <p className="text-gray-300 text-lg mb-8">{scenario.description}</p>
            
            <div className="space-y-8">
              <div className="bg-gray-700/50 rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-white mb-4">How to Play</h2>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    You'll engage in a chat-based conversation where you play the role described in the scenario
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    Make choices and respond to situations as they arise
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    Your decisions will influence the story's direction and outcome
                  </li>
                </ul>
              </div>

              <Link 
                href={`/scenarios/${scenario.id}/chat`}
                className="block w-full text-center bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold py-4 px-6 rounded-lg transform transition-all duration-300 hover:from-purple-600 hover:to-pink-700 hover:shadow-lg"
              >
                Start Chat Adventure
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 