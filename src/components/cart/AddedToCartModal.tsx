import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, getCourseImageUrl } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface RecommendedCourse {
    id: number;
    course_id?: number;
    title: string;
    instructor_name: string;
    price: number;
    rating: number;
    thumbnail: string;
}

interface AddedToCartModalProps {
    isOpen: boolean;
    onClose: () => void;
    course: {
        id: number;
        title: string;
        instructor_name: string;
        price: number;
        image_path?: string;
        thumbnail?: string;
        category_id?: number;
    };
}

/**
 * Sepete ekleme onayı.
 *
 * Sol tarafta eklenen kurs ve iki eylem, sağ tarafta aynı kategoriden
 * öneriler. Görsel dil platformun geri kalanıyla aynı: marka rengi, ikon yok,
 * sade tipografi.
 */
export const AddedToCartModal = ({ isOpen, onClose, course }: AddedToCartModalProps) => {
    const navigate = useNavigate();

    const { data: recommendations, isLoading } = useQuery({
        queryKey: ['recommendations', course.category_id],
        queryFn: async () => {
            if (!course.category_id) return [];
            const response = await apiRequest(`/courses/category-by-id/${course.category_id}?limit=4`);
            // Sepete eklenen kursun kendisini listeden çıkar
            return response.courses?.filter((c: any) => c.id !== course.id).slice(0, 3) || [];
        },
        enabled: isOpen && !!course.category_id
    });

    const hasRecommendations = Boolean(recommendations?.length);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white border border-slate-200 shadow-2xl rounded-2xl">
                <DialogTitle className="sr-only">Kurs sepete eklendi</DialogTitle>

                <div className="flex flex-col md:flex-row">
                    {/* Eklenen kurs */}
                    <div className="md:w-[22rem] shrink-0 p-7 md:border-r border-slate-100">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700 mb-4">
                            Sepete eklendi
                        </p>

                        <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-[16/10] mb-4">
                            <img
                                src={getCourseImageUrl(course.id, course.image_path || course.thumbnail)}
                                alt={course.title}
                                className="object-cover w-full h-full"
                            />
                        </div>

                        <h3 className="text-[15px] font-bold text-slate-900 leading-snug line-clamp-2">
                            {course.title}
                        </h3>
                        <p className="text-[13px] text-slate-500 mt-1">{course.instructor_name}</p>
                        <p className="text-[19px] font-bold text-slate-900 mt-3">
                            {formatPrice(Number(course.price) || 0)}
                        </p>

                        <div className="flex flex-col gap-2.5 mt-6">
                            <Button
                                onClick={() => { onClose(); navigate('/cart'); }}
                                className="w-full h-11 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-[15px] font-semibold"
                            >
                                Sepete git
                            </Button>
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="w-full h-11 rounded-lg border-slate-300 hover:border-brand-400 hover:text-brand-800 text-[15px] font-semibold"
                            >
                                Alışverişe devam et
                            </Button>
                        </div>
                    </div>

                    {/* Öneriler */}
                    <div className="flex-1 p-7 bg-slate-50/60 min-w-0">
                        <h3 className="text-[15px] font-bold text-slate-900">
                            Bu kursla birlikte önerilenler
                        </h3>
                        <p className="text-[13px] text-slate-500 mt-1 mb-5">
                            Aynı alandaki diğer kurslar
                        </p>

                        {isLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex gap-3 p-3 animate-pulse">
                                        <div className="w-24 h-16 bg-slate-200 rounded-md shrink-0" />
                                        <div className="flex-1 space-y-2 pt-1">
                                            <div className="w-full h-3 bg-slate-200 rounded" />
                                            <div className="w-2/3 h-3 bg-slate-200 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : hasRecommendations ? (
                            <div className="space-y-2">
                                {recommendations.map((rec: RecommendedCourse) => {
                                    const recId = rec.course_id ?? rec.id;
                                    return (
                                        <button
                                            key={recId}
                                            onClick={() => { onClose(); navigate(`/course/${recId}`); }}
                                            className="w-full flex gap-3.5 p-3 text-left rounded-lg bg-white border border-transparent hover:border-brand-200 hover:shadow-sm transition-all group"
                                        >
                                            <div className="w-24 h-16 shrink-0 overflow-hidden bg-slate-100 rounded-md">
                                                <img
                                                    src={getCourseImageUrl(recId, rec.thumbnail)}
                                                    alt={rec.title}
                                                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[13.5px] font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-brand-800 transition-colors">
                                                    {rec.title}
                                                </h4>
                                                {rec.instructor_name && (
                                                    <p className="text-[12px] text-slate-500 mt-0.5 truncate">
                                                        {rec.instructor_name}
                                                    </p>
                                                )}
                                                <p className="text-[13.5px] font-bold text-slate-900 mt-1">
                                                    {formatPrice(Number(rec.price) || 0)}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-[14px] text-slate-500 leading-relaxed">
                                Bu alanda başka kurs bulunmuyor. Tüm kataloğa göz atmak için{' '}
                                <button
                                    onClick={() => { onClose(); navigate('/courses'); }}
                                    className="text-brand-700 font-medium hover:underline"
                                >
                                    kurslar sayfasına
                                </button>{' '}
                                gidebilirsiniz.
                            </p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
