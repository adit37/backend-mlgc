// /src/controller.js
const { processImageFromUrl, predict } = require('./handler');
const { savePrediction, getPredictionsFromDB, uploadImageToGCS } = require('./model');

function convertFirestoreTimestampToDate(firestoreTimestamp) {
  const seconds = firestoreTimestamp._seconds;
  const nanoseconds = firestoreTimestamp._nanoseconds;

  const milliseconds = seconds * 1000 + nanoseconds / 1000000;

  return new Date(milliseconds);
}

// Endpoint untuk menangani upload gambar dan prediksi
async function handleImageUploadAndPrediction(req, res) {
  try {
    const file = req.file;  // Mendapatkan file gambar dari request
    if (!file) {
      return res.status(400).send({ message: 'No file uploaded' });
    }
    // Pastikan file tidak lebih dari 1 MB
    if (file.size > 1 * 1024 * 1024) {  // 1 MB
      return res.status(400).send({ message: 'File nya melebihi 1 MB! Segera ganti' });
    }
    // Meng-upload gambar ke GCS dan mendapatkan URL
    const imageUrl = await uploadImageToGCS(file);
    // Memproses gambar dari URL untuk prediksi
    const imageTensor = await processImageFromUrl(imageUrl);
    // Melakukan prediksi menggunakan TensorFlow.js
    const predictionResult = await predict(imageTensor);
    // Menyimpan hasil prediksi ke Firestore (opsional)
    const savedPrediction = await savePrediction({
      result: predictionResult.result,
      suggestion: predictionResult.suggestion,
    });
    // Mengirim response dengan hasil prediksi
    res.status(200).json({
      status: 'success',
      message: 'Prediksi berhasil dilakukan.',
      data: savedPrediction,
    });
  } catch (error) {
    console.error('Error handling image upload and prediction:', error);
    res.status(500).json({
      status: 'fail',
      message: 'Terjadi kesalahan dalam melakukan prediksi.',
    });
  }
}

// Mengambil data prediksi yang sudah ada dari database
async function getPredictions(req, res) {
  try {
    const predictions = await getPredictionsFromDB();
    const formattedPredictions = predictions.map(prediction => ({
      id: prediction.id,  
      history: {
        id: prediction.historyId,  
        createdAt: convertFirestoreTimestampToDate(prediction.timestamp).toISOString(),
        result: prediction.result,  
        suggestion: prediction.suggestion,  
      }
    }));
    // Mengirim response dengan format yang diinginkan
    res.status(200).json({
      status: 'success',
      data: formattedPredictions,
    });
  } catch (error) {
    console.error('Error mengambil data prediksi:', error);
    res.status(500).json({
      status: 'fail',
      message: 'Terjadi kesalahan dalam mengambil data prediksi',
    });
  }
}

module.exports = {
  handleImageUploadAndPrediction,
  getPredictions,
};
