import express from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import supabase from '../config/supabase.js';

const router = express.Router();

// Create event
router.post('/',
  [
    body('title').notEmpty(),
    body('longitude').isFloat(),
    body('latitude').isFloat(),
    body('description').optional(),
    body('startTime').isISO8601(),
    body('endTime').isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, longitude, latitude, startTime, endTime } = req.body;
      const eventToken = crypto.randomBytes(16).toString('hex');

      const { data: event, error } = await supabase
        .from('events')
        .insert([{
          title,
          description,
          longitude,
          latitude,
          start_time: startTime,
          end_time: endTime,
          event_token: eventToken,
          host_id: req.user.id
        }])
        .select()
        .single();

      if (error) throw error;
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get events near location
router.get('/nearby', async (req, res) => {
  try {
    const { longitude, latitude, radius = 10000 } = req.query;

    const { data: events, error } = await supabase
      .rpc('nearby_events', {
        ref_longitude: parseFloat(longitude),
        ref_latitude: parseFloat(latitude),
        radius_meters: parseFloat(radius)
      });

    if (error) throw error;
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select('*, users!host_id(name, email)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update event
router.put('/:id',
  [
    body('title').optional(),
    body('description').optional(),
    body('longitude').optional().isFloat(),
    body('latitude').optional().isFloat(),
    body('startTime').optional().isISO8601(),
    body('endTime').optional().isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, longitude, latitude, startTime, endTime } = req.body;

      const { data: event, error } = await supabase
        .from('events')
        .update({
          title,
          description,
          longitude,
          latitude,
          start_time: startTime,
          end_time: endTime
        })
        .eq('id', req.params.id)
        .eq('host_id', req.user.id)
        .select()
        .single();

      if (error) throw error;
      if (!event) {
        return res.status(404).json({ error: 'Event not found or unauthorized' });
      }

      res.json(event);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', req.params.id)
      .eq('host_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;