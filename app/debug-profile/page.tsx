"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2, Server, UserCircle } from 'lucide-react';

interface ProfileData {
  id: string;
  username: string;
  wallet_address: string;
  updated_at: string;
}

export default function DebugProfilePage() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      const fetchProfile = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
               throw new Error("No profile found for the current user. The 'handle_new_user' trigger may have failed.");
            }
            throw error;
          }

          setProfile(data);
        } catch (err: any) {
          console.error("Error fetching profile:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [session]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-12 w-12 text-lime-400 animate-spin" />
          <p className="ml-4 text-xl text-lime-300">Fetching Profile Data...</p>
        </div>
      );
    }

    if (error) {
      return <div className="text-center text-red-400 text-lg">{error}</div>;
    }

    if (!session) {
        return <div className="text-center text-yellow-400 text-lg">Please sign in first to verify your profile.</div>;
    }
    
    if (profile) {
      return (
        <div>
            <h2 className="text-2xl font-bold text-lime-300 mb-4 font-orbitron">Profile Verified <UserCircle className="inline-block ml-2"/></h2>
            <p className="text-lime-200 mb-6">The following data was successfully retrieved from the `profiles` table for your user ID.</p>
            <pre className="bg-slate-950 p-4 rounded-lg border border-lime-700/50 text-sm text-white overflow-auto">
                {JSON.stringify(profile, null, 2)}
            </pre>
        </div>
      );
    }
    
    return <div className="text-center text-yellow-400 text-lg">No profile data found.</div>;
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
          <Server className="mr-4 text-lime-400 h-10 w-10" />
          Profile Verification
        </h1>
        <div style={{ width: '150px' }} /> {/* Spacer */}
      </header>

      <main className="flex-grow bg-slate-900/80 border border-lime-500/70 rounded-2xl p-6 shadow-2xl backdrop-blur-lg">
        {renderContent()}
      </main>
    </div>
  );
} 