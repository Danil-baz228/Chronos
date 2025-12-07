import Event from "../models/Event.js";
import Calendar from "../models/Calendar.js";
import User from "../models/User.js";
import { getHolidays } from "../utils/getHolidays.js";
import { sendEmail } from "../utils/sendEmail.js";
import { io } from "../server.js";

function normalizeDate(date) {
  if (!date) return date;
  if (typeof date !== "string") return date;
  if (date.endsWith("Z")) return date;
  return date + "Z";
}

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

async function notifyUsersWithEmail(userIds, payload, actorId) {
  if (!Array.isArray(userIds)) userIds = [userIds];
  const ids = [...new Set(userIds.map((u) => u.toString()))];

  ids.forEach((id) => {
    global.sendNotification(id, payload);
  });

  const emailTargets = ids.filter((id) => id !== actorId?.toString());
  if (!emailTargets.length) return;

  const users = await User.find({ _id: { $in: emailTargets } }).select("email");
  const subject = payload.title || "Сповіщення від Chronos";

  await Promise.all(
    users
      .filter((u) => !!u.email)
      .map((u) =>
        sendEmail(u.email, subject, payload.message, `<p>${payload.message}</p>`)
      )
  );
}

export const getEvents = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const calendars = await Calendar.find({
      $or: [{ owner: userId }, { editors: userId }, { members: userId }],
    }).select("_id isHolidayCalendar isMain");

    const calendarIds = calendars.map((c) => c._id.toString());
    const mainCalendar = calendars.find((c) => c.isMain);
    const holidayCalendar = calendars.find((c) => c.isHolidayCalendar);

    const allowedHolidayCals = [
      mainCalendar?._id?.toString(),
      holidayCalendar?._id?.toString(),
    ].filter(Boolean);

    let calendarEvents = await Event.find({
      calendar: { $in: calendarIds },
    })
      .populate("calendar", "name isHolidayCalendar isMain")
      .populate("invitedFrom", "_id title");

    calendarEvents = calendarEvents.filter((ev) => {
      if (ev.category !== "holiday") return true;
      return allowedHolidayCals.includes(ev.calendar?._id?.toString());
    });

    let invitedEvents = await Event.find({
      invitedUsers: userId,
    }).populate("invitedFrom", "_id title");

    const ownIds = new Set(calendarEvents.map((ev) => ev._id.toString()));
    invitedEvents = invitedEvents.filter((ev) => !ownIds.has(ev._id.toString()));

    const all = [...calendarEvents, ...invitedEvents];
    const allIds = all.map((e) => e._id);

    const populated = await Event.find({ _id: { $in: allIds } })
      .populate("creator", "username fullName email avatar")
      .populate("invitedUsers", "username fullName email avatar")
      .populate("calendar", "name isMain isHolidayCalendar")
      .populate("invitedFrom", "title _id");

    return res.json(populated);
  } catch (err) {
    console.error("getEvents error:", err);
    res.status(500).json({ error: "Failed to load events" });
  }
};

export const createEvent = async (req, res) => {
  try {
    const calendar = await Calendar.findById(req.body.calendar);
    if (!calendar)
      return res.status(404).json({ error: "Calendar not found" });

    if (calendar.isHolidayCalendar)
      return res.status(403).json({ error: "Cannot create event in holiday calendar" });

    const userId = req.user._id;
    const isOwner = isSameId(calendar.owner, userId);
    const isEditor = userInArray(userId, calendar.editors);

    if (!isOwner && !isEditor)
      return res.status(403).json({ error: "Permission denied" });

    const event = await Event.create({
      ...req.body,
      date: normalizeDate(req.body.date),
      creator: userId,
      invitedFrom: null,
      readOnly: false,
    });

    const populated = await Event.findById(event._id)
      .populate("creator", "username fullName email avatar")
      .populate("invitedUsers", "username fullName email avatar")
      .populate("calendar", "name isMain isHolidayCalendar");

    io.to(`calendar:${calendar._id}`).emit("calendar_update", {
      type: "created",
      event: populated,
    });

    if (calendar.notificationsEnabled) {
      const users = [calendar.owner, ...calendar.editors, ...calendar.members];
      const payload = {
        type: "event_created",
        calendar: calendar._id,
        event: event._id,
        title: event.title,
        message: `Нова подія "${event.title}" у календарі "${calendar.name}"`,
      };

      notifyUsersWithEmail(users, payload, req.user._id);
    }

    return res.json({ success: true, event: populated });
  } catch (err) {
    console.error("createEvent error:", err);
    res.status(400).json({ error: "Failed to create event" });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event)
      return res.status(404).json({ error: "Event not found" });

    const calendar = await Calendar.findById(event.calendar);

    if (req.body.date) {
      req.body.date = normalizeDate(req.body.date);
    }

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

    const populated = await Event.findById(event._id)
      .populate("creator", "username fullName email avatar")
      .populate("invitedUsers", "username fullName email avatar")
      .populate("calendar", "name isMain isHolidayCalendar");

    io.to(`calendar:${event.calendar}`).emit("calendar_update", {
      type: "updated",
      event: populated,
    });

    if (calendar.notificationsEnabled) {
      const users = [calendar.owner, ...calendar.editors, ...calendar.members];
      const payload = {
        type: "event_updated",
        calendar: calendar._id,
        event: event._id,
        title: event.title,
        message: `Подію "${event.title}" оновлено у календарі "${calendar.name}"`,
      };

      notifyUsersWithEmail(users, payload, req.user._id);
    }

    return res.json({ success: true, event: populated });
  } catch (err) {
    console.error("updateEvent error:", err);
    res.status(400).json({ error: "Failed to update event" });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event)
      return res.status(404).json({ error: "Event not found" });

    const calendar = await Calendar.findById(event.calendar);

    const deletedId = event._id;
    const deletedTitle = event.title;

    await event.deleteOne();
    await Event.deleteMany({ invitedFrom: deletedId });

    io.to(`calendar:${calendar._id}`).emit("calendar_update", {
      type: "deleted",
      eventId: deletedId,
    });

    if (calendar.notificationsEnabled) {
      const users = [calendar.owner, ...calendar.editors, ...calendar.members];
      const payload = {
        type: "event_deleted",
        calendar: calendar._id,
        event: deletedId,
        title: deletedTitle,
        message: `Подію "${deletedTitle}" видалено з календаря "${calendar.name}"`,
      };

      notifyUsersWithEmail(users, payload, req.user._id);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("deleteEvent error:", err);
    res.status(400).json({ error: "Failed to delete event" });
  }
};

