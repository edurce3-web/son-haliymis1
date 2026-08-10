import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCategoryNav, type NavCategory } from '@/hooks/useCategoryNav';

/**
 * Üst menüdeki kategori gezintisi.
 *
 * Fare üzerine gelince açılır — tıklamak gerekmiyor. Kapanışta küçük bir
 * gecikme var: kullanıcı tetikleyiciden panele geçerken aradaki boşluktan
 * geçtiğinde menü suratına kapanmasın.
 *
 * İki sütun: solda kategoriler, sağda üzerine gelinen kategorinin alt dalları.
 * Böylece tek hamlede alt kategoriye inilebiliyor.
 */
export const CategoryMegaMenu: React.FC = () => {
    const { data, isLoading } = useCategoryNav();
    const categories = data?.categories || [];

    const [open, setOpen] = useState(false);
    const [hovered, setHovered] = useState<NavCategory | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout>>();

    const openMenu = () => {
        clearTimeout(closeTimer.current);
        setOpen(true);
    };

    const scheduleClose = () => {
        clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => {
            setOpen(false);
            setHovered(null);
        }, 180);
    };

    useEffect(() => () => clearTimeout(closeTimer.current), []);

    // Menü açıldığında ilk kategori seçili gelsin; sağ panel boş durmasın
    useEffect(() => {
        if (open && !hovered && categories.length > 0) setHovered(categories[0]);
    }, [open, hovered, categories]);

    // Esc ile kapat — klavye kullanıcısı menüde sıkışmasın
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    return (
        <div
            className="hidden lg:block relative"
            onMouseEnter={openMenu}
            onMouseLeave={scheduleClose}
        >
            <Link
                to="/courses"
                onFocus={openMenu}
                aria-expanded={open}
                aria-haspopup="true"
                className={cn(
                    'flex items-center h-9 px-3 text-sm font-semibold rounded-lg transition-colors',
                    open ? 'text-indigo-600 bg-indigo-50/60' : 'text-slate-600 hover:text-indigo-600'
                )}
            >
                Kategoriler
            </Link>

            {/* Tetikleyici ile panel arasındaki görünmez köprü: fare boşluğa
                girdiğinde onMouseLeave tetiklenip menü kapanmasın */}
            {open && <div className="absolute left-0 top-full h-2 w-full" />}

            {open && (
                <div
                    className="absolute left-0 top-[calc(100%+8px)] z-50 flex bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
                    role="menu"
                >
                    {/* Sol sütun: kategoriler */}
                    <div className="w-64 py-2 max-h-[70vh] overflow-y-auto border-r border-slate-100">
                        {isLoading && (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                            </div>
                        )}

                        {!isLoading && categories.length === 0 && (
                            <p className="px-4 py-6 text-sm text-slate-400 text-center">
                                Henüz kategori yok
                            </p>
                        )}

                        {categories.map(cat => {
                            const active = hovered?.id === cat.id;
                            return (
                                <Link
                                    key={cat.id}
                                    to={`/courses/${cat.slug}`}
                                    onMouseEnter={() => setHovered(cat)}
                                    onFocus={() => setHovered(cat)}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        'flex items-center justify-between gap-2 mx-1.5 px-3 py-2.5 rounded-lg text-sm transition-colors',
                                        active
                                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                            : 'text-slate-700 hover:bg-slate-50'
                                    )}
                                >
                                    <span className="truncate">{cat.name}</span>
                                    <span className="flex items-center gap-1.5 shrink-0">
                                        <span className={cn(
                                            'text-[11px] tabular-nums',
                                            active ? 'text-indigo-400' : 'text-slate-400'
                                        )}>
                                            {cat.count}
                                        </span>
                                        <ChevronRight className={cn(
                                            'w-3.5 h-3.5 transition-opacity',
                                            active ? 'opacity-100 text-indigo-400' : 'opacity-0'
                                        )} />
                                    </span>
                                </Link>
                            );
                        })}

                        <div className="mt-1 pt-2 mx-1.5 border-t border-slate-100">
                            <Link
                                to="/courses"
                                onClick={() => setOpen(false)}
                                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                            >
                                Tüm kursları gör
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>

                    {/* Sağ sütun: seçili kategorinin alt dalları */}
                    <div className="w-[420px] p-5 max-h-[70vh] overflow-y-auto bg-slate-50/50">
                        {hovered ? (
                            <>
                                <div className="flex items-baseline justify-between gap-3 mb-4">
                                    <Link
                                        to={`/courses/${hovered.slug}`}
                                        onClick={() => setOpen(false)}
                                        className="text-base font-bold text-slate-900 hover:text-indigo-600"
                                    >
                                        {hovered.name}
                                    </Link>
                                    <span className="text-xs text-slate-400 shrink-0">
                                        {hovered.count} kurs
                                    </span>
                                </div>

                                {hovered.subcategories.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                        {hovered.subcategories.map(sub => (
                                            <Link
                                                key={sub.id}
                                                to={`/courses/${hovered.slug}/${sub.slug}`}
                                                onClick={() => setOpen(false)}
                                                className="flex items-center justify-between gap-2 py-1.5 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                                            >
                                                <span className="truncate">{sub.name}</span>
                                                <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                                                    {sub.count}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400">
                                        Bu kategoride alt dal yok — tüm kursları görmek için
                                        {' '}
                                        <Link
                                            to={`/courses/${hovered.slug}`}
                                            onClick={() => setOpen(false)}
                                            className="text-indigo-600 hover:underline"
                                        >
                                            {hovered.name}
                                        </Link>
                                        {' '}sayfasına git.
                                    </p>
                                )}

                                <Link
                                    to={`/courses/${hovered.slug}`}
                                    onClick={() => setOpen(false)}
                                    className="inline-flex items-center gap-1 mt-5 text-sm font-semibold text-indigo-600 hover:gap-2 transition-all"
                                >
                                    {hovered.name} kurslarını gör
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </>
                        ) : (
                            <p className="text-sm text-slate-400">
                                Alt kategorileri görmek için bir kategorinin üzerine gel.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryMegaMenu;
