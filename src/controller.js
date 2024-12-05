const { processImageFromUrl, predict } = require("./handler");
const {
  savePrediction,
  getPredictionsFromDB,
  uploadImageToGCS,
} = require("./model");

function convertFirestoreTimestampToDate(firestoreTimestamp) {
  const seconds = firestoreTimestamp._seconds;
  const nanoseconds = firestoreTimestamp._nanoseconds;

  const milliseconds = seconds * 1000 + nanoseconds / 1000000;

  return new Date(milliseconds);
}

async function handleImageUploadAndPrediction(req, res) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).send({ message: "No file uploaded" });
    }

    if (file.size > 1 * 1024 * 1024) {
      return res.status(413).json({
        status: "fail",
        message: "Payload content length greater than maximum allowed: 1000000",
      });
    }

    const imageUrl = await uploadImageToGCS(file);

    const imageTensor = await processImageFromUrl(imageUrl);

    const predictionResult = await predict(imageTensor);

    res.status(201).json({
      status: "success",
      message: "Model is predicted successfully",
      data: predictionResult,
    });
  } catch (error) {
    console.error("Error handling image upload and prediction:", error);
    res.status(400).json({
      status: "fail",
      message: "Terjadi kesalahan dalam melakukan prediksi",
    });
  }
}

async function getPredictions(req, res) {
  try {
    const predictions = await getPredictionsFromDB();
    const formattedPredictions = predictions.map((prediction) => ({
      id: prediction.id,
      history: {
        result: prediction.result,
        createdAt: convertFirestoreTimestampToDate(
          prediction.timestamp
        ).toISOString(),
        suggestion: prediction.suggestion,
        id: prediction.dataid,
      },
    }));

    res.status(200).json({
      status: "success",
      data: formattedPredictions,
    });
  } catch (error) {
    console.error("Error mengambil data prediksi:", error);
    res.status(500).json({
      status: "fail",
      message: "Terjadi kesalahan dalam mengambil data prediksi",
    });
  }
}

module.exports = {
  handleImageUploadAndPrediction,
  getPredictions,
};
