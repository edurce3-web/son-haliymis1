import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';
import { EditorFrame, NextSteps } from '../shell/EditorFrame';
import { btn, field, hint, label } from '../shell/kit';

/**
 * E-kitap taslağı oluşturma.
 *
 * Kurs oluşturma ekranıyla aynı düzen: panelden ayrı kendi sayfası, solda
 * iki soru, sağda yazdıkça dolan bir kapak önizlemesi.
 */
export function CreateBook() {
    const qc = useQueryClient();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [authorName, setAuthorName] = useState('');

    const createDbMutation = useMutation({
        mutationFn: async () => {
            const r = await fetch(`${API_BASE_URL}/instructor/books`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    title: title.trim(),
                    author_name: authorName.trim(),
                    subtitle: '',
                    description: '',
                    price: 0,
                    has_copyright: false,
                }),
            });
            if (!r.ok) {
                const errData = await r.json().catch(() => null);
                throw new Error(errData?.error || 'Kaydedilemedi');
            }
            return r.json();
        },
        onSuccess: data => {
            toast.success('Taslağın hazır. Şimdi ayrıntıları ekleyelim.');
            qc.invalidateQueries({ queryKey: ['instructor-books'] });
            navigate(`/instructor/books/edit/${data.book_id}`);
        },
        onError: (err: any) => toast.error(err.message || 'Taslak açılamadı. Tekrar dene.'),
    });

    const canSubmit = Boolean(title.trim() && authorName.trim());

    return (
        <EditorFrame back={{ to: '/instructor/books/manage', label: 'Kitaplarım' }} title="Yeni e-kitap">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-10 lg:gap-14 items-start">
                <form
                    onSubmit={e => { e.preventDefault(); if (canSubmit) createDbMutation.mutate(); }}
                    className="min-w-0 max-w-[680px]"
                >
                    <h1 className="text-[30px] sm:text-[38px] leading-[1.08] font-extrabold tracking-[-0.03em] text-[#00201d] text-balance">
                        Yeni bir e-kitap başlatalım
                    </h1>
                    <p className="mt-3 text-[15px] text-[#4a6360] leading-relaxed max-w-[52ch]">
                        Şimdilik kitabın adı ve yazarı yeter. Kapak, tanıtım, fiyat ve dosyayı taslağı açınca eklersin.
                    </p>

                    <section className="mt-10">
                        <label htmlFor="book-title" className="block text-[17px] font-extrabold tracking-tight text-[#00201d]">Kitabın adı ne?</label>
                        <p className={cn(hint, 'mt-1')}>Kapakta ve mağazada bu ad görünür; sonradan değişebilir.</p>
                        <input
                            id="book-title"
                            autoFocus
                            placeholder="Örnek: Modern JavaScript rehberi"
                            className={cn(field, 'mt-3 h-14 px-4 text-[18px] font-bold')}
                            value={title}
                            maxLength={120}
                            onChange={e => setTitle(e.target.value)}
                        />
                        <p className={cn(hint, 'mt-1.5 text-right tabular-nums')}>{title.length}/120</p>
                    </section>

                    <section className="mt-8">
                        <label htmlFor="book-author" className="block text-[17px] font-extrabold tracking-tight text-[#00201d]">Yazarı kim?</label>
                        <p className={cn(hint, 'mt-1')}>Kendi adın ya da kullandığın takma ad.</p>
                        <input
                            id="book-author"
                            placeholder="Ad Soyad"
                            className={cn(field, 'mt-3 h-12 px-4 text-[16px] font-semibold')}
                            value={authorName}
                            maxLength={80}
                            onChange={e => setAuthorName(e.target.value)}
                        />
                    </section>

                    <div className="mt-10 pt-6 border-t border-[#e6e8e8] flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                        <button type="submit" disabled={createDbMutation.isPending || !canSubmit} className={cn(btn.primary, 'h-12 px-6 text-[15px] min-w-[240px]')}>
                            {createDbMutation.isPending
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Taslak açılıyor</>
                                : <>Taslağı oluştur <ArrowRight className="w-4 h-4" /></>}
                        </button>
                        <p className="text-[13px] text-[#4a6360]">
                            {!title.trim() ? 'Önce kitabına bir ad ver' : !authorName.trim() ? 'Yazar adını yaz' : 'Taslak yalnızca sana görünür.'}
                        </p>
                    </div>
                </form>

                {/* Önizleme: kapağın sade hali, kitap sırtıyla */}
                <aside aria-label="Kapak önizlemesi" className="lg:sticky lg:top-24">
                    <p className="text-[13px] font-bold text-[#00201d] mb-3">Kapak taslağı</p>
                    <div className="relative w-full max-w-[240px] aspect-[3/4] rounded-r-xl rounded-l-[4px] overflow-hidden bg-[linear-gradient(160deg,#c9f6f0_0%,#9cf2e8_55%,#7fdccf_100%)] shadow-[0_22px_40px_-22px_rgba(0,32,29,0.6)]">
                        <span aria-hidden className="absolute inset-y-0 left-0 w-3 bg-[#00201d]/12" />
                        <span aria-hidden className="absolute inset-y-0 left-3 w-px bg-white/40" />
                        <div className="absolute inset-0 pl-8 pr-5 py-7 flex flex-col">
                            <p className={cn(
                                'text-[21px] leading-[1.12] font-extrabold tracking-[-0.015em] line-clamp-5 text-balance',
                                title.trim() ? 'text-[#00201d]' : 'text-[#00201d]/35'
                            )}>
                                {title.trim() || 'Kitabının adı'}
                            </p>
                            <span aria-hidden className="mt-4 h-[3px] w-10 rounded-full bg-[#00201d]/70" />
                            <p className={cn('mt-auto text-[13px] font-bold', authorName.trim() ? 'text-[#00483f]' : 'text-[#00483f]/40')}>
                                {authorName.trim() || 'Yazar adı'}
                            </p>
                        </div>
                    </div>
                    <NextSteps items={[
                        'Tanıtım yazısı ve anahtar kelimeler',
                        'Kategori, dil ve fiyat',
                        'Gerçek kapağı ve EPUB/PDF dosyasını yükle',
                        'Yayınla; mağazada satışa açılsın',
                    ]} />
                </aside>
            </div>
        </EditorFrame>
    );
}

export default CreateBook;
