import mongoose, { Schema } from "mongoose";

const uploadSessionSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  fileName: { type: String, required: true, maxlength: 180 },
  fileSize: { type: Number, required: true },
  expectedChunks: { type: Number, required: true },
  status: { type: String, enum: ["open", "finalizing"], default: "open", required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });

const uploadChunkSchema = new Schema({
  uploadId: { type: Schema.Types.ObjectId, required: true },
  ownerId: { type: Schema.Types.ObjectId, required: true },
  index: { type: Number, required: true },
  data: { type: Buffer, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });

uploadChunkSchema.index({ uploadId: 1, index: 1 }, { unique: true });

export const UploadSessionModel = mongoose.models.UploadSession ?? mongoose.model("UploadSession", uploadSessionSchema);
export const UploadChunkModel = mongoose.models.UploadChunk ?? mongoose.model("UploadChunk", uploadChunkSchema);