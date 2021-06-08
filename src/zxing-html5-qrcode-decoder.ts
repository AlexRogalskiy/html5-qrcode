/**
 * @fileoverview
 * {@interface QrcodeDecoder} wrapper around ZXing library.
 * 
 * @author mebjas <minhazav@gmail.com>
 * 
 * ZXing library forked from https://github.com/zxing-js/library.
 * 
 * The word "QR Code" is registered trademark of DENSO WAVE INCORPORATED
 * http://www.denso-wave.com/qrcode/faqpatent-e.html
 */

import {
    QrcodeResult,
    Html5QrcodeSupportedFormats,
    QrcodeDecoder
} from "./core";

import { 
  MultiFormatReader, 
  BarcodeFormat, 
  DecodeHintType, 
  HTMLCanvasElementLuminanceSource, 
  BinaryBitmap, 
  HybridBinarizer
} from '@zxing/library';


// Ambient tag to refer to ZXing library.
declare const ZXing: any;

/**
 * ZXing based Code decoder.
 */
export class ZXingHtml5QrcodeDecoder implements QrcodeDecoder {

    private static formatMap: Map<Html5QrcodeSupportedFormats, any>
        = new Map([
            [Html5QrcodeSupportedFormats.QR_CODE, BarcodeFormat.QR_CODE ],
            [Html5QrcodeSupportedFormats.AZTEC, BarcodeFormat.AZTEC ],
            [Html5QrcodeSupportedFormats.CODABAR, BarcodeFormat.CODABAR ],
            [Html5QrcodeSupportedFormats.CODE_39, BarcodeFormat.CODE_39 ],
            [Html5QrcodeSupportedFormats.CODE_93, BarcodeFormat.CODE_93 ],
            [
                Html5QrcodeSupportedFormats.CODE_128,
                BarcodeFormat.CODE_128 ],
            [
                Html5QrcodeSupportedFormats.DATA_MATRIX,
                BarcodeFormat.DATA_MATRIX ],
            [
                Html5QrcodeSupportedFormats.MAXICODE,
                BarcodeFormat.MAXICODE ],
            [Html5QrcodeSupportedFormats.ITF, BarcodeFormat.ITF ],
            [Html5QrcodeSupportedFormats.EAN_13, BarcodeFormat.EAN_13 ],
            [Html5QrcodeSupportedFormats.EAN_8, BarcodeFormat.EAN_8 ],
            [Html5QrcodeSupportedFormats.PDF_417, BarcodeFormat.PDF_417 ],
            [Html5QrcodeSupportedFormats.RSS_14, BarcodeFormat.RSS_14 ],
            [
                Html5QrcodeSupportedFormats.RSS_EXPANDED,
                BarcodeFormat.RSS_EXPANDED ],
            [Html5QrcodeSupportedFormats.UPC_A, BarcodeFormat.UPC_A ],
            [Html5QrcodeSupportedFormats.UPC_E, BarcodeFormat.UPC_E ],
            [
                Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
                BarcodeFormat.UPC_EAN_EXTENSION ]
        ]);

    private zxingDecoder: any;

    public constructor(
        requestedFormats: Array<Html5QrcodeSupportedFormats>) {

        const hints = new Map();
        const formats = this.createZXingFormats(requestedFormats);
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

        this.zxingDecoder = new MultiFormatReader();
        this.zxingDecoder.setHints(hints);
    }

    decode(canvas: HTMLCanvasElement): QrcodeResult {
        const luminanceSource
            = new HTMLCanvasElementLuminanceSource(canvas);
        const binaryBitmap
            = new BinaryBitmap(
                new HybridBinarizer(luminanceSource));
        let result = this.zxingDecoder.decode(binaryBitmap);
        return {
            text: result.text
        };
    }

    private createZXingFormats(
        requestedFormats: Array<Html5QrcodeSupportedFormats>):
        Array<any> {
            let zxingFormats = [];
            for (let i = 0; i < requestedFormats.length; ++i) {
                if (ZXingHtml5QrcodeDecoder.formatMap.has(requestedFormats[i])) {
                    zxingFormats.push(
                        ZXingHtml5QrcodeDecoder.formatMap.get(
                            requestedFormats[i]));
                } else {
                    console.error(`${requestedFormats[i]} is not supported by`
                        + "ZXingHtml5QrcodeShim");
                }
            }
            return zxingFormats;
    }
}
