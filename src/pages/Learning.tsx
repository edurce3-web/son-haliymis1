import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
    PlayCircle, BookOpen, Award, Search, CheckCircle,
    GraduationCap, BarChart2, ChevronRight, Flame,
    Trophy, Loader2, Clock, Star
} from 'lucide-react';
import { enrollmentAPI, certificatesAPI, getCourseImageUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { drawCertificate } from '@/lib/certificateGenerator';

const Learning = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'ongoing' | 'completed'>('all');
    const [isClaiming, setIsClaiming] = useState<number | null>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    const { data: enrollmentsData, isLoading, refetch } = useQuery({
        queryKey: ['enrolled-courses'],
        queryFn: () => enrollmentAPI.getEnrollments()
    });

    const courses = enrollmentsData?.items || [];

    const filtered = courses.filter((c: any) => {
        const matchSearch = c.title?.toLowerCase().includes(search.toLowerCase());
        if (filter === 'ongoing') return matchSearch && (c.progress || 0) < 100;
        if (filter === 'completed') return matchSearch && (c.progress || 0) === 100;
        return matchSearch;
    });

    const totalCompleted = courses.filter((c: any) => c.progress === 100).length;
    const inProgress = courses.filter((c: any) => (c.progress || 0) > 0 && c.progress < 100).length;
    const avgProgress = courses.length
        ? Math.round(courses.reduce((s: number, c: any) => s + (c.progress || 0), 0) / courses.length)
        : 0;

    const generateCertificate = async (course: any) => {
        if (!canvasRef.current || !user) return;
        setIsClaiming(course.course_id);
        try {
            const canvas = canvasRef.current;
            const dateStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            const certNo = `CERT-${Date.now().toString().slice(-8)}`;
            await drawCertificate(canvas, {
                studentName: `${user.first_name} ${user.last_name}`,
                courseTitle: course.title,
                instructorName: course.instructor_name || 'Neural Akademi',
                issuedDate: dateStr,
                certificateId: certNo,
            });
            const imageData = canvas.toDataURL('image/png');
            const result = await certificatesAPI.claimCertificate(course.course_id, imageData);
            if (result.success) {
                toast.success('Sertifikanız hazırlandı! Sertifikalarım sayfasından indirebilirsiniz.');
                refetch();
            }
        } catch (error: any) {
            toast.error(error?.message || 'Sertifika alınırken bir hata oluştu.');
        } finally {
            setIsClaiming(null);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-slate-400 text-sm animate-pulse">Kurslar yükleniyor...</p>
            </div>
        </div>
    );

    const stats = [
        { label: 'Toplam Kurs', value: courses.length, icon: BookOpen, gradient: 'from-indigo-500 to-blue-600', glow: 'shadow-indigo-500/25' },
        { label: 'Devam Eden', value: inProgress, icon: PlayCircle, gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/25' },
        { label: 'Tamamlanan', value: totalCompleted, icon: CheckCircle, gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/25' },
        { label: 'Ort. İlerleme', value: `%${avgProgress}`, icon: BarChart2, gradient: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/25' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
            <canvas ref={canvasRef} className="hidden" />

            {/* Header */}
            <div className="border-b border-white/5 bg-black/20 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <nav className="flex items-center gap-2 text-xs text-slate-500 mb-5">
                        <Link to="/" className="hover:text-indigo-400 transition-colors">Ana Sayfa</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-slate-300 font-medium">Öğrenim Alanım</span>
                    </nav>

                    <div className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                                    <GraduationCap className="w-5 h-5 text-white" />
                                </div>
                                <h1 className="text-2xl font-black text-white tracking-tight">Öğrenim Alanım</h1>
                            </div>
                            <p className="text-slate-400 text-sm pl-1">Tüm kurslarını buradan takip et, sertifika al.</p>
                        </div>

                        <div className="flex gap-3">
                            <Link
                                to="/home/gamification"
                                className="flex items-center gap-2 px-4 py-2.5 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 text-amber-300 rounded-2xl text-sm font-bold transition-all"
                            >
                                <Flame className="w-4 h-4" /> Başarılarım
                            </Link>
                            <Link
                                to="/home/certificates"
                                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 rounded-2xl text-sm font-bold transition-all"
                            >
                                <Award className="w-4 h-4" /> Sertifikalarım
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map(stat => (
                        <div
                            key={stat.label}
                            className="relative bg-slate-800/40 border border-white/8 rounded-2xl p-5 overflow-hidden group hover:border-white/15 transition-all duration-300"
                        >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`} />
                            </div>
                            <div className="relative flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.glow} shrink-0`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-white">{stat.value}</div>
                                    <div className="text-xs text-slate-400 font-medium mt-0.5">{stat.label}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row gap-3 mb-7">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Kurs ara..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-800/40 border border-white/8 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all"
                        />
                    </div>
                    <div className="flex rounded-2xl overflow-hidden border border-white/8 bg-slate-800/40">
                        {(['all', 'ongoing', 'completed'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-5 py-3 text-sm font-semibold transition-all ${
                                    filter === f
                                        ? 'bg-indigo-600 text-white shadow-lg' 
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                {f === 'all' ? 'Tümü' : f === 'ongoing' ? 'Devam Eden' : 'Tamamlanan'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Course Grid */}
                {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filtered.map((course: any) => (
                            <CourseCard
                                key={course.course_id}
                                course={course}
                                isClaiming={isClaiming}
                                onNavigate={() => navigate(`/learning/${course.course_id}`)}
                                onCertificate={() => navigate('/home/certificates')}
                                onClaim={() => generateCertificate(course)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-24 h-24 rounded-3xl bg-slate-800/60 border border-white/5 flex items-center justify-center mb-6 shadow-2xl">
                            <GraduationCap className="w-12 h-12 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {search ? 'Sonuç Bulunamadı' : 'Henüz Kursun Yok'}
                        </h3>
                        <p className="text-slate-400 text-sm mb-8 max-w-sm">
                            {search ? 'Farklı bir kelime deneyin.' : 'Kurslarını keşfetmek için alttaki butona tıkla.'}
                        </p>
                        {!search && (
                            <button
                                onClick={() => navigate('/courses')}
                                className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5"
                            >
                                <BookOpen className="w-4 h-4" />
                                Kursları Keşfet
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const CourseCard = ({
    course, isClaiming, onNavigate, onCertificate, onClaim
}: {
    course: any;
    isClaiming: number | null;
    onNavigate: () => void;
    onCertificate: () => void;
    onClaim: () => void;
}) => {
    const isCompleted = course.progress === 100;
    const progress = course.progress || 0;

    return (
        <div className="group relative bg-slate-800/40 border border-white/8 rounded-3xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 flex flex-col">
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden cursor-pointer shrink-0" onClick={onNavigate}>
                <img
                    src={getCourseImageUrl(course.course_id, course.thumbnail)}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                        <PlayCircle className="w-6 h-6 text-white" />
                    </div>
                </div>
                {isCompleted && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg">
                        <CheckCircle className="w-3 h-3" /> Tamamlandı
                    </div>
                )}
                {/* Progress overlay on thumb */}
                <div className="absolute bottom-0 left-0 right-0 h-1">
                    <div
                        className={`h-full transition-all ${isCompleted ? 'bg-emerald-400' : 'bg-indigo-400'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                {course.category_name && (
                    <span className="inline-block mb-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full w-fit">
                        {course.category_name}
                    </span>
                )}

                <h3
                    className="font-bold text-white text-sm line-clamp-2 mb-1 cursor-pointer hover:text-indigo-300 transition-colors leading-snug"
                    onClick={onNavigate}
                >
                    {course.title}
                </h3>
                <p className="text-xs text-slate-500 mb-4">{course.instructor_name || 'Neural Akademi'}</p>

                <div className="mt-auto space-y-3">
                    {/* Progress bar */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-500">İlerleme</span>
                            <span className={isCompleted ? 'text-emerald-400 font-bold' : 'text-indigo-400 font-bold'}>
                                %{progress}
                            </span>
                        </div>
                        <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-indigo-400 to-violet-400'}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={onNavigate}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                                isCompleted
                                    ? 'bg-slate-700/60 hover:bg-slate-700 text-slate-200'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                            }`}
                        >
                            {isCompleted ? 'Tekrar İzle' : 'Devam Et'}
                        </button>

                        {isCompleted && (
                            course.certificate_id ? (
                                <button
                                    onClick={onCertificate}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-xl transition-all"
                                >
                                    <Award className="w-3.5 h-3.5" /> Sertifika
                                </button>
                            ) : (
                                <button
                                    disabled={isClaiming === course.course_id}
                                    onClick={onClaim}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                                >
                                    {isClaiming === course.course_id
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : <Trophy className="w-3.5 h-3.5" />
                                    }
                                    {isClaiming === course.course_id ? 'Alınıyor...' : 'Sertifika Al'}
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Learning;
