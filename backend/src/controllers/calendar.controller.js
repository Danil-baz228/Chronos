import Calendar from "../models/Calendar.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";

function isSameId(a, b) {
  if (!a || !b) return false;
  return a.toString() === b.toString();
}

function broadcastCalendarUpdate(calendarId, populated) {
  try {
    global.io
      .to(`calendar:${calendarId}`) // <-- правильное имя комнаты
      .emit("calendar_members_update", { calendar: populated });
  } catch (e) {
    console.error("Socket broadcast error:", e);
  }
}

async function notifyUsersWithEmail(users, payload, actorId) {
  if (!Array.isArray(users)) users = [users];

  const ids = [...new Set(users.map((u) => u.toString()))];

  ids.forEach((id) => {
    global.sendNotification(id, payload);
  });

  const emailTargets = ids.filter(
    (id) => !actorId || id.toString() !== actorId.toString()
  );

  if (!emailTargets.length) return;

  const dbUsers = await User.find({ _id: { $in: emailTargets } }).select(
    "email"
  );

  const subject = payload.title || "Сповіщення від Chronos";

  await Promise.all(
    dbUsers
      .filter((u) => !!u.email)
      .map((u) =>
        sendEmail(
          u.email,
          subject,
          payload.message,
          `<p>${payload.message}</p>`
        )
      )
  );
}

export const getCalendars = async (req, res) => {
  try {
    const calendars = await Calendar.find({
      $or: [
        { owner: req.user._id },
        { editors: req.user._id },
        { members: req.user._id },
      ],
      isHidden: false,
    }).populate("owner editors members", "email fullName name");

    res.json(calendars);
  } catch (e) {
    res.status(500).json({ error: "Ошибка загрузки календарей" });
  }
};

export const createCalendar = async (req, res) => {
  try {
    const calendar = await Calendar.create({
      name: req.body.name,
      description: req.body.description || "",
      color: req.body.color || "#3b82f6",
      owner: req.user._id,
      editors: [],
      members: [],
      isMain: false,
      isHidden: false,
      isHolidayCalendar: false,
      holidayYear: null,
      notificationsEnabled: true,
    });

    const populated = await Calendar.findById(calendar._id).populate(
      "owner editors members",
      "email fullName name"
    );

    res.status(201).json(populated);
  } catch (e) {
    res.status(400).json({ error: "Ошибка создания календаря" });
  }
};

export const updateCalendar = async (req, res) => {
  try {
    const { id } = req.params;

    const calendar = await Calendar.findById(id);
    if (!calendar)
      return res.status(404).json({ error: "Календарь не найден" });

    if (!isSameId(calendar.owner, req.user._id))
      return res
        .status(403)
        .json({ error: "Только владелец может редактировать" });

    if (calendar.isMain) req.body.name = calendar.name;

    if (calendar.isHolidayCalendar) {
      req.body.isHolidayCalendar = calendar.isHolidayCalendar;
      req.body.holidayYear = calendar.holidayYear;
    }

    Object.assign(calendar, req.body);
    await calendar.save();

    const populated = await Calendar.findById(id).populate(
      "owner editors members",
      "email fullName name"
    );

    if (calendar.notificationsEnabled) {
      const users = [calendar.owner, ...calendar.editors, ...calendar.members];
      const payload = {
        type: "calendar_updated",
        calendar: calendar._id,
        title: calendar.name,
        message: `Календар "${calendar.name}" був оновлений`,
      };

      await notifyUsersWithEmail(users, payload, req.user._id);
    }

    res.json(populated);
  } catch (e) {
    res.status(400).json({ error: "Ошибка обновления" });
  }
};

export const deleteCalendar = async (req, res) => {
  try {
    const { id } = req.params;

    const calendar = await Calendar.findById(id);
    if (!calendar)
      return res.status(404).json({ error: "Календарь не найден" });

    if (calendar.isMain)
      return res
        .status(403)
        .json({ error: "Главный календарь нельзя удалить" });

    if (calendar.isHolidayCalendar)
      return res
        .status(403)
        .json({ error: "Календарь праздников нельзя удалить" });

    if (!isSameId(calendar.owner, req.user._id))
      return res
        .status(403)
        .json({ error: "Только владелец может удалить" });

    const users = [calendar.owner, ...calendar.editors, ...calendar.members];

    await calendar.deleteOne();

    if (calendar.notificationsEnabled) {
      const payload = {
        type: "calendar_deleted",
        calendar: calendar._id,
        title: calendar.name,
        message: `Календар "${calendar.name}" був видалений`,
      };

      await notifyUsersWithEmail(users, payload, req.user._id);
    }

    res.json({ message: "Календарь удалён" });
  } catch (e) {
    res.status(400).json({ error: "Ошибка удаления" });
  }
};

export const hideCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const calendar = await Calendar.findById(id);

    if (!calendar)
      return res.status(404).json({ error: "Календарь не найден" });
    if (calendar.isMain)
      return res
        .status(403)
        .json({ error: "Главный календарь нельзя скрыть" });

    if (!isSameId(calendar.owner, req.user._id))
      return res
        .status(403)
        .json({ error: "Только владелец может скрыть" });

    calendar.isHidden = true;
    await calendar.save();

    const populated = await Calendar.findById(id).populate(
      "owner editors members",
      "email fullName name"
    );

    res.json(populated);
  } catch (e) {
    res.status(400).json({ error: "Ошибка скрытия" });
  }
};

