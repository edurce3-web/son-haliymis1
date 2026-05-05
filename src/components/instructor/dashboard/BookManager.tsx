import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Book, Library, Image as ImageIcon, Plus, Edit, Trash2, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function BookManager() {
    const navigate = useNavigate();
    const token = () => localStorage.getItem('token');
    const apiBase = (window as any)?.__API_BASE__ || (import.meta as any)?.env?.VITE_API_URL || 'https://api.edurce.com';

    // ─── Fetch Books ───────────────────────────────────────────────────────────
    const { data: booksData, isLoading: booksLoading, isError } = useQuery({
        queryKey: ['instructor-books'],
        queryFn: async () => {
            const r = await fetch(`${apiBase}/api/instructor/books`, {
                headers: { Authorization: `Bearer ${token()}` }
            });
            if (!r.ok) throw new Error('Kitaplar yüklenemedi');
            return r.json();
        }
    });

    const books = booksData?.books || [];

    if (booksLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-zinc-900 animate-spin" />
            </div>
        );
    }

    if (isError) {
        toast.error('Kitaplar yüklenirken bir sorun oluştu.');
    }

    // ─── Render View: LIST ─────────────────────────────────────────────────────
    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-100">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">E-Kitap Yönetimi</h1>
                    <p className="text-zinc-500 text-sm">Platformdaki yayınlanmış ve taslak halindeki e-kitaplarınızı yönetin.</p>
                </div>
                <div className='flex gap-4'>
                    <Button
                        onClick={() => navigate('/instructor/books/create')}
                        className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg px-6 gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Kitap Ekle
                    </Button>
                </div>
            </div>

            {books.length === 0 ? (
                <div className='col-span-full flex flex-col items-center justify-center py-20 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl text-center px-6'>
                    <div className='w-16 h-16 bg-white border border-zinc-100 rounded-full flex items-center justify-center mb-4 text-zinc-400'>
                        <Library className='w-8 h-8' />
                    </div>
                    <h3 className='text-lg font-semibold text-zinc-900'>Henüz Kitap Bulunmuyor</h3>
                    <p className='text-zinc-500 max-w-sm mx-auto mt-2 text-sm'>
                        Uzmanlığınızı e-kitap formatında yayınlayın, yüz binlerce öğrenciye kolayca ulaşın.
                    </p>
                    <Button
                        onClick={() => navigate('/instructor/books/create')}
                        className='mt-6 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg'
                    >
                        İlk Kitabını Oluştur
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {books.map((b: any) => (
                        <Card key={b.book_id} className="group border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 rounded-xl flex flex-col">
                            {/* Fixed Aspect Ratio Thumbnail for Book (usually 3:4) */}
                            <div className="relative w-full aspect-[3/4] overflow-hidden bg-zinc-100 flex-shrink-0">
                                {b.cover_image_path ? (
                                    <img
                                        src={b.cover_image_path}
                                        alt={b.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-zinc-300">
                                        <ImageIcon className="w-12 h-12" />
                                    </div>
                                )}
                                <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

                                <Badge className={cn(
                                    'absolute top-3 left-3 px-2.5 py-0.5 text-[11px] font-medium border-0',
                                    b.status === 'published' ? 'bg-emerald-500/90 text-white hover:bg-emerald-600' : 'bg-zinc-700/90 text-white hover:bg-zinc-800'
                                )}>
                                    {b.status === 'published' ? 'Yayında' : 'Taslak'}
                                </Badge>

                                <div className='absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2'>
                                    <Button
                                        onClick={() => navigate(`/instructor/books/edit/${b.book_id}`)}
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 px-3 bg-white/90 hover:bg-white text-zinc-900 rounded-md text-xs font-semibold backdrop-blur-sm"
                                    >
                                        Düzenle
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="h-8 w-8 p-0 bg-red-600/90 hover:bg-red-600 text-white rounded-md backdrop-blur-sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <CardContent className="flex flex-col flex-1 p-5">
                                <div className="mb-4 flex-1">
                                    <h3 className="font-semibold text-zinc-900 leading-snug line-clamp-2 group-hover:text-zinc-700 transition-colors" title={b.title}>
                                        {b.title}
                                    </h3>
                                    {b.subtitle && (
                                        <p className="text-xs text-zinc-500 mt-2 line-clamp-2">
                                            {b.subtitle}
                                        </p>
                                    )}
                                </div>
                                <div className="pt-4 border-t border-zinc-100 mt-auto flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-zinc-400" />
                                        <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Tür : PDF</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Fiyat</span>
                                        <span className="text-sm font-semibold text-zinc-900">{b.price} {b.currency || '₺'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
