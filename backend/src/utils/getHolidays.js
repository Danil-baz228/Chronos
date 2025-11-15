import axios from "axios";

// import axios from "axios";

export const getHolidays = async () => {
  // возвращаем фейковые праздники
  return [
    { title: "New Year", date: "2025-01-01", category: "holiday" },
    { title: "Christmas", date: "2025-01-07", category: "holiday" },
    { title: "Easter", date: "2025-04-20", category: "holiday" },
  ];
};
