const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/empresas',    require('./routes/empresas'));
app.use('/api/locales',     require('./routes/locales'));
app.use('/api/usuarios',    require('./routes/usuarios'));
app.use('/api/repositores', require('./routes/repositores'));
app.use('/api/productos',   require('./routes/productos'));
app.use('/api/activaciones',require('./routes/activaciones'));
app.use('/api/asignaciones',require('./routes/asignaciones'));
app.use('/api/pedidos',     require('./routes/pedidos'));
app.use('/api/cambios',     require('./routes/cambios'));
app.use('/api/objetivos',   require('./routes/objetivos'));
app.use('/api/reclamos',    require('./routes/reclamos'));

app.get('/', (req, res) => {
  res.json({ mensaje: 'SIGMA API v1.0 funcionando' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor SIGMA corriendo en http://localhost:${PORT}`);
});
