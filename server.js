const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Función interna para extraer el enlace m3u8 original
async function extractM3u8() {
    try {
        const response = await axios.get('https://streamtpday1.xyz/global2.php?stream=dsports', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://streamtpday1.xyz/'
            }
        });
        const html = response.data;
        const regex = /(https?:.*?\.m3u8.*?)"/i;
        const match = html.match(regex);
        return match ? match[1] : null;
    } catch (e) {
        return null;
    }
}

// NUEVA RUTA: Hace de túnel/proxy para evadir el bloqueo de CORS del navegador
app.get('/live.m3u8', async (req, res) => {
    const targetUrl = await extractM3u8();
    
    if (!targetUrl) {
        return res.status(404).send('No se pudo obtener la señal de origen.');
    }

    try {
        // Render solicita el archivo de video usando las cabeceras simuladas
        const streamRes = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://streamtpday1.xyz/'
            },
            responseType: 'text'
        });

        // Le devolvemos el contenido del m3u8 directamente a tu reproductor burlando el CORS
        res.setHeader('Content-Type', 'application/x-mpegURL');
        res.send(streamRes.data);
    } catch (error) {
        res.status(500).send('Error al transmitir el puente de video.');
    }
});

// Mantenemos la ruta anterior por compatibilidad
app.get('/stream', async (req, res) => {
    const url = await extractM3u8();
    if (url) res.json({ stream_url: url });
    else res.status(404).json({ error: "No encontrado" });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
