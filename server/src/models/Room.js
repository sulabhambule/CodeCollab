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
      default: "",
    },
    language: {
      type: String,
      enum: ["javascript", "python", "java", "cpp"],
      default: "java",
    },
    users: [
      {
        userId: {
          type: String,
          required: true
        }, // this we are changing the schema so we need to change in the frontend and backend logic accordingly.
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
    versionKey: false,
  },
);

export default mongoose.model("Room", roomSchema);
