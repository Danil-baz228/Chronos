// backend/src/models/Event.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const eventSchema = new Schema(
  {
    title: { type: String, required: true },

    // дата начала события
    date: { type: Date, required: true },

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

    // если нужно — время напоминания
    reminderTime: { type: Date },

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

    // 🔥 если это КОПИЯ события для приглашённого
    // здесь храним ссылку на ОРИГИНАЛ
    invitedFrom: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },

    // 🧑‍🤝‍🧑 приглашенные пользователи (зарегистрированные)
    invitedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ✉️ приглашенные по email (может не быть аккаунта)
    invitedEmails: [{ type: String }],

    // 🔒 read-only событие (нельзя редактировать/удалять на бэке)
    readOnly: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default model("Event", eventSchema);
