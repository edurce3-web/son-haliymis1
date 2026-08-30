import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/api';

/**
 * E-kitap taslağı oluşturma.
 *
 * Kurs oluşturma ekranıyla aynı düzen: açık yeşil üst bant, tek kart, iki
 * alan. İkisi de aynı işi yapıyor; farklı görünmeleri için bir sebep yok.
 */
export function CreateBook() {
    const qc = useQueryClient();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [authorName, setAuthorName] = useState('');

    const token = () => localStorage.getItem('token');

    const fieldClass =
        'h-12 rounded-xl border border-slate-200 bg-white text-[15px] px-4 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-colors';

    const createDbMutation = useMutation({
        mutationFn: async () => {
            const r = await fetch(`${API_BASE_URL}/instructor/books`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token()}`
                },
                body: JSON.stringify({
                    title,
                    author_name: authorName,
                    subtitle: '',
                    description: '',
                    price: 0,
                    has_copyright: false
                })
            });
            if (!r.ok) {
                const errData = await r.json().catch(() => null);
                throw new Error(errData?.error || 'Kaydedilemedi');
            }
            return r.json();
        },
        onSuccess: (data) => {
            toast.success('Kitap taslağı oluşturuldu');
            qc.invalidateQueries({ queryKey: ['instructor-books'] });
            navigate(`/instructor/books/edit/${data.book_id}`);
        },
        onError: (err) => {
            toast.error(err.message || 'Bir hata oluştu');
        }
    });

    const canSubmit = Boolean(title.trim() && authorName.trim());

    return (
        <div className="min-h-screen bg-white">
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
                        Yeni e-kitap oluştur
                    </h1>
                    <p className="text-[15px] text-slate-600 mt-2.5 max-w-xl leading-relaxed">
                        Başlık ve yazar adını gir, taslağın hazır olsun. Kapak, açıklama,
                        fiyat ve dosya yüklemesi bir sonraki adımda.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-5 sm:px-8 max-w-3xl py-10">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-7">

                    <div className="space-y-2">
                        <Label htmlFor="book-title" className="text-[14px] font-semibold text-slate-800">
                            Kitap başlığı
                        </Label>
                        <Input
                            id="book-title"
                            placeholder="Örn: Modern JavaScript Geliştirme"
                            className={fieldClass}
                            value={title}
                            maxLength={120}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <p className="text-[12.5px] text-slate-500">
                            Başlığı sonradan değiştirebilirsin.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="book-author" className="text-[14px] font-semibold text-slate-800">
                            Yazar adı
                        </Label>
                        <Input
                            id="book-author"
                            placeholder="Kendi adın veya kullandığın takma ad"
                            className={fieldClass}
                            value={authorName}
                            maxLength={80}
                            onChange={(e) => setAuthorName(e.target.value)}
                        />
                        <p className="text-[12.5px] text-slate-500">
                            Kitap sayfasında bu isim görünür.
                        </p>
                    </div>

                    <div className="pt-1">
                        <Button
                            onClick={() => canSubmit && createDbMutation.mutate()}
                            disabled={createDbMutation.isPending || !canSubmit}
                            className="w-full sm:w-auto h-12 px-8 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold text-[15px] disabled:opacity-50"
                        >
                            {createDbMutation.isPending
                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Oluşturuluyor</>
                                : 'Taslağı oluştur'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateBook;
