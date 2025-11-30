// backend/src/utils/getHolidays.js

// Кеш по ключу "страна-год"
let cache = {
  // "UA-2025": { data: [...], expires: timestamp }
};

export async function getHolidays(country = "UA", year = new Date().getFullYear()) {
  const key = `${country}-${year}`;

  // Проверяем кеш
  if (cache[key] && cache[key].expires > Date.now()) {
    return cache[key].data;
  }

  try {
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`;
    const res = await fetch(url);
    const holidays = await res.json();

    const formatted = holidays.map((h) => ({
      title: h.localName,
      date: h.date + "T00:00:00", // начало дня
      category: "holiday",
      allDay: true,
    }));

    cache[key] = {
      data: formatted,
      expires: Date.now() + 24 * 60 * 60 * 1000, // кеш на 24 часа
    };

    return formatted;
  } catch (e) {
    console.error("Ошибка загрузки праздников", e);
    return [];
  }
}
