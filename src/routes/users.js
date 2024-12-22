import express from 'express';
import supabase from '../config/supabase.js';

const router = express.Router();

// Get user stats
router.get('/stats', async (req, res) => {
  try {
    const { data: hostedEvents, error: hostedError } = await supabase
      .from('events')
      .select('id')
      .eq('host_id', req.user.id);

    const { data: participations, error: participationsError } = await supabase
      .from('participations')
      .select('id, attended')
      .eq('user_id', req.user.id);

    if (hostedError || participationsError) throw error;

    const stats = {
      hosted: hostedEvents.length,
      participated: participations.length,
      attended: participations.filter(p => p.attended).length
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;