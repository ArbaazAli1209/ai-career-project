import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { CareerAnalysisResult } from "@/lib/validation/schemas";

const careerAnalysisSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resumeId: { type: Schema.Types.ObjectId, ref: "Resume", required: true },
    roleTitle: { type: String, required: true, maxlength: 120 },
    company: { type: String, required: true, maxlength: 120 },
    jobDescription: { type: String, required: true, maxlength: 20_000 },
    alignment: { type: Number, required: true, min: 0, max: 100 },
    result: { type: Schema.Types.Mixed, required: true },
    schemaVersion: { type: Number, required: true, default: 1 },
  },
  { timestamps: true },
);

careerAnalysisSchema.index({ ownerId: 1, createdAt: -1 });

export type CareerAnalysisDocument = InferSchemaType<typeof careerAnalysisSchema> & {
  result: CareerAnalysisResult;
};
export const CareerAnalysisModel = mongoose.models.CareerAnalysis ?? mongoose.model("CareerAnalysis", careerAnalysisSchema);