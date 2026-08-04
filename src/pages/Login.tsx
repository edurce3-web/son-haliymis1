import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Shield, Award, Star, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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