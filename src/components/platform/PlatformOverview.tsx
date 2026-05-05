import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Users,
  Play,
  CreditCard,
  Award,
  BarChart3,
  MessageSquare,
  Shield,
  Globe,
  Smartphone,
  Zap,
  Crown,
  Star,
  TrendingUp,
  Target,
  Heart,
  Gift,
  Video,
  Search,
  Filter,
  Settings,
  Lock,
  CheckCircle
} from 'lucide-react';

export const PlatformOverview: React.FC = () => {
  const features = [
    {
      category: "Kurs Pazarı",
      icon: <BookOpen className="w-6 h-6" />,
      items: [
        "Gelişmiş arama ve filtreleme",
        "Kategori bazlı gezinme",
        "Fiyat karşılaştırması",
        "Öğrenci yorumları ve puanları",
        "Wishlist ve sepet sistemi",
        "Kampanya ve indirim yönetimi"
      ]
    },
    {
      category: "Video Oynatıcı",
      icon: <Play className="w-6 h-6" />,
      items: [
        "Çoklu kalite seçenekleri",
        "Altyazı desteği",
        "Oynatma hızı kontrolü",
        "Picture-in-Picture modu",
        "Klavye kısayolları",
        "Not alma ve yer imi sistemi"
      ]
    },
    {
      category: "Eğitmen Paneli",
      icon: <BarChart3 className="w-6 h-6" />,
      items: [
        "Detaylı analitik raporlar",
        "Kurs yönetimi araçları",
        "Öğrenci etkileşim metrikleri",
        "Gelir takibi",
        "Kampanya oluşturma",
        "Canlı ders yönetimi"
      ]
    },
    {
      category: "Öğrenci Deneyimi",
      icon: <Users className="w-6 h-6" />,
      items: [
        "Kişiselleştirilmiş dashboard",
        "İlerleme takibi",
        "Başarı rozetleri",
        "Öğrenme hedefleri",
        "Sosyal özellikler",
        "Mobil uyumlu tasarım"
      ]
    },
    {
      category: "Ödeme Sistemi",
      icon: <CreditCard className="w-6 h-6" />,
      items: [
        "Güvenli ödeme altyapısı",
        "Çoklu ödeme yöntemleri",
        "Kupon ve indirim sistemi",
        "Fatura yönetimi",
        "Abonelik planları",
        "Otomatik geri ödeme"
      ]
    },
    {
      category: "Sosyal Özellikler",
      icon: <MessageSquare className="w-6 h-6" />,
      items: [
        "Canlı sohbet sistemi",
        "Çalışma grupları",
        "Arkadaş sistemi",
        "Topluluk forumları",
        "Mesajlaşma",
        "Sosyal paylaşım"
      ]
    }
  ];

  const stats = [
    { label: "Toplam Özellik", value: "50+", icon: <Zap className="w-5 h-5" /> },
    { label: "Bileşen Sayısı", value: "25+", icon: <Settings className="w-5 h-5" /> },
    { label: "Sayfa Türü", value: "15+", icon: <Globe className="w-5 h-5" /> },
    { label: "Güvenlik Seviyesi", value: "A+", icon: <Shield className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Crown className="w-12 h-12 text-yellow-400" />
            <h1 className="text-5xl font-bold">EduPlatform Pro</h1>
          </div>
          <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
            Udemy seviyesinde kapsamlı eğitim platformu - Modern teknolojiler, 
            kullanıcı dostu arayüz ve gelişmiş özelliklerle donatılmış
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Badge className="bg-green-500 text-white px-4 py-2 text-lg">
              <CheckCircle className="w-5 h-5 mr-2" />
              Tamamen Fonksiyonel
            </Badge>
            <Badge className="bg-yellow-500 text-white px-4 py-2 text-lg">
              <Star className="w-5 h-5 mr-2" />
              Enterprise Ready
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-3 text-blue-600">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Categories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Platform Özellikleri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="text-blue-600">{feature.icon}</div>
                    <span>{feature.category}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Teknoloji Yığını</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-4 text-blue-600">Frontend</h3>
                <ul className="space-y-2">
                  <li>• React 18 + TypeScript</li>
                  <li>• Tailwind CSS</li>
                  <li>• Shadcn/ui Components</li>
                  <li>• React Query (TanStack)</li>
                  <li>• React Router</li>
                  <li>• Framer Motion</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-4 text-green-600">Backend</h3>
                <ul className="space-y-2">
                  <li>• Node.js + Express</li>
                  <li>• MySQL Database</li>
                  <li>• JWT Authentication</li>
                  <li>• WebSocket (Socket.io)</li>
                  <li>• File Upload (Multer)</li>
                  <li>• Payment Integration</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-4 text-purple-600">Özellikler</h3>
                <ul className="space-y-2">
                  <li>• Responsive Design</li>
                  <li>• Real-time Updates</li>
                  <li>• Progressive Web App</li>
                  <li>• SEO Optimized</li>
                  <li>• Accessibility (WCAG)</li>
                  <li>• Performance Optimized</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Components */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Ana Bileşenler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-blue-600">Kullanıcı Arayüzü</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>• CourseMarketplace</div>
                  <div>• AdvancedVideoPlayer</div>
                  <div>• PaymentSystem</div>
                  <div>• StudentDashboard</div>
                  <div>• InstructorDashboard</div>
                  <div>• LiveClassChat</div>
                  <div>• SearchResults</div>
                  <div>• UserProfile</div>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-green-600">Sistem Bileşenleri</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>• Authentication</div>
                  <div>• Authorization</div>
                  <div>• File Management</div>
                  <div>• Notification System</div>
                  <div>• Analytics Engine</div>
                  <div>• Recommendation AI</div>
                  <div>• Payment Gateway</div>
                  <div>• Video Streaming</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Platform Hazır! 🚀</h2>
          <p className="text-xl mb-8 opacity-90">
            Udemy seviyesinde kapsamlı eğitim platformunuz kullanıma hazır. 
            Tüm temel özellikler implement edildi ve çalışır durumda.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              <Play className="w-5 h-5 mr-2" />
              Platformu Başlat
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Settings className="w-5 h-5 mr-2" />
              Ayarları Yapılandır
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
