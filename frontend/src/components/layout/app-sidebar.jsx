/**
 * @file app-sidebar.jsx
 * @description Componente reutilizable de UI: app-sidebar.
 * @module Frontend Component
 * @path /frontend/src/components/layout/app-sidebar.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Building2,
    LogOut,
    ChevronDown,
    Bell,
    Sun,
    Moon,
    Monitor,
    FilePlus,
    Settings,
    TrendingUp,
    ChevronRight,
} from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function AppSidebar({ user, unreadCount, onNotificationsClick, onLogout }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { state } = useSidebar();
    const location = useLocation();
    const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'system');


    // Check for Master role
    const isMaster = user?.isMaster === true || 
                     user?.tipo === 'MASTER' || 
                     user?.role === 'SUPER_ADMIN' || 
                     user?.role === 'MASTER';

    const menuItems = [
        {
            title: 'Dashboard',
            icon: LayoutDashboard,
            path: '/admin/dashboard',
            visible: true
        },
        {
            title: 'Organizaciones',
            icon: Building2,
            path: '/admin/organizations',
            visible: isMaster
        },
        {
            title: 'Gestión',
            icon: Users,
            path: '/admin/gestion',
            visible: isMaster || user?.role === 'ADMIN'
        },
        {
            title: 'Clientes',
            icon: FilePlus,
            path: '/admin/clientes',
            visible: isMaster
        },
        {
            title: 'CRM',
            icon: TrendingUp,
            path: '/admin/crm',
            visible: isMaster
        },
        {
            title: 'Configuración',
            icon: Settings,
            path: '/admin/configuracion',
            visible: isMaster
        },
    ].filter(item => item.visible);

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);

        if (newTheme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
                .matches
                ? 'dark'
                : 'light';
            document.documentElement.classList.toggle('dark', systemTheme === 'dark');
        } else {
            document.documentElement.classList.toggle('dark', newTheme === 'dark');
        }
    };

    const getInitials = () => {
        if (!user) return 'U';
        const firstInitial = user.nombre_cliente?.charAt(0) || '';
        const lastInitial = user.apellido_cliente?.charAt(0) || '';
        return `${firstInitial}${lastInitial}`.toUpperCase() || 'U';
    };

    return (
        <Sidebar collapsible="icon" className="border-r bg-card">
            <SidebarHeader className="border-b">
                <div className="flex items-center gap-2 px-2 py-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                        <Building2 className="h-5 w-5" />
                    </div>
                    {state === 'expanded' && (
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-semibold truncate">Rotator Survey</span>
                            <span className="text-xs text-muted-foreground truncate">{user?.correo_cliente || ''}</span>
                        </div>
                    )}
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>

                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <SidebarMenuItem key={item.path}>
                                        <SidebarMenuButton
                                            tooltip={item.title}
                                            isActive={isActive}
                                            onClick={() => navigate(item.path)}
                                            className={`
                        transition-all duration-200
                        ${isActive
                                                    ? 'bg-primary text-primary-foreground shadow-sm font-medium'
                                                    : 'hover:bg-accent hover:text-accent-foreground'
                                                }
                      `}
                                        >
                                            <item.icon className="h-5 w-5 flex-shrink-0" />
                                            <span className="text-sm">{item.title}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t mt-auto">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground hover:bg-accent transition-colors duration-200"
                                >
                                    <div className="relative">
                                        <Avatar className="h-9 w-9 rounded-lg bg-primary/10">
                                            <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
                                                {getInitials()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {unreadCount > 0 && (
                                            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
                                                <span className="text-[10px] font-bold text-white">{unreadCount}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">
                                            {user?.nombre_cliente} {user?.apellido_cliente}
                                        </span>
                                        <span className="truncate text-xs text-muted-foreground">{user?.correo_cliente}</span>
                                    </div>
                                    <ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]:rotate-90" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-56 rounded-lg shadow-lg"
                                side="right"
                                align="end"
                                sideOffset={10}
                            >
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-semibold leading-none">
                                            {user?.nombre_cliente} {user?.apellido_cliente}
                                        </p>
                                        <p className="text-xs leading-none text-muted-foreground">{user?.correo_cliente}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                {/* Notifications */}
                                <DropdownMenuItem onClick={onNotificationsClick} className="cursor-pointer">
                                    <div className="relative w-full flex items-center">
                                        <Bell className="mr-2 h-4 w-4" />
                                        <span>Notificaciones</span>
                                        {unreadCount > 0 && (
                                            <Badge variant="destructive" className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs">
                                                {unreadCount}
                                            </Badge>
                                        )}
                                    </div>
                                </DropdownMenuItem>

                                {/* Theme Selector */}
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="cursor-pointer">
                                        {theme === 'light' && <Sun className="mr-2 h-4 w-4" />}
                                        {theme === 'dark' && <Moon className="mr-2 h-4 w-4" />}
                                        {theme === 'system' && <Monitor className="mr-2 h-4 w-4" />}
                                        <span>Tema</span>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent>
                                            <DropdownMenuItem
                                                onClick={() => handleThemeChange('light')}
                                                className="cursor-pointer"
                                            >
                                                <Sun className="mr-2 h-4 w-4" />
                                                <span className="flex-1">Claro</span>
                                                {theme === 'light' && <ChevronRight className="h-4 w-4 text-primary" />}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleThemeChange('dark')}
                                                className="cursor-pointer"
                                            >
                                                <Moon className="mr-2 h-4 w-4" />
                                                <span className="flex-1">Oscuro</span>
                                                {theme === 'dark' && <ChevronRight className="h-4 w-4 text-primary" />}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleThemeChange('system')}
                                                className="cursor-pointer"
                                            >
                                                <Monitor className="mr-2 h-4 w-4" />
                                                <span className="flex-1">Sistema</span>
                                                {theme === 'system' && <ChevronRight className="h-4 w-4 text-primary" />}
                                            </DropdownMenuItem>
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>

                                <DropdownMenuSeparator />

                                {/* Logout */}
                                <DropdownMenuItem
                                    onClick={onLogout}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 cursor-pointer"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Cerrar Sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
