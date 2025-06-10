const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("./models/User");
const imageDownloader = require("image-downloader");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const fs = require("fs");
const cloudinary = require("../server/cloudinaryConfig.js");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const SheepModel = require("./models/Sheep");
const { extractPublicId } = require("cloudinary-build-url");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "sheep",
    format: async (req, file) => "png",
    public_id: (req, file) => file.filename,
  },
});

const upload = multer({ storage: storage });

require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "ahdajshddasd";

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    // origin: "https://peternakningsalatiga.vercel.app",
    origin: "http://localhost:5173",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.get("/test", (req, res) => {
  res.json("test ok");
});

app.post("/register", async (req, res) => {
  const { name, username, password } = req.body;
  try {
    const user = await UserModel.create({
      name,
      username,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(user);
  } catch (error) {
    res.status(422).json(error);
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await UserModel.findOne({ username });
  if (user) {
    const passOk = bcrypt.compareSync(password, user.password);
    if (passOk) {
      jwt.sign(
        { username: user.username, id: user._id },
        jwtSecret,
        { expiresIn: "1h" },
        (err, token) => {
          if (err) throw err;
          res
            .cookie("token", token, {
              httpOnly: true,
              secure: true,
              sameSite: "None",
            })
            .json(user);
        }
      );
    } else {
      res.status(422).json("pass not ok");
    }
  } else {
    res.status(500).json("not found");
  }
});

app.get("/admin", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, admin) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token" });
      }
      res.json(admin);
    });
  } else {
    res.json(null);
  }
});

app.post("/upload-by-link", async (req, res) => {
  const { link } = req.body;
  try {
    const result = await cloudinary.uploader.upload(link, {
      public_id: "sheep" + Date.now(),
      folder: "sheep",
    });
    res.json(result.secure_url);
  } catch (error) {
    console.error("Full error details:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

app.post("/upload", upload.array("photos", 10), (req, res) => {
  const uploadedFiles = req.files.map((file) => file.path);
  res.json(uploadedFiles);
});

app.post("/cards", async (req, res) => {
  const {
    name,
    price,
    type,
    age,
    height,
    weight,
    color,
    desc,
    category,
    status,
    addedPhotos,
  } = req.body;
  const cardDoc = await SheepModel.create({
    name,
    price,
    type,
    age,
    height,
    weight,
    color,
    desc,
    category,
    status,
    photos: addedPhotos,
  });
  res.json(cardDoc);
});

app.get("/cards", async (req, res) => { // DONE SEQUELIZE
  try {
    const dataCards = await SheepModel.findAll({
      order: [["createdAt", "DESC"]],
    });
    const plainCards = dataCards.map((card) => card.get({ plain: true }));
    const unsoldCards = plainCards.filter((card) => card.status !== "sold");
    const soldCards = plainCards.filter((card) => card.status === "sold");
    const sortedCards = [...unsoldCards, ...soldCards];
    res.json(sortedCards);
  } catch (error) {
    console.error("Full error details:", error);
    res.status(500).json({ error: "Failed to fetch cards" });
  }
});

app.get("/cards/:id", async (req, res) => {
  try {
    const card = await SheepModel.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }
    res.json(card);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch card" });
  }
});

app.put("/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      type,
      age,
      height,
      weight,
      color,
      desc,
      category,
      status,
      photos,
    } = req.body;

    const card = await SheepModel.findById(id);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    card.set({
      name,
      price,
      type,
      age,
      height,
      weight,
      color,
      desc,
      category,
      status,
      photos,
    });

    await card.save();
    res.json("ok");
  } catch (error) {
    console.error("Error updating card:", error);
    res.status(500).json({ message: "Error updating card" });
  }
});

app.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Find the card to get the Cloudinary public IDs
    const card = await SheepModel.findById(id);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    // Delete the card from the database
    await SheepModel.findByIdAndDelete(id);

    // Delete the images from Cloudinary
    if (card.photos && card.photos.length > 0) {
      const deletePromises = card.photos.map((photoUrl) => {
        const publicId = extractPublicId(photoUrl);
        return cloudinary.uploader.destroy(publicId);
      });
      await Promise.all(deletePromises);
    }

    res.json({ message: "Card deleted successfully" });
  } catch (error) {
    console.error("Full error details:", error);
    res.status(500).json({ message: "Failed to delete card", error });
  }
});

app.delete("/remove", async (req, res) => {
  const { filename } = req.body;
  try {
    const result = await cloudinary.uploader.destroy(extractPublicId(filename));
    res.json({ message: "Photo deleted successfully", result });
  } catch (error) {
    console.error("Error deleting photo:", error);
    res.status(500).json({ message: "Failed to delete photo", error });
  }
});

app.listen(port, '0.0.0.0', () => console.log(`Server connected on port ${port}`));