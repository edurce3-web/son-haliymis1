import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShoppingCart, ArrowRight, Star } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

interface RecommendedCourse {
    id: number;
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

export const AddedToCartModal = ({ isOpen, onClose, course }: AddedToCartModalProps) => {
    const navigate = useNavigate();

    // Fetch recommendations based on category
    const { data: recommendations } = useQuery({
        queryKey: ['recommendations', course.category_id],
        queryFn: async () => {
            if (!course.category_id) return [];
            const response = await apiRequest(`/courses/category-by-id/${course.category_id}?limit=4`);
            // Filter out current course
            return response.courses?.filter((c: any) => c.id !== course.id).slice(0, 3) || [];
        },
        enabled: isOpen && !!course.category_id
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-none shadow-2xl rounded-xl">
                <div className="flex flex-col md:flex-row">
                    {/* Left Side: Success Info */}
                    <div className="flex-1 p-8 bg-gray-50/50">
                        <div className="flex items-center gap-3 mb-6 text-green-600">
                            <CheckCircle2 className="w-8 h-8" />
                            <h2 className="text-2xl font-bold font-display">Sepete Eklendi!</h2>
                        </div>

                        <div className="flex gap-4 mb-8">
                            <div className="overflow-hidden bg-gray-200 border border-gray-100 shadow-sm rounded-lg w-32 h-20 flex-shrink-0">
                                <img
                                    src={course.image_path || course.thumbnail || '/placeholder-course.jpg'}
                                    alt={course.title}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold leading-tight mb-1 line-clamp-2">{course.title}</h3>
                                <p className="text-sm text-gray-500 mb-2">{course.instructor_name}</p>
                                <div className="text-xl font-bold">₺{course.price}</div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => { onClose(); navigate('/cart'); }}
                                className="w-full h-12 text-lg font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200"
                            >
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                Sepete Git
                            </Button>
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="w-full h-12 text-lg border-2 hover:bg-gray-50"
                            >
                                Alışverişe Devam Et
                            </Button>
                        </div>
                    </div>

                    {/* Right Side: Cross-Selling */}
                    <div className="flex-[1.2] p-8 border-l border-gray-100">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            Bunu alanlar şunları da aldı
                            <ArrowRight className="w-5 h-5 text-gray-400" />
                        </h3>

                        <div className="space-y-4">
                            {recommendations && recommendations.length > 0 ? (
                                recommendations.map((rec: RecommendedCourse) => (
                                    <div
                                        key={rec.id}
                                        className="flex gap-3 p-3 transition-colors rounded-lg hover:bg-gray-50 cursor-pointer group"
                                        onClick={() => { onClose(); navigate(`/course/${rec.id}`); }}
                                    >
                                        <div className="w-20 h-12 overflow-hidden bg-gray-100 rounded">
                                            <img src={rec.thumbnail || '/placeholder-course.jpg'} alt={rec.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold leading-tight line-clamp-2 group-hover:text-purple-600 transition-colors">{rec.title}</h4>
                                            <div className="flex items-center gap-1 mt-1 text-xs text-yellow-600">
                                                <Star className="w-3 h-3 fill-current" />
                                                <span>{rec.rating || 4.5}</span>
                                            </div>
                                            <div className="mt-0.5 font-bold text-sm">₺{rec.price}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                // Fallback Loaders or Empty State
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex gap-3 p-3 animate-pulse">
                                        <div className="w-20 h-12 bg-gray-200 rounded"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="w-full h-3 bg-gray-200 rounded"></div>
                                            <div className="w-2/3 h-3 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
