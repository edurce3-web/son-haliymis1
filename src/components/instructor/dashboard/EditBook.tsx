import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck, DollarSign, ChevronRight, CheckCircle2, FileText, Image as ImageIcon, ArrowLeft, Loader2, Upload, Languages, Tags, Layers, TrendingUp, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';

export function EditBook() {
    const { id } = useParams<{ id: string }>();
    const qc = useQueryClient();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    const token = () => localStorage.getItem('token');

    // ─── Fetch Categories ──────────────────────────────────────────────────────
    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/categories').then(r => r.json()).then(data => {
            setCategories(Array.isArray(data) ? data.filter((c: any) => !c.parent_category_id) : []);
        }).catch(console.error);
    }, []);

    // ─── Fetch Book Data ───────────────────────────────────────────────────────
    const { data: bookData, isLoading: bookLoading } = useQuery({
        queryKey: ['instructor-book', id],
        queryFn: async () => {
            const r = await fetch(`/api/instructor/books/${id}`, {
                headers: { Authorization: `Bearer ${token()}` }
            });
            if (!r.ok) throw new Error('Kitap bulunamadı');
            return r.json();
        }
    });

    const book = bookData?.book;

    // Form States
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        author_name: '',
        description: '',
        category_id: '',
        subcategory_id: '',
        language: 'Türkçe',
        rights_type: 'copyright',
        price: '0'
    });

    // Keyword States
    const [keywordInput, setKeywordInput] = useState('');
    const [keywordsList, setKeywordsList] = useState<string[]>([]);

    // File States
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [bookFile, setBookFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);

    // Sync fetched data with state
    useEffect(() => {
        if (book) {
            setFormData({
                title: book.title || '',
                subtitle: book.subtitle || '',
                author_name: book.author_name || '',
                description: book.description || '',
                category_id: book.category_id ? book.category_id.toString() : '',
                subcategory_id: book.subcategory_id ? book.subcategory_id.toString() : '',
                language: book.language || 'Türkçe',
                rights_type: book.rights_type || 'copyright',
                price: book.price?.toString() || '0'
            });
            if (book.keywords) {
                setKeywordsList(book.keywords.split(',').map((k: string) => k.trim()).filter(Boolean));
            }
            if (book.cover_image_path) setCoverPreview(book.cover_image_path);
        }
    }, [book]);

    // Fetch Subcategories when Category changes
    useEffect(() => {
        if (!formData.category_id) {
            setSubcategories([]);
            return;
        }
        fetch(`/api/categories/${formData.category_id}/subcategories`).then(r => r.json()).then(data => {
            setSubcategories(Array.isArray(data) ? data : []);
        }).catch(console.error);
    }, [formData.category_id]);

    // ─── Mutations ─────────────────────────────────────────────────────────────
    const updateDbMutation = useMutation({
        mutationFn: async () => {
            let parsedPrice = 0;
            if (formData.price && formData.price.trim() !== "") {
                const num = parseFloat(formData.price.replace(',', '.'));
                if (!isNaN(num)) parsedPrice = num;
            }

            const r = await fetch(`/api/instructor/books/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token()}`
                },
                body: JSON.stringify({
                    title: formData.title,
                    subtitle: formData.subtitle,
                    author_name: formData.author_name,
                    description: formData.description,
                    keywords: keywordsList.join(','),
                    category_id: formData.category_id ? parseInt(formData.category_id) : null,
                    subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : null,
                    language: formData.language,
                    rights_type: formData.rights_type,
                    price: parsedPrice
                })
            });
            if (!r.ok) {
                const errData = await r.json().catch(() => null);
                console.error("Backend Error:", errData);
                throw new Error(errData?.error || `Sunucu Hatası (${r.status})`);
            }
            return r.json();
        },
        onSuccess: () => {
            toast.success('Bilgiler kaydedildi');
            setStep(s => s + 1);
        },
        onError: (err) => {
            toast.error(err.message || 'Bir hata oluştu');
        }
    });

    const uploadCoverMutation = useMutation({
        mutationFn: async (file: File) => {
            const fd = new FormData();
            fd.append('cover', file);
            fd.append('bookId', id!);
            const r = await fetch(`${API_BASE_URL}/instructor/upload-book-cover', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token()}` },
                body: fd
            });
            if (!r.ok) throw new Error('Kapak yüklenemedi');
            return r.json();
        },
        onSuccess: () => { toast.success('Kapak resmi yüklendi'); }
    });

    const uploadFileMutation = useMutation({
        mutationFn: async (file: File) => {
            const fd = new FormData();
            fd.append('bookFile', file);
            fd.append('bookId', id!);
            const r = await fetch(`${API_BASE_URL}/instructor/upload-book-file', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token()}` },
                body: fd
            });
            if (!r.ok) throw new Error('Kitap dosyası yüklenemedi');
            return r.json();
        },
        onSuccess: () => { toast.success('Kitap EPUB/PDF dosyası yüklendi'); }
    });

    const publishMutation = useMutation({
        mutationFn: async () => {
            const r = await fetch(`/api/instructor/books/${id}/publish`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token()}` }
            });
            if (!r.ok) throw new Error('Yayınlanamadı');
            return r.json();
        },
        onSuccess: () => {
            toast.success('Kitabınız başarıyla yayınlandı!');
            qc.invalidateQueries({ queryKey: ['instructor-books'] });
            navigate('/instructor/books/manage');
        }
    });

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const handleNextStep = () => {
        if (step === 1) {
            if (!formData.title || !formData.author_name) return toast.error('Başlık ve Yazar Adı zorunludur');
            updateDbMutation.mutate();
        } else if (step === 2) {
            updateDbMutation.mutate();
        } else if (step === 3) {
            if (!coverPreview || (!bookFile && !book?.epub_file_path)) return toast.error('Lütfen hem kapak resmini hem de kitap dosyasını yükleyin');
            setStep(4);
        }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setBookFile(e.target.files[0]);
        }
    };

    const startUploads = async () => {
        try {
            if (coverFile) await uploadCoverMutation.mutateAsync(coverFile);
            if (bookFile) await uploadFileMutation.mutateAsync(bookFile);
            publishMutation.mutate();
        } catch (e) {
            toast.error('Dosyalar yüklenirken veya yayınlanırken bir hata oluştu.');
        }
    };


    // ─── Internal Components ──────────────────────────────────────────────────
    const Stepper = () => {
        const steps = ['Detaylar', 'Kategori & Haklar', 'Dosyalar', 'Yayınla'];
        return (
            <div className="flex items-center justify-between mt-4 mb-10 max-w-2xl mx-auto">
                {steps.map((label, idx) => (
                    <div key={label} className="flex items-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm",
                                step > idx + 1 ? "bg-emerald-500 text-white" : step === idx + 1 ? "bg-indigo-600 text-white ring-4 ring-indigo-100" : "bg-white border-2 border-slate-200 text-slate-400"
                            )}>
                                {step > idx + 1 ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                            </div>
                            <span className={cn("text-xs font-bold whitespace-nowrap", step >= idx + 1 ? "text-indigo-900" : "text-slate-400")}>{label}</span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={cn("w-12 md:w-20 h-1 mx-2 md:mx-4 rounded-full transition-all", step > idx + 1 ? "bg-emerald-500" : "bg-slate-200")} />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // ─── Render View ──────────────────────────────────────────
    if (bookLoading) return <div className="flex items-center justify-center py-40"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-50/50 py-10 px-4">
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => navigate('/instructor/dashboard')} className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> İçerik Paneline Dön
                </button>
                <Badge variant="outline" className="font-bold border-indigo-200 bg-indigo-50 text-indigo-700">Taslak ID: #{id}</Badge>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8 md:p-12 overflow-hidden relative">
                <Stepper />

                <div className="relative z-10">
                    {/* STEP 1: Details */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                            <div className="text-center mb-10">
                                <h2 className="text-2xl font-black text-slate-900">Kitap Detayları</h2>
                                <p className="text-slate-500 font-medium mt-2">Okuyucularınızın dikkatini çekecek bir başlık ve özet yazın.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700">Kitap Adı <span className="text-rose-500">*</span></Label>
                                    <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Kitabın kapakta görünen ana ismi" className="h-14 rounded-xl border-slate-200 font-medium" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700">Alt Başlık (İsteğe Bağlı)</Label>
                                    <Input value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} placeholder="Kitabın ne vaat ettiğini açıklar" className="h-14 rounded-xl border-slate-200 font-medium" />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-sm font-bold text-slate-700">Yazar Adı <span className="text-rose-500">*</span></Label>
                                    <Input value={formData.author_name} onChange={e => setFormData({ ...formData, author_name: e.target.value })} placeholder="Kendi adınız veya mahlasınız" className="h-14 rounded-xl border-slate-200 font-medium" />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-sm font-bold text-slate-700">Kitap Açıklaması / Arka Kapak Yazısı</Label>
                                    <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Kurguysa gizemli bir özet, Kurgu dışıysa neler öğrenecekleri..." className="h-32 rounded-xl border-slate-200 resize-none p-4 font-medium" />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Tags className="w-4 h-4 text-slate-400" />
                                        Anahtar Kelimeler ({keywordsList.length}/7)
                                    </Label>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={keywordInput}
                                                onChange={e => setKeywordInput(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const val = keywordInput.trim();
                                                        if (val && keywordsList.length < 7 && !keywordsList.includes(val)) {
                                                            setKeywordsList([...keywordsList, val]);
                                                            setKeywordInput('');
                                                        } else if (keywordsList.length >= 7) {
                                                            toast.error('En fazla 7 anahtar kelime ekleyebilirsiniz.');
                                                        } else if (keywordsList.includes(val)) {
                                                            toast.error('Bu kelime zaten ekli.');
                                                        }
                                                    }
                                                }}
                                                placeholder="Kelimeyi yazın ve Enter'a basın (Örn: kişisel gelişim)"
                                                className="h-14 rounded-xl border-slate-200 font-medium flex-1"
                                                disabled={keywordsList.length >= 7}
                                            />
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    const val = keywordInput.trim();
                                                    if (val && keywordsList.length < 7 && !keywordsList.includes(val)) {
                                                        setKeywordsList([...keywordsList, val]);
                                                        setKeywordInput('');
                                                    } else if (keywordsList.length >= 7) {
                                                        toast.error('En fazla 7 anahtar kelime ekleyebilirsiniz.');
                                                    } else if (keywordsList.includes(val)) {
                                                        toast.error('Bu kelime zaten ekli.');
                                                    }
                                                }}
                                                className="h-14 px-6 rounded-xl font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-0"
                                                disabled={keywordsList.length >= 7}
                                            >
                                                Ekle
                                            </Button>
                                        </div>
                                        {keywordsList.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {keywordsList.map((kw, i) => (
                                                    <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1.5 rounded-lg border-0 shadow-sm">
                                                        {kw}
                                                        <button
                                                            type="button"
                                                            onClick={() => setKeywordsList(keywordsList.filter((_, idx) => idx !== i))}
                                                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full p-0.5 transition-colors"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs font-medium text-slate-500 mt-2">Okuyucuların kitabınızı daha kolay bulması için ilgili kelimeleri ekleyin.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Categories, Rights & Pricing */}
                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                            <div className="text-center mb-10">
                                <h2 className="text-2xl font-black text-slate-900">Kategori, Haklar & Fiyatlandırma</h2>
                                <p className="text-slate-500 font-medium mt-2">Mağazada nerede duracağını ve nasıl satılacağını belirleyin.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Categories */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-indigo-500" /> Ana Kategori
                                    </Label>
                                    <Select onValueChange={v => setFormData({ ...formData, category_id: v })} value={formData.category_id}>
                                        <SelectTrigger className="h-14 rounded-xl bg-slate-50 border-0 font-bold px-4">
                                            <SelectValue placeholder="Kategori Seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.category_id} value={c.category_id.toString()} className="font-bold py-3">{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-indigo-500" /> Alt Kategori
                                    </Label>
                                    <Select onValueChange={v => setFormData({ ...formData, subcategory_id: v })} value={formData.subcategory_id} disabled={!formData.category_id || subcategories.length === 0}>
                                        <SelectTrigger className="h-14 rounded-xl bg-slate-50 border-0 font-bold px-4">
                                            <SelectValue placeholder="Alt Kategori Seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subcategories.map((c) => (
                                                <SelectItem key={c.category_id} value={c.category_id.toString()} className="font-bold py-3">{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Language */}
                                <div className="space-y-3 md:col-span-2">
                                    <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Languages className="w-4 h-4 text-indigo-500" /> Dil
                                    </Label>
                                    <Select onValueChange={v => setFormData({ ...formData, language: v })} value={formData.language}>
                                        <SelectTrigger className="h-14 rounded-xl bg-slate-50 border-0 font-bold px-4">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Türkçe" className="font-bold py-3">Türkçe</SelectItem>
                                            <SelectItem value="İngilizce" className="font-bold py-3">İngilizce</SelectItem>
                                            <SelectItem value="İspanyolca" className="font-bold py-3">İspanyolca</SelectItem>
                                            <SelectItem value="Almanca" className="font-bold py-3">Almanca</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="md:col-span-2 border-t border-slate-100 pt-6"></div>

                                {/* Rights */}
                                <div className="space-y-3 md:col-span-2">
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-4">
                                        <ShieldCheck className="w-8 h-8 text-amber-500 shrink-0 mt-1" />
                                        <div className="w-full">
                                            <h4 className="font-bold text-amber-900 mb-4">Yayın Hakları Beyanı</h4>

                                            <div className="flex flex-col gap-4">
                                                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/50 transition-colors border border-transparent hover:border-amber-100">
                                                    <input
                                                        type="radio"
                                                        name="rights_type"
                                                        value="copyright"
                                                        checked={formData.rights_type === 'copyright'}
                                                        onChange={(e) => setFormData({ ...formData, rights_type: e.target.value })}
                                                        className="w-5 h-5 text-amber-500 border-amber-300 focus:ring-amber-500"
                                                    />
                                                    <span className="font-bold text-amber-900 text-sm">Telif haklarına sahibim (Kendi kitabım)</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/50 transition-colors border border-transparent hover:border-amber-100">
                                                    <input
                                                        type="radio"
                                                        name="rights_type"
                                                        value="public_domain"
                                                        checked={formData.rights_type === 'public_domain'}
                                                        onChange={(e) => setFormData({ ...formData, rights_type: e.target.value })}
                                                        className="w-5 h-5 text-amber-500 border-amber-300 focus:ring-amber-500"
                                                    />
                                                    <span className="font-bold text-amber-900 text-sm">Bu bir kamu malı eserdir (Klasik bir eser vb.)</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Prcing */}
                                <div className="space-y-3 md:col-span-2">
                                    <Label className="text-sm font-bold text-slate-700">Satış Fiyatı (TL)</Label>
                                    <div className="relative max-w-sm">
                                        <DollarSign className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <Input type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="h-16 pl-14 text-xl font-black rounded-2xl border-2 border-slate-200 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20" />
                                    </div>
                                    <p className="text-xs font-medium text-slate-500">Ücretsiz yapmak için 0 girebilirsiniz.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: File Uploads */}
                    {step === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                            <div className="text-center mb-10">
                                <h2 className="text-2xl font-black text-slate-900">Dosya Yükleme</h2>
                                <p className="text-slate-500 font-medium mt-2">Kapak tasarımınızı ve kitabın içeriğini (EPUB/PDF) yükleyin.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Cover Upload */}
                                <div className="space-y-4">
                                    <Label className="text-sm font-bold text-slate-700">Ön Kapak Görseli (JPG/PNG)</Label>
                                    <div className="relative border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden group hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 transition-colors aspect-[3/4] flex items-center justify-center cursor-pointer" onClick={() => document.getElementById('cover-upload')?.click()}>
                                        {coverPreview ? (
                                            <img src={coverPreview} alt="Kapak Önizleme" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center p-6 flex flex-col items-center">
                                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    <ImageIcon className="w-8 h-8 text-indigo-400" />
                                                </div>
                                                <h4 className="font-bold text-slate-700 mb-1">Görsel Seç</h4>
                                                <p className="text-xs text-slate-500 font-medium">Tıklayın veya sürükleyin</p>
                                            </div>
                                        )}
                                        <input id="cover-upload" type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleCoverChange} />
                                    </div>
                                </div>

                                {/* EPUB Upload */}
                                <div className="space-y-4 flex flex-col">
                                    <Label className="text-sm font-bold text-slate-700">Kitap Dosyası (EPUB / PDF)</Label>
                                    <div className="flex-1 relative border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden group hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 transition-colors flex items-center justify-center cursor-pointer" onClick={() => document.getElementById('book-upload')?.click()}>
                                        <div className="text-center p-6 flex flex-col items-center">
                                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                {bookFile || book?.epub_file_path ? <FileText className="w-8 h-8 text-emerald-500" /> : <Upload className="w-8 h-8 text-indigo-400" />}
                                            </div>
                                            <h4 className="font-bold text-slate-700 mb-1">{bookFile ? 'Seçildi!' : book?.epub_file_path ? 'Dosya Zaten Yüklü' : 'Dosya Seç'}</h4>
                                            <p className="text-xs text-slate-500 font-medium max-w-[200px] mb-2">{bookFile ? bookFile.name : book?.epub_file_path ? 'Yenisiyle değiştirmek için tıklayın' : 'Okuyucuların indireceği asıl içerik dosyası.'}</p>
                                            {bookFile && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">{(bookFile.size / 1024 / 1024).toFixed(2)} MB</Badge>}
                                        </div>
                                        <input id="book-upload" type="file" accept=".epub,.pdf" className="hidden" onChange={handleFileChange} />
                                    </div>
                                    <p className="text-xs font-medium text-slate-400 pt-2 text-center">Maksimum dosya boyutu: 150MB</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Publish Summary */}
                    {step === 4 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 text-center py-10">
                            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></span>
                                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900">Harika! Her şey hazır.</h2>
                            <p className="text-slate-500 font-medium max-w-md mx-auto">
                                Kitabınızın dosyaları ve ayarları onaylandı. Yayınlandığında profilinizde ve mağazada okuyucularınızın erişimine açılacaktır.
                            </p>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-100">
                        {step > 1 && step < 4 ? (
                            <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 h-12 px-6 rounded-xl">
                                Geri Dön
                            </Button>
                        ) : <div></div>}

                        {step < 4 ? (
                            <Button onClick={handleNextStep} disabled={updateDbMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg h-12 px-8 rounded-xl font-bold ml-auto transition-transform active:scale-95">
                                {updateDbMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Kaydet ve İlerle <ChevronRight className="w-4 h-4 ml-2 inline" /></span>}
                            </Button>
                        ) : (
                            <Button onClick={startUploads} disabled={publishMutation.isPending || uploadCoverMutation.isPending || uploadFileMutation.isPending} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 h-14 px-10 rounded-2xl font-black ml-auto text-lg transition-transform active:scale-95">
                                {publishMutation.isPending || uploadCoverMutation.isPending || uploadFileMutation.isPending ? (
                                    <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> İşleniyor...</>
                                ) : (
                                    <>Yayınla & Satışa Başla <CheckCircle2 className="w-5 h-5 ml-2" /></>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}
