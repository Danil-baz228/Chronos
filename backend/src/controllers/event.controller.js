// backend/src/controllers/event.controller.js
import Event from "../models/Event.js";
import Calendar from "../models/Calendar.js";
import User from "../models/User.js";
import { getHolidays } from "../utils/getHolidays.js";
import { sendEmail } from "../utils/sendEmail.js";

// =====================================
//  ВСПОМОГАТЕЛЬНЫЕ
// =====================================
function isSameId(a, b) {
  if (!a || !b) return false;
  return a.toString() === b.toString();
}

function userInArray(userId, arr = []) {
  return arr.some((id) => id.toString() === userId.toString());
}

async function getMainCalendarId(userId) {
  const cal = await Calendar.findOne({ owner: userId, isMain: true });
  return cal?._id || null;
}

// =====================================
//   ПОЛУЧЕНИЕ ВСЕХ СОБЫТИЙ ПОЛЬЗОВАТЕЛЯ
// =====================================
export const getEvents = async (req, res) => {
  try {
    const userId = req.user._id;

    const calendars = await Calendar.find({
      $or: [{ owner: userId }, { editors: userId }, { members: userId }],
    }).select("_id");

    const calendarIds = calendars.map((c) => c._id.toString());

    const calendarEvents = await Event.find({
      calendar: { $in: calendarIds },
    })
      .populate("invitedUsers", "name fullName email")
      .populate("creator", "name fullName email");

    const invitedEvents = await Event.find({
      invitedUsers: userId,
    })
      .populate("invitedUsers", "name fullName email")
      .populate("creator", "name fullName email");

    const copies = new Set(
      calendarEvents
        .filter((e) => e.invitedFrom)
        .map((e) => e.invitedFrom.toString())
    );

    const filteredInvited = invitedEvents.filter(
      (e) => !copies.has(e._id.toString())
    );

    const map = new Map();
    [...calendarEvents, ...filteredInvited].forEach((e) =>
      map.set(e._id.toString(), e)
    );

    res.json([...map.values()]);
  } catch (err) {
    console.error("❌ Ошибка загрузки событий:", err);
    res.status(500).json({ error: "Ошибка загрузки событий" });
  }
};

// =====================================
//   СОЗДАНИЕ СОБЫТИЯ
// =====================================
export const createEvent = async (req, res) => {
  try {
    const calendar = await Calendar.findById(req.body.calendar);
    if (!calendar) return res.status(404).json({ error: "Календарь не найден" });

    // Календарь праздников — только просмотр
    if (calendar.isHolidayCalendar) {
      return res
        .status(403)
        .json({ error: "Нельзя создавать события в календаре праздников" });
    }

    const userId = req.user._id;
    const isOwner = isSameId(calendar.owner, userId);
    const isEditor = userInArray(userId, calendar.editors);

    if (!isOwner && !isEditor)
      return res.status(403).json({ error: "Нет прав создавать события" });

    const event = await Event.create({
      ...req.body,
      creator: userId,
      invitedFrom: null,
      readOnly: false,
    });

    res.status(201).json(event);
  } catch (err) {
    console.error("Ошибка создания:", err);
    res.status(400).json({ error: err.message });
  }
};

// =====================================
//   ОБНОВЛЕНИЕ ОРИГИНАЛА + ВСЕХ КОПИЙ
// =====================================
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Событие не найдено" });

    // Праздники и readOnly-события не редактируются
    if (event.category === "holiday" || event.readOnly) {
      return res
        .status(403)
        .json({ error: "Праздничные события нельзя редактировать" });
    }

    // Копия не редактируется
    if (event.invitedFrom)
      return res.status(403).json({
        error: "Приглашённые пользователи не могут редактировать событие",
      });

    const calendar = await Calendar.findById(event.calendar);
    const userId = req.user._id;

    const isOwner = calendar && isSameId(calendar.owner, userId);
    const isEditor = userInArray(userId, calendar.editors);
    const isCreator = isSameId(event.creator, userId);

    if (!isOwner && !isEditor && !isCreator)
      return res.status(403).json({ error: "Нет прав" });

    Object.assign(event, req.body);
    await event.save();

    await Event.updateMany(
      { invitedFrom: event._id },
      {
        title: event.title,
        date: event.date,
        duration: event.duration,
        category: event.category,
        description: event.description,
        color: event.color,
      }
    );

    res.json(event);
  } catch (err) {
    console.error("Ошибка обновления:", err);
    res.status(400).json({ error: "Ошибка обновления" });
  }
};

