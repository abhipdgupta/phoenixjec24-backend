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

const UploadFileSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:'users',
      required: true,
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
  },
  { timestamps: true }
);

export type TUploadFileModel = InferSchemaType<typeof UploadFileSchema>;
export const UploadFileModel = mongoose.model("upload_files", UploadFileSchema);
