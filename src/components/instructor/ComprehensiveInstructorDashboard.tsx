import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  DollarSign,
  Users,
  BookOpen,
  Star,
  Eye,
  Download,
  MessageSquare,
  Calendar,
  Clock,
  Target,
  Award,
  Zap,
  Plus,
  Edit3,
  Trash2,
  Upload,
  Play,
  Pause,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Bell,
  Gift,
  Crown,
  Filter,
  Search,
  RefreshCw,
  ExternalLink,
  FileText,
  Video,
  Image as ImageIcon,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';

interface CourseAnalytics {
  course_id: number;
  title: string;
  students: number;
  revenue: number;
  rating: number;
  reviews: number;
  completion_rate: number;
  watch_time: number;
  enrollment_trend: number[];
  revenue_trend: number[];
  last_30_days: {
    students: number;
    revenue: number;
    reviews: number;
  };
}

interface InstructorStats {
  total_students: number;
  total_revenue: number;
  total_courses: number;
  avg_rating: number;
  total_reviews: number;
  monthly_revenue: number[];
  monthly_students: number[];
  top_countries: { country: string; students: number }[];
  engagement_metrics: {
    completion_rate: number;
    avg_watch_time: number;
    q_and_a_responses: number;
  };
}

interface Course {
  course_id: number;
  title: string;
  status: 'draft' | 'published' | 'under_review';
  students: number;
  revenue: number;
  rating: number;
  reviews: number;
  created_at: string;
  last_updated: string;
  image_url: string;
  price: number;
  lessons_count: number;
  total_duration: string;
}

interface Campaign {
  campaign_id: number;
  name: string;
  discount_percent: number;
  usage_limit: number;
  used_count: number;
  total_revenue: number;
  status: 'active' | 'scheduled' | 'completed';
  starts_at: string;
  ends_at: string;
}

