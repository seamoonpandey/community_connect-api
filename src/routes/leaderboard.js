import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

// Get leaderboard
router.get("/", async (req, res) => {
  try {
    // Fetch all users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email");

    if (usersError) {
      return res.status(500).json({ error: usersError.message });
    }

    // Fetch stats for each user
    const leaderboard = [];

    for (let user of users) {
      const { data: hostedEvents } = await supabase
        .from("events")
        .select("id")
        .eq("host_id", user.id);

      const { data: participations } = await supabase
        .from("participations")
        .select("id, attended")
        .eq("user_id", user.id);

      // Calculate attendance score
      const attendedEvents = participations.filter((p) => p.attended).length;
      const participatedEvents = participations.length;
      const hostedEventsCount = hostedEvents.length;

      // Calculate attended-to-participated ratio
      const attendedToParticipatedRatio =
        participatedEvents > 0 ? attendedEvents / participatedEvents : 0;

      // Calculate the score
      let score = attendedEvents * 2 + hostedEventsCount;

      // Add bonus if the attended-to-participated ratio is above 80%

      leaderboard.push({
        id: user.id,
        name: user.name,
        email: user.email,
        score,
        attended: attendedEvents,
        participated: participatedEvents,
        hosted: hostedEventsCount,
      });
    }

    // Sort the leaderboard by score in descending order
    leaderboard.sort((a, b) => b.score - a.score);

    // Return the leaderboard
    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
