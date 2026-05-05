import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Clock, Users, Play, Sparkles, TrendingUp, Award, Heart, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Course {
    id: number;
    title: string;
    description?: string;
    instructor_name?: string;
    instructor_avatar?: string;
    price?: number;
    original_price?: number;
    rating?: number;
    review_count?: number;
    student_count?: number;
    duration?: number;
    thumbnail?: string;
    image?: string;
    level?: string;
    is_bestseller?: boolean;
}

interface CategoryHeroCardProps {
    course: Course;
}

export const CategoryHeroCard: React.FC<CategoryHeroCardProps> = ({ course }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isLiked, setIsLiked] = useState(false);

    // Safe values with defaults
    const title = course?.title || 'Kurs Başlığı';
    const instructorName = course?.instructor_name || 'Eğitmen';
    const price = course?.price || 0;
    const originalPrice = course?.original_price;
    const rating = Number(course?.rating) || 0;
    const reviewCount = course?.review_count || 0;
    const studentCount = course?.student_count || 0;
    const duration = course?.duration || 0;
    const thumbnail = course?.thumbnail || course?.image || '/placeholder.svg';
    const level = course?.level;
    const isBestseller = course?.is_bestseller;
    const instructorAvatar = course?.instructor_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(instructorName)}&background=6366f1&color=fff`;

    const discountPercentage = originalPrice && originalPrice > price
        ? Math.round((1 - price / originalPrice) * 100)
        : 0;

    const durationHours = Math.floor(duration / 60);
    const durationMinutes = duration % 60;

    return (
        <div
            className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-8 shadow-sm"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Minimalist Background Pattern */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800 rounded-full blur-3xl" />
            </div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: '40px 40px'
            }} />

            <Link to={`/course/${course?.id || 1}`} className="relative flex flex-col lg:flex-row lg:min-h-[380px]">
                {/* Image Section */}
                <div className="relative w-full lg:w-3/5 h-[250px] lg:h-auto overflow-hidden">
                    <img
                        src={thumbnail}
                        alt={title}
                        className={cn(
                            "w-full h-full object-cover transition-all duration-700",
                            isHovered ? "scale-105" : "scale-100"
                        )}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                    />

                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

                    {/* Play Button */}
                    <div className={cn(
                        "absolute inset-0 flex items-center justify-center transition-all duration-500",
                        isHovered ? "opacity-100" : "opacity-0"
                    )}>
                        <button className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center hover:scale-110 transition-transform shadow-2xl">
                            <Play className="w-8 h-8 text-white fill-white ml-1" />
                        </button>
                    </div>

                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                        <Badge className="bg-zinc-900/80 backdrop-blur text-white border border-zinc-700 text-[11px] font-medium px-2.5 py-1 flex items-center gap-1.5 rounded-lg">
                            <Sparkles className="w-3 h-3 text-zinc-300" />
                            Editörün Seçimi
                        </Badge>
                        {isBestseller && (
                            <Badge className="bg-white/10 backdrop-blur text-white border border-zinc-700 text-[11px] font-medium px-2.5 py-1 flex items-center gap-1.5 rounded-lg">
                                <TrendingUp className="w-3 h-3 text-zinc-300" />
                                Çok Satan
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-6 lg:p-8 flex flex-col justify-between relative">
                    {/* Top Actions */}
                    <div className="absolute top-6 right-6 flex items-center gap-2">
                        <button
                            className="h-9 w-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 hover:border-zinc-600 transition-all text-zinc-400 hover:text-white"
                            onClick={(e) => { e.preventDefault(); setIsLiked(!isLiked); }}
                        >
                            <Heart className={cn("w-4 h-4 transition-colors", isLiked ? "text-rose-500 fill-rose-500" : "")} />
                        </button>
                        <button
                            className="h-9 w-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 hover:border-zinc-600 transition-all text-zinc-400 hover:text-white"
                            onClick={(e) => e.preventDefault()}
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Title */}
                        <h2 className="text-xl lg:text-2xl font-semibold text-white leading-tight line-clamp-2 pr-24">
                            {title}
                        </h2>

                        {/* Instructor */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-zinc-800 p-0.5 overflow-hidden border border-zinc-700">
                                <img
                                    src={instructorAvatar}
                                    alt={instructorName}
                                    className="w-full h-full rounded-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(instructorName)}&background=3f3f46&color=fff`;
                                    }}
                                />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">{instructorName}</p>
                                <p className="text-[11px] text-zinc-400">Uzman Eğitmen {level && `• ${level === 'beginner' ? 'Başlangıç' : level === 'intermediate' ? 'Orta Seviye' : level === 'advanced' ? 'İleri Seviye' : level}`}</p>
                            </div>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <Star className="w-4 h-4 text-zinc-300 fill-zinc-300" />
                                <span className="text-sm font-semibold text-white">{rating.toFixed(1)}</span>
                            </div>
                            <span className="text-xs text-zinc-500">({reviewCount.toLocaleString()} değerlendirme)</span>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="pt-6 mt-4 border-t border-zinc-800">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            {/* Stats */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                        <Clock className="w-4 h-4 text-zinc-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-white">{durationHours}s {durationMinutes}dk</p>
                                        <p className="text-[10px] text-zinc-500 font-medium">Süre</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                        <Users className="w-4 h-4 text-zinc-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-white">{studentCount.toLocaleString()}</p>
                                        <p className="text-[10px] text-zinc-500 font-medium">Öğrenci</p>
                                    </div>
                                </div>
                            </div>

                            {/* Price & CTA */}
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    {discountPercentage > 0 && originalPrice && (
                                        <p className="text-[11px] text-zinc-500 line-through">₺{originalPrice.toLocaleString()}</p>
                                    )}
                                    <p className="text-xl font-bold text-white">₺{price.toLocaleString()}</p>
                                </div>
                                <Button className="h-10 px-5 rounded-lg bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-100 font-medium text-sm transition-all hover:scale-105">
                                    Kursa Başla
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default CategoryHeroCard;