export const ComprehensiveInstructorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

  // Fetch instructor stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['instructor-stats', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/instructor/stats?period=${selectedPeriod}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    }
  });

  // Fetch courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const response = await fetch('/api/instructor/courses', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    }
  });

  // Fetch campaigns
  const { data: campaigns } = useQuery({
    queryKey: ['instructor-campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/instructor/campaigns', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    }
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      const response = await fetch('/api/instructor/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(campaignData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-campaigns'] });
      toast.success('Kampanya başarıyla oluşturuldu!');
    }
  });

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    trend?: number[];
  }> = ({ title, value, change, icon, trend }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center mt-1 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                {change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                <span className="ml-1">{Math.abs(change)}%</span>
              </div>
            )}
          </div>
          <div className="text-blue-600">{icon}</div>
        </div>
        {trend && (
          <div className="mt-4 h-8">
            {/* Mini chart would go here */}
            <div className="flex items-end space-x-1 h-full">
              {trend.slice(-7).map((value, index) => (
                <div
                  key={index}
                  className="bg-blue-200 rounded-sm flex-1"
                  style={{ height: `${(value / Math.max(...trend)) * 100}%` }}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const CourseCard: React.FC<{ course: Course }> = ({ course }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <img
            src={course.image_url}
            alt={course.title}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                <Badge
                  variant={course.status === 'published' ? 'default' : 'secondary'}
                  className="mb-2"
                >
                  {course.status === 'published' ? 'Yayında' :
                    course.status === 'draft' ? 'Taslak' : 'İnceleme'}
                </Badge>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span>{course.students} öğrenci</span>
              </div>
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span>₺{course.revenue}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{course.rating} ({course.reviews})</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{course.total_duration}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Eğitmen Paneli</h1>
              <p className="text-gray-600 mt-1">Kurslarınızı yönetin ve performansınızı takip edin</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Son 7 gün</SelectItem>
                  <SelectItem value="30d">Son 30 gün</SelectItem>
                  <SelectItem value="90d">Son 90 gün</SelectItem>
                  <SelectItem value="1y">Son 1 yıl</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="courses">Kurslarım</TabsTrigger>
            <TabsTrigger value="students">Öğrenciler</TabsTrigger>
            <TabsTrigger value="analytics">Analitikler</TabsTrigger>
            <TabsTrigger value="marketing">Pazarlama</TabsTrigger>
            <TabsTrigger value="earnings">Kazançlar</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Toplam Öğrenci"
                value={stats?.total_students?.toLocaleString() || '0'}
                change={15}
                icon={<Users className="w-6 h-6" />}
                trend={stats?.monthly_students}
              />
              <StatCard
                title="Toplam Kazanç"
                value={`₺${stats?.total_revenue?.toLocaleString() || '0'}`}
                change={23}
                icon={<DollarSign className="w-6 h-6" />}
                trend={stats?.monthly_revenue}
              />
              <StatCard
                title="Aktif Kurslar"
                value={stats?.total_courses || '0'}
                icon={<BookOpen className="w-6 h-6" />}
              />
              <StatCard
                title="Ortalama Puan"
                value={stats?.avg_rating || '0'}
                icon={<Star className="w-6 h-6" />}
              />
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Hızlı İşlemler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    className="h-20 flex-col space-y-2"
                    onClick={() => navigate('/instructor/courses/create')}
                  >
                    <Plus className="w-6 h-6" />
                    <span>Yeni Kurs Oluştur</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <Gift className="w-6 h-6" />
                    <span>Kampanya Başlat</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <BarChart3 className="w-6 h-6" />
                    <span>Detaylı Analiz</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Son Aktiviteler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { type: 'enrollment', message: 'Yeni öğrenci kaydı: React Kursu', time: '2 saat önce' },
                      { type: 'review', message: 'Yeni yorum: 5 yıldız aldınız', time: '4 saat önce' },
                      { type: 'payout', message: 'Ödeme işlendi: ₺1,250', time: '1 gün önce' },
                      { type: 'question', message: 'Yeni soru: JavaScript konusu', time: '2 gün önce' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.message}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performans Özeti</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Kurs Tamamlama Oranı</span>
                        <span className="text-sm font-medium">78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Öğrenci Memnuniyeti</span>
                        <span className="text-sm font-medium">92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Yanıt Hızı</span>
                        <span className="text-sm font-medium">85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Kurslarım</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input placeholder="Kurs ara..." className="pl-10 w-64" />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Yenile
                  </Button>
                  <Button onClick={() => navigate('/instructor/courses/create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Kurs
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {courses?.map((course: Course) => (
                <CourseCard key={course.course_id} course={course} />
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gelir Trendi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                    <LineChart className="w-12 h-12 text-gray-400" />
                    <span className="ml-2 text-gray-500">Grafik burada görünecek</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Öğrenci Dağılımı</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                    <PieChart className="w-12 h-12 text-gray-400" />
                    <span className="ml-2 text-gray-500">Grafik burada görünecek</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Kurs Performansı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Kurs</th>
                        <th className="text-left p-2">Öğrenci</th>
                        <th className="text-left p-2">Gelir</th>
                        <th className="text-left p-2">Puan</th>
                        <th className="text-left p-2">Tamamlama</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses?.slice(0, 5).map((course: Course) => (
                        <tr key={course.course_id} className="border-b">
                          <td className="p-2">{course.title}</td>
                          <td className="p-2">{course.students}</td>
                          <td className="p-2">₺{course.revenue}</td>
                          <td className="p-2">{course.rating}</td>
                          <td className="p-2">
                            <Progress value={75} className="h-2 w-20" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Kampanyalar</h2>
              <Button onClick={() => {
                // Open campaign creation modal
                toast.info('Kampanya oluşturma modalı açılacak');
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Kampanya
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns?.map((campaign: Campaign) => (
                <Card key={campaign.campaign_id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <Badge
                        variant={campaign.status === 'active' ? 'default' : 'secondary'}
                      >
                        {campaign.status === 'active' ? 'Aktif' :
                          campaign.status === 'scheduled' ? 'Planlandı' : 'Tamamlandı'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">İndirim:</span>
                        <span className="font-medium">%{campaign.discount_percent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Kullanım:</span>
                        <span className="font-medium">
                          {campaign.used_count}/{campaign.usage_limit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Gelir:</span>
                        <span className="font-medium text-green-600">
                          ₺{campaign.total_revenue}
                        </span>
                      </div>
                      <Progress
                        value={(campaign.used_count / campaign.usage_limit) * 100}
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Öğrenci İstatistikleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">1,234</div>
                    <div className="text-sm text-gray-600">Toplam Öğrenci</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">89%</div>
                    <div className="text-sm text-gray-600">Aktif Öğrenci</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">4.8</div>
                    <div className="text-sm text-gray-600">Ortalama Puan</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kazanç Özeti</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Bu Ay:</span>
                      <span className="text-2xl font-bold text-green-600">₺12,450</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Geçen Ay:</span>
                      <span className="text-lg">₺9,230</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Toplam:</span>
                      <span className="text-lg">₺156,780</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ödeme Geçmişi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { date: '15 Aralık 2024', amount: '₺2,450', status: 'Ödendi' },
                      { date: '15 Kasım 2024', amount: '₺1,890', status: 'Ödendi' },
                      { date: '15 Ekim 2024', amount: '₺3,120', status: 'Ödendi' }
                    ].map((payment, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{payment.amount}</div>
                          <div className="text-sm text-gray-600">{payment.date}</div>
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          {payment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
