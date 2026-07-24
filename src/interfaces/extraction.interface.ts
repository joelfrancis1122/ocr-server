import { AadhaarOcrResult, AadhaarQrData } from "../types/aadhaar-ocr";

export interface IQrScanner {
  scan(buffer: Buffer): Promise<string | null>;
}
export interface IQrDecoder {
  decode(qrNumericString: string): AadhaarQrData | null;
}
export interface IVisionModel {
  extractText(buffer: Buffer, prompt: string): Promise<{ rawText: string }>;
}
export interface IDataMerger {
  parse(rawText: string): AadhaarOcrResult;
}
