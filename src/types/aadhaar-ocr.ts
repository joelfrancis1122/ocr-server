export interface AadhaarOcrResult {
  aadhaarNumber: string | null; 
  name: string | null;          
  dob: string | null;           
  gender: string | null;       
  mobile: string | null;       
  address: string | null;       
  pinCode: string | null;      
}

export interface AadhaarQrData {
  referenceId: string | null;   //for QR Reference ID
  name: string | null;          
  dob: string | null;           
  gender: string | null;        
  address: string | null;       
  pinCode: string | null;       
}
