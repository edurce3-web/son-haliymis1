import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Search, Edit, Users, Star, Wallet, Plus, Loader2,
    BookOpen, Globe, Lock, Clock, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    students: number;
    revenue: number;
    rating: number;
    reviews: number;
    status: 'active' | 'draft' | 'pending';
    lastUpdated: string;
    price: number;
    currency: string;
}

export const CourseList: React.FC = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const apiBase = (window as any)?.__API_BASE__ || (import.meta as any)?.env?.VITE_API_URL || 'https://api.edurce.com';

    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token') || localStorage.getItem('authToken');
                const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
                const res = await fetch(`${apiBase}/api/instructor/courses`, { headers, credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.courses)) {
                        setCourses(data.courses.map((c: any) => ({
                            id: String(c.id || c.course_id),
                            title: c.title || 'İsimsiz Kurs',
                            description: c.description || '',
                            thumbnail: c.thumbnail || c.image_path || '',
                            students: Number(c.student_count || 0),
                            revenue: Number(c.price || 0) * Number(c.student_count || 0),
                            rating: Number(c.rating || 0),
                            reviews: Number(c.review_count || 0),
                            status: c.status === 'published' ? 'active' : c.status === 'draft' ? 'draft' : 'pending',
                            lastUpdated: c.updated_at || c.created_at || new Date().toISOString(),
                            price: Number(c.price || 0),
                            currency: c.currency || 'TRY'
                        })));
                    }
                }
            } catch (err) {
                toast.error('Kurslar yüklenirken bir sorun oluştu.');
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, [apiBase]);

    const filtered = useMemo(() => {
        let result = courses.filter(c =>
            c.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        result.sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
            if (sortBy === 'oldest') return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
            if (sortBy === 'students') return b.students - a.students;
            if (sortBy === 'revenue') return b.revenue - a.revenue;
            return 0;
        });
        return result;
    }, [courses, searchQuery, sortBy]);

    const published = filtered.filter(c => c.status === 'active');
    const drafts = filtered.filter(c => c.status !== 'active');

    const formatPrice = (price: number, currency: string) => {
        if (price <= 0) return 'Ücretsiz';
        const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₺';
        return `${sym}${price.toLocaleString('tr-TR')}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
            </div>
        );
    }

    const StatusBadge = ({ status }: { status: Course['status'] }) => {
        if (status === 'active') return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                <Globe className="w-2.5 h-2.5" /> Yayında
            </span>
        );
        if (status === 'pending') return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                <Clock className="w-2.5 h-2.5" /> İncelemede
            </span>
        );
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200 text-[10px] font-semibold">
                <Lock className="w-2.5 h-2.5" /> Taslak
            </span>
        );
    };

    const CourseCard = ({ course }: { course: Course }) => (
        <div className="group flex items-center gap-6 bg-white border border-zinc-100 rounded-2xl px-6 py-5 hover:border-zinc-200 hover:shadow-md transition-all duration-200">
            {/* Thumbnail */}
            <div className="w-32 h-20 rounded-xl bg-zinc-100 flex-shrink-0 overflow-hidden shadow-sm">
                {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-zinc-300" />
                    </div>
                )}
            </div>

            {/* Title + Status */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={course.status} />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 truncate">{course.title}</h3>
                {course.description && (
                    <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-sm">{course.description}</p>
                )}
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-8 flex-shrink-0">
                <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-sm font-bold text-zinc-800">{course.students.toLocaleString('tr-TR')}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium">Öğrenci</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-sm font-bold text-zinc-800">{course.rating > 0 ? course.rating.toFixed(1) : '—'}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium">Puan</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-sm font-bold text-emerald-700">{formatPrice(course.price, course.currency)}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium">Fiyat</span>
                </div>
            </div>

            {/* Edit Button */}
            <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/instructor/courses/edit/${course.id}`)}
                className="flex-shrink-0 h-10 px-5 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 border border-zinc-100 gap-2"
            >
                <Edit className="w-3.5 h-3.5" />
                {course.status === 'active' ? 'Düzenle' : 'Devam Et'}
            </Button>
        </div>
    );

    const SectionHeader = ({ label, count, color }: { label: string; count: number; color: string }) => (
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <h2 className="text-sm font-bold text-zinc-800">{label}</h2>
                <span className="text-xs text-zinc-400 font-medium">{count} kurs</span>
            </div>
        </div>
    );

    const EmptyRow = ({ text }: { text: string }) => (
        <div className="flex items-center justify-center py-8 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl text-sm text-zinc-400">
            {text}
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900">Kurslarım</h1>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        {courses.length > 0 ? `${published.length} yayında · ${drafts.length} taslak` : 'Henüz kurs oluşturmadınız'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                        <Input
                            placeholder="Kurs ara..."
                            className="pl-8 h-9 w-48 bg-white border-zinc-200 rounded-lg text-sm focus-visible:ring-zinc-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-36 h-9 bg-white border-zinc-200 rounded-lg text-sm focus:ring-zinc-400">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">En Yeniler</SelectItem>
                            <SelectItem value="oldest">En Eskiler</SelectItem>
                            <SelectItem value="students">Öğrenci</SelectItem>
                            <SelectItem value="revenue">Gelir</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={() => navigate('/instructor/courses/create')}
                        className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 px-4 gap-1.5 text-sm font-semibold"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Yeni Kurs
                    </Button>
                </div>
            </div>

            {courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center mb-4">
                        <BookOpen className="w-7 h-7 text-zinc-300" />
                    </div>
                    <h2 className="text-base font-bold text-zinc-900 mb-1">Henüz kurs oluşturmadınız</h2>
                    <p className="text-sm text-zinc-500 max-w-xs mb-6">İlk kursunuzu oluşturarak öğrencilerinize ulaşmaya başlayın.</p>
                    <Button
                        onClick={() => navigate('/instructor/courses/create')}
                        className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg px-6 h-10 font-semibold gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        İlk Kursunu Oluştur
                    </Button>
                </div>
            ) : (
                <>
                    {/* Published */}
                    <section>
                        <SectionHeader label="Yayındaki Kurslar" count={published.length} color="bg-emerald-500" />
                        <div className="space-y-2">
                            {published.length > 0
                                ? published.map(c => <CourseCard key={c.id} course={c} />)
                                : <EmptyRow text="Yayında kurs yok" />}
                        </div>
                    </section>

                    {/* Drafts */}
                    <section>
                        <SectionHeader label="Taslak Kurslar" count={drafts.length} color="bg-zinc-400" />
                        <div className="space-y-2">
                            {drafts.length > 0
                                ? drafts.map(c => <CourseCard key={c.id} course={c} />)
                                : <EmptyRow text="Taslak kurs yok" />}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
};
