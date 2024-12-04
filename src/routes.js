// /src/routes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { handleImageUploadAndPrediction, getPredictions } = require('./controller');  // Mengimpor controller

const router = express.Router();

// Set up multer untuk menangani upload gambar
const storage = multer.memoryStorage(); // Simpan file di memory (tidak perlu disimpan ke disk)
const upload = multer({ storage: storage }); // Membuat middleware upload menggunakan multer

// Route untuk melakukan prediksi menggunakan gambar yang diupload
router.post('/predict', upload.single('image'), handleImageUploadAndPrediction);

// Route untuk melihat data prediksi yang sudah masuk
router.get('/predict/histories', getPredictions);

module.exports = router;
