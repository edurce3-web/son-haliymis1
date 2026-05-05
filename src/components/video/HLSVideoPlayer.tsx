import React, { useRef, useState, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    Settings,
    SkipForward,
    SkipBack,
    PictureInPicture2,
    Loader2
} from 'lucide-react';

interface QualityLevel {
    index: number;
    height: number;
    width: number;
    bitrate: number;
    label: string;
}

interface HLSVideoPlayerProps {
    src: string;
    videoType?: 'hls' | 'mp4' | 'hls-proxy' | null;
    poster?: string;
    onEnded?: () => void;
    onTimeUpdate?: (currentTime: number, duration: number) => void;
    autoPlay?: boolean;
    title?: string;
}

const HLSVideoPlayer: React.FC<HLSVideoPlayerProps> = ({
    src,
    videoType = 'hls',
    poster,
    onEnded,
    onTimeUpdate,
    autoPlay = false,
    title
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<any>(null);

    // Player state
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Quality & Settings
    const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
    const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = auto
    const [showSettings, setShowSettings] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'main' | 'quality' | 'speed'>('main');
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    // HLS Setup
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        const destroyHls = () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };

        destroyHls();
        setError(null);
        setIsLoading(true);
        setQualityLevels([]);
        setCurrentQuality(-1);

        if (videoType === 'hls' || videoType === 'hls-proxy') {
            if (Hls.isSupported()) {
                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: false,
                    maxBufferLength: 30,
                    maxMaxBufferLength: 60,
                    startLevel: -1, // auto
                    capLevelToPlayerSize: true,
                    testBandwidth: true,
                });

                hls.loadSource(src);
                hls.attachMedia(video);

                hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
                    const levels: QualityLevel[] = data.levels.map((level, index) => ({
                        index,
                        height: level.height,
                        width: level.width,
                        bitrate: level.bitrate,
                        label: `${level.height}p`
                    }));

                    // Düşükten yükseğe sırala
                    levels.sort((a, b) => a.height - b.height);
                    setQualityLevels(levels);
                    setIsLoading(false);

                    if (autoPlay) {
                        video.play().catch(() => { });
                    }
                });

                hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
                    // Eğer auto modda ise, aktif seviyeyi UI'da göster
                    if (hls.autoLevelEnabled) {
                        setCurrentQuality(-1);
                    }
                });

                hls.on(Hls.Events.ERROR, (_event, data) => {
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.error('HLS network error - trying to recover...');
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.error('HLS media error - trying to recover...');
                                hls.recoverMediaError();
                                break;
                            default:
                                setError('Video yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
                                destroyHls();
                                break;
                        }
                    }
                });

                hlsRef.current = hls;
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Safari native HLS
                video.src = src;
                setIsLoading(false);
            } else {
                setError('Tarayıcınız HLS video formatını desteklemiyor.');
            }
        } else {
            // MP4 fallback
            video.src = src;
            setIsLoading(false);
            if (autoPlay) {
                video.play().catch(() => { });
            }
        }

        return () => {
            destroyHls();
        };
    }, [src, videoType, autoPlay]);

    // Video event listeners
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            if (video.buffered.length > 0) {
                setBuffered(video.buffered.end(video.buffered.length - 1));
            }
            onTimeUpdate?.(video.currentTime, video.duration);
        };

        const handleDurationChange = () => setDuration(video.duration);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => {
            setIsPlaying(false);
            onEnded?.();
        };
        const handleWaiting = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('durationchange', handleDurationChange);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('canplay', handleCanPlay);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('durationchange', handleDurationChange);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('canplay', handleCanPlay);
        };
    }, [onEnded, onTimeUpdate]);

    // Controls auto-hide
    const resetControlsTimeout = useCallback(() => {
        setShowControls(true);
        clearTimeout(controlsTimeoutRef.current);
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        }
    }, [isPlaying]);

    useEffect(() => {
        if (!isPlaying) {
            setShowControls(true);
            clearTimeout(controlsTimeoutRef.current);
        } else {
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        }
        return () => clearTimeout(controlsTimeoutRef.current);
    }, [isPlaying]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const video = videoRef.current;
            if (!video) return;

            // Sadece player container'ı focus'taysa
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    video.currentTime = Math.max(0, video.currentTime - 10);
                    resetControlsTimeout();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    video.currentTime = Math.min(video.duration, video.currentTime + 10);
                    resetControlsTimeout();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setVolume(v => { const nv = Math.min(1, v + 0.1); video.volume = nv; return nv; });
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setVolume(v => { const nv = Math.max(0, v - 0.1); video.volume = nv; return nv; });
                    break;
                case 'f':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMute();
                    break;
                case 'Escape':
                    setShowSettings(false);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [resetControlsTimeout]);

    // Fullscreen change listener
    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    // Player controls
    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.play().catch(() => { });
        } else {
            video.pause();
        }
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setIsMuted(!isMuted);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video) return;
        const newVolume = parseFloat(e.target.value);
        video.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const toggleFullscreen = async () => {
        const container = containerRef.current;
        if (!container) return;
        try {
            if (!document.fullscreenElement) {
                await container.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error('Fullscreen error:', err);
        }
    };

    const togglePiP = async () => {
        const video = videoRef.current;
        if (!video) return;
        try {
            if ((document as any).pictureInPictureElement) {
                await (document as any).exitPictureInPicture();
            } else if ((video as any).requestPictureInPicture) {
                await (video as any).requestPictureInPicture();
            }
        } catch (err) {
            console.error('PiP error:', err);
        }
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const video = videoRef.current;
        const bar = progressRef.current;
        if (!video || !bar) return;
        const rect = bar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        video.currentTime = pos * video.duration;
    };

    const setQuality = (levelIndex: number) => {
        const hls = hlsRef.current;
        if (!hls) return;
        if (levelIndex === -1) {
            hls.currentLevel = -1; // auto
            setCurrentQuality(-1);
        } else {
            hls.currentLevel = levelIndex;
            setCurrentQuality(levelIndex);
        }
        setShowSettings(false);
        setSettingsTab('main');
    };

    const setSpeed = (speed: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.playbackRate = speed;
        setPlaybackSpeed(speed);
        setShowSettings(false);
        setSettingsTab('main');
    };

    const skip = (seconds: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
        resetControlsTimeout();
    };

    // Formatters
    const formatTime = (seconds: number) => {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const getQualityLabel = () => {
        if (currentQuality === -1) {
            const hls = hlsRef.current;
            if (hls && hls.currentLevel >= 0 && hls.levels[hls.currentLevel]) {
                return `Otomatik (${hls.levels[hls.currentLevel].height}p)`;
            }
            return 'Otomatik';
        }
        const level = qualityLevels.find(q => q.index === currentQuality);
        return level ? level.label : 'Otomatik';
    };

    const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

    // Error state
    if (error) {
        return (
            <div className="w-full aspect-video bg-black flex items-center justify-center text-white">
                <div className="text-center space-y-4 p-8">
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                        <Settings className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-lg font-semibold">{error}</p>
                    <button
                        onClick={() => {
                            setError(null);
                            if (videoRef.current) videoRef.current.load();
                        }}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
                    >
                        Tekrar Dene
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="relative w-full aspect-video bg-black group select-none"
            onMouseMove={resetControlsTimeout}
            onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
            onClick={(e) => {
                // Sadece video alanına tıklayınca play/pause
                const target = e.target as HTMLElement;
                if (target === videoRef.current || target.closest('.video-click-area')) {
                    togglePlay();
                    resetControlsTimeout();
                }
            }}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                className="w-full h-full video-click-area cursor-pointer"
                poster={poster}
                playsInline
                preload="auto"
            />

            {/* Loading Spinner */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                </div>
            )}

            {/* Play/Pause overlay (büyük ortadaki ikona tıklama) */}
            {!isPlaying && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-10 h-10 text-white ml-1" fill="white" />
                    </div>
                </div>
            )}

            {/* Gradient overlay for controls */}
            <div
                className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 z-30 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                style={{
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.85))'
                }}
            >
                {/* Progress Bar */}
                <div className="px-4 pt-8">
                    <div
                        ref={progressRef}
                        className="relative h-1 group/progress cursor-pointer hover:h-1.5 transition-all"
                        onClick={handleProgressClick}
                    >
                        {/* Background */}
                        <div className="absolute inset-0 bg-white/20 rounded-full" />
                        {/* Buffered */}
                        <div
                            className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
                            style={{ width: `${bufferedPercent}%` }}
                        />
                        {/* Progress */}
                        <div
                            className="absolute top-0 left-0 h-full rounded-full"
                            style={{
                                width: `${progressPercent}%`,
                                background: 'linear-gradient(90deg, #a855f7, #ec4899)'
                            }}
                        />
                        {/* Seek Thumb */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
                            style={{ left: `calc(${progressPercent}% - 7px)` }}
                        />
                    </div>
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between px-4 py-3">
                    {/* Left Controls */}
                    <div className="flex items-center gap-2">
                        {/* Play/Pause */}
                        <button
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5 text-white" fill="white" />
                            ) : (
                                <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                            )}
                        </button>

                        {/* Skip Back/Forward */}
                        <button
                            onClick={(e) => { e.stopPropagation(); skip(-10); }}
                            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                            title="10 saniye geri"
                        >
                            <SkipBack className="w-4 h-4 text-white/80" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); skip(10); }}
                            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                            title="10 saniye ileri"
                        >
                            <SkipForward className="w-4 h-4 text-white/80" />
                        </button>

                        {/* Volume */}
                        <div className="flex items-center gap-1 group/vol">
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                                className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                            >
                                {isMuted || volume === 0 ? (
                                    <VolumeX className="w-5 h-5 text-white/80" />
                                ) : (
                                    <Volume2 className="w-5 h-5 text-white/80" />
                                )}
                            </button>
                            <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full h-1 accent-white cursor-pointer"
                                    style={{
                                        background: `linear-gradient(to right, white ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%)`
                                    }}
                                />
                            </div>
                        </div>

                        {/* Time */}
                        <span className="text-white/80 text-xs font-mono ml-2 tabular-nums">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-1">
                        {/* Settings (Quality + Speed) */}
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowSettings(!showSettings);
                                    setSettingsTab('main');
                                }}
                                className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <Settings className={`w-5 h-5 text-white/80 transition-transform ${showSettings ? 'rotate-90' : ''}`} />
                            </button>

                            {/* Settings Menu */}
                            {showSettings && (
                                <div
                                    className="absolute bottom-12 right-0 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden min-w-[220px] z-50"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {settingsTab === 'main' && (
                                        <div className="py-1">
                                            <button
                                                onClick={() => setSettingsTab('quality')}
                                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors"
                                            >
                                                <span className="text-sm text-white font-medium">Kalite</span>
                                                <span className="text-xs text-white/60">{getQualityLabel()}</span>
                                            </button>
                                            <button
                                                onClick={() => setSettingsTab('speed')}
                                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors"
                                            >
                                                <span className="text-sm text-white font-medium">Oynatma Hızı</span>
                                                <span className="text-xs text-white/60">{playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`}</span>
                                            </button>
                                        </div>
                                    )}

                                    {settingsTab === 'quality' && (
                                        <div className="py-1">
                                            <button
                                                onClick={() => setSettingsTab('main')}
                                                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-white/10 transition-colors border-b border-white/5"
                                            >
                                                <span className="text-white/60 text-xs">←</span>
                                                <span className="text-sm text-white font-bold">Kalite</span>
                                            </button>

                                            {/* Auto */}
                                            <button
                                                onClick={() => setQuality(-1)}
                                                className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/10 transition-colors ${currentQuality === -1 ? 'bg-purple-500/20' : ''
                                                    }`}
                                            >
                                                <span className="text-sm text-white">Otomatik</span>
                                                {currentQuality === -1 && (
                                                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                                                )}
                                            </button>

                                            {/* Quality Levels (yüksekten düşüğe) */}
                                            {[...qualityLevels].reverse().map((level) => (
                                                <button
                                                    key={level.index}
                                                    onClick={() => setQuality(level.index)}
                                                    className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/10 transition-colors ${currentQuality === level.index ? 'bg-purple-500/20' : ''
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-white">{level.label}</span>
                                                        {level.height >= 720 && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold uppercase">
                                                                HD
                                                            </span>
                                                        )}
                                                    </div>
                                                    {currentQuality === level.index && (
                                                        <span className="w-2 h-2 rounded-full bg-purple-400" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {settingsTab === 'speed' && (
                                        <div className="py-1">
                                            <button
                                                onClick={() => setSettingsTab('main')}
                                                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-white/10 transition-colors border-b border-white/5"
                                            >
                                                <span className="text-white/60 text-xs">←</span>
                                                <span className="text-sm text-white font-bold">Oynatma Hızı</span>
                                            </button>

                                            {speedOptions.map((speed) => (
                                                <button
                                                    key={speed}
                                                    onClick={() => setSpeed(speed)}
                                                    className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/10 transition-colors ${playbackSpeed === speed ? 'bg-purple-500/20' : ''
                                                        }`}
                                                >
                                                    <span className="text-sm text-white">{speed === 1 ? 'Normal' : `${speed}x`}</span>
                                                    {playbackSpeed === speed && (
                                                        <span className="w-2 h-2 rounded-full bg-purple-400" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* PiP */}
                        <button
                            onClick={(e) => { e.stopPropagation(); togglePiP(); }}
                            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                            title="Pencere içinde pencere"
                        >
                            <PictureInPicture2 className="w-4 h-4 text-white/80" />
                        </button>

                        {/* Fullscreen */}
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                            title={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
                        >
                            {isFullscreen ? (
                                <Minimize className="w-5 h-5 text-white/80" />
                            ) : (
                                <Maximize className="w-5 h-5 text-white/80" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Current Quality Badge (sürekli gösterilen) */}
            {qualityLevels.length > 0 && showControls && (
                <div className="absolute top-4 right-4 z-30 pointer-events-none">
                    <div className="px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-sm">
                        <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">
                            {getQualityLabel()}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HLSVideoPlayer;
