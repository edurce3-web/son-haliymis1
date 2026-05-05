import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
  Smartphone,
  Download,
  Bell,
  BookOpen,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  User,
  Search,
  Home,
  Heart,
  Share2,
  MessageCircle,
  Star,
  Clock,
  Users,
  Award,
  Zap,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-react';

interface MobileCourse {
  course_id: number;
  title: string;
  instructor: string;
  thumbnail: string;
  progress: number;
  duration: number;
  downloaded: boolean;
  offline_available: boolean;
  last_watched: string;
  rating: number;
  students: number;
}

interface OfflineContent {
  content_id: string;
  type: 'video' | 'document' | 'quiz';
  title: string;
  size: number;
  downloaded_at: string;
  expires_at: string;
}

export const MobileApp: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [currentVideo, setCurrentVideo] = useState<MobileCourse | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<Record<number, number>>({});

  // PWA Installation
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA Install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Fetch mobile courses
  const { data: courses } = useQuery({
    queryKey: ['mobile-courses', user?.user_id],
    queryFn: async () => {
      const response = await fetch(`/api/mobile/courses/${user?.user_id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    },
    enabled: !!user
  });

  // Fetch offline content
  const { data: offlineContent } = useQuery({
    queryKey: ['offline-content', user?.user_id],
    queryFn: async () => {
      const response = await fetch(`/api/mobile/offline-content/${user?.user_id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    },
    enabled: !!user
  });

  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const downloadCourse = async (courseId: number) => {
    try {
      setDownloadProgress(prev => ({ ...prev, [courseId]: 0 }));
      
      const response = await fetch(`/api/mobile/download/${courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      let receivedLength = 0;
      const contentLength = parseInt(response.headers.get('content-length') || '0');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        receivedLength += value?.length || 0;
        const progress = Math.round((receivedLength / contentLength) * 100);
        setDownloadProgress(prev => ({ ...prev, [courseId]: progress }));
      }

      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[courseId];
        return newProgress;
      });

    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const MobileHeader: React.FC = () => (
    <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">EduPlatform</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        {isOffline ? (
          <Badge variant="destructive" className="text-xs">
            <WifiOff className="w-3 h-3 mr-1" />
            Çevrimdışı
          </Badge>
        ) : (
          <Badge variant="default" className="text-xs">
            <Wifi className="w-3 h-3 mr-1" />
            Çevrimiçi
          </Badge>
        )}
        
        <Button variant="ghost" size="sm">
          <Bell className="w-5 h-5" />
        </Button>
        
        <Button variant="ghost" size="sm">
          <Search className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  const MobileNavigation: React.FC = () => (
    <div className="bg-white border-t px-4 py-2 flex justify-around sticky bottom-0 z-50">
      {[
        { id: 'home', icon: Home, label: 'Ana Sayfa' },
        { id: 'courses', icon: BookOpen, label: 'Kurslarım' },
        { id: 'downloads', icon: Download, label: 'İndirilenler' },
        { id: 'profile', icon: User, label: 'Profil' }
      ].map((tab) => (
        <Button
          key={tab.id}
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center space-y-1 ${
            activeTab === tab.id ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <tab.icon className="w-5 h-5" />
          <span className="text-xs">{tab.label}</span>
        </Button>
      ))}
    </div>
  );

  const MobileCourseCard: React.FC<{ course: MobileCourse }> = ({ course }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <div className="relative">
            <img
              src={course.thumbnail || '/placeholder.svg'}
              alt={course.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
            {course.downloaded && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <Download className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-sm line-clamp-2">{course.title}</h3>
            <p className="text-xs text-gray-600">{course.instructor}</p>
            
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <div className="flex items-center">
                <Star className="w-3 h-3 text-yellow-500 mr-1" />
                <span>{course.rating}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-3 h-3 mr-1" />
                <span>{course.students}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                <span>{course.duration}h</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>İlerleme</span>
                <span>{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="h-1" />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentVideo(course)}
                className="flex-1 text-xs"
              >
                <Play className="w-3 h-3 mr-1" />
                Devam Et
              </Button>
              
              {!course.downloaded && downloadProgress[course.course_id] === undefined && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => downloadCourse(course.course_id)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
              
              {downloadProgress[course.course_id] !== undefined && (
                <div className="flex items-center space-x-2">
                  <Progress value={downloadProgress[course.course_id]} className="w-12 h-2" />
                  <span className="text-xs">{downloadProgress[course.course_id]}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const MobileVideoPlayer: React.FC = () => {
    if (!currentVideo) return null;

    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Video Player Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentVideo(null)}
            className="text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-sm font-medium flex-1 mx-3 truncate">
            {currentVideo.title}
          </h2>
          <Button variant="ghost" size="sm" className="text-white">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

        {/* Video Area */}
        <div className="flex-1 bg-gray-900 flex items-center justify-center">
          <div className="text-white text-center">
            <Play className="w-16 h-16 mx-auto mb-4" />
            <p>Video Player Placeholder</p>
            <p className="text-sm text-gray-400 mt-2">{currentVideo.title}</p>
          </div>
        </div>

        {/* Video Controls */}
        <div className="bg-black bg-opacity-75 p-4 text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm">2:30</span>
            <Progress value={35} className="flex-1 mx-3 h-1" />
            <span className="text-sm">7:15</span>
          </div>
          
          <div className="flex items-center justify-center space-x-6">
            <Button variant="ghost" size="sm" className="text-white">
              <SkipBack className="w-6 h-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8" />
              )}
            </Button>
            
            <Button variant="ghost" size="sm" className="text-white">
              <SkipForward className="w-6 h-6" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-white">
                {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <span className="text-xs">{playbackSpeed}x</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-white">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white">
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PWAInstallPrompt: React.FC = () => {
    if (!showInstallPrompt) return null;

    return (
      <div className="fixed bottom-20 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-40">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Uygulamayı Yükle</h3>
            <p className="text-xs opacity-90">Daha iyi deneyim için uygulamayı yükleyin</p>
          </div>
          <div className="flex space-x-2 ml-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowInstallPrompt(false)}
              className="text-white hover:bg-blue-700"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={installPWA}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              Yükle
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MobileHeader />
      
      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden">
          <div className="bg-white w-64 h-full p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {[
                { label: 'Ana Sayfa', icon: Home },
                { label: 'Kurslarım', icon: BookOpen },
                { label: 'İndirilenler', icon: Download },
                { label: 'Ayarlar', icon: Settings },
                { label: 'Profil', icon: User }
              ].map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-4 pb-20">
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-lg font-bold">{courses?.length || 0}</div>
                  <div className="text-xs text-gray-600">Aktif Kurs</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Award className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                  <div className="text-lg font-bold">12</div>
                  <div className="text-xs text-gray-600">Sertifika</div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">Devam Et</h2>
              {courses?.slice(0, 3).map((course: MobileCourse) => (
                <MobileCourseCard key={course.course_id} course={course} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Kurslarım</h2>
            {courses?.map((course: MobileCourse) => (
              <MobileCourseCard key={course.course_id} course={course} />
            ))}
          </div>
        )}

        {activeTab === 'downloads' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">İndirilenler</h2>
              <Badge variant="secondary">
                {offlineContent?.length || 0} içerik
              </Badge>
            </div>
            
            {isOffline && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <WifiOff className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    Çevrimdışı modu aktif. Sadece indirilen içerikler görüntüleniyor.
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {offlineContent?.map((content: OfflineContent) => (
                <Card key={content.content_id}>
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        {content.type === 'video' ? (
                          <Play className="w-4 h-4 text-green-600" />
                        ) : content.type === 'document' ? (
                          <BookOpen className="w-4 h-4 text-green-600" />
                        ) : (
                          <Award className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{content.title}</h3>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{(content.size / 1024 / 1024).toFixed(1)} MB</span>
                          <span>•</span>
                          <span>{new Date(content.downloaded_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold">{user?.first_name} {user?.last_name}</h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">15</div>
                <div className="text-xs text-gray-600">Kurs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">12</div>
                <div className="text-xs text-gray-600">Tamamlanan</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">8</div>
                <div className="text-xs text-gray-600">Sertifika</div>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Hesap Ayarları', icon: Settings },
                { label: 'İndirme Ayarları', icon: Download },
                { label: 'Bildirimler', icon: Bell },
                { label: 'Gizlilik', icon: Shield },
                { label: 'Yardım', icon: MessageCircle }
              ].map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <MobileNavigation />
      <MobileVideoPlayer />
      <PWAInstallPrompt />
    </div>
  );
};
