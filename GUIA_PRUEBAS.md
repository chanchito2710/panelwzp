# 📱 Guía de Pruebas - Panel WhatsApp Multi-Dispositivo

## ✅ Estado Actual del Sistema

**Backend:** ✅ Corriendo en `http://localhost:5000`  
**Frontend:** ✅ Corriendo en `http://localhost:3002`  
**Dispositivos:** 5 sucursales creadas (1 conectada)

---

## 🧪 **PRUEBA 1: Vinculación de Dispositivo**

### Pasos:

1. **Abrir el Panel:**
   - Navega a `http://localhost:3002`
   - Haz clic en "Abrir Panel WhatsApp"

2. **Seleccionar una Sucursal:**
   - Haz clic en cualquier sucursal "Sin vincular" (Sucursal 2, 3, 4 o 5)
   - Verás un código QR en pantalla

3. **Escanear el QR:**
   - Abre WhatsApp en tu teléfono
   - Ve a: **Configuración > Dispositivos vinculados > Vincular un dispositivo**
   - Escanea el código QR que aparece en el panel
   - **⚠️ IMPORTANTE:** El QR expira en 20 segundos. Si expira, haz clic en "🔄 Regenerar QR"

4. **Confirmar Vinculación:**
   - El estado del dispositivo cambiará de "QR_READY" a "CONNECTED"
   - Aparecerá el número de teléfono
   - El indicador se pondrá verde

---

## 📨 **PRUEBA 2: Recepción de Mensajes**

### Pasos:

1. **Desde tu teléfono:**
   - Envía un mensaje de WhatsApp a cualquier contacto
   - O envíate un mensaje a ti mismo

2. **En el Panel:**
   - Automáticamente aparecerá el chat en la lista lateral
   - Verás un preview del mensaje
   - El mensaje mostrará:
     - Nombre del contacto
     - Contenido del mensaje
     - Hora de recepción

3. **Hacer clic en el Chat:**
   - Haz clic en el chat de la lista
   - Verás el área de conversación completa
   - Los mensajes recibidos aparecen en gris a la izquierda

---

## 📤 **PRUEBA 3: Envío de Mensajes de Texto**

### Pasos:

1. **Abrir un Chat:**
   - Haz clic en cualquier chat de la lista

2. **Escribir Mensaje:**
   - En el campo de texto inferior, escribe tu mensaje
   - Ejemplo: "Hola, este es un mensaje de prueba desde el panel"

3. **Enviar:**
   - Presiona **Enter** o haz clic en el ícono de enviar (✈️)
   - El mensaje aparecerá en verde a la derecha con la etiqueta "Panel"

4. **Verificar en el Teléfono:**
   - El mensaje llegará a WhatsApp en tu teléfono
   - Verás el mensaje enviado desde "Panel WhatsApp"

---

## 📎 **PRUEBA 4: Envío de Archivos**

### Pasos:

1. **Abrir un Chat activo**

2. **Adjuntar Archivo:**
   - Haz clic en el ícono de **📎 Paperclip**
   - Selecciona un archivo:
     - 📷 Imagen (JPG, PNG, GIF)
     - 📄 Documento (PDF, DOCX, TXT)
     - 🎥 Video (MP4, AVI, MOV)
     - 🎵 Audio (MP3, WAV, OGG)

3. **Enviar:**
   - El archivo se subirá automáticamente
   - Verás un indicador de carga
   - El archivo aparecerá en el chat

4. **Verificar:**
   - El archivo llegará al chat de WhatsApp en tu teléfono
   - Podrás descargarlo y abrirlo

---

## 🎤 **PRUEBA 5: Notas de Voz**

### Pasos:

1. **Abrir un Chat activo**

2. **Iniciar Grabación:**
   - Cuando el campo de texto esté vacío, verás el ícono de **🎤 Micrófono**
   - Haz clic en el micrófono
   - El navegador pedirá permiso para acceder al micrófono (acepta)

3. **Grabar:**
   - Verás un indicador rojo pulsante: "Grabando..."
   - Contador de tiempo en formato MM:SS
   - Habla tu mensaje (máximo recomendado: 1-2 minutos)

4. **Enviar o Cancelar:**
   - **Enviar:** Haz clic en el ícono de enviar (✈️ verde)
   - **Cancelar:** Haz clic en la X roja

5. **Verificar:**
   - La nota de voz llegará a WhatsApp en tu teléfono
   - Aparecerá como una nota de voz reproducible

---

## 📋 **PRUEBA 6: Plantillas de Respuestas Rápidas**

### Pasos:

1. **Ir a la pestaña "Plantillas"**

2. **Ver Plantillas por Defecto:**
   - Saludo (/hola)
   - Agradecimiento (/gracias)
   - Horario (/horario)
   - Contacto (/contacto)

