import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
      required: true,
      unique: true, 
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true },

    avatar: { type: String, default: "" },

    holidayRegion: { type: String, default: "UA" }
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
