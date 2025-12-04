// backend/src/models/Calendar.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const calendarSchema = new Schema(
  {
    // Название календаря
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Описание
    description: {
      type: String,
      default: "",
    },

    // Цвет календаря
    color: {
      type: String,
      default: "#3b82f6",
    },

    // 🔥 Владелец календаря
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔥 Редакторы (могут создавать/редактировать события)
    editors: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // 🔥 Участники (read-only)
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Основной календарь (единственный)
    isMain: {
      type: Boolean,
      default: false,
    },

    // Скрыт ли календарь
    isHidden: {
      type: Boolean,
      default: false,
    },

    // Календарь праздников (read-only)
    isHolidayCalendar: {
      type: Boolean,
      default: false,
    },

    // Год для календаря праздников
    holidayYear: {
      type: Number,
      default: null,
    },

    // =========================================================
    // 🔥 ВАЖНО: Новое поле — включены ли уведомления
    // =========================================================
    notificationsEnabled: {
      type: Boolean,
      default: true, // включено по умолчанию
    },
  },
  { timestamps: true }
);

export default model("Calendar", calendarSchema);
