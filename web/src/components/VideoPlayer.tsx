'use client';

import { useLayoutEffect, useRef, useState, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Settings, Maximize } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  onPlay?: () => void;
}

export function VideoPlayer({ videoId, onPlay }: VideoPlayerProps) {
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const initializationRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Watch progress tracking
  const [watchProgress, setWatchProgress] = useState(0);
  const [showResumeOption, setShowResumeOption] = useState(false);
  const lastSavedProgressRef = useRef(0);
  const progressSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper functions for watch progress
  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  };

  const saveWatchProgress = async (progress: number, videoDuration: number) => {
    const token = getAuthToken();
    if (!token || progress < 1 || videoDuration < 5) return; // Save from 1 second onwards
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/videos/${videoId}/watch-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          progress: Math.floor(progress),
          duration: Math.floor(videoDuration)
        })
      });
      
      if (response.ok) {
        lastSavedProgressRef.current = progress;
      }
    } catch (error) {
      console.error('Failed to save watch progress:', error);
    }
  };

  const loadWatchProgress = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return null;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/videos/${videoId}/watch-progress`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.progress || 0;
      }
    } catch (error) {
      console.error('Failed to load watch progress:', error);
    }
    return null;
  }, [videoId]);

  const handleResumePlayback = () => {
    const video = videoRef.current;
    if (!video || watchProgress <= 0) return;
    
    video.currentTime = watchProgress;
    setCurrentTime(watchProgress);
    setShowResumeOption(false);
    
    // Start playing if not already playing
    if (!isPlaying) {
      video.play();
    }
  };

  const throttledSaveProgress = (progress: number, videoDuration: number) => {
    // Clear existing timeout
    if (progressSaveTimeoutRef.current) {
      clearTimeout(progressSaveTimeoutRef.current);
    }
    
    // Save every 10 seconds or if significant progress change (>5 seconds)
    const significantChange = Math.abs(progress - lastSavedProgressRef.current) > 5;
    const timeToSave = significantChange ? 1000 : 10000;
    
    progressSaveTimeoutRef.current = setTimeout(() => {
      saveWatchProgress(progress, videoDuration);
      progressSaveTimeoutRef.current = null;
    }, timeToSave);
  };

  // Load watch progress on component mount
  useEffect(() => {
    const initializeWatchProgress = async () => {
      const savedProgress = await loadWatchProgress();
      if (savedProgress && savedProgress > 10) { // Show resume option if >10 seconds
        setWatchProgress(savedProgress);
        setShowResumeOption(true);
      }
    };
    
    initializeWatchProgress();
  }, [videoId, loadWatchProgress]);

  // Use useLayoutEffect to ensure DOM is ready
  useLayoutEffect(() => {
    
    const video = videoRef.current;
    if (!video) {
      console.error('❌ Video element not found in DOM');
      setError('Video element not available');
      setLoading(false);
      return;
    }

    if (initializationRef.current) {
      return;
    }

    initializationRef.current = true;

    const hlsUrl = `http://localhost:8080/videos/${videoId}/stream/master.m3u8`;

    // Video event listeners first
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;
      
      setCurrentTime(currentTime);
      
      // Track watch progress for authenticated users
      if (duration > 0 && currentTime > 0) {
        throttledSaveProgress(currentTime, duration);
      }
    };
    const handlePlay = () => {
      setIsPlaying(true);
      
      // Call onPlay for view increment (only once at start)
      if (onPlay && video.currentTime === 0) {
        onPlay();
      }
      
      // Initialize watch history entry when starting to play
      const currentTime = video.currentTime;
      const duration = video.duration;
      
      if (duration > 0) {
        // Save initial watch progress to create history entry
        throttledSaveProgress(Math.max(currentTime, 1), duration);
      }
    };
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    // Initialize HLS with proper event handling
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false,
        debug: true,
        fragLoadingTimeOut: 20000,
        manifestLoadingTimeOut: 10000
      });
      hlsRef.current = hls;

      // Track if we successfully loaded
      let hasLoaded = false;

      // Function to handle successful loading
      const handleLoadSuccess = () => {
        if (!hasLoaded) {
          hasLoaded = true;
          setLoading(false);
          // Cancel timeout when video loads successfully
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
      };

      // Multiple events that indicate successful loading
      hls.on(Hls.Events.MANIFEST_PARSED, handleLoadSuccess);
      hls.on(Hls.Events.LEVEL_LOADED, handleLoadSuccess);
      hls.on(Hls.Events.FRAG_LOADED, handleLoadSuccess);

      // Enhanced error handling
      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error('HLS Error:', data.type, data.details, data);
        
        if (data.fatal) {
          // Cancel timeout on fatal error
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('Network error loading video');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('Media error playing video');
              break;
            default:
              setError(`HLS Error: ${data.details}`);
              break;
          }
          setLoading(false);
        }
      });

      // Load and attach
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      // Fallback timeout with reference
      timeoutRef.current = setTimeout(() => {
        if (!hasLoaded) {
          console.warn('HLS initialization taking too long, trying fallback');
          setError('Video loading timeout - try refreshing');
          setLoading(false);
        }
        timeoutRef.current = null;
      }, 15000);

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = hlsUrl;
      
      const handleLoadedMetadata = () => {
        setLoading(false);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
      
      const handleError = () => {
        setError('Error loading video');
        setLoading(false);
        video.removeEventListener('error', handleError);
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('error', handleError);
      
      // Timeout for native HLS
      setTimeout(() => {
        if (loading) {
          setError('Video loading timeout');
          setLoading(false);
        }
      }, 10000);
    } else {
      setError('HLS not supported in this browser');
      setLoading(false);
    }

    return () => {
      initializationRef.current = false;
      
      // Cancel any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Cancel progress save timeout
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current);
        progressSaveTimeoutRef.current = null;
      }
      
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      
      // Clean up all event listeners
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
      <video
        ref={videoRef}
        className="w-full h-full"
        onClick={togglePlay}
        playsInline
        style={{ display: 'block' }}
      />
      
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="text-white text-lg">Loading video...</div>
        </div>
      )}
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="text-red-500 text-lg">{error}</div>
        </div>
      )}
      
      {/* Resume Watch Option */}
      {showResumeOption && !isPlaying && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 text-center max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Resume Watching</h3>
            <p className="text-gray-600 mb-4">
              Continue from {Math.floor(watchProgress / 60)}:{(Math.floor(watchProgress % 60)).toString().padStart(2, '0')}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleResumePlayback}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
              >
                Resume
              </button>
              <button
                onClick={() => {
                  setShowResumeOption(false);
                  togglePlay(); // Start from beginning
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Controls */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
        {/* Play/Pause overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>
        </div>

        {/* Bottom controls bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          {/* Progress bar */}
          <div className="w-full mb-4">
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          {/* Control buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              <button onClick={togglePlay} className="hover:text-blue-400 transition-colors">
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <div className="flex items-center space-x-2 group/volume">
                <button onClick={toggleMute} className="hover:text-blue-400 transition-colors">
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer opacity-0 group-hover/volume:opacity-100 transition-opacity"
                />
              </div>
              
              <div className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="hover:text-blue-400 transition-colors">
                <Settings size={20} />
              </button>
              <button onClick={toggleFullscreen} className="hover:text-blue-400 transition-colors">
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}