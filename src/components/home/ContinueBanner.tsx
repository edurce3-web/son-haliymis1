import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, PlayCircle, Play } from 'lucide-react';
import { getCourseImageUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * "Kaldığın yerden devam et" şeridi.
 *
 * Giriş yapmış kullanıcının ana sayfada göreceği ilk şey. Kurs kartlarından
 * önce duruyor çünkü dönen kullanıcının çoğu yeni kurs aramaya değil,
 * bıraktığı derse devam etmeye geliyor.
 *
 * En son izlenen iki kurs gösteriliyor. Daha fazlası sayfanın en üstünü
 * kaplıyor ve asıl işi — tek tıkla derse dönmek — zorlaştırıyor; geri
 * kalanlar Eğitimlerim sayfasında duruyor.
 *
 * Devam eden kurs yoksa şerit hiç çizilmiyor. Yeni hesapta "%0 tamamlandı"
 * yazan boş bir blok, sayfanın en değerli yerini harcıyor.
 */
export const ContinueBanner: React.FC<{ courses?: any[] | null }> = ({ courses }) => {
    const list = (Array.isArray(courses) ? courses : courses ? [courses] : []).slice(0, 2);

    if (list.length === 0) return null;

    return (
        <section className="w-full font-jakarta bg-gradient-to-r from-[#e2e7ff] via-[#eaedff] to-[#f2f3ff]">
            <div className="container mx-auto px-4 py-3">
                <div
                    className={cn(
                        'grid gap-3',
                        list.length > 1 ? 'lg:grid-cols-2' : 'grid-cols-1'
                    )}
                >
                    {list.map(course => (
                        <ContinueCard key={course.id ?? course.course_id} course={course} />
                    ))}
                </div>
            </div>
        </section>
    );
};

const ContinueCard: React.FC<{ course: any }> = ({ course }) => {
    const navigate = useNavigate();

    const progress = Math.min(100, Math.max(0, Math.round(Number(course.progress) || 0)));
    const open = () => navigate(`/learning/${course.id}`);

    const img = getCourseImageUrl(
        course.id ?? course.course_id,
        course.image_url || course.image || course.thumbnail || course.image_path
    );

    return (
        <div className="flex items-center justify-between gap-3 bg-white px-3 py-2.5 rounded-xl shadow-sm">

            <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                    type="button"
                    onClick={open}
                    aria-label={`${course.title} dersine devam et`}
                    className="relative shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-slate-100 group"
                >
                    <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = '/placeholder-course.jpg'; }}
                    />
                    <span className="absolute inset-0 bg-brand-900/35 flex items-center justify-center group-hover:bg-brand-900/50 transition-colors">
                        <PlayCircle className="w-5 h-5 text-white" />
                    </span>
                </button>

                <div className="flex flex-col min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[#005c55] text-[10px] font-bold uppercase tracking-[0.1em]">
                        <GraduationCap className="w-3.5 h-3.5" />
                        Kaldığın yerden devam et
                    </span>

                    <h2 className="text-[13.5px] font-bold text-[#131b2e] truncate mt-0.5">
                        {course.title}
                    </h2>

                    <div className="flex items-center gap-2 mt-1 max-w-xs">
                        <div className="flex-1 h-1 bg-[#e2e7ff] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#005c55] rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-[10.5px] font-bold text-[#3e4947] tabular-nums shrink-0">
                            %{progress}
                        </span>
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={open}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-[#005c55] hover:bg-[#0f766e] text-white text-[12.5px] font-bold transition-colors"
            >
                <Play className="w-3.5 h-3.5 fill-current" />
                Derse devam et
            </button>
        </div>
    );
};

export default ContinueBanner;
