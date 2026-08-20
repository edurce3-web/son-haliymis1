import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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
 * Kurs sayıları gösterilmiyor; menüde gezinirken sayı okumak yerine ismi
 * taramak isteniyor, rakamlar satırı kalabalıklaştırıyordu.
 */
export const CategoryMegaMenu: React.FC = () => {
    // Ağaç yerel dosyadan geldiği için liste anında hazır; ağ beklenmiyor.
    const { data } = useCategoryNav();
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
                    'relative flex items-center h-9 px-3 text-sm font-semibold transition-colors',
                    open ? 'text-brand-800' : 'text-slate-600 hover:text-brand-800'
                )}
            >
                Kategoriler
                {/* Açıkken başlığın altında ince bir marka çizgisi */}
                <span
                    aria-hidden
                    className={cn(
                        'absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full bg-brand-700 transition-opacity',
                        open ? 'opacity-100' : 'opacity-0'
                    )}
                />
            </Link>

            {/* Tetikleyici ile panel arasındaki görünmez köprü: fare boşluğa
                girdiğinde onMouseLeave tetiklenip menü kapanmasın */}
            {open && <div className="absolute left-0 top-full h-3 w-full" />}

            {open && (
                <div
                    className="absolute left-0 top-[calc(100%+10px)] z-50 flex bg-white rounded-xl border border-slate-200 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
                    role="menu"
                >
                    {/* Sol sütun: kategoriler */}
                    <div className="w-[248px] py-2 max-h-[70vh] overflow-y-auto bg-slate-50/70 border-r border-slate-200">
                        {categories.length === 0 && (
                            <p className="px-4 py-6 text-sm text-slate-400 text-center">
                                Henüz kategori yok
                            </p>
                        )}

                        {categories.map(cat => {
                            const active = hovered?.slug === cat.slug;
                            return (
                                <Link
                                    key={cat.slug}
                                    to={`/courses/${cat.slug}`}
                                    onMouseEnter={() => setHovered(cat)}
                                    onFocus={() => setHovered(cat)}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        'relative block px-5 py-2.5 text-[14px] transition-colors',
                                        active
                                            ? 'bg-white text-brand-800 font-semibold'
                                            : 'text-slate-600 hover:text-slate-900'
                                    )}
                                >
                                    {/* Seçili kategoriyi sol kenardaki çubuk gösterir */}
                                    <span
                                        aria-hidden
                                        className={cn(
                                            'absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-brand-700 transition-opacity',
                                            active ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    <span className="truncate block">{cat.name}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Sağ sütun: seçili kategorinin alt dalları */}
                    <div className="w-[560px] p-7 max-h-[70vh] overflow-y-auto">
                        {hovered ? (
                            <>
                                <Link
                                    to={`/courses/${hovered.slug}`}
                                    onClick={() => setOpen(false)}
                                    className="text-[17px] font-bold text-slate-900 hover:text-brand-800 transition-colors"
                                >
                                    {hovered.name}
                                </Link>
                                <span className="block w-8 h-[3px] rounded-full bg-brand-700 mt-2.5 mb-5" />

                                {hovered.subcategories.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                        {hovered.subcategories.map(sub => (
                                            <Link
                                                key={sub.slug}
                                                to={`/courses/${hovered.slug}/${sub.slug}`}
                                                onClick={() => setOpen(false)}
                                                className="block py-1.5 text-[14px] text-slate-600 hover:text-brand-800 transition-colors truncate"
                                            >
                                                {sub.name}
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500">
                                        Bu kategoride alt dal yok.
                                    </p>
                                )}

                                <div className="mt-7 pt-5 border-t border-slate-100 flex items-center justify-between gap-4">
                                    <Link
                                        to={`/courses/${hovered.slug}`}
                                        onClick={() => setOpen(false)}
                                        className="text-[14px] font-semibold text-brand-700 hover:text-brand-900 hover:underline"
                                    >
                                        {hovered.name} kurslarını gör
                                    </Link>
                                    <Link
                                        to="/courses"
                                        onClick={() => setOpen(false)}
                                        className="text-[14px] text-slate-500 hover:text-slate-900"
                                    >
                                        Tüm kurslar
                                    </Link>
                                </div>
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
