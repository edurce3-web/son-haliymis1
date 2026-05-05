import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  TrendingUp,
  Users,
  BookOpen,
  DollarSign,
  Star,
  Eye,
  Clock,
  Target,
  Award,
  MessageCircle,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Trophy,
  Gift,
  Bell,
  Settings,
  Plus,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle,
  AlertCircle,
  TrendingDown,
  PlayCircle,
  Download,
  Share2,
  Edit,
  MoreHorizontal,
  Filter,
  Search,
  RefreshCw,
  User,
  Camera,
  Mail,
  MessageSquare,
  Facebook,
  Instagram,
  Youtube,
  Globe,
  Twitter,
  X as XIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';

interface DashboardStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalStudents: number;
  newStudents: number;
  totalCourses: number;
  activeCourses: number;
  avgRating: number;
  totalReviews: number;
  completionRate: number;
  engagementRate: number;
}

interface StudentRow {
  id: string | number;
  name: string;
  email: string;
  avatar?: string;
  courseCount: number;
  progress: number; // 0-100
  status: 'Aktif' | 'Tamamlandı' | 'Pasif';
  lastActivity: string; // ISO date
}

interface Course {
  id: string;
  title: string;
  thumbnail: string;
  students: number;
  revenue: number;
  rating: number;
  reviews: number;
  status: 'active' | 'draft' | 'pending';
  lastUpdated: string;
  completionRate: number;
  engagementScore: number;
}

interface RecentActivity {
  id: string;
  type: 'enrollment' | 'review' | 'completion' | 'question' | 'purchase';
  message: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
  course?: string;
  rating?: number;
}

