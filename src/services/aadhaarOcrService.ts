import { IQrScanner, IQrDecoder, IVisionModel, IDataMerger } from "../interfaces/extraction.interface";
import { AadhaarOcrResult } from "../types/aadhaar-ocr";

/**
 * Core Orchestrator Service for Aadhaar processing.
 * Strictly adheres to SOLID Principles (Pure Dependency Inversion):
 * Depends ONLY on interface abstractions (IQrScanner, IQrDecoder, IVisionModel, IDataMerger).
 */
export class AadhaarOcrService {
  constructor(
    private qrScanner: IQrScanner,
    private qrDecoder: IQrDecoder,
    private visionModel: IVisionModel,
    private dataMerger: IDataMerger
  ) {}

  async processAadhaar(frontBuffer: Buffer, backBuffer: Buffer): Promise<AadhaarOcrResult> {
    // 1. Scan & Decode digital QR Code
    const qrData = (await this.qrScanner.scan(backBuffer)) || (await this.qrScanner.scan(frontBuffer));
    const qrParsed = qrData ? this.qrDecoder.decode(qrData) : null;

    // 2. Run Vision AI Model on both images concurrently
    const [frontText, backText] = await Promise.all([
      this.visionModel.extractText(frontBuffer, "<OCR>"),
      this.visionModel.extractText(backBuffer, "<OCR>")
    ]);

    // Parse and clean raw OCR text from Vision AI
    const ocrResult = this.dataMerger.parse(`${frontText?.rawText || ""} ${backText?.rawText || ""}`.trim());

    // 3. Merge results (QR digital data takes top priority; Vision OCR fills missing gaps)
    return {
      aadhaarNumber: ocrResult.aadhaarNumber || (qrParsed?.referenceId ? qrParsed.referenceId.substring(0, 4) : null),
      name: qrParsed?.name || ocrResult.name || null,
      dob: qrParsed?.dob || ocrResult.dob || null,
      gender: qrParsed?.gender || ocrResult.gender || null,
      mobile: ocrResult.mobile || null,
      address: qrParsed?.address || ocrResult.address || null,
      pinCode: qrParsed?.pinCode || ocrResult.pinCode || null,
    };
  }
}
