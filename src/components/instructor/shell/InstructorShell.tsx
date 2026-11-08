import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, BarChart3, BookOpen, BookText, ChevronDown, ChevronRight, CreditCard,
    LayoutDashboard, LayoutList, Library, LifeBuoy, Mail, Megaphone, Menu, MessageCircleQuestion,
    Plus, Shield, Star, UserRound, Users, Wallet, X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
    useInstructorCourses, useInstructorDashboard, useUnansweredCount, useUnreadMessages,
} from './useInstructorWorkspace';

/*
 * Eğitmen paneli iskeleti.
 *
 * Menü koyu teal bir şerit ve bir kitabın dizini gibi: yalnızca büyük
 * başlıklar. Alt sayfalar başlığın üzerine gelince yandan açılan bir
 * çekmecede. Çekmece menünün içinde aşağı açılmıyor; açılsaydı alttaki
 * başlıklar kayar ve imleç hedeflediği başlığı kaçırırdı.
 *
 * Üzerine gelinen başlık beyaz bir sekmeye dönüşüp çekmeceyle birleşiyor;
 * koyu zeminde ikisi tek parça, başlık çekmeceyi dışarı çekmiş gibi.
 * Çekmecenin tepesi o bölümün o anki durumunu söylüyor (kaç taslak, kaç
 * bekleyen soru, bakiye): menü yalnızca yol göstermiyor, haber de veriyor.
 *
 * Telefonda üzerine gelmek yok: orada başlığa dokununca alt sayfalar
 * başlığın altında açılıyor.
 */

export const NAV_WIDTH = 256;
const FLYOUT_WIDTH = 324;
const OPEN_DELAY = 70;
const CLOSE_DELAY = 180;
const EASE_OUT = 'cubic-bezier(0.23,1,0.32,1)';

