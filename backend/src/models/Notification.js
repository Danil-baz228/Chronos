import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    calendar: { type: mongoose.Schema.Types.ObjectId, ref: "Calendar" },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },

    type: {
      type: String,
      enum: [
        // календарь
        "calendar_invite",
        "calendar_updated",
        "calendar_deleted",
        "removed_from_calendar",
        "role_changed",

        // события
        "event_created",
        "event_updated",
        "event_deleted",
        "event_invited",
        "event_removed"
      ],
      required: true,
    },

    title: String,        // например название события
    message: { type: String, required: true },

    read: { type: Boolean, default: false },

    meta: {}              // любые доп. данные
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
