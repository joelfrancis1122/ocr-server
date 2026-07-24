import { AadhaarOcrResult } from "../types/aadhaar-ocr";
import { IDataMerger } from "../interfaces/extraction.interface";

/**
 * Text Subtraction Engine & Data Parser.
 * Implements IDataMerger interface.
 */
export class AadhaarDataMerger implements IDataMerger {
  parse(rawText: string): AadhaarOcrResult {
    const data: Partial<AadhaarOcrResult> = {};
    let text = rawText.replace(/<\/?s>/g, "").trim();

    // Remove common boilerplate noise (PO Box 1947, email typos, website URLs, VIDs)
    text = text.replace(
      /P\.O\.\s*Box\s*No\.?\s*1947|Bengaluru\s*[-\s]*\s*560\s*001|,?Bengaluru|560\s*001|1947|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}|WWW|VID[\s:]*[\d\s]{15,25}/gi,
      ""
    );

    // Extract Name
    const nameMatch = text.match(/GOVERNMENT OF INDIA(.*?)(DOB:|Year of Birth|YOB)/i);
    if (nameMatch && nameMatch[1]) {
      data.name = nameMatch[1].replace(/[^a-zA-Z\s]/g, "").trim();
      text = text.replace(nameMatch[1], "");
    }

    // Extract DOB
    const dobMatch = text.match(/DOB:\s*([\d/]+)/i);
    if (dobMatch && dobMatch[1]) {
      data.dob = dobMatch[1].trim();
      text = text.replace(dobMatch[1], "");
    }

    // Extract Gender
    const genderMatch = text.match(/(MALE|FEMALE|TRANSGENDER)/i);
    if (genderMatch && genderMatch[1]) {
      data.gender = genderMatch[1].toUpperCase();
      text = text.replace(genderMatch[1], "");
    }

    // Extract Mobile Number
    const mobileMatch = text.match(/Mobile No[:\s]*(\d{10})/i);
    if (mobileMatch && mobileMatch[1]) {
      data.mobile = mobileMatch[1].trim();
      text = text.replace(mobileMatch[1], "");
    }

    // Extract Aadhaar Number and Pin Code
    const digitBlocks = text.match(/[\d\s]{10,}/g) || [];
    for (const block of digitBlocks) {
      const digits = block.replace(/\D/g, "");
      
      if (digits.length >= 17 && digits.length <= 18) {
        data.pinCode = digits.slice(0, 6);
        data.aadhaarNumber = digits.slice(6);
        text = text.replace(block, "");
      } else if (digits.length >= 11 && digits.length <= 12) {
        data.aadhaarNumber = digits;
        text = text.replace(block, "");
      }
    }

    if (!data.pinCode) {
      const pinMatches = text.match(/(?<!\d)([1-9]\d{2}\s?\d{3})(?!\d)/g);
      if (pinMatches && pinMatches.length > 0) {
        const lastPin = pinMatches[pinMatches.length - 1];
        data.pinCode = lastPin.replace(/\s/g, "");
        text = text.replace(lastPin, "");
      }
    }

    // Extract Address
    const addressMatch = text.match(/(?:Address|Add)\s*:(.*)/is);
    let addressText = addressMatch && addressMatch[1] ? addressMatch[1] : text;

    addressText = addressText
      .replace(/GOVERNMENT OF INDIA|DOB:|Year of Birth|YOB|Mobile No[:\s]*|Address\s*:|Add\s*:|VID[:\s]*|UNIQUE IDENTIFICATION AUTHORITY OF INDIA|AADHAAR/gi, "")
      .replace(/[^\x00-\x7F]+/g, "")
      .replace(/^[,\s-]+|[,\s-]+$/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (addressText.length > 5) {
      data.address = addressText;
    }

    return {
      aadhaarNumber: data.aadhaarNumber || null,
      name: data.name || null,
      dob: data.dob || null,
      gender: data.gender || null,
      mobile: data.mobile || null,
      address: data.address || null,
      pinCode: data.pinCode || null,
    };
  }
}
