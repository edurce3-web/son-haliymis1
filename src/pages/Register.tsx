import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Shield, Award, GraduationCap, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = "https://api.edurce.com";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    acceptTerms: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Password validation logic
  const hasMinLength = formData.password.length >= 8;
  const hasLower = /[a-z]/.test(formData.password);
  const hasUpper = /[A-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(formData.password);

  const criteriaMetCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  const hasEnoughCriteria = criteriaMetCount >= 3;

  const isPasswordValid = hasMinLength && hasEnoughCriteria;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast.error("Şifreniz güvenlik kriterlerini karşılamıyor.");
      return;
    }

    if (!formData.acceptTerms) {
      toast.error("Kullanım koşullarını kabul etmelisiniz.");
      return;
    }

    setLoading(true);

    try {
      await register({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
      });

      toast.success("Kayıt başarılı!", { description: "Aramıza hoş geldiniz!" });
      navigate('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error("Kayıt başarısız!", {
        description: error.message || "Bir hata oluştu.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const googleClientId = "901387918519-uu7g32n5tf59fr51u4g7q8ltmhbtv5c8.apps.googleusercontent.com";
    const redirectUri = encodeURIComponent(`${API_BASE}/api/auth/google/callback`);
    const scope = encodeURIComponent("openid email profile");
    const state = encodeURIComponent(JSON.stringify({ redirect: window.location.origin }));

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;
  };

  const handleFacebookLogin = () => toast.info("Facebook ile kayıt yakında aktif olacak.");
  const handleAppleLogin = () => toast.info("Apple ile kayıt yakında aktif olacak.");

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 flex items-center justify-center bg-gray-50/50 dark:bg-[#0a0a1a]">
      {/* Central Unified Card */}
      <div className="w-full max-w-[1100px] flex flex-col lg:flex-row bg-white dark:bg-[#11111A] rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] overflow-hidden border border-gray-100 dark:border-gray-800">

        {/* Left Side - Image integrated smoothly into the card */}
        <div className="hidden lg:flex lg:w-5/12 relative bg-gray-900 border-r border-gray-100 dark:border-gray-800/50">
          <div className="absolute inset-0 bg-[url('/auth-side-panel.png')] bg-cover bg-center opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-purple-900/60 to-violet-900/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a]/40 to-transparent" />

          <div className="relative z-10 flex flex-col items-center justify-center p-12 w-full text-center">
            {/* Simple, bold branding */}
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

        {/* Right Side - Clean Form */}
        <div className="w-full lg:w-7/12 p-8 sm:p-12 lg:p-14 flex flex-col justify-center bg-white dark:bg-[#11111A]">
          <div className="w-full max-w-[440px] mx-auto space-y-6">

            <div className="lg:hidden flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="text-center lg:text-left mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Hesap Oluşturun
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aramıza katılmak için formu doldurun.
              </p>
            </div>

            {/* Social Registration Grid */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A24] hover:bg-gray-50 dark:hover:bg-[#20202F] transition-all text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google ile kayıt ol
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleFacebookLogin}
                  className="flex items-center justify-center gap-2 h-11 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A24] hover:bg-gray-50 dark:hover:bg-[#20202F] transition-all text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>
                <button
                  type="button"
                  onClick={handleAppleLogin}
                  className="flex items-center justify-center gap-2 h-11 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A24] hover:bg-gray-50 dark:hover:bg-[#20202F] transition-all text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Apple
                </button>
              </div>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              <span className="flex-shrink-0 mx-4 text-xs text-gray-400 font-medium">veya e-posta ile</span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ad
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Adınız"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="h-11 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1A1A24] focus:border-violet-500 focus:ring-violet-500/20 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Soyad
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Soyadınız"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="h-11 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1A1A24] focus:border-violet-500 focus:ring-violet-500/20 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  E-posta
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="isim@ornek.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="h-11 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1A1A24] focus:border-violet-500 focus:ring-violet-500/20 text-sm"
                />
              </div>

              <div className="space-y-1.5 pb-1">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Şifre
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="h-11 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1A1A24] focus:border-violet-500 focus:ring-violet-500/20 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Fixed Height Password Strengths container prevents jerky layout shifts */}
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
                disabled={loading || (formData.password.length > 0 && !isPasswordValid)}
                className="w-full h-11 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Kayıt yapılıyor...
                  </div>
                ) : (
                  "Kayıt Ol"
                )}
              </Button>
            </form>

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