import mongoose from "mongoose";

const CalendarSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: "My Calendar",
    },
    description: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "#3b82f6", // синий
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Calendar", CalendarSchema);
