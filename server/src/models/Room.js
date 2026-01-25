import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    code: {
      type: String,
      default: "// Start coding...",
    },

    language: {
      type: String,
      enum: ["javascript", "python", "java", "cpp"],
      default: "java",
    },

    users: [
      {
        socketId: {
          type: String,
          required: true,
        },
        userName: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false, // 🔒 VERY IMPORTANT
  },
);

export default mongoose.model("Room", roomSchema);
