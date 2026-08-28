import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";
import SocialLogin from "@/components/auth/SocialLogin";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
      toast.success("Giriş başarılı", { description: "Hoş geldin!" });
      // Korumalı bir sayfadan yönlendirildiyse oraya geri dön
      const redirect = searchParams.get("redirect");
      navigate(redirect || "/");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Giriş başarısız", {
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
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const inputClass =
    "h-11 rounded-xl border-slate-200 bg-slate-50/60 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-colors";

  return (
    <AuthLayout
      title={<>Tekrar hoş geldin</>}
      subtitle="Öğrenme yolculuğuna kaldığın yerden devam et."
      points={[
        "Satın aldığın kurslara ömür boyu erişim",
        "İlerlemen kaldığın yerden devam eder",
        "Soru-cevap ve mesajlarla eğitmenine ulaş",
      ]}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Giriş yap</h2>
        <p className="text-sm text-slate-500 mt-1.5">
          Hesap bilgilerini girerek devam et.
        </p>
      </div>

      <SocialLogin redirectAfter={searchParams.get("redirect") || undefined} />

      <form onSubmit={handleSubmit} className="space-y-5 mt-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">
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
            autoComplete="email"
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-slate-700">
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
              autoComplete="current-password"
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Etiket hizasında değil, alanın altında: kullanıcı önce şifresini
              yazmayı deniyor, bağlantı ancak o iş bitince gerekiyor. */}
          <div className="flex justify-end pt-0.5">
            <Link
              to="/forgot-password"
              className="text-[13px] font-medium text-brand-700 hover:text-brand-900 transition-colors"
            >
              Şifremi unuttum
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            checked={formData.remember}
            onChange={handleInputChange}
            className="w-4 h-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500/30 focus:ring-2"
          />
          <Label htmlFor="remember" className="text-sm text-slate-600 font-normal cursor-pointer">
            Beni hatırla
          </Label>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Giriş yapılıyor
            </>
          ) : (
            "Giriş yap"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-8">
        Hesabın yok mu?{" "}
        <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800 hover:underline">
          Ücretsiz kaydol
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
