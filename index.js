const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const cloudinary = require("./cloudinaryConfig");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { extractPublicId } = require("cloudinary-build-url");

const UserModel = require("./models/User"); // Sequelize model
const SheepModel = require("./models/Sheep"); // Sequelize model

require("dotenv").config();
const app = express();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "sheep",
    format: async () => "png",
    public_id: (req, file) => file.filename,
  },
});

const upload = multer({ storage });

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "ahdajshddasd";

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "https://h-01-6969.et.r.appspot.com/",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Test route
app.get("/test", (req, res) => {
  res.json("test ok");
});

// Register
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

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await UserModel.findOne({ where: { username } });
  if (user) {
    const passOk = bcrypt.compareSync(password, user.password);
    if (passOk) {
      jwt.sign(
        { username: user.username, id: user.id },
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
      res.status(422).json("Incorrect password");
    }
  } else {
    res.status(404).json("User not found");
  }
});

// Check admin
app.get("/admin", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, admin) => {
      if (err) return res.status(403).json({ message: "Invalid token" });
      res.json(admin);
    });
  } else {
    res.json(null);
  }
});

// Upload by link (cloudinary)
app.post("/upload-by-link", async (req, res) => {
  const { link } = req.body;
  try {
    const result = await cloudinary.uploader.upload(link, {
      public_id: "sheep" + Date.now(),
      folder: "sheep",
    });
    res.json(result.secure_url);
  } catch (error) {
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// Upload multiple images
app.post("/upload", upload.array("photos", 10), (req, res) => {
  const uploadedFiles = req.files.map((file) => file.path);
  res.json(uploadedFiles);
});

// Create card
app.post("/cards", async (req, res) => {
  const data = req.body;
  try {
    const card = await SheepModel.create({ ...data, photos: data.addedPhotos });
    res.json(card);
  } catch (error) {
    res.status(500).json({ error: "Failed to create card" });
  }
});

// Get cards
app.get("/cards", async (req, res) => {
  try {
    const cards = await SheepModel.findAll({ order: [["createdAt", "DESC"]] });
    const plain = cards.map((c) => c.get({ plain: true }));
    const sorted = [...plain.filter((c) => c.status !== "sold"), ...plain.filter((c) => c.status === "sold")];
    res.json(sorted);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cards" });
  }
});

// Get card by ID
app.get("/cards/:id", async (req, res) => {
  try {
    const card = await SheepModel.findByPk(req.params.id);
    if (!card) return res.status(404).json({ error: "Card not found" });
    res.json(card);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch card" });
  }
});

// Edit card
app.put("/edit/:id", async (req, res) => {
  try {
    const card = await SheepModel.findByPk(req.params.id);
    if (!card) return res.status(404).json({ message: "Card not found" });

    Object.assign(card, req.body);
    await card.save();
    res.json("ok");
  } catch (error) {
    res.status(500).json({ message: "Error updating card" });
  }
});

// Delete card
app.delete("/delete/:id", async (req, res) => {
  try {
    const card = await SheepModel.findByPk(req.params.id);
    if (!card) return res.status(404).json({ message: "Card not found" });

    if (card.photos?.length) {
      await Promise.all(
        card.photos.map((url) => cloudinary.uploader.destroy(extractPublicId(url)))
      );
    }

    await SheepModel.destroy({ where: { id: req.params.id } });
    res.json({ message: "Card deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete card" });
  }
});

// Remove single photo
app.delete("/remove", async (req, res) => {
  const { filename } = req.body;
  try {
    const result = await cloudinary.uploader.destroy(extractPublicId(filename));
    res.json({ message: "Photo deleted", result });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete photo" });
  }
});

app.listen(8080, () => {
  console.log("Server is running...");
});
