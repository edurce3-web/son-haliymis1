import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Shield, Award, GraduationCap, CheckCircle2, Circle, ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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
  const codeInputRef = useRef<HTMLInputElement>(null);

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

  // Kod adımına geçince geri sayımı başlat ve alana odaklan
  useEffect(() => {
    if (step === "code") {
      codeInputRef.current?.focus();
    }
  }, [step]);

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

  const inputClass = "h-11 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1A1A24] focus:border-violet-500 focus:ring-violet-500/20 text-sm";

  const stepMeta: Record<Step, { title: string; subtitle: string }> = {
    details: { title: "Hesap Oluşturun", subtitle: "Başlamak için bilgilerinizi girin." },
    code: { title: "E-postanızı Doğrulayın", subtitle: `${formData.email} adresine 6 haneli bir kod gönderdik.` },
    password: { title: "Şifrenizi Belirleyin", subtitle: "Hesabınızı güvence altına alan son adım." },
  };

  const stepIndex = step === "details" ? 0 : step === "code" ? 1 : 2;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 flex items-center justify-center bg-gray-50/50 dark:bg-[#0a0a1a]">
      <div className="w-full max-w-[1100px] flex flex-col lg:flex-row bg-white dark:bg-[#11111A] rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] overflow-hidden border border-gray-100 dark:border-gray-800">

        {/* Sol taraf - görsel */}
        <div className="hidden lg:flex lg:w-5/12 relative bg-gray-900 border-r border-gray-100 dark:border-gray-800/50">
          <div className="absolute inset-0 bg-[url('/auth-side-panel.png')] bg-cover bg-center opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-purple-900/60 to-violet-900/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a]/40 to-transparent" />

          <div className="relative z-10 flex flex-col items-center justify-center p-12 w-full text-center">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white leading-tight mb-4">
              Kariyerini Güçlendir,
              <br />
              <span className="text-violet-300">Potansiyelini Keşfet.</span>
            </h1>
            <p className="text-white/80 text-sm leading-relaxed max-w-[260px] mx-auto mb-10">
              Gerçek dünya projeleri ve uzmanlardan alacağın eğitimlerle hayalindeki işe adım at.
            </p>

            <div className="mt-8 flex items-center justify-center gap-4 text-white/50 text-xs tracking-wider uppercase">
              <div className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-green-400" /> Güvenli Kayıt</div>
              <div className="flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-400" /> %100 Ücretsiz</div>
            </div>
          </div>
        </div>

        {/* Sağ taraf - form */}
        <div className="w-full lg:w-7/12 p-8 sm:p-12 lg:p-14 flex flex-col justify-center bg-white dark:bg-[#11111A]">
          <div className="w-full max-w-[440px] mx-auto space-y-6">

            <div className="lg:hidden flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Adım göstergesi */}
            <div className="flex items-center gap-2" aria-label={`Adım ${stepIndex + 1} / 3`}>
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${i <= stepIndex ? "bg-violet-600" : "bg-gray-200 dark:bg-gray-700"}`}
                />
              ))}
            </div>

            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {stepMeta[step].title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 break-words">
                {stepMeta[step].subtitle}
              </p>
            </div>

            {/* ---------- 1. ADIM: Ad, soyad, e-posta ---------- */}
            {step === "details" && (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">Ad</Label>
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
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">Soyad</Label>
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
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">E-posta</Label>
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
                  <p className="text-xs text-gray-400">Doğrulama kodu bu adrese gönderilecek.</p>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 mt-0.5 rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500"
                  />
                  <Label htmlFor="acceptTerms" className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer font-normal leading-relaxed">
                    <Link to="/terms" className="text-violet-600 dark:text-violet-400 hover:underline">Kullanım Koşulları</Link>
                    'nı ve{" "}
                    <Link to="/privacy" className="text-violet-600 dark:text-violet-400 hover:underline">Gizlilik Politikası</Link>
                    'nı okudum ve kabul ediyorum.
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors disabled:opacity-50"
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
                  <div className="w-14 h-14 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                    <Mail className="w-7 h-7 text-violet-600 dark:text-violet-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Doğrulama kodu
                  </Label>
                  <Input
                    ref={codeInputRef}
                    id="code"
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    maxLength={6}
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.replace(/\D/g, "") }))}
                    required
                    className="h-14 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1A1A24] focus:border-violet-500 focus:ring-violet-500/20 text-center text-2xl font-semibold tracking-[0.5em] indent-[0.5em]"
                  />
                  <p className="text-xs text-gray-400">Kod 10 dakika geçerlidir.</p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || formData.code.length !== 6}
                  className="w-full h-11 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors disabled:opacity-50"
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
                    className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    E-postayı değiştir
                  </button>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendIn > 0 || loading}
                    className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
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
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Şifre</Label>
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${formData.password.length > 0 ? "max-h-[180px] opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"}`}>
                    <div className="bg-gray-50 dark:bg-[#1A1A24] p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                      <p className="text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">Şifre kuralları:</p>
                      <div className="flex items-center gap-2 text-xs mb-1.5">
                        {hasMinLength ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Circle className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />}
                        <span className={hasMinLength ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>En az 8 karakter</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {hasEnoughCriteria ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Circle className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />}
                        <span className={hasEnoughCriteria ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>Şunlardan en az 3'ü:</span>
                      </div>
                      <div className="pl-5 grid grid-cols-2 gap-x-2 gap-y-1 mt-1">
                        <div className={`text-[10px] ${hasLower ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>• Küçük harf (a-z)</div>
                        <div className={`text-[10px] ${hasUpper ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>• Büyük harf (A-Z)</div>
                        <div className={`text-[10px] ${hasNumber ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>• Rakam (0-9)</div>
                        <div className={`text-[10px] ${hasSpecial ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>• Özel karakter (@#$)</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="passwordConfirm" className="text-sm font-medium text-gray-700 dark:text-gray-300">Şifre (tekrar)</Label>
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                  className="w-full h-11 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors disabled:opacity-50"
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
              <span className="text-sm text-gray-500 dark:text-gray-400">Zaten hesabınız var mı? </span>
              <Link to="/login" className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline">
                Giriş Yap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
