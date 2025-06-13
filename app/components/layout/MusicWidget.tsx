'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, ChevronDown, Music, Volume1, Volume } from 'lucide-react';

const MusicWidget = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const musicSrc = '/sounds/life-is-beautiful.mp3';

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && hasInteracted) {
      if (isPlaying) {
        audioRef.current.play().catch(error => console.error('Error playing audio:', error));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, hasInteracted]);

  const handlePlayPause = () => {
    if (!hasInteracted) setHasInteracted(true);
    setIsPlaying(!isPlaying);
  };

  const handleMuteUnmute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [hasInteracted]);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX size={16} />;
    if (volume < 0.5) return <Volume size={16} />;
    if (volume < 0.8) return <Volume1 size={16} />;
    return <Volume2 size={16} />;
  };

  return (
    <div
      className={`relative bg-black/30 backdrop-blur-sm text-white rounded-lg shadow-lg transition-all duration-300 ease-in-out flex items-center border border-lime-500/20 hover:border-lime-500/40 ${isExpanded ? 'p-1 space-x-1 w-auto pr-2' : 'w-8 h-8 justify-center p-0'}`}
    >
      <audio ref={audioRef} src={musicSrc} loop />

      <button
        onClick={toggleExpand}
        className={`hover:bg-white/20 rounded-full focus:outline-none flex-shrink-0 flex items-center justify-center transition-colors ${isExpanded ? 'p-1' : 'w-full h-full'}`}
        aria-label={isExpanded ? 'Collapse widget' : 'Expand widget'}
      >
        {isExpanded ? <ChevronDown size={16} /> : <Music size={16} />}
      </button>

      {isExpanded && (
        <>
          <button
            onClick={handlePlayPause}
            className="p-1 hover:bg-white/20 rounded-full focus:outline-none flex-shrink-0 transition-colors"
            aria-label={isPlaying ? 'Pause music' : 'Play music'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          
          <div className="flex items-center space-x-1 min-w-[80px]">
            <button
              onClick={handleMuteUnmute}
              className="p-1 hover:bg-white/20 rounded-full focus:outline-none flex-shrink-0 transition-colors"
              aria-label={isMuted ? 'Unmute music' : 'Mute music'}
            >
              {getVolumeIcon()}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-lime-500"
              aria-label="Volume"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default MusicWidget; 