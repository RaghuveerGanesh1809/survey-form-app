const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();
//const uploadSketchRoutes = require('./routes/uploadSketch');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
// app.use('/api', uploadSketchRoutes);

// Serve static files from the 'uploads' folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/sketchuploads', express.static('sketchuploads'));

// MongoDB connection setup
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB Atlas connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));


// Survey Schema
const surveySchema = new mongoose.Schema({
  kanId: { type: String, required: true },
  surveyor: { type: String, required: true },
  contact: { type: String, required: true },
  location: { type: String, required: true },
  gps: { type: String, required: true },
  areaType: { type: String, required: false },
  elephantFreq: { type: String, required: false },
  lastSpotted: { type: Date, required: false },
  network: { type: Object, required: false },
  wire: { type: String, required: false },
  spikeWire: { type: String, required: false },
  treesCamera: { type: String, required: false },
  treesLight: { type: String, required: false },
  roadAccess: { type: [String], required: false },
  defenceMechanism: { type: [String], required: false },
  suitableSensors: { type: [String], required: false },
  suitableVersion: { type: [String], required: false },
  uploadedImage: { type: [String], required: false },
  sketchImage: { type: String, required: false },
});

const Survey = mongoose.model('Survey', surveySchema);

// Function to generate the next KAN ID
async function generateNextKanId() {
  try {
    const lastSurvey = await Survey.findOne({ kanId: /^KAN-\d+$/ })
                                   .sort({ kanId: -1 })
                                   .lean();

    let nextNumber = 1;

    if (lastSurvey && lastSurvey.kanId) {
      const match = lastSurvey.kanId.match(/KAN-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const formattedId = String(nextNumber).padStart(3, '0');
    return formattedId;
  } catch (error) {
    console.error("Error generating next KAN ID:", error);
    throw new Error("Failed to generate KAN ID");
  }
}

// API to generate next KAN ID (just the number)
app.get('/api/form/next-kan-id', async (req, res) => {
  try {
    const nextKanId = await generateNextKanId();
    res.json({ kanId: nextKanId });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate KAN ID" });
  }
});

// API to submit the form data
app.post('/api/form/submit', async (req, res) => {
  const { 
    surveyor, 
    contact, 
    location, 
    gps, 
    areaType, 
    elephantFreq, 
    lastSpotted, 
    network, 
    wire, 
    spikeWire, 
    treesCamera, 
    treesLight, 
    roadAccess, 
    defenceMechanism, 
    suitableSensors, 
    suitableVersion, 
    uploadedImage,  
    sketchImage 
  } = req.body;

  // Check if all required fields are provided
  if (!surveyor || !contact || !location || !gps) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Generate the next KAN ID for the survey
    const kanId = `KAN-${await generateNextKanId()}`;

    // Clean network: include only selected checkboxes with signals
    const cleanedNetwork = {};
    const providers = ['airtel', 'jio', 'bsnl', 'vi'];
    providers.forEach(provider => {
      if (network[provider]) {
        cleanedNetwork[provider] = true;
        const signalKey = `${provider}Signal`;
        if (network[signalKey]) {
          cleanedNetwork[signalKey] = network[signalKey];
        }
      }
    });

    // Handle uploaded sketch image (base64 to file)
    let uploadedSketchImagePath = '';
    if (sketchImage) {
      const base64Data = sketchImage.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      const fileName = Date.now() + '.png';
      const uploadDir = path.join(__dirname, 'uploads', 'sketches');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const uploadPath = path.join(uploadDir, fileName);
      fs.writeFileSync(uploadPath, base64Data, 'base64');
      uploadedSketchImagePath = `/uploads/sketches/${fileName}`;
    }

    // Handle uploaded image (base64 to file)
    let uploadedImagePaths = [];
    
    const uploadedImageArray = Array.isArray(uploadedImage)
    ? uploadedImage
    : uploadedImage ? [uploadedImage] : [];
    
    if (uploadedImageArray.length) {
      console.log("Processing images...");
      const uploadDir = path.join(__dirname, 'uploads');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      for (const base64Str of uploadedImageArray) {
        if (typeof base64Str === 'string' && base64Str.startsWith("data:image/")) {
          try {
            const base64Data = base64Str.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
            const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.png`;
            const uploadPath = path.join(uploadDir, fileName);
            fs.writeFileSync(uploadPath, base64Data, 'base64');
            uploadedImagePaths.push(`/uploads/${fileName}`);
          } catch (err) {
            console.error("Error processing base64 image:", err);
          }
        } else {
          console.warn("Skipping invalid uploadedImage entry:", base64Str);
        }
      }
    } else {
      console.warn("No uploaded images found");
    }

    // Create a new survey document
    const newSurvey = new Survey({
      kanId,
      surveyor,
      contact,
      location,
      gps,
      areaType,
      elephantFreq,
      lastSpotted,
      network: cleanedNetwork,
      wire,
      spikeWire,
      treesCamera,
      treesLight,
      roadAccess,
      defenceMechanism,
      suitableSensors,
      suitableVersion,
      uploadedImage: uploadedImagePaths,
      sketchImage: uploadedSketchImagePath,
    });

    // Save the new survey to the database
    await newSurvey.save();
    res.status(201).json({ message: "Survey data saved successfully", kanId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving survey data", error });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
