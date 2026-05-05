import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose
} from '@/components/ui/responsive-drawer';
// import { useAuth } from '@/contexts/AuthContext';
// import { useQuery } from '@tanstack/react-query';
// import { cartAPI } from '@/lib/api';
import {
  Menu,
  Search,
  ShoppingCart,
  User,
  Heart,
  BookOpen,
  Settings,
  LogOut,
  Home,
  GraduationCap,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const MobileHeader: React.FC = () => {
  // const { user, logout, isAuthenticated } = useAuth();
  const user = null;
  const logout = () => { };
  const isAuthenticated = false;
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // const { data: cartData, isLoading: cartLoading, error: cartError } = useQuery({
  //   queryKey: ['cart'],
  //   queryFn: cartAPI.getCart,
  //   enabled: isAuthenticated,
  //   retry: 2,
  //   staleTime: 5 * 60 * 1000, // 5 minutes
  // });
  const cartData = null;
  const cartLoading = false;
  const cartError = null;

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const query = searchQuery.trim();

      // Add to recent searches
      const newRecentSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(newRecentSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));

      navigate(`/courses?q=${encodeURIComponent(query)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  }, [searchQuery, recentSearches, navigate]);

  const handleLogout = useCallback(() => {
    logout();
    setIsMenuOpen(false);
    navigate('/');
  }, [logout, navigate]);

  const menuItems = useMemo(() => [
    { icon: Home, label: 'Ana Sayfa', href: '/' },
    { icon: BookOpen, label: 'Kurslar', href: '/courses' },
    { icon: Heart, label: 'Favoriler', href: '/favorites' },
    { icon: ShoppingCart, label: 'Sepet', href: '/cart', badge: cartData?.items?.length },
  ], [cartData?.items?.length]);

  const userMenuItems = isAuthenticated ? [
    { icon: User, label: 'Profil', href: '/profile' },
    { icon: GraduationCap, label: 'Kurslarım', href: '/my-courses' },
    { icon: Settings, label: 'Ayarlar', href: '/settings' },
  ] : [];

  return (
    <header className="lg:hidden sticky top-0 z-50 bg-background border-b">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">EduPlatform</span>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Search Button */}
          <Drawer open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Kurs ara"
              >
                <Search className="w-5 h-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Kurs Ara</DrawerTitle>
              </DrawerHeader>
              <div className="p-4 space-y-4">
                <form onSubmit={handleSearch} className="flex space-x-2">
                  <Input
                    placeholder="Kurs, eğitmen, konu ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                    autoFocus
                    aria-label="Arama sorgusu"
                  />
                  <Button type="submit" disabled={!searchQuery.trim()}>
                    <Search className="w-4 h-4" />
                  </Button>
                </form>

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Son Aramalar</h4>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchQuery(search);
                            const form = new Event('submit', { bubbles: true, cancelable: true });
                            handleSearch(form as any);
                          }}
                          className="text-xs h-7"
                        >
                          {search}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DrawerContent>
          </Drawer>

          {/* Cart */}
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/cart')}
              className="relative"
              aria-label={`Sepet ${cartData?.items?.length || 0} ürün`}
            >
              {cartLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : cartError ? (
                <AlertCircle className="w-5 h-5 text-destructive" />
              ) : (
                <ShoppingCart className="w-5 h-5" />
              )}
              {cartData?.items?.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs animate-pulse">
                  {cartData.items.length}
                </Badge>
              )}
            </Button>
          )}

          {/* Menu */}
          <Drawer open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Menüyü aç"
                aria-expanded={isMenuOpen}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[80vh] animate-in slide-in-from-bottom duration-300">
              <DrawerHeader className="flex flex-row items-center justify-between">
                <DrawerTitle>Menü</DrawerTitle>
                <DrawerClose asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Menüyü kapat"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </DrawerClose>
              </DrawerHeader>
              <div className="flex-1 overflow-y-auto">
                {/* User Info */}
                {isAuthenticated && user && (
                  <div className="px-4 py-3 border-b bg-muted/30">
                    <div className="flex items-center space-x-3">
                      <Avatar className="ring-2 ring-primary/20">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Menu Items */}
                <div className="py-2">
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-all duration-200 active:bg-muted/80 focus:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
                      role="menuitem"
                      tabIndex={0}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {item.badge && item.badge > 0 && (
                        <Badge variant="secondary" className="animate-pulse">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>

                {/* User Menu Items */}
                {isAuthenticated && userMenuItems.length > 0 && (
                  <>
                    <div className="border-t my-2" />
                    <div className="py-2">
                      {userMenuItems.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3 hover:bg-muted transition-all duration-200 active:bg-muted/80 focus:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
                          role="menuitem"
                          tabIndex={0}
                        >
                          <item.icon className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </>
                )}

                {/* Auth Actions */}
                <div className="border-t mt-2 pt-2">
                  {isAuthenticated ? (
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-4 py-3 w-full text-left hover:bg-destructive/10 transition-all duration-200 text-destructive focus:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-destructive/20 rounded-md mx-2"
                      role="menuitem"
                      tabIndex={0}
                      aria-label="Hesaptan çıkış yap"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Çıkış Yap</span>
                    </button>
                  ) : (
                    <div className="px-4 py-3 space-y-2">
                      <Button
                        className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        onClick={() => {
                          navigate('/login');
                          setIsMenuOpen(false);
                        }}
                      >
                        Giriş Yap
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        onClick={() => {
                          navigate('/register');
                          setIsMenuOpen(false);
                        }}
                      >
                        Kayıt Ol
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </header>
  );
};