import mongoose from "mongoose";

const { Schema, model } = mongoose;

const eventSchema = new Schema(
  {
    title: { type: String, required: true },

    date: { type: String, required: true },

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

    reminderTime: { type: String },

    color: { type: String, default: "#3b82f6" },

    calendar: {
      type: Schema.Types.ObjectId,
      ref: "Calendar",
    },

    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    invitedFrom: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },

    invitedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    invitedEmails: [{ type: String }],

    readOnly: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default model("Event", eventSchema);
