import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  BookOpen,
  Users,
  Heart,
  ShoppingCart,
  User,
  Trophy,
  Wand2,
  TrendingUp,
  Shield,
  BarChart3,
  MessageSquare,
  Lightbulb,
  Smartphone,
  Award,
  Glasses,
  Search,
  Plus,
  Bell,
  PlayCircle
} from 'lucide-react';

export const MobileNavigation: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide navigation on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    {
      icon: Home,
      label: 'Ana Sayfa',
      href: '/',
      show: true,
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: PlayCircle,
      label: 'Eğitimlerim',
      href: '/learning',
      show: isAuthenticated,
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Trophy,
      label: 'Başarılar',
      href: '/gamification',
      show: isAuthenticated,
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      icon: Heart,
      label: 'Favoriler',
      href: '/favorites',
      show: isAuthenticated,
      color: 'from-pink-500 to-pink-600',
    },
    {
      icon: User,
      label: isAuthenticated ? 'Profil' : 'Giriş',
      href: isAuthenticated ? '/profile' : '/login',
      show: true,
      color: 'from-orange-500 to-orange-600',
    },
  ];

  const visibleItems = navItems.filter(item => item.show);

  useEffect(() => {
    const currentIndex = visibleItems.findIndex(item => item.href === location.pathname);
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname, visibleItems]);



  return (
    <>
      <nav className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 h-16",
        "bg-white border-t border-gray-200",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="flex h-full items-center justify-around">
          {visibleItems.map((item, index) => (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 w-full relative",
                activeIndex === index ? "text-[#a435f0]" : "text-gray-400"
              )}
            >
              <item.icon className={cn("w-6 h-6 transition-all", activeIndex === index ? "scale-110" : "")} />
              <span className="text-[10px] font-bold uppercase tracking-tighter line-clamp-1">{item.label}</span>
              {activeIndex === index && (
                <div className="absolute -top-3 w-8 h-1 bg-[#a435f0] rounded-full" />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};
