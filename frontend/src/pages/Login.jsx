import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { t } = useTranslation()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema)
  })
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    document.title = 'Rotator SU - Iniciar Sesión';
    
    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const isMaster = decoded.isMaster === true || 
                        decoded.tipo === 'MASTER' || 
                        decoded.role === 'MASTER' ||
                        decoded.role === 'ANALISTA' ||
                        decoded.role === 'VISUALIZADOR';
        nav(isMaster ? '/admin/dashboard' : '/panel', { replace: true });
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }
  }, [nav]);

  const submit = handleSubmit(async (values) => {
    setServerError('')
    const payload = {
      email: (values.email || '').replace(/\s+/g, '').toLowerCase(),
      password: values.password || ''
    }
    
    // Use relative paths to rely on Vite proxy (works for localhost and network IP)
    const apiBase = ''
    
    try {
      const res = await fetch(`${apiBase}/api/auth/login`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      })

      if (res.ok) {
        const { token, refreshToken } = await res.json();
        localStorage.setItem('token', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

        // Decode JWT to determine role and redirect
        const decoded = JSON.parse(atob(token.split('.')[1]))
        const isMaster = decoded.isMaster === true || 
                        decoded.tipo === 'MASTER' || 
                        decoded.role === 'MASTER' ||
                        decoded.role === 'ANALISTA' ||
                        decoded.role === 'VISUALIZADOR';

        nav(isMaster ? '/admin/dashboard' : '/panel', { replace: true });
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Error de autenticación' }));
        setServerError(errorData.error || t('login.invalid'));
      }
    } catch (err) {
      setServerError('Error al conectar con el servidor');
      console.error('Login error:', err);
    }
  })

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-sm grid gap-5">
        <div className="text-center grid gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Rotator SU</h1>
          <p className="text-sm text-muted-foreground">
            {t('login.title')} · Ingresa con tu correo y contraseña
          </p>
        </div>
        <Card className="border-slate-800">
          <CardContent className="pt-6">
            <form onSubmit={submit} className="grid gap-4">
              <div className="grid gap-1">
                <label className="text-sm font-medium">{t('login.email')}</label>
                <Input 
                  placeholder="name@example.com" 
                  type="email" 
                  autoComplete="email" 
                  {...register('email')} 
                />
                {errors.email && <div className="text-[12px] text-red-600">{errors.email.message}</div>}
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">{t('login.password')}</label>
                <div className="relative">
                  <Input 
                    className="pr-10" 
                    placeholder="••••••••" 
                    type={showPassword ? 'text' : 'password'} 
                    autoComplete="current-password" 
                    {...register('password')} 
                  />
                  <button 
                    type="button" 
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} 
                    onClick={() => setShowPassword(v => !v)} 
                    className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <div className="text-[12px] text-red-600">{errors.password.message}</div>}
              </div>
              {serverError && <div className="text-[12px] text-red-600">{serverError}</div>}
              <Button type="submit" disabled={isSubmitting} className="w-full inline-flex items-center justify-center gap-2">
                {isSubmitting ? '...' : <><LogIn size={16} /> {t('login.submit')}</>}
              </Button>
              <div className="text-center space-y-2">
                <div>
                  <Link
                      to="/forgot-password"
                      className="text-sm text-primary hover:underline"
                  >
                      ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div>
                  <Link to="/register" className="text-sm text-primary hover:underline">
                    ¿No tienes cuenta? Regístrate
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
