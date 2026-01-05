import { AadhaarOcrRepository, AadhaarOcrResult } from "../repositories/aadhaarOcrRepository";

export class AadhaarOcrUseCase {
  constructor(private ocrRepo: AadhaarOcrRepository) {}

  async execute(frontBuffer: Buffer, backBuffer: Buffer): Promise<AadhaarOcrResult> {
    const { front, back } = await this.ocrRepo.extractOcrTexts(frontBuffer, backBuffer);
    return this.ocrRepo.parseAadhaarData(front, back);
  }
}   