import "server-only";
import { PDFParse } from "pdf-parse";

export async function extractPdfText(contents: Buffer) {
  const parser = new PDFParse({ data: contents });
  try {
    const result = await parser.getText();
    const text = result.text.replace(/\u0000/g, " ").trim();
    if (text.length < 40) {
      throw new Error("This PDF does not contain enough selectable text. Try a text-based PDF.");
    }
    return text.slice(0, 100_000);
  } finally {
    await parser.destroy();
  }
}