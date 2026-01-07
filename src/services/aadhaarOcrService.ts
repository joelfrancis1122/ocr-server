import { AadhaarOcrRepository, TesseractAadhaarOcrRepository } from "../repository/aadhaarOcr.repository";
import { AadhaarOcrResult } from "../types/aadhaar-ocr";

export class AadhaarOcrService {
  private repository: AadhaarOcrRepository;

  constructor() {
    this.repository = new TesseractAadhaarOcrRepository();
  }

  async processAadhaar(frontBuffer: Buffer, backBuffer: Buffer): Promise<AadhaarOcrResult> {
    return this.repository.processAadhaar(frontBuffer, backBuffer);
  }
}