// =====================================
//   УДАЛЕНИЕ ОРИГИНАЛА ИЛИ КОПИИ
// =====================================
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Событие не найдено" });

    // Праздники и readOnly не удаляются
    if (event.category === "holiday" || event.readOnly) {
      return res
        .status(403)
        .json({ error: "Праздничные события нельзя удалить" });
    }

    const userId = req.user._id;

    if (event.invitedFrom) {
      const calendar = await Calendar.findById(event.calendar);

      if (calendar && isSameId(calendar.owner, userId)) {
        await event.deleteOne();
        return res.json({ message: "Копия события удалена" });
      }

      return res.status(403).json({ error: "Можно удалить только свою копию" });
    }

    const calendar = await Calendar.findById(event.calendar);
    const isOwner = isSameId(calendar.owner, userId);
    const isCreator = isSameId(event.creator, userId);

    if (!isOwner && !isCreator)
      return res.status(403).json({ error: "Нет прав удалять событие" });

    await event.deleteOne();
    await Event.deleteMany({ invitedFrom: event._id });

    res.json({ message: "Событие и все копии удалены" });
  } catch (err) {
    console.error("Ошибка удаления:", err);
    res.status(400).json({ error: "Ошибка удаления" });
  }
};

// =====================================
//   ПОИСК
// =====================================
export const searchEvents = async (req, res) => {
  try {
    const { q, category } = req.query;
    const userId = req.user._id;

    const calendars = await Calendar.find({
      $or: [{ owner: userId }, { editors: userId }, { members: userId }],
    }).select("_id");

    const ids = calendars.map((c) => c._id);

    const query = { calendar: { $in: ids } };
    if (q) query.title = { $regex: q, $options: "i" };
    if (category) query.category = category;

    const events = await Event.find(query)
      .populate("invitedUsers", "name fullName email")
      .populate("creator", "name fullName email");

    res.json(events);
  } catch (err) {
    console.error("Ошибка поиска:", err);
    res.status(400).json({ error: "Ошибка поиска" });
  }
};

// =====================================
//   ПРИГЛАШЕНИЕ НА СОБЫТИЕ
// =====================================
export const inviteToEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { email } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Событие не найдено" });

    const calendar = await Calendar.findById(event.calendar);
    const userId = req.user._id;

    const isCreator = isSameId(event.creator, userId);
    const isOwner = isSameId(calendar.owner, userId);
    const isEditor = userInArray(userId, calendar.editors);

    if (!isCreator && !isOwner && !isEditor)
      return res.status(403).json({ error: "Нет прав приглашать" });

    const user = await User.findOne({ email });

    if (user) {
      if (!event.invitedUsers.includes(user._id))
        event.invitedUsers.push(user._id);

      const mainId = await getMainCalendarId(user._id);

      const exists = await Event.findOne({
        invitedFrom: event._id,
        calendar: mainId,
      });

      if (!exists) {
        await Event.create({
          title: event.title,
          date: event.date,
          duration: event.duration,
          category: event.category,
          description: event.description,
          color: event.color,
          creator: event.creator,
          calendar: mainId,
          invitedFrom: event._id,
        });
      }
    } else {
      if (!event.invitedEmails.includes(email))
        event.invitedEmails.push(email);
    }

    await event.save();

    res.json(
      await Event.findById(event._id)
        .populate("invitedUsers", "name fullName email")
        .populate("creator", "name fullName email")
    );
  } catch (err) {
    console.error("Ошибка приглашения:", err);
    res.status(500).json({ error: "Ошибка приглашения" });
  }
};

// =====================================
//   УДАЛЕНИЕ ПРИГЛАШЁННОГО
// =====================================
export const removeInvite = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { type, value } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Событие не найдено" });

    const calendar = await Calendar.findById(event.calendar);
    const current = req.user._id;

    const isOwner = isSameId(calendar.owner, current);
    const isCreator = isSameId(event.creator, current);

    if (!isOwner && !isCreator) {
      return res.status(403).json({ error: "Нет прав удалять" });
    }

    if (type === "user") {
      event.invitedUsers = event.invitedUsers.filter(
        (id) => id.toString() !== value.toString()
      );

      const mainId = await getMainCalendarId(value);

      await Event.deleteOne({
        invitedFrom: event._id,
        calendar: mainId,
      });
    }

    if (type === "email") {
      event.invitedEmails = event.invitedEmails.filter((e) => e !== value);
    }

    await event.save();

    const populated = await Event.findById(event._id)
      .populate("invitedUsers", "name fullName email")
      .populate("creator", "name fullName email");

    return res.json({
      success: true,
      event: populated,
    });
  } catch (err) {
    console.error("Ошибка removeInvite:", err);
    return res.status(500).json({ error: "Ошибка удаления приглашённого" });
  }
};

// =====================================
//   ПРАЗДНИКИ (по году)
//   GET /api/events/holidays?year=2026
// =====================================
export const getHolidaysController = async (req, res) => {
  try {
    const yearParam = req.query.year;
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    if (Number.isNaN(year)) {
      return res.status(400).json({ error: "Некорректный год" });
    }

    // ✅ Берём регион из профиля пользователя (holidayRegion) или "UA" по умолчанию
    const region = req.user?.holidayRegion || "UA";

    const holidays = await getHolidays(region, year);

    // Формат ответа тот же, что был — просто массив праздников
    res.json(holidays);
  } catch (e) {
    console.error("Ошибка getHolidaysController:", e);
    res.status(500).json({ error: "Не удалось загрузить праздники" });
  }
};
