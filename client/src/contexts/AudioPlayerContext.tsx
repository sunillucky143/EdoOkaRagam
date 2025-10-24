import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { audioService } from "@/lib/audioService";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  albumCover: string;
  startTime?: number;
  audioUrl?: string;
  hdAudioUrl?: string;
  isHD?: boolean;
}

interface AudioPlayerContextType {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  progress: number;
  volume: number;
  shuffle: boolean;
  repeat: boolean;
  duration: number;
  isBuffering: boolean;
  isStreaming: boolean;
  playTrack: (track: Track, startTime?: number) => void;
  playQueue: (tracks: Track[], startIndex?: number, source?: string) => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seekTo: (position: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: Track) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolumeState] = useState(70);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [queueSource, setQueueSource] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const trackEndTriggered = useRef<boolean>(false);

  // Define a simple track end handler that doesn't depend on nextTrack
  const handleTrackEndSimple = useCallback(() => {
    if (repeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    } else if (currentIndex < queue.length - 1) {
      // Move to next track
      setCurrentIndex(prev => (prev + 1) % queue.length);
    } else {
      setIsPlaying(false);
      setProgress(0);
    }
  }, [repeat, currentIndex, queue.length]);

  useEffect(() => {
    if (!audioRef.current) {
      // Use streaming audio element from audioService
      audioRef.current = audioService.createStreamingAudioElement('');
      
      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      });

      audioRef.current.addEventListener('ended', () => {
        handleTrackEndSimple();
      });

      // Streaming-specific event listeners
      audioRef.current.addEventListener('loadstart', () => {
        setIsBuffering(true);
        setIsStreaming(true);
        console.log('Streaming: Started loading');
      });

      audioRef.current.addEventListener('canplay', () => {
        setIsBuffering(false);
        console.log('Streaming: Can play');
      });

      audioRef.current.addEventListener('canplaythrough', () => {
        setIsBuffering(false);
        console.log('Streaming: Can play through');
      });

      audioRef.current.addEventListener('progress', () => {
        console.log('Streaming: Buffering progress');
      });

      audioRef.current.addEventListener('waiting', () => {
        setIsBuffering(true);
        console.log('Streaming: Waiting for data');
      });

      audioRef.current.addEventListener('seeking', () => {
        setIsBuffering(true);
        console.log('Streaming: Seeking');
      });

      audioRef.current.addEventListener('seeked', () => {
        setIsBuffering(false);
        console.log('Streaming: Seek completed');
      });

      audioRef.current.addEventListener('error', (e) => {
        console.error('Streaming error:', e);
        setIsBuffering(false);
        setIsStreaming(false);
      });
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(console.error);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = window.setInterval(() => {
        if (audioRef.current && audioRef.current.duration) {
          const currentProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setProgress(currentProgress);
          
          // Fallback: Check if track is near the end (99.5% or more)
          // This helps with streaming URLs that might not fire 'ended' event properly
          if (currentProgress >= 99.5 && audioRef.current.duration > 0 && !trackEndTriggered.current) {
            trackEndTriggered.current = true;
            handleTrackEndSimple();
          }
        }
      }, 100);
    } else if (audioRef.current) {
      audioRef.current.pause();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isPlaying]);

  const nextTrack = useCallback(async () => {
    if (queue.length === 0) return;

    let nextIndex;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = (currentIndex + 1) % queue.length;
    }

    // Stop current playback first
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setCurrentIndex(nextIndex);
    setProgress(0);
    setIsBuffering(true);
    setIsStreaming(false);
    trackEndTriggered.current = false; // Reset the flag for new track
    
    const nextTrack = queue[nextIndex];
    const nextTrackAudioUrl = nextTrack.audioUrl;
    
    if (audioRef.current && nextTrackAudioUrl) {
      try {
        // Always compute a fresh streaming URL
        const finalUrl: string = await audioService.getStreamingUrl(nextTrackAudioUrl);
        
        // Update the track with HD information
        const updatedTrack = { 
          ...nextTrack, 
          hdAudioUrl: finalUrl, 
          isHD: true 
        };
        
        // Update the track in the queue
        setQueue(prev => prev.map((track, index) => 
          index === nextIndex ? updatedTrack : track
        ));
        
        setCurrentTrack(updatedTrack);
        
        audioRef.current.src = finalUrl;
        audioRef.current.preload = 'metadata';
        
        // Wait for audio to be ready before playing
        const handleCanPlay = () => {
          if (audioRef.current) {
            audioRef.current.play().catch(console.error);
          }
          audioRef.current?.removeEventListener('canplay', handleCanPlay);
        };
        
        audioRef.current.addEventListener('canplay', handleCanPlay);
        setIsStreaming(true);
      } catch (error) {
        console.error('Error loading next track:', error);
        setIsBuffering(false);
        setIsStreaming(false);
        
        // Fallback to original URL
        if (audioRef.current) {
          audioRef.current.src = nextTrackAudioUrl;
          audioRef.current.preload = 'auto';
          
          const handleFallbackCanPlay = () => {
            if (audioRef.current) {
              audioRef.current.play().catch(console.error);
            }
            audioRef.current?.removeEventListener('canplay', handleFallbackCanPlay);
          };
          
          audioRef.current.addEventListener('canplay', handleFallbackCanPlay);
        }
      }
    }
    
    setIsPlaying(true);
  }, [queue, currentIndex, shuffle]);

  // Auto-load track when currentIndex changes (for auto-advance)
  useEffect(() => {
    if (queue.length > 0 && currentIndex < queue.length && audioRef.current) {
      const track = queue[currentIndex];
      if (track && track.audioUrl) {
        
        // Stop current playback
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        
        // Reset flag for new track
        trackEndTriggered.current = false;
        
        // Set new track
        setCurrentTrack(track);
        setProgress(0);
        setIsBuffering(true);
        setIsStreaming(false);
        
        // Load the track
        audioRef.current.src = track.audioUrl;
        audioRef.current.preload = 'metadata';
        
        // Wait for audio to be ready before playing
        const handleCanPlay = () => {
          if (audioRef.current) {
            audioRef.current.play().catch(console.error);
          }
          audioRef.current?.removeEventListener('canplay', handleCanPlay);
        };
        
        audioRef.current.addEventListener('canplay', handleCanPlay);
      }
    }
  }, [currentIndex, queue]);

  const playTrack = useCallback(async (track: Track, startTime?: number) => {
    // Stop current playback first
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    const trackWithStartTime = startTime !== undefined ? { ...track, startTime } : track;
    
    // If we're playing a single track and there's no existing queue, create a queue with all available tracks
    if (queue.length <= 1) {
      try {
        // Get tracks from server (only uploaded tracks)
        const serverTracks = await audioService.getAllTracks();
        const trackIndex = serverTracks.findIndex(t => t.id === track.id);
        
        if (trackIndex !== -1 && serverTracks.length > 1) {
          // Create queue with all available tracks starting from the clicked track
          const newQueue = [
            ...serverTracks.slice(trackIndex),
            ...serverTracks.slice(0, trackIndex)
          ];
          setQueue(newQueue);
          setCurrentIndex(0);
        } else {
          // Fallback: just use the single track
          setQueue([trackWithStartTime]);
          setCurrentIndex(0);
        }
      } catch (error) {
        console.error('Error loading available tracks:', error);
        // Fallback: just use the single track
        setQueue([trackWithStartTime]);
        setCurrentIndex(0);
      }
    } else {
      // If there's already a queue, find the track in it and set the index
      const trackIndex = queue.findIndex(t => t.id === track.id);
      if (trackIndex !== -1) {
        setCurrentIndex(trackIndex);
      } else {
        // If track not in queue, add it and set as current
        setQueue(prev => [...prev, trackWithStartTime]);
        setCurrentIndex(queue.length);
      }
    }
    
    setCurrentTrack(trackWithStartTime);
    setProgress(0);
    setIsBuffering(true);
    setIsStreaming(false);
    trackEndTriggered.current = false; // Reset the flag for new track
    
    const trackAudioUrl = track.audioUrl;
    if (audioRef.current && trackAudioUrl) {
      try {
        // Always compute a fresh streaming URL
        const finalUrl: string = await audioService.getStreamingUrl(trackAudioUrl);
        // Update track with streaming URL
        const updatedTrack = { 
          ...trackWithStartTime, 
          hdAudioUrl: finalUrl, 
          isHD: true 
        };
        setCurrentTrack(updatedTrack);
        
        // Set the new source
        audioRef.current.src = finalUrl;
        audioRef.current.preload = 'metadata';
        
        // Wait for the audio to be ready before playing
        const handleCanPlay = () => {
          if (audioRef.current) {
            if (startTime !== undefined) {
              audioRef.current.currentTime = startTime;
            }
            // Start playing once the audio is ready
            audioRef.current.play().catch(console.error);
          }
          audioRef.current?.removeEventListener('canplay', handleCanPlay);
        };
        
        audioRef.current.addEventListener('canplay', handleCanPlay);
        
        // Also handle metadata loaded for seeking
        if (startTime !== undefined) {
          const seekToStartTime = () => {
            if (audioRef.current) {
              audioRef.current.currentTime = startTime;
            }
          };
          audioRef.current.addEventListener('loadedmetadata', seekToStartTime, { once: true });
        }
        
        setIsStreaming(true);
      } catch (error) {
        console.error('Error loading streaming audio:', error);
        setIsBuffering(false);
        setIsStreaming(false);
        
        // Fallback to original URL
        if (audioRef.current) {
          audioRef.current.src = trackAudioUrl;
          audioRef.current.preload = 'auto';
          
          // Wait for fallback audio to be ready
          const handleFallbackCanPlay = () => {
            if (audioRef.current) {
              audioRef.current.play().catch(console.error);
            }
            audioRef.current?.removeEventListener('canplay', handleFallbackCanPlay);
          };
          
          audioRef.current.addEventListener('canplay', handleFallbackCanPlay);
        }
      }
    }
    
    // Set playing state - the actual play will happen in the event handlers
    setIsPlaying(true);
  }, [queue]);

  const playQueue = useCallback(async (tracks: Track[], startIndex: number = 0, source?: string) => {
    if (tracks.length === 0) return;
    
    // Stop current playback first
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    setQueue(tracks);
    setCurrentIndex(startIndex);
    if (source) setQueueSource(source);
    setProgress(0);
    setIsBuffering(true);
    setIsStreaming(false);
    trackEndTriggered.current = false; // Reset the flag for new track
    
    const startTrack = tracks[startIndex];
    const startTrackAudioUrl = startTrack.audioUrl;
    
    if (audioRef.current && startTrackAudioUrl) {
      try {
        // Always compute a fresh streaming URL
        const finalUrl: string = await audioService.getStreamingUrl(startTrackAudioUrl);
        
        // Update the track with HD information
        const updatedTrack = { 
          ...startTrack, 
          hdAudioUrl: finalUrl, 
          isHD: true 
        };
        
        // Update the track in the queue
        setQueue(prev => prev.map((track, index) => 
          index === startIndex ? updatedTrack : track
        ));
        
        setCurrentTrack(updatedTrack);
        
        audioRef.current.src = finalUrl;
        audioRef.current.preload = 'metadata';
        
        // Wait for audio to be ready before playing
        const handleCanPlay = () => {
          if (audioRef.current) {
            audioRef.current.play().catch(console.error);
          }
          audioRef.current?.removeEventListener('canplay', handleCanPlay);
        };
        
        audioRef.current.addEventListener('canplay', handleCanPlay);
        setIsStreaming(true);
      } catch (error) {
        console.error('Error loading queue track:', error);
        setIsBuffering(false);
        setIsStreaming(false);
        
        // Fallback to original URL
        if (audioRef.current) {
          audioRef.current.src = startTrackAudioUrl;
          audioRef.current.preload = 'auto';
          
          const handleFallbackCanPlay = () => {
            if (audioRef.current) {
              audioRef.current.play().catch(console.error);
            }
            audioRef.current?.removeEventListener('canplay', handleFallbackCanPlay);
          };
          
          audioRef.current.addEventListener('canplay', handleFallbackCanPlay);
        }
      }
    }
    
    setIsPlaying(true);
  }, []);

  // React to likes list changes if the active queue is from liked songs
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event: any) => {
      if (event?.type === 'invalidated') {
        const keyArr = event?.query?.queryKey as unknown as string[] | undefined;
        if (Array.isArray(keyArr) && keyArr.join('/') === '/api/likes/current-user' && queueSource === 'liked') {
          (async () => {
            try {
              const res = await fetch('/api/likes/current-user');
              if (!res.ok) return;
              const data = await res.json();
              const likedTracks: Track[] = data.tracks || [];
              setQueue((prev) => {
                // Preserve currentTrack if still present, and update index
                setCurrentIndex((oldIdx) => {
                  const currentId = currentTrack?.id;
                  if (currentId) {
                    const newIdx = likedTracks.findIndex(t => t.id === currentId);
                    return newIdx >= 0 ? newIdx : Math.min(oldIdx, Math.max(0, likedTracks.length - 1));
                  }
                  return Math.min(oldIdx, Math.max(0, likedTracks.length - 1));
                });
                return likedTracks;
              });
            } catch {}
          })();
        }
      }
    });
    const onLikesUpdated = (e: any) => {
      if (queueSource === 'liked') {
        const { liked, trackId } = e.detail || {};
        if (liked === false) {
          // Remove unliked track from the playing queue immediately
          setQueue(prev => prev.filter(t => t.id !== trackId));
          // Adjust index if needed
          setCurrentIndex(idx => Math.min(idx, Math.max(0, (queue.length - 2))));
        }
      }
    };
    window.addEventListener('likes:updated', onLikesUpdated);
    return () => { unsubscribe(); window.removeEventListener('likes:updated', onLikesUpdated); };
  }, [queueSource, currentTrack?.id]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const previousTrack = useCallback(async () => {
    if (queue.length === 0) return;

    if (progress > 10) {
      setProgress(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      return;
    }

    const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
    
    // Stop current playback first
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setCurrentIndex(prevIndex);
    setProgress(0);
    setIsBuffering(true);
    setIsStreaming(false);
    trackEndTriggered.current = false; // Reset the flag for new track
    
    const prevTrack = queue[prevIndex];
    const prevTrackAudioUrl = prevTrack.audioUrl;
    
    if (audioRef.current && prevTrackAudioUrl) {
      try {
        // Always compute a fresh streaming URL
        const finalUrl: string = await audioService.getStreamingUrl(prevTrackAudioUrl);
        
        // Update the track with HD information
        const updatedTrack = { 
          ...prevTrack, 
          hdAudioUrl: finalUrl, 
          isHD: true 
        };
        
        // Update the track in the queue
        setQueue(prev => prev.map((track, index) => 
          index === prevIndex ? updatedTrack : track
        ));
        
        setCurrentTrack(updatedTrack);
        
        audioRef.current.src = finalUrl;
        audioRef.current.preload = 'metadata';
        
        // Wait for audio to be ready before playing
        const handleCanPlay = () => {
          if (audioRef.current) {
            audioRef.current.play().catch(console.error);
          }
          audioRef.current?.removeEventListener('canplay', handleCanPlay);
        };
        
        audioRef.current.addEventListener('canplay', handleCanPlay);
        setIsStreaming(true);
      } catch (error) {
        console.error('Error loading previous track:', error);
        setIsBuffering(false);
        setIsStreaming(false);
        
        // Fallback to original URL
        if (audioRef.current) {
          audioRef.current.src = prevTrackAudioUrl;
          audioRef.current.preload = 'auto';
          
          const handleFallbackCanPlay = () => {
            if (audioRef.current) {
              audioRef.current.play().catch(console.error);
            }
            audioRef.current?.removeEventListener('canplay', handleFallbackCanPlay);
          };
          
          audioRef.current.addEventListener('canplay', handleFallbackCanPlay);
        }
      }
    }
    
    setIsPlaying(true);
  }, [queue, currentIndex, progress]);

  const seekTo = useCallback((position: number) => {
    setProgress(position);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (position / 100) * audioRef.current.duration;
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeat(prev => !prev);
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, track]);
  }, []);

  const value = {
    currentTrack,
    queue,
    isPlaying,
    progress,
    volume,
    shuffle,
    repeat,
    duration,
    isBuffering,
    isStreaming,
    playTrack,
    playQueue,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seekTo,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    addToQueue,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return context;
}
