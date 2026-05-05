import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { paymentAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  CreditCard,
  Lock,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface PaymentFormProps {
  items: Array<{
    id: number;
    title: string;
    price: number;
    instructor: string;
    thumbnail?: string;
  }>;
  totalAmount: number;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

interface PaymentData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  email: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  items,
  totalAmount,
  onSuccess,
  onCancel
}) => {
  const [paymentData, setPaymentData] = useState<PaymentData>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    email: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'TR'
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'payment' | 'billing' | 'review'>('payment');

  const processPaymentMutation = useMutation({
    mutationFn: paymentAPI.processPayment,
    onSuccess: (data) => {
      toast.success('Ödeme başarıyla tamamlandı!');
      onSuccess(data.paymentId);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ödeme işlemi başarısız oldu');
    }
  });

  const validateCardNumber = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    return /^\d{16}$/.test(cleaned);
  };

  const validateExpiryDate = (month: string, year: string) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const expYear = parseInt(year);
    const expMonth = parseInt(month);

    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;

    return true;
  };

  const validateCVV = (cvv: string) => {
    return /^\d{3,4}$/.test(cvv);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateStep = (currentStep: string) => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'payment') {
      if (!validateCardNumber(paymentData.cardNumber)) {
        newErrors.cardNumber = 'Geçerli bir kart numarası girin';
      }
      if (!validateExpiryDate(paymentData.expiryMonth, paymentData.expiryYear)) {
        newErrors.expiry = 'Geçerli bir son kullanma tarihi girin';
      }
      if (!validateCVV(paymentData.cvv)) {
        newErrors.cvv = 'Geçerli bir CVV girin';
      }
      if (!paymentData.cardholderName.trim()) {
        newErrors.cardholderName = 'Kart sahibinin adını girin';
      }
      if (!validateEmail(paymentData.email)) {
        newErrors.email = 'Geçerli bir e-posta adresi girin';
      }
    }

    if (currentStep === 'billing') {
      if (!paymentData.billingAddress.street.trim()) {
        newErrors.street = 'Adres bilgisi gerekli';
      }
      if (!paymentData.billingAddress.city.trim()) {
        newErrors.city = 'Şehir bilgisi gerekli';
      }
      if (!paymentData.billingAddress.zipCode.trim()) {
        newErrors.zipCode = 'Posta kodu gerekli';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === 'payment') setStep('billing');
      else if (step === 'billing') setStep('review');
    }
  };

  const handleBack = () => {
    if (step === 'billing') setStep('payment');
    else if (step === 'review') setStep('billing');
  };

  const handleSubmit = () => {
    if (validateStep('review')) {
      const paymentRequest = {
        items: items.map(item => ({
          courseId: item.id,
          price: item.price
        })),
        totalAmount,
        paymentMethod: {
          cardNumber: paymentData.cardNumber.replace(/\s/g, ''),
          expiryMonth: paymentData.expiryMonth,
          expiryYear: paymentData.expiryYear,
          cvv: paymentData.cvv,
          cardholderName: paymentData.cardholderName
        },
        billingAddress: paymentData.billingAddress,
        email: paymentData.email
      };

      processPaymentMutation.mutate(paymentRequest);
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    return formatted.substring(0, 19);
  };

  const getCardType = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'Visa';
    if (cleaned.startsWith('5')) return 'Mastercard';
    if (cleaned.startsWith('3')) return 'American Express';
    return 'Kart';
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0');
    return { value: month, label: month };
  });

  const years = Array.from({ length: 10 }, (_, i) => {
    const year = (new Date().getFullYear() + i).toString();
    return { value: year, label: year };
  });

  const countries = [
    { value: 'TR', label: 'Türkiye' },
    { value: 'US', label: 'Amerika Birleşik Devletleri' },
    { value: 'GB', label: 'Birleşik Krallık' },
    { value: 'DE', label: 'Almanya' },
    { value: 'FR', label: 'Fransa' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Sipariş Özeti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-start space-x-3">
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-16 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.instructor}</p>
                    <p className="font-semibold text-sm">₺{item.price}</p>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="flex justify-between items-center">
                <span className="font-semibold">Toplam:</span>
                <span className="font-bold text-lg">₺{totalAmount}</span>
              </div>

              <div className="flex items-center text-sm text-muted-foreground">
                <Shield className="w-4 h-4 mr-2" />
                30 gün para iade garantisi
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Ödeme Bilgileri
              </CardTitle>

              {/* Progress Steps */}
              <div className="flex items-center space-x-4 mt-4">
                <div className={`flex items-center ${step === 'payment' ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'payment' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                    1
                  </div>
                  <span className="ml-2 text-sm">Kart Bilgileri</span>
                </div>
                <div className={`flex items-center ${step === 'billing' ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'billing' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                    2
                  </div>
                  <span className="ml-2 text-sm">Fatura Adresi</span>
                </div>
                <div className={`flex items-center ${step === 'review' ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'review' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                    3
                  </div>
                  <span className="ml-2 text-sm">Onay</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {step === 'payment' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta Adresi</Label>
                    <Input
                      id="email"
                      type="email"
                      value={paymentData.email}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="ornek@email.com"
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Kart Numarası</Label>
                    <div className="relative">
                      <Input
                        id="cardNumber"
                        value={paymentData.cardNumber}
                        onChange={(e) => setPaymentData(prev => ({
                          ...prev,
                          cardNumber: formatCardNumber(e.target.value)
                        }))}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                      <Badge variant="outline" className="absolute right-2 top-1/2 -translate-y-1/2">
                        {getCardType(paymentData.cardNumber)}
                      </Badge>
                    </div>
                    {errors.cardNumber && <p className="text-sm text-destructive">{errors.cardNumber}</p>}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Ay</Label>
                      <Select
                        value={paymentData.expiryMonth}
                        onValueChange={(value) => setPaymentData(prev => ({ ...prev, expiryMonth: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Ay" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map(month => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Yıl</Label>
                      <Select
                        value={paymentData.expiryYear}
                        onValueChange={(value) => setPaymentData(prev => ({ ...prev, expiryYear: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Yıl" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map(year => (
                            <SelectItem key={year.value} value={year.value}>
                              {year.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        value={paymentData.cvv}
                        onChange={(e) => setPaymentData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  {errors.expiry && <p className="text-sm text-destructive">{errors.expiry}</p>}
                  {errors.cvv && <p className="text-sm text-destructive">{errors.cvv}</p>}

                  <div className="space-y-2">
                    <Label htmlFor="cardholderName">Kart Sahibinin Adı</Label>
                    <Input
                      id="cardholderName"
                      value={paymentData.cardholderName}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, cardholderName: e.target.value }))}
                      placeholder="Ad Soyad"
                    />
                    {errors.cardholderName && <p className="text-sm text-destructive">{errors.cardholderName}</p>}
                  </div>
                </div>
              )}

              {step === 'billing' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Adres</Label>
                    <Input
                      id="street"
                      value={paymentData.billingAddress.street}
                      onChange={(e) => setPaymentData(prev => ({
                        ...prev,
                        billingAddress: { ...prev.billingAddress, street: e.target.value }
                      }))}
                      placeholder="Sokak, Mahalle, No"
                    />
                    {errors.street && <p className="text-sm text-destructive">{errors.street}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Şehir</Label>
                      <Input
                        id="city"
                        value={paymentData.billingAddress.city}
                        onChange={(e) => setPaymentData(prev => ({
                          ...prev,
                          billingAddress: { ...prev.billingAddress, city: e.target.value }
                        }))}
                        placeholder="İstanbul"
                      />
                      {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">İl/Bölge</Label>
                      <Input
                        id="state"
                        value={paymentData.billingAddress.state}
                        onChange={(e) => setPaymentData(prev => ({
                          ...prev,
                          billingAddress: { ...prev.billingAddress, state: e.target.value }
                        }))}
                        placeholder="Marmara"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Posta Kodu</Label>
                      <Input
                        id="zipCode"
                        value={paymentData.billingAddress.zipCode}
                        onChange={(e) => setPaymentData(prev => ({
                          ...prev,
                          billingAddress: { ...prev.billingAddress, zipCode: e.target.value }
                        }))}
                        placeholder="34000"
                      />
                      {errors.zipCode && <p className="text-sm text-destructive">{errors.zipCode}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Ülke</Label>
                      <Select
                        value={paymentData.billingAddress.country}
                        onValueChange={(value) => setPaymentData(prev => ({
                          ...prev,
                          billingAddress: { ...prev.billingAddress, country: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map(country => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {step === 'review' && (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Ödeme Özeti</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Kart:</span>
                        <span>**** **** **** {paymentData.cardNumber.slice(-4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>E-posta:</span>
                        <span>{paymentData.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Toplam Tutar:</span>
                        <span className="font-semibold">₺{totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span>Ödeme bilgileriniz SSL ile şifrelenir ve güvenli bir şekilde işlenir.</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
                <div>
                  {step !== 'payment' && (
                    <Button variant="outline" onClick={handleBack}>
                      Geri
                    </Button>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={onCancel}>
                    İptal
                  </Button>

                  {step !== 'review' ? (
                    <Button onClick={handleNext}>
                      İleri
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={processPaymentMutation.isPending}
                      className="min-w-[120px]"
                    >
                      {processPaymentMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          İşleniyor...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Ödemeyi Tamamla
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
