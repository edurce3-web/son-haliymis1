import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { liveClassAPI, WS_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Users,
  MessageCircle,
  Send,
  Settings,
  Share2,
  Hand,
  Monitor,
  Camera,
  Volume2,
  VolumeX
} from 'lucide-react';

interface LiveClassRoomProps {
  classId: string;
  courseId: string;
  isInstructor?: boolean;
}

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isInstructor: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isHandRaised: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'system';
}

export const LiveClassRoom: React.FC<LiveClassRoomProps> = ({
  classId,
  courseId,
  isInstructor = false
}) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Fetch live class details
  const { data: classData } = useQuery({
    queryKey: ['liveClass', classId],
    queryFn: () => liveClassAPI.getClassDetails(classId),
  });

  // Join class mutation
  const joinClassMutation = useMutation({
    mutationFn: liveClassAPI.joinClass,
    onSuccess: () => {
      setIsConnected(true);
      toast.success('Canlı derse katıldınız');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Derse katılırken hata oluştu');
    }
  });

  // Leave class mutation
  const leaveClassMutation = useMutation({
    mutationFn: liveClassAPI.leaveClass,
    onSuccess: () => {
      setIsConnected(false);
      toast.success('Canlı dersten ayrıldınız');
    }
  });

  // Initialize WebRTC and WebSocket connections
  useEffect(() => {
    if (isConnected) {
      initializeConnections();
    }

    return () => {
      cleanup();
    };
  }, [isConnected]);

  const initializeConnections = async () => {
    try {
      const wsUrl = `${WS_BASE_URL}/ws/live-class/${classId}`;
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        // Send join message
        socketRef.current?.send(JSON.stringify({
          type: 'join',
          userId: user?.user_id,
          userName: user?.first_name + ' ' + user?.last_name,
          isInstructor
        }));
      };

      socketRef.current.onmessage = handleWebSocketMessage;
      socketRef.current.onclose = () => console.log('WebSocket disconnected');

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize peer connection
      initializePeerConnection();

    } catch (error) {
      console.error('Error initializing connections:', error);
      toast.error('Kamera/mikrofon erişimi başarısız');
    }
  };

  const initializePeerConnection = () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };

    peerConnectionRef.current = new RTCPeerConnection(configuration);

    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate
        }));
      }
    };
  };

  const handleWebSocketMessage = async (event: MessageEvent) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case 'participants-update':
        setParticipants(data.participants);
        break;

      case 'chat-message':
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          userId: data.userId,
          userName: data.userName,
          message: data.message,
          timestamp: new Date(),
          type: 'message'
        }]);
        break;

      case 'offer':
        await handleOffer(data.offer);
        break;

      case 'answer':
        await handleAnswer(data.answer);
        break;

      case 'ice-candidate':
        await handleIceCandidate(data.candidate);
        break;

      case 'user-joined':
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          userId: 'system',
          userName: 'Sistem',
          message: `${data.userName} derse katıldı`,
          timestamp: new Date(),
          type: 'system'
        }]);
        break;

      case 'user-left':
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          userId: 'system',
          userName: 'Sistem',
          message: `${data.userName} dersten ayrıldı`,
          timestamp: new Date(),
          type: 'system'
        }]);
        break;
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;

    await peerConnectionRef.current.setRemoteDescription(offer);
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);

    socketRef.current?.send(JSON.stringify({
      type: 'answer',
      answer
    }));
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.setRemoteDescription(answer);
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.addIceCandidate(candidate);
  };

  const toggleVideo = async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
        
        // Notify other participants
        socketRef.current?.send(JSON.stringify({
          type: 'video-toggle',
          enabled: !isVideoEnabled
        }));
      }
    }
  };

  const toggleAudio = async () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
        
        // Notify other participants
        socketRef.current?.send(JSON.stringify({
          type: 'audio-toggle',
          enabled: !isAudioEnabled
        }));
      }
    }
  };

  const toggleHandRaise = () => {
    setIsHandRaised(!isHandRaised);
    socketRef.current?.send(JSON.stringify({
      type: 'hand-raise',
      raised: !isHandRaised
    }));
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Replace video track with screen share
      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current?.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );

      if (sender) {
        await sender.replaceTrack(videoTrack);
      }

      setIsScreenSharing(true);

      videoTrack.onended = () => {
        stopScreenShare();
      };

    } catch (error) {
      console.error('Error starting screen share:', error);
      toast.error('Ekran paylaşımı başlatılamadı');
    }
  };

  const stopScreenShare = async () => {
    try {
      // Get camera stream back
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: isAudioEnabled
      });

      const videoTrack = cameraStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current?.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );

      if (sender) {
        await sender.replaceTrack(videoTrack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStream;
      }

      localStreamRef.current = cameraStream;
      setIsScreenSharing(false);

    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  };

  const sendChatMessage = () => {
    if (newMessage.trim() && socketRef.current) {
      socketRef.current.send(JSON.stringify({
        type: 'chat-message',
        message: newMessage.trim()
      }));
      setNewMessage('');
    }
  };

  const joinClass = () => {
    joinClassMutation.mutate({ classId, courseId });
  };

  const leaveClass = () => {
    cleanup();
    leaveClassMutation.mutate(classId);
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Video className="w-6 h-6 mr-2" />
              Canlı Ders
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{classData?.title}</h3>
              <p className="text-muted-foreground">{classData?.description}</p>
              <div className="flex items-center justify-center space-x-4 text-sm">
                <Badge variant="outline">
                  <Users className="w-4 h-4 mr-1" />
                  {classData?.participantCount || 0} katılımcı
                </Badge>
                <Badge variant="outline">
                  Başlangıç: {classData?.startTime}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Derse katılmak için kamera ve mikrofon izni gereklidir.
              </p>
              <Button 
                onClick={joinClass}
                disabled={joinClassMutation.isPending}
                size="lg"
                className="w-full max-w-xs"
              >
                <Video className="w-4 h-4 mr-2" />
                {joinClassMutation.isPending ? 'Katılınıyor...' : 'Derse Katıl'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-white font-semibold">{classData?.title}</h1>
          <Badge variant="secondary">
            <Users className="w-4 h-4 mr-1" />
            {participants.length}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className="text-white hover:bg-gray-700"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={leaveClass}
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            Ayrıl
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className={`flex-1 relative ${showChat ? 'mr-80' : ''}`}>
          {/* Main Video */}
          <div className="h-full bg-black relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Local Video (Picture in Picture) */}
            <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <VideoOff className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center space-x-2 bg-gray-800 rounded-full px-4 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleVideo}
                  className={`rounded-full ${!isVideoEnabled ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-gray-700'}`}
                >
                  {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAudio}
                  className={`rounded-full ${!isAudioEnabled ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-gray-700'}`}
                >
                  {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>

                {isInstructor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                    className="rounded-full hover:bg-gray-700"
                  >
                    <Monitor className="w-4 h-4" />
                  </Button>
                )}

                {!isInstructor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleHandRaise}
                    className={`rounded-full ${isHandRaised ? 'bg-yellow-600 hover:bg-yellow-700' : 'hover:bg-gray-700'}`}
                  >
                    <Hand className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-white border-l flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Sohbet</h3>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`${message.type === 'system' ? 'text-center' : ''}`}>
                    {message.type === 'system' ? (
                      <p className="text-xs text-muted-foreground italic">
                        {message.message}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{message.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Mesaj yazın..."
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                />
                <Button size="sm" onClick={sendChatMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
