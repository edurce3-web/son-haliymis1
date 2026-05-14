import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Bookmark,
  StickyNote,
  Download,
  Share2,
  Clock,
  Edit3,
  Trash2,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Star,
  Flag
} from 'lucide-react';
import { toast } from 'sonner';

interface VideoNote {
  note_id: number;
  timestamp: number;
  content: string;
  created_at: string;
  updated_at: string;
}

interface VideoBookmark {
  bookmark_id: number;
  timestamp: number;
  title: string;
  description?: string;
  created_at: string;
}

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  lessonId: number;
  courseId: number;
  duration: number;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export const EnhancedVideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  title,
  lessonId,
  courseId,
  duration,
  onProgress,
  onComplete
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('720p');
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  // Notes and bookmarks state
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [bookmarkTitle, setBookmarkTitle] = useState('');
  const [bookmarkDescription, setBookmarkDescription] = useState('');
  const [noteTimestamp, setNoteTimestamp] = useState(0);
  const [editingNote, setEditingNote] = useState<VideoNote | null>(null);

  // Fetch notes
  const { data: notes } = useQuery({
    queryKey: ['video-notes', lessonId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/notes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    },
  });

  // Fetch bookmarks
  const { data: bookmarks } = useQuery({
    queryKey: ['video-bookmarks', lessonId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/bookmarks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    },
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (noteData: { timestamp: number; content: string }) => {
      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(noteData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-notes', lessonId] });
      setNoteContent('');
      setShowNoteDialog(false);
      toast.success('Not eklendi');
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, content }: { noteId: number; content: string }) => {
      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-notes', lessonId] });
      setEditingNote(null);
      toast.success('Not güncellendi');
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-notes', lessonId] });
      toast.success('Not silindi');
    },
  });

  // Add bookmark mutation
  const addBookmarkMutation = useMutation({
    mutationFn: async (bookmarkData: { timestamp: number; title: string; description?: string }) => {
      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(bookmarkData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-bookmarks', lessonId] });
      setBookmarkTitle('');
      setBookmarkDescription('');
      setShowBookmarkDialog(false);
      toast.success('Yer imi eklendi');
    },
  });

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (onProgress) {
        onProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onComplete) {
        onComplete();
      }
    };

    const handleLoadStart = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [onProgress, onComplete]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyN':
          e.preventDefault();
          if (e.ctrlKey) {
            openNoteDialog();
          }
          break;
        case 'KeyB':
          e.preventDefault();
          if (e.ctrlKey) {
            openBookmarkDialog();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return;
    const time = (value[0] / 100) * duration;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return;
    const vol = value[0] / 100;
    videoRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const skipBackward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, currentTime - 10);
  };

  const skipForward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(duration, currentTime + 10);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const changePlaybackRate = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const openNoteDialog = () => {
    setNoteTimestamp(currentTime);
    setShowNoteDialog(true);
  };

  const openBookmarkDialog = () => {
    setNoteTimestamp(currentTime);
    setShowBookmarkDialog(true);
  };

  const jumpToTimestamp = (timestamp: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = timestamp;
    setCurrentTime(timestamp);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleEditNote = (note: VideoNote) => {
    setEditingNote(note);
    setNoteContent(note.content);
  };

  const saveEditedNote = () => {
    if (!editingNote) return;
    updateNoteMutation.mutate({
      noteId: editingNote.note_id,
      content: noteContent
    });
  };

  return (
    <div className="w-full">
      <div 
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full aspect-video"
          onClick={togglePlay}
        />

        {/* Loading Spinner */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}

        {/* Video Controls */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          {/* Progress Bar */}
          <div className="mb-4">
            <Slider
              value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
              onValueChange={handleSeek}
              className="w-full"
              step={0.1}
            />
            <div className="flex justify-between text-xs text-white/70 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={skipBackward}
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={skipForward}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="w-4 h-4" />
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
                <div className="w-20">
                  <Slider
                    value={[isMuted ? 0 : volume * 100]}
                    onValueChange={handleVolumeChange}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Notes Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={openNoteDialog}
                className="text-white hover:bg-white/20"
                title="Not Ekle (Ctrl+N)"
              >
                <StickyNote className="w-4 h-4" />
              </Button>

              {/* Bookmark Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={openBookmarkDialog}
                className="text-white hover:bg-white/20"
                title="Yer İmi Ekle (Ctrl+B)"
              >
                <Bookmark className="w-4 h-4" />
              </Button>

              {/* Settings */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Oynatma Hızı</label>
                      <div className="grid grid-cols-4 gap-1 mt-1">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <Button
                            key={rate}
                            variant={playbackRate === rate ? "default" : "outline"}
                            size="sm"
                            onClick={() => changePlaybackRate(rate)}
                            className="text-xs"
                          >
                            {rate}x
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Kalite</label>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        {['360p', '720p', '1080p'].map((q) => (
                          <Button
                            key={q}
                            variant={quality === q ? "default" : "outline"}
                            size="sm"
                            onClick={() => setQuality(q)}
                            className="text-xs"
                          >
                            {q}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

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

        {/* Video Title Overlay */}
        <div className={`absolute top-4 left-4 right-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <h3 className="text-white text-lg font-semibold bg-black/50 px-3 py-1 rounded">
            {title}
          </h3>
        </div>
      </div>

      {/* Notes and Bookmarks Panel */}
      <div className="mt-6">
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notes">
              Notlarım ({notes?.items?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="bookmarks">
              Yer İmleri ({bookmarks?.items?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardContent className="p-4">
                {notes?.items?.length > 0 ? (
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {notes.items.map((note: VideoNote) => (
                        <div key={note.note_id} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => jumpToTimestamp(note.timestamp)}
                              className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTime(note.timestamp)}
                            </Button>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditNote(note)}
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNoteMutation.mutate(note.note_id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          {editingNote?.note_id === note.note_id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                className="min-h-[60px]"
                              />
                              <div className="flex space-x-2">
                                <Button size="sm" onClick={saveEditedNote}>
                                  <Save className="w-3 h-3 mr-1" />
                                  Kaydet
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingNote(null)}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  İptal
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-700">{note.content}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(note.created_at).toLocaleString('tr-TR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <StickyNote className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Henüz not eklenmemiş</p>
                    <p className="text-sm">Video izlerken Ctrl+N ile not ekleyebilirsiniz</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookmarks" className="mt-4">
            <Card>
              <CardContent className="p-4">
                {bookmarks?.items?.length > 0 ? (
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {bookmarks.items.map((bookmark: VideoBookmark) => (
                        <div key={bookmark.bookmark_id} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{bookmark.title}</h4>
                              {bookmark.description && (
                                <p className="text-xs text-gray-600 mt-1">{bookmark.description}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => jumpToTimestamp(bookmark.timestamp)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTime(bookmark.timestamp)}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(bookmark.created_at).toLocaleString('tr-TR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Bookmark className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Henüz yer imi eklenmemiş</p>
                    <p className="text-sm">Video izlerken Ctrl+B ile yer imi ekleyebilirsiniz</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Not Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Zaman: {formatTime(noteTimestamp)}</span>
            </div>
            <Textarea
              placeholder="Notunuzu buraya yazın..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                İptal
              </Button>
              <Button 
                onClick={() => addNoteMutation.mutate({ timestamp: noteTimestamp, content: noteContent })}
                disabled={!noteContent.trim() || addNoteMutation.isPending}
              >
                {addNoteMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Bookmark Dialog */}
      <Dialog open={showBookmarkDialog} onOpenChange={setShowBookmarkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yer İmi Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Zaman: {formatTime(noteTimestamp)}</span>
            </div>
            <Input
              placeholder="Yer imi başlığı"
              value={bookmarkTitle}
              onChange={(e) => setBookmarkTitle(e.target.value)}
            />
            <Textarea
              placeholder="Açıklama (isteğe bağlı)"
              value={bookmarkDescription}
              onChange={(e) => setBookmarkDescription(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBookmarkDialog(false)}>
                İptal
              </Button>
              <Button 
                onClick={() => addBookmarkMutation.mutate({ 
                  timestamp: noteTimestamp, 
                  title: bookmarkTitle,
                  description: bookmarkDescription || undefined
                })}
                disabled={!bookmarkTitle.trim() || addBookmarkMutation.isPending}
              >
                {addBookmarkMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};