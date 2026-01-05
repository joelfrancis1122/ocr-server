import { NextFunction, Request, Response, Router } from "express";
import { runOcr } from "../controllers/ocrController";
import upload from "../middlewares/upload";
const router = Router()

router.post("/ocr",upload.fields([{ name: "front", maxCount: 1 },{ name: "back", maxCount: 1 }]),runOcr);
export default router;