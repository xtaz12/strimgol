const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Configuramos las cabeceras estándar para engañar a los servidores
const requestHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3'
};

// Función auxiliar para extraer el m3u8 de una URL específica
async function tryExtract(url, referer) {
    try {
        const response = await axios.get(url, {
            headers: { ...requestHeaders, 'Referer': referer },
            timeout: 4000 // Si tarda más de 4 segundos, pasamos a la siguiente señal
        });
        
        const html = response.data;
        // Expresión regular mejorada para capturar URLs con o sin comillas finales
        const regex = /(https?:[^"'\s]*?\.m3u8[^"'\s]*)/i;
        const match = html.match(regex);
        
        return match ? match[1] : null;
    } catch (e) {
        return null; // Si da error (bloqueo por IP, 403, etc.), devuelve null
    }
}

// Ruta principal tipo "túnel" que procesa las 3 opciones en orden
app.get('/live.m3u8', async (req, res) => {
    let targetUrl = null;

    // INTENTO 1: DSports (Flujo principal)
    console.log("Intentando Señal 1: DSports...");
    targetUrl = await tryExtract('https://streamtpday1.xyz/global2.php?stream=dsports', 'https://streamtpday1.xyz/');

    // INTENTO 2: Si falló el 1, intenta Deportes Plus
    if (!targetUrl) {
        console.log("Señal 1 falló. Intentando Señal 2: Deportes Plus...");
        targetUrl = await tryExtract('https://playvi.click/deportesplus.php', 'https://playvi.click/');
    }

    // INTENTO 3: Si falló el 2, intenta Canal 8
    if (!targetUrl) {
        console.log("Señal 2 falló. Intentando Señal 3: Canal 8 de respaldo...");
        targetUrl = await tryExtract('https://playvi.click/canal8.php', 'https://playvi.click/');
    }

    // Si las tres opciones fallaron
    if (!targetUrl) {
        return res.status(404).send('#EXTM3U\n#EXT-X-ERROR: Todas las señales de origen se encuentran caídas o protegidas.');
    }

    // Si logró conseguir alguna, hacemos el puente Proxy para romper el CORS
    try {
        const streamRes = await axios.get(targetUrl, {
            headers: { 
                ...requestHeaders,
                'Referer': targetUrl.includes('streamtpday1') ? 'https://streamtpday1.xyz/' : 'https://playvi.click/'
            },
            responseType: 'text'
        });

        res.setHeader('Content-Type', 'application/x-mpegURL');
        res.send(streamRes.data);
    } catch (error) {
        res.status(500).send('#EXTM3U\n#EXT-X-ERROR: Error al transmitir los fragmentos de video.');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de contingencia corriendo en puerto ${PORT}`);
});
