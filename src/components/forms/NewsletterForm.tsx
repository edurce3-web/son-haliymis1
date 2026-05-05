import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useNewsletterSubscribe } from '@/hooks/useApi';
import { Mail, Send, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsletterFormProps {
  className?: string;
  variant?: 'default' | 'compact' | 'hero';
}

export const NewsletterForm: React.FC<NewsletterFormProps> = ({ 
  className, 
  variant = 'default' 
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { submit, loading, error } = useNewsletterSubscribe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) return;

    try {
      await submit({ email: email.trim(), name: name.trim() || undefined });
      setIsSuccess(true);
      setEmail('');
      setName('');
      
      // Reset success state after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  if (variant === 'compact') {
    return (
      <div className={cn("flex gap-2", className)}>
        <div className="flex-1 relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="E-posta adresiniz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            disabled={loading}
          />
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={loading || !isValidEmail(email) || isSuccess}
          className="px-6"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSuccess ? (
            <Check className="w-4 h-4" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <Card className={cn("bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20", className)}>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-primary to-purple-500 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">En Son Kursları Kaçırmayın!</h3>
            <p className="text-muted-foreground">
              Haftalık bültenimize abone olun ve yeni kurslar, indirimler ve özel içeriklerden ilk siz haberdar olun.
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-green-600 mb-2">Başarıyla Abone Oldunuz!</h4>
              <p className="text-muted-foreground">
                E-posta adresinizi doğrulamak için gelen kutunuzu kontrol edin.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Adınız (isteğe bağlı)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="h-12"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="E-posta adresiniz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit"
                size="lg"
                disabled={loading || !isValidEmail(email)}
                className="w-full bg-gradient-primary hover:shadow-course-hover"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Abone Olunuyor...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Bültene Abone Ol
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                İstediğiniz zaman abonelikten çıkabilirsiniz. Gizlilik politikamızı okuyun.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold">Bülten Aboneliği</h4>
            <p className="text-sm text-muted-foreground">Yeni kurslardan haberdar olun</p>
          </div>
        </div>

        {isSuccess ? (
          <div className="text-center py-4">
            <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-green-600 font-medium">Başarıyla abone oldunuz!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="text"
              placeholder="Adınız (isteğe bağlı)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="E-posta adresiniz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={loading}
                required
              />
            </div>
            <Button 
              type="submit"
              disabled={loading || !isValidEmail(email)}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Abone Olunuyor...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Abone Ol
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};
