// src/context/LanguageContext.jsx
import React, { createContext, useContext, useMemo, useState } from "react";

export const LanguageContext = createContext();

const translations = {
  uk: {
    "calendar.title": "📅 Chronos — Мої календарі",
    "calendar.loading": "Завантаження календаря...",
    "calendar.weekLabel": "Поточний тиждень",
    "toolbar.search": "Пошук подій...",
    "toolbar.newEvent": "Нова подія",
    "toolbar.allCategories": "Усі категорії",
    "category.arrangement": "Зустрічі",
    "category.reminder": "Нагадування",
    "category.task": "Завдання",
    "category.holiday": "Свята",

    "modal.addTitle": "➕ Додати подію",
    "modal.editTitle": "✏️ Редагувати подію",
    "modal.name": "Назва",
    "modal.datetime": "Дата й час",
    "modal.duration": "Тривалість (хв)",
    "modal.category": "Категорія",
    "modal.description": "Опис",
    "modal.color": "Колір події",
    "modal.save": "💾 Зберегти",
    "modal.delete": "🗑 Видалити",
    "modal.cancel": "Скасувати",

    "preview.invitedBy": "Запросив:",
    "preview.invited": "Запрошені:",
    "preview.inviteTitle": "Запросити на подію:",
    "preview.invitePlaceholder": "email користувача",
    "preview.inviteBtn": "➕ Запросити",
    "preview.edit": "✏ Редагувати",
    "preview.delete": "🗑 Видалити",
    "preview.deleteSelf": "🗑 Видалити в себе",

    "navbar.theme": "Тема",
    "navbar.lang": "Мова",
    "navbar.light": "Світла",
    "navbar.dark": "Темна",
    "navbar.glass": "Glass",
    "navbar.calendar": "Календар",
    "navbar.tasks": "Задачі",
    "navbar.analytics": "Аналітика",
  },
  en: {
    "calendar.title": "📅 Chronos — My calendars",
    "calendar.loading": "Loading calendar...",
    "calendar.weekLabel": "Current week",
    "toolbar.search": "Search events...",
    "toolbar.newEvent": "New event",
    "toolbar.allCategories": "All categories",
    "category.arrangement": "Meetings",
    "category.reminder": "Reminders",
    "category.task": "Tasks",
    "category.holiday": "Holidays",

    "modal.addTitle": "➕ Add event",
    "modal.editTitle": "✏️ Edit event",
    "modal.name": "Title",
    "modal.datetime": "Date & time",
    "modal.duration": "Duration (min)",
    "modal.category": "Category",
    "modal.description": "Description",
    "modal.color": "Event color",
    "modal.save": "💾 Save",
    "modal.delete": "🗑 Delete",
    "modal.cancel": "Cancel",

    "preview.invitedBy": "Invited by:",
    "preview.invited": "Guests:",
    "preview.inviteTitle": "Invite to event:",
    "preview.invitePlaceholder": "user email",
    "preview.inviteBtn": "➕ Invite",
    "preview.edit": "✏ Edit",
    "preview.delete": "🗑 Delete",
    "preview.deleteSelf": "🗑 Remove from my calendar",

    "navbar.theme": "Theme",
    "navbar.lang": "Language",
    "navbar.light": "Light",
    "navbar.dark": "Dark",
    "navbar.glass": "Glass",
    "navbar.calendar": "Calendar",
    "navbar.tasks": "Tasks",
    "navbar.analytics": "Analytics",
  },
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("uk");

  const value = useMemo(
    () => ({
      lang,
      setLang,
    }),
    [lang]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const { lang } = useContext(LanguageContext);

  const t = (key) => {
    const pack = translations[lang] || translations.uk;
    return pack[key] || key;
  };

  return { t, lang };
}
