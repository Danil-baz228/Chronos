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

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    editors: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isMain: {
      type: Boolean,
      default: false,
    },

    isHidden: {
      type: Boolean,
      default: false,
    },

    isHolidayCalendar: {
      type: Boolean,
      default: false,
    },

    holidayYear: {
      type: Number,
      default: null,
    },

    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default model("Calendar", calendarSchema);
