import sharp from "sharp";
import { readBarcodesFromImageData } from "zxing-wasm/reader";
import { IQrScanner } from "../interfaces/extraction.interface";

/**
 * WebAssembly QR Barcode Scanner.
 * Implements IQrScanner interface.
 */
export class ImageQrScanner implements IQrScanner {
  async scan(buffer: Buffer): Promise<string | null> {
    const pipelines = [
      sharp(buffer),
      sharp(buffer).resize(2000),
      sharp(buffer).greyscale().normalize().sharpen().resize(2000),
      sharp(buffer).greyscale().threshold(128).resize(2000),
    ];

    for (const pipeline of pipelines) {
      try {
        const { data, info } = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        const results = await readBarcodesFromImageData(
          { data: new Uint8ClampedArray(data), width: info.width, height: info.height, colorSpace: "srgb" },
          { formats: ["QRCode"], tryHarder: true }
        );
        if (results?.[0]?.text) return results[0].text;
      } catch {}
    }

    return null;
  }
}
