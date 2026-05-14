import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Smile,
  Image,
  Paperclip,
  MoreVertical,
  Users,
  Crown,
  Shield,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  ThumbsUp,
  Heart,
  Laugh,
  AlertCircle,
  Flag,
  Copy,
  Trash2,
  Pin,
  Reply,
  Settings,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Search,
  Filter,
  Download,
  Upload,
  FileText,
  X,
  Clock,
  Eye,
  EyeOff,
  Zap,
  Star,
  MessageSquare,
  TrendingUp,
  Palette,
  Moon,
  Sun,
  Type,
  CheckCircle,
  XCircle,
  Loader2,
  Ban,
  UserX,
  Megaphone,
  Camera,
  Mic2
} from 'lucide-react';
import { toast } from 'sonner';
import { WS_BASE_URL } from '@/lib/api';

interface ChatMessage {
  message_id: string;
  user_id: number;
  username: string;
  full_name: string;
  avatar_url?: string;
  role: 'student' | 'instructor' | 'moderator';
  message: string;
  message_type: 'text' | 'image' | 'file' | 'system' | 'reaction' | 'announcement';
  timestamp: string;
  reactions?: { [emoji: string]: number };
  reply_to?: string;
  is_pinned?: boolean;
  is_deleted?: boolean;
  is_edited?: boolean;
  edited_at?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  delivery_status?: 'sending' | 'sent' | 'delivered' | 'failed';
  is_private?: boolean;
  mentioned_users?: number[];
}

interface LiveClassParticipant {
  user_id: number;
  username: string;
  full_name: string;
  avatar_url?: string;
  role: 'student' | 'instructor' | 'moderator';
  is_online: boolean;
  has_mic: boolean;
  has_video: boolean;
  hand_raised: boolean;
  joined_at: string;
  is_typing?: boolean;
  is_muted?: boolean;
  is_banned?: boolean;
  last_activity?: string;
  message_count?: number;
  engagement_score?: number;
}

interface LiveClassChatProps {
  classId: number;
  isInstructor?: boolean;
  onParticipantUpdate?: (participants: LiveClassParticipant[]) => void;
  theme?: 'light' | 'dark' | 'auto';
  maxFileSize?: number;
  allowedFileTypes?: string[];
  enableAnalytics?: boolean;
}

