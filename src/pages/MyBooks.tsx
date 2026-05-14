import React from 'react';
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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                <p className="text-slate-400 text-sm animate-pulse">Kitaplar yükleniyor...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950">

            {/* Header */}
            <div className="border-b border-white/5 bg-black/20 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <nav className="flex items-center gap-2 text-xs text-slate-500 mb-5">
                        <Link to="/" className="hover:text-violet-400 transition-colors">Ana Sayfa</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-slate-300 font-medium">Kitaplarım</span>
                    </nav>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                                    <BookMarked className="w-5 h-5 text-white" />
                                </div>
                                <h1 className="text-2xl font-black text-white tracking-tight">Kitaplarım</h1>
                            </div>
                            <p className="text-slate-400 text-sm pl-1">
                                Satın aldığın kitapları oku ve indir.
                            </p>
                        </div>

                        {books.length > 0 && (
                            <div className="flex items-center gap-2 bg-violet-400/10 border border-violet-400/20 rounded-2xl px-5 py-3">
                                <BookOpen className="w-4 h-4 text-violet-400" />
                                <span className="text-violet-300 font-bold text-sm">{books.length} Kitap</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 py-10">
                {books.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center mb-8 shadow-2xl">
                            <BookMarked className="w-14 h-14 text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Henüz Kitabın Yok</h3>
                        <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
                            Mağazadan kitap satın aldığında burada görünecek. Neural Akademi kütüphanesini keşfet!
                        </p>
                        <Link
                            to="/courses"
                            className="flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            Mağazaya Git
                        </Link>
                    </div>
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
        <div className="group relative bg-slate-800/40 border border-white/8 rounded-3xl overflow-hidden hover:border-violet-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-1 flex flex-col">

            {/* Top gradient accent */}
            <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />

            {/* Cover */}
            <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-violet-900/50 to-slate-800/50 cursor-pointer" onClick={onRead}>
                {book.cover_image_path ? (
                    <img
                        src={`${API_BASE_URL}/books/${book.book_id}/cover`}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6">
                        <div className="w-16 h-16 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-violet-400" />
                        </div>
                        <p className="text-slate-400 text-xs text-center font-medium leading-snug">{book.title}</p>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-bold px-4 py-2 rounded-full">
                        Oku
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-white text-sm line-clamp-2 mb-1 cursor-pointer hover:text-violet-300 transition-colors leading-snug" onClick={onRead}>
                    {book.title}
                </h3>
                {book.subtitle && (
                    <p className="text-xs text-slate-500 line-clamp-1 mb-2">{book.subtitle}</p>
                )}

                <div className="space-y-1.5 mb-4 mt-1">
                    {book.author_name && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <User2 className="w-3 h-3 text-slate-500" />
                            <span className="truncate">{book.author_name}</span>
                        </div>
                    )}
                    {book.category_name && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Tag className="w-3 h-3 text-slate-500" />
                            <span className="truncate">{book.category_name}</span>
                        </div>
                    )}
                    {book.page_count && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <FileText className="w-3 h-3 text-slate-500" />
                            <span>{book.page_count} sayfa</span>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className="mt-auto flex gap-2">
                    <button
                        onClick={onRead}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-400 hover:text-violet-300 text-xs font-bold rounded-xl transition-all"
                    >
                        <BookOpen className="w-3.5 h-3.5" /> Oku
                    </button>
                    {hasEpub && (
                        <a
                            href={`${API_BASE_URL}/books/${book.book_id}/download`}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-xs font-bold rounded-xl transition-all"
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
