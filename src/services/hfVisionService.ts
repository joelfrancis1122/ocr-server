import Tesseract from "tesseract.js";
import sharp from "sharp";
import { IVisionModel } from "../interfaces/extraction.interface";

/**
 * Tesseract.js Vision Model Service.
 * Implements IVisionModel interface.
 */
export class HuggingFaceVisionService implements IVisionModel {
  async extractText(buffer: Buffer, prompt: string): Promise<{ rawText: string }> {
    try {
      // Preprocess image for OCR: grayscale, normalize, and sharpen
      const enhancedBuffer = await sharp(buffer)
        .resize({ width: 1600 })
        .grayscale()
        .normalize()
        .sharpen()
        .png()
        .toBuffer();

      // Run Tesseract OCR
      const result = await Tesseract.recognize(enhancedBuffer, 'eng');
      
      const rawText = result.data.text || "";
      console.log("OCR Extracted Text:", rawText.substring(0, 100) + "..."); // Log first 100 chars

      return { rawText };
    } catch (error) {
      console.error("Vision Model error:", error);
      return { rawText: "" };
    }
  }
}
