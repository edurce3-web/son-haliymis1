import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useUnansweredCount, useUnreadMessages } from './useInstructorWorkspace';

/*
 * Eğitmen paneli iskeleti.
 *
 * Menü bir kitabın dizini gibi: yalnızca büyük başlıklar. Alt sayfalar
 * başlığın üzerine gelince yandan açılan bir çekmecede. Çekmece menünün
 * içinde aşağı doğru açılmıyor; açılsaydı alttaki başlıklar kayar ve imleç
 * hedeflediği başlığı kaçırırdı. Yana açılınca hiçbir şey yerinden oynamıyor.
 *
 * Üzerine gelinen başlığın satırı beyazlaşıp çekmeceyle birleşiyor; ikisi
 * tek parça görünüyor, başlık çekmeceyi dışarı çekmiş gibi.
 *
 * Telefonda üzerine gelmek yok: orada başlığa dokununca alt sayfalar
 * başlığın altında açılıyor.
 */

export const NAV_WIDTH = 248;
const FLYOUT_WIDTH = 300;
const OPEN_DELAY = 70;
const CLOSE_DELAY = 180;

type Sub = { to: string; label: string; hint: string; badge?: number };
type Section = { id: string; label: string; to?: string; match?: RegExp; subs?: Sub[]; badge?: number };

function useSections(): Section[] {
    const { count: unanswered } = useUnansweredCount();
    const { count: unread } = useUnreadMessages();

    return [
        { id: 'home', label: 'Genel bakış', to: '/instructor/dashboard', match: /^\/instructor\/?(dashboard)?\/?$/ },
        {
            id: 'courses', label: 'Kurslar', match: /^\/instructor\/courses/,
            subs: [
                { to: '/instructor/courses/list', label: 'Kurslarım', hint: 'Taslaklar, incelemedekiler, yayındakiler' },
                { to: '/instructor/courses/create', label: 'Yeni kurs oluştur', hint: 'Başlık ve kategoriyle başla' },
                { to: '/instructor/courses/announcements', label: 'Duyurular', hint: 'Öğrencilerine toplu haber ver' },
            ],
        },
        {
            id: 'students', label: 'Öğrenciler', match: /^\/instructor\/students/, badge: unanswered + unread,
            subs: [
                { to: '/instructor/students/qa', label: 'Soru-Cevap', hint: 'Derslerin altındaki sorular', badge: unanswered },
                { to: '/instructor/students/messages', label: 'Mesajlar', hint: 'Öğrencilerle birebir yazışma', badge: unread },
                { to: '/instructor/students/reviews', label: 'Yorumlar', hint: 'Puanlar ve değerlendirmeler' },
                { to: '/instructor/students/list', label: 'Öğrenci listesi', hint: 'Kim hangi kursta, ne kadar ilerledi' },
            ],
        },
        {
            id: 'books', label: 'E-kitaplar', match: /^\/instructor\/books/,
            subs: [
                { to: '/instructor/books/manage', label: 'Kitaplarım', hint: 'Yayındaki ve taslak e-kitaplar' },
                { to: '/instructor/books/create', label: 'Yeni e-kitap', hint: 'PDF yükle, fiyatını belirle' },
            ],
        },
        {
            id: 'money', label: 'Kazanç', match: /^\/instructor\/finance/,
            subs: [
                { to: '/instructor/finance/report', label: 'Gelir raporu', hint: 'Satışlar, kesintiler, net kazanç' },
                { to: '/instructor/finance/payout', label: 'Ödeme bilgileri', hint: 'IBAN ve fatura bilgilerin' },
            ],
        },
        {
            id: 'account', label: 'Hesap', match: /^\/instructor\/settings/,
            subs: [
                { to: '/instructor/settings/profile', label: 'Eğitmen profili', hint: 'Öğrencilerin gördüğü tanıtım' },
                { to: '/instructor/settings/account', label: 'Hesap ayarları', hint: 'E-posta, şifre, bildirimler' },
                { to: '/instructor/settings/help', label: 'Yardım', hint: 'Sık sorulanlar ve destek' },
            ],
        },
    ];
}

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
            <header className="lg:hidden sticky top-0 z-40 h-14 grid grid-cols-[40px_1fr_40px] items-center px-3 bg-[#eef2f1]/95 backdrop-blur border-b border-[#dde4e2]">
                <button
                    type="button"
                    onClick={() => setDrawer(true)}
                    aria-label="Menüyü aç"
                    aria-expanded={drawer}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-[#3e4947] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/40"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <Brand className="justify-self-center" />
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
                    'lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col bg-[#eef2f1] w-[min(300px,86vw)]',
                    'transition-[transform,visibility,box-shadow] duration-[240ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
                    drawer ? 'translate-x-0 shadow-[8px_0_32px_-12px_rgba(19,27,46,0.35)]' : '-translate-x-full invisible'
                )}
            >
                <button
                    type="button"
                    onClick={() => setDrawer(false)}
                    aria-label="Menüyü kapat"
                    className="absolute top-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center text-[#6e7977] hover:bg-white"
                >
                    <X className="w-4 h-4" />
                </button>
                <MobileNav />
            </aside>

            <main className="lg:pl-[248px]">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-9 pb-24">
                    {children}
                </div>
            </main>
        </div>
    );
};

