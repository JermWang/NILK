"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, TrendingUp, DollarSign, Package, AlertTriangle, Clock, Beaker, TrendingDown, Minus, Plus, Gem } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define the structure of the summary data
interface EconomicSummary {
  total_events: number;
  nilk_minted: number;
  nilk_burned_fusion: number;
  nilk_burned_crafting: number;
  total_hype_earned: number;
  fusion_events: number;
  crafting_events: number;
  events_timeseries: { date: string; event_type: string; count: string }[];
}


export default function AdminDashboard() {
    const [summary, setSummary] = useState<EconomicSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize Supabase client
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchSummary = async () => {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_economic_summary');
            if (error) {
                setError(error.message);
                console.error("Failed to fetch economic summary:", error);
            } else {
                setSummary(data);
            }
            setLoading(false);
        };

        fetchSummary();
    }, []);


    // --- TEST FUNCTION ---
    const handleTestEvent = async () => {
        const TEST_USER_ID = "8a032259-8654-4a99-b223-1490bca26c62"; 
        alert(`Submitting test event for user: ${TEST_USER_ID}`);
        const { data, error } = await supabase.functions.invoke('track-event', {
            body: { 
                eventType: 'PROCESS_NILK',
                userId: TEST_USER_ID,
                data: { amount: 1000, description: "Test event from admin dashboard" }
            }
        })
        if (error) {
            alert(`Error invoking function: ${error.message}`);
        } else {
            alert(`Function invoked successfully! Response: ${JSON.stringify(data)}`);
            // Refresh data after test
            const { data: summaryData, error: summaryError } = await supabase.rpc('get_economic_summary');
            if (!summaryError) setSummary(summaryData);
        }
    };
    // --- END TEST FUNCTION ---

    const totalNilkBurned = summary ? summary.nilk_burned_fusion + summary.nilk_burned_crafting : 0;
    const netNilkChange = summary ? summary.nilk_minted - totalNilkBurned : 0;

    // Process time-series data for the chart
    const chartData = summary?.events_timeseries.reduce((acc: any, item) => {
        const date = new Date(item.date).toLocaleDateString();
        if (!acc[date]) {
            acc[date] = { date };
        }
        acc[date][item.event_type] = parseInt(item.count, 10);
        return acc;
    }, {});
    const finalChartData = chartData ? Object.values(chartData) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white px-8 pt-32 pb-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-lime-300 font-title">Economic Dashboard</h1>
          <div className="flex items-center space-x-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-semibold">INTERNAL DEV ACCESS ONLY</span>
          </div>
        </div>

        {loading && <p className="text-center text-lime-300">Loading economic data...</p>}
        {error && <p className="text-center text-red-500">Error loading data: {error}</p>}
        
        {summary && !loading && (
            <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-slate-800/50 border-green-500/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-green-200">$NILK Minted</CardTitle>
                      <Plus className="h-4 w-4 text-green-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{summary.nilk_minted.toLocaleString()}</div>
                      <p className="text-xs text-green-200/60">Total processed from Raw Nilk</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-red-500/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-red-200">$NILK Burned</CardTitle>
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{totalNilkBurned.toLocaleString()}</div>
                      <p className="text-xs text-red-200/60">From Fusions & Crafting</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-lime-500/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-lime-200">Net $NILK Change</CardTitle>
                      <Minus className="h-4 w-4 text-lime-400" />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${netNilkChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {netNilkChange.toLocaleString()}
                      </div>
                      <p className="text-xs text-lime-200/60">Minted vs. Burned</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-purple-500/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-purple-200">Total HYPE Earned</CardTitle>
                      <Gem className="h-4 w-4 text-purple-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{summary.total_hype_earned.toLocaleString()}</div>
                      <p className="text-xs text-purple-200/60">From achievements & rewards</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 gap-6">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-xl text-lime-300 flex items-center">
                        <BarChart className="mr-3 text-lime-400" />
                        Daily Economic Events
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={finalChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(199, 210, 254, 0.1)" />
                                <XAxis dataKey="date" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                                        borderColor: 'rgba(163, 230, 53, 0.5)',
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="MINT_NILK" fill="#84cc16" name="NILK Minted" />
                                <Bar dataKey="BURN_NILK_FUSION" fill="#ef4444" name="NILK Burned (Fusion)" />
                                <Bar dataKey="CRAFT_ITEM" fill="#f97316" name="Items Crafted" />
                                <Bar dataKey="EARN_HYPE" fill="#a855f7" name="HYPE Earned" />
                            </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Actionable Levers */}
                <div className="mt-6">
                    <h2 className="text-2xl font-bold text-orange-300 mb-4">Economic Levers</h2>
                    <div className="p-6 bg-slate-800/50 border border-orange-500/30 rounded-xl">
                        <p className="text-orange-200/80 mb-4">
                            This section will contain controls to adjust key economic parameters in real-time, such as processing fees, fusion costs, or LP reward multipliers, to respond to the data from the dashboard.
                        </p>
                        {/* --- TEST BUTTON --- */}
                        <div className="border-t border-red-500/30 pt-4 mt-4">
                            <h3 className="text-lg font-semibold text-red-300 mb-2 flex items-center">
                                <Beaker className="w-5 h-5 mr-2" />
                                Verification Test
                            </h3>
                            <p className="text-xs text-red-200/70 mb-3">
                                Click this button to send a test `PROCESS_NILK` event to the `track-event` function.
                                It will automatically refresh the dashboard data on success.
                            </p>
                            <Button variant="destructive" onClick={handleTestEvent}>
                                Run End-to-End Test
                            </Button>
                        </div>
                         {/* --- END TEST BUTTON --- */}
                    </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
}