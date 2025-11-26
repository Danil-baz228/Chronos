import Calendar from "../models/Calendar.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";

// ================================
//  Проверка ID
// ================================
function isSameId(a, b) {
  if (!a || !b) return false;
  return a.toString() === b.toString();
}

// ================================
//  Получить все календари пользователя
// ================================
export const getCalendars = async (req, res) => {
  try {
    const calendars = await Calendar.find({
      $or: [
        { owner: req.user._id },
        { editors: req.user._id },
        { members: req.user._id },
      ],
      isHidden: false,
    });

    res.json(calendars);
  } catch (e) {
    res.status(500).json({ error: "Ошибка загрузки календарей" });
  }
};

// ================================
//  Создать календарь
// ================================
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
    });

    res.status(201).json(calendar);
  } catch (e) {
    res.status(400).json({ error: "Ошибка создания календаря" });
  }
};

// ================================
//  Обновить календарь (только владелец)
// ================================
export const updateCalendar = async (req, res) => {
  try {
    const { id } = req.params;

    const calendar = await Calendar.findById(id);
    if (!calendar) {
      return res.status(404).json({ error: "Календарь не найден" });
    }

    if (!isSameId(calendar.owner, req.user._id)) {
      return res
        .status(403)
        .json({ error: "Только владелец может редактировать календарь" });
    }

    if (calendar.isMain) {
      req.body.name = calendar.name;
    }

    Object.assign(calendar, req.body);
    await calendar.save();

    res.json(calendar);
  } catch (e) {
    res.status(400).json({ error: "Ошибка обновления календаря" });
  }
};

// ================================
//  Удаление календаря (только владелец)
// ================================
export const deleteCalendar = async (req, res) => {
  try {
    const { id } = req.params;

    const calendar = await Calendar.findById(id);
    if (!calendar) {
      return res.status(404).json({ error: "Календарь не найден" });
    }

    if (calendar.isMain) {
      return res.status(403).json({ error: "Главный календарь нельзя удалить" });
    }

    if (!isSameId(calendar.owner, req.user._id)) {
      return res
        .status(403)
        .json({ error: "Только владелец может удалить календарь" });
    }

    await calendar.deleteOne();

    res.json({ message: "Календарь удалён" });
  } catch (e) {
    res.status(400).json({ error: "Ошибка удаления календаря" });
  }
};

// ================================
//  Скрыть календарь
// ================================
export const hideCalendar = async (req, res) => {
  try {
    const { id } = req.params;

    const calendar = await Calendar.findById(id);
    if (!calendar) {
      return res.status(404).json({ error: "Календарь не найден" });
    }

    if (calendar.isMain) {
      return res
        .status(403)
        .json({ error: "Главный календарь нельзя скрыть" });
    }

    if (!isSameId(calendar.owner, req.user._id)) {
      return res
        .status(403)
        .json({ error: "Только владелец может скрыть календарь" });
    }

    calendar.isHidden = true;
    await calendar.save();

    res.json(calendar);
  } catch (e) {
    res.status(400).json({ error: "Ошибка скрытия календаря" });
  }
};

// ================================
//  Показать скрытый календарь
// ================================
export const showCalendar = async (req, res) => {
  try {
    const { id } = req.params;

    const calendar = await Calendar.findById(id);
    if (!calendar) {
      return res.status(404).json({ error: "Календарь не найден" });
    }

    if (!isSameId(calendar.owner, req.user._id)) {
      return res
        .status(403)
        .json({ error: "Только владелец может вернуть календарь" });
    }

    calendar.isHidden = false;
    await calendar.save();

    res.json(calendar);
  } catch (e) {
    res.status(400).json({ error: "Ошибка показа календаря" });
  }
};

// ================================
//  Добавить редактора
// ================================
export const addEditor = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const calendar = await Calendar.findById(id);
    if (!calendar) {
      return res.status(404).json({ error: "Календарь не найден" });
    }

    if (!isSameId(calendar.owner, req.user._id)) {
      return res.status(403).json({
        error: "Только владелец может назначать редакторов",
      });
    }

    if (!calendar.editors.includes(userId)) {
      calendar.editors.push(userId);
      await calendar.save();
    }

    res.json(calendar);
  } catch (e) {
    res.status(400).json({ error: "Ошибка назначения редактора" });
  }
};

// ================================
//  Удалить редактора
// ================================
export const removeEditor = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const calendar = await Calendar.findById(id);
    if (!calendar) {
      return res.status(404).json({ error: "Календарь не найден" });
    }

    if (!isSameId(calendar.owner, req.user._id)) {
      return res.status(403).json({
        error: "Только владелец может изменять редакторов",
      });
    }

    calendar.editors = calendar.editors.filter(
      (e) => e.toString() !== userId.toString()
    );

    await calendar.save();

    res.json(calendar);
  } catch (e) {
    res.status(400).json({ error: "Ошибка удаления редактора" });
  }
};

// ================================
//  Добавить участника (read-only)
// ================================
export const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const calendar = await Calendar.findById(id);
    if (!calendar) return res.status(404).json({ error: "Календарь не найден" });

    if (!isSameId(calendar.owner, req.user._id)) {
      return res.status(403).json({
        error: "Только владелец может приглашать пользователей",
      });
    }

    if (!calendar.members.includes(userId)) {
      calendar.members.push(userId);
      await calendar.save();
    }

    res.json(calendar);
  } catch (e) {
    res.status(400).json({ error: "Ошибка добавления участника" });
  }
};

// ================================
//  Удалить участника
// ================================
export const removeMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const calendar = await Calendar.findById(id);
    if (!calendar) return res.status(404).json({ error: "Календарь не найден" });

    if (!isSameId(calendar.owner, req.user._id)) {
      return res.status(403).json({
        error: "Только владелец может удалить участника",
      });
    }

    calendar.members = calendar.members.filter(
      (m) => m.toString() !== userId.toString()
    );

    await calendar.save();

    res.json(calendar);
  } catch (e) {
    res.status(400).json({ error: "Ошибка удаления участника" });
  }
};

// ================================
//  📧 ПРИГЛАСИТЬ ПОЛЬЗОВАТЕЛЯ
// ================================
export const inviteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    const calendar = await Calendar.findById(id);
    if (!calendar) return res.status(404).json({ error: "Календарь не найден" });

    if (!isSameId(calendar.owner, req.user._id)) {
      return res
        .status(403)
        .json({ error: "Только владелец может приглашать" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Такой пользователь не найден" });
    }

    // Добавление роли
    if (role === "editor") {
      if (!calendar.editors.includes(user._id)) {
        calendar.editors.push(user._id);
      }
    } else {
      if (!calendar.members.includes(user._id)) {
        calendar.members.push(user._id);
      }
    }

    await calendar.save();

    const emailInfo = await sendEmail(
      email,
      "Приглашение в календарь Chronos",
      `Вас пригласили в календарь "${calendar.name}".`,
      `<h3>Приглашение в календарь Chronos</h3>
       <p>Вас пригласили в календарь <b>${calendar.name}</b>.</p>
       <p>Ваша роль: <b>${role}</b></p>`
    );

    res.json({
      message: "Пользователь приглашён",
      emailPreview: emailInfo.previewUrl,
      calendar,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({ error: "Ошибка приглашения пользователя" });
  }
};
