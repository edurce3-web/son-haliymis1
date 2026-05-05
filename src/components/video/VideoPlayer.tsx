import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ReactPlayer from 'react-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings,
  SkipBack,
  SkipForward,
  RotateCcw,
  PictureInPicture,
  Minimize,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  url: string;
  title?: string;
  onProgress?: (progress: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
  onEnded?: () => void;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  qualities?: { label: string; url: string }[];
  onQualityChange?: (quality: string) => void;
  thumbnail?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  title,
  onProgress,
  onEnded,
  className,
  autoPlay = false,
  controls = true,
  qualities = [],
  onQualityChange,
  thumbnail
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [playing, setPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [pictureInPicture, setPictureInPicture] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState(qualities[0]?.label || 'Auto');
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlayPause = useCallback(() => {
    setPlaying(!playing);
  }, [playing]);

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0]);
    setMuted(value[0] === 0);
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted(!muted);
  }, [muted]);

  const handleSeekChange = useCallback((value: number[]) => {
    setPlayed(value[0]);
    if (playerRef.current) {
      playerRef.current.seekTo(value[0]);
    }
  }, []);

  const handleProgress = useCallback((progress: any) => {
    setPlayed(progress.played);
    setLoaded(progress.loaded);
    onProgress?.(progress);
  }, [onProgress]);

  const handleDuration = useCallback((duration: number) => {
    setDuration(duration);
  }, []);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate);
  }, []);

  const handleSkipBackward = useCallback(() => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(Math.max(0, currentTime - 10));
    }
  }, []);

  const handleSkipForward = useCallback(() => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(Math.min(duration, currentTime + 10));
    }
  }, [duration]);

  const formatTime = useMemo(() => (seconds: number) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  }, []);

  const togglePictureInPicture = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setPictureInPicture(false);
      } else if (playerRef.current?.getInternalPlayer()?.requestPictureInPicture) {
        await playerRef.current.getInternalPlayer().requestPictureInPicture();
        setPictureInPicture(true);
      }
    } catch (error) {
      console.error('Picture-in-Picture error:', error);
    }
  }, []);

  const handleQualityChange = useCallback((quality: string) => {
    setSelectedQuality(quality);
    const selectedQualityData = qualities.find(q => q.label === quality);
    if (selectedQualityData && onQualityChange) {
      onQualityChange(selectedQualityData.url);
    }
  }, [qualities, onQualityChange]);

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) {
        setShowControls(false);
      }
    }, 3000);
  }, [playing]);

  const handleMouseMove = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!containerRef.current?.contains(document.activeElement)) return;
    
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        handlePlayPause();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        handleSkipBackward();
        break;
      case 'ArrowRight':
        e.preventDefault();
        handleSkipForward();
        break;
      case 'ArrowUp':
        e.preventDefault();
        setVolume(prev => Math.min(1, prev + 0.1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setVolume(prev => Math.max(0, prev - 0.1));
        break;
      case 'KeyM':
        e.preventDefault();
        handleToggleMute();
        break;
      case 'KeyF':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'KeyP':
        e.preventDefault();
        togglePictureInPicture();
        break;
    }
  }, [handlePlayPause, handleSkipBackward, handleSkipForward, handleToggleMute, toggleFullscreen, togglePictureInPicture]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };

    const handlePictureInPictureChange = () => {
      setPictureInPicture(!!document.pictureInPictureElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('enterpictureinpicture', handlePictureInPictureChange);
    document.addEventListener('leavepictureinpicture', handlePictureInPictureChange);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('enterpictureinpicture', handlePictureInPictureChange);
      document.removeEventListener('leavepictureinpicture', handlePictureInPictureChange);
      document.removeEventListener('keydown', handleKeyDown);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [handleKeyDown]);

  useEffect(() => {
    resetControlsTimeout();
  }, [playing, resetControlsTimeout]);

  return (
    <Card className={cn('relative overflow-hidden bg-black focus-within:ring-2 focus-within:ring-primary', className)}>
      <CardContent className="p-0">
        <div 
          ref={containerRef}
          className="relative group focus:outline-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setShowControls(false)}
          tabIndex={0}
          role="application"
          aria-label={`Video player${title ? `: ${title}` : ''}`}
        >
          {title && (
            <div className="absolute top-4 left-4 z-20">
              <Badge className="bg-black/70 text-white border-0 backdrop-blur-sm">
                {title}
              </Badge>
            </div>
          )}

          {/* Keyboard shortcuts help */}
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
              Space: Play/Pause • ←→: Skip • ↑↓: Volume • F: Fullscreen • M: Mute
            </div>
          </div>

          {React.createElement(ReactPlayer as any, {
            ref: playerRef,
            url: url,
            playing: playing,
            volume: muted ? 0 : volume,
            playbackRate: playbackRate,
            width: "100%",
            height: "100%",
            onProgress: handleProgress,
            onDuration: handleDuration,
            onEnded: onEnded,
            onBuffer: () => setBuffering(true),
            onBufferEnd: () => setBuffering(false),
            onError: (error: any) => setError(error?.message || 'Video playback error'),
            controls: false,
            style: { aspectRatio: '16/9' },
            config: thumbnail ? {
              file: {
                attributes: {
                  poster: thumbnail,
                  preload: 'metadata'
                }
              }
            } : {}
          })}

          {/* Custom Controls */}
          {controls && (
            <div 
              className={cn(
                'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300',
                showControls ? 'opacity-100' : 'opacity-0'
              )}
            >
              {/* Progress Bar */}
              <div className="mb-4 space-y-2">
                <div className="relative">
                  <Slider
                    value={[played]}
                    max={1}
                    step={0.01}
                    onValueChange={handleSeekChange}
                    className="w-full"
                    aria-label="Video progress"
                  />
                  {/* Buffer progress */}
                  <div 
                    className="absolute top-1/2 left-0 h-1 bg-white/30 rounded-full -translate-y-1/2 pointer-events-none"
                    style={{ width: `${loaded * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/70">
                  <span>{formatTime(played * duration)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkipBackward}
                    className="text-white hover:bg-white/20 transition-all duration-200"
                    aria-label="10 saniye geri sar"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePlayPause}
                    className="text-white hover:bg-white/20 transition-all duration-200 hover:scale-110"
                    aria-label={playing ? 'Duraklat' : 'Oynat'}
                  >
                    {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkipForward}
                    className="text-white hover:bg-white/20 transition-all duration-200"
                    aria-label="10 saniye ileri sar"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleMute}
                      className="text-white hover:bg-white/20 transition-all duration-200"
                      aria-label={muted ? 'Sesi aç' : 'Sesi kapat'}
                    >
                      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Slider
                      value={[muted ? 0 : volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="w-20"
                      aria-label="Ses seviyesi"
                    />
                    <span className="text-xs text-white/70 min-w-[3ch]">
                      {Math.round((muted ? 0 : volume) * 100)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Quality Selection */}
                  {qualities.length > 0 && (
                    <select
                      value={selectedQuality}
                      onChange={(e) => handleQualityChange(e.target.value)}
                      className="bg-transparent text-white text-sm border border-white/30 rounded px-2 py-1 hover:bg-white/10 transition-colors"
                      aria-label="Video kalitesi"
                    >
                      {qualities.map((quality) => (
                        <option key={quality.label} value={quality.label} className="bg-black">
                          {quality.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Playback Speed */}
                  <select
                    value={playbackRate}
                    onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
                    className="bg-transparent text-white text-sm border border-white/30 rounded px-2 py-1 hover:bg-white/10 transition-colors"
                    aria-label="Oynatma hızı"
                  >
                    <option value={0.5} className="bg-black">0.5x</option>
                    <option value={0.75} className="bg-black">0.75x</option>
                    <option value={1} className="bg-black">1x</option>
                    <option value={1.25} className="bg-black">1.25x</option>
                    <option value={1.5} className="bg-black">1.5x</option>
                    <option value={2} className="bg-black">2x</option>
                  </select>

                  {/* Picture in Picture */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePictureInPicture}
                    className="text-white hover:bg-white/20 transition-all duration-200"
                    aria-label="Resim içinde resim"
                  >
                    <PictureInPicture className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20 transition-all duration-200"
                    aria-label={fullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
                  >
                    {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Loading/Buffering Overlay */}
          {(loaded < 0.1 || buffering) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
                <span className="text-white text-sm">
                  {buffering ? 'Yükleniyor...' : 'Video hazırlanıyor...'}
                </span>
              </div>
            </div>
          )}

          {/* Error Overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="flex flex-col items-center space-y-4 text-center p-6">
                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-white font-medium">Video Oynatma Hatası</h3>
                  <p className="text-white/70 text-sm max-w-md">{error}</p>
                </div>
                <Button
                  onClick={() => {
                    setError(null);
                    if (playerRef.current) {
                      playerRef.current.seekTo(0);
                    }
                  }}
                  variant="outline"
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Tekrar Dene
                </Button>
              </div>
            </div>
          )}

          {/* Center Play Button */}
          {!playing && !buffering && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                onClick={handlePlayPause}
                variant="ghost"
                size="lg"
                className="w-16 h-16 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110"
                aria-label="Videoyu oynat"
              >
                <Play className="w-8 h-8 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