export const inviteToEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { email } = req.body;

    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ error: "Event not found" });

    const calendar = await Calendar.findById(event.calendar);
    const user = await User.findOne({ email });

    if (user) {
      if (!event.invitedUsers.includes(user._id)) {
        event.invitedUsers.push(user._id);
      }

      const mainId = await getMainCalendarId(user._id);

      const exists = await Event.findOne({
        invitedFrom: event._id,
        calendar: mainId,
      });

      if (!exists) {
        await Event.create({
          title: event.title,
          date: normalizeDate(event.date),
          duration: event.duration,
          category: event.category,
          description: event.description,
          color: event.color,
          creator: event.creator,
          calendar: mainId,
          invitedFrom: event._id,
          readOnly: true,
        });
      }

      if (calendar.notificationsEnabled) {
        const payload = {
          type: "event_invited",
          calendar: calendar._id,
          event: event._id,
          title: event.title,
          message: `Вас запрошено до події "${event.title}" у календарі "${calendar.name}"`,
        };

        notifyUsersWithEmail(user._id.toString(), payload, req.user._id);
      }
    } else {
      if (!event.invitedEmails.includes(email)) {
        event.invitedEmails.push(email);
      }
    }

    await event.save();

    const updated = await Event.findById(event._id)
      .populate("invitedUsers", "username fullName email avatar")
      .populate("creator", "username fullName email avatar")
      .populate("calendar", "name isMain isHolidayCalendar");

    io.to(`calendar:${event.calendar}`).emit("calendar_update", {
      type: "updated",
      event: updated,
    });

    return res.json({ success: true, event: updated });
  } catch (err) {
    console.error("inviteToEvent error:", err);
    res.status(500).json({ error: "Failed to invite user" });
  }
};

export const removeInvite = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { type, value } = req.body;

    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ error: "Event not found" });

    const calendar = await Calendar.findById(event.calendar);

    if (type === "user") {
      event.invitedUsers = event.invitedUsers.filter(
        (id) => id.toString() !== value.toString()
      );

      const mainId = await getMainCalendarId(value);
      await Event.deleteOne({
        invitedFrom: event._id,
        calendar: mainId,
      });

      if (calendar.notificationsEnabled) {
        const payload = {
          type: "event_removed",
          calendar: calendar._id,
          event: event._id,
          title: event.title,
          message: `Вас видалено з події "${event.title}" у календарі "${calendar.name}"`,
        };

        notifyUsersWithEmail(value.toString(), payload, req.user._id);
      }
    }

    if (type === "email") {
      event.invitedEmails = event.invitedEmails.filter((e) => e !== value);
    }

    await event.save();

    const updated = await Event.findById(event._id)
      .populate("invitedUsers", "username fullName email avatar")
      .populate("creator", "username fullName email avatar")
      .populate("calendar", "name isMain isHolidayCalendar");

    io.to(`calendar:${event.calendar}`).emit("calendar_update", {
      type: "updated",
      event: updated,
    });

    return res.json({ success: true, event: updated });
  } catch (err) {
    console.error("removeInvite error:", err);
    res.status(500).json({ error: "Failed to remove invited person" });
  }
};

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
      .populate("invitedUsers", "username fullName email avatar")
      .populate("creator", "username fullName email avatar");

    res.json(events);
  } catch (err) {
    console.error("searchEvents error:", err);
    res.status(500).json({ error: "Failed to search events" });
  }
};

export const getHolidaysController = async (req, res) => {
  try {
    const yearParam = req.query.year;
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    if (Number.isNaN(year))
      return res.status(400).json({ error: "Invalid year" });

    const region = req.user?.holidayRegion || "UA";
    const holidays = await getHolidays(region, year);

    res.json(holidays);
  } catch (e) {
    console.error("getHolidays error:", e);
    res.status(500).json({ error: "Failed to load holidays" });
  }
};
