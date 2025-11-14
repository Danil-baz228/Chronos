import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    date: { type: Date, required: true },
    category: {
      type: String,
      enum: ["arrangement", "reminder", "task"],
      required: true,
    },
    description: { type: String },
    duration: { type: Number, default: 60 }, // в минутах
    calendar: { type: mongoose.Schema.Types.ObjectId, ref: "Calendar" },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
