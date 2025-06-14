"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, TrendingUp, DollarSign, Package, AlertTriangle, Clock, Beaker } from 'lucide-react';
import { createClient } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
    // Initialize Supabase client
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // --- TEST FUNCTION ---
    // This function simulates a user completing an action and calls our new Edge Function.
    // NOTE: In a real app, you would need to get the user's actual ID after they log in.
    // For this test, we will hardcode a test user ID. You must create this user in your
    // `profiles` table in Supabase for the test to work. Use a UUID generator for the ID.
    const handleTestEvent = async () => {
        const TEST_USER_ID = "8a032259-8654-4a99-b223-1490bca26c62"; // <-- IMPORTANT: REPLACE WITH A REAL USER ID FROM YOUR `profiles` TABLE

        alert(`Submitting test event for user: ${TEST_USER_ID}`);

        const { data, error } = await supabase.functions.invoke('track-event', {
            body: { 
                eventType: 'PROCESS_NILK',
                userId: TEST_USER_ID,
                data: {
                    amount: 1000,
                    description: "Test event from admin dashboard"
                }
            }
        })

        if (error) {
            alert(`Error invoking function: ${error.message}`);
            console.error(error);
        } else {
            alert(`Function invoked successfully! Response: ${JSON.stringify(data)}`);
            console.log(data);
        }
    };
    // --- END TEST FUNCTION ---


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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-lime-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-lime-200">Total Value Locked</CardTitle>
              <DollarSign className="h-4 w-4 text-lime-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">$625,430.12</div>
              <p className="text-xs text-lime-200/60">+2.1% from last hour</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-200">HYPE in Treasury</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">9,850 HYPE</div>
              <p className="text-xs text-purple-200/60">$413,700</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-green-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-200">$NILK in Treasury</CardTitle>
              <Package className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">850,000 $NILK</div>
              <p className="text-xs text-green-200/60">Burn rate: 12k/day</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-orange-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-200">Treasury Runway</CardTitle>
              <Clock className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">45 Days</div>
              <p className="text-xs text-orange-200/60">at current reward rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inflow vs Outflow */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl text-lime-300 flex items-center">
                <BarChart className="mr-3 text-lime-400" />
                $NILK Minted vs. Burned (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-60 bg-slate-700/50 rounded-lg flex items-center justify-center">
                <p className="text-slate-400">Placeholder for Mint vs. Burn Chart</p>
              </div>
            </CardContent>
          </Card>

          {/* Treasury Value Over Time */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl text-purple-300 flex items-center">
                <LineChart className="mr-3 text-purple-400" />
                Treasury Value Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-60 bg-slate-700/50 rounded-lg flex items-center justify-center">
                <p className="text-slate-400">Placeholder for Treasury Value Chart</p>
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
                        Ensure you have replaced the `TEST_USER_ID` in the code with a valid user ID from your `profiles` table.
                    </p>
                    <Button variant="destructive" onClick={handleTestEvent}>
                        Run End-to-End Test
                    </Button>
                </div>
                 {/* --- END TEST BUTTON --- */}
            </div>
        </div>
      </div>
    </div>
  );
}