import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { COURSE_CATEGORIES } from '@/constants/categories';

export const CategorySidebar: React.FC = () => {
    const { categorySlug, subcategorySlug } = useParams<{
        categorySlug: string;
        subcategorySlug?: string;
    }>();

    return (
        <aside className="w-52 flex-shrink-0 hidden lg:block sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-3 pb-10">
            <div className="space-y-4">
                <div>
                    <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest pl-2 mb-2">
                        Kategoriler
                    </h3>

                    <nav className="space-y-0.5">
                        <Link
                            to="/courses"
                            className={cn(
                                "flex items-center justify-between px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                                !categorySlug
                                    ? "bg-zinc-900 text-white"
                                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                            )}
                        >
                            <span>Tüm Kurslar</span>
                        </Link>

                        {COURSE_CATEGORIES.map((cat) => {
                            if (!cat || !cat.slug) return null;

                            const isActive = categorySlug === cat.slug;

                            return (
                                <div key={cat.id} className="flex flex-col">
                                    <Link
                                        to={`/courses/${cat.slug}`}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2 text-[13px] transition-colors w-full text-left",
                                            isActive
                                                ? "bg-[#111827] text-white font-semibold rounded-md shadow-sm"
                                                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-md font-medium"
                                        )}
                                    >
                                        <span className="truncate">{cat.name}</span>
                                    </Link>

                                    {/* Subcategories */}
                                    {isActive && cat.subcategories && cat.subcategories.length > 0 && (
                                        <div className="mt-1 mb-2 flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-200">
                                            {cat.subcategories.map((sub) => {
                                                if (!sub || !sub.slug) return null;
                                                const isSubActive = subcategorySlug === sub.slug;

                                                return (
                                                    <Link
                                                        key={sub.id}
                                                        to={`/courses/${cat.slug}/${sub.slug}`}
                                                        className={cn(
                                                            "block pl-6 pr-3 py-1.5 text-[12px] transition-colors truncate relative",
                                                            isSubActive
                                                                ? "text-[#111827] font-semibold"
                                                                : "text-zinc-500 hover:text-[#111827] font-medium"
                                                        )}
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </aside>
    );
};

export default CategorySidebar;

