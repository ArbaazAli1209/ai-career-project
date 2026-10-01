import mongoose, { Schema, type InferSchemaType } from "mongoose";

const resumeSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileName: { type: String, required: true, maxlength: 180 },
    size: { type: Number, required: true, min: 1 },
    gridFsId: { type: Schema.Types.ObjectId, required: true, unique: true },
    extractedText: { type: String, required: true, maxlength: 100_000 },
  },
  { timestamps: true },
);

resumeSchema.index({ ownerId: 1, createdAt: -1 });

export type ResumeDocument = InferSchemaType<typeof resumeSchema>;
export const ResumeModel = mongoose.models.Resume ?? mongoose.model("Resume", resumeSchema);