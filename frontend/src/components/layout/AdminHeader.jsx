import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bell, 
  Sun, 
  Moon, 
  Monitor, 
  Check, 
  Globe,
  LogOut,
  Upload,
  Loader2
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { api } from '@/utils/api';
import { useAuthStore } from '@/stores/auth-store';

const languages = [
  { code: 'es', name: 'Español', flag: 'https://flagcdn.com/es.svg' },
  { code: 'en', name: 'English', flag: 'https://flagcdn.com/us.svg' },
  { code: 'pt', name: 'Português', flag: 'https://flagcdn.com/br.svg' },
  { code: 'fr', name: 'Français', flag: 'https://flagcdn.com/fr.svg' },
];

export function AdminHeader({ user, unreadCount, onNotificationsClick, onLogout }) {
  const { i18n, t } = useTranslation();
  const { theme, setTheme } = useTheme();
  
  const fileInputRef = useRef(null);
  const { setUser } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  const getInitials = () => {
    if (!user || (!user.nombre && !user.email)) return 'U';
    const nameParts = (user.nombre || user.email || '').split(' ');
    const firstInitial = nameParts[0]?.charAt(0) || '';
    const lastInitial = nameParts.length > 1 ? nameParts[1]?.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase() || 'U';
  };

  const isMaster = user?.role === 'MASTER' || user?.tipo === 'MASTER';

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('avatar', file);
      
      const res = await api.post('/me/avatar', formData);
      if (!res.ok) {
        throw new Error('Upload failed');
      }
      const data = await res.json();
      
      setUser(data);
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 hover:bg-accent transition-colors"
          onClick={onNotificationsClick}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold border-2 border-background"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>

        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 gap-2 px-2 hover:bg-accent transition-colors">
              <img src={currentLanguage.flag} alt={currentLanguage.name} className="h-4 w-6 object-cover rounded shadow-sm border border-border/50" />
              <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider">{currentLanguage.code}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-1">
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('navigation.language')}</DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => {
                  i18n.changeLanguage(lang.code);
                  localStorage.setItem('lang', lang.code);
                }}
                className="flex items-center justify-between px-2 py-2 cursor-pointer rounded-sm hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img src={lang.flag} alt={lang.name} className="h-3.5 w-5 object-cover rounded-sm shadow-sm border border-border/50" />
                  <span className="text-sm font-medium">{lang.name}</span>
                </div>
                {i18n.language === lang.code && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-accent transition-colors">
              {theme === 'light' && <Sun className="h-5 w-5 text-orange-500" />}
              {theme === 'dark' && <Moon className="h-5 w-5 text-blue-400" />}
              {theme === 'system' && <Monitor className="h-5 w-5" />}
              <span className="sr-only">{t('navigation.theme')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 p-1">
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('navigation.theme')}</DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem onClick={() => setTheme('light')} className="flex items-center gap-2 px-2 py-2 cursor-pointer">
              <Sun className="h-4 w-4 text-orange-500" />
              <span className="text-sm">{t('navigation.light')}</span>
              {theme === 'light' && <Check className="ml-auto h-4 w-4 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')} className="flex items-center gap-2 px-2 py-2 cursor-pointer">
              <Moon className="h-4 w-4 text-blue-400" />
              <span className="text-sm">{t('navigation.dark')}</span>
              {theme === 'dark' && <Check className="ml-auto h-4 w-4 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')} className="flex items-center gap-2 px-2 py-2 cursor-pointer">
              <Monitor className="h-4 w-4" />
              <span className="text-sm">{t('navigation.system')}</span>
              {theme === 'system' && <Check className="ml-auto h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 pl-3 border-l ml-1 border-border/50 cursor-pointer hover:bg-accent/50 transition-colors py-1 px-2 rounded-lg group">
              <Avatar className="h-8 w-8 rounded-full border-2 border-primary/20 shadow-sm transition-transform group-hover:scale-105">
                {user?.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt="Avatar" 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold tracking-tighter">
                    {getInitials()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="hidden md:flex flex-col text-left leading-tight">
                <span className="text-sm font-bold truncate max-w-[150px]">
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.nombre || t('navigation.user')}
                </span>
                <span className="text-[10px] text-primary/80 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  {user?.role || user?.tipo || t('navigation.admin')}
                </span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1">
            <DropdownMenuLabel className="px-2 py-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold leading-none">{t('navigation.myAccount')}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">{user?.email || ''}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            
            {isMaster && (
              <DropdownMenuItem
                onClick={handleUploadClick}
                disabled={isUploading}
                className="flex items-center gap-2 px-2 py-2.5 cursor-pointer focus:bg-accent rounded-md group"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                )}
                <span className="text-sm font-semibold">{t('navigation.changeImage')}</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={onLogout}
              className="flex items-center gap-2 px-2 py-2.5 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/30 rounded-md group"
            >
              <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="text-sm font-semibold">{t('navigation.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Hidden file input for Avatar upload */}
        {isMaster && (
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        )}
      </div>
    </header>
  );
}
