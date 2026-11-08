import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';
import { useCategoryNav } from '@/hooks/useCategoryNav';
import InstructorShell from '@/components/instructor/shell/InstructorShell';
import { btn, field, hint, label } from '@/components/instructor/shell/kit';

/**
 * Kurs taslağı oluşturma — kurs oluşturucunun ilk adımı.
 *
 * Panelin içinde açılıyor; menü yerinde kalıyor. Solda üç alan, sağda
 * yazdıkça dolan küçük bir kurs kartı önizlemesi: eğitmen başlığın
 * katalogda nasıl duracağını yazarken görüyor.
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
    const { data: navData } = useCategoryNav();
    const categories = (navData?.categories || []).filter(c => c.id != null);
    const selectedCategory = categories.find(c => String(c.id) === categoryId);
    const subcategories = (selectedCategory?.subcategories || []).filter(c => c.id != null);
    const selectedSub = subcategories.find(c => String(c.id) === subcategoryId);

    // Seçili kategoride alt dal yoksa zorunluluk aranmaz
    const needsSubcategory = subcategories.length > 0;
    const canSubmit = Boolean(title.trim() && categoryId && (!needsSubcategory || subcategoryId));

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
        <InstructorShell>
            <Link
                to="/instructor/courses/list"
                className="inline-flex items-center gap-1.5 -ml-1 px-1 h-7 rounded-md text-[13px] font-semibold text-[#4a6360] hover:text-[#00201d] transition-colors mb-2"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kurslarım
            </Link>
            <h1 className="text-[28px] sm:text-[32px] leading-[1.1] font-extrabold tracking-[-0.025em] text-[#00201d]">
                Yeni kurs
            </h1>
            <p className="mt-2 text-[14.5px] text-[#4a6360] max-w-xl">
                Önce başlık ve kategori. Bölümleri, dersleri ve fiyatı taslağı açtıktan sonra eklersin;
                hepsi sonradan değişebilir.
            </p>

            <div className="mt-8 grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
                <form
                    onSubmit={e => { e.preventDefault(); handleCreate(); }}
                    className="rounded-2xl bg-white ring-1 ring-[#dcebe8] shadow-[0_1px_2px_rgba(0,32,29,0.04)] p-5 sm:p-8 space-y-7"
                >
                    <div>
                        <label htmlFor="course-title" className={label}>Kursun adı</label>
                        <input
                            id="course-title"
                            autoFocus
                            placeholder="Örnek: Sıfırdan ileri seviye React"
                            className={cn(field, 'h-12 text-[16px] font-semibold')}
                            value={title}
                            maxLength={120}
                            onChange={e => setTitle(e.target.value)}
                        />
                        <p className={cn(hint, 'mt-1.5 flex justify-between gap-3')}>
                            <span>Öğrencinin aradığı kelimeleri kullan.</span>
                            <span className="tabular-nums shrink-0">{title.length}/120</span>
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="course-cat" className={label}>Kategori</label>
                            <select
                                id="course-cat"
                                value={categoryId}
                                onChange={e => { setCategoryId(e.target.value); setSubcategoryId(''); }}
                                className={cn(field, 'h-12')}
                            >
                                <option value="">Kategori seç</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="course-sub" className={label}>Alt kategori</label>
                            <select
                                id="course-sub"
                                value={subcategoryId}
                                onChange={e => setSubcategoryId(e.target.value)}
                                disabled={!categoryId || !needsSubcategory}
                                className={cn(field, 'h-12')}
                            >
                                <option value="">
                                    {!categoryId ? 'Önce kategori seç' : !needsSubcategory ? 'Bu kategoride alt dal yok' : 'Alt kategori seç'}
                                </option>
                                {subcategories.map(sub => (
                                    <option key={sub.id} value={String(sub.id)}>{sub.name}</option>
                                ))}
                            </select>
                            <p className={cn(hint, 'mt-1.5')}>Kursun doğru listede çıkması için gerekli.</p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-[#e8f2f0] flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
                        <p className="text-[13px] text-[#4a6360]">Taslak yalnızca sana görünür.</p>
                        <button type="submit" disabled={loading || !canSubmit} className={cn(btn.primary, btn.lg, 'min-w-[200px]')}>
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Taslak açılıyor</> : 'Taslağı oluştur'}
                        </button>
                    </div>
                </form>

                {/* Önizleme: katalogdaki kart */}
                <aside aria-label="Kart önizlemesi" className="lg:sticky lg:top-8">
                    <p className="text-[13px] font-bold text-[#4a6360] mb-2.5">Katalogda böyle görünecek</p>
                    <div className="rounded-2xl bg-white ring-1 ring-[#dcebe8] overflow-hidden shadow-[0_14px_30px_-18px_rgba(0,32,29,0.35)]">
                        <div className="aspect-video bg-[linear-gradient(135deg,#d9f3ee,#9cf2e8)] flex items-end p-4">
                            <span className="text-[12px] font-bold text-[#00483f]">Kapak görselini sonraki adımda eklersin</span>
                        </div>
                        <div className="p-4">
                            <p className={cn(
                                'text-[15.5px] font-extrabold leading-snug line-clamp-2 min-h-[2.6em]',
                                title.trim() ? 'text-[#00201d]' : 'text-[#9bb0ad]'
                            )}>
                                {title.trim() || 'Kursunun adı burada görünecek'}
                            </p>
                            <p className="mt-1.5 text-[12.5px] text-[#4a6360] truncate">
                                {[selectedCategory?.name, selectedSub?.name].filter(Boolean).join(' · ') || 'Kategori'}
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </InstructorShell>
    );
};

export default CreateCourseInitial;
