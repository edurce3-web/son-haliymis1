import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Play,
  Clock,
  Award,
  TrendingUp,
  Calendar,
  Star,
  Users,
  Target,
  CheckCircle,
  Circle,
  BarChart3,
  PieChart,
  Activity,
  Flame,
  Zap,
  Trophy,
  Medal,
  Crown,
  Heart,
  Eye,
  Download,
  Share2,
  MessageSquare,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronRight,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  BookmarkPlus,
  FileText,
  Video,
  Headphones,
  Globe,
  Smartphone,
  Monitor,
  Coffee,
  Brain,
  Lightbulb,
  Sparkles
} from 'lucide-react';

interface EnrolledCourse {
  course_id: number;
  title: string;
  instructor_name: string;
  instructor_avatar?: string;
  image_url: string;
  progress_percent: number;
  total_lessons: number;
  completed_lessons: number;
  total_duration: string;
  watched_duration: string;
  last_watched: string;
  rating?: number;
  certificate_earned: boolean;
  next_lesson: {
    lesson_id: number;
    title: string;
    duration: string;
  };
  category: string;
  level: string;
  enrollment_date: string;
}

interface LearningStats {
  total_courses: number;
  completed_courses: number;
  certificates_earned: number;
  total_watch_time: number;
  current_streak: number;
  longest_streak: number;
  weekly_goal: number;
  weekly_progress: number;
  skill_points: number;
  level: number;
  achievements: Achievement[];
}

interface Achievement {
  achievement_id: number;
  title: string;
  description: string;
  icon: string;
  earned_date: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface StudySession {
  session_id: number;
  course_title: string;
  lesson_title: string;
  duration: number;
  completed: boolean;
  date: string;
}

interface Recommendation {
  course_id: number;
  title: string;
  instructor_name: string;
  image_url: string;
  rating: number;
  student_count: number;
  price: number;
  reason: string;
  match_score: number;
}

export const StudentLearningDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch enrolled courses
  const { data: enrolledCourses, isLoading: coursesLoading } = useQuery({
    queryKey: ['enrolled-courses', searchQuery, filterCategory],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchQuery,
        category: filterCategory
      });
      const response = await fetch(`/api/student/courses?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    }
  });

  // Fetch learning stats
  const { data: learningStats } = useQuery({
    queryKey: ['learning-stats', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/student/stats?period=${selectedPeriod}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    }
  });

  // Fetch study sessions
  const { data: studySessions } = useQuery({
    queryKey: ['study-sessions', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/student/sessions?period=${selectedPeriod}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    }
  });

  // Fetch recommendations
  const { data: recommendations } = useQuery({
    queryKey: ['course-recommendations'],
    queryFn: async () => {
      const response = await fetch('/api/student/recommendations', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    }
  });

  const courses: EnrolledCourse[] = enrolledCourses?.courses || [];
  const stats: LearningStats = learningStats || {
    total_courses: 0,
    completed_courses: 0,
    certificates_earned: 0,
    total_watch_time: 0,
    current_streak: 0,
    longest_streak: 0,
    weekly_goal: 10,
    weekly_progress: 0,
    skill_points: 0,
    level: 1,
    achievements: []
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 20) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-500 bg-yellow-50';
      case 'epic': return 'text-purple-500 bg-purple-50';
      case 'rare': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const CourseCard: React.FC<{ course: EnrolledCourse }> = ({ course }) => (
    <Card className={`group hover:shadow-lg transition-all duration-300 ${
      viewMode === 'list' ? 'flex flex-row' : ''
    }`}>
      <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
        <img
          src={course.image_url}
          alt={course.title}
          className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            viewMode === 'list' ? 'h-32 rounded-l-lg' : 'h-48 rounded-t-lg'
          }`}
        />
        
        {/* Progress overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>{course.progress_percent}% tamamlandı</span>
            <span>{course.completed_lessons}/{course.total_lessons} ders</span>
          </div>
          <Progress 
            value={course.progress_percent} 
            className="h-1"
          />
        </div>

        {/* Certificate badge */}
        {course.certificate_earned && (
          <Badge className="absolute top-2 right-2 bg-yellow-500">
            <Award className="w-3 h-3 mr-1" />
            Sertifika
          </Badge>
        )}
      </div>

      <CardContent className={`p-4 flex-1 ${viewMode === 'list' ? 'flex flex-col justify-between' : ''}`}>
        <div>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-xs">
              {course.level}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {course.category}
            </Badge>
          </div>

          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {course.title}
          </h3>

