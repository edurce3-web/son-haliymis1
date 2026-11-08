import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';
import { btn, Empty, Loading, PageHead, Tag, lira } from '../shell/kit';

export function BookManager() {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['instructor-books'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const r = await fetch(`${API_BASE_URL}/instructor/books`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!r.ok) throw new Error('Kitaplar yüklenemedi');
            return r.json();
        },
    });

    const books: any[] = data?.books || [];
    const live = books.filter(b => b.status === 'published').length;

    if (isLoading) return <Loading label="Kitapların yükleniyor" />;

    const create = (
        <Link to="/instructor/books/create" className={cn(btn.primary, btn.md)}>
            <Plus className="w-4 h-4" /> Yeni e-kitap yükle
        </Link>
    );

    return (
        <>
            <PageHead
                title="Kitaplarım"
                sub={books.length ? `${live} yayında · ${books.length - live} taslak` : undefined}
                actions={books.length ? create : undefined}
            />

            {isError ? (
                <Empty title="Kitaplar yüklenemedi" text="Bağlantıda bir sorun oldu." action={{ label: 'Tekrar dene', onClick: () => refetch() }} />
            ) : books.length === 0 ? (
                <Empty
                    title="Henüz e-kitabın yok"
                    text="Bildiklerini PDF olarak yükle, kapağını ve fiyatını belirle; kurslarının yanında satışa çıksın."
                    action={{ label: 'İlk e-kitabını yükle', to: '/instructor/books/create' }}
                />
            ) : (
                <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-8">
                    {books.map(b => {
                        const published = b.status === 'published';
                        return (
                            <li key={b.book_id}>
                                <Link to={`/instructor/books/edit/${b.book_id}`} className="group block focus-visible:outline-none">
                                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#e3f6f2] shadow-[0_10px_24px_-14px_rgba(0,32,29,0.45)] ring-1 ring-[#dcebe8] transition-[transform,box-shadow] duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_18px_32px_-16px_rgba(0,32,29,0.5)] group-focus-visible:ring-2 group-focus-visible:ring-[#005c55]">
                                        {b.cover_image_path ? (
                                            <img src={b.cover_image_path} alt="" className="w-full h-full object-cover" loading="lazy" />
                                        ) : (
                                            <span className="absolute inset-0 p-4 flex items-end text-[15px] font-extrabold leading-snug text-[#00201d]">
                                                {b.title}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-3">
                                        <Tag tone={published ? 'live' : 'draft'}>{published ? 'Yayında' : 'Taslak'}</Tag>
                                        <h3 className="mt-1 text-[14.5px] font-bold text-[#00201d] leading-snug line-clamp-2 group-hover:text-[#005c55]">
                                            {b.title}
                                        </h3>
                                        <p className="mt-1 text-[13px] text-[#4a6360] tabular-nums">
                                            {Number(b.price) > 0 ? lira(Number(b.price)) : 'Ücretsiz'}
                                        </p>
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </>
    );
}
