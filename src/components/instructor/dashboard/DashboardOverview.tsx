import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Clapperboard, ListChecks, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import RevenueChart from './RevenueChart';
import { StatusDot } from '../shell/InstructorShell';
import {
    relativeTime, statusOf, useInstructorCourses, useInstructorDashboard, useUnansweredCount, useUnreadMessages, WorkspaceCourse,
} from '../shell/useInstructorWorkspace';

const lira = (n: number) =>
    `₺${(Number(n) || 0).toLocaleString('tr-TR', { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

/*
 * Eğitmen paneli açılış sayfası.
 *
 * Sıra eğitmenin panele neden girdiğine göre: önce yarım kalan kurslar
 * (devam et), sonra kısa bir hesap özeti, en altta grafik ve öğrencilerden
 * bekleyenler. Rakamlar dört ayrı kart değil, tek bir defter satırı; kart
 * kart dizilen sayılar sayfanın asıl işi olan kursları aşağı itiyordu.
 */
export const DashboardOverview: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const courses = useInstructorCourses();
    const questions = useUnansweredCount();
    const messages = useUnreadMessages();

    const dashboard = useInstructorDashboard();

    const list = courses.data || [];
    const inProgress = list.filter(c => c.status !== 'published');
    const live = list.length - inProgress.length;
    const stats = dashboard.data?.stats;

    return (
        <div className="space-y-10">
            <header>
                <h1 className="text-[28px] sm:text-[32px] font-extrabold tracking-[-0.025em] leading-[1.1]">
                    Merhaba{user?.first_name ? `, ${user.first_name}` : ''}
                </h1>
                {!courses.isLoading && (
                    <p className="text-[14px] text-[#4a6360] mt-1.5">
                        {list.length === 0
                            ? 'Panelin hazır. İlk kursunla başlayalım.'
                            : [
                                inProgress.length ? `${inProgress.length} kurs hazırlanıyor` : null,
                                live ? `${live} kurs yayında` : null,
                            ].filter(Boolean).join(' · ')}
                    </p>
                )}
            </header>

            {/* ── Hazırlanan kurslar ─────────────────────────────────── */}
            <section aria-labelledby="desk-heading">
                <div className="flex items-end justify-between gap-4 mb-3">
                    <h2 id="desk-heading" className="text-[17px] font-extrabold tracking-tight">Hazırlanan kursların</h2>
                    {inProgress.length > 2 && (
                        <Link to="/instructor/courses/list" className="text-[13px] font-semibold text-[#005c55] hover:underline underline-offset-4">
                            Hepsi ({inProgress.length})
                        </Link>
                    )}
                </div>

                {courses.isLoading ? (
                    <div className="rounded-2xl bg-white ring-1 ring-[#e3e6e5] shadow-[0_1px_2px_rgba(0,32,29,0.04)] divide-y divide-[#eceeed]" aria-hidden>
                        {[0, 1].map(i => (
                            <div key={i} className="flex items-center gap-4 p-4">
                                <div className="w-24 h-[54px] rounded-md bg-[#eceeed] animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 rounded bg-[#eceeed] animate-pulse w-1/2" />
                                    <div className="h-2.5 rounded bg-[#eceeed] animate-pulse w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : list.length === 0 ? (
                    <FirstCourse onStart={() => navigate('/instructor/courses/create')} />
                ) : inProgress.length === 0 ? (
                    <div className="rounded-2xl bg-white ring-1 ring-[#e3e6e5] shadow-[0_1px_2px_rgba(0,32,29,0.04)] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[14px] text-[#4a6360]">
                            Bütün kursların yayında; yarım kalan iş yok.
                        </p>
                        <Link
                            to="/instructor/courses/create"
                            className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#005c55] hover:underline underline-offset-4"
                        >
                            Yeni bir kursa başla <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <ul className="rounded-2xl bg-white ring-1 ring-[#e3e6e5] shadow-[0_1px_2px_rgba(0,32,29,0.04)] divide-y divide-[#eceeed] overflow-hidden">
                        {inProgress.slice(0, 2).map(c => <DeskRow key={c.id} course={c} />)}
                    </ul>
                )}
            </section>

            {/* ── Hesap özeti: tek defter satırı ─────────────────────── */}
            <section aria-label="Hesap özeti">
                {dashboard.isLoading ? (
                    <div className="h-[92px] rounded-2xl bg-white ring-1 ring-[#e3e6e5] shadow-[0_1px_2px_rgba(0,32,29,0.04)] animate-pulse" />
                ) : dashboard.isError || !stats ? (
                    <div className="rounded-2xl bg-white ring-1 ring-[#e3e6e5] shadow-[0_1px_2px_rgba(0,32,29,0.04)] px-5 py-4 flex items-center justify-between gap-3">
                        <p className="text-[14px] text-[#4a6360]">Kazanç ve öğrenci özetini şu an yükleyemedik.</p>
                        <button
                            type="button"
                            onClick={() => dashboard.refetch()}
                            className="text-[13.5px] font-semibold text-[#005c55] hover:underline underline-offset-4"
                        >
                            Tekrar dene
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl bg-white ring-1 ring-[#e3e6e5] shadow-[0_1px_2px_rgba(0,32,29,0.04)] overflow-hidden">
                        <Figure
                            label="Bu ayki kazancın"
                            value={lira(stats.monthlyRevenue)}
                            note={[
                                `${stats.monthlySales || 0} satış`,
                                stats.monthlyChange != null
                                    ? `${stats.monthlyChange > 0 ? '+' : ''}${stats.monthlyChange}% geçen aya göre`
                                    : null,
                            ].filter(Boolean).join(' · ')}
                            to="/instructor/finance/report"
                        />
                        <Figure
                            label="Ödenecek bakiye"
                            value={lira(stats.balance)}
                            note={`Toplam kazanç ${lira(stats.totalRevenue)}`}
                            to="/instructor/finance/payout"
                        />
                        <Figure
                            label="Öğrencilerin"
                            value={Number(stats.totalStudents || 0).toLocaleString('tr-TR')}
                            note={stats.newStudents ? `Bu ay ${stats.newStudents} yeni` : 'Bu ay yeni kayıt yok'}
                            to="/instructor/students/list"
                        />
                        <Figure
                            label="Puan ortalaman"
                            value={Number(stats.avgRating) > 0 ? Number(stats.avgRating).toFixed(1).replace('.', ',') : '—'}
                            note={`${stats.totalReviews || 0} değerlendirme`}
                            to="/instructor/students/reviews"
                        />
                    </div>
                )}
            </section>

            {/* ── Grafik ve bekleyenler ──────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
                <section aria-labelledby="revenue-heading" className="rounded-2xl bg-white ring-1 ring-[#e3e6e5] shadow-[0_1px_2px_rgba(0,32,29,0.04)] p-5 sm:p-6 min-w-0">
                    <h2 id="revenue-heading" className="text-[17px] font-extrabold tracking-tight">Satışların</h2>
                    <p className="text-[13px] text-[#5f7774] mt-0.5 mb-5">Vergi sonrası eline geçen tutar, aylara göre</p>
                    {dashboard.data?.chart ? (
                        <RevenueChart chart={dashboard.data.chart} variant="composed" height={280} />
                    ) : (
                        <div className="h-[280px] rounded-lg bg-[#f7f8f8]" />
                    )}
                </section>

                <section aria-labelledby="waiting-heading" className="rounded-2xl bg-white ring-1 ring-[#e3e6e5] shadow-[0_1px_2px_rgba(0,32,29,0.04)] overflow-hidden">
                    <div className="px-5 pt-5 pb-3">
                        <h2 id="waiting-heading" className="text-[17px] font-extrabold tracking-tight">Seni bekleyenler</h2>
                    </div>

                    {questions.isLoading ? (
                        <div className="px-5 pb-5 space-y-3" aria-hidden>
                            {[0, 1].map(i => <div key={i} className="h-12 rounded bg-[#eceeed] animate-pulse" />)}
                        </div>
                    ) : questions.count === 0 ? (
                        <p className="px-5 pb-4 text-[13.5px] text-[#4a6360]">
                            Cevap bekleyen soru yok.
                        </p>
                    ) : (
                        <ul className="divide-y divide-[#eceeed] border-y border-[#eceeed]">
                            {questions.questions.filter(q => !q.is_answered).slice(0, 3).map(q => (
                                <li key={q.question_id}>
                                    <Link
                                        to="/instructor/students/qa"
                                        className="block px-5 py-3 hover:bg-[#f7f8f8] transition-colors"
                                    >
                                        <span className="block text-[13.5px] font-medium leading-snug line-clamp-2">
                                            {q.title || q.content}
                                        </span>
                                        <span className="block text-[12px] text-[#5f7774] mt-1 truncate">
                                            {[q.first_name, q.course_title, relativeTime(q.created_at)].filter(Boolean).join(' · ')}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="px-5 py-3 space-y-1">
                        {questions.count > 0 && (
                            <WaitingLink to="/instructor/students/qa" label="Cevap bekleyen sorular" count={questions.count} />
                        )}
                        <WaitingLink
                            to="/instructor/students/messages"
                            label={messages.count ? 'Okunmamış mesajlar' : 'Mesaj kutun'}
                            count={messages.count}
                        />
                    </div>
                </section>
            </div>
        </div>
    );
};

const DeskRow: React.FC<{ course: WorkspaceCourse }> = ({ course }) => {
    const st = statusOf(course.status);
    return (
        <li>
            <Link
                to={`/instructor/courses/edit/${course.id}`}
                className="group flex items-center gap-4 p-3 sm:p-4 hover:bg-[#f7f8f8] transition-colors focus-visible:outline-none focus-visible:bg-[#ecfbf8]"
            >
                <img
                    src={course.thumbnail || '/placeholder.svg'}
                    alt=""
                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                    className="w-20 sm:w-24 aspect-video rounded-md object-cover shrink-0 bg-[#eceeed]"
                />
                <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-semibold leading-snug truncate">{course.title}</span>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[12.5px] text-[#5f7774]">
                        <span className="inline-flex items-center gap-1.5 font-medium text-[#4a6360]">
                            <StatusDot tone={st.tone} />
                            {st.label}
                        </span>
                        {course.updated_at && <span>Son düzenleme {relativeTime(course.updated_at)}</span>}
                    </span>
                </span>
                <span
                    className={cn(
                        'hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-semibold shrink-0 transition-colors',
                        st.tone === 'draft'
                            ? 'bg-[#9cf2e8] text-[#00201d] group-hover:bg-[#86e9dd]'
                            : 'bg-[#e8faf6] text-[#00201d] group-hover:bg-[#d9f3ee]'
                    )}
                >
                    {st.tone === 'draft' ? 'Devam et' : 'Aç'}
                    <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </span>
            </Link>
        </li>
    );
};

const Figure: React.FC<{ label: string; value: string; note: string; to: string }> = ({ label, value, note, to }) => (
    <Link
        to={to}
        className="group px-5 py-4 border-[#eceeed] [&:nth-child(odd)]:border-r lg:border-r lg:last:border-r-0 [&:nth-child(-n+2)]:border-b lg:[&:nth-child(-n+2)]:border-b-0 hover:bg-[#f7f8f8] transition-colors"
    >
        <p className="text-[12.5px] font-medium text-[#5f7774]">{label}</p>
        <p className="text-[22px] font-bold tracking-tight tabular-nums mt-1 leading-none">{value}</p>
        <p className="text-[12px] text-[#5f7774] mt-2 truncate">{note}</p>
    </Link>
);

const WaitingLink: React.FC<{ to: string; label: string; count: number }> = ({ to, label, count }) => (
    <Link
        to={to}
        className="flex items-center justify-between h-9 -mx-2 px-2 rounded-lg text-[13.5px] font-medium text-[#00201d] hover:bg-[#f7f8f8] transition-colors"
    >
        {label}
        <span className="flex items-center gap-2">
            {count > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#fea619] text-[#3d2600] text-[11px] font-bold tabular-nums flex items-center justify-center">
                    {count}
                </span>
            )}
            <ArrowRight className="w-4 h-4 text-[#5f7774]" />
        </span>
    </Link>
);

/*
 * Hiç kursu olmayan eğitmen: boş bir liste yerine işin nasıl yürüdüğü.
 * Adımlar gerçek akış — kurs oluşturma ekranı da bu sırayla ilerliyor.
 */
const FirstCourse: React.FC<{ onStart: () => void }> = ({ onStart }) => (
    <div className="rounded-2xl bg-[#00201d] text-white p-6 sm:p-8">
        <h3 className="text-[20px] font-bold tracking-tight">İlk kursunu hazırla</h3>
        <p className="text-[14px] text-[#b8e6df] mt-1.5 max-w-[52ch]">
            Kursun taslak olarak kaydedilir; istediğin zaman ara verip buradan devam edebilirsin.
        </p>
        <ol className="grid sm:grid-cols-3 gap-4 mt-6">
            {[
                { icon: ListChecks, t: 'Başlık ve kategori', d: 'Kursun ne anlattığını ve kimin için olduğunu yaz.' },
                { icon: Clapperboard, t: 'Bölümler ve videolar', d: 'Dersleri bölümlere ayır, videolarını yükle.' },
                { icon: Send, t: 'İncelemeye gönder', d: 'Ekibimiz kontrol eder, onaylanınca yayına çıkar.' },
            ].map((s, i) => (
                <li key={s.t} className="rounded-lg bg-white/[0.07] p-4">
                    <span className="flex items-center gap-2 text-[12px] font-semibold text-[#9cf2e8]">
                        <s.icon className="w-4 h-4" /> {i + 1}. adım
                    </span>
                    <span className="block text-[14.5px] font-semibold mt-2">{s.t}</span>
                    <span className="block text-[13px] text-[#b8e6df] mt-1 leading-relaxed">{s.d}</span>
                </li>
            ))}
        </ol>
        <button
            type="button"
            onClick={onStart}
            className="mt-6 inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-[#9cf2e8] text-[#00201d] text-[14px] font-bold hover:bg-white active:scale-[0.98] transition-[background-color,transform] duration-150"
        >
            Kursu oluşturmaya başla <ArrowRight className="w-4 h-4" />
        </button>
    </div>
);

export default DashboardOverview;
