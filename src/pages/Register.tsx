import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle2, Circle, ArrowLeft, Mail } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import SocialLogin from "@/components/auth/SocialLogin";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import CodeInput from "@/components/auth/CodeInput";

type Step = "details" | "code" | "password";

const RESEND_SECONDS = 60;

const Register = () => {
  const navigate = useNavigate();
  const { registerStart, registerVerify, registerComplete } = useAuth();

  const [step, setStep] = useState<Step>("details");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [verifyToken, setVerifyToken] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    code: "",
    password: "",
    passwordConfirm: "",
    acceptTerms: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => setResendIn(s => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  // Şifre kuralları
  const hasMinLength = formData.password.length >= 8;
  const hasLower = /[a-z]/.test(formData.password);
  const hasUpper = /[A-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(formData.password);

  const criteriaMetCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  const hasEnoughCriteria = criteriaMetCount >= 3;
  const isPasswordValid = hasMinLength && hasEnoughCriteria;
  const passwordsMatch = formData.password.length > 0 && formData.password === formData.passwordConfirm;

  // --- 1. adım: ad, soyad, e-posta ------------------------------------------
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.acceptTerms) {
      toast.error("Kullanım koşullarını kabul etmelisiniz.");
      return;
    }

    setLoading(true);
    try {
      await registerStart({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
      });

      setStep("code");
      setResendIn(RESEND_SECONDS);
      toast.success("Doğrulama kodu gönderildi", {
        description: `${formData.email} adresini kontrol edin.`,
      });
    } catch (error: any) {
      toast.error("Kod gönderilemedi", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendIn > 0) return;
    setLoading(true);
    try {
      await registerStart({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
      });
      setResendIn(RESEND_SECONDS);
      setFormData(prev => ({ ...prev, code: "" }));
      toast.success("Yeni kod gönderildi");
    } catch (error: any) {
      toast.error("Kod gönderilemedi", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // --- 2. adım: kodu doğrula ------------------------------------------------
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await registerVerify(formData.email.trim(), formData.code.trim());
      setVerifyToken(token);
      setStep("password");
      toast.success("E-posta doğrulandı", { description: "Şimdi şifrenizi belirleyin." });
    } catch (error: any) {
      toast.error("Doğrulama başarısız", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // --- 3. adım: şifre belirle, hesabı aç ------------------------------------
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast.error("Şifreniz güvenlik kriterlerini karşılamıyor.");
      return;
    }
    if (!passwordsMatch) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    try {
      await registerComplete({
        email: formData.email.trim(),
        verify_token: verifyToken,
        password: formData.password,
        password_confirm: formData.passwordConfirm,
      });

      toast.success("Kayıt başarılı!", { description: "Aramıza hoş geldiniz!" });
      navigate("/");
    } catch (error: any) {
      toast.error("Kayıt başarısız", { description: error.message });
      // Doğrulama süresi dolmuşsa baştan başlatmak gerekiyor
      if (/baştan|geçersiz|süre/i.test(error.message || "")) {
        setStep("details");
        setVerifyToken("");
        setFormData(prev => ({ ...prev, code: "", password: "", passwordConfirm: "" }));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "h-11 rounded-xl border-slate-200 bg-slate-50/60 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-colors text-sm";

  const stepMeta: Record<Step, { title: string; subtitle: string }> = {
    details: { title: "Hesap oluştur", subtitle: "Başlamak için bilgilerini gir." },
    code: { title: "E-postanı doğrula", subtitle: `${formData.email} adresine 6 haneli bir kod gönderdik.` },
    password: { title: "Şifreni belirle", subtitle: "Hesabını güvence altına alan son adım." },
  };

  return (
    <AuthLayout
      title={<>Öğrenmeye bugün başla</>}
      subtitle="Ücretsiz hesap oluştur, ilk kursuna hemen erişim kazan."
      points={[
        "Kurs oluşturmak ve öğrenmek ücretsiz",
        "Satın aldığın kursa ömür boyu erişirsin",
        "İlerlemen kayıtlı kalır, kaldığın yerden devam edersin",
      ]}
    >
      <div className="space-y-6">

            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                {stepMeta[step].title}
              </h2>
              <p className="text-sm text-slate-500 break-words">
                {stepMeta[step].subtitle}
              </p>
            </div>

            {step === "details" && <SocialLogin />}

            {/* ---------- 1. ADIM: Ad, soyad, e-posta ---------- */}
            {step === "details" && (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">Ad</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Adınız"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      autoComplete="given-name"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">Soyad</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Soyadınız"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      autoComplete="family-name"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">E-posta</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="isim@ornek.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    autoComplete="email"
                    className={inputClass}
                  />
                  <p className="text-xs text-slate-400">Doğrulama kodu bu adrese gönderilecek.</p>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-brand-700 focus:ring-brand-500/30"
                  />
                  <Label htmlFor="acceptTerms" className="text-xs text-slate-500 cursor-pointer font-normal leading-relaxed">
                    <Link to="/terms" className="text-brand-700 hover:text-brand-800 hover:underline">Kullanım Koşulları</Link>
                    'nı ve{" "}
                    <Link to="/privacy" className="text-brand-700 hover:text-brand-800 hover:underline">Gizlilik Politikası</Link>
                    'nı okudum ve kabul ediyorum.
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Kod gönderiliyor...
                    </div>
                  ) : (
                    "Doğrulama Kodu Gönder"
                  )}
                </Button>
              </form>
            )}

            {/* ---------- 2. ADIM: Kod doğrulama ---------- */}
            {step === "code" && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="flex items-center justify-center py-2">
                  <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center">
                    <Mail className="w-7 h-7 text-brand-700" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-sm font-medium text-slate-700">
                    Doğrulama kodu
                  </Label>
                  <CodeInput
                    value={formData.code}
                    onChange={(code) => setFormData(prev => ({ ...prev, code }))}
                  />
                  <p className="text-xs text-slate-400">Kod 10 dakika geçerlidir.</p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || formData.code.length !== 6}
                  className="w-full h-11 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Doğrulanıyor...
                    </div>
                  ) : (
                    "Doğrula"
                  )}
                </Button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    E-postayı değiştir
                  </button>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendIn > 0 || loading}
                    className="text-xs font-medium text-brand-700 hover:text-brand-800 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
                  >
                    {resendIn > 0 ? `Tekrar gönder (${resendIn}s)` : "Kodu tekrar gönder"}
                  </button>
                </div>
              </form>
            )}

            {/* ---------- 3. ADIM: Şifre belirleme ---------- */}
            {step === "password" && (
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Şifre</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      autoComplete="new-password"
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${formData.password.length > 0 ? "max-h-[180px] opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"}`}>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wide">Şifre kuralları:</p>
                      <div className="flex items-center gap-2 text-xs mb-1.5">
                        {hasMinLength ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Circle className="w-3.5 h-3.5 text-slate-300" />}
                        <span className={hasMinLength ? "text-emerald-600" : "text-slate-500"}>En az 8 karakter</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {hasEnoughCriteria ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Circle className="w-3.5 h-3.5 text-slate-300" />}
                        <span className={hasEnoughCriteria ? "text-emerald-600" : "text-slate-500"}>Şunlardan en az 3'ü:</span>
                      </div>
                      <div className="pl-5 grid grid-cols-2 gap-x-2 gap-y-1 mt-1">
                        <div className={`text-[10px] ${hasLower ? "text-emerald-600" : "text-slate-400"}`}>• Küçük harf (a-z)</div>
                        <div className={`text-[10px] ${hasUpper ? "text-emerald-600" : "text-slate-400"}`}>• Büyük harf (A-Z)</div>
                        <div className={`text-[10px] ${hasNumber ? "text-emerald-600" : "text-slate-400"}`}>• Rakam (0-9)</div>
                        <div className={`text-[10px] ${hasSpecial ? "text-emerald-600" : "text-slate-400"}`}>• Özel karakter (@#$)</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="passwordConfirm" className="text-sm font-medium text-slate-700">Şifre (tekrar)</Label>
                  <div className="relative">
                    <Input
                      id="passwordConfirm"
                      name="passwordConfirm"
                      type={showPasswordConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.passwordConfirm}
                      onChange={handleInputChange}
                      required
                      autoComplete="new-password"
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    >
                      {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formData.passwordConfirm.length > 0 && !passwordsMatch && (
                    <p className="text-xs text-red-500">Şifreler eşleşmiyor.</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || !isPasswordValid || !passwordsMatch}
                  className="w-full h-11 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Hesap oluşturuluyor...
                    </div>
                  ) : (
                    "Hesabı Oluştur"
                  )}
                </Button>
              </form>
            )}

            <div className="text-center pt-2">
              <span className="text-sm text-slate-500">Zaten hesabınız var mı? </span>
              <Link to="/login" className="text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline">
                Giriş Yap
              </Link>
            </div>
      </div>
    </AuthLayout>
  );
};

export default Register;
