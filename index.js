const express = require('express');
const translate = require('node-google-translate-skidz'); 
const axios = require('axios');
const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.json());

// Función para traducir texto usando node-google-translate-skidz
app.post('/translate', (req, res) => {
    const { text, targetLang } = req.body;

    // Si el texto está vacio omitir la traduccion
    if (!text || text.trim() === '') {
        return res.json({ translatedText: text }); //devuelve el texto original 
    }

    translate({
        text: text,
        source: 'en', 
        target: targetLang, 
    }, (result) => {
        if (result && result.translation) {
            res.json({ translatedText: result.translation });
        } else {
            res.status(500).json({ error: 'Error al traducir el texto' });
        }
    });
});

app.listen(port, () => {
    console.log(`El servidor está corriendo en http://localhost:${port}`);
});


