import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';
import InstructorShell from '../shell/InstructorShell';
import { btn, field, hint, label } from '../shell/kit';

/**
 * E-kitap taslağı oluşturma.
 *
 * Kurs oluşturma ekranıyla aynı düzen: panelin içinde, solda iki alan,
 * sağda yazdıkça dolan bir kapak önizlemesi.
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
        <InstructorShell>
            <Link
                to="/instructor/books/manage"
                className="inline-flex items-center gap-1.5 -ml-1 px-1 h-7 rounded-md text-[13px] font-semibold text-[#4a6360] hover:text-[#00201d] transition-colors mb-2"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kitaplarım
            </Link>
            <h1 className="text-[28px] sm:text-[32px] leading-[1.1] font-extrabold tracking-[-0.025em] text-[#00201d]">
                Yeni e-kitap
            </h1>
            <p className="mt-2 text-[14.5px] text-[#4a6360] max-w-xl">
                Önce başlık ve yazar adı. Kapak, açıklama, fiyat ve dosyayı taslağı açtıktan sonra eklersin.
            </p>

            <div className="mt-8 grid lg:grid-cols-[minmax(0,1fr)_260px] gap-6 items-start">
                <form
                    onSubmit={e => { e.preventDefault(); if (canSubmit) createDbMutation.mutate(); }}
                    className="rounded-2xl bg-white ring-1 ring-[#dcebe8] shadow-[0_1px_2px_rgba(0,32,29,0.04)] p-5 sm:p-8 space-y-7"
                >
                    <div>
                        <label htmlFor="book-title" className={label}>Kitabın adı</label>
                        <input
                            id="book-title"
                            autoFocus
                            placeholder="Örnek: Modern JavaScript rehberi"
                            className={cn(field, 'h-12 text-[16px] font-semibold')}
                            value={title}
                            maxLength={120}
                            onChange={e => setTitle(e.target.value)}
                        />
                        <p className={cn(hint, 'mt-1.5 flex justify-between gap-3')}>
                            <span>Sonradan değiştirebilirsin.</span>
                            <span className="tabular-nums shrink-0">{title.length}/120</span>
                        </p>
                    </div>

                    <div>
                        <label htmlFor="book-author" className={label}>Yazar adı</label>
                        <input
                            id="book-author"
                            placeholder="Kendi adın ya da kullandığın takma ad"
                            className={cn(field, 'h-12')}
                            value={authorName}
                            maxLength={80}
                            onChange={e => setAuthorName(e.target.value)}
                        />
                        <p className={cn(hint, 'mt-1.5')}>Kitap sayfasında bu isim görünür.</p>
                    </div>

                    <div className="pt-6 border-t border-[#e8f2f0] flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
                        <p className="text-[13px] text-[#4a6360]">Taslak yalnızca sana görünür.</p>
                        <button type="submit" disabled={createDbMutation.isPending || !canSubmit} className={cn(btn.primary, btn.lg, 'min-w-[200px]')}>
                            {createDbMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Taslak açılıyor</> : 'Taslağı oluştur'}
                        </button>
                    </div>
                </form>

                {/* Önizleme: kapağın sade hali, kitap sırtıyla */}
                <aside aria-label="Kapak önizlemesi" className="lg:sticky lg:top-8 max-w-[260px]">
                    <p className="text-[13px] font-bold text-[#4a6360] mb-2.5">Kapak taslağı</p>
                    <div className="relative aspect-[3/4] rounded-r-xl rounded-l-[4px] overflow-hidden bg-[linear-gradient(160deg,#9cf2e8,#5fb8ac)] shadow-[0_18px_34px_-18px_rgba(0,32,29,0.55)]">
                        <span aria-hidden className="absolute inset-y-0 left-0 w-3 bg-[#00201d]/15" />
                        <div className="absolute inset-0 pl-7 pr-5 py-6 flex flex-col">
                            <p className={cn(
                                'text-[20px] leading-[1.15] font-extrabold tracking-[-0.015em] line-clamp-5 text-balance',
                                title.trim() ? 'text-[#00201d]' : 'text-[#00201d]/40'
                            )}>
                                {title.trim() || 'Kitabının adı'}
                            </p>
                            <p className={cn('mt-auto text-[13px] font-bold', authorName.trim() ? 'text-[#00483f]' : 'text-[#00483f]/45')}>
                                {authorName.trim() || 'Yazar adı'}
                            </p>
                        </div>
                    </div>
                    <p className="mt-2.5 text-[12.5px] text-[#5f7774]">Gerçek kapağı sonraki adımlarda yüklersin.</p>
                </aside>
            </div>
        </InstructorShell>
    );
}

export default CreateBook;
