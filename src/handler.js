const fs = require("fs");
const path = require("path");
const tensorflow = require("@tensorflow/tfjs-node");
const fetch = require("node-fetch");
const { savePrediction } = require("./model");

async function processImageFromUrl(imageUrl) {
  
  const response = await fetch(imageUrl);
  const imageBuffer = await response.buffer();
  const tfimage = tensorflow.node.decodeImage(imageBuffer);
  const resizedImage = tfimage.resizeBilinear([224, 224]); // Sesuaikan dengan ukuran model
  const normalizedImage = resizedImage.expandDims(0).div(255.0); // Normalisasi gambar

  return normalizedImage;
}
async function predict(imageTensor) {
 let model;
  try {
    model = await tensorflow.loadGraphModel('https://storage.googleapis.com/bucket-model-mlgc-dicoding/submissions-model_2/model.json');
  } catch (error) {
    console.error("Error loading model:", error);
    throw new Error("Model loading failed");
  }
  const prediction = model.predict(imageTensor);
  const score = await prediction.data();  
  const confidenceScore = Math.max(...score) * 100; 

  let result = "";
  let suggestion = "";
  let createdAt = new Date().toISOString();

  if (confidenceScore > 58) {  
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
