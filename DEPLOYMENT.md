# Guía de Deployment - Sistema de Usuarios Rotator

**Versión:** 1.0  
**Fecha:** 2026-01-13

---

## 📋 Requisitos Previos

### Software Necesario
- **Node.js:** v18.0.0 o superior
- **npm:** v9.0.0 o superior
- **Base de Datos:** SQLite (incluido) o MySQL/PostgreSQL (opcional)
- **Servidor Web:** Nginx o Apache (recomendado para producción)
- **PM2:** Para gestión de procesos Node.js

### Hardware Recomendado (Producción)
- **CPU:** 2+ cores
- **RAM:** 2GB mínimo, 4GB recomendado
- **Disco:** 10GB mínimo
- **Red:** Conexión estable a internet

---

## 🔧 Variables de Entorno

### Archivo `.env` (Producción)

Crear archivo `.env` en la raíz del proyecto:

```env
# Entorno
NODE_ENV=production

# Puerto del servidor
PORT=3005

# Base de Datos (SQLite por defecto)
DATABASE_URL="file:./backend/prisma/rotator.db"

# JWT Secrets (CAMBIAR EN PRODUCCIÓN)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Frontend URL (para CORS)
FRONTEND_ORIGIN=https://yourdomain.com

# Email (para recuperación de contraseña y notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# PayPal (opcional)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=production

# Swagger (opcional en producción)
ENABLE_SWAGGER=false

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Generar Secrets Seguros

```bash
# Generar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generar JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📦 Proceso de Build

### 1. Clonar Repositorio

```bash
git clone https://github.com/your-org/SistemaDeUsuarios.git
cd SistemaDeUsuarios
```

### 2. Instalar Dependencias

```bash
# Instalar dependencias del proyecto completo
npm install

# Generar Prisma Client
npm -w backend exec prisma generate
```

### 3. Configurar Base de Datos

#### Opción A: SQLite (Por defecto)

```bash
cd backend
npx prisma db push
npm run seed
cd ..
```

#### Opción B: MySQL/PostgreSQL

1. Actualizar `DATABASE_URL` en `.env`:
```env
# MySQL
DATABASE_URL="mysql://user:password@localhost:3306/rotator_db"

# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/rotator_db"
```

2. Actualizar `backend/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "mysql"  // o "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Ejecutar migraciones:
```bash
cd backend
npx prisma db push
npm run seed
cd ..
```

### 4. Build del Frontend

```bash
npm run build
```

Esto genera los archivos estáticos en `frontend/dist/`

---

## 🚀 Deployment

### Opción 1: Servidor con PM2 (Recomendado)

#### Instalar PM2

```bash
npm install -g pm2
```

#### Crear archivo `ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'rotator-backend',
    script: './backend/src/index.js',
    cwd: './',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3005
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
```

#### Iniciar con PM2

```bash
# Iniciar aplicación
pm2 start ecosystem.config.js

# Ver logs
pm2 logs rotator-backend

# Ver estado
pm2 status

# Reiniciar
pm2 restart rotator-backend

# Detener
pm2 stop rotator-backend

# Configurar inicio automático
pm2 startup
pm2 save
```

---

### Opción 2: Nginx como Reverse Proxy

#### Instalar Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### Configurar Nginx

Crear archivo `/etc/nginx/sites-available/rotator`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificates (usar Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Logs
    access_log /var/log/nginx/rotator-access.log;
    error_log /var/log/nginx/rotator-error.log;

    # Frontend estático
    location / {
        root /var/www/rotator/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # API Backend
    location /auth {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location ~ ^/(users|licenses|activations|pending-licenses|catalog|notifications|me|health|api-docs) {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

#### Activar configuración

```bash
sudo ln -s /etc/nginx/sites-available/rotator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Configurar SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🔒 Seguridad en Producción

### 1. Firewall

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. Actualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Configurar Fail2Ban

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 💾 Backup y Recuperación

### Backup de Base de Datos (SQLite)

