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
        
        //frontpage and backpage
        
        const [ocrResult1, ocrResult2] = await Promise.all([
            Tesseract.recognize(frontFile.buffer, "eng", { logger: (m) => console.log(m) }),
            Tesseract.recognize(backFile.buffer, "eng", { logger: (m) => console.log(m) }),
        ]);

        const ocrText1 = ocrResult1.data.text;
        const ocrText2 = ocrResult2.data.text;

  
        // We use this to identify which text belongs to the back side
        const addressIndicatorRegex = /(Address[:\s]*|C\/O[:\s]*|S\/O[:\s]*|D\/O[:\s]*)/i;

        let frontOCR: string;
        let backOCR: string;

        // Determine which OCR text is the 'back' side
        if (ocrText1.search(addressIndicatorRegex) !== -1 && ocrText2.search(addressIndicatorRegex) === -1) {
            console.log(ocrText1.search(addressIndicatorRegex),"1111111111111")
            console.log(ocrText2.search(addressIndicatorRegex),"222222222222")
            backOCR = ocrText1;
            frontOCR = ocrText2;
        } else if (ocrText2.search(addressIndicatorRegex) !== -1 && ocrText1.search(addressIndicatorRegex) === -1) {
            console.log(ocrText1.search(addressIndicatorRegex),"-----11111")
            console.log(ocrText2.search(addressIndicatorRegex),"-----------222222")
            backOCR = ocrText2;
            frontOCR = ocrText1;
        } else {
            //OCR quality is poor or a non-standard card.
            frontOCR = ocrText1;
            backOCR = ocrText2;
        }

        const aadhaarMatch = frontOCR.match(/\b\d{4}\s\d{4}\s\d{4}\b/);
        // We'll prioritize the number from the front, but could also check the back if front fails
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

        // ----backside
        let addressRaw = backOCR;

        let processedAddress = addressRaw;

        processedAddress = processedAddress
            .replace(/\n/g, ", ") //newlines to commas
            .replace(/\s+/g, " ") //collapse multiple spaces
            .replace(/\b\d{4}\s\d{4}\s\d{4}\b/g, "") //remove Aadhaar numbers
            .replace(/\b\d{4}\s\d{4}\b/g, "") //remove partial Aadhaar numbers
            .replace(/VID\s*:\s*\d+/gi, "") //remove VID numbers
            .replace(/P\.O\. Box/gi, "") //remove PO Box
            .replace(/[^a-zA-Z0-9,\s\/\-]/g, ' ') //remove non-address characters
            .replace(/,\s*,/g, ",") //fix multiple commas
            .replace(/\s*,\s*$/g, "") //remove trailing commas
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