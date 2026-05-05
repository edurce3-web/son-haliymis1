import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useContactSubmit } from '@/hooks/useApi';
import { Mail, Phone, Send, Check, Loader2, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactFormProps {
  className?: string;
  variant?: 'default' | 'modal' | 'page';
  onSuccess?: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({ 
  className, 
  variant = 'default',
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const { submit, loading, error } = useContactSubmit();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      return;
    }

    try {
      await submit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        subject: formData.subject.trim(),
        message: formData.message.trim()
      });
      
      setIsSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      
      onSuccess?.();
      
      // Reset success state after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isFormValid = () => {
    return formData.name.trim() && 
           isValidEmail(formData.email) && 
           formData.subject.trim() && 
           formData.message.trim();
  };

  const formContent = (
    <>
      {isSuccess ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h4 className="text-xl font-semibold text-green-600 mb-2">Mesajınız Gönderildi!</h4>
          <p className="text-muted-foreground">
            En kısa sürede size geri dönüş yapacağız. Mesajınız için teşekkür ederiz.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                Ad Soyad *
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Adınız ve soyadınız"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                required
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                E-posta *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ornek@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
                className="h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                Telefon
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+90 (555) 123 45 67"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject" className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Konu *
              </Label>
              <Input
                id="subject"
                name="subject"
                type="text"
                placeholder="Mesajınızın konusu"
                value={formData.subject}
                onChange={handleChange}
                disabled={loading}
                required
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">
              Mesaj *
            </Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Mesajınızı buraya yazın..."
              value={formData.message}
              onChange={handleChange}
              disabled={loading}
              required
              rows={6}
              className="resize-none"
            />
          </div>

          <Button 
            type="submit"
            size="lg"
            disabled={loading || !isFormValid()}
            className="w-full bg-gradient-primary hover:shadow-course-hover"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Mesaj Gönder
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            * işaretli alanlar zorunludur. Kişisel verileriniz gizlilik politikamız kapsamında korunmaktadır.
          </p>
        </form>
      )}
    </>
  );

  if (variant === 'modal') {
    return (
      <div className={cn("p-6", className)}>
        {formContent}
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div className={cn("max-w-2xl mx-auto", className)}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Bizimle İletişime Geçin</h2>
          <p className="text-muted-foreground">
            Sorularınız, önerileriniz veya destek talepleriniz için bize ulaşın. 
            En kısa sürede size geri dönüş yapacağız.
          </p>
        </div>
        
        <Card>
          <CardContent className="p-8">
            {formContent}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default variant
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
            <Mail className="w-4 h-4 text-primary" />
          </div>
          İletişim Formu
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
};
