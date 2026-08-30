import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useCategoryNav } from '@/hooks/useCategoryNav';

/**
 * Kurs taslağı oluşturma — kurs oluşturucunun ilk adımı.
 *
 * Sayfa bilinçle küçük tutuldu: üç alan ve bir düğme. Alan etiketlerindeki
 * simgeler kaldırıldı; her satıra bir simge koymak formu kalabalıklaştırıyor,
 * hiçbir bilgi eklemiyordu.
 *
 * Alt kategori artık zorunlu. Boş bırakılan kurslar kategori sayfalarının
 * alt dallarında hiç görünmüyor, eğitmen de kursunu neden bulamadığını
 * anlamıyordu.
 */
export const CreateCourseInitial: React.FC = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState<string>('');
    const [subcategoryId, setSubcategoryId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const apiBase = (window as any)?.__API_BASE__ || (import.meta as any)?.env?.VITE_API_URL || 'https://api.edurce.com';

    // Kategoriler veritabanından gelmeli: sabit listedeki id'ler gerçek
    // category_id değerleriyle örtüşmüyordu, kurslar yanlış kategoriye yazılıyordu.
    const { data: navData } = useCategoryNav();
    const categories = navData?.categories || [];
    const selectedCategoryObj = categories.find(c => String(c.id) === categoryId);
    const subcategories = selectedCategoryObj ? selectedCategoryObj.subcategories : [];

    // Seçili kategoride alt dal yoksa zorunluluk aranmaz
    const needsSubcategory = subcategories.length > 0;
    const canSubmit = Boolean(title.trim() && categoryId && (!needsSubcategory || subcategoryId));

    const fieldClass =
        'h-12 rounded-xl border border-slate-200 bg-white text-[15px] px-4 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-colors';

    const handleCreate = async () => {
        if (!canSubmit) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const res = await fetch(`${apiBase}/api/instructor/courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    title,
                    category_id: categoryId,
                    subcategory_id: subcategoryId || null,
                    status: 'draft'
                }),
                credentials: 'include'
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('Kurs taslağı oluşturuldu');
                navigate(`/instructor/courses/edit/${data.id}`);
            } else {
                toast.error(data.error || 'Kurs oluşturulamadı');
            }
        } catch (err) {
            console.error('Create error:', err);
            toast.error('Sunucuya bağlanılamadı');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Üst bant — platformun diğer sayfalarındaki açık yeşil zemin */}
            <div className="relative border-b border-brand-100 bg-gradient-to-br from-brand-50 via-brand-100/60 to-white">
                <div
                    aria-hidden
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, rgba(23,93,93,0.06) 1px, transparent 1px),'
                            + 'linear-gradient(to bottom, rgba(23,93,93,0.06) 1px, transparent 1px)',
                        backgroundSize: '34px 34px',
                    }}
                />
                <div className="container relative mx-auto px-5 sm:px-8 max-w-3xl py-8 lg:py-10">
                    <button
                        onClick={() => navigate('/instructor')}
                        className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-slate-500 hover:text-brand-800 transition-colors mb-5"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Eğitmen paneline dön
                    </button>

                    <h1 className="font-montserrat text-[28px] sm:text-[34px] font-extrabold text-slate-900 tracking-[-0.025em] leading-tight">
                        Yeni kurs oluştur
                    </h1>
                    <p className="text-[15px] text-slate-600 mt-2.5 max-w-xl leading-relaxed">
                        Başlık ve kategoriyi seç, taslağın hazır olsun. Bölümleri, dersleri
                        ve fiyatı bir sonraki adımda ekleyeceksin.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-5 sm:px-8 max-w-3xl py-10">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-7">

                    <div className="space-y-2">
                        <Label htmlFor="course-title" className="text-[14px] font-semibold text-slate-800">
                            Kurs başlığı
                        </Label>
                        <Input
                            id="course-title"
                            placeholder="Örn: Sıfırdan İleri Seviye React"
                            className={fieldClass}
                            value={title}
                            maxLength={120}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <p className="text-[12.5px] text-slate-500">
                            Başlığı sonradan değiştirebilirsin.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label className="text-[14px] font-semibold text-slate-800">Kategori</Label>
                            <Select
                                onValueChange={(v) => { setCategoryId(v); setSubcategoryId(''); }}
                                value={categoryId}
                            >
                                <SelectTrigger className={fieldClass}>
                                    <SelectValue placeholder="Kategori seç" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {categories.filter(c => c.id != null).map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()} className="py-2.5 cursor-pointer">
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[14px] font-semibold text-slate-800">Alt kategori</Label>
                            <Select
                                onValueChange={setSubcategoryId}
                                value={subcategoryId}
                                disabled={!categoryId || !needsSubcategory}
                            >
                                <SelectTrigger className={fieldClass}>
                                    <SelectValue
                                        placeholder={
                                            !categoryId ? 'Önce kategori seç'
                                                : !needsSubcategory ? 'Bu kategoride alt dal yok'
                                                    : 'Alt kategori seç'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {subcategories.filter(c => c.id != null).map((sub) => (
                                        <SelectItem key={sub.id} value={sub.id.toString()} className="py-2.5 cursor-pointer">
                                            {sub.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[12.5px] text-slate-500">
                                Kursun doğru listede çıkması için gerekli.
                            </p>
                        </div>
                    </div>

                    <div className="pt-1">
                        <Button
                            onClick={handleCreate}
                            disabled={loading || !canSubmit}
                            className="w-full sm:w-auto h-12 px-8 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold text-[15px] disabled:opacity-50"
                        >
                            {loading
                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Oluşturuluyor</>
                                : 'Taslağı oluştur'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateCourseInitial;
