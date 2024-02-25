import mongoose, { Document, InferSchemaType } from "mongoose";

const UploadFileSchema = new mongoose.Schema(
  {
    uploadedBy: {
      // TODO:
      type: String,
      default: null,
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
