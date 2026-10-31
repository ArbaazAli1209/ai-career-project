import "server-only";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import Tesseract from "tesseract.js";

const minimumResumeTextLength = 40;
const maximumOcrPages = 4;

// Tesseract language data. Prefer the eng.traineddata bundled in the project root so OCR
// works offline and on serverless hosts; otherwise fall back to Tesseract's CDN download,
// caching into the OS temp directory (the only writable location on most serverless hosts).
function tesseractWorkerOptions() {
  const languageDirectory = process.cwd();
  if (existsSync(path.join(languageDirectory, "eng.traineddata"))) {
    return { langPath: languageDirectory, gzip: false, cacheMethod: "none" as const };
  }
  return { cachePath: tmpdir() };
}

function logPdfStageError(stage: string, error: unknown) {
  if (typeof error === "string") {
    // Tesseract workers reject with plain strings rather than Error objects.
    console.error(`${stage} failed`, { message: error.slice(0, 300) });
    return;
  }
  if (error instanceof Error) {
    const code = "code" in error && typeof error.code === "string" ? error.code : undefined;
    console.error(`${stage} failed`, {
      name: error.name,
      message: error.message.slice(0, 300),
      ...(code ? { code } : {}),
    });
    return;
  }
  console.error(`${stage} failed`, { type: typeof error });
}

async function recognizeScannedPages(contents: Buffer) {
  const parser = new PDFParse({ data: contents });
  let worker: Awaited<ReturnType<typeof Tesseract.createWorker>> | undefined;
  try {
    let screenshots;
    try {
      screenshots = await parser.getScreenshot({
        first: maximumOcrPages,
        scale: 1.5,
        imageBuffer: true,
        imageDataUrl: false,
      });
    } catch (error) {
      logPdfStageError("OCR PDF rendering", error);
      throw error;
    }
    if (!screenshots.pages.length) return "";

    try {
      worker = await Tesseract.createWorker("eng", undefined, tesseractWorkerOptions());
    } catch (error) {
      logPdfStageError("Tesseract worker initialization", error);
      throw error;
    }
    const recognizedPages: string[] = [];
    for (const page of screenshots.pages) {
      let data: Awaited<ReturnType<typeof worker.recognize>>["data"];
      try {
        ({ data } = await worker.recognize(Buffer.from(page.data)));
      } catch (error) {
        logPdfStageError("Tesseract page recognition", error);
        throw error;
      }
      if (data.text.trim()) recognizedPages.push(data.text.trim());
    }
    return recognizedPages.join("\n\n").trim();
  } finally {
    if (worker) {
      await worker.terminate().catch((error: unknown) => {
        logPdfStageError("OCR worker cleanup", error);
      });
    }
    await parser.destroy().catch((error: unknown) => {
      logPdfStageError("OCR PDF parser cleanup", error);
    });
  }
}

export class PdfTextExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfTextExtractionError";
  }
}

async function extractEmbeddedText(contents: Buffer) {
  const parser = new PDFParse({ data: contents });
  try {
    const result = await parser.getText();
    return result.text.replace(/\u0000/g, " ").trim();
  } finally {
    await parser.destroy().catch((error: unknown) => {
      logPdfStageError("Embedded PDF parser cleanup", error);
    });
  }
}

export async function extractPdfText(contents: Buffer) {
  let text = "";
  try {
    text = await extractEmbeddedText(contents);
  } catch (error) {
    logPdfStageError("Embedded PDF text extraction", error);
  }

  if (text.length < minimumResumeTextLength) {
    try {
      text = await recognizeScannedPages(contents);
    } catch (error) {
      logPdfStageError("Resume OCR", error);
      throw new PdfTextExtractionError("We could not recognize text in this PDF. Try a clearer scan or a text-based resume PDF.");
    }
  }

  if (text.length < minimumResumeTextLength) {
    throw new PdfTextExtractionError("This PDF has too little readable text. Try a clearer scan or a text-based resume PDF.");
  }
  return text.slice(0, 100_000);
}