const Brand: React.FC<{ className?: string }> = ({ className }) => (
    <Link to="/instructor/dashboard" className={cn('inline-flex items-baseline gap-2', className)}>
        <img src="/logo-wordmark.png" alt="Edurce" className="h-6 w-auto self-center" />
        <span className="text-[12px] font-semibold text-[#6e7977]">eğitmen</span>
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
            className="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col bg-[#eef2f1] border-r border-[#dde4e2]"
            style={{ width: NAV_WIDTH }}
            onMouseLeave={hide}
        >
            <div className="h-[76px] shrink-0 flex items-center justify-center border-b border-[#dde4e2]">
                <Brand />
            </div>

            <nav aria-label="Eğitmen paneli" className="relative flex-1 pt-6">
                <ul>
                    {sections.map(s => {
                        const active = s.match?.test(location.pathname) ?? false;
                        const isOpen = openId === s.id;
                        const row = cn(
                            'relative flex items-center gap-3 w-full h-[54px] pl-7 pr-5 text-left',
                            'text-[19px] tracking-[-0.015em] transition-[background-color,color] duration-150',
                            'focus-visible:outline-none focus-visible:bg-white',
                            isOpen ? 'bg-white text-[#131b2e]' : active ? 'text-[#005c55]' : 'text-[#3e4947] hover:text-[#131b2e]',
                            active ? 'font-bold' : 'font-semibold'
                        );
                        const inner = (
                            <>
                                <span
                                    aria-hidden
                                    className={cn(
                                        'absolute left-3 w-1.5 h-1.5 rounded-full bg-[#005c55] transition-opacity duration-150',
                                        active ? 'opacity-100' : 'opacity-0'
                                    )}
                                />
                                <span className="flex-1 truncate">{s.label}</span>
                                {s.badge ? <Count n={s.badge} /> : null}
                                {s.subs && (
                                    <ChevronRight
                                        aria-hidden
                                        className={cn(
                                            'w-4 h-4 shrink-0 transition-[opacity,transform] duration-150',
                                            isOpen ? 'opacity-100 translate-x-0.5 text-[#005c55]' : 'opacity-0'
                                        )}
                                    />
                                )}
                            </>
                        );

                        return (
                            <li
                                key={s.id}
                                ref={el => { rows.current[s.id] = el; }}
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

                {/* Çekmece: açık başlığın satırına yapışık */}
                <div
                    id="instructor-flyout"
                    role="menu"
                    aria-label={shown?.label}
                    onMouseEnter={keep}
                    onMouseLeave={hide}
                    className={cn(
                        'absolute left-full -ml-px z-50 rounded-r-2xl rounded-bl-2xl bg-white',
                        'shadow-[16px_24px_48px_-24px_rgba(19,27,46,0.35)]',
                        'transition-[opacity,transform,top] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
                        settled ? 'duration-150' : 'duration-200',
                        open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'
                    )}
                    style={{ top, width: FLYOUT_WIDTH }}
                >
                    {shown && (
                        <ul className="p-2">
                            {shown.subs!.map(sub => (
                                <li key={sub.to}>
                                    <NavLink
                                        to={sub.to}
                                        role="menuitem"
                                        className={({ isActive }) => cn(
                                            'group flex items-start gap-3 rounded-xl px-3.5 py-2.5 transition-colors duration-150',
                                            'focus-visible:outline-none focus-visible:bg-[#eef2f1]',
                                            isActive ? 'bg-[#e6f4f1]' : 'hover:bg-[#f2f6f5]'
                                        )}
                                    >
                                        {({ isActive }) => (
                                            <>
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
                                                {sub.badge ? <Count n={sub.badge} className="mt-0.5" /> : null}
                                            </>
                                        )}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </nav>

            <UserFooter />
        </aside>
    );
};

/* ── Telefon: dokununca altında açılan başlıklar ───────────────────── */

const MobileNav: React.FC = () => {
    const sections = useSections();
    const location = useLocation();
    const current = sections.find(s => s.match?.test(location.pathname))?.id ?? null;
    const [expanded, setExpanded] = useState<string | null>(current);

    return (
        <>
            <div className="h-14 shrink-0 flex items-center justify-center border-b border-[#dde4e2]">
                <Brand />
            </div>
            <nav aria-label="Eğitmen paneli" className="flex-1 overflow-y-auto py-3">
                {sections.map(s => {
                    const active = s.id === current;
                    const isOpen = expanded === s.id;
                    const row = cn(
                        'flex items-center gap-3 w-full h-[52px] px-6 text-left text-[18px] tracking-[-0.015em]',
                        active ? 'text-[#005c55] font-bold' : 'text-[#3e4947] font-semibold'
                    );
                    if (!s.subs) return <Link key={s.id} to={s.to!} className={row}>{s.label}</Link>;
                    return (
                        <div key={s.id} className={cn(isOpen && 'bg-white')}>
                            <button
                                type="button"
                                className={row}
                                aria-expanded={isOpen}
                                onClick={() => setExpanded(isOpen ? null : s.id)}
                            >
                                <span className="flex-1">{s.label}</span>
                                {s.badge ? <Count n={s.badge} /> : null}
                                <ChevronDown className={cn('w-4 h-4 text-[#6e7977] transition-transform duration-200', isOpen && 'rotate-180')} />
                            </button>
                            {isOpen && (
                                <ul className="pb-2 px-3">
                                    {s.subs.map(sub => (
                                        <li key={sub.to}>
                                            <NavLink
                                                to={sub.to}
                                                className={({ isActive }) => cn(
                                                    'flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-[15px]',
                                                    isActive ? 'bg-[#e6f4f1] text-[#005c55] font-semibold' : 'text-[#131b2e] font-medium'
                                                )}
                                            >
                                                {sub.label}
                                                {sub.badge ? <Count n={sub.badge} /> : null}
                                            </NavLink>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </nav>
            <UserFooter />
        </>
    );
};

const UserFooter: React.FC = () => {
    const { user } = useAuth();
    const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
    const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'E';

    return (
        <div className="shrink-0 border-t border-[#dde4e2] px-4 py-3 flex items-center gap-2.5">
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
