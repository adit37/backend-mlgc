const express = require('express');
const multer = require('multer');
const path = require('path');
const { handleImageUploadAndPrediction, getPredictions } = require('./controller');  

const router = express.Router();


const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage }); 

router.post('/predict', upload.single('image'), handleImageUploadAndPrediction);

router.get('/predict/histories', getPredictions);

module.exports = router;
