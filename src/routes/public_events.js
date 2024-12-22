import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { data: events, error } = await supabase.from("events").select("*");

    if (error) throw error;
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
