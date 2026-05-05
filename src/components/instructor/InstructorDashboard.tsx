import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
  Star,
  Eye,
  Clock,
  Award,
  MessageSquare,
  Download,
  Play,
  Calendar,
  Target,
  Zap,
  Brain,
  Heart,
  ThumbsUp,
  AlertCircle,
  CheckCircle,
  Plus,
  Edit,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Globe,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';

interface InstructorStats {
  total_courses: number;
  total_students: number;
  total_revenue: number;
  avg_rating: number;
  total_reviews: number;
  total_hours_taught: number;
  completion_rate: number;
  monthly_earnings: number;
}

interface CourseAnalytics {
  course_id: number;
  title: string;
  students_enrolled: number;
  completion_rate: number;
  avg_rating: number;
  total_revenue: number;
  total_views: number;
  last_updated: string;
  status: 'active' | 'draft' | 'archived';
}

interface StudentProgress {
  user_id: number;
  full_name: string;
  avatar_url?: string;
  course_title: string;
  progress_percentage: number;
  last_activity: string;
  total_time_spent: number;
  quiz_scores: number[];
}

interface RevenueData {
  month: string;
  revenue: number;
  students: number;
  courses_sold: number;
}

interface ReviewData {
  review_id: number;
  student_name: string;
  student_avatar?: string;
  course_title: string;
  rating: number;
  comment: string;
  created_at: string;
}

export const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

  // Fetch instructor stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['instructor-stats', user?.user_id, selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/instructor/stats?range=${selectedTimeRange}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!user?.user_id
  });

  // Fetch course analytics
  const { data: courseAnalytics, isLoading: coursesLoading } = useQuery({
    queryKey: ['instructor-courses', user?.user_id],
    queryFn: async () => {
      const response = await fetch('/api/instructor/courses/analytics', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    },
    enabled: !!user?.user_id
  });

  // Fetch student progress
  const { data: studentProgress, isLoading: studentsLoading } = useQuery({
    queryKey: ['instructor-students', user?.user_id, selectedCourse],
    queryFn: async () => {
      const url = selectedCourse
        ? `/api/instructor/students?course_id=${selectedCourse}`
        : '/api/instructor/students';
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      return response.json();
    },
    enabled: !!user?.user_id
  });

  // Fetch revenue data
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['instructor-revenue', user?.user_id, selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/instructor/revenue?range=${selectedTimeRange}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch revenue');
      return response.json();
    },
    enabled: !!user?.user_id
  });

  // Fetch recent reviews
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['instructor-reviews', user?.user_id],
    queryFn: async () => {
      const response = await fetch('/api/instructor/reviews', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
    enabled: !!user?.user_id
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatTime = (minutes: number) => {
    if (!minutes) return '0dk';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Eğitmen Paneli</h1>
          <p className="text-gray-600">Kurslarınızı yönetin ve performansınızı takip edin</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="7d">Son 7 Gün</option>
            <option value="30d">Son 30 Gün</option>
            <option value="90d">Son 3 Ay</option>
            <option value="1y">Son 1 Yıl</option>
          </select>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => navigate('/instructor/courses/create')}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Kurs</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['instructor-stats'] });
                queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
                queryClient.invalidateQueries({ queryKey: ['instructor-reviews'] });
                window.location.reload();
              }}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Yenile</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Kurs</p>
                <p className="text-2xl font-bold">{statsLoading ? '...' : (stats?.total_courses || 0)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+12% bu ay</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Öğrenci</p>
                <p className="text-2xl font-bold">{statsLoading ? '...' : (stats?.total_students || 0)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+8% bu ay</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                <p className="text-2xl font-bold">{statsLoading ? '...' : formatCurrency(stats?.total_revenue || 0)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+15% bu ay</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ortalama Puan</p>
                <p className="text-2xl font-bold">{statsLoading ? '...' : (stats?.avg_rating?.toFixed(1) || '0.0')}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600">{statsLoading ? '...' : (stats?.total_reviews || 0)} değerlendirme</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="courses">Kurslarım</TabsTrigger>
          <TabsTrigger value="students">Öğrenciler</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
          <TabsTrigger value="reviews">Değerlendirmeler</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Gelir Trendi</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData?.items || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Student Enrollment */}
            <Card>
              <CardHeader>
                <CardTitle>Öğrenci Kayıtları</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData?.items || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="students" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Son Aktiviteler</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">5 yeni öğrenci kaydoldu</p>
                      <p className="text-xs text-gray-500">2 saat önce</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Yeni 5 yıldızlı değerlendirme aldınız</p>
                      <p className="text-xs text-gray-500">4 saat önce</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">₺1,250 gelir elde ettiniz</p>
                      <p className="text-xs text-gray-500">1 gün önce</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Kurslarım</h3>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtrele
              </Button>
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Ara
              </Button>
            </div>
          </div>

          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courseAnalytics?.items?.map((course: CourseAnalytics) => (
                <Card key={course.course_id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-semibold text-lg line-clamp-2">{course.title}</h4>
                      <Badge className={getStatusColor(course.status)}>
                        {course.status}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Öğrenci Sayısı</span>
                        <span className="font-medium">{course.students_enrolled}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tamamlanma Oranı</span>
                        <span className="font-medium">%{course.completion_rate}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Ortalama Puan</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="font-medium">{course.avg_rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Toplam Gelir</span>
                        <span className="font-medium text-green-600">{formatCurrency(course.total_revenue)}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3 mr-1" />
                        Düzenle
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Analitik
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Öğrenci İlerlemeleri</h3>
            <select
              value={selectedCourse || ''}
              onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">Tüm Kurslar</option>
              {courseAnalytics?.items?.map((course: CourseAnalytics) => (
                <option key={course.course_id} value={course.course_id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {studentsLoading ? (
                  <div className="space-y-1 p-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 animate-pulse">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {studentProgress?.items?.map((student: StudentProgress) => (
                      <div key={student.user_id} className="flex items-center space-x-4 p-4 hover:bg-gray-50">
                        <Avatar>
                          <AvatarImage src={student.avatar_url} />
                          <AvatarFallback>{student.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{student.full_name}</h4>
                            <span className="text-sm text-gray-500">
                              {formatTime(student.total_time_spent)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{student.course_title}</p>
                          <div className="flex items-center space-x-2">
                            <Progress value={student.progress_percentage} className="flex-1 h-2" />
                            <span className="text-sm font-medium">%{student.progress_percentage}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-gray-500">Son aktivite</p>
                          <p className="text-sm">{new Date(student.last_activity).toLocaleDateString('tr-TR')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Course Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Kurs Performansı</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={courseAnalytics?.items?.slice(0, 5) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="students_enrolled" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Completion Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Tamamlanma Oranları</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={courseAnalytics?.items?.slice(0, 5) || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ title, completion_rate }) => `${title}: %${completion_rate}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="completion_rate"
                    >
                      {courseAnalytics?.items?.slice(0, 5).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Son Değerlendirmeler</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{reviews?.total || 0} toplam değerlendirme</Badge>
              <Badge variant="outline">⭐ {stats?.avg_rating?.toFixed(1) || '0.0'} ortalama</Badge>
            </div>
          </div>

          {reviewsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews?.items?.map((review: ReviewData) => (
                <Card key={review.review_id}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={review.student_avatar} />
                        <AvatarFallback>{review.student_name.charAt(0)}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{review.student_name}</h4>
                            <p className="text-sm text-gray-600">{review.course_title}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                  }`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-gray-700 mb-2">{review.comment}</p>

                        <p className="text-xs text-gray-500">
                          {new Date(review.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
