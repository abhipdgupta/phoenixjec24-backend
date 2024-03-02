import mongoose, { InferSchemaType } from "mongoose";

const userSchema = new mongoose.Schema(
  {
    profile_image: {
      type: String,
      default: null,
    },
    display_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN", "MODERATOR"],
      default: "USER",
    },
    presigned_url_requested: {
      type: Number,
      default: 0,
    },
    total_size_uploaded: {
      type: Number,
      default: 0,
    },
    block_till: {
      type: Date,
      default: null,
    },
    restricted: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
export type TUserModel = InferSchemaType<typeof userSchema>;
export const UserModel = mongoose.model("users", userSchema);

const UploadImageSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    file_name: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export type TUploadImageModel = InferSchemaType<typeof UploadImageSchema>;
export const UploadImageModel = mongoose.model(
  "upload_files",
  UploadImageSchema
);

const OrganizerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
});
export type TOrganizerModel = InferSchemaType<typeof OrganizerSchema>;
export const OrganizerModel = mongoose.model("organizers", OrganizerSchema);

const EventsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  organizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
});
export type TEventsModel = InferSchemaType<typeof EventsSchema>;
export const EventsModel = mongoose.model("events", EventsSchema);