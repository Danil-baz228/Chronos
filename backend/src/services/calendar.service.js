// backend/src/services/calendar.service.js
import Calendar from "../models/Calendar.js";
import Event from "../models/Event.js";
import { getHolidays } from "../utils/getHolidays.js";

/**
 * Создаёт календарь праздников и добавляет туда события
 * country = "UA" по умолчанию
 * year = текущий год по умолчанию
 */
export const createHolidayCalendar = async (
  userId,
  country = "UA",
  year = new Date().getFullYear()
) => {
  try {
    // 1. Создаём календарь Holidays
    const holidayCalendar = await Calendar.create({
      name: `Holidays ${year} (${country})`,
      description: `National holidays for ${country} in ${year}`,
      color: "#10b981",
      owner: userId,
      editors: [],
      members: [],
      isMain: false,
      isHidden: false,
      isHolidayCalendar: true,
      holidayYear: year,
    });

    // 2. Загружаем список праздников за нужный год
    const holidays = await getHolidays(country, year);

    // 3. Создаём события праздников (read-only)
    for (const h of holidays) {
      await Event.create({
        title: h.title,
        date: new Date(h.date),
        duration: 1440, // 24 часа
        category: "holiday",
        description: h.title,
        color: "#10b981",
        calendar: holidayCalendar._id,
        creator: userId,
        invitedFrom: null,
        readOnly: true,
      });
    }

    return holidayCalendar;
  } catch (e) {
    console.error("❌ Ошибка создания календ. праздников:", e);
    throw new Error("Не удалось создать календарь праздников");
  }
};
