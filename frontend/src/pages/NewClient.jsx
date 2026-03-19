/**
 * @file NewClient.jsx
 * @description Componente de página (Vista) para la sección NewClient.
 * @module Frontend Page
 * @path /frontend/src/pages/NewClient.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { GlobalCountrySelect, GlobalCitySelect, GlobalPhoneInput } from '@/components/GlobalSelects'
import { useToast } from '@/components/ui/use-toast'
import { UserPlus, Mail, ClipboardEdit } from 'lucide-react'

// ============ MANUAL FORM ============
function ManualForm() {
    const { toast } = useToast()
    const [notice, setNotice] = useState('')
    const [error, setError] = useState('')

    const schema = z.object({
        nombre_cliente: z.string().trim().min(1).regex(/^\S+$/, 'Solo una palabra'),
        apellido_cliente: z.string().trim().min(1).regex(/^\S+$/, 'Solo una palabra'),
        organizacion_cliente: z.string().trim().min(1, 'Organización requerida'),
        pais_cliente: z.string().trim().min(1, 'País requerido'),
        ciudad_cliente: z.string().trim().optional(),
        direccion_cliente: z.string().trim().optional(),
        telefono_cliente: z.string().trim().optional(),
        correo_cliente: z.string().email('Email inválido'),
        password_cliente: z.string().trim().min(6, 'Mínimo 6 caracteres').optional(),
        tipo_usuario: z.enum(['MASTER', 'USER']).default('USER').optional(),
    })

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            nombre_cliente: '', apellido_cliente: '', organizacion_cliente: '',
            pais_cliente: '', ciudad_cliente: '', direccion_cliente: '',
            telefono_cliente: '', correo_cliente: '', password_cliente: '', tipo_usuario: 'USER'
        }
    })

    const onSubmit = async (vals) => {
        setError('')
        const token = localStorage.getItem('token')
        try {
            const payload = {
                ...vals,
                correo_cliente: vals.correo_cliente.toLowerCase(),
                nombre_cliente: vals.nombre_cliente.trim(),
                apellido_cliente: vals.apellido_cliente.trim()
            }
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            })
            if (!res.ok) {
                const e = await res.json().catch(() => ({ error: 'Error' }))
                setError(e.error || 'Error')
                toast({ title: 'Error', description: e.error || 'Error al crear cliente', variant: 'destructive' })
                return
            }
            form.reset()
            toast({ title: 'Éxito', description: 'Cliente creado con licencia genérica' })
            setNotice('Cliente creado con licencia genérica')
            setTimeout(() => setNotice(''), 2500)
        } catch (err) {
            setError('Error de red')
            toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 w-full">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="nombre_cliente" render={({ field }) => (
                        <FormItem><FormLabel>Nombre <span className="text-red-500">*</span></FormLabel><FormControl><Input {...field} placeholder="Nombre" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="apellido_cliente" render={({ field }) => (
                        <FormItem><FormLabel>Apellido <span className="text-red-500">*</span></FormLabel><FormControl><Input {...field} placeholder="Apellido" /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="organizacion_cliente" render={({ field }) => (
                        <FormItem><FormLabel>Organización <span className="text-red-500">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="pais_cliente" render={({ field }) => (
                        <FormItem><FormLabel>País <span className="text-red-500">*</span></FormLabel><FormControl>
                            <GlobalCountrySelect value={field.value} onChange={(val) => { field.onChange(val); form.setValue('ciudad_cliente', ''); }} />
                        </FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="ciudad_cliente" render={({ field }) => (
                        <FormItem><FormLabel>Ciudad</FormLabel><FormControl>
                            <GlobalCitySelect countryCode={form.watch('pais_cliente')} value={field.value} onChange={field.onChange} />
                        </FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="direccion_cliente" render={({ field }) => (
                        <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="telefono_cliente" render={({ field }) => (
                        <FormItem><FormLabel>Teléfono</FormLabel><FormControl><GlobalPhoneInput value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="correo_cliente" render={({ field }) => (
                        <FormItem><FormLabel>Email <span className="text-red-500">*</span></FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="password_cliente" render={({ field }) => (
                    <FormItem><FormLabel>Password (opcional)</FormLabel><FormControl><Input type="password" {...field} placeholder="Mínimo 6 caracteres" /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="flex gap-2 justify-end mt-2">
                    <Button type="button" variant="outline" onClick={() => form.reset()}>Limpiar</Button>
                    <Button type="submit">Crear Cliente</Button>
                </div>
                {error && <div className="text-sm text-red-500">{error}</div>}
                {notice && <div className="text-sm text-green-600">{notice}</div>}
            </form>
        </Form>
    )
}

// ============ EMAIL FORM ============
function EmailForm() {
    const { toast } = useToast()
    const [notice, setNotice] = useState('')
    const [error, setError] = useState('')

    const schema = z.object({
        correo_cliente: z.string().email('Email inválido'),
        organizacion_cliente: z.string().trim().optional(),
        pais_cliente: z.string().trim().optional(),
    })

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { correo_cliente: '', organizacion_cliente: '', pais_cliente: '' }
    })

    const onSubmit = async (vals) => {
        setError('')
        const token = localStorage.getItem('token')
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    correo_cliente: vals.correo_cliente,
                    organizacion_cliente: vals.organizacion_cliente,
                    pais_cliente: vals.pais_cliente,
                    tipo_usuario: 'USER'
                })
            })
            if (!res.ok) {
                const e = await res.json().catch(() => ({ error: 'Error' }))
                setError(e.error || 'Error')
                toast({ title: 'Error', description: e.error || 'Error al crear cliente', variant: 'destructive' })
                return
            }
            form.reset()
            toast({ title: 'Éxito', description: 'Cliente creado. Se enviará invitación por email.' })
            setNotice('Cliente creado. Invitación enviada.')
            setTimeout(() => setNotice(''), 3000)
        } catch (err) {
            setError('Error de red')
            toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 w-full">
                <FormField control={form.control} name="correo_cliente" render={({ field }) => (
                    <FormItem><FormLabel>Email <span className="text-red-500">*</span></FormLabel><FormControl><Input type="email" {...field} placeholder="usuario@ejemplo.com" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="organizacion_cliente" render={({ field }) => (
                    <FormItem><FormLabel>Organización (opcional)</FormLabel><FormControl><Input {...field} placeholder="Nombre de la organización" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="pais_cliente" render={({ field }) => (
                    <FormItem><FormLabel>País (opcional)</FormLabel><FormControl>
                        <GlobalCountrySelect value={field.value} onChange={field.onChange} />
                    </FormControl><FormMessage /></FormItem>
                )} />
                <div className="flex gap-2 justify-end mt-2">
                    <Button type="button" variant="outline" onClick={() => form.reset()}>Limpiar</Button>
                    <Button type="submit"><Mail className="h-4 w-4 mr-2" /> Enviar Invitación</Button>
                </div>
                {error && <div className="text-sm text-red-500">{error}</div>}
                {notice && <div className="text-sm text-green-600">{notice}</div>}
            </form>
        </Form>
    )
}

// ============ MAIN COMPONENT ============
export default function NewClient() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
                    <UserPlus className="h-8 w-8" /> Nuevo Cliente
                </h1>
                <p className="text-muted-foreground">Crea un nuevo cliente de forma manual o envía una invitación por email.</p>
            </div>

            <Card className="rounded-2xl border-none shadow-xl">
                <CardContent className="pt-6">
                    <Tabs defaultValue="manual" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="manual" className="gap-2"><ClipboardEdit className="h-4 w-4" /> Manual</TabsTrigger>
                            <TabsTrigger value="email" className="gap-2"><Mail className="h-4 w-4" /> Por Email</TabsTrigger>
                        </TabsList>

                        <TabsContent value="manual">
                            <Card className="border-none shadow-none">
                                <CardHeader className="px-0 pt-0">
                                    <CardTitle className="text-lg">Registro Manual</CardTitle>
                                    <CardDescription>Ingresa todos los datos del cliente para crear su cuenta y licencia.</CardDescription>
                                </CardHeader>
                                <CardContent className="px-0">
                                    <ManualForm />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="email">
                            <Card className="border-none shadow-none">
                                <CardHeader className="px-0 pt-0">
                                    <CardTitle className="text-lg">Invitación por Email</CardTitle>
                                    <CardDescription>Envía una invitación al cliente para que complete su registro.</CardDescription>
                                </CardHeader>
                                <CardContent className="px-0">
                                    <EmailForm />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
