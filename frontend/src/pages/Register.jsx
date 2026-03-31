/**
 * @file Register.jsx
 * @description Componente de página (Vista) para la sección Register. Add token support for License Invitations.
 * @module Frontend Page
 * @path /frontend/src/pages/Register.jsx
 */

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'
import { UserPlus, LogIn, CheckCircle2, ShieldAlert } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast.jsx'

const registerSchema = z.object({
  correo_cliente: z.string().email('Email inválido'),
  password_cliente: z.string()
    .min(6, 'Password debe tener al menos 6 caracteres')
    .regex(/[A-Za-z]/, 'Debe contener al menos una letra')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
  nombre_cliente: z.string().trim().min(1, 'El nombre es requerido').max(100),
  apellido_cliente: z.string().trim().min(1, 'El apellido es requerido').max(100),
  organizacion_cliente: z.string().trim().min(1, 'El nombre de empresa es requerido').max(200),
  telefono_cliente: z.string().trim().max(50).optional(),
}).refine((data) => data.password_cliente === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

export default function Register() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      correo_cliente: '',
      password_cliente: '',
      confirmPassword: '',
      nombre_cliente: '',
      apellido_cliente: '',
      organizacion_cliente: '',
      telefono_cliente: ''
    }
  })
  
  const [serverError, setServerError] = useState('')
  const [validatingToken, setValidatingToken] = useState(false)
  const [tokenError, setTokenError] = useState('')
  const [isInvitation, setIsInvitation] = useState(false)

  useEffect(() => {
    if (token) {
      setValidatingToken(true)
      fetch(`/api/invitations/${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setIsInvitation(true)
            setValue('correo_cliente', data.email)
          } else {
            setTokenError(data.error || 'Token de invitación inválido')
          }
        })
        .catch(() => {
          setTokenError('Error al validar la invitación')
        })
        .finally(() => {
          setValidatingToken(false)
        })
    }
  }, [token, setValue])

  const submit = handleSubmit(async (values) => {
    setServerError('')
    const { confirmPassword, ...data } = values

    try {
      let endpoint = '/api/auth/register-public'
      let payload = data

      if (isInvitation && token) {
        endpoint = `/api/invitations/${token}/accept`
        payload = {
          organizationName: data.organizacion_cliente,
          commercialName: '',
          organizationPhone: data.telefono_cliente,
          firstName: data.nombre_cliente,
          lastName: data.apellido_cliente,
          phone: data.telefono_cliente,
          password: data.password_cliente
        }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const resultData = await res.json()
        
        if (!isInvitation) {
          // Normal public registration returns token
          localStorage.setItem('token', resultData.token)
          if (resultData.refreshToken) localStorage.setItem('refreshToken', resultData.refreshToken)
        }

        toast({
          title: 'Registro exitoso',
          description: isInvitation ? 'Tu cuenta y licencia han sido creadas. Por favor inicia sesión.' : 'Bienvenido!',
        })

        if (isInvitation) {
          navigate('/') // Go to login
        } else {
          navigate('/panel')
        }
      } else {
        const error = await res.json()
        setServerError(error.error || 'Fallo el registro')
      }
    } catch (error) {
      setServerError('Error de red. Intenta nuevamente.')
    }
  })

  // Loading state while validating the token
  if (validatingToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="animate-pulse text-muted-foreground flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          Validando invitación...
        </div>
      </div>
    )
  }

  // Error state for invalid/consumed tokens
  if (tokenError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto bg-red-100 text-red-600 p-3 rounded-full w-fit mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <CardTitle className="text-xl text-red-600">Invitación Inválida</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>{tokenError}</p>
            <Button className="mt-6" onClick={() => navigate('/')}>Ir al Inicio</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md grid gap-5">
        <div className="text-center grid gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Rotator SU</h1>
          <p className="text-sm text-muted-foreground">
            {isInvitation ? 'Completa tu registro corporativo' : 'Crear una cuenta nueva'}
          </p>
        </div>
        <Card className="border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus size={20} />
              Registro {isInvitation && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Nombre *</label>
                  <Input placeholder="John" {...register('nombre_cliente')} />
                  {errors.nombre_cliente && <div className="text-[12px] text-red-600">{errors.nombre_cliente.message}</div>}
                </div>
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Apellido *</label>
                  <Input placeholder="Doe" {...register('apellido_cliente')} />
                  {errors.apellido_cliente && <div className="text-[12px] text-red-600">{errors.apellido_cliente.message}</div>}
                </div>
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Empresa / Organización *</label>
                <Input placeholder="Nombre de la empresa" {...register('organizacion_cliente')} />
                {errors.organizacion_cliente && <div className="text-[12px] text-red-600">{errors.organizacion_cliente.message}</div>}
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  placeholder="name@example.com"
                  type="email"
                  disabled={isInvitation}
                  className={isInvitation ? "bg-muted" : ""}
                  {...register('correo_cliente')}
                />
                {errors.correo_cliente && <div className="text-[12px] text-red-600">{errors.correo_cliente.message}</div>}
              </div>
              
              <div className="grid gap-1">
                <label className="text-sm font-medium">Teléfono (Opcional)</label>
                <Input placeholder="+1 234 567 890" {...register('telefono_cliente')} />
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Contraseña *</label>
                <Input type="password" placeholder="••••••••" {...register('password_cliente')} />
                {errors.password_cliente && <div className="text-[12px] text-red-600">{errors.password_cliente.message}</div>}
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Confirmar Contraseña *</label>
                <Input type="password" placeholder="••••••••" {...register('confirmPassword')} />
                {errors.confirmPassword && <div className="text-[12px] text-red-600">{errors.confirmPassword.message}</div>}
              </div>

              {serverError && (
                <div className="text-[12px] text-red-600 bg-red-50 p-2 rounded">{serverError}</div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
                {isSubmitting ? 'Procesando...' : (isInvitation ? 'Completar Registro y Activar' : 'Registrar')}
              </Button>

              <div className="text-center text-sm mt-2">
                <span className="text-muted-foreground">¿Ya tienes una cuenta? </span>
                <Link to="/" className="text-primary hover:underline inline-flex items-center gap-1">
                  <LogIn size={14} /> Iniciar Sesión
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

