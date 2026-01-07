import { Request, Response, NextFunction } from "express";
import { AadhaarOcrService } from "../services/aadhaarOcrService";

export const aadhaarOcrService = new AadhaarOcrService();

export const runOcr = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as { [key: string]: Express.Multer.File[] } | undefined;
    const frontFile = files?.front?.[0];
    const backFile = files?.back?.[0];

    if (!frontFile || !backFile) {
      return res.status(400).json({ error: "Both front and back images are required" });
    }

    const result = await aadhaarOcrService.processAadhaar(frontFile.buffer, backFile.buffer);

    res.json({
      message: "OCR completed successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An internal server error occurred" });
  }
};
