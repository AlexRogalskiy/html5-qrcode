import { ZXingHtml5QrcodeDecoder } from "./zxing-html5-qrcode-decoder";
var Html5QrcodeShim = (function () {
    function Html5QrcodeShim(requestedFormats) {
        this.zxingDecorderDelegate = new ZXingHtml5QrcodeDecoder(requestedFormats);
    }
    Html5QrcodeShim.prototype.decode = function (canvas) {
        return this.zxingDecorderDelegate.decode(canvas);
    };
    return Html5QrcodeShim;
}());
export { Html5QrcodeShim };
//# sourceMappingURL=code-decoder.js.map