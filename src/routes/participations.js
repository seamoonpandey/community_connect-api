import express from 'express';
import supabase from '../config/supabase.js';

const router = express.Router();

// Create participation
router.post('/', async (req, res) => {
  try {
    const { eventId } = req.body;

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select()
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const { data: participation, error } = await supabase
      .from('participations')
      .insert([{
        event_id: eventId,
        user_id: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(participation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark attendance using event token
router.post('/attend', async (req, res) => {
  try {
    const { eventToken } = req.body;

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select()
      .eq('event_token', eventToken)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const now = new Date();
    if (now < new Date(event.start_time) || now > new Date(event.end_time)) {
      return res.status(400).json({ error: 'Event is not active' });
    }

    const { data: participation, error } = await supabase
      .from('participations')
      .update({ attended: true })
      .eq('event_id', event.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!participation) {
      return res.status(404).json({ error: 'Participation not found' });
    }

    res.json(participation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;