export const showCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const calendar = await Calendar.findById(id);

    if (!calendar)
      return res.status(404).json({ error: "Календарь не найден" });

    if (!isSameId(calendar.owner, req.user._id))
      return res
        .status(403)
        .json({ error: "Только владелец может вернуть" });

    calendar.isHidden = false;
    await calendar.save();

    const populated = await Calendar.findById(id).populate(
      "owner editors members",
      "email fullName name"
    );

    res.json(populated);
  } catch (e) {
    res.status(400).json({ error: "Ошибка показа" });
  }
};

export const inviteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    const calendar = await Calendar.findById(id);
    if (!calendar)
      return res.status(404).json({ error: "Календар не знайдено" });

    if (calendar.isMain || calendar.isHolidayCalendar)
      return res
        .status(403)
        .json({ error: "Цей календар не можна розшарювати" });

    if (!isSameId(calendar.owner, req.user._id))
      return res
        .status(403)
        .json({ error: "Тільки власник може запрошувати" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ error: "Користувача не знайдено" });

    if (role === "editor") {
      if (!calendar.editors.includes(user._id)) calendar.editors.push(user._id);
      calendar.members = calendar.members.filter((m) => !isSameId(m, user._id));
    } else {
      if (!calendar.members.includes(user._id)) calendar.members.push(user._id);
      calendar.editors = calendar.editors.filter((e) => !isSameId(e, user._id));
    }

    await calendar.save();

    const populated = await Calendar.findById(id).populate(
      "owner editors members",
      "email fullName name"
    );

    if (calendar.notificationsEnabled) {
      await sendEmail(
        email,
        "Запрошення до календаря",
        `Вас додано до календаря "${calendar.name}". Роль: ${role}`,
        `<h3>Вас додано до календаря "${calendar.name}"</h3>
         <p>Роль: <b>${role}</b></p>`
      );

      const payload = {
        type: "calendar_invite",
        calendar: calendar._id,
        title: calendar.name,
        message: `Вас додано до календаря "${calendar.name}" (роль: ${role})`,
      };

      await notifyUsersWithEmail(user._id, payload, req.user._id);
    }

    broadcastCalendarUpdate(calendar._id, populated);

    res.json({ message: "Користувача запрошено", calendar: populated });
  } catch (e) {
    console.error("inviteUser error:", e);
    res.status(400).json({ error: "Ошибка приглашения" });
  }
};

export const updateMemberRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;

    const calendar = await Calendar.findById(id);
    if (!calendar)
      return res.status(404).json({ error: "Календар не знайдено" });

    if (calendar.isMain || calendar.isHolidayCalendar)
      return res.status(403).json({ error: "Не можна змінювати ролі" });

    if (!isSameId(calendar.owner, req.user._id))
      return res
        .status(403)
        .json({ error: "Тільки власник може змінювати ролі" });

    if (role === "editor") {
      if (!calendar.editors.includes(userId)) calendar.editors.push(userId);
      calendar.members = calendar.members.filter((m) => !isSameId(m, userId));
    } else {
      if (!calendar.members.includes(userId)) calendar.members.push(userId);
      calendar.editors = calendar.editors.filter((e) => !isSameId(e, userId));
    }

    await calendar.save();

    const populated = await Calendar.findById(id).populate(
      "owner editors members",
      "email fullName name"
    );

    if (calendar.notificationsEnabled) {
      const payload = {
        type: "role_changed",
        calendar: calendar._id,
        title: calendar.name,
        message: `Вашу роль у календарі "${calendar.name}" змінено на "${role}"`,
      };

      await notifyUsersWithEmail(userId, payload, req.user._id);
    }

    broadcastCalendarUpdate(calendar._id, populated);

    res.json({ message: "Роль оновлено", calendar: populated });
  } catch (e) {
    res.status(400).json({ error: "Ошибка изменения роли" });
  }
};

export const removeCalendarMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const currentUserId = req.user._id.toString();
    const targetUserId = userId.toString();

    const calendar = await Calendar.findById(id);
    if (!calendar)
      return res.status(404).json({ error: "Календар не знайдено" });

    const isOwner = isSameId(calendar.owner, currentUserId);
    const isSelf = currentUserId === targetUserId;

    if (!isOwner && !isSelf)
      return res
        .status(403)
        .json({ error: "Тільки власник може видаляти" });

    calendar.editors = calendar.editors.filter(
      (u) => u.toString() !== targetUserId
    );
    calendar.members = calendar.members.filter(
      (u) => u.toString() !== targetUserId
    );

    await calendar.save();

    const populated = await Calendar.findById(id).populate(
      "owner editors members",
      "email fullName name"
    );

    if (calendar.notificationsEnabled && !isSelf) {
      const payload = {
        type: "removed_from_calendar",
        calendar: calendar._id,
        title: calendar.name,
        message: `Вас видалено з календаря "${calendar.name}"`,
      };

      await notifyUsersWithEmail(targetUserId, payload, req.user._id);
    }

    broadcastCalendarUpdate(calendar._id, populated);

    return res.json({
      message: isSelf ? "Ви вийшли з календаря" : "Учасника видалено",
      calendar: populated,
    });
  } catch (e) {
    res.status(400).json({ error: "Ошибка удаления участника" });
  }
};

export const updateCalendarNotifications = async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    const calendar = await Calendar.findById(id);
    if (!calendar)
      return res.status(404).json({ error: "Календар не знайдено" });

    if (!isSameId(calendar.owner, req.user._id))
      return res
        .status(403)
        .json({ error: "Тільки власник може змінювати" });

    calendar.notificationsEnabled = Boolean(enabled);
    await calendar.save();

    res.json({
      success: true,
      notificationsEnabled: calendar.notificationsEnabled,
    });
  } catch (e) {
    res.status(500).json({ error: "Ошибка обновления уведомлений" });
  }
};
