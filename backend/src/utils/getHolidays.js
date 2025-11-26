let cache = {
  data: null,
  expires: 0,
};

export async function getHolidays(country = "UA") {
  const year = new Date().getFullYear();

  if (cache.data && cache.expires > Date.now()) {
    return cache.data;
  }

  try {
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`;
    const res = await fetch(url);
    const holidays = await res.json();

    const formatted = holidays.map(h => ({
      title: h.localName,
      date: h.date + "T00:00:00",   // ⬅ начинаем день
      category: "holiday",
      allDay: true                  // ⬅ главное поле!
    }));

    cache = {
      data: formatted,
      expires: Date.now() + 24 * 60 * 60 * 1000,
    };

    return formatted;
  } catch (e) {
    console.error("Ошибка загрузки праздников", e);
    return [];
  }
}
