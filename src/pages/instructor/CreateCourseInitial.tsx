import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';
import { useCategoryNav } from '@/hooks/useCategoryNav';
import { EditorFrame } from '@/components/instructor/shell/EditorFrame';

const TITLE_MAX = 80;

/**
 * Kurs taslağı oluşturma — kurs oluşturucunun ilk adımı.
 *
 * Panelden ayrı, kendi sayfası. Tek sütun, iki soru: ad (en çok 80 karakter)
 * ve konu. Kategoriler açılır liste yerine seçenek kutusu: hepsi bir bakışta
 * görünüyor, tek tıkla seçiliyor.
 *
 * Alt kategori zorunlu. Boş bırakılan kurslar kategori sayfalarının alt
 * dallarında hiç görünmüyor.
 */
export const CreateCourseInitial: React.FC = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState<string>('');
    const [subcategoryId, setSubcategoryId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // Kategoriler veritabanından geliyor; sabit liste gerçek id'lerle örtüşmüyordu.
    const { data: navData, isLoading: catsLoading } = useCategoryNav();
    const categories = (navData?.categories || []).filter(c => c.id != null);
    const selectedCategory = categories.find(c => String(c.id) === categoryId);
    const subcategories = (selectedCategory?.subcategories || []).filter(c => c.id != null);

    const needsSubcategory = subcategories.length > 0;
    const canSubmit = Boolean(title.trim() && categoryId && (!needsSubcategory || subcategoryId));
    const missing = !title.trim() ? 'Önce kursuna bir ad ver' : !categoryId ? 'Bir konu seç' : needsSubcategory && !subcategoryId ? 'Alt konuyu seç' : null;

    const handleCreate = async () => {
        if (!canSubmit || loading) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const res = await fetch(`${API_BASE_URL}/instructor/courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    title: title.trim(),
                    category_id: categoryId,
                    subcategory_id: subcategoryId || null,
                    status: 'draft',
                }),
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('Taslağın hazır. Şimdi ayrıntıları ekleyelim.');
                navigate(`/instructor/courses/edit/${data.id}`);
            } else {
                toast.error(data.error || 'Kurs oluşturulamadı. Tekrar dene.');
            }
        } catch {
            toast.error('Sunucuya bağlanılamadı. İnternet bağlantını kontrol et.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <EditorFrame back={{ to: '/instructor/courses/list', label: 'Kurslarım' }} title="Yeni kurs" width="narrow">
            <form onSubmit={e => { e.preventDefault(); handleCreate(); }} className="max-w-[880px]">
                <span className="inline-flex items-center gap-2 h-7 pl-2.5 pr-3 rounded-full bg-[#9cf2e8]/45 text-[12.5px] font-bold text-[#00483f]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00897b]" />
                    Yeni kurs taslağı
                </span>
                <h1 className="mt-4 text-[32px] sm:text-[42px] leading-[1.05] font-extrabold tracking-[-0.035em] text-[#00201d] text-balance">
                    Yeni bir kurs başlatalım
                </h1>
                <p className="mt-3 text-[15.5px] sm:text-[16.5px] text-[#4a6360] leading-relaxed max-w-[62ch]">
                    Şimdilik iki temel bilgi yeterli: kursun adı ve konusu. Bölümler, dersler ve fiyatı
                    taslağı açınca istediğin gibi ekleyip değiştirebilirsin.
                </p>

                <section className="mt-10">
                    <div className="flex items-baseline justify-between gap-4">
                        <label htmlFor="course-title" className="text-[14px] font-bold text-[#00201d]">Kursunun adı ne?</label>
                        <span className="hidden sm:block text-[12.5px] text-[#6b827f]">Öğrencinin arayacağı kelimeleri kullan</span>
                    </div>
                    <input
                        id="course-title"
                        autoFocus
                        placeholder="Örnek: Sıfırdan ileri seviye React ve Next.js"
                        className={cn(
                            'mt-2.5 w-full h-[60px] px-5  bg-white text-[17px] sm:text-[18px] font-semibold text-[#00201d]',
                            'placeholder:font-normal placeholder:text-[#93a6a3] outline-none',
                            '',
                            'focus:ring-2 focus:ring-[#005c55]/55 transition-shadow duration-150'
                        )}
                        value={title}
                        maxLength={TITLE_MAX}
                        onChange={e => setTitle(e.target.value)}
                    />
                    <div className="mt-2 flex justify-between gap-4 px-1 text-[12.5px]">
                        <span className="text-[#6b827f]">Net ve ilgi çeken bir başlık seç; sonra da değiştirebilirsin.</span>
                        <span className={cn('tabular-nums font-bold', title.length >= TITLE_MAX ? 'text-[#b45309]' : 'text-[#6b827f]')}>
                            {title.length}/{TITLE_MAX}
                        </span>
                    </div>
                </section>

                <section className="mt-9">
                    <div className="flex items-baseline justify-between gap-4">
                        <h2 id="cat-label" className="text-[14px] font-bold text-[#00201d]">Hangi konuda?</h2>
                        <span className="hidden sm:block text-[12.5px] text-[#6b827f]">Katalogda bu başlığın altında listelenir</span>
                    </div>
                    <div role="radiogroup" aria-labelledby="cat-label" className="mt-3 flex flex-wrap gap-2.5">
                        {catsLoading && Array.from({ length: 8 }).map((_, i) => (
                            <span key={i} className="h-12 w-40  bg-[#e6e9e8] animate-pulse" />
                        ))}
                        {categories.map(cat => (
                            <Pick
                                key={cat.id}
                                on={String(cat.id) === categoryId}
                                onClick={() => { setCategoryId(String(cat.id)); setSubcategoryId(''); }}
                            >
                                {cat.name}
                            </Pick>
                        ))}
                    </div>
                </section>

                {needsSubcategory && (
                    <section className="mt-7 animate-in fade-in slide-in-from-top-1 duration-200">
                        <h2 id="sub-label" className="text-[14px] font-bold text-[#00201d]">
                            {selectedCategory?.name} içinde daha tam olarak?
                        </h2>
                        <div role="radiogroup" aria-labelledby="sub-label" className="mt-3 flex flex-wrap gap-2">
                            {subcategories.map(sub => (
                                <Pick key={sub.id} small on={String(sub.id) === subcategoryId} onClick={() => setSubcategoryId(String(sub.id))}>
                                    {sub.name}
                                </Pick>
                            ))}
                        </div>
                    </section>
                )}

                <div className="mt-12 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                    <button
                        type="submit"
                        disabled={loading || !canSubmit}
                        className={cn(
                            'inline-flex items-center justify-center gap-2 h-[52px] px-7  text-[15px] font-bold',
                            'transition-[background-color,color,transform,box-shadow] duration-150 active:scale-[0.98]',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/45 focus-visible:ring-offset-2',
                            canSubmit
                                ? 'bg-[#00201d] text-[#9cf2e8] hover:bg-[#03302b] shadow-[0_12px_28px_-14px_rgba(0,32,29,0.7)]'
                                : 'bg-[#e3e7e6] text-[#8a9b98] cursor-not-allowed'
                        )}
                    >
                        {loading
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Taslak açılıyor</>
                            : <>Taslağı oluştur <ArrowRight className="w-4 h-4" /></>}
                    </button>
                    <p className="text-[13px] font-medium text-[#5f7774]">{missing || 'Taslak yalnızca sana görünür.'}</p>
                    <Link
                        to="/instructor/courses/list"
                        className="sm:ml-auto text-[13.5px] font-bold text-[#5f7774] hover:text-[#00201d] transition-colors"
                    >
                        Daha sonra devam et
                    </Link>
                </div>
            </form>
        </EditorFrame>
    );
};

/** Konu seçeneği: çizgisiz beyaz kutu; seçilince koyu zemin, nane yazı. */
const Pick: React.FC<{ on: boolean; onClick: () => void; small?: boolean; children: React.ReactNode }> = ({ on, onClick, small, children }) => (
    <button
        type="button"
        role="radio"
        aria-checked={on}
        onClick={onClick}
        className={cn(
            ' font-bold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.97]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/45 focus-visible:ring-offset-2',
            small ? 'h-10 px-4 text-[13.5px]' : 'h-12 px-5 text-[14.5px]',
            on
                ? 'bg-[#00201d] text-[#9cf2e8] shadow-[0_10px_24px_-14px_rgba(0,32,29,0.8)]'
                : 'bg-white text-[#1d3a37]  hover:bg-[#ecfbf8] hover:text-[#00201d]'
        )}
    >
        {children}
    </button>
);

export default CreateCourseInitial;
