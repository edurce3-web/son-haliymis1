import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import CategoryMegaMenu from './CategoryMegaMenu';
import api from '@/services/api';
import { API_BASE_URL } from '@/lib/api';
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
// Türler backend'deki services/notificationService.js TYPES ile aynı
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'purchase': return '🛒';
    case 'sale': return '💰';
    case 'enrollment': return '📚';
    case 'announcement': return '📢';
    case 'message': return '💬';
    case 'question': return '❓';
    case 'answer': return '↩️';
    case 'achievement': return '🏆';
    case 'system': return '⚙️';
    case 'review': return '⭐';
    default: return '🔔';
  }
};

/** "3 dakika önce" — açılır kutuda tam tarihten daha okunur. */
const notifTimeAgo = (date: string) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
};

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, loading } = useAuth();

  // Determine instructor status immediately from localStorage to avoid flicker on refresh
  const isInstructor = user?.role === 'instructor' || user?.is_instructor === true ||
    (() => {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.role === 'instructor' || parsed.is_instructor === true;
        }
      } catch { }
      return false;
    })();
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

    // Bildirim sayfasında okundu/silindi işlemi yapılınca zil rozeti de güncellensin
    const handleNotificationsUpdate = () => {
      if (isAuthenticated) fetchNotifications();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    window.addEventListener('notificationsUpdated', handleNotificationsUpdate);

    // Also listen to possible storage changes if token changes
    const handleStorageChange = () => {
      if (isAuthenticated) {
        fetchCartData();
        fetchFavorites();
      }
    }
    window.addEventListener('storage', handleStorageChange);

    // Yeni bildirimlerin sayfa yenilemeden düşmesi için düzenli yoklama
    const notifTimer = isAuthenticated
      ? setInterval(() => fetchNotifications(), 60_000)
      : null;

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdate);
      window.removeEventListener('storage', handleStorageChange);
      if (notifTimer) clearInterval(notifTimer);
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
      <div className="p-3 bg-brand-50 rounded-t-2xl border-b flex items-center justify-between">
        <p className="font-bold text-slate-800 text-sm">Sepetim ({cartCount})</p>
        {cartCount > 0 && <span className="text-xs font-bold text-brand-700">₺{cartTotal.toFixed(2)}</span>}
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
              <div className="w-14 h-10 bg-brand-50 rounded-lg flex-shrink-0 overflow-hidden">
                {(item.image_path || item.image_url) ? (
                  <img src={item.image_path || item.image_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-brand-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{item.title}</p>
                <p className="text-[11px] text-slate-500">{item.instructor_name || `${item.instructor_first_name || ''} ${item.instructor_last_name || ''}`.trim()}</p>
                <p className="text-xs font-bold text-brand-700">₺{parseFloat(item.price).toFixed(2)}</p>
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
          <Button onClick={() => navigate('/cart')} className="w-full bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-sm h-9">
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
                  <div className="w-full h-full flex items-center justify-center bg-brand-50">
                    <BookOpen className="w-6 h-6 text-brand-300" />
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
                  className="mt-2 w-full py-1.5 text-xs font-bold text-brand-700 border border-brand-700 rounded-md hover:bg-brand-700 hover:text-white transition-all text-center"
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
      <div className="p-3 bg-brand-50 rounded-t-2xl border-b flex items-center justify-between">
        <p className="font-bold text-slate-800 text-sm">
          Bildirimler {unreadCount > 0 && <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
        </p>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="text-[11px] text-brand-700 hover:text-brand-900 font-medium flex items-center gap-1">
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
                !notif.is_read && "bg-brand-50/40"
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
                <p className="text-[10px] text-slate-400 mt-1">{notifTimeAgo(notif.created_at)}</p>
              </div>
              {!notif.is_read && <div className="w-2 h-2 bg-brand-600 rounded-full mt-2 flex-shrink-0" />}
            </div>
          ))
        )}
      </div>
      <div className="p-3 border-t bg-slate-50/50 rounded-b-2xl">
        <Button onClick={() => navigate('/notifications')} variant="outline" className="w-full rounded-xl text-sm h-9 border-brand-200 text-brand-700 hover:bg-brand-50">
          Tüm Bildirimleri Gör
        </Button>
      </div>
    </div>
  );


  // ─── Kullanıcı Menüsü İçeriği ───
  const MenuRow = ({
    onClick, label, badge, tone = 'default',
  }: {
    onClick: () => void; label: string;
    badge?: React.ReactNode; tone?: 'default' | 'primary' | 'danger';
  }) => (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors',
        tone === 'danger' ? 'text-red-600 hover:bg-red-50'
          : tone === 'primary' ? 'font-semibold text-brand-800 hover:bg-brand-50'
            : 'text-slate-700 hover:bg-slate-50'
      )}
    >
      <span className="flex-1">{label}</span>
      {badge}
    </button>
  );

  const UserMenuContent = () => (
    <div className="p-2">
      {isAuthenticated ? (
        <>
          <div className="flex items-center gap-3 p-3 bg-brand-50/70 rounded-xl mb-2">
            <Avatar className="h-9 w-9 border-2 border-white shadow-sm shrink-0">
              <AvatarImage src={user?.profile_image || ''} className="object-cover" />
              <AvatarFallback className="bg-brand-700 text-white font-bold text-xs">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="font-bold text-sm text-slate-900 truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          <MenuRow onClick={() => navigate('/home/learning')} tone="primary"
            label="Eğitimlerim" />
          <MenuRow onClick={() => navigate('/home/gamification')}
            label="Başarılarım" />
          <MenuRow onClick={() => navigate('/home/certificates')}
            label="Sertifikalarım" />
          <MenuRow onClick={() => navigate('/home/books')}
            label="Kitaplarım" />
          <MenuRow onClick={() => navigate('/favorites')}
            label="Favorilerim"
            badge={favorites.length > 0 && <span className="text-xs bg-brand-100 text-brand-800 px-1.5 py-0.5 rounded-full font-bold">{favorites.length}</span>} />
          <MenuRow onClick={() => navigate('/cart')}
            label="Sepetim"
            badge={cartCount > 0 && <span className="text-xs bg-brand-100 text-brand-800 px-1.5 py-0.5 rounded-full font-bold">{cartCount}</span>} />

          <div className="h-px bg-slate-100 my-1.5" />
          <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">İletişim &amp; Bildirimler</p>
          <MenuRow onClick={() => navigate('/notifications')}
            label="Bildirimler"
            badge={unreadCount > 0 && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>} />
          <MenuRow onClick={() => navigate('/messages')}
            label="Mesajlar" />

          {isInstructor && (
            <>
              <div className="h-px bg-slate-100 my-1.5" />
              <MenuRow onClick={() => navigate('/instructor')} tone="primary"
                label="Eğitmen Paneli" />
              <MenuRow onClick={() => navigate('/instructor/courses/create')}
                label="Kurs Oluşturucu" />
            </>
          )}

          <div className="h-px bg-slate-100 my-1.5" />
          <MenuRow onClick={() => navigate('/home/settings/profile')}
            label="Ayarlar" />
          <MenuRow onClick={() => { logout(); navigate('/login'); }} tone="danger"
            label="Çıkış Yap" />
        </>
      ) : (
        <div className="p-1.5 space-y-2">
          <Button onClick={() => navigate('/register')} className="w-full bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-sm h-9">
            Kayıt Ol
          </Button>
          <Button onClick={() => navigate('/login')} variant="outline" className="w-full rounded-xl text-sm h-9">
            Giriş Yap
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur-xl shadow-sm">
      {/* Top gradient line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800" />

      <div className="container flex h-16 items-center px-4 gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center mr-4 shrink-0" aria-label="Edurce ana sayfa">
          <img src="/logo-wordmark.png" alt="Edurce" className="h-[30px] w-auto" />
        </Link>

        {/* Kategoriler — fareyle üzerine gelince açılan iki sütunlu menü.
            Veritabanındaki gerçek kategorileri ve kurs sayılarını gösterir;
            eskiden sabit bir listeden besleniyordu. */}
        <CategoryMegaMenu />

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-slate-400 group-focus-within:text-brand-600 transition-colors" />
          <input
            type="search"
            placeholder="Kurs veya eğitmen ara"
            className="w-full h-10 pl-10 pr-4 rounded-xl border-[1.5px] border-slate-200 bg-slate-50/70 text-[14px] hover:border-slate-300 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none placeholder:text-slate-400 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto">
          {/*
              Eğitmen bağlantısı — düğme değil, menü bağlantısı.
              Çerçeveli bir düğme, başlıktaki tek eylem çağrısı gibi
              görünüp gerçek eylemlerin (sepet, giriş) önüne geçiyordu.
          */}
          {!loading && (
            <button
              onClick={() => navigate(isInstructor ? '/instructor' : '/become-instructor')}
              className="hidden md:inline-flex items-center h-8 px-3 text-[13.5px] font-semibold text-slate-600 hover:text-brand-800 transition-colors"
            >
              {isInstructor ? 'Eğitmen paneli' : 'Eğitimci ol'}
            </button>
          )}

          {/* Cart with Hover Popover */}
          <HoverPopover content={<CartPopoverContent />}>
            <button onClick={() => navigate('/cart')} className="w-9 h-9 rounded-full flex items-center justify-center relative text-slate-500 hover:text-brand-700 hover:bg-brand-50 transition-all">
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
              <button onClick={() => navigate('/notifications')} className="w-8 h-8 rounded-full flex items-center justify-center relative text-slate-500 hover:text-brand-700 hover:bg-brand-50 transition-all">
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </HoverPopover>
          )}

          {/* Divider */}
          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Kullanıcı menüsü — sepet ve bildirim menüleri gibi FARE ÜZERİNE
              GELİNCE açılır; tıklamak gerekmiyor. */}
          <HoverPopover content={<UserMenuContent />} width="w-60">
            <button
              onClick={() => navigate(isAuthenticated ? '/home/settings/profile' : '/login')}
              aria-label={isAuthenticated ? 'Hesap menüsü' : 'Giriş yap'}
              className="w-8 h-8 rounded-full border-2 border-slate-200 hover:border-brand-300 transition-all overflow-hidden"
            >
              {isAuthenticated && user ? (
                <Avatar className="w-full h-full">
                  <AvatarImage src={user.profile_image || ''} className="object-cover" />
                  <AvatarFallback className="bg-brand-700 text-white font-bold text-xs">
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
              )}
            </button>
          </HoverPopover>
        </div>
      </div>
    </header>
  );
};

export default Header;
