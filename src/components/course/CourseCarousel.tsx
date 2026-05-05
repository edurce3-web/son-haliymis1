import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CourseCarouselProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
}

export const CourseCarousel = ({ children, title, subtitle }: CourseCarouselProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (dir: 'left' | 'right') => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: dir === 'left' ? -800 : 800, behavior: 'smooth' });
    };

    const childCount = React.Children.count(children);
    if (childCount === 0) return null;

    return (
        <div className="relative group/carousel mt-6 mb-8">
            {(title || subtitle) && (
                <div className="mb-4">
                    {title && <h2 className="text-[22px] font-black tracking-tight text-slate-900">{title}</h2>}
                    {subtitle && <p className="text-sm font-medium text-slate-500 mt-1">{subtitle}</p>}
                </div>
            )}

            <div className="relative">
                {/* Left arrow */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute -left-5 top-20 z-[100] w-12 h-12 bg-white shadow-xl shadow-black/10 rounded-full flex items-center justify-center border border-slate-100 opacity-0 group-hover/carousel:opacity-100 transition-all duration-200 hover:bg-slate-50 hover:scale-110"
                >
                    <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>

                {/* Right arrow */}
                <button
                    onClick={() => scroll('right')}
                    className="absolute -right-5 top-20 z-[100] w-12 h-12 bg-white shadow-xl shadow-black/10 rounded-full flex items-center justify-center border border-slate-100 opacity-0 group-hover/carousel:opacity-100 transition-all duration-200 hover:bg-slate-50 hover:scale-110"
                >
                    <ChevronRight className="w-5 h-5 text-slate-700" />
                </button>

                {/* Container for scrolling */}
                <div
                    ref={scrollRef}
                    className="flex gap-4 pb-[28rem] -mb-[28rem] px-2 -mx-2 pt-2 top-0"
                    style={{
                        overflowX: 'auto',
                        overflowY: 'visible',
                        scrollSnapType: 'x mandatory',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                >
                    {React.Children.map(children, (child) => (
                        <div className="shrink-0 snap-start">
                            {child}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
