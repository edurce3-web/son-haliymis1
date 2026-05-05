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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle>Giriş Gerekli</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Bu sayfaya erişmek için giriş yapmanız gerekiyor.
            </p>
            <div className="space-y-2">
              <Button 
                asChild 
                className="w-full"
              >
                <a href={`/login?redirect=${encodeURIComponent(location.pathname)}`}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Giriş Yap
                </a>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                className="w-full"
              >
                <a href="/register">
                  Hesap Oluştur
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
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
