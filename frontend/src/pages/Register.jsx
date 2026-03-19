/**
 * @file Register.jsx
 * @description Componente de página (Vista) para la sección Register.
 * @module Frontend Page
 * @path /frontend/src/pages/Register.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'
import { UserPlus, LogIn } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast.jsx'

const registerSchema = z.object({
  correo_cliente: z.string().email('Invalid email format'),
  password_cliente: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  nombre_cliente: z.string().trim().min(1, 'Name is required').max(100).optional(),
  apellido_cliente: z.string().trim().max(100).optional(),
  pais_cliente: z.string().trim().max(50).optional(),
  ciudad_cliente: z.string().trim().max(100).optional(),
  organizacion_cliente: z.string().trim().max(200).optional(),
  telefono_cliente: z.string().trim().max(50).optional(),
}).refine((data) => data.password_cliente === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export default function Register() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema)
  })
  const [serverError, setServerError] = useState('')

  const submit = handleSubmit(async (values) => {
    setServerError('')
    const { confirmPassword, ...data } = values

    try {
      const res = await fetch('/api/auth/register-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        const { token, refreshToken } = await res.json()
        localStorage.setItem('token', token)
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken)

        toast({
          title: 'Registration successful',
          description: 'Welcome! You have been registered successfully.',
        })

        navigate('/panel')
      } else {
        const error = await res.json()
        setServerError(error.error || 'Registration failed')
      }
    } catch (error) {
      setServerError('Network error. Please try again.')
    }
  })

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md grid gap-5">
        <div className="text-center grid gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Rotator SU</h1>
          <p className="text-sm text-muted-foreground">Create a new account</p>
        </div>
        <Card className="border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus size={20} />
              Register
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  placeholder="name@example.com"
                  type="email"
                  autoComplete="email"
                  {...register('correo_cliente')}
                />
                {errors.correo_cliente && (
                  <div className="text-[12px] text-red-600">{errors.correo_cliente.message}</div>
                )}
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Password *</label>
                <Input
                  placeholder="••••••••"
                  type="password"
                  autoComplete="new-password"
                  {...register('password_cliente')}
                />
                {errors.password_cliente && (
                  <div className="text-[12px] text-red-600">{errors.password_cliente.message}</div>
                )}
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Confirm Password *</label>
                <Input
                  placeholder="••••••••"
                  type="password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <div className="text-[12px] text-red-600">{errors.confirmPassword.message}</div>
                )}
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="John"
                  {...register('nombre_cliente')}
                />
                {errors.nombre_cliente && (
                  <div className="text-[12px] text-red-600">{errors.nombre_cliente.message}</div>
                )}
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  placeholder="Doe"
                  {...register('apellido_cliente')}
                />
                {errors.apellido_cliente && (
                  <div className="text-[12px] text-red-600">{errors.apellido_cliente.message}</div>
                )}
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Organization</label>
                <Input
                  placeholder="Company Name"
                  {...register('organizacion_cliente')}
                />
                {errors.organizacion_cliente && (
                  <div className="text-[12px] text-red-600">{errors.organizacion_cliente.message}</div>
                )}
              </div>

              {serverError && (
                <div className="text-[12px] text-red-600 bg-red-50 p-2 rounded">{serverError}</div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Creating account...' : 'Register'}
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link to="/" className="text-primary hover:underline flex items-center justify-center gap-1">
                  <LogIn size={14} />
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

