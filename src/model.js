const admin = require("firebase-admin");
const serviceAccount = require("../config/firebaseServiceAccountKey.json");
const { nanoid } = require("nanoid");
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const multer = require('multer');
const storageMem = multer.memoryStorage();  
const upload = multer({ storage: storageMem });

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
    const gcsFile = bucket.file(Date.now() + path.extname(file.originalname));
    const stream = gcsFile.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    stream.on('error', (err) => reject(err));
    stream.on('finish', () => {
      
      gcsFile.makePublic().then(() => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFile.name}`;
        resolve(publicUrl);
      });
    });

    stream.end(file.buffer);
  });
}

const firestoreInstance = admin.firestore();
const db = firestoreInstance.collection('predictions'); 


async function getPredictionsFromDB(req, res) {
    const response = await db.get();  
    
    let responseArr = [];
    
    response.forEach((doc) => {
      responseArr.push({ id: doc.id, ...doc.data() }); 
    });
    return responseArr;
}


async function savePrediction(predictionData) {
    
    const customId = nanoid();
   
    const docRef = db.doc(customId);  
    await docRef.set({
      dataid: customId,
      result: predictionData.result,
      suggestion: predictionData.suggestion,
      timestamp: admin.firestore.Timestamp.now(),  
    });
    
    return { id: customId, ...predictionData };
  } 

module.exports = {
  getPredictionsFromDB,
  savePrediction,
  uploadImageToGCS
};
