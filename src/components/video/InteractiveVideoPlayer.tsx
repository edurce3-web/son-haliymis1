import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { API_BASE_URL } from '@/lib/api';
import {
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings, 
  Bookmark, 
  MessageCircle, 
  StickyNote,
  Clock,
  Download,
  Share2,
  ThumbsUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface VideoBookmark {
  bookmark_id: number;
  timestamp_seconds: number;
  note: string;
  created_at: string;
}

interface VideoComment {
  comment_id: number;
  user_id: number;
  user_name: string;
  timestamp_seconds: number;
  comment_text: string;
  is_instructor_reply: boolean;
  likes_count: number;
  created_at: string;
  replies?: VideoComment[];
}

interface VideoNote {
  note_id: number;
  timestamp_seconds: number;
  note_text: string;
  created_at: string;
  updated_at: string;
}

interface InteractiveVideoPlayerProps {
  videoId: number;
  videoUrl: string;
  title: string;
  duration: number;
  userId: number;
  onProgress?: (progress: number) => void;
}

export default function InteractiveVideoPlayer({
  videoId,
  videoUrl,
  title,
  duration,
  userId,
  onProgress
}: InteractiveVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState('720p');
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Interactive features
  const [bookmarks, setBookmarks] = useState<VideoBookmark[]>([]);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState('notes');

  useEffect(() => {
    fetchVideoData();
    const video = videoRef.current;
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, []);

  const fetchVideoData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [bookmarksRes, commentsRes, notesRes] = await Promise.all([
        fetch(`/api/videos/${videoId}/bookmarks`, { headers }),
        fetch(`/api/videos/${videoId}/comments`, { headers }),
        fetch(`/api/videos/${videoId}/notes`, { headers })
      ]);

      const bookmarksData = await bookmarksRes.json();
      const commentsData = await commentsRes.json();
      const notesData = await notesRes.json();

      setBookmarks(bookmarksData.bookmarks || []);
      setComments(commentsData.comments || []);
      setNotes(notesData.notes || []);
    } catch (error) {
      console.error('Error fetching video data:', error);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
      const progress = (video.currentTime / video.duration) * 100;
      onProgress?.(progress);
      
      // Track analytics
      trackVideoAnalytics(video.currentTime, progress);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(0);
    }
  };

  const trackVideoAnalytics = async (watchTime: number, completionPercentage: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/videos/analytics', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoId,
          userId,
          watchTime: Math.floor(watchTime),
          completionPercentage: Math.round(completionPercentage),
          playbackSpeed,
          qualityUsed: quality,
          deviceType: 'desktop'
        })
      });
    } catch (error) {
      console.error('Error tracking analytics:', error);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSpeedChange = (speed: number) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
      setCurrentTime(time);
    }
  };

  const addBookmark = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/videos/bookmarks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoId,
          userId,
          timestampSeconds: Math.floor(currentTime),
          note: `Bookmark at ${formatTime(currentTime)}`
        })
      });

      if (response.ok) {
        fetchVideoData();
      }
    } catch (error) {
      console.error('Error adding bookmark:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/videos/comments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoId,
          userId,
          timestampSeconds: Math.floor(currentTime),
          commentText: newComment
        })
      });

      if (response.ok) {
        setNewComment('');
        fetchVideoData();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/videos/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoId,
          userId,
          timestampSeconds: Math.floor(currentTime),
          noteText: newNote,
          isPrivate: true
        })
      });

      if (response.ok) {
        setNewNote('');
        fetchVideoData();
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (video) {
      if (!isFullscreen) {
        video.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Video Player */}
      <div className={`relative bg-black rounded-lg overflow-hidden ${showSidebar ? 'flex-1' : 'w-full'}`}>
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
        
        {/* Video Controls */}
        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-600 rounded-full h-1 cursor-pointer">
                <div 
                  className="bg-blue-500 h-1 rounded-full relative"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
              </div>
              {/* Bookmarks on progress bar */}
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.bookmark_id}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full transform -translate-y-1/2 cursor-pointer"
                  style={{ left: `${(bookmark.timestamp_seconds / duration) * 100}%` }}
                  onClick={() => seekTo(bookmark.timestamp_seconds)}
                  title={bookmark.note}
                />
              ))}
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20"
                  />
                </div>

                <span className="text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Speed Control */}
                <select
                  value={playbackSpeed}
                  onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                  className="bg-black/50 text-white text-sm rounded px-2 py-1"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>

                {/* Quality Control */}
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="bg-black/50 text-white text-sm rounded px-2 py-1"
                >
                  <option value="480p">480p</option>
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                </select>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addBookmark}
                  className="text-white hover:bg-white/20"
                  title="Add Bookmark"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="text-white hover:bg-white/20"
                >
                  {showSidebar ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Sidebar */}
      {showSidebar && (
        <div className="w-80 bg-white border rounded-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="notes">Notlar</TabsTrigger>
              <TabsTrigger value="comments">Yorumlar</TabsTrigger>
              <TabsTrigger value="bookmarks">İşaretler</TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="h-[calc(100%-40px)] flex flex-col">
              <div className="p-4 border-b">
                <Textarea
                  placeholder="Yeni not ekle..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="mb-2"
                />
                <Button onClick={addNote} size="sm" className="w-full">
                  <StickyNote className="h-4 w-4 mr-2" />
                  Not Ekle ({formatTime(currentTime)})
                </Button>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {notes.map((note) => (
                    <Card key={note.note_id} className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer"
                          onClick={() => seekTo(note.timestamp_seconds)}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(note.timestamp_seconds)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{note.note_text}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(note.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="comments" className="h-[calc(100%-40px)] flex flex-col">
              <div className="p-4 border-b">
                <Textarea
                  placeholder="Yorum yaz..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-2"
                />
                <Button onClick={addComment} size="sm" className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Yorum Yap ({formatTime(currentTime)})
                </Button>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <Card key={comment.comment_id} className="p-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {comment.user_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{comment.user_name}</span>
                            <Badge 
                              variant="outline" 
                              size="sm"
                              className="cursor-pointer"
                              onClick={() => seekTo(comment.timestamp_seconds)}
                            >
                              {formatTime(comment.timestamp_seconds)}
                            </Badge>
                            {comment.is_instructor_reply && (
                              <Badge variant="secondary" size="sm">Eğitmen</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">{comment.comment_text}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button variant="ghost" size="sm" className="h-6 px-2">
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              {comment.likes_count}
                            </Button>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="bookmarks" className="h-[calc(100%-40px)]">
              <ScrollArea className="h-full p-4">
                <div className="space-y-3">
                  {bookmarks.map((bookmark) => (
                    <Card key={bookmark.bookmark_id} className="p-3 cursor-pointer hover:bg-gray-50"
                          onClick={() => seekTo(bookmark.timestamp_seconds)}>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">
                          <Bookmark className="h-3 w-3 mr-1" />
                          {formatTime(bookmark.timestamp_seconds)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{bookmark.note}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(bookmark.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
