import express from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";

const router = express.Router();

// Register route
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email address"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const { data: user, error } = await supabase
        .from("users")
        .insert([{ name, email, password: hashedPassword }])
        .select()
        .single();

      if (error) throw error;

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "1h", // Token expires in 1 hour
      });
      res.json({ token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Login route
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Invalid email address"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Filter request body to only allow email and password
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Only email and password are allowed" });
    }

    try {
      // Fetch the user from the database
      const { data: user, error } = await supabase
        .from("users")
        .select("*") // Select all fields
        .eq("email", email)
        .single();

      if (error || !user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Compare the hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate a JWT token
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "1h", // Token expires in 1 hour
      });

      // Get user stats
      const { data: hostedEvents, error: hostedError } = await supabase
        .from("events")
        .select("id")
        .eq("host_id", user.id);

      const { data: participations, error: participationsError } =
        await supabase
          .from("participations")
          .select("id, attended")
          .eq("user_id", user.id);

      if (hostedError || participationsError) {
        return res.status(500).json({ error: "Error fetching stats" });
      }

      const stats = {
        hosted: hostedEvents.length,
        participated: participations.length,
        attended: participations.filter((p) => p.attended).length,
      };

      // Return user biodata, token, and stats
      const { password: _, ...userData } = user; // Exclude the password from the response
      res.json({
        token,
        user: userData,
        stats,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
