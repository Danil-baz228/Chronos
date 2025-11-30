import Calendar from "../models/Calendar.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";

function isSameId(a, b) {
  if (!a || !b) return false;
  return a.toString() === b.toString();
}

/* ================================
    GET CALENDARS OF USER
================================ */
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

/* ================================
    CREATE CALENDAR
================================ */
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
    });

    const fullCalendar = await Calendar.findById(calendar._id).populate(
      "owner editors members",
      "email fullName name"
    );

    res.status(201).json(fullCalendar);
  } catch (e) {
    res.status(400).json({ error: "Ошибка создания календаря" });
  }
};

/* ================================
    UPDATE CALENDAR
================================ */
export const updateCalendar = async (req, res) => {
  try {
    const { id } = req.params;

    const calendar = await Calendar.findById(id);
    if (!calendar) return res.status(404).json({ error: "Календарь не найден" });

    if (!isSameId(calendar.owner, req.user._id)) {
      return res.status(403).json({ error: "Только владелец может редактировать" });
    }

    if (calendar.isMain) {
      req.body.name = calendar.name;
    }

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

    res.json(populated);
  } catch (e) {
    res.status(400).json({ error: "Ошибка обновления" });
  }
};

/* ================================
    DELETE CALENDAR
================================ */
export const deleteCalendar = async (req, res) => {
  try {
    const { id } = req.params;

    const calendar = await Calendar.findById(id);
    if (!calendar) return res.status(404).json({ error: "Календарь не найден" });

    if (calendar.isMain)
      return res.status(403).json({ error: "Главный календарь нельзя удалить" });

    if (calendar.isHolidayCalendar)
      return res.status(403).json({ error: "Календарь праздников нельзя удалить" });

    if (!isSameId(calendar.owner, req.user._id))
      return res.status(403).json({ error: "Только владелец может удалить" });

    await calendar.deleteOne();

    res.json({ message: "Календарь удалён" });
  } catch (e) {
    res.status(400).json({ error: "Ошибка удаления" });
  }
};

/* ================================
    HIDE CALENDAR
================================ */
export const hideCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const calendar = await Calendar.findById(id);

    if (!calendar) return res.status(404).json({ error: "Календарь не найден" });

    if (calendar.isMain)
      return res.status(403).json({ error: "Главный календарь нельзя скрыть" });

    if (!isSameId(calendar.owner, req.user._id))
      return res.status(403).json({ error: "Только владелец может скрыть" });

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

/* ================================
    SHOW HIDDEN
================================ */
export const showCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const calendar = await Calendar.findById(id);

    if (!calendar) return res.status(404).json({ error: "Календарь не найден" });

    if (!isSameId(calendar.owner, req.user._id))
      return res.status(403).json({ error: "Только владелец может вернуть" });

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

/* ================================
    📧 INVITE USER
================================ */
export const inviteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    const calendar = await Calendar.findById(id);
    if (!calendar) return res.status(404).json({ error: "Календарь не найден" });

    if (calendar.isMain || calendar.isHolidayCalendar)
      return res.status(403).json({ error: "Этот календарь нельзя расшаривать" });

    if (!isSameId(calendar.owner, req.user._id))
      return res.status(403).json({ error: "Только владелец может приглашать" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ error: "Пользователь не найден" });

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

    const emailInfo = await sendEmail(
      email,
      "Приглашение в календарь Chronos",
      `Вас пригласили в календарь "${calendar.name}".`,
      `<h3>Вы приглашены в календарь "${calendar.name}"</h3>
       <p>Ваша роль: <b>${role}</b></p>`
    );

    res.json({
      message: "Пользователь приглашён",
      emailPreview: emailInfo.previewUrl,
      calendar: populated,
    });
  } catch (e) {
    res.status(400).json({ error: "Ошибка приглашения" });
  }
};

/* ================================
    👥 UPDATE MEMBER ROLE
================================ */
export const updateMemberRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;

    const calendar = await Calendar.findById(id);
    if (!calendar) return res.status(404).json({ error: "Календарь не найден" });

    if (calendar.isMain || calendar.isHolidayCalendar)
      return res.status(403).json({ error: "В этом календаре нельзя менять роли" });

    if (!isSameId(calendar.owner, req.user._id))
      return res.status(403).json({ error: "Только владелец может менять роли" });

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

    res.json({ message: "Роль обновлена", calendar: populated });
  } catch (e) {
    res.status(400).json({ error: "Ошибка изменения роли" });
  }
};

/* ================================
    👥 REMOVE MEMBER OR EDITOR
================================ */
/* ===========================================
    👥 REMOVE MEMBER: owner removes OR user leaves
=========================================== */
export const removeCalendarMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const currentUserId = req.user._id.toString(); // кто делает запрос
    const targetUserId = userId.toString();        // кого удаляем

    const calendar = await Calendar.findById(id);
    if (!calendar)
      return res.status(404).json({ error: "Календарь не найден" });

    if (calendar.isMain || calendar.isHolidayCalendar)
      return res.status(403).json({ error: "Этот календарь не поддерживает участников" });

    const isOwner = calendar.owner.toString() === currentUserId;
    const isSelf = currentUserId === targetUserId;

    // 🔥 НОВАЯ ЛОГИКА:
    // - владелец может удалять кого угодно
    // - пользователь может удалить СЕБЯ (выйти)
    if (!isOwner && !isSelf) {
      return res
        .status(403)
        .json({ error: "Тільки власник може видаляти інших учасників" });
    }

    // Удаляем участника из списков
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

    return res.json({
      message: isSelf
        ? "Ви вийшли з календаря"
        : "Учасника видалено",
      calendar: populated,
    });
  } catch (e) {
    console.error("removeCalendarMember error:", e);
    res.status(400).json({ error: "Ошибка удаления участника" });
  }
};
