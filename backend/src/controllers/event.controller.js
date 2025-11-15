import Event from "../models/Event.js";
import { getHolidays } from "../utils/getHolidays.js";

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find({ creator: req.user._id });
    res.json(events);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      creator: req.user._id,
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Event.findOneAndUpdate(
      { _id: id, creator: req.user._id },
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: "Ошибка обновления события" });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await Event.findOneAndDelete({ _id: id, creator: req.user._id });
    res.json({ message: "Событие удалено" });
  } catch (error) {
    res.status(400).json({ error: "Ошибка удаления события" });
  }
};

// 🔹 Поиск / фильтрация
export const searchEvents = async (req, res) => {
  const { q, category } = req.query;
  const query = { creator: req.user._id };
  if (q) query.title = { $regex: q, $options: "i" };
  if (category) query.category = category;

  const events = await Event.find(query);
  res.json(events);
};

// 🔹 Праздники
export const getHolidaysController = async (req, res) => {
  const holidays = await getHolidays("UA");
  res.json(holidays);
};
