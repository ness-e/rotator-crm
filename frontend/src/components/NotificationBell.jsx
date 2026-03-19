/**
 * @file NotificationBell.jsx
 * @description Notification bell component with unread count badge
 * 
 * @overview
 * Displays a notification bell icon with unread count badge. Polls the
 * notifications API every 30 seconds to update the count. Opens a dropdown
 * with recent notifications when clicked.
 */

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { api } from '../utils/api';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function NotificationBell() {
    const [count, setCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    // Fetch unread count
    const fetchCount = async () => {
        try {
            const res = await api.get('/notifications/unread-count');
            if (res.ok) {
                const data = await res.json();
                setCount(data.count || 0);
            }
        } catch (error) {
            console.error('Error fetching notification count:', error);
        }
    };

    // Fetch recent notifications
    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications?limit=5');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Mark notification as read
    const markAsRead = async (id) => {
        try {
            const res = await api.patch(`/notifications/${id}/read`);
            if (res.ok) {
                fetchCount();
                fetchNotifications();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Initial fetch and polling
    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {count > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {count > 9 ? '9+' : count}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                        No hay notificaciones
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <DropdownMenuItem
                            key={notification.id}
                            className="flex flex-col items-start gap-1 cursor-pointer"
                            onClick={() => !notification.isRead && markAsRead(notification.id)}
                        >
                            <div className="flex items-start justify-between w-full">
                                <div className="font-medium text-sm">{notification.title}</div>
                                {!notification.isRead && (
                                    <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                                {notification.message}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                    addSuffix: true,
                                    locale: es
                                })}
                            </div>
                        </DropdownMenuItem>
                    ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-sm text-primary cursor-pointer">
                    Ver todas las notificaciones
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
