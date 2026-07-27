import { HfInference } from "@huggingface/inference";
import sharp from "sharp";
import { IVisionModel } from "../interfaces/extraction.interface";

/**
 * Florence-2 AI Vision Model Service via API.
 * Implements IVisionModel interface.
 */
export class HuggingFaceVisionService implements IVisionModel {
  private hf: HfInference;

  constructor() {
    this.hf = new HfInference(process.env.HF_TOKEN);
  }

  async extractText(buffer: Buffer, prompt: string): Promise<{ rawText: string }> {
    try {
      const enhancedBuffer = await sharp(buffer).resize(1600).normalize().sharpen().jpeg().toBuffer();
      const blob = new Blob([new Uint8Array(enhancedBuffer)], { type: 'image/jpeg' });

      // Call Hugging Face API
      const response = await this.hf.request({
        model: "microsoft/Florence-2-base-ft",
        inputs: blob,
        parameters: { prompt }
      });
      
      let rawText = "";
      if (Array.isArray(response) && response.length > 0) {
        rawText = response[0].generated_text || "";
      } else if (response && (response as any).generated_text) {
        rawText = (response as any).generated_text;
      }

      return { rawText };
    } catch (error) {
      console.error("Vision Model error:", error);
      return { rawText: "" };
    }
  }
}
