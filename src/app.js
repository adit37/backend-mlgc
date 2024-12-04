// /src/app.js
const express = require('express');
const cors = require('cors');
const routes = require('./routes');  // Mengimpor router dari routes.js

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());  // Untuk menerima JSON di body request
app.use(cors());  // Untuk mengizinkan CORS

// Gunakan routes
app.use('/api', routes);  // Semua route akan diawali dengan /api

// Menjalankan server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
