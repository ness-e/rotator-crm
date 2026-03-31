/**
 * @file app-sidebar.jsx
 * @description Main application sidebar with restructured navigation.
 * @module Frontend Component
 * @path /frontend/src/components/layout/app-sidebar.jsx
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Building2,
    Settings,
    TrendingUp,
    ChevronDown,
    Server
} from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuAction,
    useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function AppSidebar({ user }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { state } = useSidebar();
    const location = useLocation();
    const [expandedHubs, setExpandedHubs] = React.useState({});

    const toggleHub = (path) => {
        setExpandedHubs(prev => ({ ...prev, [path]: !prev[path] }));
    };

    // Auto-expand hubs when location changes
    React.useEffect(() => {
        const newExpanded = { ...expandedHubs };
        let changed = false;

        menuItems.forEach(item => {
            if (item.subItems) {
                const isItemActive = location.pathname === item.path || 
                    item.subItems.some(sub => {
                        const subBasePath = sub.path.split('?')[0];
                        return location.pathname === subBasePath || location.pathname.startsWith(subBasePath + '/');
                    });

                if (isItemActive && !expandedHubs[item.path]) {
                    newExpanded[item.path] = true;
                    changed = true;
                }
            }
        });

        if (changed) {
            setExpandedHubs(newExpanded);
        }
    }, [location.pathname]);


    // Check for Master role
    const isMaster = user?.isMaster === true || 
                     user?.tipo === 'MASTER' || 
                     user?.role === 'MASTER' ||
                     user?.role === 'ANALISTA' ||
                     user?.role === 'VISUALIZADOR';

    const menuItems = [
        {
            title: 'Resumen',
            icon: LayoutDashboard,
            path: '/admin/dashboard',
            visible: true,
            subItems: [
                { title: 'Estadísticas', path: '/admin/estadisticas' }
            ]
        },
        {
            title: 'Gestión',
            icon: Users,
            path: '/admin/gestion',
            visible: isMaster,
            isDropdownOnly: true,
            subItems: [
                { title: 'Resumen de clientes', path: '/admin/crm?tab=active' },
                { title: 'Prospectos', path: '/admin/crm?tab=pipeline' },
                { title: 'Organizaciones', path: '/admin/organizations' },
                { title: 'Usuarios', path: '/admin/gestion/users' },
                { title: 'Licencias', path: '/admin/gestion/licenses' },
                { title: 'Lic. Pendientes', path: '/admin/gestion/pending-licenses' },
                { title: 'Activaciones', path: '/admin/gestion/activations' },
                { title: 'Auditoría', path: '/admin/gestion/audit' }
            ]
        },
        {
            title: 'Servidores y Dominios',
            icon: Server,
            path: '/admin/infraestructura',
            visible: isMaster,
        },
        {
            title: 'Configuración',
            icon: Settings,
            path: '/admin/configuracion',
            visible: isMaster,
            subItems: [
                { title: 'General', path: '/admin/configuracion?tab=general' },
                { title: 'Roles & Permisos', path: '/admin/configuracion?tab=roles' },
                { title: 'Planes & Hosting', path: '/admin/configuracion?tab=planes' },
                { title: 'Avanzado', path: '/admin/configuracion?tab=avanzado' }
            ]
        },
    ].filter(item => item.visible);

    return (
        <Sidebar collapsible="icon" className="border-r bg-card">
            <SidebarHeader className="border-b">
                <div className="flex items-center gap-2 px-2 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm flex-shrink-0">
                        <Building2 className="h-4 w-4" />
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
                                const isActive = location.pathname === item.path || 
                                    (item.subItems && item.subItems.some(sub => {
                                        const subBasePath = sub.path.split('?')[0];
                                        return location.pathname === subBasePath || location.pathname.startsWith(subBasePath + '/');
                                    }));

                                return (
                                    <SidebarMenuItem key={item.path}>
                                        <SidebarMenuButton
                                            tooltip={item.title}
                                            isActive={isActive}
                                            onClick={(e) => {
                                                if (item.isDropdownOnly) {
                                                    e.preventDefault();
                                                    toggleHub(item.path);
                                                    return;
                                                }
                                                navigate(item.path);
                                                if (item.subItems) {
                                                    setExpandedHubs(prev => ({ ...prev, [item.path]: true }));
                                                }
                                            }}
                                            className={cn(
                                                "transition-all duration-200",
                                                isActive && "bg-primary text-primary-foreground shadow-sm font-medium hover:bg-primary/90 hover:text-primary-foreground"
                                            )}
                                        >
                                            <item.icon className="h-4 w-4 flex-shrink-0" />
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                        {item.subItems && (
                                            <SidebarMenuAction
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleHub(item.path);
                                                }}
                                                className={cn(
                                                    "transition-transform duration-200",
                                                    expandedHubs[item.path] && "rotate-180"
                                                )}
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                            </SidebarMenuAction>
                                        )}
                                        
                                        {/* Sub-items */}
                                        {item.subItems && expandedHubs[item.path] && state === 'expanded' && (
                                            <div className="pl-6 pr-2 py-1 space-y-1 mt-1 border-l-2 border-border/50 ml-4">
                                                {item.subItems.map((sub, i) => {
                                                    const subBasePath = sub.path.split('?')[0];
                                                    const isSubActive = (location.pathname === subBasePath && (!sub.path.includes('?') || location.search === '?' + sub.path.split('?')[1])) ||
                                                                      (location.pathname.startsWith(subBasePath + '/') && subBasePath !== '/admin');

                                                    return (
                                                        <div 
                                                            key={i}
                                                            onClick={() => navigate(sub.path)}
                                                            className={`px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
                                                                isSubActive 
                                                                ? 'bg-primary/15 text-primary font-bold shadow-sm' 
                                                                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                                                            }`}
                                                        >
                                                            {sub.title}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
