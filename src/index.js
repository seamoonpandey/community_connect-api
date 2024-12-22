import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import participationRoutes from "./routes/participations.js";
import userRoutes from "./routes/users.js";
import leaderBoardRoutes from "./routes/leaderboard.js";
import { authenticateToken } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Multer configuration for parsing form-data
const upload = multer();

// Global middlewares
app.use(cors());
app.use(express.json()); // For parsing JSON bodies
app.use(upload.none()); // For parsing form-data bodies

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Public routes
app.use("/auth", authRoutes);

// Protected routes
app.use("/events", authenticateToken, eventRoutes);
app.use("/participate", authenticateToken, participationRoutes);
app.use("/users", authenticateToken, userRoutes);
app.use("/leaderboard", leaderBoardRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