3. **Crear Nueva Plantilla:**
   - Haz clic en "+ Nueva Plantilla"
   - Completa:
     - **Nombre:** Ej. "Despedida"
     - **Categoría:** Ej. "Atención al Cliente"
     - **Atajo:** Ej. "/adios"
     - **Contenido:** Ej. "Gracias por contactarnos. ¡Hasta pronto!"
   - Haz clic en "Guardar"

4. **Usar Plantilla:**
   - Haz clic en el ícono de copiar (📋) en una plantilla
   - El contenido se copiará automáticamente
   - (Próximamente: se pegará directamente en el chat activo)

---

## 📁 **PRUEBA 7: Búsqueda de Archivos**

### Pasos:

1. **Ir a la pestaña "Archivos / Comprobantes"**

2. **Buscar:**
   - Usa el campo de búsqueda para filtrar por nombre o chat
   - Usa el selector de tipo de archivo para filtrar por categoría

3. **Ver Detalles:**
   - Nombre del archivo
   - Chat de origen
   - Tamaño (KB/MB)
   - Fecha de recepción

4. **Descargar:**
   - Haz clic en el ícono de descarga (⬇️)
   - El archivo se descargará a tu carpeta de Descargas

---

## 📊 **PRUEBA 8: Panel de Estadísticas**

### Pasos:

1. **Ir a la pestaña "Estadísticas"**

2. **Ver Métricas:**
   - **Dispositivos:** Total, conectados, desconectados, % de conectividad
   - **Archivos:** Cantidad y tamaño total
   - **Plantillas:** Total y más usada
   - **Etiquetas:** Total de categorías

3. **Actualización Automática:**
   - Las estadísticas se actualizan cada 10 segundos automáticamente

---

## ⚠️ **Problemas Comunes y Soluciones**

### 1. "El código QR no escanea"
- **Solución:** El QR expira en 20 segundos. Haz clic en "Regenerar QR"
- **Causa:** Los QR de WhatsApp tienen tiempo limitado por seguridad

### 2. "No veo mis chats"
- **Solución:** Asegúrate de tener el dispositivo vinculado (estado: CONNECTED)
- **Causa:** Los chats solo se cargan después de vincular el dispositivo

### 3. "Los mensajes no llegan"
- **Solución:** Verifica que el backend esté corriendo (`netstat -ano | findstr :5000`)
- **Solución:** Verifica la conexión Socket.io en la consola del navegador
- **Causa:** Problema de conexión entre frontend y backend

### 4. "El micrófono no funciona"
- **Solución:** Acepta los permisos del navegador para acceder al micrófono
- **Solución:** Verifica que ninguna otra app esté usando el micrófono
- **Causa:** Permisos del navegador o conflicto de recursos

### 5. "El dispositivo se desconecta"
- **Solución:** Verifica que el teléfono tenga internet
- **Solución:** No cierres WhatsApp en el teléfono
- **Causa:** WhatsApp requiere que el teléfono principal esté conectado

---

## 🔧 **Comandos Útiles para Debugging**

### Ver estado de dispositivos:
```powershell
curl -s http://localhost:5000/api/devices | ConvertFrom-Json | Select-Object id, name, status, phoneNumber | Format-Table
```

### Ver archivos almacenados:
```powershell
curl -s "http://localhost:5000/api/storage/files?deviceId=us0jthgly" | ConvertFrom-Json | Format-Table
```

### Ver plantillas:
```powershell
curl -s http://localhost:5000/api/templates | ConvertFrom-Json | Select-Object name, shortcut, category | Format-Table
```

### Reiniciar backend:
```powershell
# Encontrar PID
netstat -ano | findstr :5000
# Matar proceso
taskkill /F /PID <PID>
# Reiniciar
cd backend && npx ts-node src/index.ts
```

---

## 📞 **Soporte Técnico**

### Logs del Backend:
- Los logs se muestran en la terminal donde corre `npx ts-node src/index.ts`
- Busca errores en rojo o warnings en amarillo

### Logs del Frontend:
- Abre la consola del navegador (F12)
- Ve a la pestaña "Console"
- Busca errores o warnings

### Base de Datos:
- Archivos JSON en `db/`
- Archivos de autenticación en `db/auth/<deviceId>/`
- Archivos media en `db/storage/<deviceId>/<chatId>/`

---

## ✅ **Checklist de Funcionalidades**

- [x] Vinculación de dispositivos vía QR
- [x] Recepción de mensajes en tiempo real
- [x] Envío de mensajes de texto
- [x] Envío de archivos (imágenes, PDF, videos, audio)
- [x] Grabación y envío de notas de voz
- [x] Sistema de plantillas de respuestas
- [x] Búsqueda y filtrado de archivos
- [x] Panel de estadísticas
- [x] Soporte para múltiples dispositivos (hasta 10)
- [x] Encriptación de datos sensibles
- [x] Sistema de etiquetas para chats
- [x] Exportación de conversaciones
- [x] Gestión de grupos de WhatsApp

---

**🎉 ¡Sistema Completamente Funcional!**

Para cualquier problema, revisa los logs del backend y la consola del navegador.
