import { Router } from "express";
import { OcrController } from "../controllers/ocrController";
import upload from "../middlewares/upload";
import { ImageQrScanner } from "../services/imageQrScanner";
import { AadhaarQrDecoder } from "../services/aadhaarQrDecoder";
import { HuggingFaceVisionService } from "../services/hfVisionService";
import { AadhaarDataMerger } from "../services/aadhaarDataMerger";
import { AadhaarOcrService } from "../services/aadhaarOcrService";

const router = Router();

const qrScanner = new ImageQrScanner();
const qrDecoder = new AadhaarQrDecoder();
const visionService = new HuggingFaceVisionService();
const dataMerger = new AadhaarDataMerger();

const aadhaarOcrService = new AadhaarOcrService(qrScanner, qrDecoder, visionService, dataMerger);
const ocrController = new OcrController(aadhaarOcrService);

router.post("/ocr", upload.fields([{ name: "front", maxCount: 1 }, { name: "back", maxCount: 1 }]), ocrController.runOcr);

export default router;