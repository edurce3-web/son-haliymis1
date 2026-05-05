import React, { useState, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Clock, Users, Heart, ShoppingCart, Play, BookOpen, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
interface Course {
  course_id: number;
  slug?: string;
  title: string;
  description: string;
  price: number;
  discount_percent: number;
  discounted_price?: number;
  thumbnail_url?: string;
  category: string;
  instructor_id: number;
  instructor_name: string;
  average_rating?: number;
  student_count?: number;
  duration?: string;
}

interface MobileCourseCardProps {
  course: Course;
  onAddToCart?: (courseId: number) => void;
  onToggleFavorite?: (courseId: number) => void;
  isFavorite?: boolean;
  isInCart?: boolean;
  isAuthenticated?: boolean;
}

export const MobileCourseCard: React.FC<MobileCourseCardProps> = memo(({
  course,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
  isInCart = false,
  isAuthenticated = false,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleAddToCart = useCallback(() => {
    if (!isAuthenticated) {
      toast.error("Sepete eklemek için giriş yapmalısınız!");
      navigate('/login');
      return;
    }
    onAddToCart?.(course.course_id);
  }, [onAddToCart, course.course_id, isAuthenticated, navigate]);

  const handleToggleFavorite = useCallback(() => {
    if (!isAuthenticated) {
      toast.error("Favorilere eklemek için giriş yapmalısınız!");
      navigate('/login');
      return;
    }
    onToggleFavorite?.(course.course_id);
  }, [onToggleFavorite, course.course_id, isAuthenticated, navigate]);

  const discountedPrice = course.price * (1 - course.discount_percent / 100);
  const isPopular = (course.student_count || 0) > 1000;
  const isHighRated = (course.average_rating || 0) >= 4.5;
  return (
    <Card
      className={cn(
        "w-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group cursor-pointer",
        "bg-gradient-to-br from-background to-muted/30",
        isHovered && "shadow-2xl -translate-y-2"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden">
        <div className={cn(
          "w-full h-40 bg-muted/50 flex items-center justify-center transition-all duration-500",
          !imageLoaded && "animate-pulse"
        )}>
          <img
            src={course.thumbnail_url || '/placeholder.svg'}
            alt={course.title}
            className={cn(
              "w-full h-full object-cover transition-all duration-500 group-hover:scale-110",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
          {!imageLoaded && (
            <BookOpen className="w-8 h-8 text-muted-foreground animate-pulse" />
          )}
        </div>

        {/* Overlay with play button */}
        <div className={cn(
          "absolute inset-0 bg-black/40 flex items-center justify-center transition-all duration-300",
          "opacity-0 group-hover:opacity-100"
        )}>
          <Button
            variant="ghost"
            size="lg"
            className="w-12 h-12 rounded-full bg-white/90 hover:bg-white text-primary hover:scale-110 transition-all duration-200"
            asChild
          >
            <Link to={`/course/${course.slug || course.course_id}`}>
              <Play className="w-6 h-6 ml-0.5" />
            </Link>
          </Button>
        </div>

        {/* Top badges and favorite button */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
          <div className="flex flex-col space-y-1">
            {course.discount_percent > 0 && (
              <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg animate-pulse">
                %{course.discount_percent} İndirim
              </Badge>
            )}
            {isPopular && (
              <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg">
                <TrendingUp className="w-3 h-3 mr-1" />
                Popüler
              </Badge>
            )}
            {isHighRated && (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Yüksek Puan
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleFavorite}
            className={cn(
              "h-8 w-8 p-0 backdrop-blur-sm transition-all duration-200 hover:scale-110",
              isFavorite
                ? "bg-red-500/90 hover:bg-red-600 text-white"
                : "bg-white/80 hover:bg-white text-gray-600"
            )}
          >
            <Heart className={cn(
              "w-4 h-4 transition-all duration-200",
              isFavorite ? "fill-current scale-110" : "hover:scale-110"
            )} />
          </Button>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className="text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {course.category}
          </Badge>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{course.duration || '0'}h</span>
          </div>
        </div>

        <Link to={`/course/${course.slug || course.course_id}`} className="block group/title">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover/title:text-primary transition-colors duration-200 leading-tight">
            {course.title}
          </h3>
        </Link>

        <Link
          to={`/instructors/${course.instructor_id}`}
          className="flex items-center space-x-2 text-xs text-muted-foreground hover:text-primary transition-all duration-200 group/instructor"
        >
          <Avatar className="w-6 h-6 ring-2 ring-transparent group-hover/instructor:ring-primary/20 transition-all duration-200">
            <AvatarImage src="" />
            <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10">
              {course.instructor_name?.split(' ').map(n => n[0]).join('') || 'IN'}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{course.instructor_name}</span>
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1 text-yellow-600">
              <Star className="w-3 h-3 fill-current" />
              <span className="font-medium">{course.average_rating?.toFixed(1) || '0.0'}</span>
            </div>
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{course.student_count?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {course.description}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {course.discount_percent > 0 ? (
              <>
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  ₺{discountedPrice.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  ₺{course.price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                ₺{course.price.toFixed(2)}
              </span>
            )}
          </div>
          {course.discount_percent > 0 && (
            <Badge className="bg-green-100 text-green-700 text-xs">
              ₺{(course.price - discountedPrice).toFixed(2)} tasarruf
            </Badge>
          )}
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={isInCart}
          className={cn(
            "w-full h-9 text-sm font-medium transition-all duration-200",
            "hover:scale-[1.02] active:scale-[0.98]",
            isInCart
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl"
          )}
        >
          <ShoppingCart className={cn(
            "w-4 h-4 mr-2 transition-transform duration-200",
            isInCart ? "text-green-600" : "group-hover:scale-110"
          )} />
          {isInCart ? 'Sepette ✓' : 'Sepete Ekle'}
        </Button>
      </CardFooter>
    </Card>
  );
});