          <div className="flex items-center space-x-2 mb-3">
            <Avatar className="w-6 h-6">
              <AvatarImage src={course.instructor_avatar} />
              <AvatarFallback className="text-xs">
                {course.instructor_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-700">{course.instructor_name}</span>
          </div>

          <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{course.watched_duration} / {course.total_duration}</span>
            </div>
            {course.rating && (
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{course.rating}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 mb-3">
            Son izleme: {new Date(course.last_watched).toLocaleDateString('tr-TR')}
          </p>
        </div>

        <div className="space-y-3">
          {course.next_lesson && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Sonraki Ders:</p>
                  <p className="text-xs text-blue-600">{course.next_lesson.title}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {course.next_lesson.duration}
                </Badge>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button className="flex-1" size="sm">
              <PlayCircle className="w-4 h-4 mr-1" />
              Devam Et
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: string;
    subtitle?: string;
  }> = ({ title, value, icon, color = 'text-blue-600', subtitle }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={color}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Merhaba, {user?.first_name}! 👋
              </h1>
              <p className="text-blue-100">
                Öğrenme yolculuğunuza devam edin
              </p>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-lg font-bold">{stats.current_streak} günlük seri</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">Seviye {stats.level} • {stats.skill_points} SP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Panel</TabsTrigger>
            <TabsTrigger value="courses">Kurslarım</TabsTrigger>
            <TabsTrigger value="progress">İlerleme</TabsTrigger>
            <TabsTrigger value="achievements">Başarılar</TabsTrigger>
            <TabsTrigger value="recommendations">Öneriler</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Toplam Kurs"
                value={stats.total_courses}
                icon={<BookOpen className="w-6 h-6" />}
                subtitle={`${stats.completed_courses} tamamlandı`}
              />
              <StatCard
                title="Sertifikalar"
                value={stats.certificates_earned}
                icon={<Award className="w-6 h-6" />}
                color="text-yellow-600"
              />
              <StatCard
                title="İzleme Süresi"
                value={formatDuration(stats.total_watch_time)}
                icon={<Clock className="w-6 h-6" />}
                color="text-green-600"
              />
              <StatCard
                title="En Uzun Seri"
                value={`${stats.longest_streak} gün`}
                icon={<Flame className="w-6 h-6" />}
                color="text-orange-600"
              />
            </div>

            {/* Weekly Goal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Haftalık Hedef</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">
                    {stats.weekly_progress} / {stats.weekly_goal} saat
                  </span>
                  <span className="text-sm font-medium">
                    %{Math.round((stats.weekly_progress / stats.weekly_goal) * 100)}
                  </span>
                </div>
                <Progress 
                  value={(stats.weekly_progress / stats.weekly_goal) * 100} 
                  className="h-3"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Harika gidiyorsun! Hedefinize {stats.weekly_goal - stats.weekly_progress} saat kaldı.
                </p>
              </CardContent>
            </Card>

            {/* Recent Activity & Continue Learning */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Öğrenmeye Devam Et</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courses.slice(0, 3).map((course) => (
                      <div key={course.course_id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <img
                          src={course.image_url}
                          alt={course.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm line-clamp-1">{course.title}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Progress value={course.progress_percent} className="h-1 flex-1" />
                            <span className="text-xs text-gray-500">{course.progress_percent}%</span>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <PlayCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Son Aktiviteler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {studySessions?.slice(0, 5).map((session: StudySession) => (
                      <div key={session.session_id} className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          session.completed ? 'bg-green-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{session.lesson_title}</p>
                          <p className="text-xs text-gray-500">
                            {session.course_title} • {formatDuration(session.duration)}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(session.date).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Kurslarım ({courses.length})</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Kurs ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Kategoriler</SelectItem>
                    <SelectItem value="programming">Programlama</SelectItem>
                    <SelectItem value="design">Tasarım</SelectItem>
                    <SelectItem value="business">İş Dünyası</SelectItem>
                    <SelectItem value="marketing">Pazarlama</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-4'
            }`}>
              {courses.map((course) => (
                <CourseCard key={course.course_id} course={course} />
              ))}
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Öğrenme İstatistikleri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tamamlanan Kurslar</span>
                      <span className="font-bold">{stats.completed_courses}/{stats.total_courses}</span>
                    </div>
                    <Progress 
                      value={(stats.completed_courses / stats.total_courses) * 100} 
                      className="h-2"
                    />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Ortalama İlerleme</span>
                      <span className="font-bold">
                        {Math.round(courses.reduce((acc, course) => acc + course.progress_percent, 0) / courses.length || 0)}%
                      </span>
                    </div>
                    <Progress 
                      value={courses.reduce((acc, course) => acc + course.progress_percent, 0) / courses.length || 0} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Haftalık Aktivite</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32 flex items-end justify-between space-x-2">
                    {Array.from({ length: 7 }, (_, i) => (
                      <div key={i} className="flex flex-col items-center space-y-2">
                        <div 
                          className="w-8 bg-blue-200 rounded-sm"
                          style={{ height: `${Math.random() * 80 + 20}%` }}
                        />
                        <span className="text-xs text-gray-500">
                          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Kurs İlerlemeleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div key={course.course_id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{course.title}</h4>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span>{course.progress_percent}% tamamlandı</span>
                              <span>{course.completed_lessons}/{course.total_lessons} ders</span>
                            </div>
                            <Progress value={course.progress_percent} className="h-2" />
                          </div>
                          <Badge variant="outline">
                            {course.watched_duration} / {course.total_duration}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="text-center mb-8">
              <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Başarılarınız</h2>
              <p className="text-gray-600">
                {stats.achievements.length} başarı kazandınız
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.achievements.map((achievement) => (
                <Card key={achievement.achievement_id} className={`${getRarityColor(achievement.rarity)} border-2`}>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4">{achievement.icon}</div>
                    <h3 className="font-bold text-lg mb-2">{achievement.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                    <Badge variant="outline" className={getRarityColor(achievement.rarity)}>
                      {achievement.rarity}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(achievement.earned_date).toLocaleDateString('tr-TR')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <div className="text-center mb-8">
              <Lightbulb className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Size Özel Öneriler</h2>
              <p className="text-gray-600">
                İlgi alanlarınıza göre seçilmiş kurslar
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations?.map((rec: Recommendation) => (
                <Card key={rec.course_id} className="hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={rec.image_url}
                      alt={rec.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <Badge className="absolute top-2 right-2 bg-blue-500">
                      %{rec.match_score} eşleşme
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{rec.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{rec.instructor_name}</p>
                    
                    <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{rec.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{rec.student_count.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-green-600">₺{rec.price}</span>
                      <Button size="sm">
                        Sepete Ekle
                      </Button>
                    </div>

                    <p className="text-xs text-blue-600 mt-2 font-medium">
                      💡 {rec.reason}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