export const LiveClassChat: React.FC<LiveClassChatProps> = ({
  classId,
  isInstructor = false,
  onParticipantUpdate,
  theme = 'light',
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedFileTypes = ['image/*', '.pdf', '.doc', '.docx', '.txt'],
  enableAnalytics = true
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<LiveClassParticipant[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Advanced features state
  const [searchQuery, setSearchQuery] = useState('');
  const [messageFilter, setMessageFilter] = useState<'all' | 'pinned' | 'files' | 'announcements'>('all');
  const [showSearch, setShowSearch] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [chatTheme, setChatTheme] = useState(theme);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [messageStats, setMessageStats] = useState({ total: 0, today: 0, activeUsers: 0 });
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [privateMessageTo, setPrivateMessageTo] = useState<number | null>(null);
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Emoji reactions
  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥'];

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        // Get WebSocket token
        const response = await fetch(`${API_BASE_URL}/live-classes/${classId}/ws-token`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const { token } = await response.json();

        // Connect to WebSocket
        const ws = new WebSocket(`${WS_BASE_URL}/live-class/${classId}?token=${token}`);
        
        ws.onopen = () => {
          setIsConnected(true);
          console.log('Connected to live class chat');
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'message':
              setMessages(prev => [...prev, data.message]);
              break;
            case 'participants_update':
              setParticipants(data.participants);
              if (onParticipantUpdate) {
                onParticipantUpdate(data.participants);
              }
              break;
            case 'message_reaction':
              setMessages(prev => prev.map(msg => 
                msg.message_id === data.message_id 
                  ? { ...msg, reactions: data.reactions }
                  : msg
              ));
              break;
            case 'message_deleted':
              setMessages(prev => prev.map(msg => 
                msg.message_id === data.message_id 
                  ? { ...msg, is_deleted: true }
                  : msg
              ));
              break;
            case 'message_pinned':
              setMessages(prev => prev.map(msg => 
                msg.message_id === data.message_id 
                  ? { ...msg, is_pinned: data.is_pinned }
                  : msg
              ));
              break;
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          console.log('Disconnected from live class chat');
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [classId, onParticipantUpdate]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !wsRef.current || !isConnected) return;

    const messageData = {
      type: 'send_message',
      message: newMessage.trim(),
      reply_to: replyTo?.message_id || null
    };

    wsRef.current.send(JSON.stringify(messageData));
    setNewMessage('');
    setReplyTo(null);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Add reaction
  const addReaction = (messageId: string, emoji: string) => {
    if (!wsRef.current || !isConnected) return;

    wsRef.current.send(JSON.stringify({
      type: 'add_reaction',
      message_id: messageId,
      emoji
    }));
  };

  // Raise/lower hand
  const toggleHand = () => {
    if (!wsRef.current || !isConnected) return;

    wsRef.current.send(JSON.stringify({
      type: 'toggle_hand'
    }));
  };

  // Delete message (instructor/moderator only)
  const deleteMessage = (messageId: string) => {
    if (!wsRef.current || !isConnected || !isInstructor) return;

    wsRef.current.send(JSON.stringify({
      type: 'delete_message',
      message_id: messageId
    }));
  };

  // Pin message (instructor/moderator only)
  const pinMessage = (messageId: string) => {
    if (!wsRef.current || !isConnected || !isInstructor) return;

    wsRef.current.send(JSON.stringify({
      type: 'pin_message',
      message_id: messageId
    }));
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'instructor':
        return <Crown className="w-3 h-3 text-yellow-600" />;
      case 'moderator':
        return <Shield className="w-3 h-3 text-blue-600" />;
      default:
        return null;
    }
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'instructor':
        return 'text-yellow-600';
      case 'moderator':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const currentParticipant = participants.find(p => p.user_id === user?.id);

  return (
    <Card className={`flex flex-col ${isMinimized ? 'h-16' : 'h-96'} transition-all duration-300`}>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>Canlı Sohbet</span>
            <Badge variant="outline">{participants.length} katılımcı</Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowParticipants(!showParticipants)}
            >
              <Users className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize className="w-4 h-4" /> : <Minimize className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <CardContent className="flex-1 p-0">
            <div className="flex h-full">
              {/* Chat Messages */}
              <div className={`flex-1 flex flex-col ${showParticipants ? 'border-r' : ''}`}>
                <ScrollArea className="flex-1 px-4">
                  <div className="space-y-3 py-2">
                    {messages.map((message) => (
                      <div key={message.message_id} className={`group ${message.is_deleted ? 'opacity-50' : ''}`}>
                        {message.is_pinned && (
                          <div className="flex items-center space-x-1 text-xs text-blue-600 mb-1">
                            <Pin className="w-3 h-3" />
                            <span>Sabitlendi</span>
                          </div>
                        )}
                        
                        {message.reply_to && (
                          <div className="ml-8 mb-1 p-2 bg-gray-50 rounded text-xs border-l-2 border-gray-300">
                            <span className="text-gray-600">Yanıtlanan mesaj...</span>
                          </div>
                        )}

                        <div className="flex items-start space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={message.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {message.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`font-medium text-sm ${getRoleColor(message.role)}`}>
                                {message.full_name}
                              </span>
                              {getRoleIcon(message.role)}
                              <span className="text-xs text-gray-500">
                                {formatTime(message.timestamp)}
                              </span>
                            </div>
                            
                            {!message.is_deleted ? (
                              <div className="bg-gray-50 rounded-lg p-2 text-sm">
                                {message.message}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 italic">
                                Bu mesaj silindi
                              </div>
                            )}

                            {/* Reactions */}
                            {message.reactions && Object.keys(message.reactions).length > 0 && (
                              <div className="flex items-center space-x-1 mt-1">
                                {Object.entries(message.reactions).map(([emoji, count]) => (
                                  <button
                                    key={emoji}
                                    onClick={() => addReaction(message.message_id, emoji)}
                                    className="flex items-center space-x-1 px-2 py-1 bg-blue-50 rounded-full text-xs hover:bg-blue-100"
                                  >
                                    <span>{emoji}</span>
                                    <span>{count}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Message Actions */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-48 p-2">
                                <div className="space-y-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => setReplyTo(message)}
                                  >
                                    <Reply className="w-3 h-3 mr-2" />
                                    Yanıtla
                                  </Button>
                                  
                                  <div className="flex items-center space-x-1">
                                    {commonEmojis.slice(0, 4).map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={() => addReaction(message.message_id, emoji)}
                                        className="p-1 hover:bg-gray-100 rounded"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>

                                  {isInstructor && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={() => pinMessage(message.message_id)}
                                      >
                                        <Pin className="w-3 h-3 mr-2" />
                                        {message.is_pinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-red-600"
                                        onClick={() => deleteMessage(message.message_id)}
                                      >
                                        <Trash2 className="w-3 h-3 mr-2" />
                                        Sil
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  {replyTo && (
                    <div className="mb-2 p-2 bg-blue-50 rounded text-sm flex items-center justify-between">
                      <div>
                        <span className="text-blue-600">Yanıtlanıyor: {replyTo.full_name}</span>
                        <p className="text-gray-600 truncate">{replyTo.message}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyTo(null)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleHand}
                        className={currentParticipant?.hand_raised ? 'text-yellow-600' : ''}
                      >
                        <Hand className="w-4 h-4" />
                      </Button>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Smile className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2">
                          <div className="grid grid-cols-8 gap-1">
                            {commonEmojis.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => setNewMessage(prev => prev + emoji)}
                                className="p-2 hover:bg-gray-100 rounded text-lg"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Mesajınızı yazın..."
                      className="flex-1"
                      disabled={!isConnected}
                    />
                    
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || !isConnected}
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Participants Panel */}
              {showParticipants && (
                <div className="w-64 border-l">
                  <div className="p-3 border-b">
                    <h4 className="font-medium text-sm">Katılımcılar ({participants.length})</h4>
                  </div>
                  <ScrollArea className="h-64">
                    <div className="p-2 space-y-2">
                      {participants.map((participant) => (
                        <div key={participant.user_id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={participant.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {participant.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1">
                              <span className={`text-xs font-medium truncate ${getRoleColor(participant.role)}`}>
                                {participant.full_name}
                              </span>
                              {getRoleIcon(participant.role)}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1">
                            {participant.hand_raised && (
                              <Hand className="w-3 h-3 text-yellow-600" />
                            )}
                            {participant.has_mic ? (
                              <Mic className="w-3 h-3 text-green-600" />
                            ) : (
                              <MicOff className="w-3 h-3 text-gray-400" />
                            )}
                            {participant.has_video ? (
                              <Video className="w-3 h-3 text-green-600" />
                            ) : (
                              <VideoOff className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
};
