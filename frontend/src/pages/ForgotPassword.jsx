/**
 * @file ForgotPassword.jsx
 * @description Componente de página (Vista) para la sección ForgotPassword.
 * @module Frontend Page
 * @path /frontend/src/pages/ForgotPassword.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/components/ui/use-toast'
import { Mail, ArrowLeft, Key } from 'lucide-react'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido')
})

const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
  code: z.string().length(6, 'El código debe tener 6 caracteres'),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(8, 'Confirma tu contraseña')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export default function ForgotPassword() {
  const [step, setStep] = useState('request') // 'request' | 'reset'
  const [email, setEmail] = useState('')
  const { toast } = useToast()
  const nav = useNavigate()

  const forgotForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' }
  })

  const resetForm = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '', code: '', newPassword: '', confirmPassword: '' }
  })

  async function onForgotSubmit(values) {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      const data = await res.json()
      if (res.ok) {
        setEmail(values.email)
        resetForm.reset({ ...resetForm.getValues(), email: values.email })
        setStep('reset')
        toast({
          title: 'Código enviado',
          description: 'Revisa tu consola del backend para ver el código (en desarrollo)'
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al solicitar recuperación',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error de conexión',
        variant: 'destructive'
      })
    }
  }

  async function onResetSubmit(values) {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          code: values.code,
          newPassword: values.newPassword
        })
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          title: 'Contraseña actualizada',
          description: 'Tu contraseña se ha cambiado correctamente'
        })
        nav('/')
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al cambiar contraseña',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error de conexión',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {step === 'request' ? 'Recuperar Contraseña' : 'Restablecer Contraseña'}
            </CardTitle>
            <CardDescription>
              {step === 'request'
                ? 'Ingresa tu email para recibir un código de recuperación'
                : 'Ingresa el código recibido y tu nueva contraseña'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'request' ? (
              <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    {...forgotForm.register('email')}
                  />
                  {forgotForm.formState.errors.email && (
                    <p className="text-sm text-red-600">{forgotForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" asChild className="flex-1">
                    <Link to="/">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver
                    </Link>
                  </Button>
                  <Button type="submit" className="flex-1">
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Código
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={email}
                    disabled
                    {...resetForm.register('email')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Código de Verificación</label>
                  <Input
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    {...resetForm.register('code')}
                  />
                  {resetForm.formState.errors.code && (
                    <p className="text-sm text-red-600">{resetForm.formState.errors.code.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Revisa la consola del backend para ver el código (en desarrollo)
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nueva Contraseña</label>
                  <Input
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    {...resetForm.register('newPassword')}
                  />
                  {resetForm.formState.errors.newPassword && (
                    <p className="text-sm text-red-600">{resetForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirmar Contraseña</label>
                  <Input
                    type="password"
                    placeholder="Confirma tu contraseña"
                    {...resetForm.register('confirmPassword')}
                  />
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-600">{resetForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('request')}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                  </Button>
                  <Button type="submit" className="flex-1">
                    Cambiar Contraseña
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