export default function EnhancedInstructorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 45680,
    monthlyRevenue: 8950,
    totalStudents: 2847,
    newStudents: 156,
    totalCourses: 12,
    activeCourses: 10,
    avgRating: 4.7,
    totalReviews: 1234,
    completionRate: 78,
    engagementRate: 85
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const revenueData = [];

  const coursePerformanceData = [];

  const trafficSourceData = [];

  const [firstName, setFirstName] = useState('Ahmet');
  const [lastName, setLastName] = useState('Yılmaz');
  const [titleValue, setTitleValue] = useState('Senior Full Stack Developer');
  const [bioValue, setBioValue] = useState('10 yıldan fazla yazılım geliştirme deneyimine sahip bir eğitmen olarak, binlerce öğrenciye modern web teknolojileri öğrettim.');

  // Specializations state
  const [specializations, setSpecializations] = useState<string[]>(['girişimci', 'e - ticaret']);
  const [newSpec, setNewSpec] = useState('');

  // Social links state
  const [socialLinks, setSocialLinks] = useState({
    youtube: 'https://youtube.com/@kanal',
    instagram: 'https://instagram.com/kullanici',
    facebook: 'https://facebook.com/sayfa',
    x: 'https://x.com/kullanici',
    website: 'https://websitesi.com',
    tiktok: 'https://tiktok.com/@kullanici'
  });

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);

  // Students state
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [studentsLoading, setStudentsLoading] = useState<boolean>(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [studentQuery, setStudentQuery] = useState('');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [courseStatusFilter, setCourseStatusFilter] = useState<'all' | 'active' | 'draft' | 'pending'>('all');

  const apiBase = (window as any)?.__API_BASE__ || (import.meta as any)?.env?.VITE_API_URL || 'https://api.edurce.com';

  useEffect(() => {
    // Fetch students for instructor
    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        setStudentsError(null);
        const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('access_token');
        const res = await fetch(`${apiBase}/api/instructor/students`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error(`Öğrenciler alınamadı (${res.status})`);
        }
        const data = await res.json();
        // Normalize
        const rows: StudentRow[] = (Array.isArray(data) ? data : data.students || []).map((s: any) => ({
          id: s.id ?? s.user_id ?? s.email,
          name: s.name ?? s.full_name ?? `${s.first_name || ''} ${s.last_name || ''}`.trim(),
          email: s.email,
          avatar: s.avatar || s.avatar_url,
          courseCount: Number(s.courseCount ?? s.course_count ?? s.courses ?? 0),
          progress: Math.round(Number(s.progress ?? s.progress_percent ?? 0)),
          status: (s.statusText ?? s.status ?? 'Aktif') as StudentRow['status'],
          lastActivity: s.lastActivity ?? s.last_activity ?? new Date().toISOString(),
        }));
        setStudents(rows);
      } catch (e: any) {
        console.error(e);
        setStudentsError(e.message || 'Bilinmeyen hata');
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch instructor's courses from backend
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('access_token');
        const res = await fetch(`${apiBase}/api/instructor/courses`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          credentials: 'include'
        });

        if (!res.ok) {
          throw new Error(`Kurslar alınamadı (${res.status})`);
        }

        const data = await res.json();
        console.log('Backend API Response:', data); // DEBUG log

        if (data.success && Array.isArray(data.courses)) {
          console.log('Courses found:', data.courses.length); // DEBUG log

          // Map backend data to frontend Course interface
          const mappedCourses: Course[] = data.courses.map((c: any) => ({
            id: String(c.id || c.course_id),
            title: c.title || 'Başlıksız Kurs',
            thumbnail: c.thumbnail || c.image_path || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
            students: Number(c.student_count || 0),
            revenue: Number(c.price || 0) * Number(c.student_count || 0),
            rating: Number(c.rating || 0),
            reviews: Number(c.review_count || 0),
            status: (c.status === 'published' ? 'active' : c.status === 'draft' ? 'draft' : 'pending') as 'active' | 'draft' | 'pending',
            lastUpdated: c.updated_at || c.created_at || new Date().toISOString(),
            completionRate: Number(c.completion_rate || 0),
            engagementScore: Number(c.engagement_score || 0)
          }));
          setCourses(mappedCourses);
        }
      } catch (e: any) {
        console.error('Kurs yükleme hatası:', e);
        toast.error('Kurslar yüklenirken bir hata oluştu');
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredStudents = students.filter(s => {
    const q = studentQuery.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  const timeAgo = (iso: string) => {
    if (!iso) return 'Bilinmiyor';
    const d = new Date(iso);
    const diff = Math.max(0, Date.now() - d.getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} dakika önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} saat önce`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} gün önce`;
    const weeks = Math.floor(days / 7);
    return `${weeks} hafta önce`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment': return Users;
      case 'review': return Star;
      case 'completion': return CheckCircle;
      case 'question': return MessageCircle;
      case 'purchase': return DollarSign;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'enrollment': return 'text-blue-500';
      case 'review': return 'text-yellow-500';
      case 'completion': return 'text-green-500';
      case 'question': return 'text-purple-500';
      case 'purchase': return 'text-emerald-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Aktif</Badge>;
      case 'draft': return <Badge className="bg-yellow-100 text-yellow-800">Taslak</Badge>;
      case 'pending': return <Badge className="bg-blue-100 text-blue-800">Beklemede</Badge>;
      default: return <Badge variant="outline">Bilinmiyor</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-8">
      {/* Balanced Professional Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 md:p-10 text-white shadow-xl group">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent" />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <Zap className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Eğitmen Paneli</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Hoş geldin, <span className="text-indigo-400">{firstName}</span>.
            </h1>
            <p className="text-slate-400 font-medium text-base max-w-lg">
              Performans özetiniz ve kurs aktiviteleriniz burada yer almaktadır.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              variant="outline"
              className="h-12 px-6 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold text-sm backdrop-blur-sm transition-all"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Yenile
            </Button>
            <Button
              className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-900/20 transition-all hover:scale-[1.02]"
              onClick={() => navigate('/instructor/courses/create')}
            >
              <Plus className="w-5 h-5 mr-2" />
              Yeni Kurs
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="h-12 w-full max-w-3xl mx-auto p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
          <TabsTrigger value="overview" className="flex-1 rounded-lg h-10 font-bold text-xs data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">Genel Bakış</TabsTrigger>
          <TabsTrigger value="courses" className="flex-1 rounded-lg h-10 font-bold text-xs data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">Kurslarım</TabsTrigger>
          <TabsTrigger value="students" className="flex-1 rounded-lg h-10 font-bold text-xs data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">Öğrenciler</TabsTrigger>
          <TabsTrigger value="revenue" className="flex-1 rounded-lg h-10 font-bold text-xs data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">Gelir</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 rounded-lg h-10 font-bold text-xs data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">Eğitmen Profili</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-500 transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                  <Users className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Toplam Öğrenci</p>
                  <h3 className="text-2xl font-bold text-slate-900 leading-none">{stats.totalStudents.toLocaleString()}</h3>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                <ArrowUp className="w-3 h-3" />
                %{Math.round((stats.newStudents / stats.totalStudents) * 100)} artış
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                  <DollarSign className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Toplam Gelir</p>
                  <h3 className="text-2xl font-bold text-slate-900 leading-none">₺{stats.totalRevenue.toLocaleString()}</h3>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                <ArrowUp className="w-3 h-3" />
                %12.5 bu ay
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-500 transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-600 transition-colors">
                  <Star className="w-5 h-5 text-amber-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ortalama Puan</p>
                  <div className="flex items-end gap-1.5 text-slate-900 leading-none">
                    <h3 className="text-2xl font-bold">{stats.avgRating}</h3>
                    <span className="text-sm font-semibold text-slate-400">/ 5.0</span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg w-fit">
                Son 30 Gün
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-500 transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                  <Activity className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Etkileşim</p>
                  <h3 className="text-2xl font-bold text-slate-900 leading-none">%{stats.engagementRate}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Revenue Chart */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Gelir Trendi</h4>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Son 12 Ay</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold text-slate-600">Gelir (₺)</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '0.75rem' }}
                    itemStyle={{ fontWeight: 700, fontSize: '12px' }}
                    labelStyle={{ fontWeight: 700, fontSize: '12px', marginBottom: '0.25rem' }}
                    formatter={(value) => [`₺${value.toLocaleString()}`, 'Gelir']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Course Performance */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Öğrenci Kayıtları</h4>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Kurs Kayıt Analizi</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-600">Yeni Katılım</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={coursePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '0.75rem' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="enrollments" fill="#10b981" radius={[4, 4, 0, 0]} name="Kayıt" barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-600">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Trafik Kaynakları</h4>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ziyaretçi Kanalları</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="relative group">
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={trafficSourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {trafficSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <p className="text-2xl font-bold text-slate-900 leading-none">100%</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Toplam</p>
                </div>
              </div>

              <div className="space-y-3">
                {trafficSourceData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100/50 hover:border-slate-200 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <div>
                        <span className="text-sm font-bold text-slate-700">{item.name}</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-900">%{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>


        <TabsContent value="courses" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-6 border-b-2 border-slate-100 animate-in fade-in slide-in-from-left-4 duration-500">
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Kurs Portfolyosu</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">İçeriklerini Buradan Yönetebilirsin</p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Hızlıca kurs ara..."
                  className="pl-12 h-14 rounded-2xl bg-white border-2 border-slate-200 shadow-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20 transition-all font-bold text-slate-700"
                  value={courseSearchQuery}
                  onChange={(e) => setCourseSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="h-14 w-14 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 p-0 shrink-0">
                <Filter className="w-6 h-6 text-slate-600" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'active', label: 'Yayında' },
              { id: 'draft', label: 'Taslak' },
              { id: 'pending', label: 'İncelemede' }
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={courseStatusFilter === tab.id ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-full px-4 font-semibold text-xs",
                  courseStatusFilter === tab.id ? "bg-purple-600 hover:bg-purple-700" : "bg-white border-gray-200"
                )}
                onClick={() => setCourseStatusFilter(tab.id as any)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {loadingCourses ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.filter(c => {
                const matchesSearch = c.title.toLowerCase().includes(courseSearchQuery.toLowerCase());
                const matchesStatus = courseStatusFilter === 'all' || c.status === courseStatusFilter;
                return matchesSearch && matchesStatus;
              }).length > 0 ? (
                courses
                  .filter(c => {
                    const matchesSearch = c.title.toLowerCase().includes(courseSearchQuery.toLowerCase());
                    const matchesStatus = courseStatusFilter === 'all' || c.status === courseStatusFilter;
                    return matchesSearch && matchesStatus;
                  })
                  .map((course) => (
                    <div key={course.id} className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-xl shadow-slate-200/40 hover:border-indigo-500 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 group overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex flex-col lg:flex-row">
                        <div className="relative w-full lg:w-72 h-48 lg:h-auto overflow-hidden">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute top-4 left-4 flex flex-col gap-2">
                            {course.status === 'active' && <Badge className="bg-emerald-500 text-white border-0 text-[10px] font-black px-3 py-1 rounded-lg shadow-lg shadow-emerald-500/30">YAYINDA</Badge>}
                            {course.status === 'draft' && <Badge className="bg-slate-700 text-white border-0 text-[10px] font-black px-3 py-1 rounded-lg">TASLAK</Badge>}
                            {course.status === 'pending' && <Badge className="bg-indigo-500 text-white border-0 text-[10px] font-black px-3 py-1 rounded-lg shadow-lg shadow-indigo-500/30">İNCELEMEDE</Badge>}
                          </div>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <Button
                              size="icon"
                              className="w-12 h-12 rounded-2xl bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-xl"
                              onClick={() => navigate(`/instructor/courses/edit/${course.id}`)}
                            >
                              <Edit className="w-6 h-6" />
                            </Button>
                            <Button size="icon" className="w-12 h-12 rounded-2xl bg-white text-slate-800 hover:bg-slate-800 hover:text-white transition-all shadow-xl">
                              <Eye className="w-6 h-6" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex-1 p-8 flex flex-col justify-between">
                          <div className="space-y-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-none tracking-tight mb-2">
                                  {course.title}
                                </h4>
                                <div className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                                  <span>ID: #{course.id.slice(0, 8)}</span>
                                  <span>•</span>
                                  <span>Güncellendi: {timeAgo(course.lastUpdated)}</span>
                                </div>
                              </div>
                              <Button variant="ghost" className="h-10 w-10 rounded-xl hover:bg-slate-100">
                                <MoreHorizontal className="w-6 h-6 text-slate-400" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Öğrenci</p>
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-indigo-500" />
                                  <span className="text-lg font-black text-slate-900">{course.students.toLocaleString()}</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Puanlama</p>
                                <div className="flex items-center gap-2">
                                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                  <span className="text-lg font-black text-slate-900">{course.rating}</span>
                                  <span className="text-sm font-bold text-slate-400">({course.reviews})</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Etkileşim</p>
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                                  <span className="text-lg font-black text-emerald-600">%{course.engagementScore}</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tamamlanma</p>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${course.completionRate}%` }} />
                                  </div>
                                  <span className="text-sm font-black text-slate-900">%{course.completionRate}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Toplam Kazanç</p>
                              <p className="text-3xl font-black text-emerald-600">₺{course.revenue.toLocaleString()}</p>
                            </div>
                            <div className="flex gap-3">
                              <Button className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-6 font-black text-sm transition-all shadow-lg shadow-slate-200">
                                Analizlere Bak
                              </Button>
                              <Button variant="outline" className="h-12 rounded-xl border-2 border-slate-200 font-black text-sm hover:bg-slate-50">
                                Paylaş
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Kurs Bulunamadı</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Kriterlerinize uygun kurs bulunmamaktadır.
                  </p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Öğrenci Yönetimi</h3>
                <p className="text-sm font-medium text-slate-400 mt-1">Öğrencilerin ilerlemesini takip edin ve iletişime geçin.</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="İsim veya e-posta ara..."
                  className="pl-9 h-10 w-64 rounded-xl text-sm"
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-100">
              <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <div className="col-span-4">Öğrenci Bilgileri</div>
                <div className="col-span-2 text-center">Kurs Sayısı</div>
                <div className="col-span-3">İlerleme</div>
                <div className="col-span-1 text-center">Durum</div>
                <div className="col-span-2 text-right">Eylemler</div>
              </div>

              {studentsLoading && (
                <div className="p-12 text-center text-slate-400 font-bold">Yükleniyor...</div>
              )}

              {!studentsLoading && (
                <div className="divide-y divide-slate-100">
                  {filteredStudents.map((s) => (
                    <div key={s.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group">
                      <div className="col-span-4 flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-xl border border-slate-200">
                          <AvatarImage src={s.avatar || '/avatar.svg'} alt={s.name} />
                          <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-xs">{(s.name || '?').slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 text-sm truncate">{s.name}</div>
                          <div className="text-[10px] font-bold text-slate-400 truncate">{s.email}</div>
                        </div>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="inline-flex items-center justify-center h-7 px-3 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs">
                          {s.courseCount}
                        </span>
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${s.progress}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-800">%{s.progress}</span>
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Badge variant="outline" className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${s.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          s.status === 'Tamamlandı' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                          {s.status}
                        </Badge>
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all">
                          <Mail className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" className="w-8 h-8 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {filteredStudents.length === 0 && (
                    <div className="p-8 text-center text-slate-400 font-bold">Öğrenci bulunamadı.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-8">
          <div className="pb-6 border-b-2 border-slate-100 animate-in fade-in slide-in-from-left-4 duration-500">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Gelir Özeti</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Kazançlarını ve Ödeme Geçmişini Buradan Takip Et</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.length > 0 ? (
              courses.map((course) => (
                <div key={course.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 transition-all group overflow-hidden">
                  <div className="h-32 overflow-hidden relative">
                    <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-slate-900/20" />
                    <div className="absolute bottom-3 left-4">
                      <h4 className="text-sm font-bold text-white line-clamp-1">{course.title}</h4>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">GELİR</p>
                        <h3 className="text-xl font-bold text-slate-900">₺{course.revenue.toLocaleString()}</h3>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                        Ödeme Talebi
                      </Button>
                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-slate-200">
                        <BarChart3 className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100">
                <p className="text-slate-400 font-bold">Henüz gelir verisi bulunmuyor.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Eğitmen Profili</h3>
              <p className="text-sm font-medium text-slate-400">Profil bilgilerinizi ve bildirim tercihlerinizi güncelleyin.</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-2xl border border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-bold">Profil Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <Avatar className="w-16 h-16 rounded-xl border-2 border-white shadow-sm">
                      <AvatarImage src="/avatar.svg" alt="avatar" />
                      <AvatarFallback className="bg-slate-900 text-white font-bold">PR</AvatarFallback>
                    </Avatar>
                    <div>
                      <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg font-bold text-xs border-slate-200 hover:bg-white transition-all">
                        Fotoğraf Değiştir
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Ad</Label>
                      <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-10 rounded-xl border-slate-200 focus:border-indigo-500 font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Soyad</Label>
                      <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-10 rounded-xl border-slate-200 focus:border-indigo-500 font-medium" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Unvan/Pozisyon</Label>
                    <Input id="title" value={titleValue} onChange={(e) => setTitleValue(e.target.value)} className="h-10 rounded-xl border-slate-200 focus:border-indigo-500 font-medium" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Kendinizi Tanıtın</Label>
                    <Textarea id="bio" rows={4} value={bioValue} onChange={(e) => setBioValue(e.target.value)} className="rounded-xl border-slate-200 focus:border-indigo-500 font-medium resize-none" />
                  </div>

                  {/* Specializations Section */}
                  <div className="space-y-4 pt-4">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Uzmanlık Alanları (İsteğe bağlı)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="ör. JavaScript, Marketing, Tasarım (isteğe bağlı)"
                        value={newSpec}
                        onChange={(e) => setNewSpec(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newSpec.trim()) {
                              setSpecializations([...specializations, newSpec.trim()]);
                              setNewSpec('');
                            }
                          }
                        }}
                        className="h-10 rounded-xl border-slate-200 focus:border-indigo-500 font-medium"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-xl border-slate-200 font-bold"
                        onClick={() => {
                          if (newSpec.trim()) {
                            setSpecializations([...specializations, newSpec.trim()]);
                            setNewSpec('');
                          }
                        }}
                      >
                        Ekle
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {specializations.map((spec, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border-0 flex items-center gap-1">
                          {spec}
                          <button
                            onClick={() => setSpecializations(specializations.filter((_, i) => i !== index))}
                            className="hover:text-red-500"
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Social Media Links */}
                  <div className="space-y-4 pt-4">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Sosyal Medya Linkleri</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-800">YouTube Kanalı</Label>
                        <Input
                          value={socialLinks.youtube}
                          onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                          placeholder="https://youtube.com/@kanal"
                          className="h-10 rounded-xl border-slate-200 focus:border-indigo-500 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-800">Instagram</Label>
                        <Input
                          value={socialLinks.instagram}
                          onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                          placeholder="https://instagram.com/kullanici"
                          className="h-10 rounded-xl border-slate-200 focus:border-indigo-500 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-800">Facebook</Label>
                        <Input
                          value={socialLinks.facebook}
                          onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                          placeholder="https://facebook.com/sayfa"
                          className="h-10 rounded-xl border-slate-200 focus:border-indigo-500 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-800">X (Twitter)</Label>
                        <Input
                          value={socialLinks.x}
                          onChange={(e) => setSocialLinks({ ...socialLinks, x: e.target.value })}
                          placeholder="https://x.com/kullanici"
                          className="h-10 rounded-xl border-slate-200 focus:border-indigo-500 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-800">Web Sitesi</Label>
                        <Input
                          value={socialLinks.website}
                          onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                          placeholder="https://websitesi.com"
                          className="h-10 rounded-xl border-slate-200 focus:border-indigo-500 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-800">TikTok</Label>
                        <Input
                          value={socialLinks.tiktok}
                          onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                          placeholder="https://tiktok.com/@kullanici"
                          className="h-10 rounded-xl border-slate-200 focus:border-indigo-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-slate-100 pt-6">
                    <Button className="h-10 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all active:scale-95">
                      Kayıt Et
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="rounded-2xl border border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-bold">Bildirimler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-800">E-posta</span>
                    </div>
                    <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-800">Mesajlar</span>
                    </div>
                    <Switch checked={notifMessages} onCheckedChange={setNotifMessages} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-800">Pazarlama</span>
                    </div>
                    <Switch checked={notifMarketing} onCheckedChange={setNotifMarketing} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Kampanyalar</h3>
              <p className="text-sm font-medium text-slate-400">Satışları artırmak için özel teklifler oluşturun.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-indigo-500 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-indigo-600" />
                </div>
                <Badge className="bg-emerald-500 text-white border-0 text-[10px] font-bold px-2 py-0.5 rounded-lg">AKTİF</Badge>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Yaz İndirimi</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">%50 İNDİRİM</p>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Kullanım</span>
                  <span className="text-slate-900">45/100</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-amber-500 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-lg border-slate-200">BEKLEMEDE</Badge>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Yeni Öğrenci</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">%30 İNDİRİM</p>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Kullanım</span>
                  <span className="text-slate-900">12/50</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '24%' }} />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 p-8 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
              <p className="text-sm font-bold text-slate-500 mb-4">Mevcut kampanyalarınızı yönetin veya yenisini başlatın.</p>
              <Button className="h-10 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Kampanya
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
