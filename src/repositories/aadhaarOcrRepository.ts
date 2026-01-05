export interface AadhaarOcrResult {
  aadhaarNumber: string | null;
  name: string | null;
  dob: string | null;
  gender: string | null;
  mobile: string | null;
  address: string;
  pinCode: string | null;
}

export interface AadhaarOcrRepository {
  extractOcrTexts(frontBuffer: Buffer, backBuffer: Buffer): Promise<{ front: string; back: string }>;
  parseAadhaarData(frontText: string, backText: string): Promise<AadhaarOcrResult>;
}