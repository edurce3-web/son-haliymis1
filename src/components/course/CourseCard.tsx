import { Link, useNavigate } from "react-router-dom";
import { Star, Heart, ShoppingCart, TrendingUp, Clock, BookOpen, BarChart2, Check, Users, Loader2, PlayCircle, MoreHorizontal } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { favoritesAPI, cartAPI, getCourseImageUrl } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AddedToCartModal } from "../cart/AddedToCartModal";

interface Course {
  id: number;
  slug?: string;
  title: string;
  instructor?: string;
  instructor_name?: string;
  rating?: number;
  reviews?: number;
  review_count?: number;
  student_count?: number;
  studentCount?: number;
  price?: number;
  originalPrice?: number;
  original_price?: number;
  image?: string;
  thumbnail?: string;
  image_path?: string;
  image_url?: string;
  level?: string;
  is_favorited?: boolean;
}

interface CourseCardProps {
  course: Course;
  isAuthenticated?: boolean;
}

async function fetchHoverData(courseId: number) {
  const res = await fetch(`/api/courses/${courseId}/hover`);
  if (!res.ok) throw new Error("fetch failed");
  return res.json();
}

const formatHours = (h: number) => {
  if (!h) return null;
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}sa ${mins}dk` : `${hrs} saat`;
};

const formatDate = (d: string) => {
  if (!d) return null;
  const date = new Date(d);
  return `${date.toLocaleString("tr-TR", { month: "long" })} ${date.getFullYear()}`;
};

export const CourseCard = ({ course, isAuthenticated: propIsAuth }: CourseCardProps) => {
  const { isAuthenticated: ctxAuth } = useAuth();
  const isAuthenticated = propIsAuth !== undefined ? propIsAuth : ctxAuth;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [favorited, setFavorited] = useState(course.is_favorited || false);
  const [inCart, setInCart] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [addedCourse, setAddedCourse] = useState<any>(null);
  
  // Expanded hover state
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (course.is_favorited !== undefined) setFavorited(course.is_favorited);
  }, [course.is_favorited]);

  // Fetch hover data (learning goals, update date, exact duration) when hovered
  const { data: hoverData, isLoading: hoverLoading } = useQuery({
    queryKey: ["course-hover", course.id],
    queryFn: () => fetchHoverData(course.id),
    enabled: isHovered,
    staleTime: 5 * 60 * 1000,
  });

  const handleMouseEnter = useCallback(() => {
    hoverTimer.current = setTimeout(() => setIsHovered(true), 250);
  }, []);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
    setIsHovered(false);
  }, []);

  const toggleFavMutation = useMutation({
    mutationFn: favoritesAPI.toggleFavorite,
    onSuccess: (data) => {
      setFavorited(data.favorited);
      toast.success(data.favorited ? "Favorilere eklendi!" : "Favorilerden çıkarıldı!");
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: () => toast.error("Bir hata oluştu!"),
  });

  const addToCartMutation = useMutation({
    mutationFn: cartAPI.addToCart,
    onSuccess: (data: any) => {
      setInCart(true);
      setAddedCourse(data.course || course);
      setShowModal(true);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: () => toast.error("Sepete eklenemedi!"),
  });

  const toggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { navigate("/login"); return; }
    toggleFavMutation.mutate(course.id);
  };

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { navigate("/login"); return; }
    addToCartMutation.mutate(course.id);
  };

  const imgSrc = getCourseImageUrl(course.id, course.image_url || course.thumbnail || course.image_path || course.image);
  const courseUrl = `/course/${course.slug || course.id}`;
  const price = course.price || 0;
  const oldPrice = course.originalPrice || course.original_price;
  const rating = Number(course.rating || 0);
  const reviewCount = course.reviews || course.review_count || 0;
  const students = course.studentCount || course.student_count || 0;
  const isBestseller = students > 1000;

  return (
    <>
      <div
        className="relative flex-none w-[270px]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ zIndex: isHovered ? 50 : 1 }}
      >
        {/* Base invisible outline to maintain carousel structure */}
        <div className="invisible w-[270px] flex flex-col pointer-events-none">
           <div className="aspect-video w-full" />
           <div className="p-4 flex flex-col pb-8">
             <div className="h-4 w-full mb-1" />
             <div className="h-4 w-3/4 mb-1" />
             <div className="h-3 w-1/2 mb-2" />
             <div className="h-5 w-1/3 mb-2" />
             <div className="h-6 w-1/2 mt-auto" />
           </div>
        </div>

        {/* The Card (Expands over the container when hovered) */}
        <div
          className={cn(
            "absolute top-0 left-0 w-full bg-white rounded-xl border flex flex-col overflow-hidden transition-all duration-300 transform-gpu",
            isHovered ? "border-slate-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] scale-[1.02]" : "border-slate-100 shadow-sm"
          )}
        >
          {/* Card Header: Image */}
          <Link to={courseUrl} className="relative aspect-video w-full bg-slate-100 overflow-hidden shrink-0 group">
            <img
              src={imgSrc}
              alt={course.title}
              className={cn("w-full h-full object-cover transition-transform duration-500", imgLoaded ? "opacity-100" : "opacity-0")}
              onLoad={() => setImgLoaded(true)}
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-course.jpg"; }}
            />
            {!imgLoaded && <div className="absolute inset-0 bg-slate-200 animate-pulse" />}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <PlayCircle className="w-6 h-6 text-white" />
              </div>
            </div>

            {isBestseller && (
              <span className="absolute top-2 left-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-black tracking-wider px-2 py-1 rounded shadow-md">
                Çok Satan
              </span>
            )}
          </Link>

          {/* Card Body */}
          <div className="p-4 flex flex-col bg-white">
            
            {/* Base info Always visible */}
            <div className="mb-2">
              <Link to={courseUrl}>
                <h3 className="font-extrabold text-slate-900 text-[15px] leading-[1.3] line-clamp-2 hover:text-violet-700 transition-colors">
                  {course.title}
                </h3>
              </Link>
            </div>

            <p className="text-[11px] font-semibold text-slate-500 truncate mb-1">
              {course.instructor_name || course.instructor}
            </p>

            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[13px] font-black text-amber-600">{rating.toFixed(1)}</span>
              <div className="flex -ml-0.5">
                 {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={cn("w-3 h-3", s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200")} />
                 ))}
              </div>
              <span className="text-[11px] text-slate-400 font-medium">({reviewCount.toLocaleString('tr-TR')})</span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-[17px] font-black text-slate-900">₺{price.toLocaleString()}</span>
              {oldPrice && oldPrice > price && (
                <span className="text-xs text-slate-500 line-through">₺{oldPrice.toLocaleString()}</span>
              )}
            </div>

            {/* EXPANDED SECTION (only visible when hovered) */}
            <div
               className={cn(
                 "grid transition-all duration-300 ease-in-out",
                 isHovered ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
               )}
            >
              <div className="overflow-hidden">
                <hr className="border-slate-100 mb-3" />

                {hoverLoading ? (
                  <div className="space-y-2 py-2 animate-pulse">
                    <div className="h-2.5 bg-slate-100 rounded w-full" />
                    <div className="h-2.5 bg-slate-100 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                  </div>
                ) : hoverData ? (
                  <>
                    <div className="text-[11px] font-bold text-emerald-700 mb-2">
                      Güncellendi {formatDate(hoverData.updated_at)}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-medium text-slate-600 mb-3">
                      {hoverData.duration_seconds > 0 && <span>Toplam {formatHours(hoverData.duration_seconds / 3600)}</span>}
                      {hoverData.level && <span className="flex items-center gap-1 before:content-['•'] before:mr-1 before:text-slate-300">{hoverData.level}</span>}
                      {hoverData.lesson_count > 0 && <span className="flex items-center gap-1 before:content-['•'] before:mr-1 before:text-slate-300">{hoverData.lesson_count} Ders</span>}
                    </div>

                    {(hoverData.short_description || hoverData.description) && (
                      <p className="text-[13px] text-slate-700 leading-snug mb-3">
                        {hoverData.short_description || hoverData.description}
                      </p>
                    )}

                    {hoverData.learning_goals?.length > 0 && (
                      <ul className="space-y-2 mb-4">
                        {hoverData.learning_goals.slice(0, 3).map((g: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-[12px] text-slate-600 leading-snug">
                            <Check className="w-3.5 h-3.5 text-slate-800 shrink-0 mt-[1px]" />
                            <span className="line-clamp-2">{g}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : null}

                {/* Extended Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-transparent">
                  <button
                    onClick={addToCart}
                    disabled={inCart || addToCartMutation.isPending}
                    className={cn(
                      "flex-1 py-3 text-sm font-black rounded text-center transition-all shadow-sm",
                      inCart
                        ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                        : "bg-[#7c3aed] hover:bg-[#6d28d9] text-white active:scale-[0.98]" // Violet-600 close to the original purple
                    )}
                  >
                    {addToCartMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : inCart ? "Sepette" : "Sepete ekle"}
                  </button>
                  <button
                    onClick={toggleFav}
                    className={cn(
                      "w-11 h-11 shrink-0 flex items-center justify-center rounded border-2 transition-colors",
                      favorited ? "border-red-500 bg-red-50 group/fav" : "border-slate-800 bg-white hover:bg-slate-50 group/fav"
                    )}
                  >
                    <Heart className={cn("w-5 h-5 transition-colors", favorited ? "fill-red-500 text-red-500" : "text-slate-800")} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {addedCourse && (
        <AddedToCartModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          course={addedCourse}
        />
      )}
    </>
  );
};

export default CourseCard;