# 🚀 Guía de Despliegue (Apache + Node.js)

Esta guía está diseñada para desplegar **Línea Digital Astro** en un servidor existente con **Apache**.

Dado que Astro (en modo SSR) es una aplicación Node.js de larga ejecución, no se "aloja" dentro de Apache como PHP. En su lugar, ejecutamos la app de Astro en un puerto interno (ej. `4321`) y configuramos Apache como **Proxy Inverso** para que redirija el tráfico público hacia ella.

---

## 📋 Requisitos Previos

- **Node.js**: v18.17.1 o superior instalado en el servidor.
- **Apache2**: Instalado y corriendo (con módulos proxy activos).
- **PM2**: Gestor de procesos para Node.js (`npm install -g pm2`).
- **Git**: Para descargar el código.

---

## ⚙️ 1. Preparación de la Aplicación

Conéctate via SSH a tu servidor y sigue estos pasos:

### 1.1 Descargar y Construir
```bash
# Navega a tu carpeta de sitios (ejemplo)
cd /var/www/html

# Clona el repo (si es privado, usa token o clave SSH)
git clone https://github.com/herwingx/linea-digital-astro.git
cd linea-digital-astro

# Instalar dependencias
npm ci

# Crear archivo .env de producción
cp .env.example .env
nano .env 
# (Edita las variables con tus claves reales de Producción)

# Construir la aplicación
npm run build
```

### 1.2 Ejecutar con PM2
Usaremos PM2 para que la app se mantenga viva siempre, incluso si el servidor se reinicia.

```bash
# Iniciar el proceso (Asumiendo puerto 4321 por defecto)
pm2 start dist/server/entry.mjs --name "linea-digital"

# Guardar la lista de procesos para reinicios
pm2 save
pm2 startup
```

> **Nota:** Verifica que la app corre con `pm2 status`. Si necesitas cambiar el puerto, usa `HOST=0.0.0.0 PORT=8080 pm2 start ...`.

---

## 🦅 2. Configuración de Apache (Reverse Proxy)

Debemos decirle a Apache que todo lo que llegue a `linea-digital.com` lo envíe internamente a `http://localhost:4321`.

### 2.1 Activar módulos necesarios
Ejecuta esto una sola vez:
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
sudo a2enmod headers
sudo systemctl restart apache2
```

### 2.2 Crear VirtualHost
Edita o crea el archivo de configuración:
`sudo nano /etc/apache2/sites-available/linea-digital.com.conf`

Agrega el siguiente contenido:

```apache
<VirtualHost *:80>
    ServerName linea-digital.com
    ServerAlias www.linea-digital.com
    
    # Redirigir todo HTTP a HTTPS (Opcional pero recomendado)
    # RewriteEngine On
    # RewriteCond %{HTTPS} off
    # RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # Logs
    ErrorLog ${APACHE_LOG_DIR}/linea-digital-error.log
    CustomLog ${APACHE_LOG_DIR}/linea-digital-access.log combined

    # === Configuración del Proxy Inverso ===
    ProxyRequests Off
    ProxyPreserveHost On
    ProxyVia Full

    <Proxy *>
        Require all granted
    </Proxy>

    # Redirigir tráfico al puerto de Astro (4321)
    ProxyPass / http://localhost:4321/
    ProxyPassReverse / http://localhost:4321/
    
    # Headers recomendados para seguridad básica
    Header set X-XSS-Protection "1; mode=block"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
</VirtualHost>
```

### 2.3 Activar y Reiniciar
```bash
# Habilitar el sitio
sudo a2ensite linea-digital.com.conf

# Verificar sintaxis
sudo apache2ctl configtest
# (Debería decir "Syntax OK")

# Recargar Apache
sudo systemctl reload apache2
```

---

## 🔒 3. HTTPS (SSL con Certbot)

Si ya tienes Certbot instalado para Apache:

```bash
sudo certbot --apache -d linea-digital.com -d www.linea-digital.com
```
Certbot detectará tu configuración de ProxyPass y configurará el SSL automáticamente, manteniendo la redirección al puerto 4321.

---

## 🔄 4. Actualizar en el futuro

Cuando hagas cambios en el código (`git push`), el proceso de actualización en el servidor es:

```bash
cd /var/www/html/linea-digital-astro
git pull origin main
npm install    # Solo si hubo cambios en dependencias
npm run build  # Reconstruir la app
pm2 restart linea-digital
```
