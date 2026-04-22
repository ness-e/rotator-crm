/**
 * @file NotificationsMenu.jsx
 * @description Componente reutilizable de UI: NotificationsMenu con filtros y panel ampliado.
 * @module Frontend Component
 * @path /frontend/src/components/NotificationsMenu.jsx
 * @lastUpdated 2026-04-22
 * @author Antigravity
 */

import React, { useEffect, useState } from 'react'
import { Bell, X, Check, Trash2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { api } from '@/utils/api'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export default function NotificationsMenu({ mode = 'popover', onRead }) {
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [filter, setFilter] = useState('all')
    const [showAll, setShowAll] = useState(false)

    const loadNotifications = async () => {
        try {
            setLoading(true)
            const res = await api.get('/notifications')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
                setUnreadCount(data.filter(n => !n.read).length)
                if (onRead) onRead(data.filter(n => !n.read).length)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadNotifications()
        const interval = setInterval(loadNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
            if (onRead) onRead(Math.max(0, unreadCount - 1))
        } catch (e) { }
    }

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all')
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
            if (onRead) onRead(0)
        } catch (e) { }
    }

    const deleteNotification = async (id, e) => {
        if (e) e.stopPropagation()
        try {
            await api.delete(`/notifications/${id}`)
            setNotifications(prev => prev.filter(n => n.id !== id))
        } catch (e) { }
    }

    const deleteAllNotifications = async () => {
        if (!confirm('¿Estás seguro de que quieres borrar todas las notificaciones?')) return
        try {
            await api.delete('/notifications/delete-all')
            setNotifications([])
            setUnreadCount(0)
            if (onRead) onRead(0)
        } catch (e) { }
    }

    const getTypeColor = (type) => {
        switch (type) {
            case 'success': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
            case 'warning': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
            case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
        }
    }

    const baseFiltered = notifications.filter(n => {
        if (filter === 'unread') return !n.read
        if (filter === 'error') return n.type === 'error'
        if (filter === 'warning') return n.type === 'warning'
        return true
    })

    const displayedNotifications = showAll ? baseFiltered : baseFiltered.slice(0, 15)

    const Content = () => (
        <div className="flex flex-col h-full max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">Notificaciones</h4>
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{notifications.length}</Badge>
                </div>
                <div className="flex items-center gap-1">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium px-2" 
                        onClick={markAllRead}
                        disabled={unreadCount === 0}
                    >
                        <Check className="h-3 w-3 mr-1" />
                        Marcar leído
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-[10px] text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium px-2" 
                        onClick={deleteAllNotifications}
                        disabled={notifications.length === 0}
                    >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Borrar todas
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full md:hidden" onClick={() => setOpen(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-1 p-2 border-b bg-slate-50/30 dark:bg-slate-900/30 overflow-x-auto no-scrollbar">
                <Button variant={filter === 'all' ? 'secondary' : 'ghost'} size="sm" className="h-7 text-[11px] px-3 rounded-full" onClick={() => { setFilter('all'); setShowAll(false); }}>
                    Todas
                </Button>
                <Button variant={filter === 'unread' ? 'secondary' : 'ghost'} size="sm" className="h-7 text-[11px] px-3 rounded-full" onClick={() => { setFilter('unread'); setShowAll(false); }}>
                    No leídas {unreadCount > 0 && `(${unreadCount})`}
                </Button>
                <Button variant={filter === 'error' ? 'secondary' : 'ghost'} size="sm" className="h-7 text-[11px] px-3 rounded-full text-red-600 dark:text-red-400" onClick={() => { setFilter('error'); setShowAll(false); }}>
                    Errores
                </Button>
                <Button variant={filter === 'warning' ? 'secondary' : 'ghost'} size="sm" className="h-7 text-[11px] px-3 rounded-full text-amber-600 dark:text-amber-400" onClick={() => { setFilter('warning'); setShowAll(false); }}>
                    Alertas
                </Button>
            </div>

            <ScrollArea className="flex-1 h-[450px]">
                {displayedNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[350px] p-8 text-center text-muted-foreground gap-3">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <Bell className="h-10 w-10 opacity-20" />
                        </div>
                        <div>
                            <p className="font-medium text-slate-900 dark:text-white">Sin notificaciones</p>
                            <p className="text-xs opacity-70 text-slate-500 dark:text-slate-400">No hay nada que mostrar en este filtro</p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {displayedNotifications.map((n) => (
                            <div
                                key={n.id}
                                className={`group flex gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all cursor-pointer relative ${!n.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                                onClick={() => !n.read && markAsRead(n.id)}
                            >
                                <div className={`h-2.5 w-2.5 mt-1.5 rounded-full flex-shrink-0 shadow-sm ${!n.read ? 'bg-blue-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                                <div className="flex-1 space-y-1.5 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className={`text-sm font-semibold leading-none truncate ${!n.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {n.title}
                                        </p>
                                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 uppercase font-bold tracking-wider ${getTypeColor(n.type)}`}>
                                            {n.type}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                                        {n.message}
                                    </p>
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        onClick={(e) => deleteNotification(n.id, e)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {!showAll && baseFiltered.length > 15 && (
                            <div className="p-4 text-center">
                                <p className="text-xs text-slate-500 mb-2">Mostrando 15 de {baseFiltered.length} notificaciones</p>
                                <Button variant="outline" size="sm" className="h-8 text-xs w-full" onClick={() => setShowAll(true)}>
                                    Cargar más
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>
            <div className="p-3 border-t bg-slate-50/50 dark:bg-slate-900/50 text-center">
                <Button 
                    variant="link" 
                    size="sm" 
                    className="text-xs text-muted-foreground h-auto p-0" 
                    onClick={() => { setShowAll(prev => !prev); if (!showAll) setFilter('all'); }}
                >
                    {showAll ? 'Ver menos' : 'Ver todas las notificaciones'}
                </Button>
            </div>
        </div>
    )

    if (mode === 'list') return <div className="border rounded-xl overflow-hidden bg-background shadow-xl"><Content /></div>

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-4.5 min-w-[18px] px-1 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white border-2 border-background shadow-sm">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] sm:w-[480px] p-0 overflow-hidden rounded-2xl shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950" align="end" sideOffset={8}>
                <Content />
            </PopoverContent>
        </Popover>
    )
}
