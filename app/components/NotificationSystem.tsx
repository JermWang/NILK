"use client";

import React, { useState, useEffect } from 'react';
import { Bell, X, Gift, Zap, Star, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useGameStore from '@/app/store/useGameStore';

export interface GameNotification {
  id: string;
  type: 'harvest' | 'achievement' | 'purchase' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionable?: boolean;
  actionText?: string;
  onAction?: () => void;
}

interface NotificationSystemProps {
  maxNotifications?: number;
}

export function NotificationSystem({ maxNotifications = 5 }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const ownedCows = useGameStore((state) => state.ownedCows);

  // Check for harvest-ready cows
  useEffect(() => {
    const checkHarvestReadyCows = () => {
      const now = Date.now();
      const harvestReadyCows = ownedCows.filter(cow => {
        const timeSinceHarvest = now - cow.lastHarvestTime;
        const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours
        return timeSinceHarvest >= cooldownMs;
      });

      if (harvestReadyCows.length > 0) {
        const existingHarvestNotification = notifications.find(n => n.type === 'harvest' && !n.read);
        
        if (!existingHarvestNotification) {
          addNotification({
            type: 'harvest',
            title: 'Cows Ready for Harvest!',
            message: `${harvestReadyCows.length} cow${harvestReadyCows.length > 1 ? 's are' : ' is'} ready to be harvested.`,
            actionable: true,
            actionText: 'Harvest Now',
            onAction: () => {
              // Navigate to farm or trigger harvest
              window.location.href = '/farm';
            }
          });
        }
      }
    };

    const interval = setInterval(checkHarvestReadyCows, 60000); // Check every minute
    checkHarvestReadyCows(); // Check immediately

    return () => clearInterval(interval);
  }, [ownedCows, notifications]);

  const addNotification = (notification: Omit<GameNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: GameNotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications);
      return updated;
    });

    // Auto-show panel for important notifications
    if (notification.type === 'harvest' || notification.type === 'achievement') {
      setIsOpen(true);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: GameNotification['type']) => {
    switch (type) {
      case 'harvest': return <Gift className="h-4 w-4 text-green-400" />;
      case 'achievement': return <Star className="h-4 w-4 text-yellow-400" />;
      case 'purchase': return <Coins className="h-4 w-4 text-blue-400" />;
      case 'warning': return <Zap className="h-4 w-4 text-orange-400" />;
      default: return <Bell className="h-4 w-4 text-gray-400" />;
    }
  };

  const getNotificationColor = (type: GameNotification['type']) => {
    switch (type) {
      case 'harvest': return 'border-green-500/50 bg-green-900/20';
      case 'achievement': return 'border-yellow-500/50 bg-yellow-900/20';
      case 'purchase': return 'border-blue-500/50 bg-blue-900/20';
      case 'warning': return 'border-orange-500/50 bg-orange-900/20';
      default: return 'border-gray-500/50 bg-gray-900/20';
    }
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="fixed top-5 right-4 z-[70]">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="relative border-lime-500/50 bg-black/80 hover:bg-lime-900/30"
        >
          <Bell className="h-5 w-5 text-lime-400" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Notification Panel */}
      {isOpen && (
        <div className="fixed top-[4.5rem] right-4 w-80 max-h-96 bg-gray-900/95 border border-lime-500/50 rounded-lg shadow-2xl z-[60] backdrop-blur-md">
          <div className="p-4 border-b border-lime-500/30">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-lime-300">Notifications</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-700/50 ${getNotificationColor(notification.type)} ${
                    !notification.read ? 'border-l-4 border-l-lime-400' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-white truncate">
                          {notification.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeNotification(notification.id)}
                          className="h-4 w-4 text-gray-400 hover:text-white flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-300 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </span>
                        <div className="flex space-x-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 px-2 text-xs text-lime-400 hover:text-lime-300"
                            >
                              Mark Read
                            </Button>
                          )}
                          {notification.actionable && notification.onAction && (
                            <Button
                              size="sm"
                              onClick={() => {
                                notification.onAction?.();
                                markAsRead(notification.id);
                              }}
                              className="h-6 px-2 text-xs bg-lime-600 hover:bg-lime-700 text-black"
                            >
                              {notification.actionText}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-700/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNotifications([])}
                className="w-full text-xs text-gray-400 hover:text-white"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// Hook for adding notifications from other components
export function useNotifications() {
  const addNotification = (notification: Omit<GameNotification, 'id' | 'timestamp' | 'read'>) => {
    // This would need to be connected to a global notification state
    // For now, we'll use a simple event system
    window.dispatchEvent(new CustomEvent('addNotification', { detail: notification }));
  };

  return { addNotification };
} 