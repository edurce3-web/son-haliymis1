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
import { PageBand } from '@/components/layout/PageBand';

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
                instructorName: course.instructor_name || 'Edurce',
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 border-4 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
                <p className="text-slate-500 text-sm animate-pulse">Kurslar yükleniyor...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <canvas ref={canvasRef} className="hidden" />

            <PageBand
                breadcrumb={
                    <>
                        <Link to="/" className="hover:text-brand-800 transition-colors">Ana sayfa</Link>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        <span className="text-slate-700">Eğitimlerim</span>
                    </>
                }
                title="Eğitimlerim"
                subtitle="Kurslarını buradan takip et, tamamladıklarının sertifikasını al."
                actions={
                    <>
                        <Link
                            to="/home/gamification"
                            className="h-10 px-4 leading-10 rounded-lg border border-slate-300 bg-white hover:border-brand-400 hover:text-brand-800 text-slate-700 text-sm font-semibold transition-colors"
                        >
                            Edurce Kredi
                        </Link>
                        <Link
                            to="/home/certificates"
                            className="h-10 px-4 leading-10 rounded-lg border border-slate-300 bg-white hover:border-brand-400 hover:text-brand-800 text-slate-700 text-sm font-semibold transition-colors"
                        >
                            Sertifikalarım
                        </Link>
                    </>
                }
            />

            <div className="container mx-auto px-5 sm:px-8 lg:px-10 max-w-[1280px] py-8">

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row gap-3 mb-7">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Kurs ara..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/25 transition-all"
                        />
                    </div>
                    <div className="flex rounded-2xl overflow-hidden border border-slate-200 bg-white">
                        {(['all', 'ongoing', 'completed'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-5 py-3 text-sm font-semibold transition-all ${
                                    filter === f
                                        ? 'bg-brand-700 text-white'
                                        : 'text-slate-500 hover:text-slate-900'
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
                    <div className="py-16">
                        <p className="text-[15px] text-slate-500">
                            {search
                                ? `"${search}" için sonuç bulunamadı.`
                                : 'Henüz bir kursa kayıtlı değilsin.'}
                        </p>
                        {!search && (
                            <button
                                onClick={() => navigate('/courses')}
                                className="h-10 px-5 mt-4 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-[14px] font-semibold transition-colors"
                            >
                                Kurslara göz at
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
        <div className="group relative bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-brand-300 transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/10 hover:-translate-y-1 flex flex-col">
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden cursor-pointer shrink-0" onClick={onNavigate}>
                <img
                    src={getCourseImageUrl(course.course_id, course.thumbnail)}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border border-slate-200">
                        <PlayCircle className="w-6 h-6 text-slate-900" />
                    </div>
                </div>
                {isCompleted && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg">
                        <CheckCircle className="w-3 h-3" /> Tamamlandı
                    </div>
                )}
                {/* Progress overlay on thumb */}
                <div className="absolute bottom-0 left-0 right-0 h-1">
                    <div
                        className={`h-full transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-brand-500'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                {course.category_name && (
                    <span className="inline-block mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-500 bg-brand-500/10 border border-brand-200 px-2.5 py-1 rounded-full w-fit">
                        {course.category_name}
                    </span>
                )}

                <h3
                    className="font-bold text-slate-900 text-sm line-clamp-2 mb-1 cursor-pointer hover:text-brand-700 transition-colors leading-snug"
                    onClick={onNavigate}
                >
                    {course.title}
                </h3>
                <p className="text-xs text-slate-500 mb-4">{course.instructor_name || 'Edurce'}</p>

                <div className="mt-auto space-y-3">
                    {/* Progress bar */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-500">İlerleme</span>
                            <span className={isCompleted ? 'text-emerald-600 font-bold' : 'text-brand-500 font-bold'}>
                                %{progress}
                            </span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-brand-600 to-brand-800'}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={onNavigate}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors ${
                                isCompleted
                                    ? 'bg-white border border-slate-300 hover:border-brand-400 hover:text-brand-800 text-slate-700'
                                    : 'bg-brand-700 hover:bg-brand-800 text-white'
                            }`}
                        >
                            {isCompleted ? 'Tekrar İzle' : 'Devam Et'}
                        </button>

                        {isCompleted && (
                            course.certificate_id ? (
                                <button
                                    onClick={onCertificate}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl transition-colors"
                                >
                                    <Award className="w-3.5 h-3.5" /> Sertifika
                                </button>
                            ) : (
                                <button
                                    disabled={isClaiming === course.course_id}
                                    onClick={onClaim}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
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