const lira = (n: number) =>
    `₺${(Number(n) || 0).toLocaleString('tr-TR', { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

type Sub = { to: string; label: string; hint: string; icon: React.ElementType; badge?: number };
type Section = {
    id: string;
    label: string;
    icon: React.ElementType;
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
        { id: 'home', label: 'Genel bakış', icon: LayoutDashboard, to: '/instructor/dashboard', match: /^\/instructor\/?(dashboard)?\/?$/ },
        {
            id: 'courses', label: 'Kurslar', icon: BookOpen, match: /^\/instructor\/courses/,
            subs: [
                { to: '/instructor/courses/list', label: 'Kurslarım', hint: 'Taslaklar, incelemedekiler, yayındakiler', icon: LayoutList },
                { to: '/instructor/courses/announcements', label: 'Duyurular', hint: 'Öğrencilerine toplu haber ver', icon: Megaphone },
            ],
            action: { to: '/instructor/courses/create', label: 'Yeni kurs oluştur' },
        },
        {
            id: 'students', label: 'Öğrenciler', icon: Users, match: /^\/instructor\/students/, badge: unanswered + unread,
            subs: [
                { to: '/instructor/students/qa', label: 'Soru-Cevap', hint: 'Derslerin altındaki sorular', icon: MessageCircleQuestion, badge: unanswered },
                { to: '/instructor/students/messages', label: 'Mesajlar', hint: 'Öğrencilerle birebir yazışma', icon: Mail, badge: unread },
                { to: '/instructor/students/reviews', label: 'Yorumlar', hint: 'Puanlar ve değerlendirmeler', icon: Star },
                { to: '/instructor/students/list', label: 'Öğrenci listesi', hint: 'Kim hangi kursta, ne kadar ilerledi', icon: Users },
            ],
        },
        {
            id: 'books', label: 'E-kitaplar', icon: Library, match: /^\/instructor\/books/,
            subs: [
                { to: '/instructor/books/manage', label: 'Kitaplarım', hint: 'Yayındaki ve taslak e-kitaplar', icon: BookText },
            ],
            action: { to: '/instructor/books/create', label: 'Yeni e-kitap yükle' },
        },
        {
            id: 'money', label: 'Kazanç', icon: Wallet, match: /^\/instructor\/finance/,
            subs: [
                { to: '/instructor/finance/report', label: 'Gelir raporu', hint: 'Satışlar, kesintiler, net kazanç', icon: BarChart3 },
                { to: '/instructor/finance/payout', label: 'Ödeme bilgileri', hint: 'IBAN ve fatura bilgilerin', icon: CreditCard },
            ],
        },
        {
            id: 'account', label: 'Hesap', icon: UserRound, match: /^\/instructor\/settings/,
            subs: [
                { to: '/instructor/settings/profile', label: 'Eğitmen profili', hint: 'Öğrencilerin gördüğü tanıtım', icon: UserRound },
                { to: '/instructor/settings/account', label: 'Hesap ayarları', hint: 'E-posta, şifre, bildirimler', icon: Shield },
                { to: '/instructor/settings/help', label: 'Yardım', hint: 'Sık sorulanlar ve destek', icon: LifeBuoy },
            ],
        },
    ];
}

const RAIL_BG = 'bg-[linear-gradient(180deg,#013a35_0%,#012824_100%)]';

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
        <div className="min-h-screen bg-[#f8faf9] text-[#131b2e] selection:bg-[#9cf2e8] selection:text-[#00201d]">
            <DesktopNav />

            {/* Telefon: üst şerit + çekmece */}
            <header className={cn('lg:hidden sticky top-0 z-40 h-14 grid grid-cols-[40px_1fr_40px] items-center px-3', RAIL_BG)}>
                <button
                    type="button"
                    onClick={() => setDrawer(true)}
                    aria-label="Menüyü aç"
                    aria-expanded={drawer}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-[#cfe7e3] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9cf2e8]/60"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <Brand className="justify-self-center" />
            </header>

            <div
                aria-hidden={!drawer}
                onClick={() => setDrawer(false)}
                className={cn(
                    'lg:hidden fixed inset-0 z-50 bg-[#131b2e]/45 transition-opacity duration-200 motion-reduce:transition-none',
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
                    drawer ? 'translate-x-0 shadow-[12px_0_40px_-12px_rgba(1,20,18,0.6)]' : '-translate-x-full invisible'
                )}
            >
                <button
                    type="button"
                    onClick={() => setDrawer(false)}
                    aria-label="Menüyü kapat"
                    className="absolute top-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center text-[#8fbfb8] hover:bg-white/10"
                >
                    <X className="w-4 h-4" />
                </button>
                <MobileNav />
            </aside>

            <main className="lg:pl-[256px]">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-9 pb-24">
                    {children}
                </div>
            </main>
        </div>
    );
};

/** Logo koyu zeminde beyaza çevriliyor; ayrı bir beyaz logo dosyası yok. */
const Brand: React.FC<{ className?: string }> = ({ className }) => (
    <Link to="/instructor/dashboard" className={cn('inline-flex items-baseline gap-2', className)}>
        <img src="/logo-wordmark.png" alt="Edurce" className="h-6 w-auto self-center brightness-0 invert" />
        <span className="text-[12px] font-semibold text-[#8fbfb8]">eğitmen</span>
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
                (rows.current[id]?.querySelector('button,a') as HTMLElement | null)?.focus();
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
            <div className="h-[76px] shrink-0 flex items-center justify-center border-b border-white/[0.08]">
                <Brand />
            </div>

            <nav aria-label="Eğitmen paneli" className="relative flex-1 pt-5">
                <ul>
                    {sections.map(s => {
                        const active = s.match.test(location.pathname);
                        const isOpen = openId === s.id;
                        const Icon = s.icon;
                        const row = cn(
                            'relative flex items-center gap-3 w-full h-[52px] pl-4 pr-5 text-left rounded-l-2xl',
                            'text-[17px] tracking-[-0.01em] transition-[background-color,color] duration-150',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#9cf2e8]/60',
                            isOpen
                                ? 'bg-white text-[#131b2e]'
                                : active
                                    ? 'text-[#9cf2e8] bg-white/[0.06]'
                                    : 'text-[#b9d8d3] hover:text-white hover:bg-white/[0.04]',
                            active ? 'font-bold' : 'font-semibold'
                        );
                        const inner = (
                            <>
                                <Icon
                                    aria-hidden
                                    className={cn(
                                        'w-[19px] h-[19px] shrink-0 transition-colors duration-150',
                                        isOpen ? 'text-[#005c55]' : active ? 'text-[#9cf2e8]' : 'text-[#6fa9a1]'
                                    )}
                                    strokeWidth={active || isOpen ? 2.2 : 1.9}
                                />
                                <span className="flex-1 truncate">{s.label}</span>
                                {s.badge ? <Count n={s.badge} /> : null}
                                {s.subs && (
                                    <ChevronRight
                                        aria-hidden
                                        className={cn(
                                            'w-4 h-4 shrink-0 transition-[opacity,transform,color] duration-150',
                                            isOpen ? 'opacity-100 translate-x-0.5 text-[#005c55]' : 'opacity-40'
                                        )}
                                    />
                                )}
                            </>
                        );

                        return (
                            <li
                                key={s.id}
                                ref={el => { rows.current[s.id] = el; }}
                                className="pl-3"
                                onMouseEnter={() => (s.subs ? show(s.id) : hide())}
                            >
                                {s.subs ? (
                                    <button
                                        type="button"
                                        className={row}
                                        aria-haspopup="true"
                                        aria-expanded={isOpen}
                                        aria-controls="instructor-flyout"
                                        onClick={() => (isOpen ? setOpenId(null) : show(s.id, true))}
                                        onKeyDown={e => {
                                            if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                show(s.id, true);
                                                requestAnimationFrame(() =>
                                                    (document.querySelector('#instructor-flyout a') as HTMLElement | null)?.focus()
                                                );
                                            }
                                        }}
                                    >
                                        {inner}
                                    </button>
                                ) : (
                                    <Link to={s.to!} className={row} onFocus={() => setOpenId(null)}>
                                        {inner}
                                    </Link>
                                )}
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
                        'absolute left-full z-50 rounded-r-2xl rounded-bl-2xl bg-white overflow-hidden',
                        'shadow-[24px_28px_60px_-28px_rgba(1,30,27,0.55),0_2px_6px_rgba(19,27,46,0.06)]',
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
const Flyout: React.FC<{ section: Section; animate: boolean }> = ({ section, animate }) => {
    const list = useRef<HTMLUListElement>(null);
    const [hl, setHl] = useState<{ top: number; height: number } | null>(null);

    // Fare hangi satırdaysa açık zemin onu takip ediyor; satırdan satıra
    // kayarak geçiyor, her satırda yeniden yanıp sönmüyor.
    const follow = (e: React.MouseEvent<HTMLElement>) => {
        const el = e.currentTarget;
        setHl({ top: el.offsetTop, height: el.offsetHeight });
    };

    return (
        <>
            <FlyoutHeader section={section} />

            <ul ref={list} className="relative p-2" onMouseLeave={() => setHl(null)}>
                <span
                    aria-hidden
                    className={cn(
                        'absolute left-2 right-2 rounded-xl bg-[#eef6f4] transition-[top,height,opacity] duration-200 motion-reduce:transition-none',
                        hl ? 'opacity-100' : 'opacity-0'
                    )}
                    style={{ top: hl?.top ?? 0, height: hl?.height ?? 0, transitionTimingFunction: EASE_OUT }}
                />
                {section.subs!.map((sub, i) => {
                    const Icon = sub.icon;
                    return (
                        <li
                            key={sub.to}
                            onMouseEnter={follow}
                            className={cn(
                                'relative',
                                animate && 'animate-in fade-in slide-in-from-left-1 duration-200 fill-mode-both'
                            )}
                            style={animate ? { animationDelay: `${40 + i * 30}ms` } : undefined}
                        >
                            <NavLink
                                to={sub.to}
                                role="menuitem"
                                className={({ isActive }) => cn(
                                    'flex items-start gap-3 rounded-xl px-3 py-2.5',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/35',
                                    isActive && 'bg-[#e1f3ef]'
                                )}
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon
                                            aria-hidden
                                            className={cn('w-[18px] h-[18px] mt-px shrink-0', isActive ? 'text-[#005c55]' : 'text-[#5b8f88]')}
                                            strokeWidth={2}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className={cn(
                                                'block text-[14.5px] font-semibold leading-tight',
                                                isActive ? 'text-[#005c55]' : 'text-[#131b2e]'
                                            )}>
                                                {sub.label}
                                            </span>
                                            <span className="block text-[12.5px] text-[#6e7977] mt-0.5 leading-snug">
                                                {sub.hint}
                                            </span>
                                        </span>
                                        {sub.badge ? <Count n={sub.badge} className="mt-px" /> : null}
                                    </>
                                )}
                            </NavLink>
                        </li>
                    );
                })}
            </ul>

            {section.action && (
                <div className="px-4 pb-4 pt-1">
                    <Link
                        to={section.action.to}
                        className="group flex items-center justify-center gap-2 h-10 rounded-xl bg-[#005c55] hover:bg-[#00483f] active:scale-[0.98] text-white text-[13.5px] font-semibold shadow-[0_1px_2px_rgba(0,64,58,0.35)] transition-[background-color,transform] duration-150"
                    >
                        <Plus className="w-4 h-4" />
                        {section.action.label}
                    </Link>
                </div>
            )}
        </>
    );
};

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
            { k: 'draft', label: 'taslak', dot: 'bg-[#d08a1c]' },
            { k: 'pending', label: 'incelemede', dot: 'bg-[#2f7fc1]' },
            { k: 'published', label: 'yayında', dot: 'bg-[#0f9f8f]' },
        ].map(p => ({ ...p, n: n(p.k) })).filter(p => p.n > 0);
        meta = parts.length ? (
            <div className="flex flex-wrap gap-x-3 gap-y-1">
                {parts.map(p => (
                    <span key={p.k} className="inline-flex items-center gap-1.5 text-[12.5px] text-[#3e4947]">
                        <span className={cn('w-1.5 h-1.5 rounded-full', p.dot)} />
                        <b className="font-bold tabular-nums text-[#131b2e]">{p.n}</b> {p.label}
                    </span>
                ))}
            </div>
        ) : <span className="text-[12.5px] text-[#6e7977]">Henüz kursun yok</span>;
    }

    if (section.id === 'students') {
        const waiting = unanswered + unread;
        meta = (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-[#3e4947]">
                {stats && <span><b className="font-bold tabular-nums text-[#131b2e]">{Number(stats.totalStudents || 0).toLocaleString('tr-TR')}</b> öğrenci</span>}
                <span className={waiting ? 'text-[#855300] font-semibold' : ''}>
                    {waiting ? `${waiting} iş seni bekliyor` : 'Bekleyen iş yok'}
                </span>
            </div>
        );
    }

    if (section.id === 'money' && stats) {
        meta = (
            <div className="grid grid-cols-2 gap-3 mt-0.5">
                <span>
                    <span className="block text-[11.5px] text-[#6e7977]">Bu ay</span>
                    <span className="block text-[17px] font-bold tabular-nums tracking-tight">{lira(stats.monthlyRevenue)}</span>
                </span>
                <span>
                    <span className="block text-[11.5px] text-[#6e7977]">Ödenecek bakiye</span>
                    <span className="block text-[17px] font-bold tabular-nums tracking-tight text-[#005c55]">{lira(stats.balance)}</span>
                </span>
            </div>
        );
    }

    if (section.id === 'account' && user?.email) {
        meta = <span className="block text-[12.5px] text-[#6e7977] truncate">{user.email}</span>;
    }

    return (
        <div className="px-5 pt-4 pb-3 border-b border-[#eef2f1] bg-[linear-gradient(180deg,#f4faf8,#ffffff)]">
            <p className="text-[15.5px] font-bold tracking-tight text-[#131b2e]">{section.label}</p>
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
            className="group mx-3 mb-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] ring-1 ring-inset ring-white/[0.06] px-4 py-3.5 transition-colors duration-150"
        >
            <span className="flex items-center justify-between text-[12px] font-medium text-[#8fbfb8]">
                Bu ayki kazancın
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-[opacity,transform] duration-150" />
            </span>
            {isLoading || !stats ? (
                <span className="block mt-2 space-y-1.5" aria-hidden>
                    <span className="block h-4 w-24 rounded bg-white/10 animate-pulse" />
                    <span className="block h-2.5 w-16 rounded bg-white/10 animate-pulse" />
                </span>
            ) : (
                <>
                    <span className="block mt-1 text-[22px] leading-tight font-bold tabular-nums tracking-tight text-white">
                        {lira(stats.monthlyRevenue)}
                    </span>
                    <span className="block mt-0.5 text-[12px] text-[#8fbfb8]">
                        {stats.monthlySales || 0} satış
                        {stats.monthlyChange != null && (
                            <span className={stats.monthlyChange >= 0 ? 'text-[#9cf2e8]' : 'text-[#ffb59e]'}>
                                {' '}· {stats.monthlyChange > 0 ? '+' : ''}{stats.monthlyChange}%
                            </span>
                        )}
                    </span>
                </>
            )}
        </Link>
    );
};

/* ── Telefon: dokununca altında açılan başlıklar ───────────────────── */

const MobileNav: React.FC = () => {
    const sections = useSections();
    const location = useLocation();
    const current = sections.find(s => s.match.test(location.pathname))?.id ?? null;
    const [expanded, setExpanded] = useState<string | null>(current);

    return (
        <>
            <div className="h-14 shrink-0 flex items-center justify-center border-b border-white/[0.08]">
                <Brand />
            </div>
            <nav aria-label="Eğitmen paneli" className="flex-1 overflow-y-auto py-3 px-2">
                {sections.map(s => {
                    const active = s.id === current;
                    const isOpen = expanded === s.id;
                    const Icon = s.icon;
                    const row = cn(
                        'flex items-center gap-3 w-full h-[50px] px-4 rounded-xl text-left text-[17px] tracking-[-0.01em]',
                        active ? 'text-[#9cf2e8] font-bold' : 'text-[#cfe7e3] font-semibold'
                    );
                    const icon = <Icon className={cn('w-[19px] h-[19px] shrink-0', active ? 'text-[#9cf2e8]' : 'text-[#6fa9a1]')} />;
                    if (!s.subs) return <Link key={s.id} to={s.to!} className={row}>{icon}{s.label}</Link>;
                    return (
                        <div key={s.id} className={cn('rounded-xl transition-colors', isOpen && 'bg-white/[0.06]')}>
                            <button
                                type="button"
                                className={row}
                                aria-expanded={isOpen}
                                onClick={() => setExpanded(isOpen ? null : s.id)}
                            >
                                {icon}
                                <span className="flex-1">{s.label}</span>
                                {s.badge ? <Count n={s.badge} /> : null}
                                <ChevronDown className={cn('w-4 h-4 text-[#6fa9a1] transition-transform duration-200', isOpen && 'rotate-180')} />
                            </button>
                            {isOpen && (
                                <ul className="pb-2 pl-11 pr-2">
                                    {s.subs.map(sub => (
                                        <li key={sub.to}>
                                            <NavLink
                                                to={sub.to}
                                                className={({ isActive }) => cn(
                                                    'flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-[15px]',
                                                    isActive ? 'bg-white/10 text-white font-semibold' : 'text-[#b9d8d3] font-medium'
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
                                                className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-[15px] font-semibold text-[#9cf2e8]"
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
        <div className="shrink-0 border-t border-white/[0.08] px-4 py-3 flex items-center gap-2.5">
            {user?.profile_image ? (
                <img src={user.profile_image} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10" />
            ) : (
                <span className="w-8 h-8 rounded-full bg-[#9cf2e8] text-[#00201d] text-[12px] font-bold flex items-center justify-center">
                    {initials}
                </span>
            )}
            <span className="min-w-0 flex-1 text-[13px] font-semibold text-white truncate">{name || 'Eğitmen'}</span>
            <Link
                to="/"
                title="Siteye dön"
                className="inline-flex items-center gap-1 h-8 px-2 rounded-lg text-[12px] font-semibold text-[#8fbfb8] hover:text-white hover:bg-white/10 transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                Site
            </Link>
        </div>
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
