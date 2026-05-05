import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { COURSE_CATEGORIES } from '@/constants/categories';
import api from '@/services/api';
import {
  BookOpen, Menu, Search, Bell, User, Settings, LogOut,
  ShoppingCart, Heart, GraduationCap, BarChart3,
  ChevronDown, Award, PlayCircle, BookMarked, Trophy,
  Trash2, Check, CheckCheck, ExternalLink, Star, X,
  MessageSquare
} from 'lucide-react';

// ─── Hover Popover Component ───
const HoverPopover = ({ children, content, width = 'w-80' }: { children: React.ReactNode; content: React.ReactNode; width?: string }) => {
  const [open, setOpen] = useState(false);
  const timeout = useRef<any>(null);
  const ref = useRef<HTMLDivElement>(null);

  const enter = () => { clearTimeout(timeout.current); setOpen(true); };
  const leave = () => { timeout.current = setTimeout(() => setOpen(false), 30); }; // Short delay is needed to move from trigger to popover

  return (
    <div ref={ref} onMouseEnter={enter} onMouseLeave={leave} className="relative">
      {children}
      {open && (
        <div className={`absolute right-0 top-full pt-1.5 z-[100]`}>
          <div className={`${width} bg-white rounded-2xl shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden`} onMouseEnter={enter} onMouseLeave={leave}>
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Notification Type Icons ───
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'purchase': return '🛒';
    case 'enrollment': return '📚';
    case 'announcement': return '📢';
    case 'message': return '💬';
    case 'achievement': return '🏆';
    case 'system': return '⚙️';
    case 'review': return '⭐';
    default: return '🔔';
  }
};

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // State for dynamic data
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCartData = async () => {
    try {
      const data = await api.cart.get();
      setCartItems(data.items || []);
      setCartCount(data.total_items || data.itemCount || (data.items || []).length);
      setCartTotal(data.total_price || data.totalPrice || 0);
    } catch { setCartCount(0); }
  };

  const fetchFavorites = async () => {
    try {
      const data = await api.favorites.getAll();
      setFavorites(data.items || data.favorites || []);
    } catch { /* silent */ }
  };

  const fetchNotifications = async () => {
    try {
      const data = await api.notifications.getAll();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch { /* silent */ }
  };

  // Fetch data on auth change and listen to global events
  useEffect(() => {
    if (isAuthenticated) {
      fetchCartData();
      fetchFavorites();
      fetchNotifications();
    } else {
      setCartItems([]); setCartCount(0); setCartTotal(0);
      setFavorites([]); setNotifications([]); setUnreadCount(0);
    }

    const handleCartUpdate = () => {
      if (isAuthenticated) fetchCartData();
    };

    const handleFavoritesUpdate = () => {
      if (isAuthenticated) fetchFavorites();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);

    // Also listen to possible storage changes if token changes
    const handleStorageChange = () => {
      if (isAuthenticated) {
        fetchCartData();
        fetchFavorites();
      }
    }
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated, location.pathname]);



  const handleRemoveFromCart = async (courseId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Optimistic Update
    setCartItems(prev => prev.filter(item => item.course_id !== courseId));
    setCartCount(prev => Math.max(0, prev - 1));
    try {
      await api.cart.remove(courseId);
      fetchCartData();
    } catch {
      fetchCartData();
    }
  };

  const handleRemoveFavorite = async (courseId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Optimistic Update
    setFavorites(prev => prev.filter(item => item.course_id !== courseId));
    try {
      await api.favorites.remove(courseId);
      fetchFavorites();
    } catch {
      fetchFavorites();
    }
  };

  const handleMarkNotifRead = async (id: number) => {
    try {
      await api.notifications.markAsRead(id);
      fetchNotifications();
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      fetchNotifications();
    } catch { /* silent */ }
  };

  const handleAddToCart = async (courseId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.cart.add(courseId);
      fetchCartData();
    } catch { /* silent */ }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  // ─── Cart Popover Content ───
  const CartPopoverContent = () => (
    <div>
      <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-2xl border-b flex items-center justify-between">
        <p className="font-bold text-slate-800 text-sm">Sepetim ({cartCount})</p>
        {cartCount > 0 && <span className="text-xs font-bold text-indigo-600">₺{cartTotal.toFixed(2)}</span>}
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        {cartItems.length === 0 ? (
          <div className="p-6 text-center">
            <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Sepetiniz boş</p>
          </div>
        ) : (
          cartItems.slice(0, 4).map((item) => (
            <div key={item.course_id} className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors group">
              <div className="w-14 h-10 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-lg flex-shrink-0 overflow-hidden">
                {(item.image_path || item.image_url) ? (
                  <img src={item.image_path || item.image_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{item.title}</p>
                <p className="text-[11px] text-slate-500">{item.instructor_name || `${item.instructor_first_name || ''} ${item.instructor_last_name || ''}`.trim()}</p>
                <p className="text-xs font-bold text-indigo-600">₺{parseFloat(item.price).toFixed(2)}</p>
              </div>
              <button onClick={(e) => handleRemoveFromCart(item.course_id, e)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-md transition-all">
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))
        )}
      </div>
      {cartItems.length > 0 && (
        <div className="p-3 border-t bg-slate-50/50 rounded-b-2xl space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Toplam:</span>
            <span className="font-bold text-slate-900">₺{cartTotal.toFixed(2)}</span>
          </div>
          <Button onClick={() => navigate('/cart')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm h-9">
            Sepete Git
          </Button>
        </div>
      )
      }
    </div >
  );

  // ─── Favorites Popover Content ───
  const FavoritesPopoverContent = () => (
    <div>
      <div className="max-h-[420px] overflow-y-auto">
        {favorites.length === 0 ? (
          <div className="p-8 text-center">
            <Heart className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500">İstek listeniz boş</p>
            <p className="text-xs text-slate-400 mt-1">Kursları keşfedin ve favorilerinize ekleyin</p>
          </div>
        ) : (
          favorites.slice(0, 5).map((fav) => (
            <div key={fav.course_id}
              className="flex gap-3 p-4 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0 relative group"
              onClick={() => navigate(`/course/${fav.course_id}`)}>
              {/* Thumbnail */}
              <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                {(fav.image_path || fav.image_url) ? (
                  <img src={fav.image_path || fav.image_url} className="w-full h-full object-cover" alt={fav.title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50">
                    <BookOpen className="w-6 h-6 text-indigo-300" />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-slate-900 line-clamp-2 leading-snug">{fav.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{fav.instructor_name || `${fav.instructor_first_name || ''} ${fav.instructor_last_name || ''}`.trim()}</p>
                <p className="text-sm font-extrabold text-slate-900 mt-1.5">₺{parseFloat(fav.price || 0).toFixed(2)}</p>
                {/* Add to cart button */}
                <button
                  onClick={(e) => handleAddToCart(fav.course_id, e)}
                  className="mt-2 w-full py-1.5 text-xs font-bold text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-600 hover:text-white transition-all text-center"
                >
                  Sepete ekle
                </button>
              </div>

              {/* Remove Favorite Button */}
              <button
                onClick={(e) => handleRemoveFavorite(fav.course_id, e)}
                className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 focus:opacity-100 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))
        )}
      </div>
      {favorites.length > 0 && (
        <div className="p-3 border-t">
          <Button onClick={() => navigate('/favorites')} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-md text-sm h-10 font-bold">
            İstek listesine git
          </Button>
        </div>
      )}
    </div>
  );

  // ─── Notifications Popover Content ───
  const NotificationsPopoverContent = () => (
    <div>
      <div className="p-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-t-2xl border-b flex items-center justify-between">
        <p className="font-bold text-slate-800 text-sm">
          Bildirimler {unreadCount > 0 && <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
        </p>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
            <CheckCheck className="w-3 h-3" /> Tümünü oku
          </button>
        )}
      </div>
      <div className="max-h-[350px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Bildiriminiz yok</p>
          </div>
        ) : (
          notifications.slice(0, 5).map((notif) => (
            <div
              key={notif.notification_id}
              className={cn(
                "flex items-start gap-3 p-3 hover:bg-slate-50 transition-colors cursor-pointer group",
                !notif.is_read && "bg-indigo-50/40"
              )}
              onClick={() => {
                handleMarkNotifRead(notif.notification_id);
                if (notif.action_url) navigate(notif.action_url);
              }}
            >
              <span className="text-lg mt-0.5">{getNotificationIcon(notif.type)}</span>
              <div className="flex-1 min-w-0">
                <p className={cn("text-xs truncate", !notif.is_read ? "font-bold text-slate-900" : "font-medium text-slate-700")}>{notif.title}</p>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{notif.message}</p>
                <p className="text-[10px] text-slate-400 mt-1">{new Date(notif.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              {!notif.is_read && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />}
            </div>
          ))
        )}
      </div>
      <div className="p-3 border-t bg-slate-50/50 rounded-b-2xl">
        <Button onClick={() => navigate('/notifications')} variant="outline" className="w-full rounded-xl text-sm h-9 border-violet-200 text-violet-600 hover:bg-violet-50">
          Tüm Bildirimleri Gör
        </Button>
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur-xl shadow-sm">
      {/* Top gradient line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600" />

      <div className="container flex h-16 items-center px-4 gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center mr-4 shrink-0 overflow-hidden h-14">
          <img
            src="/logo.png"
            alt="Edurce"
            className="h-44 w-auto object-contain"
            style={{ mixBlendMode: 'multiply' }}
          />
        </Link>

        {/* Kategori Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="hidden lg:flex items-center gap-1 text-slate-600 hover:text-indigo-600 text-sm font-semibold px-3 h-9">
              <BookOpen className="w-4 h-4" />
              Kategoriler
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 p-0 rounded-2xl shadow-xl" align="start">
            <div className="p-3 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-t-2xl border-b border-indigo-100">
              <p className="font-bold text-slate-800 text-sm">Tüm Kategoriler</p>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-1.5 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {COURSE_CATEGORIES.map((cat) => (
                <DropdownMenuItem
                  key={cat.id}
                  className="rounded-lg py-2 px-3 cursor-pointer hover:bg-indigo-50 text-sm"
                  onSelect={(e) => { e.preventDefault(); navigate(`/courses/${cat.slug}`); }}
                >
                  <span className="font-medium text-slate-700 hover:text-indigo-600">{cat.name}</span>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="search"
            placeholder="Kurs veya eğitmen ara..."
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none placeholder:text-slate-400 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Eğitimci ol / Eğitmen paneli */}
          {user?.role === 'instructor' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/instructor')}
              className="hidden md:flex rounded-full text-indigo-600 border-indigo-200 hover:bg-indigo-600 hover:text-white text-xs px-4 h-8 font-semibold transition-all"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              Eğitmen Paneli
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/become-instructor')}
              className="hidden md:flex rounded-full text-indigo-600 border-indigo-200 hover:bg-indigo-600 hover:text-white text-xs px-4 h-8 font-semibold transition-all"
            >
              <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
              Eğitimci Ol
            </Button>
          )}

          {/* Favorites with Hover Popover */}
          {isAuthenticated && (
            <HoverPopover content={<FavoritesPopoverContent />}>
              <button onClick={() => navigate('/favorites')} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-pink-500 hover:bg-pink-50 transition-all relative">
                <Heart className="w-4.5 h-4.5" />
              </button>
            </HoverPopover>
          )}

          {/* Cart with Hover Popover */}
          <HoverPopover content={<CartPopoverContent />}>
            <button onClick={() => navigate('/cart')} className="w-9 h-9 rounded-full flex items-center justify-center relative text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
              <ShoppingCart className="w-[18px] h-[18px]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-[#0D9488] text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-md shadow-teal-200 ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </button>
          </HoverPopover>

          {/* Notifications with Hover Popover */}
          {isAuthenticated && (
            <HoverPopover content={<NotificationsPopoverContent />} width="w-96">
              <button onClick={() => navigate('/notifications')} className="w-8 h-8 rounded-full flex items-center justify-center relative text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-all">
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            </HoverPopover>
          )}

          {/* Divider */}
          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-full border-2 border-slate-200 hover:border-indigo-300 transition-all overflow-hidden">
                {isAuthenticated && user ? (
                  <Avatar className="w-full h-full">
                    <AvatarImage src={user.profile_image || ''} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-xs">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60 mt-2 p-2 rounded-2xl shadow-xl" align="end" forceMount>
              {isAuthenticated ? (
                <>
                  {/* User info */}
                  <div className="flex items-center gap-3 p-3 bg-indigo-50/60 rounded-xl mb-2">
                    <Avatar className="h-9 w-9 border-2 border-white shadow-sm shrink-0">
                      <AvatarImage src={user?.profile_image || ''} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-xs">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm text-slate-900 truncate">{user?.first_name} {user?.last_name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="my-1.5" />

                  <DropdownMenuItem onClick={() => navigate('/home/learning')} className="rounded-lg py-2 cursor-pointer font-bold text-indigo-700 hover:bg-indigo-50 text-sm">
                    <PlayCircle className="w-4 h-4 mr-3 text-indigo-500" /> Eğitimlerim
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/home/gamification')} className="rounded-lg py-2 cursor-pointer text-sm">
                    <Trophy className="w-4 h-4 mr-3 text-amber-500" /> Başarılarım
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/home/certificates')} className="rounded-lg py-2 cursor-pointer text-sm">
                    <Award className="w-4 h-4 mr-3 text-emerald-500" /> Sertifikalarım
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/home/books')} className="rounded-lg py-2 cursor-pointer text-sm">
                    <BookMarked className="w-4 h-4 mr-3 text-violet-500" /> Kitaplarım
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/favorites')} className="rounded-lg py-2 cursor-pointer text-sm">
                    <Heart className="w-4 h-4 mr-3 text-pink-500" /> Favorilerim
                    {favorites.length > 0 && <span className="ml-auto text-xs bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full font-bold">{favorites.length}</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/cart')} className="rounded-lg py-2 cursor-pointer text-sm">
                    <ShoppingCart className="w-4 h-4 mr-3 text-blue-500" /> Sepetim
                    {cartCount > 0 && <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">{cartCount}</span>}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1.5" />
                  <div className="px-3 py-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İletişim & Bildirimler</p>
                  </div>
                  <DropdownMenuItem onClick={() => navigate('/notifications')} className="rounded-lg py-2 cursor-pointer text-sm">
                    <Bell className="w-4 h-4 mr-3 text-violet-500" /> Bildirimler
                    {unreadCount > 0 && <span className="ml-auto text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/messages')} className="rounded-lg py-2 cursor-pointer text-sm">
                    <MessageSquare className="w-4 h-4 mr-3 text-cyan-500" /> Mesajlar
                  </DropdownMenuItem>

                  {user?.role === 'instructor' && (
                    <>
                      <DropdownMenuSeparator className="my-1.5" />
                      <DropdownMenuItem onClick={() => navigate('/instructor')} className="rounded-lg py-2 cursor-pointer text-blue-700 font-semibold text-sm">
                        <BarChart3 className="w-4 h-4 mr-3" /> Eğitmen Paneli
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/instructor/courses/create')} className="rounded-lg py-2 cursor-pointer text-sm">
                        <BookOpen className="w-4 h-4 mr-3" /> Kurs Oluşturucu
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator className="my-1.5" />
                  <DropdownMenuItem onClick={() => navigate('/home/settings/profile')} className="rounded-lg py-2 cursor-pointer text-sm">
                    <Settings className="w-4 h-4 mr-3 text-slate-400" /> Ayarlar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { logout(); navigate('/login'); }}
                    className="rounded-lg py-2 cursor-pointer text-red-600 text-sm hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-3" /> Çıkış Yap
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => navigate('/login')} className="rounded-lg py-2.5 cursor-pointer font-semibold text-center justify-center text-sm">
                    Giriş Yap
                  </DropdownMenuItem>
                  <div className="p-1.5">
                    <Button onClick={() => navigate('/register')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm h-9">
                      Kayıt Ol
                    </Button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
