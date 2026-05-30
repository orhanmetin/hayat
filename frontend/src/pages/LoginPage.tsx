import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Sun, Moon, Lock, User, AlertCircle, Eye, EyeOff } from "lucide-react";
import { AppLogo } from "../components/ui/AppLogo";

// Form Validation Schema using Zod
const loginSchema = z.object({
  username: z.string().min(3, { message: "Kullanıcı adı en az 3 karakter olmalıdır." }),
  password: z.string().min(6, { message: "Şifre en az 6 karakter olmalıdır." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, darkMode, toggleDarkMode } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitError, setIsSubmitError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMsg(null);
    setIsSubmitError(false);
    try {
      await login(data.username, data.password);
      navigate("/", { replace: true });
    } catch (err: any) {
      setIsSubmitError(true);
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg("Sunucuya bağlanılamadı. Lütfen internetinizi kontrol edin.");
      }
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-4 overflow-hidden select-none bg-gradient-to-br from-primary-light via-primary to-emerald-800 animate-gradient dark:from-slate-900 dark:via-bg-dark dark:to-emerald-950">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/5"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-64 h-64 md:w-96 md:h-96 rounded-full bg-teal-300/20 blur-3xl dark:bg-teal-500/5"></div>

      {/* Floating Theme Switcher */}
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 p-3 rounded-full glass border border-white/20 text-white dark:text-emerald-400 hover:scale-110 active:scale-95 transition-all shadow-md z-50 cursor-pointer"
        aria-label="Temayı Değiştir"
      >
        {darkMode ? <Sun size={20} className="animate-pulse" /> : <Moon size={20} />}
      </button>

      {/* Login Card Wrapper */}
      <div className="w-full max-w-md animate-fade-in-up z-10">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-6 text-center text-white">
          <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 mb-3 shadow-inner hover-scale">
            <AppLogo size="lg" className="h-16 w-16" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-sans">hayat</h1>
          <p className="text-white/80 dark:text-slate-400 text-sm mt-1 max-w-xs leading-relaxed font-light">
            Yaşam tarzını keşfet, alışkanlıklarını yönet, zihnini sakinleştir.
          </p>
        </div>

        {/* Card Component */}
        <div className={`glass rounded-3xl p-6 md:p-8 w-full border ${isSubmitError ? "animate-shake border-red-400/50" : ""}`}>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-emerald-300 text-center mb-6">
            Hesabınıza Giriş Yapın
          </h2>

          {/* Error Message Alert Card */}
          {errorMsg && (
            <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 flex items-start space-x-3 text-sm animate-fade-in-up">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Username Input Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 tracking-wide uppercase px-1">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Kullanıcı adınızı yazın..."
                  className={`w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/50 dark:bg-black/20 border text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all ${
                    errors.username 
                      ? "border-red-400 focus:ring-2 focus:ring-red-400/20" 
                      : "border-slate-200 dark:border-white/10 focus:border-primary dark:focus:border-primary-light focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/10"
                  }`}
                  {...register("username")}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-red-500 px-1 mt-1 font-medium">{errors.username.message}</p>
              )}
            </div>

            {/* Password Input Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 tracking-wide uppercase px-1">
                Şifre
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-11 py-3.5 rounded-2xl bg-white/50 dark:bg-black/20 border text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all ${
                    errors.password 
                      ? "border-red-400 focus:ring-2 focus:ring-red-400/20" 
                      : "border-slate-200 dark:border-white/10 focus:border-primary dark:focus:border-primary-light focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light/10"
                  }`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 px-1 mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary-hover dark:from-primary-light dark:to-emerald-600 text-white font-semibold shadow-lg shadow-primary/20 hover-scale cursor-pointer disabled:opacity-75 disabled:pointer-events-none transition-all"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Giriş yapılıyor...</span>
                </div>
              ) : (
                <span>Giriş Yap</span>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-200/50 dark:border-white/5 text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
            <p>
              Hızlı deneme için:<br />
              Kullanıcı adı: <span className="font-semibold text-slate-600 dark:text-emerald-400 bg-slate-100 dark:bg-black/30 px-1.5 py-0.5 rounded">admin</span> &nbsp;
              Şifre: <span className="font-semibold text-slate-600 dark:text-emerald-400 bg-slate-100 dark:bg-black/30 px-1.5 py-0.5 rounded">Admin123!</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