```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/var/backups/rotator"
DATE=$(date +%Y%m%d_%H%M%S)
DB_FILE="/var/www/rotator/backend/prisma/rotator.db"

mkdir -p $BACKUP_DIR
cp $DB_FILE "$BACKUP_DIR/rotator_$DATE.db"

# Mantener solo últimos 30 días
find $BACKUP_DIR -name "rotator_*.db" -mtime +30 -delete

echo "Backup completado: rotator_$DATE.db"
```

### Automatizar Backups (Cron)

```bash
# Editar crontab
crontab -e

# Agregar línea para backup diario a las 2 AM
0 2 * * * /var/www/rotator/backup-db.sh
```

### Restaurar Backup

```bash
# Detener aplicación
pm2 stop rotator-backend

# Restaurar base de datos
cp /var/backups/rotator/rotator_YYYYMMDD_HHMMSS.db /var/www/rotator/backend/prisma/rotator.db

# Reiniciar aplicación
pm2 start rotator-backend
```

---

## 📊 Monitoreo y Logs

### Ver Logs de PM2

```bash
# Logs en tiempo real
pm2 logs rotator-backend

# Últimas 100 líneas
pm2 logs rotator-backend --lines 100

# Solo errores
pm2 logs rotator-backend --err
```

### Logs de Nginx

```bash
# Access log
sudo tail -f /var/log/nginx/rotator-access.log

# Error log
sudo tail -f /var/log/nginx/rotator-error.log
```

### Monitoreo con PM2

```bash
# Dashboard de PM2
pm2 monit

# Información detallada
pm2 info rotator-backend
```

---

## 🔄 Actualización de la Aplicación

### Proceso de Actualización

```bash
#!/bin/bash
# update.sh

# 1. Backup de base de datos
./backup-db.sh

# 2. Pull últimos cambios
git pull origin main

# 3. Instalar dependencias
npm install

# 4. Regenerar Prisma Client
npm -w backend exec prisma generate

# 5. Build frontend
npm run build

# 6. Aplicar migraciones de BD (si hay)
cd backend
npx prisma db push
cd ..

# 7. Reiniciar aplicación
pm2 restart rotator-backend

echo "Actualización completada"
```

---

## ⚠️ Troubleshooting

### Problema: Backend no inicia

```bash
# Ver logs de PM2
pm2 logs rotator-backend --err

# Verificar puerto
sudo netstat -tulpn | grep 3005

# Verificar permisos de base de datos
ls -la backend/prisma/rotator.db
```

### Problema: Error de conexión a BD

```bash
# Verificar que el archivo existe
ls -la backend/prisma/rotator.db

# Verificar permisos
chmod 644 backend/prisma/rotator.db

# Recrear base de datos
cd backend
npx prisma db push
node scripts/seed_master.js
cd ..
```

### Problema: Frontend muestra 404

```bash
# Verificar que el build existe
ls -la frontend/dist/

# Rebuild frontend
npm run build

# Verificar configuración de Nginx
sudo nginx -t
```

---

## 📝 Checklist de Deployment

- [ ] Servidor configurado con Node.js 18+
- [ ] Variables de entorno configuradas en `.env`
- [ ] Secrets JWT generados y configurados
- [ ] Dependencias instaladas (`npm install`)
- [ ] Prisma Client generado
- [ ] Base de datos inicializada
- [ ] Usuario MASTER creado
- [ ] Frontend compilado (`npm run build`)
- [ ] PM2 instalado y configurado
- [ ] Nginx instalado y configurado
- [ ] SSL configurado con Let's Encrypt
- [ ] Firewall configurado
- [ ] Backups automatizados configurados
- [ ] Logs configurados y funcionando
- [ ] Aplicación iniciada con PM2
- [ ] Dominio apuntando al servidor
- [ ] HTTPS funcionando correctamente
- [ ] API endpoints respondiendo
- [ ] Frontend cargando correctamente

---

## 📞 Soporte

Para problemas o preguntas:
- **Email:** support@rotatorsurvey.com
- **Documentación:** Ver `DOCUMENTACION_COMPLETA.md`
- **Logs:** Revisar `/var/log/nginx/` y `pm2 logs`

---

**Última actualización:** 2026-01-13  
**Versión:** 1.0
