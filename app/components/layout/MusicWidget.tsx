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
    if (isMuted || volume === 0) return <VolumeX size={20} />;
    if (volume < 0.5) return <Volume size={20} />;
    if (volume < 0.8) return <Volume1 size={20} />;
    return <Volume2 size={20} />;
  };

  return (
    <div
      className={`fixed bottom-4 left-4 z-[200] bg-black/70 backdrop-blur-md text-white rounded-lg shadow-2xl transition-all duration-300 ease-in-out flex items-center p-2 space-x-2 ${isExpanded ? 'w-auto pr-3' : 'w-12 h-12 justify-center'}`}
    >
      <audio ref={audioRef} src={musicSrc} loop />

      <button
        onClick={toggleExpand}
        className="p-1 hover:bg-white/20 rounded-full focus:outline-none flex-shrink-0"
        aria-label={isExpanded ? 'Collapse widget' : 'Expand widget'}
      >
        {isExpanded ? <ChevronDown size={20} /> : <Music size={20} />}
      </button>

      {isExpanded && (
        <>
          <button
            onClick={handlePlayPause}
            className="p-2 hover:bg-white/20 rounded-full focus:outline-none flex-shrink-0"
            aria-label={isPlaying ? 'Pause music' : 'Play music'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          
          <div className="flex items-center space-x-1.5 min-w-[120px]">
            <button
              onClick={handleMuteUnmute}
              className="p-2 hover:bg-white/20 rounded-full focus:outline-none flex-shrink-0"
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
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-lime-500"
              aria-label="Volume"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default MusicWidget; 