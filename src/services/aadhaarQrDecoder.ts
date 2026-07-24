import zlib from "zlib";
import { AadhaarQrData } from "../types/aadhaar-ocr";
import { IQrDecoder } from "../interfaces/extraction.interface";

/**
 * Aadhaar Secure QR Byte Decoder.
 * Implements IQrDecoder interface.
 */
export class AadhaarQrDecoder implements IQrDecoder {
  decode(qrNumericString: string): AadhaarQrData | null {
    try {
      const buffer = this.decimalToBytes(qrNumericString);
      const decompressed = this.decompress(buffer);
      if (!decompressed) return null;

      const fields = this.parseFields(decompressed);
      const refIdx = fields.findIndex((f) => /^\d{15,25}$/.test(f.trim()));
      if (refIdx === -1) return null;

      const getField = (offset: number) => fields[refIdx + offset]?.trim() || null;

      const addressParts: string[] = [];
      for (let i = 4; i <= 14; i++) {
        if (i !== 9) {
          const part = getField(i);
          if (part) addressParts.push(part);
        }
      }

      let gender = getField(3);
      if (gender === "M") gender = "MALE";
      if (gender === "F") gender = "FEMALE";

      return {
        referenceId: getField(0),
        name: getField(1),
        dob: getField(2),
        gender,
        address: addressParts.length > 0 ? addressParts.join(", ") : null,
        pinCode: getField(9),
      };
    } catch {
      return null;
    }
  }

  private decimalToBytes(decimalString: string): Buffer {
    const hex = BigInt(decimalString.trim()).toString(16);
    return Buffer.from(hex.length % 2 ? "0" + hex : hex, "hex");
  }

  private decompress(buffer: Buffer): Buffer | null {
    try { return zlib.inflateSync(buffer); } catch {}
    try { return zlib.gunzipSync(buffer); } catch {}
    return buffer[0] < 128 ? buffer : null;
  }

  private parseFields(buffer: Buffer): string[] {
    const fields: string[] = [];
    let start = 0;

    for (let i = 0; i < buffer.length && fields.length < 20; i++) {
      if (buffer[i] === 255) {
        fields.push(buffer.subarray(start, i).toString("utf-8").trim());
        start = i + 1;
      }
    }

    return fields;
  }
}
