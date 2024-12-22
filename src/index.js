import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import participationRoutes from "./routes/participations.js";
import userRoutes from "./routes/users.js";
import { authenticateToken } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Public routes
app.use("/auth", authRoutes);

// Protected routes
app.use("/events", authenticateToken, eventRoutes);
app.use("/participations", authenticateToken, participationRoutes);
app.use("/users", authenticateToken, userRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
