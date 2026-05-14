import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Download,
  Share2,
  BookmarkPlus,
  MessageSquare,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Star,
  Flag,
  Lightbulb,
  FileText,
  Link,
  ChevronLeft,
  ChevronRight,
  PictureInPicture,
  Subtitles,
  Gauge,
  Monitor,
  Smartphone,
  Tablet,
  Loader2,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface VideoData {
  video_id: number;
  lesson_id: number;
  title: string;
  file_path: string;
  duration: number;
  thumbnail_url: string;
  subtitles?: { language: string; url: string }[];
  quality_options: { quality: string; url: string }[];
  course_title: string;
  instructor_name: string;
  next_lesson?: { id: number; title: string };
  prev_lesson?: { id: number; title: string };
}

interface Note {
  note_id: number;
  timestamp: number;
  content: string;
  created_at: string;
}

interface Bookmark {
  bookmark_id: number;
  timestamp: number;
  title: string;
  created_at: string;
}

interface VideoProgress {
  current_time: number;
  duration: number;
  completed: boolean;
  last_watched: string;
}

export const AdvancedVideoPlayer: React.FC<{
  videoId: number;
  autoplay?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}> = ({ videoId, autoplay = false, onProgress, onComplete }) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressUpdateRef = useRef<NodeJS.Timeout | null>(null);
  
  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('720p');
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('');
  
  // Learning features state
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newNote, setNewNote] = useState('');
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
  const [bookmarkTitle, setBookmarkTitle] = useState('');

  // Fetch video data
  const { data: videoData, isLoading } = useQuery({
    queryKey: ['video', videoId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/videos/${videoId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    }
  });

  // Fetch progress
  const { data: progress } = useQuery({
    queryKey: ['video-progress', videoId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/videos/${videoId}/progress`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    }
  });

  // Fetch notes and bookmarks
  const { data: notesData } = useQuery({
    queryKey: ['video-notes', videoId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/videos/${videoId}/notes`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    }
  });

  const { data: bookmarksData } = useQuery({
    queryKey: ['video-bookmarks', videoId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/videos/${videoId}/bookmarks`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    }
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ currentTime, duration }: { currentTime: number; duration: number }) => {
      const response = await fetch(`${API_BASE_URL}/videos/${videoId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ current_time: currentTime, duration })
      });
      return response.json();
    }
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async ({ timestamp, content }: { timestamp: number; content: string }) => {
      const response = await fetch(`${API_BASE_URL}/videos/${videoId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ timestamp, content })
      });
      return response.json();
    },
    onSuccess: () => {
      setNewNote('');
      setShowNoteDialog(false);
      toast.success('Not eklendi!');
    }
  });

  // Add bookmark mutation
  const addBookmarkMutation = useMutation({
    mutationFn: async ({ timestamp, title }: { timestamp: number; title: string }) => {
      const response = await fetch(`${API_BASE_URL}/videos/${videoId}/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ timestamp, title })
      });
      return response.json();
    },
    onSuccess: () => {
      setBookmarkTitle('');
      setShowBookmarkDialog(false);
      toast.success('Yer imi eklendi!');
    }
  });

  // Video event handlers
  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);
      
      // Update progress every 5 seconds
      if (progressUpdateRef.current) {
        clearTimeout(progressUpdateRef.current);
      }
      
      progressUpdateRef.current = setTimeout(() => {
        updateProgressMutation.mutate({
          currentTime: current,
          duration: videoRef.current?.duration || 0
        });
      }, 5000);

      // Call progress callback
      if (onProgress && videoRef.current.duration) {
        onProgress((current / videoRef.current.duration) * 100);
      }

      // Check if video is completed (95% watched)
      if (videoRef.current.duration && (current / videoRef.current.duration) > 0.95) {
        if (onComplete) onComplete();
      }
    }
  }, [onProgress, onComplete, updateProgressMutation]);

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const newTime = (value[0] / 100) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    if (videoRef.current) {
      try {
        if (!document.pictureInPictureElement) {
          await videoRef.current.requestPictureInPicture();
          setIsPiP(true);
        } else {
          await document.exitPictureInPicture();
          setIsPiP(false);
        }
      } catch (error) {
        toast.error('Picture-in-Picture desteklenmiyor');
      }
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const addNote = () => {
    if (newNote.trim()) {
      addNoteMutation.mutate({
        timestamp: currentTime,
        content: newNote
      });
    }
  };

  const addBookmark = () => {
    if (bookmarkTitle.trim()) {
      addBookmarkMutation.mutate({
        timestamp: currentTime,
        title: bookmarkTitle
      });
    }
  };

  const jumpToTime = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          isPlaying ? handlePause() : handlePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipTime(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipTime(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange([Math.min(100, volume * 100 + 10)]);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange([Math.max(0, volume * 100 - 10)]);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, volume]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeout);
      setShowControls(true);
      timeout = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    const handleMouseMove = () => resetTimeout();
    
    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      clearTimeout(timeout);
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [isPlaying]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-black rounded-lg">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <div 
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => !isPlaying || setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={videoData?.quality_options?.find(q => q.quality === quality)?.url}
          poster={videoData?.thumbnail_url}
          className="w-full h-auto"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
              // Resume from last position
              if (progress?.current_time) {
                videoRef.current.currentTime = progress.current_time;
              }
            }
          }}
          onWaiting={() => setIsBuffering(true)}
          onCanPlay={() => setIsBuffering(false)}
          onEnded={() => {
            setIsPlaying(false);
            if (onComplete) onComplete();
          }}
        />

        {/* Buffering indicator */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-white" />
          </div>
        )}

        {/* Play button overlay */}
        {!isPlaying && !isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              size="lg"
              className="w-20 h-20 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm"
              onClick={handlePlay}
            >
              <Play className="w-8 h-8 text-white" />
            </Button>
          </div>
        )}

        {/* Controls */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Progress bar */}
          <div className="mb-4">
            <Slider
              value={[duration ? (currentTime / duration) * 100 : 0]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-white/70 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={isPlaying ? handlePause : handlePlay}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => skipTime(-10)}
                className="text-white hover:bg-white/20"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => skipTime(10)}
                className="text-white hover:bg-white/20"
              >
                <RotateCw className="w-4 h-4" />
              </Button>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  className="w-20"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Popover open={showSettings} onOpenChange={setShowSettings}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Oynatma Hızı</label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <Button
                            key={rate}
                            variant={playbackRate === rate ? "default" : "outline"}
                            size="sm"
                            onClick={() => changePlaybackRate(rate)}
                          >
                            {rate}x
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Kalite</label>
                      <div className="space-y-2 mt-2">
                        {videoData?.quality_options?.map((option: any) => (
                          <Button
                            key={option.quality}
                            variant={quality === option.quality ? "default" : "outline"}
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => setQuality(option.quality)}
                          >
                            {option.quality}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {videoData?.subtitles && (
                      <div>
                        <label className="text-sm font-medium">Altyazı</label>
                        <div className="space-y-2 mt-2">
                          <Button
                            variant={!showSubtitles ? "default" : "outline"}
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => setShowSubtitles(false)}
                          >
                            Kapalı
                          </Button>
                          {videoData.subtitles.map((sub: any) => (
                            <Button
                              key={sub.language}
                              variant={showSubtitles && selectedSubtitle === sub.language ? "default" : "outline"}
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => {
                                setShowSubtitles(true);
                                setSelectedSubtitle(sub.language);
                              }}
                            >
                              {sub.language}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="sm"
                onClick={togglePiP}
                className="text-white hover:bg-white/20"
              >
                <PictureInPicture className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Info */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-2">{videoData?.title}</h2>
            <p className="text-gray-600 mb-4">{videoData?.course_title}</p>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Badge variant="outline">
                  {formatTime(duration)}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">1,234 görüntüleme</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Beğen
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowBookmarkDialog(true)}>
                  <BookmarkPlus className="w-4 h-4 mr-1" />
                  Yer İmi
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowNoteDialog(true)}>
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Not Al
                </Button>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>İlerleme</span>
                <span>{Math.round((currentTime / duration) * 100)}%</span>
              </div>
              <Progress value={(currentTime / duration) * 100} className="h-2" />
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              {videoData?.prev_lesson && (
                <Button variant="outline">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Önceki Ders
                </Button>
              )}
              {videoData?.next_lesson && (
                <Button>
                  Sonraki Ders
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes & Bookmarks */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="notes">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="notes">Notlar</TabsTrigger>
                <TabsTrigger value="bookmarks">Yer İmleri</TabsTrigger>
              </TabsList>
              
              <TabsContent value="notes" className="space-y-4">
                <ScrollArea className="h-64">
                  {notesData?.map((note: Note) => (
                    <div key={note.note_id} className="p-3 bg-gray-50 rounded-lg mb-2">
                      <div className="flex justify-between items-start mb-2">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => jumpToTime(note.timestamp)}
                          className="p-0 h-auto text-blue-600"
                        >
                          {formatTime(note.timestamp)}
                        </Button>
                      </div>
                      <p className="text-sm">{note.content}</p>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="bookmarks" className="space-y-4">
                <ScrollArea className="h-64">
                  {bookmarksData?.map((bookmark: Bookmark) => (
                    <div key={bookmark.bookmark_id} className="p-3 bg-gray-50 rounded-lg mb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm">{bookmark.title}</h4>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => jumpToTime(bookmark.timestamp)}
                            className="p-0 h-auto text-blue-600"
                          >
                            {formatTime(bookmark.timestamp)}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Note Dialog */}
      {showNoteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Not Ekle</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowNoteDialog(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Zaman: {formatTime(currentTime)}
                </div>
                <Textarea
                  placeholder="Notunuzu yazın..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                    İptal
                  </Button>
                  <Button onClick={addNote} disabled={!newNote.trim()}>
                    Kaydet
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bookmark Dialog */}
      {showBookmarkDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Yer İmi Ekle</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowBookmarkDialog(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Zaman: {formatTime(currentTime)}
                </div>
                <Input
                  placeholder="Yer imi başlığı..."
                  value={bookmarkTitle}
                  onChange={(e) => setBookmarkTitle(e.target.value)}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowBookmarkDialog(false)}>
                    İptal
                  </Button>
                  <Button onClick={addBookmark} disabled={!bookmarkTitle.trim()}>
                    Kaydet
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
