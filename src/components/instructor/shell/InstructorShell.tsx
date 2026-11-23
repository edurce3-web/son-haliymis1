import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
    ArrowRight, ArrowUpRight, BookOpen, GraduationCap, ChevronDown, ChevronRight, LayoutGrid, Library, Menu,
    Plus, UserRound, Users, Wallet, X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
    useInstructorCourses, useInstructorDashboard, useUnansweredCount, useUnreadMessages,
} from './useInstructorWorkspace';

/*
 * Eğitmen paneli iskeleti.
 *
 * Menü beyaz bir şerit; renk yalnızca seçili başlıkta (nane). Bir kitabın
 * dizini gibi yalnızca büyük başlıklar var. Başlığa tıklamak o
 * bölümün ilk sayfasını açıyor; üzerine gelince diğer sayfalar yandan
 * açılan bir çekmecede beliriyor.
 *
 * Çekmecenin tepesi o bölümün o anki durumunu söylüyor (kaç taslak, kaç
 * bekleyen soru, bakiye).
 *
 * Telefonda üzerine gelmek yok: başlığa dokununca ilk sayfa açılıyor, yanındaki
 * ok diğer sayfaları başlığın altında gösteriyor.
 */

export const NAV_WIDTH = 256;
const FLYOUT_WIDTH = 300;
const OPEN_DELAY = 70;
const CLOSE_DELAY = 180;
const EASE_OUT = 'cubic-bezier(0.23,1,0.32,1)';

