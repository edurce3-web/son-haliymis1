import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, FileText, Image as ImageIcon, Loader2, Plus, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCategoryNav } from '@/hooks/useCategoryNav';
import { API_BASE_URL } from '@/lib/api';
import InstructorShell from '../shell/InstructorShell';
import { btn, field, hint, label, Loading, Tag } from '../shell/kit';

export function EditBook() {
    const { id } = useParams<{ id: string }>();
    const qc = useQueryClient();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    const token = () => localStorage.getItem('token');

    // ─── Kategoriler ───────────────────────────────────────────────────────────
    // Tek kaynak: /api/catalog/navigation. Ana kategoriler ve alt dalları tek
    // istekte gelir, ayrıca alt kategori için ikinci bir istek gerekmez.
    const { data: categoryNav } = useCategoryNav();
    const categories = categoryNav?.categories || [];

    // ─── Fetch Book Data ───────────────────────────────────────────────────────
    const { data: bookData, isLoading: bookLoading } = useQuery({
        queryKey: ['instructor-book', id],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/instructor/books/${id}`, {
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

    // Alt kategoriler seçili ana kategoriden türetilir — ek istek yok
    const subcategories = React.useMemo(
        () => categories.find(c => String(c.id) === String(formData.category_id))?.subcategories || [],
        [categories, formData.category_id]
    );

    // ─── Mutations ─────────────────────────────────────────────────────────────
    const updateDbMutation = useMutation({
        mutationFn: async () => {
            let parsedPrice = 0;
            if (formData.price && formData.price.trim() !== "") {
                const num = parseFloat(formData.price.replace(',', '.'));
                if (!isNaN(num)) parsedPrice = num;
            }

            const r = await fetch(`${API_BASE_URL}/instructor/books/${id}`, {
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
            const r = await fetch(`${API_BASE_URL}/instructor/upload-book-cover`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token()}` },
                body: fd
            });
            if (!r.ok) throw new Error('Kapak yüklenemedi');
            return r.json();
        },
        onSuccess: () => { toast.success('Kapak yüklendi'); }
    });

    const uploadFileMutation = useMutation({
        mutationFn: async (file: File) => {
            const fd = new FormData();
            fd.append('bookFile', file);
            fd.append('bookId', id!);
            const r = await fetch(`${API_BASE_URL}/instructor/upload-book-file`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token()}` },
                body: fd
            });
            if (!r.ok) throw new Error('Kitap dosyası yüklenemedi');
            return r.json();
        },
        onSuccess: () => { toast.success('Kitap dosyası yüklendi'); }
    });

    const publishMutation = useMutation({
        mutationFn: async () => {
            const r = await fetch(`${API_BASE_URL}/instructor/books/${id}/publish`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token()}` }
            });
            if (!r.ok) throw new Error('Yayınlanamadı');
            return r.json();
        },
        onSuccess: () => {
            toast.success('Kitabın yayında');
            qc.invalidateQueries({ queryKey: ['instructor-books'] });
            navigate('/instructor/books/manage');
        }
    });

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const handleNextStep = () => {
        if (step === 1) {
            if (!formData.title || !formData.author_name) return toast.error('Kitabın adı ve yazar adı boş olamaz');
            updateDbMutation.mutate();
        } else if (step === 2) {
            updateDbMutation.mutate();
        } else if (step === 3) {
            if (!coverPreview || (!bookFile && !book?.epub_file_path)) return toast.error('Devam etmek için kapak görselini ve kitap dosyasını seç');
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
            toast.error('Dosyalar yüklenemedi ya da kitap yayınlanamadı. Tekrar dene.');
        }
    };


    const addKeyword = () => {
        const val = keywordInput.trim();
        if (!val) return;
        if (keywordsList.length >= 7) return toast.error('En fazla 7 anahtar kelime ekleyebilirsin.');
        if (keywordsList.includes(val)) return toast.error('Bu kelime zaten ekli.');
        setKeywordsList([...keywordsList, val]);
        setKeywordInput('');
    };

    const STEPS = [
        { title: 'Ayrıntılar', desc: 'Okuyucunun dikkatini çekecek bir başlık ve kısa bir tanıtım yaz.' },
        { title: 'Kategori ve fiyat', desc: 'Mağazada nerede duracağını ve kaça satılacağını belirle.' },
        { title: 'Dosyalar', desc: 'Kapak görselini ve kitabın kendisini (EPUB ya da PDF) yükle.' },
        { title: 'Yayınla', desc: 'Son bir kez bak; her şey yerindeyse satışa aç.' },
    ];
    const busy = publishMutation.isPending || uploadCoverMutation.isPending || uploadFileMutation.isPending;
    const published = book?.status === 'published';
    const priceNum = parseFloat((formData.price || '0').replace(',', '.')) || 0;

    if (bookLoading) {
        return (
            <InstructorShell>
                <Loading label="Kitabın yükleniyor" />
            </InstructorShell>
        );
    }

    return (
        <InstructorShell>
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-7">
                <div className="min-w-0">
                    <Link
                        to="/instructor/books/manage"
                        className="inline-flex items-center gap-1.5 -ml-1 px-1 h-7 rounded-md text-[13px] font-semibold text-[#4a6360] hover:text-[#00201d] transition-colors mb-2"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Kitaplarım
                    </Link>
                    <div className="flex items-center gap-3 min-w-0">
                        <h1 className="text-[26px] sm:text-[30px] leading-[1.15] font-extrabold tracking-[-0.025em] text-[#00201d] truncate">
                            {formData.title.trim() || 'Yeni e-kitap'}
                        </h1>
                        <Tag tone={published ? 'live' : 'draft'} className="shrink-0">{published ? 'Yayında' : 'Taslak'}</Tag>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-6 lg:gap-8 items-start">
                {/* Adımlar */}
                <div className="lg:sticky lg:top-8 min-w-0">
                    <nav aria-label="Kitap adımları" className="relative flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
                        <span aria-hidden className="hidden lg:block absolute left-[23px] top-5 bottom-5 w-px bg-[#dcebe8]" />
                        {STEPS.map((s, idx) => {
                            const n = idx + 1;
                            const isActive = step === n;
                            const passed = step > n;
                            return (
                                <button
                                    key={s.title}
                                    type="button"
                                    // Yalnızca geçilmiş adımlara geri dönülebilir; ileri gitmek kaydetmeyi gerektiriyor
                                    onClick={() => { if (passed) setStep(n); }}
                                    disabled={!passed && !isActive}
                                    aria-current={isActive ? 'step' : undefined}
                                    className={cn(
                                        'relative shrink-0 lg:w-full flex items-center gap-3 pl-2.5 pr-3 h-11 rounded-xl text-left transition-colors duration-150',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/40 disabled:cursor-default',
                                        isActive ? 'bg-[#9cf2e8]/45 text-[#00201d]' : passed ? 'text-[#1d3a37] hover:bg-white' : 'text-[#6b827f]'
                                    )}
                                >
                                    <span className={cn(
                                        'relative z-[1] shrink-0 w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] font-bold tabular-nums',
                                        isActive ? 'bg-[#00201d] text-[#9cf2e8]' : passed ? 'bg-[#9cf2e8] text-[#00201d]' : 'bg-[#f6fbfa] text-[#6b827f] ring-1 ring-[#cfe3df]'
                                    )}>
                                        {passed ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : n}
                                    </span>
                                    <span className={cn('text-[14px] whitespace-nowrap', isActive ? 'font-bold' : 'font-semibold')}>{s.title}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <section className="min-w-0 rounded-2xl bg-white ring-1 ring-[#dcebe8] shadow-[0_1px_2px_rgba(0,32,29,0.04)] overflow-hidden">
                    <div className="px-5 sm:px-8 pt-6 pb-5 border-b border-[#e8f2f0]">
                        <div className="flex items-baseline justify-between gap-4">
                            <h2 className="text-[21px] font-extrabold tracking-[-0.015em] text-[#00201d]">{STEPS[step - 1].title}</h2>
                            <span className="shrink-0 text-[13px] font-bold tabular-nums text-[#4a6360]">{step} / {STEPS.length}</span>
                        </div>
                        <p className="text-[14px] text-[#4a6360] mt-1">{STEPS[step - 1].desc}</p>
                        <div className="mt-4 h-1.5 rounded-full bg-[#e3f6f2] overflow-hidden" aria-hidden>
                            <div className="h-full rounded-full bg-[#00201d] transition-[width] duration-300 ease-out" style={{ width: `${(step / STEPS.length) * 100}%` }} />
                        </div>
                    </div>

                    <div className="px-5 sm:px-8 py-7 animate-in fade-in duration-300" key={step}>
                        {/* 1: Ayrıntılar */}
                        {step === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="b-title" className={label}>Kitabın adı</label>
                                    <input id="b-title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Kapakta görünen ana isim" className={cn(field, 'h-11')} />
                                </div>
                                <div>
                                    <label htmlFor="b-sub" className={label}>Alt başlık <span className="font-medium text-[#5f7774]">(isteğe bağlı)</span></label>
                                    <input id="b-sub" value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                        placeholder="Kitabın ne vaat ettiği" className={cn(field, 'h-11')} />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="b-author" className={label}>Yazar adı</label>
                                    <input id="b-author" value={formData.author_name} onChange={e => setFormData({ ...formData, author_name: e.target.value })}
                                        placeholder="Kendi adın ya da takma adın" className={cn(field, 'h-11')} />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="b-desc" className={label}>Tanıtım yazısı</label>
                                    <textarea id="b-desc" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={6}
                                        placeholder="Arka kapak yazısı gibi düşün: okuyucu bu kitaptan ne alacak?" className={cn(field, 'py-3 resize-y leading-relaxed')} />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="b-kw" className={label}>Anahtar kelimeler <span className="font-medium text-[#5f7774] tabular-nums">({keywordsList.length}/7)</span></label>
                                    <div className="flex gap-2">
                                        <input
                                            id="b-kw"
                                            value={keywordInput}
                                            onChange={e => setKeywordInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                                            placeholder="Örnek: kişisel gelişim"
                                            className={cn(field, 'h-11')}
                                            disabled={keywordsList.length >= 7}
                                        />
                                        <button type="button" onClick={addKeyword} disabled={keywordsList.length >= 7} className={cn(btn.outline, 'h-11 px-4 text-[13.5px] shrink-0')}>
                                            <Plus className="w-4 h-4" /> Ekle
                                        </button>
                                    </div>
                                    {keywordsList.length > 0 && (
                                        <ul className="flex flex-wrap gap-2 mt-3">
                                            {keywordsList.map((kw, i) => (
                                                <li key={kw}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setKeywordsList(keywordsList.filter((_, idx) => idx !== i))}
                                                        aria-label={`${kw} kelimesini kaldır`}
                                                        className="inline-flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-full bg-[#e3f6f2] hover:bg-[#fff3f1] text-[13px] font-bold text-[#00201d] hover:text-[#b42318] transition-colors"
                                                    >
                                                        {kw} <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <p className={cn(hint, 'mt-2')}>Okuyucuların kitabını aramada bulmasını kolaylaştırır. Enter ile ekle.</p>
                                </div>
                            </div>
                        )}

                        {/* 2: Kategori, haklar, fiyat */}
                        {step === 2 && (
                            <div className="space-y-7">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label htmlFor="b-cat" className={label}>Kategori</label>
                                        <select id="b-cat" value={formData.category_id}
                                            onChange={e => setFormData({ ...formData, category_id: e.target.value, subcategory_id: '' })} className={cn(field, 'h-11')}>
                                            <option value="">Kategori seç</option>
                                            {categories.filter(c => c.id != null).map(c => <option key={c.slug} value={String(c.id)}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="b-subcat" className={label}>Alt kategori</label>
                                        <select id="b-subcat" value={formData.subcategory_id} disabled={!formData.category_id || subcategories.length === 0}
                                            onChange={e => setFormData({ ...formData, subcategory_id: e.target.value })} className={cn(field, 'h-11')}>
                                            <option value="">{!formData.category_id ? 'Önce kategori seç' : subcategories.length === 0 ? 'Alt dal yok' : 'Alt kategori seç'}</option>
                                            {subcategories.filter(c => c.id != null).map(c => <option key={c.slug} value={String(c.id)}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="b-lang" className={label}>Dil</label>
                                        <select id="b-lang" value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value })} className={cn(field, 'h-11')}>
                                            {['Türkçe', 'İngilizce', 'İspanyolca', 'Almanca'].map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <fieldset>
                                    <legend className={label}>Yayın hakları</legend>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {[
                                            { v: 'copyright', t: 'Telif hakkı bende', d: 'Kendi yazdığım kitap' },
                                            { v: 'public_domain', t: 'Kamu malı eser', d: 'Telif süresi dolmuş klasik bir eser' },
                                        ].map(o => {
                                            const on = formData.rights_type === o.v;
                                            return (
                                                <label
                                                    key={o.v}
                                                    className={cn(
                                                        'flex items-start gap-3 rounded-xl px-4 py-3.5 cursor-pointer transition-colors ring-1 ring-inset',
                                                        on ? 'bg-[#ecfbf8] ring-[#005c55]' : 'bg-white ring-[#d6e8e4] hover:ring-[#9cdcd3]'
                                                    )}
                                                >
                                                    <input type="radio" name="rights_type" value={o.v} checked={on}
                                                        onChange={e => setFormData({ ...formData, rights_type: e.target.value })}
                                                        className="mt-0.5 w-4 h-4 accent-[#005c55]" />
                                                    <span>
                                                        <span className="block text-[14px] font-bold text-[#00201d]">{o.t}</span>
                                                        <span className="block text-[12.5px] text-[#4a6360] mt-0.5">{o.d}</span>
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </fieldset>

                                <div>
                                    <label htmlFor="b-price" className={label}>Satış fiyatı</label>
                                    <div className="relative max-w-[220px]">
                                        <span aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-bold text-[#4a6360]">₺</span>
                                        <input id="b-price" type="number" inputMode="decimal" step="0.01" min="0" value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            className={cn(field, 'h-12 pl-10 text-[18px] font-extrabold tabular-nums')} />
                                    </div>
                                    <p className={cn(hint, 'mt-1.5')}>Ücretsiz vermek için 0 yaz.</p>
                                </div>
                            </div>
                        )}

                        {/* 3: Dosyalar */}
                        {step === 3 && (
                            <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-6">
                                <div>
                                    <p className={label}>Ön kapak</p>
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('cover-upload')?.click()}
                                        className="group relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#f4faf8] ring-1 ring-inset ring-[#cfe3df] hover:ring-[#5fb8ac] hover:bg-[#ecfbf8] transition-colors flex items-center justify-center"
                                    >
                                        {coverPreview ? (
                                            <>
                                                <img src={coverPreview} alt="Kapak önizlemesi" className="absolute inset-0 w-full h-full object-cover" />
                                                <span className="absolute inset-x-2 bottom-2 rounded-lg bg-white/90 py-1.5 text-[12.5px] font-bold text-[#00201d] opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Değiştir
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-center px-4">
                                                <ImageIcon className="w-7 h-7 mx-auto text-[#005c55]" />
                                                <span className="block mt-2 text-[14px] font-bold text-[#00201d]">Kapak seç</span>
                                                <span className="block mt-0.5 text-[12px] text-[#4a6360]">JPG ya da PNG, dik (3:4)</span>
                                            </span>
                                        )}
                                    </button>
                                    <input id="cover-upload" type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleCoverChange} />
                                </div>

                                <div className="flex flex-col">
                                    <p className={label}>Kitap dosyası</p>
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('book-upload')?.click()}
                                        className="flex-1 min-h-[180px] w-full rounded-xl bg-[#f4faf8] ring-1 ring-inset ring-[#cfe3df] hover:ring-[#5fb8ac] hover:bg-[#ecfbf8] transition-colors flex items-center justify-center px-6 text-center"
                                    >
                                        <span>
                                            {bookFile || book?.epub_file_path
                                                ? <FileText className="w-7 h-7 mx-auto text-[#005c55]" />
                                                : <Upload className="w-7 h-7 mx-auto text-[#005c55]" />}
                                            <span className="block mt-2 text-[14px] font-bold text-[#00201d] break-all">
                                                {bookFile ? bookFile.name : book?.epub_file_path ? 'Dosya yüklü' : 'EPUB ya da PDF seç'}
                                            </span>
                                            <span className="block mt-0.5 text-[12.5px] text-[#4a6360]">
                                                {bookFile
                                                    ? `${(bookFile.size / 1024 / 1024).toFixed(1).replace('.', ',')} MB · değiştirmek için tıkla`
                                                    : book?.epub_file_path ? 'Yenisiyle değiştirmek için tıkla' : 'Okuyucunun indireceği asıl içerik · en fazla 150 MB'}
                                            </span>
                                        </span>
                                    </button>
                                    <input id="book-upload" type="file" accept=".epub,.pdf" className="hidden" onChange={handleFileChange} />
                                </div>
                            </div>
                        )}

                        {/* 4: Yayınla — mağazadaki görünüm */}
                        {step === 4 && (
                            <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
                                <div className="w-[150px] shrink-0 aspect-[3/4] rounded-r-xl rounded-l-[4px] overflow-hidden bg-[#e3f6f2] shadow-[0_18px_34px_-18px_rgba(0,32,29,0.55)]">
                                    {coverPreview && <img src={coverPreview} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[20px] font-extrabold tracking-tight text-[#00201d] text-balance">{formData.title}</p>
                                    {formData.subtitle && <p className="text-[14px] text-[#1d3a37] mt-0.5">{formData.subtitle}</p>}
                                    <p className="text-[13.5px] font-semibold text-[#005c55] mt-1.5">{formData.author_name}</p>
                                    <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[13.5px] max-w-sm">
                                        <dt className="text-[#4a6360]">Fiyat</dt>
                                        <dd className="font-bold text-[#00201d] tabular-nums">{priceNum > 0 ? `₺${priceNum.toLocaleString('tr-TR')}` : 'Ücretsiz'}</dd>
                                        <dt className="text-[#4a6360]">Dil</dt>
                                        <dd className="font-bold text-[#00201d]">{formData.language}</dd>
                                        <dt className="text-[#4a6360]">Dosya</dt>
                                        <dd className="font-bold text-[#00201d] truncate">{bookFile ? bookFile.name : 'Yüklü'}</dd>
                                    </dl>
                                    <p className="mt-4 text-[13.5px] text-[#4a6360] max-w-md">
                                        Yayınladığında kitabın profilinde ve mağazada okuyuculara açılır.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Alt düğmeler */}
                        <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-10 pt-6 border-t border-[#e8f2f0]">
                            {step > 1 ? (
                                <button type="button" onClick={() => setStep(s => s - 1)} disabled={busy} className={cn(btn.ghost, btn.lg)}>
                                    <ArrowLeft className="w-4 h-4" /> Önceki adım
                                </button>
                            ) : <span />}

                            {step < 4 ? (
                                <button type="button" onClick={handleNextStep} disabled={updateDbMutation.isPending} className={cn(btn.primary, btn.lg, 'min-w-[180px]')}>
                                    {updateDbMutation.isPending
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor</>
                                        : <>Kaydet ve ilerle <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            ) : (
                                <button type="button" onClick={startUploads} disabled={busy} className={cn(btn.dark, btn.lg, 'min-w-[200px]')}>
                                    {busy
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor</>
                                        : <>Yayınla ve satışa aç <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </InstructorShell>
    );
}
