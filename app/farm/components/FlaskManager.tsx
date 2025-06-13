"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import useGameStore, { useGameActions, FLASK_STATS, FlaskId } from "@/app/store/useGameStore";
import { useErrorHandler } from "@/app/utils/errorHandling";
import { shallow } from 'zustand/shallow';

const ConsumableTimer: React.FC<{ expiryTime: number }> = ({ expiryTime }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = expiryTime - now;

      if (remaining <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
        return;
      }

      const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
      const minutes = Math.floor((remaining / 1000 / 60) % 60).toString().padStart(2, '0');
      const seconds = Math.floor((remaining / 1000) % 60).toString().padStart(2, '0');
      
      setTimeLeft(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTime]);

  return <span className="font-mono text-orange-400 tabular-nums">{timeLeft}</span>;
};


export default function FlaskManager() {
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    const { handleError, renderError } = useErrorHandler();

    const { activeFlask, flaskInventory } = useGameStore(state => ({
        activeFlask: state.activeFlask,
        flaskInventory: state.flaskInventory,
    }), shallow);
    
    const actions = useGameActions();

    const handleActivateFlask = async (flaskId: FlaskId) => {
        setIsLoading(prev => ({ ...prev, [`activate_${flaskId}`]: true }));
        try {
            const success = await actions.activateFlask(flaskId);
            if (!success) {
                handleError(new Error("Failed to activate flask. Another may be active or you may not have one."));
            }
        } catch (e: any) {
            handleError(e);
        } finally {
            setIsLoading(prev => ({ ...prev, [`activate_${flaskId}`]: false }));
        }
    };

    return (
        <div className="mt-6 pt-4 border-t border-slate-600">
            {renderError()}
            <h3 className="text-lg font-semibold text-lime-300 mb-3">My Flasks</h3>
            {activeFlask ? (
                <div className="p-3 bg-green-900/40 border border-green-500/50 rounded-lg mb-4 text-center">
                    <h4 className="font-bold text-green-300">{FLASK_STATS[activeFlask.id].name} is Active!</h4>
                    <p className="text-sm text-gray-300">Expires in: <ConsumableTimer expiryTime={activeFlask.expiresAt} /></p>
                </div>
            ) : (
                <div className="p-3 bg-slate-700/50 rounded-lg mb-4 text-center">
                    <p className="text-sm text-gray-400">No active flask.</p>
                </div>
            )}

            <div className="space-y-3">
                {flaskInventory && flaskInventory.length > 0 ? (
                    flaskInventory.map((flaskId, index) => {
                        const flask = FLASK_STATS[flaskId];
                        // Handle case where flaskId might not be in FLASK_STATS
                        if (!flask) return null; 
                        return (
                            <div key={`${flaskId}-${index}`} className="p-3 bg-slate-700/50 rounded-lg flex items-center justify-between space-x-3">
                                <Image src={flask.image} alt={flask.name} width={32} height={32} className="rounded-md" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-white text-sm">{flask.name}</h4>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-lime-500 text-lime-400 hover:bg-lime-500/10 hover:text-lime-300"
                                    onClick={() => handleActivateFlask(flaskId)}
                                    disabled={!!activeFlask || isLoading[`activate_${flaskId}`]}
                                >
                                    {isLoading[`activate_${flaskId}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Activate'}
                                </Button>
                            </div>
                        )
                    })
                ) : (
                    <p className="text-sm text-center text-gray-500">You don't own any flasks. Craft some!</p>
                )}
            </div>
        </div>
    );
} 