"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Award, ChevronLeft, Loader2, Crown } from 'lucide-react';

interface LeaderboardEntry {
  username: string;
  nilk_balance: number;
  rank: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_leaderboard');

        if (error) {
          throw error;
        }

        setLeaderboard(data || []);
      } catch (err: any) {
        console.error("Error fetching leaderboard:", err);
        setError("Could not fetch leaderboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-yellow-600';
    return 'text-lime-300';
  };

  return (
    <div className="container mx-auto p-4 min-h-screen flex flex-col text-foreground pt-40 font-sans">
      <header className="flex items-center justify-between mb-8">
        <Link href="/farm" passHref>
          <Button variant="outline" className="border-lime-500 text-lime-300 hover:bg-lime-700/30">
            <ChevronLeft className="mr-2 h-5 w-5" />
            Back to Farm
          </Button>
        </Link>
        <h1 className="text-4xl font-bold text-lime-300 font-orbitron flex items-center">
          <Award className="mr-4 text-yellow-400 h-10 w-10" />
          Cosmic Rankings
        </h1>
        <div style={{ width: '150px' }} /> {/* Spacer */}
      </header>

      <main className="flex-grow bg-slate-900/80 border border-lime-500/70 rounded-2xl p-6 shadow-2xl backdrop-blur-lg">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-12 w-12 text-lime-400 animate-spin" />
            <p className="ml-4 text-xl text-lime-300">Loading Rankings...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-400">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y-2 divide-lime-800/50">
              <thead className="bg-slate-800/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-lime-200 uppercase tracking-wider font-orbitron">Rank</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-lime-200 uppercase tracking-wider font-orbitron">Farmer</th>
                  <th scope="col" className="px-6 py-3 text-right text-sm font-semibold text-lime-200 uppercase tracking-wider font-orbitron">$NILK Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {leaderboard.map((entry) => (
                  <tr key={entry.rank} className="hover:bg-slate-800/40 transition-colors duration-200">
                    <td className={`px-6 py-4 whitespace-nowrap text-lg font-bold ${getRankColor(entry.rank)} flex items-center`}>
                      {entry.rank === 1 && <Crown className="mr-2 h-5 w-5" />}
                      {entry.rank}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg text-white">{entry.username || 'Anonymous Farmer'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg text-lime-400 font-mono text-right">{entry.nilk_balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

       <footer className="py-6 mt-8 text-center border-t border-lime-800/50">
        <p className="text-sm text-lime-400/70">&copy; {new Date().getFullYear()} Nilk - Rankings are updated periodically.</p>
      </footer>
    </div>
  );
} 