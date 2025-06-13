"use client";

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Twitter, User, Check, X } from 'lucide-react';
import useGameStore, { useGameActions } from '@/app/store/useGameStore';
import { useAccount } from 'wagmi';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { address } = useAccount();
  const [isClient, setIsClient] = useState(false);
  
  // Always call hooks - never conditionally
  const userProfile = useGameStore((state) => state.userProfile);
  const actions = useGameActions();

  const [username, setUsername] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; xHandle?: string }>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set client flag and initialize form data
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update form state when userProfile is available and we're on client
  useEffect(() => {
    if (isClient && userProfile) {
      setUsername(userProfile.username || '');
      setXHandle(userProfile.xHandle || '');
      setAvatarUrl(userProfile.avatarUrl || '');
    }
  }, [userProfile, isClient]);

  const validateUsername = (value: string): string | undefined => {
    if (!value.trim()) return 'Username is required';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username must be less than 20 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Username can only contain letters, numbers, hyphens, and underscores';
    return undefined;
  };

  const validateXHandle = (value: string): string | undefined => {
    if (value && !/^@?[a-zA-Z0-9_]+$/.test(value)) {
      return 'Invalid X handle format';
    }
    return undefined;
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    const error = validateUsername(value);
    setErrors(prev => ({ ...prev, username: error }));
  };

  const handleXHandleChange = (value: string) => {
    const formattedValue = value.startsWith('@') ? value : value ? `@${value}` : '';
    setXHandle(formattedValue);
    const error = validateXHandle(formattedValue);
    setErrors(prev => ({ ...prev, xHandle: error }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setAvatarUrl(dataUrl);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar');
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    // Only proceed if we're on client and have actions
    if (!isClient || !actions) return;
    
    const usernameError = validateUsername(username);
    const xHandleError = validateXHandle(xHandle);
    
    if (usernameError || xHandleError) {
      setErrors({ username: usernameError, xHandle: xHandleError });
      return;
    }

    actions.updateProfile({
      username: username.trim(),
      xHandle: xHandle.trim() || undefined,
      avatarUrl: avatarUrl || undefined,
    });

    actions.setProfileComplete(!!username.trim());
    onClose();
  };

  const getAvatarFallback = () => {
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    if (address) {
      return address.slice(2, 4).toUpperCase();
    }
    return 'U';
  };

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Complete Your Profile
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <Avatar className="w-20 h-20 border-2 border-lime-400">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-gray-700 text-white text-lg">
                  {getAvatarFallback()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-lime-500 hover:bg-lime-600 border-lime-400"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Camera size={14} />
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            {isUploading && (
              <p className="text-sm text-gray-400">Uploading...</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">
              Username *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                id="username"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="Enter your username"
                className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                maxLength={20}
              />
            </div>
            {errors.username && (
              <p className="text-sm text-red-400">{errors.username}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="xHandle" className="text-sm font-medium">
              X (Twitter) Handle
            </Label>
            <div className="relative">
              <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                id="xHandle"
                value={xHandle}
                onChange={(e) => handleXHandleChange(e.target.value)}
                placeholder="@username"
                className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            {errors.xHandle && (
              <p className="text-sm text-red-400">{errors.xHandle}</p>
            )}
            <p className="text-xs text-gray-400">
              Optional: Link your X account for leaderboards
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-400">
              Wallet Address
            </Label>
            <div className="p-3 bg-gray-800 rounded-md border border-gray-600">
              <p className="text-sm font-mono text-gray-300">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <X size={16} className="mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!!errors.username || !!errors.xHandle || !username.trim()}
            className="flex-1 bg-lime-500 hover:bg-lime-600 text-black font-medium"
          >
            <Check size={16} className="mr-2" />
            Save Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
