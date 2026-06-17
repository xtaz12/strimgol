const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/stream', async (req, res) => {
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

        if (match && match[1]) {
            res.json({ stream_url: match[1] });
        } else {
            res.status(404).json({ error: "No se encontro el enlace en el codigo fuente." });
        }
    } catch (error) {
        res.status(500).json({ error: "Error al conectar con la fuente original." });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
