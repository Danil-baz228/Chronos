import mongoose from "mongoose";

const { Schema, model } = mongoose;

const calendarSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
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

    // Основной календарь (создаётся автоматически при регистрации)
    isMain: {
      type: Boolean,
      default: false,
    },

    // Скрыт ли календарь (для кнопки "скрыть")
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default model("Calendar", calendarSchema);
