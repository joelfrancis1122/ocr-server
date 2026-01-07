export interface AadhaarOcrResult {
  aadhaarNumber: string | null;
  name: string | null;
  dob: string | null;
  gender: string | null;
  mobile: string | null;
  address: string;
  pinCode: string | null;
}
