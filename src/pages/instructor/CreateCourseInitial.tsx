import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';
import { useCategoryNav } from '@/hooks/useCategoryNav';
import { EditorFrame, NextSteps, Chip } from '@/components/instructor/shell/EditorFrame';
import { btn, field, hint } from '@/components/instructor/shell/kit';

/**
 * Kurs taslağı oluşturma — kurs oluşturucunun ilk adımı.
 *
 * Panelden ayrı, kendi sayfası. Solda iki soru (ad ve konu), sağda yazdıkça
 * dolan katalog kartı ve sonra gelecek adımlar. Kategoriler açılır liste
 * yerine çip: hepsi bir bakışta görünüyor, tek tıkla seçiliyor.
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
    const selectedSub = subcategories.find(c => String(c.id) === subcategoryId);

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
        <EditorFrame back={{ to: '/instructor/courses/list', label: 'Kurslarım' }} title="Yeni kurs">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-10 lg:gap-14 items-start">
                <form onSubmit={e => { e.preventDefault(); handleCreate(); }} className="min-w-0 max-w-[680px]">
                    <h1 className="text-[30px] sm:text-[38px] leading-[1.08] font-extrabold tracking-[-0.03em] text-[#00201d] text-balance">
                        Yeni bir kurs başlatalım
                    </h1>
                    <p className="mt-3 text-[15px] text-[#4a6360] leading-relaxed max-w-[52ch]">
                        Şimdilik iki şey yeter: kursun adı ve konusu. Bölümler, dersler ve fiyat taslağı açınca;
                        hepsi sonradan değişebilir.
                    </p>

                    <section className="mt-10">
                        <label htmlFor="course-title" className="block text-[17px] font-extrabold tracking-tight text-[#00201d]">
                            Kursunun adı ne?
                        </label>
                        <p className={cn(hint, 'mt-1')}>Öğrencinin arama kutusuna yazacağı kelimeleri kullan.</p>
                        <input
                            id="course-title"
                            autoFocus
                            placeholder="Örnek: Sıfırdan ileri seviye React"
                            className={cn(field, 'mt-3 h-14 px-4 text-[18px] font-bold')}
                            value={title}
                            maxLength={120}
                            onChange={e => setTitle(e.target.value)}
                        />
                        <p className={cn(hint, 'mt-1.5 text-right tabular-nums')}>{title.length}/120</p>
                    </section>

                    <section className="mt-8">
                        <h2 id="cat-label" className="text-[17px] font-extrabold tracking-tight text-[#00201d]">Hangi konuda?</h2>
                        <p className={cn(hint, 'mt-1')}>Kursun katalogda bu başlığın altında listelenir.</p>
                        <div role="radiogroup" aria-labelledby="cat-label" className="mt-3 flex flex-wrap gap-2">
                            {catsLoading && Array.from({ length: 6 }).map((_, i) => (
                                <span key={i} className="h-10 w-28 rounded-full bg-[#e3f1ee] animate-pulse" />
                            ))}
                            {categories.map(cat => (
                                <Chip
                                    key={cat.id}
                                    on={String(cat.id) === categoryId}
                                    onClick={() => { setCategoryId(String(cat.id)); setSubcategoryId(''); }}
                                >
                                    {cat.name}
                                </Chip>
                            ))}
                        </div>
                    </section>

                    {needsSubcategory && (
                        <section className="mt-7 animate-in fade-in slide-in-from-top-1 duration-200">
                            <h2 id="sub-label" className="text-[15px] font-extrabold tracking-tight text-[#00201d]">
                                {selectedCategory?.name} içinde daha tam olarak?
                            </h2>
                            <div role="radiogroup" aria-labelledby="sub-label" className="mt-3 flex flex-wrap gap-2">
                                {subcategories.map(sub => (
                                    <Chip key={sub.id} on={String(sub.id) === subcategoryId} onClick={() => setSubcategoryId(String(sub.id))}>
                                        {sub.name}
                                    </Chip>
                                ))}
                            </div>
                        </section>
                    )}

                    <div className="mt-10 pt-6 border-t border-[#e3efec] flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                        <button type="submit" disabled={loading || !canSubmit} className={cn(btn.primary, 'h-12 px-6 text-[15px] min-w-[240px]')}>
                            {loading
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Taslak açılıyor</>
                                : <>Taslağı oluştur <ArrowRight className="w-4 h-4" /></>}
                        </button>
                        <p className="text-[13px] text-[#4a6360]">{missing || 'Taslak yalnızca sana görünür.'}</p>
                    </div>
                </form>

                <aside aria-label="Önizleme" className="lg:sticky lg:top-24">
                    <p className="text-[13px] font-bold text-[#00201d] mb-3">Katalogdaki kartın</p>
                    <div className="rounded-2xl bg-white ring-1 ring-[#dcebe8] overflow-hidden shadow-[0_18px_36px_-22px_rgba(0,32,29,0.45)]">
                        <div className="relative aspect-video bg-[linear-gradient(135deg,#e3f6f2_0%,#9cf2e8_100%)]">
                            <span className="absolute left-4 bottom-3 text-[12px] font-semibold text-[#00483f]">Kapak görseli sonraki adımda</span>
                        </div>
                        <div className="p-4">
                            <p className={cn(
                                'text-[15.5px] font-extrabold leading-snug line-clamp-2 min-h-[2.6em]',
                                title.trim() ? 'text-[#00201d]' : 'text-[#9bb0ad]'
                            )}>
                                {title.trim() || 'Kursunun adı burada görünecek'}
                            </p>
                            <p className="mt-1.5 text-[12.5px] text-[#4a6360] truncate">
                                {[selectedCategory?.name, selectedSub?.name].filter(Boolean).join(' · ') || 'Konu'}
                            </p>
                        </div>
                    </div>
                    <NextSteps items={[
                        'Bölümleri ve dersleri ekle, videolarını yükle',
                        'Kapak görseli ve kısa tanıtım yaz',
                        'Fiyatını belirle',
                        'İncelemeye gönder; onaylanınca yayında',
                    ]} />
                </aside>
            </div>
        </EditorFrame>
    );
};

export default CreateCourseInitial;
