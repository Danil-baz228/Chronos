import Calendar from "../models/Calendar.js";

export const getCalendars = async (req, res) => {
  try {
    const calendars = await Calendar.find({ owner: req.user._id });
    res.json(calendars);
  } catch (error) {
    res.status(500).json({ error: "Ошибка получения календарей" });
  }
};

export const createCalendar = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const calendar = await Calendar.create({
      name,
      description,
      color,
      owner: req.user._id,
      users: [req.user._id],
      isMain: false,
    });
    res.status(201).json(calendar);
  } catch (error) {
    res.status(400).json({ error: "Ошибка создания календаря" });
  }
};

export const updateCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Calendar.findOneAndUpdate(
      { _id: id, owner: req.user._id, isMain: false },
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch {
    res.status(400).json({ error: "Ошибка обновления календаря" });
  }
};

export const deleteCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const calendar = await Calendar.findById(id);
    if (calendar.isMain)
      return res
        .status(400)
        .json({ error: "Нельзя удалить главный календарь" });

    await calendar.deleteOne();
    res.json({ message: "Календарь удалён" });
  } catch {
    res.status(400).json({ error: "Ошибка удаления календаря" });
  }
};
