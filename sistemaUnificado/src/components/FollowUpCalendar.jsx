import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/utils/api'
import { Calendar as CalendarIcon, Plus, Clock, User, Phone, Mail, Video, MessageSquare } from 'lucide-react'
import { format, addDays, isToday, isTomorrow, isPast, parseISO } from 'date-fns'
import { es, enUS, ptBR, fr } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'

const CANAL_ICONS = {
    WHATSAPP: MessageSquare,
    CORREO: Mail,
    TELEFONO: Phone,
    TEAMS: Video
}

const TIPO_COLORS = {
    RENOVACION: 'bg-blue-100 text-blue-800',
    PROSPECTO: 'bg-purple-100 text-purple-800',
    MIGRACION: 'bg-amber-100 text-amber-800',
    HOSTING: 'bg-green-100 text-green-800'
}

const getLocale = (lng) => {
    switch (lng) {
        case 'en': return enUS
        case 'pt': return ptBR
        case 'fr': return fr
        default: return es
    }
}

function FollowUpCard({ followUp }) {
    const { t, i18n } = useTranslation()
    const Icon = CANAL_ICONS[followUp.canal] || Clock
    const typeClass = TIPO_COLORS[followUp.tipo] || 'bg-gray-100 text-gray-800'
    const fecha = parseISO(followUp.fecha)
    const locale = getLocale(i18n.language)

    const isOverdue = isPast(fecha) && !isToday(fecha)
    const isTodayEvent = isToday(fecha)
    const isTomorrowEvent = isTomorrow(fecha)

    let dateLabel = format(fecha, "d MMM yyyy, HH:mm", { locale })
    if (isTodayEvent) dateLabel = `${t('followup.today')}, ${format(fecha, "HH:mm")}`
    if (isTomorrowEvent) dateLabel = `${t('followup.tomorrow')}, ${format(fecha, "HH:mm")}`

    return (
        <Card className={`${isOverdue ? 'border-red-200 bg-red-50' : ''} ${isTodayEvent ? 'border-blue-300 bg-blue-50' : ''}`}>
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className="mt-1">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-xs ${typeClass}`} variant="secondary">
                                {t(`followup.form.types.${followUp.tipo.toLowerCase()}`, { defaultValue: followUp.tipo })}
                            </Badge>
                            {isOverdue && <Badge variant="destructive" className="text-xs">{t('followup.overdue')}</Badge>}
                            {isTodayEvent && <Badge variant="default" className="text-xs">{t('followup.today')}</Badge>}
                        </div>

                        <p className="text-sm font-medium">{dateLabel}</p>

                        {followUp.user && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <User className="h-3 w-3" />
                                {followUp.user.firstName} {followUp.user.lastName}
                            </p>
                        )}

                        {followUp.notas && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                {followUp.notas}
                            </p>
                        )}

                        {followUp.resultado && (
                            <div className="mt-2">
                                <Badge variant="outline" className="text-xs">
                                    {followUp.resultado}
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function AddFollowUpForm({ onSuccess, onCancel }) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [ejecutivos, setEjecutivos] = useState([])
    const [formData, setFormData] = useState({
        tipo: 'PROSPECTO',
        fecha: '',
        canal: 'WHATSAPP',
        notas: '',
        userId: null
    })

    useEffect(() => {
        loadEjecutivos()
    }, [])

    const loadEjecutivos = async () => {
        try {
            const res = await api.get('/catalog/masters')
            if (res.ok) {
                const data = await res.json()
                setEjecutivos(data)
            }
        } catch (error) {
            console.error('Error loading ejecutivos:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await api.post('/followups', formData)
            if (res.ok) {
                onSuccess()
                onCancel()
            } else {
                alert(t('followup.form.error'))
            }
        } catch (error) {
            console.error('Error:', error)
            alert(t('followup.form.error'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label>{t('followup.form.type')}</Label>
                <Select
                    value={formData.tipo}
                    onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="PROSPECTO">{t('followup.form.types.prospect')}</SelectItem>
                        <SelectItem value="RENOVACION">{t('followup.form.types.renewal')}</SelectItem>
                        <SelectItem value="MIGRACION">{t('followup.form.types.migration')}</SelectItem>
                        <SelectItem value="HOSTING">{t('followup.form.types.hosting')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label>{t('followup.form.date')}</Label>
                <Input
                    type="datetime-local"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    required
                />
            </div>

            <div>
                <Label>{t('followup.form.channel')}</Label>
                <Select
                    value={formData.canal}
                    onValueChange={(v) => setFormData({ ...formData, canal: v })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                        <SelectItem value="CORREO">{t('navigation.emails')}</SelectItem>
                        <SelectItem value="TELEFONO">{t('common.phone')}</SelectItem>
                        <SelectItem value="TEAMS">Teams</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label>{t('followup.form.executive')}</Label>
                <Select
                    value={formData.userId ? String(formData.userId) : 'none'}
                    onValueChange={(v) => setFormData({ ...formData, userId: v === 'none' ? null : parseInt(v) })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={t('followup.form.selectExecutive')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">{t('followup.form.unassigned')}</SelectItem>
                        {ejecutivos.map(ej => (
                            <SelectItem key={ej.id} value={String(ej.id)}>
                                {ej.firstName} {ej.lastName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label>{t('followup.form.notes')}</Label>
                <Textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={t('followup.form.notesPlaceholder')}
                    rows={3}
                />
            </div>

            <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? t('followup.form.saving') : t('followup.form.save')}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                    {t('followup.form.cancel')}
                </Button>
            </div>
        </form>
    )
}

export default function FollowUpCalendar() {
    const { t } = useTranslation()
    const [followUps, setFollowUps] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [filterTipo, setFilterTipo] = useState('all')

    useEffect(() => {
        loadFollowUps()
    }, [])

    const loadFollowUps = async () => {
        setLoading(true)
        try {
            const res = await api.get('/followups/upcoming')
            if (res.ok) {
                const data = await res.json()
                setFollowUps(data)
            }
        } catch (error) {
            console.error('Error loading follow-ups:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredFollowUps = followUps.filter(f =>
        filterTipo === 'all' || f.tipo === filterTipo
    )

    // Group by date
    const today = []
    const upcoming = []
    const overdue = []

    filteredFollowUps.forEach(f => {
        const fecha = parseISO(f.fecha)
        if (isPast(fecha) && !isToday(fecha)) {
            overdue.push(f)
        } else if (isToday(fecha)) {
            today.push(f)
        } else {
            upcoming.push(f)
        }
    })

    if (loading) {
        return <div className="p-8 text-center">{t('followup.loading')}</div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('followup.title')}</h1>
                    <p className="text-muted-foreground">
                        {t('followup.description')}
                    </p>
                </div>
                <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('followup.new')}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold">{today.length}</div>
                        <p className="text-xs text-muted-foreground">{t('followup.today')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold">{upcoming.length}</div>
                        <p className="text-xs text-muted-foreground">{t('followup.upcoming')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-red-600">{overdue.length}</div>
                        <p className="text-xs text-muted-foreground">{t('followup.overdue')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold">{followUps.length}</div>
                        <p className="text-xs text-muted-foreground">{t('followup.total')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                <Select value={filterTipo} onValueChange={setFilterTipo}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        <SelectItem value="PROSPECTO">{t('followup.form.types.prospect')}</SelectItem>
                        <SelectItem value="RENOVACION">{t('followup.form.types.renewal')}</SelectItem>
                        <SelectItem value="MIGRACION">{t('followup.form.types.migration')}</SelectItem>
                        <SelectItem value="HOSTING">{t('followup.form.types.hosting')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Add Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                    onClick={() => setShowAddForm(false)}>
                    <Card className="max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <CardHeader>
                            <CardTitle>{t('followup.form.title')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AddFollowUpForm
                                onSuccess={loadFollowUps}
                                onCancel={() => setShowAddForm(false)}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Overdue Section */}
            {overdue.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-3 text-red-600">{t('followup.overdue')}</h2>
                    <div className="space-y-2">
                        {overdue.map(f => <FollowUpCard key={f.id} followUp={f} />)}
                    </div>
                </div>
            )}

            {/* Today Section */}
            {today.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-3">{t('followup.today')}</h2>
                    <div className="space-y-2">
                        {today.map(f => <FollowUpCard key={f.id} followUp={f} />)}
                    </div>
                </div>
            )}

            {/* Upcoming Section */}
            {upcoming.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-3">{t('followup.upcoming')}</h2>
                    <div className="space-y-2">
                        {upcoming.map(f => <FollowUpCard key={f.id} followUp={f} />)}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filteredFollowUps.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">{t('followup.noEvents')}</h3>
                        <p className="text-muted-foreground mb-4">
                            {t('followup.noEventsDesc')}
                        </p>
                        <Button onClick={() => setShowAddForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('followup.new')}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