const lira = (n: number) =>
    `₺${(Number(n) || 0).toLocaleString('tr-TR', { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

type Sub = { to: string; label: string; badge?: number };
type Section = {
    id: string;
    label: string;
    icon?: React.ElementType;
    to?: string;
    match: RegExp;
    subs?: Sub[];
    badge?: number;
    action?: { to: string; label: string };
};

function useSections(): Section[] {
    const { count: unanswered } = useUnansweredCount();
    const { count: unread } = useUnreadMessages();

    return [
        { id: 'home', label: 'Genel bakış', to: '/instructor/dashboard', match: /^\/instructor\/?(dashboard)?\/?$/ },
        {
            id: 'courses', label: 'Kurslar', icon: BookOpen, match: /^\/instructor\/courses/,
            subs: [
                { to: '/instructor/courses/list', label: 'Kurslarım' },
                { to: '/instructor/courses/announcements', label: 'Duyurular' },
            ],
            action: { to: '/instructor/courses/create', label: 'Yeni kurs oluştur' },
        },
        {
            id: 'students', label: 'Öğrenciler', icon: Users, match: /^\/instructor\/students/, badge: unanswered + unread,
            subs: [
                { to: '/instructor/students/qa', label: 'Soru-Cevap', badge: unanswered },
                { to: '/instructor/students/messages', label: 'Mesajlar', badge: unread },
                { to: '/instructor/students/reviews', label: 'Yorumlar' },
                { to: '/instructor/students/list', label: 'Öğrenci listesi' },
            ],
        },
        {
            id: 'books', label: 'E-kitaplar', icon: Library, match: /^\/instructor\/books/,
            subs: [
                { to: '/instructor/books/manage', label: 'Kitaplarım' },
            ],
            action: { to: '/instructor/books/create', label: 'Yeni e-kitap yükle' },
        },
        {
            id: 'money', label: 'Kazanç', icon: Wallet, match: /^\/instructor\/finance/,
            subs: [
                { to: '/instructor/finance/report', label: 'Gelir raporu' },
                { to: '/instructor/finance/payout', label: 'Ödeme bilgileri' },
            ],
        },
        {
            id: 'account', label: 'Hesap', icon: UserRound, match: /^\/instructor\/settings/,
            subs: [
                { to: '/instructor/settings/profile', label: 'Eğitmen profili' },
                { to: '/instructor/settings/account', label: 'Hesap ayarları' },
                { to: '/instructor/settings/help', label: 'Yardım' },
            ],
        },
    ];
}

/** Bir başlığa tıklayınca gidilecek yer: kendi sayfası ya da ilk alt sayfası. */
const firstPage = (s: Section) => s.to || s.subs![0].to;

/*
 * Menü koyu mürekkep yeşili; logo ve seçili başlık nane (#9cf2e8).
 * Çizgi yok: ayrımlar yalnızca zemin tonuyla.
 */
const RAIL_BG = 'bg-[#00201d]';

export const InstructorShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [drawer, setDrawer] = useState(false);
    const location = useLocation();

    useEffect(() => { setDrawer(false); }, [location.pathname]);

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
        <div className="min-h-screen bg-white text-[#00201d] selection:bg-[#9cf2e8] selection:text-[#00201d]">
            <DesktopNav />

            {/* Telefon: üst şerit + çekmece */}
            <header className={cn('lg:hidden sticky top-0 z-40 h-14 grid grid-cols-[88px_1fr_88px] items-center px-2', RAIL_BG)}>
                <button
                    type="button"
                    onClick={() => setDrawer(true)}
                    aria-label="Menüyü aç"
                    aria-expanded={drawer}
                    className="w-10 h-10  flex items-center justify-center text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9cf2e8]/60"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <Brand size="sm" className="justify-self-center" />
                <StudentLink compact className="justify-self-end" />
            </header>

            <div
                aria-hidden={!drawer}
                onClick={() => setDrawer(false)}
                className={cn(
                    'lg:hidden fixed inset-0 z-50 bg-[#00201d]/45 transition-opacity duration-200 motion-reduce:transition-none',
                    drawer ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
            />
            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Eğitmen menüsü"
                className={cn(
                    'lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-[min(310px,86vw)]', RAIL_BG,
                    'transition-[transform,visibility,box-shadow] duration-[240ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
                    drawer ? 'translate-x-0 shadow-[12px_0_40px_-12px_rgba(0,32,29,0.55)]' : '-translate-x-full invisible'
                )}
            >
                <button
                    type="button"
                    onClick={() => setDrawer(false)}
                    aria-label="Menüyü kapat"
                    className="absolute top-3 right-3 w-9 h-9  flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10"
                >
                    <X className="w-4 h-4" />
                </button>
                <MobileNav />
            </aside>

            <main className="lg:pl-[256px]">
                {/* Masaüstü üst şerit: öğrenci tarafına geçiş sağ üstte */}
                <div className="hidden lg:flex h-14 items-center justify-end px-10 max-w-[1280px] mx-auto">
                    <StudentLink />
                </div>
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:pt-2 lg:pb-9 pb-24">
                    {children}
                </div>
            </main>
        </div>
    );
};

/*
 * Panelin logosu nane (#9cf2e8): aynı logo dosyası maske olarak boyanıyor.
 * Hemen yanında "eğitmen". Platformun kendi logosu (#B2F0C8) ayrı.
 */
const LOGO_RATIO = 579 / 160;
const LOGO_MASK = 'url(/logo-wordmark.png) center / contain no-repeat';

const Brand: React.FC<{ className?: string; size?: 'lg' | 'sm' }> = ({ className, size = 'lg' }) => (
    <Link
        to="/instructor/dashboard"
        aria-label="Edurce eğitmen paneli"
        className={cn('inline-flex items-end gap-2  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9cf2e8]/60', className)}
    >
        <span
            aria-hidden
            className="block"
            style={{ width: Math.round((size === 'lg' ? 30 : 23) * LOGO_RATIO), height: size === 'lg' ? 30 : 23, background: '#9cf2e8', WebkitMask: LOGO_MASK, mask: LOGO_MASK }}
        />
        <span className={cn('font-bold text-white/60 leading-none', size === 'lg' ? 'text-[15px] pb-[3px]' : 'text-[12.5px] pb-[2px]')}>
            eğitmen
        </span>
    </Link>
);

/** Öğrenci tarafına geçiş: sitenin öğrenci görünümüne döner. */
const StudentLink: React.FC<{ compact?: boolean; className?: string }> = ({ compact, className }) => (
    <Link
        to="/"
        title="Öğrenci görünümüne geç"
        className={cn(
            'inline-flex items-center gap-2  font-bold transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/40',
            compact
                ? 'h-9 px-2.5 text-[13px] text-white hover:bg-white/10'
                : 'h-9 px-3.5 text-[13.5px] text-[#00201d] bg-white  hover:bg-[#ecfbf8]',
            className
        )}
    >
        <GraduationCap className={cn('w-4 h-4', compact ? 'text-[#9cf2e8]' : 'text-[#005c55]')} />
        Öğrenci
    </Link>
);

/* ── Masaüstü: başlık dizini + yandan açılan çekmece ───────────────── */

const DesktopNav: React.FC = () => {
    const sections = useSections();
    const location = useLocation();
    const [openId, setOpenId] = useState<string | null>(null);
    const [top, setTop] = useState(0);
    // İlk açılış süzülerek; başlıklar arasında gezinirken çekmece yeniden
    // belirmiyor, yalnızca yeni başlığın hizasına kayıyor.
    const [settled, setSettled] = useState(false);
    const rows = useRef<Record<string, HTMLElement | null>>({});
    const openTimer = useRef<ReturnType<typeof setTimeout>>();
    const closeTimer = useRef<ReturnType<typeof setTimeout>>();

    const clearTimers = () => { clearTimeout(openTimer.current); clearTimeout(closeTimer.current); };

    const show = useCallback((id: string, immediate = false) => {
        clearTimers();
        const go = () => {
            const el = rows.current[id];
            if (el) setTop(el.offsetTop);
            setSettled(openId !== null);
            setOpenId(id);
        };
        if (immediate || openId) go();
        else openTimer.current = setTimeout(go, OPEN_DELAY);
    }, [openId]);

    const hide = useCallback(() => {
        clearTimers();
        closeTimer.current = setTimeout(() => { setOpenId(null); setSettled(false); }, CLOSE_DELAY);
    }, []);

    const keep = () => clearTimeout(closeTimer.current);

    useEffect(() => { setOpenId(null); setSettled(false); }, [location.pathname]);
    useEffect(() => clearTimers, []);

    useEffect(() => {
        if (!openId) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                const id = openId;
                setOpenId(null);
                (rows.current[id]?.querySelector('a') as HTMLElement | null)?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [openId]);

    const open = sections.find(s => s.id === openId && s.subs);
    // Kapanırken içerik solarak gitsin; son açık başlık kapanış boyunca kalıyor.
    const lastShown = useRef<Section>();
    if (open) lastShown.current = open;
    const shown = open || lastShown.current;

    return (
        <aside
            className={cn('hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col', RAIL_BG)}
            style={{ width: NAV_WIDTH }}
            onMouseLeave={hide}
        >
            <div className="h-[92px] shrink-0 flex items-center px-7">
                <Brand />
            </div>

            <nav aria-label="Eğitmen paneli" className="relative flex-1 pt-3">
                <p className="px-7 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">Yönetim</p>
                <ul className="space-y-1">
                    {sections.map(s => {
                        const active = s.match.test(location.pathname);
                        const isOpen = openId === s.id;
                        const Icon = s.icon;
                        const row = cn(
                            'relative flex items-center gap-3 w-full h-[50px] pl-4 pr-4 text-left ',
                            'text-[16px] tracking-[-0.01em] transition-[background-color,color] duration-150',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#9cf2e8]/60',
                            active
                                ? 'bg-[#9cf2e8] text-[#00201d] font-bold'
                                : isOpen
                                    ? 'bg-white/[0.08] text-white font-semibold'
                                    : 'text-white/80 font-semibold hover:text-white hover:bg-white/[0.05]'
                        );

                        return (
                            <li
                                key={s.id}
                                ref={el => { rows.current[s.id] = el; }}
                                className="px-3"
                                onMouseEnter={() => (s.subs ? show(s.id) : hide())}
                            >
                                <Link
                                    to={firstPage(s)}
                                    className={row}
                                    aria-haspopup={s.subs ? 'true' : undefined}
                                    aria-expanded={s.subs ? isOpen : undefined}
                                    aria-controls={s.subs ? 'instructor-flyout' : undefined}
                                    aria-current={active ? 'page' : undefined}
                                    onFocus={() => { if (!s.subs) setOpenId(null); }}
                                    onKeyDown={e => {
                                        if (s.subs && e.key === 'ArrowRight') {
                                            e.preventDefault();
                                            show(s.id, true);
                                            requestAnimationFrame(() =>
                                                (document.querySelector('#instructor-flyout a') as HTMLElement | null)?.focus()
                                            );
                                        }
                                    }}
                                >
                                    {Icon ? (
                                        <Icon
                                            aria-hidden
                                            className={cn(
                                                'w-[19px] h-[19px] shrink-0 transition-colors duration-150',
                                                active ? 'text-[#00201d]' : isOpen ? 'text-[#9cf2e8]' : 'text-white/45'
                                            )}
                                            strokeWidth={active || isOpen ? 2.2 : 1.9}
                                        />
                                    ) : <LayoutGrid aria-hidden className={cn('w-[19px] h-[19px] shrink-0', active ? 'text-[#00201d]' : 'text-white/45')} strokeWidth={active ? 2.2 : 1.9} />}
                                    <span className="flex-1 truncate">{s.label}</span>
                                    {s.badge ? <Count n={s.badge} /> : null}
                                    {s.subs ? (
                                        <ChevronRight
                                            aria-hidden
                                            className={cn(
                                                'w-4 h-4 shrink-0 transition-[opacity,transform,color] duration-150',
                                                isOpen ? 'opacity-100 translate-x-0.5 text-[#9cf2e8]' : 'opacity-40'
                                            )}
                                        />
                                    ) : active ? <ArrowUpRight aria-hidden className="w-4 h-4 shrink-0" /> : null}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                {/* Çekmece: açık başlığın sekmesine yapışık */}
                <div
                    id="instructor-flyout"
                    role="menu"
                    aria-label={shown?.label}
                    onMouseEnter={keep}
                    onMouseLeave={hide}
                    className={cn(
                        'absolute left-full -mt-3 z-50  bg-[#0f302c] text-white overflow-hidden',
                        'shadow-[28px_24px_60px_-28px_rgba(11,38,25,0.65)]',
                        'transition-[opacity,transform,top] motion-reduce:transition-none',
                        settled ? 'duration-150' : 'duration-200',
                        open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'
                    )}
                    style={{ top, width: FLYOUT_WIDTH, transitionTimingFunction: EASE_OUT }}
                >
                    {shown && <Flyout section={shown} animate={!settled} />}
                </div>
            </nav>

            <MonthCard />
            <UserFooter />
        </aside>
    );
};

/** Çekmecenin içi: bölümün durumu, alt sayfalar, varsa ana eylem. */
const Flyout: React.FC<{ section: Section; animate: boolean }> = ({ section, animate }) => (
    <div className="py-5">
        <FlyoutHeader section={section} />

        <ul className="mt-3 px-3 space-y-0.5">
            {section.subs!.map((sub, i) => (
                <li
                    key={sub.to}
                    className={cn(animate && 'animate-in fade-in slide-in-from-left-1 duration-200 fill-mode-both')}
                    style={animate ? { animationDelay: `${40 + i * 30}ms` } : undefined}
                >
                    <NavLink
                        to={sub.to}
                        role="menuitem"
                        className={({ isActive }) => cn(
                            'group flex items-center gap-3 h-11  px-3 text-[15px] transition-colors duration-150',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9cf2e8]/60',
                            isActive ? 'bg-white/[0.09] text-[#9cf2e8] font-bold' : 'text-white/80 font-semibold hover:bg-white/[0.06] hover:text-white'
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                <span
                                    aria-hidden
                                    className={cn(
                                        'w-1.5 h-1.5 rounded-full shrink-0 transition-colors',
                                        isActive ? 'bg-[#9cf2e8]' : 'bg-white/25 group-hover:bg-white/60'
                                    )}
                                />
                                <span className="flex-1 truncate">{sub.label}</span>
                                {sub.badge ? <Count n={sub.badge} /> : null}
                            </>
                        )}
                    </NavLink>
                </li>
            ))}
        </ul>

        {section.action && (
            <div className="px-5 pt-4">
                <Link
                    to={section.action.to}
                    className="flex items-center justify-center gap-2 h-11  bg-[#9cf2e8] hover:bg-white active:scale-[0.98] text-[#00201d] text-[14px] font-bold transition-[background-color,transform] duration-150"
                >
                    <Plus className="w-4 h-4" />
                    {section.action.label}
                </Link>
            </div>
        )}
    </div>
);

/** Bölümün o anki durumu — çekmecenin tepesi. */
const FlyoutHeader: React.FC<{ section: Section }> = ({ section }) => {
    const { data: courses } = useInstructorCourses();
    const { data: dash } = useInstructorDashboard();
    const { count: unanswered } = useUnansweredCount();
    const { count: unread } = useUnreadMessages();
    const { user } = useAuth();
    const stats = dash?.stats;

    let meta: React.ReactNode = null;

    if (section.id === 'courses' && courses) {
        const n = (s: string) => courses.filter(c => (s === 'pending' ? !['draft', 'published'].includes(c.status) : c.status === s)).length;
        const parts = [
            { k: 'draft', label: 'taslak', dot: 'bg-[#f5a524]' },
            { k: 'pending', label: 'incelemede', dot: 'bg-[#7cb7ff]' },
            { k: 'published', label: 'yayında', dot: 'bg-[#9cf2e8]' },
        ].map(p => ({ ...p, n: n(p.k) })).filter(p => p.n > 0);
        meta = parts.length ? (
            <div className="flex flex-wrap gap-x-3 gap-y-1">
                {parts.map(p => (
                    <span key={p.k} className="inline-flex items-center gap-1.5 text-[12.5px] text-white/60">
                        <span className={cn('w-1.5 h-1.5 rounded-full', p.dot)} />
                        <b className="font-bold tabular-nums text-white">{p.n}</b> {p.label}
                    </span>
                ))}
            </div>
        ) : <span className="text-[12.5px] text-white/50">Henüz kursun yok</span>;
    }

    if (section.id === 'students') {
        const waiting = unanswered + unread;
        meta = (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-white/60">
                {stats && <span><b className="font-bold tabular-nums text-white">{Number(stats.totalStudents || 0).toLocaleString('tr-TR')}</b> öğrenci</span>}
                <span className={waiting ? 'text-[#f5c26b] font-semibold' : ''}>
                    {waiting ? `${waiting} iş seni bekliyor` : 'Bekleyen iş yok'}
                </span>
            </div>
        );
    }

    if (section.id === 'money' && stats) {
        meta = (
            <div className="grid grid-cols-2 gap-3 mt-1">
                <span>
                    <span className="block text-[11.5px] text-white/50">Bu ay</span>
                    <span className="block text-[17px] font-bold tabular-nums tracking-tight text-white">{lira(stats.monthlyRevenue)}</span>
                </span>
                <span>
                    <span className="block text-[11.5px] text-white/50">Ödenecek bakiye</span>
                    <span className="block text-[17px] font-bold tabular-nums tracking-tight text-[#9cf2e8]">{lira(stats.balance)}</span>
                </span>
            </div>
        );
    }

    if (section.id === 'account' && user?.email) {
        meta = <span className="block text-[12.5px] text-white/50 truncate">{user.email}</span>;
    }

    return (
        <div className="px-6">
            <p className="text-[18px] font-extrabold tracking-[-0.015em] text-white">{section.label}</p>
            {meta && <div className="mt-1.5">{meta}</div>}
        </div>
    );
};

/** Menünün dibinde bu ayın kazancı: eğitmenin en sık baktığı tek sayı. */
const MonthCard: React.FC = () => {
    const { data, isLoading, isError } = useInstructorDashboard();
    if (isError) return null;
    const stats = data?.stats;

    return (
        <Link
            to="/instructor/finance/report"
            className="group mx-4 mb-3  bg-white/[0.06] hover:bg-white/[0.1] px-4 py-3.5 transition-colors duration-150"
        >
            <span className="flex items-center justify-between text-[12px] font-semibold text-white/55">
                Bu ayki kazancın
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-[opacity,transform] duration-150" />
            </span>
            {isLoading || !stats ? (
                <span className="block mt-2 space-y-1.5" aria-hidden>
                    <span className="block h-4 w-24  bg-white/10 animate-pulse" />
                    <span className="block h-2.5 w-16  bg-white/10 animate-pulse" />
                </span>
            ) : (
                <>
                    <span className="block mt-1 text-[22px] leading-tight font-extrabold tabular-nums tracking-tight text-white">
                        {lira(stats.monthlyRevenue)}
                    </span>
                    <span className="block mt-0.5 text-[12px] text-white/55">
                        {stats.monthlySales || 0} satış
                        {stats.monthlyChange != null && (
                            <span className={stats.monthlyChange >= 0 ? 'text-[#9cf2e8] font-semibold' : 'text-[#ff9b8f] font-semibold'}>
                                {' '}· {stats.monthlyChange > 0 ? '+' : ''}{stats.monthlyChange}%
                            </span>
                        )}
                    </span>
                </>
            )}
        </Link>
    );
};

/* ── Telefon: başlık ilk sayfayı açar, ok diğer sayfaları gösterir ─── */

const MobileNav: React.FC = () => {
    const sections = useSections();
    const location = useLocation();
    const current = sections.find(s => s.match.test(location.pathname))?.id ?? null;
    const [expanded, setExpanded] = useState<string | null>(current);

    return (
        <>
            <div className="h-20 shrink-0 flex items-center px-6">
                <Brand />
            </div>
            <nav aria-label="Eğitmen paneli" className="flex-1 overflow-y-auto py-3 px-2">
                {sections.map(s => {
                    const active = s.id === current;
                    const isOpen = expanded === s.id;
                    const Icon = s.icon;
                    const icon = Icon
                        ? <Icon className={cn('w-[19px] h-[19px] shrink-0', active ? 'text-[#00201d]' : 'text-white/45')} />
                        : <LayoutGrid className={cn('w-[19px] h-[19px] shrink-0', active ? 'text-[#00201d]' : 'text-white/45')} />;
                    const link = (
                        <Link
                            to={firstPage(s)}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'flex items-center gap-3 flex-1 min-w-0 h-[50px] px-4  text-[17px] tracking-[-0.01em]',
                                active ? 'bg-[#9cf2e8] text-[#00201d] font-bold' : 'text-white/80 font-semibold'
                            )}
                        >
                            {icon}
                            <span className="flex-1 truncate">{s.label}</span>
                            {s.badge ? <Count n={s.badge} /> : null}
                        </Link>
                    );
                    if (!s.subs) return <div key={s.id} className="flex">{link}</div>;
                    return (
                        <div key={s.id} className={cn(' transition-colors', isOpen && 'bg-white/[0.05]')}>
                            <div className="flex items-center gap-1">
                                {link}
                                <button
                                    type="button"
                                    aria-expanded={isOpen}
                                    aria-label={`${s.label} sayfalarını ${isOpen ? 'gizle' : 'göster'}`}
                                    onClick={() => setExpanded(isOpen ? null : s.id)}
                                    className="w-11 h-[50px] shrink-0  flex items-center justify-center text-white/55 hover:text-white hover:bg-white/10"
                                >
                                    <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', isOpen && 'rotate-180')} />
                                </button>
                            </div>
                            {isOpen && (
                                <ul className="pb-2 pl-11 pr-2">
                                    {s.subs.map(sub => (
                                        <li key={sub.to}>
                                            <NavLink
                                                to={sub.to}
                                                className={({ isActive }) => cn(
                                                    'flex items-center justify-between gap-3  px-3 py-2.5 text-[15px]',
                                                    isActive ? 'bg-[#9cf2e8]/15 text-[#9cf2e8] font-bold' : 'text-white/70 font-medium'
                                                )}
                                            >
                                                {sub.label}
                                                {sub.badge ? <Count n={sub.badge} /> : null}
                                            </NavLink>
                                        </li>
                                    ))}
                                    {s.action && (
                                        <li>
                                            <Link
                                                to={s.action.to}
                                                className="mt-1 flex items-center gap-2  px-3 py-2.5 text-[15px] font-bold text-[#9cf2e8]"
                                            >
                                                <Plus className="w-4 h-4" /> {s.action.label}
                                            </Link>
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </nav>
            <MonthCard />
            <UserFooter />
        </>
    );
};

const UserFooter: React.FC = () => {
    const { user } = useAuth();
    const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
    const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'E';

    return (
        <Link
            to="/instructor/settings/profile"
            className="shrink-0 mx-3 mb-3  px-3 py-2.5 flex items-center gap-2.5 hover:bg-white/[0.05] transition-colors"
        >
            {user?.profile_image ? (
                <img src={user.profile_image} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
                <span className="w-8 h-8 rounded-full bg-[#9cf2e8] text-[#00201d] text-[12px] font-bold flex items-center justify-center">
                    {initials}
                </span>
            )}
            <span className="min-w-0 flex-1 text-[13px] font-bold text-white truncate">{name || 'Eğitmen'}</span>
        </Link>
    );
};

const Count: React.FC<{ n: number; className?: string }> = ({ n, className }) => (
    <span
        className={cn(
            'min-w-[20px] h-5 px-1.5 rounded-full bg-[#fea619] text-[#3d2600] text-[11px] font-bold tabular-nums flex items-center justify-center shrink-0',
            className
        )}
        aria-label={`${n} bekleyen`}
    >
        {n > 99 ? '99+' : n}
    </span>
);

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
