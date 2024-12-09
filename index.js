const express = require("express");
const cors = require('cors'); // Import cors middleware
const admin = require("firebase-admin");
const multer = require("multer");
const port = 3001;

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
app.use(cors()); // Enable CORS for all routes


// Firebase Admin Setup
const serviceAccount = require("./serviceAccountKey.json");

try {  // Wrap Firebase initialization in try-catch
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "checkimage.app", // Replace with your storage bucket name
  });
} catch (error) {
  console.error("Firebase initialization failed:", error);
  process.exit(1); // Exit the process if Firebase initialization fails
}



const bucket = admin.storage().bucket();


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Endpoint to Upload Image
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded." });
    }

    const blob = bucket.file(req.file.originalname);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    blobStream.on("error", (err) => res.status(500).send({ error: err.message }));

    blobStream.on("finish", async () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`; // Use bucket.name
      res.status(200).send({ url: publicUrl });
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});