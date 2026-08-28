import React from 'react';
import { PageBand } from '@/components/layout/PageBand';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import {
    BookOpen, ChevronRight, Download, BookMarked,
    ShoppingBag, User2, Calendar, FileText, Tag
} from 'lucide-react';

const MyBooks = () => {
    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ['my-books'],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/my-books`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!r.ok) return { books: [] };
            return r.json();
        }
    });

    const books = data?.books || [];

    if (isLoading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 border-4 border-brand-200/30 border-t-brand-600 rounded-full animate-spin" />
                <p className="text-slate-500 text-sm animate-pulse">Kitaplar yükleniyor...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">

            <PageBand
                breadcrumb={
                    <>
                        <Link to="/" className="hover:text-brand-800 transition-colors">Ana sayfa</Link>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        <span className="text-slate-700">Kitaplarım</span>
                    </>
                }
                title="Kitaplarım"
                subtitle={books.length > 0 ? `${books.length} kitap` : undefined}
            />

            <div className="container mx-auto px-5 sm:px-8 lg:px-10 max-w-[1280px] py-10">
                {books.length === 0 ? (
                    <p className="text-[15px] text-slate-500">
                        Henüz bir kitabın yok.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {books.map((book: any) => (
                            <BookCard
                                key={book.book_id}
                                book={book}
                                onRead={() => navigate(`/books/${book.book_id}/read`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const BookCard = ({ book, onRead }: { book: any; onRead: () => void }) => {
    const hasEpub = !!book.epub_file_path;

    return (
        <div className="group relative bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-brand-200/30 transition-all duration-300 hover:shadow-2xl hover:shadow-brand-600/10 hover:-translate-y-1 flex flex-col">

            {/* Top gradient accent */}
            <div className="h-1 bg-gradient-to-r from-brand-600 via-brand-600 to-brand-800" />

            {/* Cover */}
            <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-brand-600/50 to-slate-800/50 cursor-pointer" onClick={onRead}>
                {book.cover_image_path ? (
                    <img
                        src={`${API_BASE_URL}/books/${book.book_id}/cover`}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6">
                        <div className="w-16 h-16 rounded-2xl bg-brand-700/20 border border-brand-200/30 flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-brand-700" />
                        </div>
                        <p className="text-slate-500 text-xs text-center font-medium leading-snug">{book.title}</p>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white border border-slate-200 text-slate-900 text-xs font-bold px-4 py-2 rounded-full">
                        Oku
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mb-1 cursor-pointer hover:text-brand-700 transition-colors leading-snug" onClick={onRead}>
                    {book.title}
                </h3>
                {book.subtitle && (
                    <p className="text-xs text-slate-500 line-clamp-1 mb-2">{book.subtitle}</p>
                )}

                <div className="space-y-1.5 mb-4 mt-1">
                    {book.author_name && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <User2 className="w-3 h-3 text-slate-500" />
                            <span className="truncate">{book.author_name}</span>
                        </div>
                    )}
                    {book.category_name && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Tag className="w-3 h-3 text-slate-500" />
                            <span className="truncate">{book.category_name}</span>
                        </div>
                    )}
                    {book.page_count && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <FileText className="w-3 h-3 text-slate-500" />
                            <span>{book.page_count} sayfa</span>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className="mt-auto flex gap-2">
                    <button
                        onClick={onRead}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-brand-700/10 hover:bg-brand-700/20 border border-brand-200/20 text-brand-700 hover:text-brand-700 text-xs font-bold rounded-xl transition-all"
                    >
                        <BookOpen className="w-3.5 h-3.5" /> Oku
                    </button>
                    {hasEpub && (
                        <a
                            href={`${API_BASE_URL}/books/${book.book_id}/download`}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 hover:text-emerald-300 text-xs font-bold rounded-xl transition-all"
                        >
                            <Download className="w-3.5 h-3.5" /> İndir
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyBooks;
