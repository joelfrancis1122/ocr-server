import Tesseract from "tesseract.js";
import { AadhaarOcrResult } from "../types/aadhaar-ocr";

export interface AadhaarOcrRepository {
  processAadhaar(frontBuffer: Buffer, backBuffer: Buffer): Promise<AadhaarOcrResult>;
}

export class TesseractAadhaarOcrRepository implements AadhaarOcrRepository {
  async processAadhaar(frontBuffer: Buffer, backBuffer: Buffer): Promise<AadhaarOcrResult> {
    // 1. Extract OCR texts
    const [ocrResult1, ocrResult2] = await Promise.all([
      Tesseract.recognize(frontBuffer, "eng", { logger: (m) => console.log(m) }),
      Tesseract.recognize(backBuffer, "eng", { logger: (m) => console.log(m) }),
    ]);

    const ocrText1 = ocrResult1.data.text;
    const ocrText2 = ocrResult2.data.text;

    // 2. Determine front/back
    const addressIndicatorRegex = /(Address[:\s]*|C\/O[:\s]*|S\/O[:\s]*|D\/O[:\s]*)/i;
    let frontOCR: string, backOCR: string;

    if (ocrText1.search(addressIndicatorRegex) !== -1 && ocrText2.search(addressIndicatorRegex) === -1) {
      console.log(ocrText1.search(addressIndicatorRegex), "1111111111111");
      console.log(ocrText2.search(addressIndicatorRegex), "222222222222");
      backOCR = ocrText1; 
      frontOCR = ocrText2;
    } else if (ocrText2.search(addressIndicatorRegex) !== -1 && ocrText1.search(addressIndicatorRegex) === -1) {
      console.log(ocrText1.search(addressIndicatorRegex), "-----11111");
      console.log(ocrText2.search(addressIndicatorRegex), "-----------222222");
      backOCR = ocrText2; 
      frontOCR = ocrText1;
    } else {
      frontOCR = ocrText1; 
      backOCR = ocrText2;
    }

    // 3. Extract data from front
    const aadhaarMatch = frontOCR.match(/\b\d{4}\s\d{4}\s\d{4}\b/);
    const aadhaarNumber = aadhaarMatch ? aadhaarMatch[0] : null;

    const nameMatch = frontOCR.match(/Name[:\s]*([A-Za-z\s]+)/) || frontOCR.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/m);
    const name = nameMatch ? nameMatch[1].trim() : null;

    const dobMatch = frontOCR.match(/\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/);
    const dob = dobMatch ? dobMatch[0] : null;

    const genderMatch = frontOCR.match(/\b(MALE|FEMALE|TRANSGENDER)\b/i);
    const gender = genderMatch ? genderMatch[1].toUpperCase() : null;

    const mobileMatch = frontOCR.match(/Mobile\s*No[:\s]*([0-9]{10})/i);
    const mobile = mobileMatch ? mobileMatch[1] : null;

    // 4. COMPLETE address processing + ALL FILTERING
    let processedAddress = backOCR
      .replace(/\n/g, ", ")                             // newlines to commas
      .replace(/\s+/g, " ")                            // collapse multiple spaces
      .replace(/\b\d{4}\s\d{4}\s\d{4}\b/g, "")         // remove Aadhaar numbers
      .replace(/\b\d{4}\s\d{4}\b/g, "")                // remove partial Aadhaar numbers
      .replace(/VID\s*:\s*\d+/gi, "")                  // remove VID numbers
      .replace(/P\.O\. Box/gi, "")                     // remove PO Box
      .replace(/[^a-zA-Z0-9,\s\/\-]/g, ' ')            // remove non-address characters
      .replace(/,\s*,/g, ",")                          // fix multiple commas
      .replace(/\s*,\s*$/g, "")                        // remove trailing commas
      .trim();

    // Extract PIN code
    const pinMatch = processedAddress.match(/\b\d{6}\b/);
    const pinCode = pinMatch ? pinMatch[0] : null;

    // Address start removal
    const addressStartRegex = /(Address[:\s]*|C\/O[:\s]*|S\/O[:\s]*|D\/O[:\s]*)/i;
    const addressStartIndex = processedAddress.search(addressStartRegex);
    if (addressStartIndex !== -1) {
      processedAddress = processedAddress.substring(addressStartIndex).replace(addressStartRegex, '').trim();
    }

    if (pinCode) processedAddress = processedAddress.replace(pinCode, '').trim();
    if (name) processedAddress = processedAddress.replace(new RegExp(name, "gi"), "").trim();

    // COMPLETE Junk Removal - ALL 50+ patterns
    const junkPatterns = [
      "help@uidai", "www.uidai.gov.in", "government of india", "aadhaar", "uidai",
      "po box", "www", "gov", "in", "No", "i,", "54", "4p,", "1947", "help",
      "1947", "Ope", "ssl", "sh", "Tea", "EAE", "Vk", "Wied", "diz", "iT",
      "Fery", "Ed", "Fen", "airs", "rH", "Bey", "gy", "fi", "ey", "er", "SLR",
      "z", "Ee", "Bets", "Sl", "ant", "Fan", "CN", "a", "Sg", "A", "rr", "X",
      "oo", "eeu", "WWEERETT", "Bengaun-ses", "ei"
    ];
    const junkRegex = new RegExp(`\\b(?:${junkPatterns.join("|")})\\b`, "gi");

    processedAddress = processedAddress
      .replace(junkRegex, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Final address parts filtering
    const addressParts = processedAddress.split(',').map(part => part.trim()).filter(part => part.length > 3);
    const address = addressParts.join(', ').trim();

    return { 
      aadhaarNumber, 
      name, 
      dob, 
      gender, 
      mobile, 
      address, 
      pinCode 
    };
  }
}
