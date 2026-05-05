import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Settings, 
  Maximize, 
  Eye,
  Users,
  Clock,
  Star,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Tablet,
  Monitor,
  Headphones,
  Wifi,
  WifiOff,
  Download,
  Share2,
  MessageSquare,
  ThumbsUp,
  Flag,
  Zap,
  Target,
  TrendingUp,
  Award,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  id: string;
  type: 'performance' | 'accessibility' | 'compatibility' | 'user_experience';
  status: 'passed' | 'warning' | 'failed';
  message: string;
  score: number;
  details?: string;
}

interface PreviewSettings {
  device: 'desktop' | 'tablet' | 'mobile';
  connection: 'fast' | 'slow' | 'offline';
  userType: 'student' | 'instructor' | 'guest';
  language: string;
  accessibility: boolean;
}

export default function CoursePreviewTester() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(300); // 5 minutes
  const [volume, setVolume] = useState(80);
  const [settings, setSettings] = useState<PreviewSettings>({
    device: 'desktop',
    connection: 'fast',
    userType: 'student',
    language: 'tr',
    accessibility: false
  });

  const [testResults, setTestResults] = useState<TestResult[]>([
    {
      id: '1',
      type: 'performance',
      status: 'passed',
      message: 'Sayfa yükleme hızı optimum',
      score: 95,
      details: 'Ortalama yükleme süresi: 1.2s'
    },
    {
      id: '2',
      type: 'accessibility',
      status: 'warning',
      message: 'Alt metin eksik görseller var',
      score: 78,
      details: '3 görsel için alt metin eklenmeli'
    },
    {
      id: '3',
      type: 'compatibility',
      status: 'passed',
      message: 'Tüm cihazlarda uyumlu',
      score: 92,
      details: 'Desktop, tablet ve mobil testleri başarılı'
    },
    {
      id: '4',
      type: 'user_experience',
      status: 'passed',
      message: 'Kullanıcı deneyimi mükemmel',
      score: 88,
      details: 'Navigasyon ve etkileşim testleri başarılı'
    }
  ]);

  const [analytics] = useState({
    totalViews: 1247,
    avgWatchTime: '4:32',
    completionRate: 78,
    engagement: 85,
    ratings: 4.6,
    comments: 23,
    shares: 12
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return Zap;
      case 'accessibility': return Eye;
      case 'compatibility': return Monitor;
      case 'user_experience': return Target;
      default: return CheckCircle;
    }
  };

  const runTests = () => {
    toast.success('Testler başlatıldı...');
    // Simulate test running
    setTimeout(() => {
      toast.success('Tüm testler tamamlandı!');
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kurs Önizleme ve Test</h2>
          <p className="text-muted-foreground">Kursu yayınlamadan önce test edin</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={runTests}>
            <Play className="w-4 h-4 mr-2" />
            Testleri Başlat
          </Button>
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Paylaş
          </Button>
        </div>
      </div>

      <Tabs defaultValue="preview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="preview">Önizleme</TabsTrigger>
          <TabsTrigger value="tests">Test Sonuçları</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
          <TabsTrigger value="feedback">Geri Bildirim</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          {/* Preview Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Önizleme Ayarları</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Cihaz</label>
                  <div className="flex gap-1">
                    {[
                      { key: 'desktop', icon: Monitor },
                      { key: 'tablet', icon: Tablet },
                      { key: 'mobile', icon: Smartphone }
                    ].map(({ key, icon: Icon }) => (
                      <Button
                        key={key}
                        variant={settings.device === key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSettings(prev => ({ ...prev, device: key as any }))}
                      >
                        <Icon className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Bağlantı</label>
                  <div className="flex gap-1">
                    {[
                      { key: 'fast', icon: Wifi },
                      { key: 'slow', icon: Wifi },
                      { key: 'offline', icon: WifiOff }
                    ].map(({ key, icon: Icon }) => (
                      <Button
                        key={key}
                        variant={settings.connection === key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSettings(prev => ({ ...prev, connection: key as any }))}
                      >
                        <Icon className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Kullanıcı Tipi</label>
                  <select
                    className="w-full p-2 border rounded text-sm"
                    value={settings.userType}
                    onChange={(e) => setSettings(prev => ({ ...prev, userType: e.target.value as any }))}
                  >
                    <option value="student">Öğrenci</option>
                    <option value="instructor">Eğitmen</option>
                    <option value="guest">Misafir</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Dil</label>
                  <select
                    className="w-full p-2 border rounded text-sm"
                    value={settings.language}
                    onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Erişilebilirlik</label>
                  <Button
                    variant={settings.accessibility ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, accessibility: !prev.accessibility }))}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Preview */}
          <Card>
            <CardContent className="p-0">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                  <div className="text-center text-white">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">React Temelleri</h3>
                    <p className="text-sm opacity-75">Bölüm 1: Giriş ve Kurulum</p>
                  </div>
                </div>

                {/* Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="text-white hover:bg-white/20"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>

                    <div className="flex-1">
                      <div className="bg-white/20 rounded-full h-1 mb-2">
                        <div 
                          className="bg-white rounded-full h-1 transition-all"
                          style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-white/75">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-white" />
                      <div className="w-16 bg-white/20 rounded-full h-1">
                        <div 
                          className="bg-white rounded-full h-1"
                          style={{ width: `${volume}%` }}
                        />
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                      <Settings className="w-4 h-4" />
                    </Button>

                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                      <Maximize className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Info Preview */}
          <Card>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">React ile Modern Web Geliştirme</h3>
                  <p className="text-muted-foreground mb-4">
                    Sıfırdan ileri seviyeye React öğrenin. Modern web uygulamaları geliştirme becerilerinizi artırın.
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>12 saat</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>45 ders</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>1,247 öğrenci</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">4.6</span>
                    </div>
                    <span className="text-sm text-muted-foreground">(234 değerlendirme)</span>
                  </div>
                </div>

                <div>
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-medium mb-3">Bu kursta öğrenecekleriniz:</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        React temellerini öğreneceksiniz
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Modern JavaScript kullanacaksınız
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Gerçek projeler geliştireceksiniz
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        State management öğreneceksiniz
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <div className="grid gap-4">
            {testResults.map((result) => {
              const TypeIcon = getTypeIcon(result.type);
              return (
                <Card key={result.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{result.message}</h4>
                          <p className="text-sm text-muted-foreground">{result.details}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold">{result.score}</div>
                          <div className="text-xs text-muted-foreground">/ 100</div>
                        </div>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status === 'passed' ? 'Başarılı' :
                           result.status === 'warning' ? 'Uyarı' : 'Başarısız'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Eye className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Toplam Görüntüleme</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{analytics.avgWatchTime}</div>
                <div className="text-sm text-muted-foreground">Ort. İzleme Süresi</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">{analytics.completionRate}%</div>
                <div className="text-sm text-muted-foreground">Tamamlama Oranı</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">{analytics.ratings}</div>
                <div className="text-sm text-muted-foreground">Ortalama Puan</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Kullanıcı Geri Bildirimleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">AY</span>
                    </div>
                    <div>
                      <div className="font-medium">Ayşe Yılmaz</div>
                      <div className="text-sm text-muted-foreground">Beta Tester</div>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">4.8</span>
                    </div>
                  </div>
                  <p className="text-sm">
                    Kurs içeriği çok kapsamlı ve anlaşılır. Video kalitesi mükemmel, ses net. 
                    Sadece bazı bölümlerde daha fazla örnek olabilir.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="ghost" size="sm">
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      Yararlı
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Yanıtla
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">MK</span>
                    </div>
                    <div>
                      <div className="font-medium">Mehmet Kaya</div>
                      <div className="text-sm text-muted-foreground">Beta Tester</div>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">5.0</span>
                    </div>
                  </div>
                  <p className="text-sm">
                    Harika bir kurs! Özellikle pratik örnekler çok faydalı. 
                    Mobil uyumluluk da çok iyi, telefonda da rahatça izleyebiliyorum.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="ghost" size="sm">
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      Yararlı
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Yanıtla
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
