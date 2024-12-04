// /src/model.js
const admin = require("firebase-admin");
const serviceAccount = require("../config/firebaseServiceAccountKey.json");
const { nanoid } = require("nanoid");
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const multer = require('multer');
const storageMem = multer.memoryStorage();  // Menyimpan file sementara di memori
const upload = multer({ storage: storageMem });

// Inisialisasi Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const storage = new Storage({
  keyFilename: path.join(__dirname, '../config/firebaseServiceAccountKey.json'),
});

const bucketName = 'bucket-upload-image-predict';  
const bucket = storage.bucket(bucketName);

async function uploadImageToGCS(file) {
  return new Promise((resolve, reject) => {
    const gcsFile = bucket.file(Date.now() + path.extname(file.originalname)); // Nama file unik berdasarkan timestamp
    const stream = gcsFile.createWriteStream({
      metadata: {
        contentType: file.mimetype,  // Mengatur tipe konten berdasarkan file
      },
    });

    stream.on('error', (err) => reject(err));
    stream.on('finish', () => {
      // Setelah selesai mengupload, dapatkan URL gambar
      gcsFile.makePublic().then(() => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFile.name}`;
        resolve(publicUrl);
      });
    });

    // Menulis file gambar ke Google Cloud Storage
    stream.end(file.buffer);
  });
}

const firestoreInstance = admin.firestore();
const db = firestoreInstance.collection('predictions'); 

// Fungsi untuk mengambil semua data prediksi dari Firestore
async function getPredictionsFromDB(req, res) {
    const response = await db.get();  
    // Membuat array untuk menyimpan data dari setiap dokumen
    let responseArr = [];
    // Looping untuk mengambil data dari setiap dokumen
    response.forEach((doc) => {
      responseArr.push({ id: doc.id, ...doc.data() }); // Menambahkan data dokumen ke array responseArr
    });
    return responseArr;
}

// Fungsi untuk menyimpan hasil prediksi dengan ID custom
async function savePrediction(predictionData) {
    // Membuat ID custom menggunakan nanoid
    const customId = nanoid();
    // Menyimpan data prediksi dengan ID custom
    const docRef = db.doc(customId);  // Gunakan custom ID untuk dokumen
    await docRef.set({
      result: predictionData.result,
      suggestion: predictionData.suggestion,
      timestamp: admin.firestore.Timestamp.now(),  // Menyimpan waktu saat data disimpan
    });
    // Mengembalikan data yang telah disimpan beserta ID
    return { id: customId, ...predictionData };
  } 

module.exports = {
  getPredictionsFromDB,
  savePrediction,
  uploadImageToGCS
};
