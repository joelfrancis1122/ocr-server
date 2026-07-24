import { Request, Response } from "express";
import { AadhaarOcrService } from "../services/aadhaarOcrService";

export class OcrController {
  constructor(private aadhaarOcrService: AadhaarOcrService) {}

  runOcr = async (req: Request, res: Response) => {
    try {
      const files = req.files as { [key: string]: Express.Multer.File[] } | undefined;
      const frontFile = files?.front?.[0];
      const backFile = files?.back?.[0];

      if (!frontFile || !backFile) {
        return res.status(400).json({ error: "Both front and back images are required" });
      }

      const ocrResult = await this.aadhaarOcrService.processAadhaar(frontFile.buffer, backFile.buffer);

      res.json({
        message: "OCR completed successfully",
        data: ocrResult,
      });
    } catch (err) {
      console.error("Error in runOcr:", err);
      res.status(500).json({ error: "An internal server error occurred" });
    }
  };
}
