import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';
import {
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  Calendar,
  Play,
  Target,
  Users,
  Star,
  ChevronRight,
  Activity,
  BarChart3,
  PieChart,
  Zap,
  Trophy,
  Flame,
  CheckCircle,
  AlertCircle,
  BookmarkIcon,
  Download,
  MessageSquare
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';

interface DashboardStats {
  total_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  total_hours_watched: number;
  certificates_earned: number;
  current_streak: number;
  total_achievements: number;
  avg_rating_given: number;
}

interface EnrolledCourse {
  course_id: number;
  title: string;
  instructor_name: string;
  image_url: string;
  progress: number;
  last_accessed: string;
  total_lessons: number;
  completed_lessons: number;
  estimated_completion: string;
  next_lesson_title: string;
}

interface Achievement {
  achievement_id: number;
  title: string;
  description: string;
  icon: string;
  earned_date: string;
  category: string;
}

interface LearningActivity {
  date: string;
  hours_studied: number;
  lessons_completed: number;
  courses_accessed: number;
}

interface RecentActivity {
  activity_id: number;
  type: 'lesson_completed' | 'course_enrolled' | 'certificate_earned' | 'achievement_unlocked';
  title: string;
  description: string;
  timestamp: string;
  course_title?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const EnhancedDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  // Fetch dashboard statistics
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    },
  });

  // Fetch enrolled courses
  const { data: enrolledCourses } = useQuery({
    queryKey: ['enrolled-courses'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/dashboard/courses`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    },
  });

  // Fetch achievements
  const { data: achievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/dashboard/achievements`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    },
  });

  // Fetch learning activity data
  const { data: activityData } = useQuery({
    queryKey: ['learning-activity', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/dashboard/activity?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    },
  });

  // Fetch recent activities
  const { data: recentActivities } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/dashboard/recent-activities`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    },
  });

  // Mock data for demonstration
  const mockStats: DashboardStats = {
    total_courses: 12,
    completed_courses: 4,
    in_progress_courses: 8,
    total_hours_watched: 156,
    certificates_earned: 4,
    current_streak: 7,
    total_achievements: 15,
    avg_rating_given: 4.6
  };

  const mockCourses: EnrolledCourse[] = [
    {
      course_id: 1,
      title: "React ile Modern Web Geliştirme",
      instructor_name: "Ahmet Yılmaz",
      image_url: "/src/assets/course-programming.jpg",
      progress: 75,
      last_accessed: "2024-01-15T10:30:00Z",
      total_lessons: 45,
      completed_lessons: 34,
      estimated_completion: "3 gün",
      next_lesson_title: "React Hooks Derinlemesine"
    },
    {
      course_id: 2,
      title: "Python ile Veri Bilimi",
      instructor_name: "Mehmet Demir",
      image_url: "/src/assets/course-design.jpg",
      progress: 45,
      last_accessed: "2024-01-14T15:20:00Z",
      total_lessons: 60,
      completed_lessons: 27,
      estimated_completion: "1 hafta",
      next_lesson_title: "Pandas ile Veri Manipülasyonu"
    }
  ];

  const mockActivityData: LearningActivity[] = [
    { date: '2024-01-10', hours_studied: 2.5, lessons_completed: 3, courses_accessed: 2 },
    { date: '2024-01-11', hours_studied: 1.8, lessons_completed: 2, courses_accessed: 1 },
    { date: '2024-01-12', hours_studied: 3.2, lessons_completed: 4, courses_accessed: 2 },
    { date: '2024-01-13', hours_studied: 2.1, lessons_completed: 3, courses_accessed: 2 },
    { date: '2024-01-14', hours_studied: 4.0, lessons_completed: 5, courses_accessed: 3 },
    { date: '2024-01-15', hours_studied: 2.8, lessons_completed: 3, courses_accessed: 2 },
    { date: '2024-01-16', hours_studied: 1.5, lessons_completed: 2, courses_accessed: 1 }
  ];

  const pieData = [
    { name: 'Tamamlanan', value: mockStats.completed_courses, color: '#00C49F' },
    { name: 'Devam Eden', value: mockStats.in_progress_courses, color: '#0088FE' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson_completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'course_enrolled': return <BookOpen className="w-4 h-4 text-blue-600" />;
      case 'certificate_earned': return <Award className="w-4 h-4 text-yellow-600" />;
      case 'achievement_unlocked': return <Trophy className="w-4 h-4 text-purple-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}dk`;
    }
    return `${hours.toFixed(1)}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Hoş geldin, {user?.first_name}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Öğrenme yolculuğuna devam etmeye hazır mısın?
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => navigate('/courses')}>
              <BookOpen className="w-4 h-4 mr-2" />
              Kursları Keşfet
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Toplam Kurs</p>
                  <p className="text-3xl font-bold">{mockStats.total_courses}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-200" />
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-100">
                <TrendingUp className="w-4 h-4 mr-1" />
                Bu ay 2 yeni kurs
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Tamamlanan</p>
                  <p className="text-3xl font-bold">{mockStats.completed_courses}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-200" />
              </div>
              <div className="mt-4 flex items-center text-sm text-green-100">
                <Target className="w-4 h-4 mr-1" />
                %{Math.round((mockStats.completed_courses / mockStats.total_courses) * 100)} tamamlama oranı
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Öğrenme Süresi</p>
                  <p className="text-3xl font-bold">{mockStats.total_hours_watched}s</p>
                </div>
                <Clock className="w-8 h-8 text-purple-200" />
              </div>
              <div className="mt-4 flex items-center text-sm text-purple-100">
                <Activity className="w-4 h-4 mr-1" />
                Bu hafta 12 saat
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Günlük Seri</p>
                  <p className="text-3xl font-bold">{mockStats.current_streak}</p>
                </div>
                <Flame className="w-8 h-8 text-orange-200" />
              </div>
              <div className="mt-4 flex items-center text-sm text-orange-100">
                <Zap className="w-4 h-4 mr-1" />
                Harika gidiyorsun!
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Continue Learning */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="w-5 h-5 mr-2" />
                  Öğrenmeye Devam Et
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCourses.map((course) => (
                    <div key={course.course_id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                         onClick={() => navigate(`/course/${course.course_id}/learn`)}>
                      <img 
                        src={course.image_url} 
                        alt={course.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{course.title}</h3>
                        <p className="text-xs text-gray-500">{course.instructor_name}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Progress value={course.progress} className="flex-1 h-2" />
                          <span className="text-xs text-gray-500">{course.progress}%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Sonraki: {course.next_lesson_title}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {course.completed_lessons}/{course.total_lessons} ders
                        </p>
                        <p className="text-xs text-green-600 font-medium">
                          ~{course.estimated_completion}
                        </p>
                        <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Learning Analytics */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Öğrenme Analitikleri
                  </CardTitle>
                  <div className="flex space-x-2">
                    {(['week', 'month', 'year'] as const).map((period) => (
                      <Button
                        key={period}
                        variant={selectedPeriod === period ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedPeriod(period)}
                      >
                        {period === 'week' ? 'Hafta' : period === 'month' ? 'Ay' : 'Yıl'}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="hours" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="hours">Çalışma Saatleri</TabsTrigger>
                    <TabsTrigger value="lessons">Tamamlanan Dersler</TabsTrigger>
                    <TabsTrigger value="courses">Erişilen Kurslar</TabsTrigger>
                  </TabsList>

                  <TabsContent value="hours" className="mt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={mockActivityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString('tr-TR')}
                          formatter={(value: number) => [formatTime(value), 'Çalışma Süresi']}
                        />
                        <Area type="monotone" dataKey="hours_studied" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </TabsContent>

                  <TabsContent value="lessons" className="mt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={mockActivityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString('tr-TR')}
                          formatter={(value: number) => [value, 'Tamamlanan Ders']}
                        />
                        <Bar dataKey="lessons_completed" fill="#00C49F" />
                      </BarChart>
                    </ResponsiveContainer>
                  </TabsContent>

                  <TabsContent value="courses" className="mt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={mockActivityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString('tr-TR')}
                          formatter={(value: number) => [value, 'Erişilen Kurs']}
                        />
                        <Line type="monotone" dataKey="courses_accessed" stroke="#FF8042" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Kurs Durumu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-4">
                  <ResponsiveContainer width={200} height={200}>
                    <RechartsPieChart>
                      <Pie
                        data={pieData}
                        cx={100}
                        cy={100}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  Son Başarılar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { title: "İlk Kurs Tamamlandı", description: "İlk kursunu başarıyla tamamladın!", date: "2 gün önce", icon: "🎉" },
                    { title: "7 Günlük Seri", description: "7 gün üst üste ders çalıştın!", date: "1 hafta önce", icon: "🔥" },
                    { title: "Hızlı Öğrenci", description: "Bir günde 5 ders tamamladın!", date: "2 hafta önce", icon: "⚡" }
                  ].map((achievement, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{achievement.title}</h4>
                        <p className="text-xs text-gray-600">{achievement.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{achievement.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Hızlı İşlemler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/certificates')}>
                    <Award className="w-4 h-4 mr-2" />
                    Sertifikalarım
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/favorites')}>
                    <BookmarkIcon className="w-4 h-4 mr-2" />
                    Favorilerim
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/downloads')}>
                    <Download className="w-4 h-4 mr-2" />
                    İndirilenler
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/social')}>
                    <Users className="w-4 h-4 mr-2" />
                    Sosyal
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Son Aktiviteler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {[
                      { type: 'lesson_completed', title: 'React Hooks dersi tamamlandı', description: 'React ile Modern Web Geliştirme', time: '2 saat önce' },
                      { type: 'achievement_unlocked', title: 'Yeni başarı kazanıldı', description: '7 Günlük Seri', time: '1 gün önce' },
                      { type: 'course_enrolled', title: 'Yeni kursa kaydolundu', description: 'Python ile Veri Bilimi', time: '3 gün önce' },
                      { type: 'certificate_earned', title: 'Sertifika kazanıldı', description: 'JavaScript Temelleri', time: '1 hafta önce' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-gray-600">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};