import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, BarChart3, BookText, CreditCard, HelpCircle, LayoutDashboard,
    Mail, Megaphone, Menu, MessageCircleQuestion, Plus, Shield, Star, UserRound, Users, X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
    relativeTime, statusOf, useInstructorCourses, useUnansweredCount, useUnreadMessages,
} from './useInstructorWorkspace';

/*
 * Eğitmen paneli iskeleti.
 *
 * Menünün tepesinde kategoriler değil, eğitmenin kendi kursları duruyor.
 * Eğitmen panele çoğunlukla bir kursu hazırlamaya devam etmek için giriyor;
 * "Kurs yönetimi > Kurslarım > kursu bul > düzenle" yolu tek tıka iniyor.
 * Geri kalan sayfalar işin kimin için yapıldığına göre gruplandı:
 * öğrencilerin, yayınların, kazancın, hesabın.
 *
 * Gruplar açılıp kapanmıyor. On beş bağlantı tek ekrana sığıyor; katlanan
 * menü yalnızca aranan sayfayı bir tık daha uzağa koyuyordu.
 */

export const NAV_WIDTH = 272;
const COURSES_IN_NAV = 5;

type Item = { to: string; label: string; icon: React.ElementType; badge?: number; end?: boolean };

export const InstructorShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [drawer, setDrawer] = useState(false);
    const location = useLocation();

    // Telefonda sayfa değişince çekmece kapansın.
    useEffect(() => { setDrawer(false); }, [location.pathname]);

    // Çekmece açıkken arka sayfa kaymasın; Esc kapatsın.
    useEffect(() => {
        if (!drawer) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(false); };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener('keydown', onKey);
        };
    }, [drawer]);

    return (
        <div className="min-h-screen bg-[#f8faf9] text-[#131b2e] selection:bg-[#9cf2e8] selection:text-[#00201d]">
            {/* Masaüstü: sabit sol panel */}
            <aside
                className="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col bg-[#eef2f1] border-r border-[#dde4e2]"
                style={{ width: NAV_WIDTH }}
            >
                <NavBody />
            </aside>

            {/* Telefon: üst şerit + çekmece */}
            <header className="lg:hidden sticky top-0 z-40 h-14 flex items-center gap-2 px-3 bg-[#eef2f1]/95 backdrop-blur border-b border-[#dde4e2]">
                <button
                    type="button"
                    onClick={() => setDrawer(true)}
                    aria-label="Menüyü aç"
                    aria-expanded={drawer}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-[#3e4947] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/40"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <Link to="/instructor/dashboard" className="flex items-center gap-2">
                    <img src="/logo-wordmark.png" alt="Edurce" className="h-6 w-auto" />
                </Link>
                <Link
                    to="/instructor/courses/create"
                    className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#005c55] text-white text-[13px] font-semibold"
                >
                    <Plus className="w-4 h-4" />
                    Yeni kurs
                </Link>
            </header>

            <div
                aria-hidden={!drawer}
                onClick={() => setDrawer(false)}
                className={cn(
                    'lg:hidden fixed inset-0 z-50 bg-[#131b2e]/40 transition-opacity duration-200 motion-reduce:transition-none',
                    drawer ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
            />
            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Eğitmen menüsü"
                className={cn(
                    'lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col bg-[#eef2f1]',
                    'transition-[transform,visibility,box-shadow] duration-[240ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
                    drawer ? 'translate-x-0 shadow-[8px_0_32px_-12px_rgba(19,27,46,0.35)]' : '-translate-x-full invisible'
                )}
                style={{ width: Math.min(NAV_WIDTH + 16, 320) }}
            >
                <button
                    type="button"
                    onClick={() => setDrawer(false)}
                    aria-label="Menüyü kapat"
                    className="absolute top-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center text-[#6e7977] hover:bg-white"
                >
                    <X className="w-4 h-4" />
                </button>
                <NavBody />
            </aside>

            <main className="lg:pl-[272px]">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-9 pb-24">
                    {children}
                </div>
            </main>
        </div>
    );
};

const NavBody: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: courses, isLoading } = useInstructorCourses();
    const { count: unanswered } = useUnansweredCount();
    const { count: unread } = useUnreadMessages();

    const groups: { label: string; items: Item[] }[] = [
        {
            label: 'Öğrencilerin',
            items: [
                { to: '/instructor/students/qa', label: 'Soru-Cevap', icon: MessageCircleQuestion, badge: unanswered },
                { to: '/instructor/students/messages', label: 'Mesajlar', icon: Mail, badge: unread },
                { to: '/instructor/students/reviews', label: 'Yorumlar', icon: Star },
                { to: '/instructor/students/list', label: 'Öğrenci listesi', icon: Users },
            ],
        },
        {
            label: 'Yayın',
            items: [
                { to: '/instructor/courses/announcements', label: 'Duyurular', icon: Megaphone },
                { to: '/instructor/books/manage', label: 'E-kitaplar', icon: BookText },
            ],
        },
        {
            label: 'Kazanç',
            items: [
                { to: '/instructor/finance/report', label: 'Gelir raporu', icon: BarChart3 },
                { to: '/instructor/finance/payout', label: 'Ödeme bilgileri', icon: CreditCard },
            ],
        },
        {
            label: 'Hesap',
            items: [
                { to: '/instructor/settings/profile', label: 'Eğitmen profili', icon: UserRound },
                { to: '/instructor/settings/account', label: 'Hesap ayarları', icon: Shield },
                { to: '/instructor/settings/help', label: 'Yardım', icon: HelpCircle },
            ],
        },
    ];

    const list = courses || [];
    const shown = list.slice(0, COURSES_IN_NAV);
    const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
    const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'E';

    return (
        <>
            <div className="px-5 pt-5 pb-4 shrink-0">
                <Link to="/instructor/dashboard" className="inline-flex items-baseline gap-2">
                    <img src="/logo-wordmark.png" alt="Edurce" className="h-6 w-auto self-center" />
                    <span className="text-[12px] font-semibold text-[#6e7977]">eğitmen</span>
                </Link>

                <button
                    type="button"
                    onClick={() => navigate('/instructor/courses/create')}
                    className="mt-5 w-full h-10 rounded-lg bg-[#005c55] hover:bg-[#00483f] active:scale-[0.98] text-white text-[13.5px] font-semibold inline-flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,64,58,0.4)] transition-[background-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef2f1] focus-visible:ring-[#005c55]"
                >
                    <Plus className="w-4 h-4" />
                    Yeni kurs oluştur
                </button>
            </div>

            <nav
                aria-label="Eğitmen paneli"
                className="flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin] [scrollbar-color:#c5d0cd_transparent]"
            >
                <NavItem to="/instructor/dashboard" label="Genel bakış" icon={LayoutDashboard} />

                {/* Kurslar: menünün asıl içeriği */}
                <div className="mt-5">
                    <div className="flex items-center justify-between px-2 mb-1.5">
                        <span className="text-[12px] font-semibold text-[#6e7977]">Kursların</span>
                        {list.length > 0 && (
                            <span className="text-[11.5px] tabular-nums text-[#6e7977]">{list.length}</span>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="space-y-1" aria-hidden>
                            {[0, 1, 2].map(i => (
                                <div key={i} className="flex items-center gap-2.5 px-2 py-1.5">
                                    <div className="w-10 h-7 rounded bg-[#dde4e2] animate-pulse" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-2 rounded bg-[#dde4e2] animate-pulse w-4/5" />
                                        <div className="h-2 rounded bg-[#dde4e2] animate-pulse w-1/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : shown.length === 0 ? (
                        <p className="px-2 py-2 text-[12.5px] leading-relaxed text-[#3e4947]">
                            Henüz kursun yok. Yukarıdaki düğmeyle ilk kursunu başlat; burada görünecek.
                        </p>
                    ) : (
                        <ul className="space-y-px">
                            {shown.map(c => {
                                const st = statusOf(c.status);
                                return (
                                    <li key={c.id}>
                                        <NavLink
                                            to={`/instructor/courses/edit/${c.id}`}
                                            title={c.updated_at ? `Son düzenleme: ${new Date(c.updated_at).toLocaleString('tr-TR')}` : undefined}
                                            className={({ isActive }) => cn(
                                                'group flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors duration-150',
                                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/40',
                                                isActive ? 'bg-white shadow-[0_1px_2px_rgba(19,27,46,0.08)]' : 'hover:bg-white/60'
                                            )}
                                        >
                                            <img
                                                src={c.thumbnail || '/placeholder.svg'}
                                                alt=""
                                                loading="lazy"
                                                onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                                                className="w-10 h-7 rounded object-cover shrink-0 bg-[#dde4e2]"
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-[13px] font-medium leading-tight truncate">{c.title}</span>
                                                <span className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#6e7977]">
                                                    <StatusDot tone={st.tone} />
                                                    {st.label}
                                                    {st.tone !== 'live' && c.updated_at && (
                                                        <span className="truncate">· {relativeTime(c.updated_at)}</span>
                                                    )}
                                                </span>
                                            </span>
                                        </NavLink>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {list.length > 0 && (
                        <NavLink
                            to="/instructor/courses/list"
                            className={({ isActive }) => cn(
                                'mt-1 flex items-center px-2 h-8 rounded-lg text-[12.5px] font-semibold transition-colors',
                                isActive ? 'bg-white text-[#005c55]' : 'text-[#005c55] hover:bg-white/60'
                            )}
                        >
                            {list.length > COURSES_IN_NAV ? `Bütün kurslar (${list.length})` : 'Kurs listesi'}
                        </NavLink>
                    )}
                </div>

                {groups.map(g => (
                    <div key={g.label} className="mt-5">
                        <span className="block px-2 mb-1.5 text-[12px] font-semibold text-[#6e7977]">{g.label}</span>
                        <div className="space-y-px">
                            {g.items.map(i => <NavItem key={i.to} {...i} />)}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="shrink-0 border-t border-[#dde4e2] px-3 py-3 flex items-center gap-2.5">
                {user?.profile_image ? (
                    <img src={user.profile_image} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                    <span className="w-8 h-8 rounded-full bg-[#005c55] text-white text-[12px] font-bold flex items-center justify-center">
                        {initials}
                    </span>
                )}
                <span className="min-w-0 flex-1 text-[13px] font-semibold truncate">{name || 'Eğitmen'}</span>
                <Link
                    to="/"
                    title="Siteye dön"
                    className="inline-flex items-center gap-1 h-8 px-2 rounded-lg text-[12px] font-semibold text-[#3e4947] hover:bg-white transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Site
                </Link>
            </div>
        </>
    );
};

const NavItem: React.FC<Item> = ({ to, label, icon: Icon, badge }) => {
    const location = useLocation();
    // Genel bakış /instructor köküyle de etkin sayılsın.
    const rootMatch = to === '/instructor/dashboard' && /^\/instructor\/?$/.test(location.pathname);

    return (
        <NavLink
            to={to}
            className={({ isActive }) => cn(
                'group flex items-center gap-2.5 h-9 px-2 rounded-lg text-[13.5px] transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/40',
                isActive || rootMatch
                    ? 'bg-white text-[#131b2e] font-semibold shadow-[0_1px_2px_rgba(19,27,46,0.08)]'
                    : 'text-[#3e4947] font-medium hover:bg-white/60 hover:text-[#131b2e]'
            )}
        >
            {({ isActive }) => (
                <>
                    <Icon
                        className={cn(
                            'w-4 h-4 shrink-0 transition-colors',
                            isActive || rootMatch ? 'text-[#005c55]' : 'text-[#6e7977] group-hover:text-[#3e4947]'
                        )}
                        strokeWidth={isActive || rootMatch ? 2.25 : 2}
                    />
                    <span className="flex-1 truncate">{label}</span>
                    {badge ? (
                        <span
                            className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#fea619] text-[#3d2600] text-[11px] font-bold tabular-nums flex items-center justify-center"
                            aria-label={`${badge} bekleyen`}
                        >
                            {badge > 99 ? '99+' : badge}
                        </span>
                    ) : null}
                </>
            )}
        </NavLink>
    );
};

export const StatusDot: React.FC<{ tone: 'draft' | 'review' | 'live' }> = ({ tone }) => (
    <span
        aria-hidden
        className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            tone === 'live' && 'bg-[#0f9f8f]',
            tone === 'review' && 'bg-[#2f7fc1]',
            tone === 'draft' && 'bg-[#d08a1c]'
        )}
    />
);

export default InstructorShell;
