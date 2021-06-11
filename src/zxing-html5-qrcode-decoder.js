import { Html5QrcodeSupportedFormats } from "./core";
import { MultiFormatReader, BarcodeFormat, DecodeHintType, HTMLCanvasElementLuminanceSource, BinaryBitmap, HybridBinarizer } from '@zxing/library';
var ZXingHtml5QrcodeDecoder = (function () {
    function ZXingHtml5QrcodeDecoder(requestedFormats) {
        var hints = new Map();
        var formats = this.createZXingFormats(requestedFormats);
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        hints.set(DecodeHintType.TRY_HARDER, true);
        this.zxingDecoder = new MultiFormatReader();
        this.zxingDecoder.setHints(hints);
    }
    ZXingHtml5QrcodeDecoder.prototype.decode = function (canvas) {
        var luminanceSource = new HTMLCanvasElementLuminanceSource(canvas);
        var binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
        var result = this.zxingDecoder.decode(binaryBitmap);
        return {
            text: result.text
        };
    };
    ZXingHtml5QrcodeDecoder.prototype.createZXingFormats = function (requestedFormats) {
        var zxingFormats = [];
        for (var i = 0; i < requestedFormats.length; ++i) {
            if (ZXingHtml5QrcodeDecoder.formatMap.has(requestedFormats[i])) {
                zxingFormats.push(ZXingHtml5QrcodeDecoder.formatMap.get(requestedFormats[i]));
            }
            else {
                console.error(requestedFormats[i] + " is not supported by"
                    + "ZXingHtml5QrcodeShim");
            }
        }
        return zxingFormats;
    };
    ZXingHtml5QrcodeDecoder.formatMap = new Map([
        [Html5QrcodeSupportedFormats.QR_CODE, BarcodeFormat.QR_CODE],
        [Html5QrcodeSupportedFormats.AZTEC, BarcodeFormat.AZTEC],
        [Html5QrcodeSupportedFormats.CODABAR, BarcodeFormat.CODABAR],
        [Html5QrcodeSupportedFormats.CODE_39, BarcodeFormat.CODE_39],
        [Html5QrcodeSupportedFormats.CODE_93, BarcodeFormat.CODE_93],
        [
            Html5QrcodeSupportedFormats.CODE_128,
            BarcodeFormat.CODE_128
        ],
        [
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            BarcodeFormat.DATA_MATRIX
        ],
        [
            Html5QrcodeSupportedFormats.MAXICODE,
            BarcodeFormat.MAXICODE
        ],
        [Html5QrcodeSupportedFormats.ITF, BarcodeFormat.ITF],
        [Html5QrcodeSupportedFormats.EAN_13, BarcodeFormat.EAN_13],
        [Html5QrcodeSupportedFormats.EAN_8, BarcodeFormat.EAN_8],
        [Html5QrcodeSupportedFormats.PDF_417, BarcodeFormat.PDF_417],
        [Html5QrcodeSupportedFormats.RSS_14, BarcodeFormat.RSS_14],
        [
            Html5QrcodeSupportedFormats.RSS_EXPANDED,
            BarcodeFormat.RSS_EXPANDED
        ],
        [Html5QrcodeSupportedFormats.UPC_A, BarcodeFormat.UPC_A],
        [Html5QrcodeSupportedFormats.UPC_E, BarcodeFormat.UPC_E],
        [
            Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
            BarcodeFormat.UPC_EAN_EXTENSION
        ]
    ]);
    return ZXingHtml5QrcodeDecoder;
}());
export { ZXingHtml5QrcodeDecoder };
//# sourceMappingURL=zxing-html5-qrcode-decoder.js.map