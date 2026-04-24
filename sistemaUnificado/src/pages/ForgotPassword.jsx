import React, { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/components/ui/use-toast'
import { Mail, ArrowLeft, Key } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [step, setStep] = useState('request') // 'request' | 'reset'
  const [email, setEmail] = useState('')
  const { toast } = useToast()
  const nav = useNavigate()

  const fSchema = useMemo(() => forgotPasswordSchema(t), [t])
  const rSchema = useMemo(() => resetPasswordSchema(t), [t])

  const forgotForm = useForm({
    resolver: zodResolver(fSchema),
    defaultValues: { email: '' }
  })

  const resetForm = useForm({
    resolver: zodResolver(rSchema),
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
          title: t('forgotPassword.toast.codeSent'),
          description: t('forgotPassword.toast.codeSentDesc')
        })
      } else {
        toast({
          title: t('common.error'),
          description: data.error || t('forgotPassword.toast.errorRequest'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('forgotPassword.toast.connectionError'),
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
          title: t('forgotPassword.toast.success'),
          description: t('forgotPassword.toast.successDesc')
        })
        nav('/')
      } else {
        toast({
          title: t('common.error'),
          description: data.error || t('forgotPassword.toast.errorReset'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('forgotPassword.toast.connectionError'),
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
              {step === 'request' ? t('forgotPassword.titleRequest') : t('forgotPassword.titleReset')}
            </CardTitle>
            <CardDescription>
              {step === 'request'
                ? t('forgotPassword.descRequest')
                : t('forgotPassword.descReset')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'request' ? (
              <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('forgotPassword.emailLabel')}</label>
                  <Input
                    type="email"
                    placeholder={t('forgotPassword.emailPlaceholder')}
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
                      {t('forgotPassword.back')}
                    </Link>
                  </Button>
                  <Button type="submit" className="flex-1">
                    <Mail className="mr-2 h-4 w-4" />
                    {t('forgotPassword.sendCode')}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('forgotPassword.emailLabel')}</label>
                  <Input
                    type="email"
                    value={email}
                    disabled
                    {...resetForm.register('email')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('forgotPassword.codeLabel')}</label>
                  <Input
                    type="text"
                    placeholder={t('forgotPassword.codePlaceholder')}
                    maxLength={6}
                    {...resetForm.register('code')}
                  />
                  {resetForm.formState.errors.code && (
                    <p className="text-sm text-red-600">{resetForm.formState.errors.code.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t('forgotPassword.toast.codeSentDesc')}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('forgotPassword.newPasswordLabel')}</label>
                  <Input
                    type="password"
                    placeholder={t('forgotPassword.newPasswordPlaceholder')}
                    {...resetForm.register('newPassword')}
                  />
                  {resetForm.formState.errors.newPassword && (
                    <p className="text-sm text-red-600">{resetForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('forgotPassword.confirmPasswordLabel')}</label>
                  <Input
                    type="password"
                    placeholder={t('forgotPassword.confirmPasswordPlaceholder')}
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
                    {t('forgotPassword.back')}
                  </Button>
                  <Button type="submit" className="flex-1">
                    {t('forgotPassword.resetButton')}
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

