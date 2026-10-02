import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const POPULAR_SEARCHES = ['Python', 'Excel', 'React', 'İngilizce', 'Grafik Tasarım', 'Yapay Zeka'];

/**
 * Ana sayfanın kahraman bölümü.
 *
 * Hem misafir hem üye sayfası aynı bölümü kullanıyor; tek fark üstteki
 * selamlama satırı. İki ayrı kopya tutmak, birinde yapılan görsel düzeltmenin
 * diğerine geçmemesi demekti.
 *
 * Soldaki fotoğraf bölümün arka planının parçası: sağ kenarı maskeyle eriyip
 * koyu zemine karışıyor, üstüne marka rengi bindiriliyor. Böylece parlak bir
 * fotoğraf koyu bölüme yapıştırılmış gibi durmuyor, sayfanın kendi dokusu
 * oluyor.
 */
export const HomeHero: React.FC<{
    /** Üye sayfasında başlığın üstünde görünen satır. */
    greeting?: string | null;
    title?: React.ReactNode;
    subtitle?: string;
}> = ({ greeting, title, subtitle }) => {
    const navigate = useNavigate();
    const [term, setTerm] = useState('');

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = term.trim();
        if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
    };

    return (
        <section className="relative overflow-hidden bg-brand-900">
            <div className="hidden lg:block absolute inset-y-0 left-0 w-[52%] pointer-events-none" aria-hidden>
                <img
                    src="/anasayfa.jpg"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                        // Kişi kadrajın sağında; bu kayma onu görünür alanın
                        // ortasına getiriyor, maskeye denk gelmiyor.
                        objectPosition: '68% center',
                        maskImage: 'linear-gradient(to right, #000 0%, #000 58%, transparent 96%)',
                        WebkitMaskImage: 'linear-gradient(to right, #000 0%, #000 58%, transparent 96%)',
                    }}
                />
                <div className="absolute inset-0 bg-brand-900/55" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-900/70 via-transparent to-brand-900" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-transparent to-brand-900/40" />
            </div>

            <div className="absolute inset-0 pointer-events-none" aria-hidden>
                <div className="absolute -top-40 -left-24 w-[520px] h-[520px] bg-brand-500/20 rounded-full blur-[130px]" />
                <div className="absolute -bottom-48 right-0 w-[560px] h-[560px] bg-brand-400/15 rounded-full blur-[140px]" />
                <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
                        backgroundSize: '56px 56px',
                    }}
                />
            </div>

            <div className="relative container px-4 py-16 lg:py-24 lg:min-h-[560px] flex flex-col justify-center">
                {/* Metin masaüstünde sağ yarıda; solu fotoğrafa bırakıyor */}
                <div className="max-w-3xl lg:max-w-none lg:ml-[52%] lg:pl-10">
                    {greeting && (
                        <p className="text-brand-200 font-medium mb-3">{greeting}</p>
                    )}

                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-[1.12] tracking-tight">
                        {title ?? (
                            <>Öğrenmeye <span className="text-brand-300">bugün</span> başla</>
                        )}
                    </h1>

                    <p className="text-[17px] text-brand-100/80 mt-5 max-w-2xl leading-relaxed">
                        {subtitle ?? 'Yazılımdan tasarıma, mühendislikten müziğe. Alanında uzman eğitmenlerden Türkçe kurslarla kendi hızında ilerle.'}
                    </p>

                    <form onSubmit={submitSearch} className="mt-8 max-w-xl">
                        <div className="relative">
                            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                value={term}
                                onChange={e => setTerm(e.target.value)}
                                placeholder="Ne öğrenmek istiyorsun?"
                                aria-label="Kurs ara"
                                className="w-full h-14 pl-12 pr-32 rounded-xl bg-white text-[15px] text-slate-900 placeholder:text-slate-400 shadow-2xl shadow-black/25 focus:outline-none focus:ring-4 focus:ring-brand-400/40"
                            />
                            <Button
                                type="submit"
                                className="absolute right-2 top-2 h-10 px-6 rounded-lg bg-brand-700 hover:bg-brand-800 font-semibold"
                            >
                                Ara
                            </Button>
                        </div>
                    </form>

                    <div className="flex flex-wrap items-center gap-2 mt-4">
                        <span className="text-xs text-brand-200/70">Popüler:</span>
                        {POPULAR_SEARCHES.map(s => (
                            <Link
                                key={s}
                                to={`/search?q=${encodeURIComponent(s)}`}
                                className="text-xs text-brand-100 hover:text-white border border-white/15 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
                            >
                                {s}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HomeHero;
