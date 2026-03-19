/**
 * @file NotificationsMenu.jsx
 * @description Componente reutilizable de UI: NotificationsMenu.
 * @module Frontend Component
 * @path /frontend/src/components/NotificationsMenu.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useEffect, useState } from 'react'
import { Bell, X, Check, Trash2 } from 'lucide-react'
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
            await api.del(`/notifications/${id}`)
            setNotifications(prev => prev.filter(n => n.id !== id))
        } catch (e) { }
    }

    const getTypeColor = (type) => {
        switch (type) {
            case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            case 'warning': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
            case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
        }
    }

    const Content = () => (
        <>
            <div className="flex items-center justify-between p-4 border-b">
                <h4 className="font-semibold leading-none">Notificaciones</h4>
                {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="h-auto text-xs px-2" onClick={markAllRead}>
                        Marcar todo leído
                    </Button>
                )}
            </div>
            <ScrollArea className="h-[300px]">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground gap-2">
                        <Bell className="h-8 w-8 opacity-20" />
                        <p className="text-sm">No tienes notificaciones</p>
                    </div>
                ) : (
                    <div className="grid">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`flex gap-3 p-4 border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer ${!n.read ? 'bg-slate-50/50 dark:bg-slate-900/20' : ''}`}
                                onClick={() => !n.read && markAsRead(n.id)}
                            >
                                <div className={`h-2 w-2 mt-1.5 rounded-full flex-shrink-0 ${!n.read ? 'bg-primary' : 'bg-transparent'}`} />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">{n.title}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                                        </span>
                                        <Badge variant="secondary" className={`text-[10px] px-1 h-auto ${getTypeColor(n.type)}`}>
                                            {n.type}
                                        </Badge>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => deleteNotification(n.id, e)}
                                >
                                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </>
    )

    if (mode === 'list') return <div className="border rounded-md bg-background"><Content /></div>

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white border-2 border-background">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <Content />
            </PopoverContent>
        </Popover>
    )
}
