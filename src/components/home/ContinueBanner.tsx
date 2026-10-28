import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, PlayCircle, Play } from 'lucide-react';
import { getCourseImageUrl } from '@/lib/api';

/**
 * "Kaldığın yerden devam et" şeridi.
 *
 * Giriş yapmış kullanıcının ana sayfada göreceği ilk şey. Kurs kartlarından
 * önce duruyor çünkü dönen kullanıcının onda dokuzu yeni kurs aramaya değil,
 * bıraktığı derse devam etmeye geliyor.
 *
 * İlerleme kaydı yoksa hiç çizilmiyor — yeni hesapta "%0 tamamlandı" yazan
 * boş bir şerit, sayfanın en değerli yerini harcıyor.
 */
export const ContinueBanner: React.FC<{ course: any }> = ({ course }) => {
    const navigate = useNavigate();

    if (!course) return null;

    const progress = Math.min(100, Math.max(0, Math.round(Number(course.progress) || 0)));
    const open = () => navigate(`/learning/${course.id}`);

    const img = getCourseImageUrl(
        course.id ?? course.course_id,
        course.image_url || course.image || course.thumbnail || course.image_path
    );

    return (
        <section className="w-full bg-gradient-to-r from-brand-100/70 via-brand-50 to-white border-b border-brand-100/80">
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">

                    <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                        <button
                            type="button"
                            onClick={open}
                            aria-label={`${course.title} dersine devam et`}
                            className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-slate-100 group"
                        >
                            <img
                                src={img}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).src = '/placeholder-course.jpg'; }}
                            />
                            <span className="absolute inset-0 bg-brand-900/35 flex items-center justify-center group-hover:bg-brand-900/50 transition-colors">
                                <PlayCircle className="w-7 h-7 text-white" />
                            </span>
                        </button>

                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 text-brand-700 text-[11.5px] font-bold uppercase tracking-[0.1em]">
                                <GraduationCap className="w-4 h-4" />
                                Kaldığın yerden devam et
                            </span>

                            <h2 className="text-[16px] sm:text-[17px] font-bold text-slate-900 truncate mt-1">
                                {course.title}
                            </h2>

                            {course.last_lesson_title && (
                                <p className="text-[12.5px] text-slate-500 truncate mt-0.5">
                                    Son ders: {course.last_lesson_title}
                                </p>
                            )}

                            <div className="flex items-center gap-3 mt-2.5 w-full max-w-md">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-brand-600 rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <span className="text-[12px] font-bold text-slate-600 tabular-nums shrink-0">
                                    %{progress} tamamlandı
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 self-end lg:self-center">
                        <button
                            type="button"
                            onClick={open}
                            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-[14.5px] font-bold transition-colors"
                        >
                            <Play className="w-4 h-4 fill-current" />
                            Derse devam et
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ContinueBanner;
