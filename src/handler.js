const fs = require("fs");
const path = require("path");
const tensorflow = require("@tensorflow/tfjs-node");
const fetch = require("node-fetch");
const { savePrediction, uploadImageToGCS } = require("./model");

// Fungsi untuk memproses gambar dari URL
async function processImageFromUrl(imageUrl) {
  // Ambil gambar dari URL
  const response = await fetch(imageUrl);
  // Dapatkan ukuran gambar dari header HTTP Content-Length
  const contentLength = response.headers.get("content-length");
  if (!contentLength) {
    throw new Error("Tidak dapat membaca ukuran gambar.");
  }
  const imageSizeInBytes = parseInt(contentLength, 10);
  // Tentukan batas ukuran gambar (1 MB = 1048576 byte)
  const MAX_SIZE = 1048576; // 1 MB
  if (imageSizeInBytes > MAX_SIZE) {
    throw new Error("Ukuran gambar terlalu besar, maksimal 1 MB.");
  }
  const imageBuffer = await response.buffer();
  // Proses gambar dengan TensorFlow.js
  const tfimage = tensorflow.node.decodeImage(imageBuffer);
  const resizedImage = tfimage.resizeBilinear([224, 224]); // Sesuaikan dengan ukuran model
  const normalizedImage = resizedImage.expandDims(0).div(255.0); // Normalisasi gambar

  return normalizedImage;
}

// Fungsi untuk melakukan prediksi
async function predict(imageTensor) {
  let model;
  try {
    model = await tensorflow.loadGraphModel('https://storage.googleapis.com/bucket-model-mlgc-dicoding/submissions-model/model.json');
  } catch (error) {
    console.error("Error loading model:", error);
    throw new Error("Model loading failed");
  }
  const predictions = await model.predict(imageTensor).array();

  let result = "";
  let suggestion = "";
  let createdAt = new Date().toISOString();

  if (predictions[0][0] > 0.5) {
    result = "Cancer";
    suggestion = "Segera periksa ke dokter!";
  } else {
    result = "Non-cancer";
    suggestion = "Penyakit kanker tidak terdeteksi.";
  }

  const predictionData = { result, suggestion, createdAt };
  const savedPrediction = await savePrediction(predictionData);

  return savedPrediction;
}

module.exports = {
  predict,
  processImageFromUrl,
};
