import Calendar from "../models/Calendar.js";
import Event from "../models/Event.js";
import { getHolidays } from "../utils/getHolidays.js";

export const createHolidayCalendar = async (
  userId,
  country = "UA",
  year = new Date().getFullYear()
) => {
  try {
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

    const holidays = await getHolidays(country, year);

    for (const h of holidays) {
      await Event.create({
        title: h.title,
        date: new Date(h.date),
        duration: 1440,
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
    console.error("Failed to create holiday calendar:", e);
    throw new Error("Could not create holiday calendar");
  }
};
