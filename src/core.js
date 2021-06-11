export var Html5QrcodeSupportedFormats;
(function (Html5QrcodeSupportedFormats) {
    Html5QrcodeSupportedFormats[Html5QrcodeSupportedFormats["QR_CODE"] = 0] = "QR_CODE";
})(Html5QrcodeSupportedFormats || (Html5QrcodeSupportedFormats = {}));
export var Html5QrcodeScanType;
(function (Html5QrcodeScanType) {
    Html5QrcodeScanType[Html5QrcodeScanType["SCAN_TYPE_CAMERA"] = 0] = "SCAN_TYPE_CAMERA";
    Html5QrcodeScanType[Html5QrcodeScanType["SCAN_TYPE_FILE"] = 1] = "SCAN_TYPE_FILE";
})(Html5QrcodeScanType || (Html5QrcodeScanType = {}));
var Html5QrcodeConstants = (function () {
    function Html5QrcodeConstants() {
    }
    Html5QrcodeConstants.ASSET_FILE_SCAN = "https://raw.githubusercontent.com/mebjas/html5-qrcode/master/assets"
        + "/file-scan.gif";
    Html5QrcodeConstants.ASSET_CAMERA_SCAN = "https://raw.githubusercontent.com/mebjas/html5-qrcode/master/assets"
        + "/camera-scan.gif";
    Html5QrcodeConstants.GITHUB_PROJECT_URL = "https://github.com/mebjas/html5-qrcode";
    return Html5QrcodeConstants;
}());
export { Html5QrcodeConstants };
var Html5QrcodeResultFactory = (function () {
    function Html5QrcodeResultFactory() {
    }
    Html5QrcodeResultFactory.createFrom = function (decodedText) {
        var qrcodeResult = {
            text: decodedText
        };
        return {
            decodedText: decodedText,
            fullResult: qrcodeResult
        };
    };
    return Html5QrcodeResultFactory;
}());
export { Html5QrcodeResultFactory };
export var Html5QrcodeErrorTypes;
(function (Html5QrcodeErrorTypes) {
    Html5QrcodeErrorTypes[Html5QrcodeErrorTypes["UNKWOWN_ERROR"] = 0] = "UNKWOWN_ERROR";
    Html5QrcodeErrorTypes[Html5QrcodeErrorTypes["IMPLEMENTATION_ERROR"] = 1] = "IMPLEMENTATION_ERROR";
    Html5QrcodeErrorTypes[Html5QrcodeErrorTypes["NO_CODE_FOUND_ERROR"] = 2] = "NO_CODE_FOUND_ERROR";
})(Html5QrcodeErrorTypes || (Html5QrcodeErrorTypes = {}));
var Html5QrcodeErrorFactory = (function () {
    function Html5QrcodeErrorFactory() {
    }
    Html5QrcodeErrorFactory.createFrom = function (error) {
        return {
            errorMessage: error,
            type: Html5QrcodeErrorTypes.UNKWOWN_ERROR
        };
    };
    return Html5QrcodeErrorFactory;
}());
export { Html5QrcodeErrorFactory };
var BaseLoggger = (function () {
    function BaseLoggger(verbose) {
        this.verbose = verbose;
    }
    BaseLoggger.prototype.log = function (message) {
        if (this.verbose) {
            console.log(message);
        }
    };
    BaseLoggger.prototype.warn = function (message) {
        if (this.verbose) {
            console.warn(message);
        }
    };
    BaseLoggger.prototype.logError = function (message, isExperimental) {
        if (this.verbose || isExperimental === true) {
            console.error(message);
        }
    };
    BaseLoggger.prototype.logErrors = function (errors) {
        if (errors.length == 0) {
            throw "Logger#logError called without arguments";
        }
        if (this.verbose) {
            console.error(errors);
        }
    };
    return BaseLoggger;
}());
export { BaseLoggger };
//# sourceMappingURL=core.js.map