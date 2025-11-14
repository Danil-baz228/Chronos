import { getUserEvents, addEvent } from "../services/event.service.js";

export const getEvents = async (req, res) => {
  try {
    const events = await getUserEvents(req.user._id);
    res.json(events);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const event = await addEvent(req.user._id, req.body);
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
