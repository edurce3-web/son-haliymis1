import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, LogIn, UserCheck } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  requiresInstructor?: boolean;
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresAuth = false,
  requiresInstructor = false,
  fallbackPath = '/login'
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Yetkilendirme kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  // Check authentication requirement
  if (requiresAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md text-center">
          <p className="font-montserrat text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-700">
            Giriş gerekli
          </p>
          <h1 className="font-montserrat text-[26px] sm:text-[30px] font-extrabold text-slate-900 tracking-[-0.025em] mt-3">
            Bu sayfa hesabına özel
          </h1>
          <span className="block w-12 h-1 rounded-full bg-brand-700 mx-auto mt-5" />
          <p className="text-[15.5px] text-slate-600 leading-[1.7] mt-5">
            Devam etmek için giriş yap. Hesabın yoksa dakikalar içinde
            oluşturabilirsin.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 mt-8">
            <a
              href={`/login?redirect=${encodeURIComponent(location.pathname)}`}
              className="flex-1 h-11 leading-[44px] rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-[15px] font-semibold transition-colors"
            >
              Giriş yap
            </a>
            <a
              href="/register"
              className="flex-1 h-11 leading-[42px] rounded-lg border border-slate-300 hover:border-brand-400 hover:text-brand-800 text-slate-700 text-[15px] font-semibold transition-colors"
            >
              Hesap oluştur
            </a>
          </div>

          <a
            href="/forgot-password"
            className="inline-block text-[13.5px] font-medium text-slate-500 hover:text-brand-800 transition-colors mt-5"
          >
            Şifremi unuttum
          </a>
        </div>
      </div>
    );
  }

  // Check instructor requirement
  if (requiresInstructor && (!user || (user.role !== 'instructor' && !user.is_instructor))) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle>Eğitmen Yetkisi Gerekli</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Bu sayfaya erişmek için eğitmen hesabınızın olması gerekiyor.
            </p>
            <div className="space-y-2">
              <Button 
                asChild 
                className="w-full"
              >
                <a href="/instructor">
                  Eğitmen Ol
                </a>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                className="w-full"
              >
                <a href="/">
                  Ana Sayfaya Dön
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If all checks pass, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
