import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, Shield, Award, Star, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = "https://api.edurce.com";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success("Giriş başarılı!", { description: "Hoş geldiniz!" });
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error("Giriş başarısız!", {
        description: error.message || "E-posta veya şifre hatalı.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleGoogleLogin = () => {
    const googleClientId = "901387918519-uu7g32n5tf59fr51u4g7q8ltmhbtv5c8.apps.googleusercontent.com";
    const redirectUri = encodeURIComponent(`${API_BASE}/api/auth/google/callback`);
    const scope = encodeURIComponent("openid email profile");
    const state = encodeURIComponent(JSON.stringify({ redirect: window.location.origin }));

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;
  };

  const handleFacebookLogin = () => {
    toast.info("Facebook ile giriş yakında aktif olacak.");
  };

  const handleAppleLogin = () => {
    toast.info("Apple ile giriş yakında aktif olacak.");
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 flex items-center justify-center bg-gray-50/50 dark:bg-[#0a0a1a]">
      {/* Central Unified Card */}
      <div className="w-full max-w-[1100px] flex flex-col lg:flex-row bg-white dark:bg-[#11111A] rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] overflow-hidden border border-gray-100 dark:border-gray-800">

        {/* Left Side - Image integrated smoothly into the card */}
        <div className="hidden lg:flex lg:w-5/12 relative bg-gray-900 border-r border-gray-100 dark:border-gray-800/50">
          <div className="absolute inset-0 bg-[url('/auth-side-panel.png')] bg-cover bg-center opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/80 via-indigo-900/60 to-purple-900/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a]/40 to-transparent" />

          <div className="relative z-10 flex flex-col items-center justify-center p-12 w-full text-center">
            {/* Very simple, clean presentation inside the image */}
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white leading-tight mb-4">
              Neural Akademi'ye
              <br />
              <span className="text-violet-300">Tekrar Hoş Geldiniz.</span>
            </h1>
            <p className="text-white/80 text-sm leading-relaxed max-w-[260px] mx-auto mb-10">
              Öğrenme yolculuğunuza kaldığınız yerden devam edin ve hedeflerinize ulaşın.
            </p>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 text-left w-full max-w-[300px]">
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-white/90 text-sm italic mb-4">
                " Neural Akademi'deki kurslar sayesinde kariyerimde harika bir sıçrama yaşadım. "
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-500/30 flex items-center justify-center text-white text-xs font-bold border border-violet-400/30">
                  AY
                </div>
                <div>
                  <div className="text-white text-xs font-semibold">Ayşe Yılmaz</div>
                  <div className="text-white/50 text-[10px]">Frontend Geliştirici</div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4 text-white/50 text-xs">
              <div className="flex items-center gap-1"><Shield className="w-3 h-3" /> SSL Koruması</div>
              <div className="flex items-center gap-1"><Award className="w-3 h-3" /> Sertifikalı</div>
            </div>
          </div>
        </div>

        {/* Right Side - Clean Form */}
        <div className="w-full lg:w-7/12 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white dark:bg-[#11111A]">
          <div className="w-full max-w-[420px] mx-auto space-y-8">

            <div className="lg:hidden flex items-center justify-center mb-8">
              <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Giriş Yap
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Lütfen hesap bilgilerinizi giriniz.
              </p>
            </div>

            {/* Social Login Grid */}
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
                Google ile devam et
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
              <span className="flex-shrink-0 mx-4 text-xs text-gray-400 font-medium">veya e-posta</span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
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
                  className="h-11 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1A1A24] focus:border-violet-500 focus:ring-violet-500/20"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Şifre
                  </Label>
                  <Link to="/forgot-password" className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300">
                    Şifremi unuttum
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="h-11 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1A1A24] focus:border-violet-500 focus:ring-violet-500/20 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 pb-2">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={formData.remember}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <Label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400 font-normal cursor-pointer">
                  Beni hatırla
                </Label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Giriş yapılıyor...
                  </div>
                ) : (
                  "Giriş Yap"
                )}
              </Button>
            </form>

            <div className="text-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Hesabınız yok mu? </span>
              <Link to="/register" className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline">
                Hemen Ücretsiz Kayıt Olun
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;