import { Request, Response, NextFunction } from "express";
import Tesseract from "tesseract.js";

export const runOcr = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const files = req.files as { [key: string]: Express.Multer.File[] } | undefined;
        const frontFile = files?.front?.[0];
        const backFile = files?.back?.[0];

        if (!frontFile || !backFile) {
            return res.status(400).json({ error: "Both front and back images are required" });
        }

        // ---------- Run OCR ----------
        const frontText = await Tesseract.recognize(frontFile.buffer, "eng", {
            logger: (m) => console.log(m),
        });
        const backText = await Tesseract.recognize(backFile.buffer, "eng", {
            logger: (m) => console.log(m),
        });

        const frontOCR = frontText.data.text;
        const backOCR = backText.data.text;

        // ---------- FRONT SIDE ----------
        const aadhaarMatch = frontOCR.match(/\b\d{4}\s\d{4}\s\d{4}\b/);
        const aadhaarNumber = aadhaarMatch ? aadhaarMatch[0] : null;

        const nameMatch =
            frontOCR.match(/Name[:\s]*([A-Za-z\s]+)/) ||
            frontOCR.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/m);
        const name = nameMatch ? nameMatch[1].trim() : null;

        const dobMatch = frontOCR.match(/\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/);
        const dob = dobMatch ? dobMatch[0] : null;

        const genderMatch = frontOCR.match(/\b(MALE|FEMALE|TRANSGENDER)\b/i);
        const gender = genderMatch ? genderMatch[1].toUpperCase() : null;

        const mobileMatch = frontOCR.match(/Mobile\s*No[:\s]*([0-9]{10})/i);
        const mobile = mobileMatch ? mobileMatch[1] : null;

        // ---------- BACK SIDE (Address) - FINALIZED LOGIC ----------
        let addressRaw = backOCR;
        let processedAddress = addressRaw;

        // 1. Normalize and remove common patterns
        processedAddress = processedAddress
            .replace(/\n/g, ", ") // Newlines to commas
            .replace(/\s+/g, " ") // Collapse multiple spaces
            .replace(/\b\d{4}\s\d{4}\s\d{4}\b/g, "") // Remove Aadhaar numbers
            .replace(/\b\d{4}\s\d{4}\b/g, "") // Remove partial Aadhaar numbers
            .replace(/VID\s*:\s*\d+/gi, "") // Remove VID numbers
            .replace(/P\.O\. Box/gi, "") // Remove PO Box
            .replace(/[^a-zA-Z0-9,\s\/\-]/g, ' ') // Remove non-address characters (aggressive filter)
            .replace(/,\s*,/g, ",") // Fix multiple commas
            .replace(/\s*,\s*$/g, "") // Remove trailing commas
            .trim();

        // 2. Extract PIN code 
        const pinMatch = processedAddress.match(/\b\d{6}\b/);
        const pinCode = pinMatch ? pinMatch[0] : null;

        // 3. Extract address text and remove identified PIN code and name
        const addressStartRegex = /(Address[:\s]*|C\/O[:\s]*|S\/O[:\s]*|D\/O[:\s]*)/i;
        const addressStartIndex = processedAddress.search(addressStartRegex);
        
        if (addressStartIndex !== -1) {
            processedAddress = processedAddress.substring(addressStartIndex).replace(addressStartRegex, '').trim();
        }

        if (pinCode) {
            processedAddress = processedAddress.replace(pinCode, '').trim();
        }
        if (name) {
            processedAddress = processedAddress.replace(new RegExp(name, "gi"), "").trim();
        }

        // Junk Removal
        const junkPatterns = [
            "help@uidai",
            "www.uidai.gov.in",
            "government of india",
            "aadhaar",
            "uidai",
            "po box",
            "www",
            
            "gov",
            "in",
            "No",
            "i,", "54", "4p,", "1947", "help",
            "1947",
            "Ope", "ssl", "sh", "Tea", "EAE", "Vk", "Wied", "diz", "iT", "Fery", "Ed", "Fen",
            "airs", "rH", "Bey", "gy", "fi", "ey", "er", "SLR", "z", "Ee", "Bets",
            "Sl", "ant", "Fan", "CN", "a", "Sg", "A", "rr", "X", "oo", "eeu", "WWEERETT", "Bengaun-ses", "ei"
        ];
        const junkRegex = new RegExp(`\\b(?:${junkPatterns.join("|")})\\b`, "gi");

        processedAddress = processedAddress.replace(junkRegex, '').replace(/\s{2,}/g, ' ').trim();

        // Split by comma and filter out very short, likely-junk segments
        const addressParts = processedAddress.split(',').map(part => part.trim()).filter(part => part.length > 3);
        const finalAddress = addressParts.join(', ').trim();

        // ---------- Response ----------
        res.json({
            message: "OCR completed successfully",
            data: {
                aadhaarNumber,
                name,
                dob,
                gender,
                mobile,
                address: finalAddress,
                pinCode,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "An internal server error occurred" });
    }
};