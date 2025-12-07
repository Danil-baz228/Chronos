// backend/src/models/Event.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const eventSchema = new Schema(
  {
    title: { type: String, required: true },

    // ❗ Дата хранится как СТРОКА, чтобы не было смещения времени
    date: { type: String, required: true },

    // длительность в минутах
    duration: { type: Number, default: 60 },

    // тип события
    category: {
      type: String,
      enum: ["arrangement", "reminder", "task", "holiday"],
      default: "arrangement",
    },

    description: { type: String, default: "" },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    // время напоминания — тоже делаем строкой, чтобы не прыгало
    reminderTime: { type: String },

    // цвет события
    color: { type: String, default: "#3b82f6" },

    // календарь, к которому привязано событие
    calendar: {
      type: Schema.Types.ObjectId,
      ref: "Calendar",
    },

    // кто создал исходное событие
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔥 копия события для приглашённого
    invitedFrom: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },

    // приглашённые пользователи
    invitedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // приглашённые по email
    invitedEmails: [{ type: String }],

    // read-only копия
    readOnly: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default model("Event", eventSchema);
