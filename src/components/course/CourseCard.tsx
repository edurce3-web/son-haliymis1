import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from '@/lib/api';
import { Star, Heart, ShoppingCart, TrendingUp, Clock, BookOpen, BarChart2, Check, Users, Loader2, PlayCircle, MoreHorizontal } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}/hover`);
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

  /**
   * Detay paneli sayfanın en üstüne (portal) çizilir.
   *
   * Kartlar yatay kaydırmalı raflarda duruyor; o kapsayıcıda overflow-x
   * tanımlı olduğu için içine yerleştirilen bir panel kırpılır (CSS'te bir
   * eksende overflow tanımlıyken diğer eksen görünür kalamaz). Bu yüzden panel
   * body'ye taşınıp kartın ekrandaki konumuna göre sabit konumlandırılıyor.
   */
  const wrapRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; side: "right" | "left" } | null>(null);
  const PANEL_WIDTH = 340;
  const GAP = 12;

  const handleMouseEnter = useCallback(() => {
    hoverTimer.current = setTimeout(() => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (rect) {
        const fitsRight = window.innerWidth - rect.right >= PANEL_WIDTH + GAP + 8;
        const side: "right" | "left" = fitsRight ? "right" : "left";
        const left = side === "right" ? rect.right + GAP : rect.left - PANEL_WIDTH - GAP;

        // Panel alt kenardan taşarsa yukarı kaydır
        const maxTop = window.innerHeight - 24;
        setPanelPos({
          top: Math.min(rect.top, Math.max(12, maxTop - 420)),
          left: Math.max(12, left),
          side,
        });
      }
      setIsHovered(true);
    }, 250);
  }, []);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
    setIsHovered(false);
    setPanelPos(null);
  }, []);

  // Sayfa kaydırılırsa panel kartın yanından ayrılır; kapatmak en doğrusu
  useEffect(() => {
    if (!isHovered) return;
    const close = () => { setIsHovered(false); setPanelPos(null); };
    window.addEventListener("scroll", close, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", close, true);
  }, [isHovered]);

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
        ref={wrapRef}
        className="relative w-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ zIndex: isHovered ? 50 : 1 }}
      >
        {/* Kart normal akışta durur. Eskiden detay kartın içinde aşağı doğru
            açılıyordu; bu yüzden kart uzayıp içerik kayıyormuş gibi
            görünüyordu. Artık detay yandaki panelde. */}
        <div
          className={cn(
            "w-full bg-white rounded-xl border flex flex-col overflow-hidden transition-shadow duration-200",
            isHovered ? "border-slate-200 shadow-lg" : "border-slate-100 shadow-sm"
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

          </div>
        </div>

      </div>

      {/* Detay paneli — kartın yanında belirir, sayfa düzeninde yer kaplamaz */}
      {isHovered && panelPos && createPortal(
        <div
          className="hidden lg:block fixed z-[60] pointer-events-auto"
          style={{ top: panelPos.top, left: panelPos.left, width: PANEL_WIDTH }}
          onMouseEnter={() => clearTimeout(hoverTimer.current)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative bg-white rounded-xl border border-slate-200 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.25)] animate-in fade-in zoom-in-95 duration-150">
            {/* Panelin kartla bağını gösteren küçük ok */}
            <span
              className={cn(
                "absolute top-8 w-3 h-3 bg-white border-slate-200 rotate-45",
                panelPos.side === "right"
                  ? "-left-[7px] border-l border-b"
                  : "-right-[7px] border-r border-t"
              )}
            />

              <div className="p-5">
                <Link to={courseUrl}>
                  <h4 className="font-extrabold text-slate-900 text-[17px] leading-snug line-clamp-2 hover:text-brand-700 transition-colors">
                    {course.title}
                  </h4>
                </Link>

                {hoverLoading ? (
                  <div className="space-y-2.5 mt-4 animate-pulse">
                    <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                    <div className="h-2.5 bg-slate-100 rounded w-full" />
                    <div className="h-2.5 bg-slate-100 rounded w-4/5" />
                    <div className="h-2.5 bg-slate-100 rounded w-2/3" />
                  </div>
                ) : hoverData ? (
                  <>
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      {hoverData.updated_at && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1">
                          {formatDate(hoverData.updated_at)} güncellendi
                        </span>
                      )}
                      {hoverData.level && (
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 rounded-full px-2.5 py-1">
                          {hoverData.level}
                        </span>
                      )}
                    </div>

                    {(hoverData.duration_seconds > 0 || hoverData.lesson_count > 0) && (
                      <div className="flex items-center gap-4 mt-3 text-[12px] text-slate-500">
                        {hoverData.duration_seconds > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {formatHours(hoverData.duration_seconds / 3600)}
                          </span>
                        )}
                        {hoverData.lesson_count > 0 && (
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                            {hoverData.lesson_count} ders
                          </span>
                        )}
                      </div>
                    )}

                    {(hoverData.short_description || hoverData.description) && (
                      <p className="text-[13px] text-slate-600 leading-relaxed mt-3 line-clamp-3">
                        {hoverData.short_description || hoverData.description}
                      </p>
                    )}

                    {hoverData.learning_goals?.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {hoverData.learning_goals.slice(0, 4).map((g: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-[12.5px] text-slate-700 leading-snug">
                            <Check className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{g}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : null}

                <div className="flex items-center gap-2 mt-5">
                  <button
                    onClick={addToCart}
                    disabled={inCart || addToCartMutation.isPending}
                    className={cn(
                      "flex-1 h-11 text-sm font-bold rounded-lg transition-colors",
                      inCart
                        ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                        : "bg-brand-700 hover:bg-brand-800 text-white"
                    )}
                  >
                    {addToCartMutation.isPending
                      ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      : inCart ? "Sepette" : "Sepete ekle"}
                  </button>
                  <button
                    onClick={toggleFav}
                    aria-label={favorited ? "Favorilerden çıkar" : "Favorilere ekle"}
                    className={cn(
                      "w-11 h-11 shrink-0 flex items-center justify-center rounded-lg border transition-colors",
                      favorited
                        ? "border-rose-200 bg-rose-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <Heart className={cn("w-[18px] h-[18px]", favorited ? "fill-rose-500 text-rose-500" : "text-slate-600")} />
                  </button>
                </div>
              </div>
          </div>
        </div>,
        document.body
      )}

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