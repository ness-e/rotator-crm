/**
 * @file Panel.jsx
 * @description Componente de página (Vista) para la sección Panel.
 * @module Frontend Page
 * @path /frontend/src/pages/Panel.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { Copy, Edit, Lock, LogOut, User, Mail, Phone, MapPin, Building, Calendar, Key, Shield, Activity } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { GlobalCountrySelect, GlobalCitySelect, GlobalPhoneInput } from '@/components/GlobalSelects'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const profileSchema = z.object({
  nombre_cliente: z.string().trim().min(1, 'Nombre requerido').regex(/^\S+$/, 'Solo una palabra'),
  apellido_cliente: z.string().trim().min(1, 'Apellido requerido').regex(/^\S+$/, 'Solo una palabra'),
  pais_cliente: z.string().trim().min(1, 'País requerido'),
  ciudad_cliente: z.string().trim().optional(),
  organizacion_cliente: z.string().trim().min(1, 'Organización requerida'),
  direccion_cliente: z.string().trim().optional(),
  telefono_cliente: z.string().trim().optional(),
  // Skype removed
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(8, 'Confirma tu contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export default function Panel() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const { t } = useTranslation()
  const { toast } = useToast()
  const nav = useNavigate()

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {}
  })

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      nav('/')
      return
    }
    loadData()
  }, [])

  function loadData() {
    const token = localStorage.getItem('token')
    setLoading(true)
    fetch('/api/me', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(async r => {
        if (!r.ok) {
          const e = await r.json().catch(() => ({ error: 'Error' }))
          throw new Error(e.error || 'Error')
        }
        return r.json()
      })
      .then((me) => {
        setData(me)
        if (me?.tipo_usuario === 'MASTER') {
          nav('/admin/users', { replace: true })
        }
        // Prellenar formulario de edición
        profileForm.reset({
          nombre_cliente: me.nombre_cliente || '',
          apellido_cliente: me.apellido_cliente || '',
          pais_cliente: me.pais_cliente || '',
          ciudad_cliente: me.ciudad_cliente || '',
          organizacion_cliente: me.organizacion_cliente || '',
          direccion_cliente: me.direccion_cliente || '',
          telefono_cliente: me.telefono_cliente || '',
        })
      })
      .catch(e => {
        setError(e.message || 'Error')
        localStorage.removeItem('token')
        nav('/')
      })
      .finally(() => setLoading(false))
  }

  async function handleLogout() {
    const token = localStorage.getItem('token')
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (e) {
      // Ignorar errores de logout
    }
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    nav('/')
  }

  async function onProfileSubmit(values) {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(values)
    })
    if (!res.ok) {
      const e = await res.json().catch(() => ({ error: 'Error' }))
      toast({ title: 'Error', description: e.error || 'Error al actualizar perfil', variant: 'destructive' })
      return
    }
    setEditOpen(false)
    loadData()
    toast({ title: 'Perfil actualizado', description: 'Tus datos se han actualizado correctamente' })
  }

  async function onPasswordSubmit(values) {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/me/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      })
    })
    if (!res.ok) {
      const e = await res.json().catch(() => ({ error: 'Error' }))
      toast({ title: 'Error', description: e.error || 'Error al cambiar contraseña', variant: 'destructive' })
      return
    }
    setPasswordOpen(false)
    passwordForm.reset()
    toast({ title: 'Contraseña actualizada', description: 'Tu contraseña se ha cambiado correctamente' })
  }

  function copySerial() {
    if (data?.license?.licencia_serial) {
      navigator.clipboard.writeText(data.license.licencia_serial)
      toast({ title: 'Serial copiado', description: 'El serial se ha copiado al portapapeles' })
    }
  }

  function getLicenseTypeName(type) {
    const types = {
      '1': 'EVALUATION',
      '2': 'ACADEMIA EDITION',
      '3': 'PROFESSIONAL EDITION',
      '4': 'ENTERPRISE EDITION',
      '5': 'UNLIMITED EDITION',
      '6': 'PROFESSOR EDITION',
      '7': 'DONATED',
      '8': 'INDIVIDUALS',
      '9': 'TEAMS',
      '10': 'ENTERPRISES',
      '11': 'Team Basic',
      '12': 'Team Premier',
    }
    return types[type] || type || 'N/A'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">{error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const license = data.license || {}

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">

        {/* Header - SaaS Standard */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Bienvenido de nuevo, <span className="text-foreground font-semibold">{data.nombre_cliente || data.correo_cliente}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleLogout} className="rounded-xl px-6 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all duration-200">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Columna Izquierda: Datos Personales (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="rounded-2xl border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="rounded-lg text-xs font-semibold hover:bg-primary/5">
                        <Edit className="mr-2 h-3.5 w-3.5" />
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                      <DialogHeader>
                        <DialogTitle>Editar Perfil Profesional</DialogTitle>
                        <CardDescription>Actualiza tu información comercial y de contacto.</CardDescription>
                      </DialogHeader>
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={profileForm.control} name="nombre_cliente" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nombre</FormLabel>
                                <FormControl><Input {...field} placeholder="Tu nombre" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={profileForm.control} name="apellido_cliente" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Apellido</FormLabel>
                                <FormControl><Input {...field} placeholder="Tu apellido" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>

                          <FormField control={profileForm.control} name="organizacion_cliente" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organización</FormLabel>
                              <FormControl><Input {...field} placeholder="Nombre de tu empresa" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={profileForm.control} name="pais_cliente" render={({ field }) => (
                              <FormItem>
                                <FormLabel>País</FormLabel>
                                <FormControl>
                                  <GlobalCountrySelect
                                    value={field.value}
                                    onChange={(val) => {
                                      field.onChange(val);
                                      profileForm.setValue('ciudad_cliente', '');
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={profileForm.control} name="ciudad_cliente" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ciudad</FormLabel>
                                <FormControl>
                                  <GlobalCitySelect
                                    countryCode={profileForm.watch('pais_cliente')}
                                    value={field.value}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>

                          <FormField control={profileForm.control} name="direccion_cliente" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dirección Fiscal</FormLabel>
                              <FormControl><Input {...field} placeholder="Dirección de facturación" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />

                          <FormField control={profileForm.control} name="telefono_cliente" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teléfono Celular</FormLabel>
                              <FormControl>
                                <GlobalPhoneInput value={field.value} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />

                          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                            <Button type="submit">Guardar Cambios</Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
                <CardTitle className="mt-4 text-xl font-bold">Perfil</CardTitle>
                <CardDescription>Gestión de identidad corporativa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold">
                      {data.nombre_cliente?.[0] || data.correo_cliente?.[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{data.nombre_cliente} {data.apellido_cliente}</div>
                      <div className="text-sm text-muted-foreground">{data.correo_cliente}</div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2"><Building className="h-3.5 w-3.5" /> Org</span>
                      <span className="font-medium">{data.organizacion_cliente || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> País</span>
                      <span className="font-medium">{data.pais_cliente || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> Tel</span>
                      <span className="font-medium">{data.telefono_cliente || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full rounded-xl gap-2 text-sm border-slate-200 dark:border-slate-800">
                        <Shield className="h-4 w-4" />
                        Seguridad y Acceso
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl">
                      <DialogHeader>
                        <DialogTitle>Seguridad de la Cuenta</DialogTitle>
                        <CardDescription>Cambia tu contraseña para mantener tu cuenta segura.</CardDescription>
                      </DialogHeader>
                      <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 pt-4">
                          <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contraseña Actual</FormLabel>
                              <FormControl><Input type="password" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nueva Contraseña</FormLabel>
                              <FormControl><Input type="password" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                              <FormControl><Input type="password" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                            <Button type="button" variant="outline" onClick={() => setPasswordOpen(false)}>Cancelar</Button>
                            <Button type="submit">Actualizar Contraseña</Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha: Licencia (2/3) */}
          <div className="lg:col-span-2 space-y-6 text-slate-950">
            <Card className="rounded-2xl border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-blue-400" />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-extrabold flex items-center gap-3">
                    <Key className="h-6 w-6 text-primary" />
                    Licencia de Producto
                  </CardTitle>
                  <div className="badge-active">
                    Activa
                  </div>
                </div>
                <CardDescription>Detalles técnicos de tu producto Rotator Survey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-4">

                {/* Information Architecture for Human Error Prevention */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-left">
                      <div className="text-xs font-bold uppercase tracking-wider text-primary">Serial de Activación</div>
                      <div className="font-mono text-2xl md:text-3xl font-bold tracking-widest text-slate-900 dark:text-slate-100">
                        {license.licencia_serial?.match(/.{1,4}/g)?.join('-') || '---'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Activity className="h-3 w-3" />
                        Usa este código en el software de escritorio para activar tu licencia.
                      </div>
                    </div>
                    <Button
                      size="lg"
                      onClick={copySerial}
                      className="rounded-xl px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                    >
                      <Copy className="mr-2 h-5 w-5" />
                      Copiar Serial
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase">Edición</div>
                    <div className="font-bold">{getLicenseTypeName(license.licencia_tipo)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase">Vencimiento</div>
                    <div className="font-bold text-destructive">{license.licencia_expira || 'N/A'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase">Activador</div>
                    <div className="font-bold">{license.licencia_activador || 'N/A'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase">Hosting</div>
                    <div className="font-bold">{license.hosting === 1 ? 'Cloud' : 'Local'}</div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-slate-500">Capacidades del Plan</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {[
                      { label: 'Preguntas', val: license.n_preguntas, icon: 'Q' },
                      { label: 'Casos', val: license.n_casos, icon: 'C' },
                      { label: 'Admins', val: license.n_admins, icon: 'A' },
                      { label: 'Móviles', val: license.n_moviles, icon: 'M' },
                      { label: 'Telefónicos', val: license.n_telefonicos, icon: 'T' }
                    ].map(cap => (
                      <div key={cap.label} className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-center border">
                        <div className="text-lg font-bold text-primary">{cap.val || '0'}</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase">{cap.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guía de Activación - Human Error Reduction */}
            <div className="p-1 px-1">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold">1</div>
                <span>Descarga el instalador de Rotator Survey.</span>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold">2</div>
                <span>Pega el serial copiado arriba.</span>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold">3</div>
                <span>¡Listo! Tu licencia se activará automáticamente.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

