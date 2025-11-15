import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    date: { type: Date, required: true },
    duration: { type: Number, default: 60 },
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
    reminderTime: { type: Date },
    calendar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Calendar",
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
