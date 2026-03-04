import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Eye, EyeOff, Shield, Zap, Activity } from 'lucide-react';
import heimdallLogo from '@/assets/heimdall-logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/create/authorization/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Falha ao autenticar");
      }

      if (data.userToken) {
        localStorage.setItem("userToken", data.userToken);
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("userName", data.name);
        localStorage.setItem("userEmail", data.email);
        localStorage.setItem("departaments", data.departament);
      }

      toast({
        title: 'Login realizado',
        description: `Bem-vindo ao Heimdall, ${data.name}!`,
      });

      navigate('/');
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast({
        title: "Erro no login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const floatingIcons = [
    { Icon: Shield, x: '10%', y: '20%', delay: 0, size: 20 },
    { Icon: Zap, x: '85%', y: '15%', delay: 0.5, size: 16 },
    { Icon: Activity, x: '75%', y: '75%', delay: 1, size: 18 },
    { Icon: Shield, x: '15%', y: '70%', delay: 1.5, size: 14 },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/5 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {floatingIcons.map(({ Icon, x, y, delay, size }, i) => (
          <motion.div
            key={i}
            className="absolute text-primary/10"
            style={{ left: x, top: y }}
            animate={{ y: [-10, 10, -10], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, delay, ease: 'easeInOut' }}
          >
            <Icon size={size} />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-border/50 shadow-2xl shadow-primary/5 backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-4 text-center pb-2">
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150" />
                <img
                  src={heimdallLogo}
                  alt="Heimdall"
                  className="h-24 w-auto object-contain relative z-10"
                />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <CardTitle className="text-2xl font-bold tracking-tight">
                Bem-vindo ao Heimdall
              </CardTitle>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <CardDescription className="text-muted-foreground">
                Entre com suas credenciais para acessar o sistema
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="pt-2">
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email
                </Label>
                <div className="relative group">
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-3 h-11 transition-all duration-200 border-input focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Senha
                </Label>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-3 pr-10 h-11 transition-all duration-200 border-input focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-semibold relative overflow-hidden group"
                disabled={isLoading}
              >
                <motion.span
                  className="flex items-center gap-2"
                  animate={isLoading ? { opacity: 0 } : { opacity: 1 }}
                >
                  <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  Entrar
                </motion.span>
                {isLoading && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  </motion.div>
                )}
              </Button>
            </motion.form>

            <motion.div
              className="mt-6 pt-4 border-t border-border/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary/60" />
                  <span>Acesso seguro</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-primary/60" />
                  <span>Alta performance</span>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
