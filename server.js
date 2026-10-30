const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Servir la build moderna de React (frontend/dist) si está disponible, o fallback a public
const distPath = path.join(__dirname, 'frontend', 'dist');
const publicPath = path.join(__dirname, 'public');

if (fs.existsSync(distPath)) {
    console.log('⚡ Sirviendo aplicación moderna React desde frontend/dist');
    app.use(express.static(distPath));
    app.get('/fichajes', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
    app.use(express.static(publicPath));
} else {
    console.log('📁 Sirviendo sitio estático desde public');
    app.use(express.static(publicPath));
    app.get('/fichajes', (req, res) => res.sendFile(path.join(publicPath, 'fichajes.html')));
}

// Ruta alternativa para acceder a la versión estática histórica si se desea
app.use('/v1', express.static(publicPath));

// React maneja las rutas de la aplicación cuando existe una build lista.
if (fs.existsSync(distPath)) {
    app.use((req, res, next) => {
        if (req.method !== 'GET' || req.path.startsWith('/v1')) return next();
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Servidor de La Bombonerita FC corriendo en http://localhost:${PORT}`);
});
