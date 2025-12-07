let cache = {};

export async function getHolidays(country = "UA", year = new Date().getFullYear()) {
  const key = `${country}-${year}`;


  if (cache[key] && cache[key].expires > Date.now()) {
    return cache[key].data;
  }

  try {
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`;
    const res = await fetch(url);
    const holidays = await res.json();

    const formatted = holidays.map((h) => ({
      title: h.localName,
      date: h.date + "T00:00:00",
      category: "holiday",
      allDay: true,
    }));

    cache[key] = {
      data: formatted,
      expires: Date.now() + 24 * 60 * 60 * 1000, 
    };

    return formatted;
  } catch (e) {
    console.error("Holiday fetch error", e);
    return [];
  }
}
