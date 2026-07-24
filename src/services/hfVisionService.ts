import { AutoProcessor, AutoModelForImageTextToText, RawImage } from "@huggingface/transformers";
import sharp from "sharp";
import { IVisionModel } from "../interfaces/extraction.interface";

/**
 * Florence-2 AI Vision Model Service.
 * Implements IVisionModel interface.
 */
export class HuggingFaceVisionService implements IVisionModel {
  private modelPromise = AutoModelForImageTextToText.from_pretrained("onnx-community/Florence-2-base-ft", { dtype: "q8" });
  private processorPromise = AutoProcessor.from_pretrained("onnx-community/Florence-2-base-ft");

  async extractText(buffer: Buffer, prompt: string): Promise<{ rawText: string }> {
    try {
      const [model, processor] = await Promise.all([this.modelPromise, this.processorPromise]);
      const enhancedBuffer = await sharp(buffer).resize(1600).normalize().sharpen().toBuffer();
      const image = await RawImage.read(new Blob([new Uint8Array(enhancedBuffer)]));

      const inputs = await processor(image, prompt);
      const outputs = await model.generate({ ...inputs, max_new_tokens: 1024 });
      const decoded = processor.batch_decode(outputs as any, { skip_special_tokens: false });
      const rawText = (decoded?.[0] || "").replace(/<\/s>/g, "").trim();

      return { rawText };
    } catch (error) {
      console.error("Vision Model error:", error);
      return { rawText: "" };
    }
  }
}
