import mongoose, { Document } from "mongoose";

const UploadFileSchema = new mongoose.Schema({
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
});
export const UploadFileModel = mongoose.model("upload_files", UploadFileSchema);
