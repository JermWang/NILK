"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Award, ChevronLeft, Loader2, Crown, User, ExternalLink, RefreshCw } from 'lucide-react';
import Image from 'next/image';

interface LeaderboardEntry {
  rank: number;
  wallet_address: string;
  username: string;
  raw_nilk_processed: number;
  hype_earned: number;
  fusion_count: number;
  avatar_url?: string;
  x_handle?: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const { data, error } = await (supabase as any).rpc('get_leaderboard') as { data: LeaderboardEntry[] | null, error: any };

        if (error) {
          console.error("Leaderboard RPC error:", error);
          throw error;
        }

        console.log("Leaderboard data received:", data);
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
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="border-lime-500 text-lime-300 hover:bg-lime-700/30"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
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
                  <th scope="col" className="px-6 py-3 text-right text-sm font-semibold text-lime-200 uppercase tracking-wider font-orbitron">Raw Nilk Processed</th>
                  <th scope="col" className="px-6 py-3 text-right text-sm font-semibold text-lime-200 uppercase tracking-wider font-orbitron">HYPE Earned</th>
                  <th scope="col" className="px-6 py-3 text-right text-sm font-semibold text-lime-200 uppercase tracking-wider font-orbitron">Fusions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {leaderboard.map((entry) => (
                  <tr key={entry.rank} className="hover:bg-slate-800/40 transition-colors duration-200">
                    <td className={`px-6 py-4 whitespace-nowrap text-lg font-bold ${getRankColor(entry.rank)} flex items-center`}>
                      {entry.rank === 1 && <Crown className="mr-2 h-5 w-5" />}
                      {entry.rank}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {/* Profile Picture */}
                        <div className="flex-shrink-0 h-10 w-10">
                          {entry.avatar_url ? (
                            <Image
                              className="h-10 w-10 rounded-full border-2 border-lime-500/50"
                              src={entry.avatar_url}
                              alt={`${entry.username || 'Anonymous'} avatar`}
                              width={40}
                              height={40}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-slate-700 border-2 border-lime-500/50 flex items-center justify-center">
                              <User className="h-5 w-5 text-lime-400" />
                            </div>
                          )}
                        </div>
                        
                        {/* Name and X Handle */}
                        <div className="flex flex-col">
                          <div className="text-lg text-white font-medium">
                            {entry.username || 'Anonymous Farmer'}
                          </div>
                                                     {entry.x_handle && (
                             <div className="flex items-center space-x-1 text-sm text-blue-400">
                               <span>{entry.x_handle.startsWith('@') ? entry.x_handle : `@${entry.x_handle}`}</span>
                               <a
                                 href={`https://x.com/${entry.x_handle.replace('@', '')}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="hover:text-blue-300 transition-colors"
                               >
                                 <ExternalLink className="h-3 w-3" />
                               </a>
                             </div>
                           )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg text-lime-400 font-mono text-right">
                      {entry.raw_nilk_processed?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg text-yellow-400 font-mono text-right">
                      {entry.hype_earned?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg text-purple-400 font-mono text-right">
                      {entry.fusion_count || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

       <footer className="py-6 mt-8 text-center border-t border-lime-800/50">
        <p className="text-sm text-lime-400/70">&copy; {new Date().getFullYear()} GOT NILK? - Rankings are updated periodically.</p>
      </footer>
    </div>
  );
} 