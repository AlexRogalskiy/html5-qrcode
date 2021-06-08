import { BaseLoggger, Html5QrcodeResultFactory, Html5QrcodeErrorFactory, Html5QrcodeSupportedFormats } from "./core";
import { Html5QrcodeStrings } from "./strings";
import { VideoConstraintsUtil } from "./utils";
import { Html5QrcodeShim } from "./code-decoder";
var InternalHtml5QrcodeConfig = (function () {
    function InternalHtml5QrcodeConfig(config, logger) {
        this.fps = config.fps == undefined
            ? Constants.SCAN_DEFAULT_FPS : config.fps;
        this.disableFlip = config.disableFlip === true;
        this.qrbox = config.qrbox;
        this.aspectRatio = config.aspectRatio;
        this.videoConstraints = config.videoConstraints;
        this.logger = logger;
    }
    InternalHtml5QrcodeConfig.prototype.isMediaStreamConstraintsValid = function () {
        if (!this.videoConstraints) {
            this.logger.logError("Empty videoConstraints", true);
            return false;
        }
        return VideoConstraintsUtil.isMediaStreamConstraintsValid(this.videoConstraints, this.logger);
    };
    InternalHtml5QrcodeConfig.prototype.isShadedBoxEnabled = function () {
        return this.qrbox != undefined;
    };
    InternalHtml5QrcodeConfig.create = function (config, logger) {
        return new InternalHtml5QrcodeConfig(config, logger);
    };
    return InternalHtml5QrcodeConfig;
}());
var Constants = (function () {
    function Constants() {
    }
    Constants.DEFAULT_WIDTH = 300;
    Constants.DEFAULT_WIDTH_OFFSET = 2;
    Constants.FILE_SCAN_MIN_HEIGHT = 300;
    Constants.SCAN_DEFAULT_FPS = 2;
    Constants.MIN_QR_BOX_SIZE = 50;
    Constants.SHADED_LEFT = 1;
    Constants.SHADED_RIGHT = 2;
    Constants.SHADED_TOP = 3;
    Constants.SHADED_BOTTOM = 4;
    Constants.SHADED_REGION_CLASSNAME = "qr-shaded-region";
    Constants.VERBOSE = false;
    Constants.BORDER_SHADER_DEFAULT_COLOR = "#ffffff";
    Constants.BORDER_SHADER_MATCH_COLOR = "rgb(90, 193, 56)";
    return Constants;
}());
var Html5Qrcode = (function () {
    function Html5Qrcode(elementId, verbose) {
        if (!document.getElementById(elementId)) {
            throw "HTML Element with id=" + elementId + " not found";
        }
        this.elementId = elementId;
        this.verbose = verbose === true;
        this.logger = new BaseLoggger(this.verbose);
        var requestedFormats = [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.AZTEC,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.MAXICODE,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.PDF_417,
            Html5QrcodeSupportedFormats.RSS_14,
            Html5QrcodeSupportedFormats.RSS_EXPANDED,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
        ];
        this.qrcode = new Html5QrcodeShim(requestedFormats);
        this.foreverScanTimeout;
        this.localMediaStream;
        this.shouldScan = true;
        this.isScanning = false;
    }
    Html5Qrcode.prototype.start = function (cameraIdOrConfig, configuration, qrCodeSuccessCallback, qrCodeErrorCallback) {
        if (!cameraIdOrConfig) {
            throw "cameraIdOrConfig is required";
        }
        if (!qrCodeSuccessCallback
            || typeof qrCodeSuccessCallback != "function") {
            throw "qrCodeSuccessCallback is required and should be a function.";
        }
        if (!qrCodeErrorCallback) {
            qrCodeErrorCallback = this.verbose ? console.log : function () { };
        }
        var internalConfig = InternalHtml5QrcodeConfig.create(configuration == undefined ? {} : configuration, this.logger);
        this.clearElement();
        var videoConstraintsAvailableAndValid = false;
        if (internalConfig.videoConstraints) {
            if (!internalConfig.isMediaStreamConstraintsValid()) {
                this.logger.logError("'videoConstraints' is not valid 'MediaStreamConstraints, "
                    + "it will be ignored.'", true);
            }
            else {
                videoConstraintsAvailableAndValid = true;
            }
        }
        var areVideoConstraintsEnabled = videoConstraintsAvailableAndValid;
        var isShadedBoxEnabled = internalConfig.isShadedBoxEnabled();
        var element = document.getElementById(this.elementId);
        var width = element.clientWidth
            ? element.clientWidth : Constants.DEFAULT_WIDTH;
        element.style.position = "relative";
        this.shouldScan = true;
        this.element = element;
        if (isShadedBoxEnabled) {
            var qrboxSize = internalConfig.qrbox;
            if (qrboxSize < Constants.MIN_QR_BOX_SIZE) {
                throw "minimum size of 'config.qrbox' is"
                    + (" " + Constants.MIN_QR_BOX_SIZE + "px.");
            }
            if (qrboxSize > width) {
                throw "'config.qrbox' should not be greater than the "
                    + "width of the HTML element.";
            }
        }
        var $this = this;
        return new Promise(function (resolve, reject) {
            var videoConstraints = areVideoConstraintsEnabled
                ? internalConfig.videoConstraints
                : $this.createVideoConstraints(cameraIdOrConfig);
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: videoConstraints
                }).then(function (stream) {
                    $this.onMediaStreamReceived(stream, internalConfig, areVideoConstraintsEnabled, width, qrCodeSuccessCallback, qrCodeErrorCallback)
                        .then(function (_) {
                        $this.isScanning = true;
                        resolve(null);
                    })
                        .catch(reject);
                })
                    .catch(function (error) {
                    reject(Html5QrcodeStrings.errorGettingUserMedia(error));
                });
            }
            else if (navigator.getUserMedia) {
                if (typeof cameraIdOrConfig != "string") {
                    throw Html5QrcodeStrings.onlyDeviceSupportedError();
                }
                var getCameraConfig = {
                    video: videoConstraints
                };
                navigator.getUserMedia(getCameraConfig, function (stream) {
                    $this.onMediaStreamReceived(stream, internalConfig, areVideoConstraintsEnabled, width, qrCodeSuccessCallback, qrCodeErrorCallback)
                        .then(function (_) {
                        $this.isScanning = true;
                        resolve(null);
                    })
                        .catch(function (error) {
                        reject(Html5QrcodeStrings.errorGettingUserMedia(error));
                    });
                }, function (error) {
                    reject(Html5QrcodeStrings.errorGettingUserMedia(error));
                });
            }
            else {
                reject(Html5QrcodeStrings.cameraStreamingNotSupported());
            }
        });
    };
    Html5Qrcode.prototype.stop = function () {
        var _this = this;
        this.shouldScan = false;
        if (this.foreverScanTimeout) {
            clearTimeout(this.foreverScanTimeout);
        }
        return new Promise(function (resolve, _) {
            var onAllTracksClosed = function () {
                _this.localMediaStream = undefined;
                if (_this.element) {
                    _this.element.removeChild(_this.videoElement);
                    _this.element.removeChild(_this.canvasElement);
                }
                removeQrRegion();
                _this.isScanning = false;
                if (_this.qrRegion) {
                    _this.qrRegion = undefined;
                }
                if (_this.context) {
                    _this.context = undefined;
                }
                resolve();
            };
            if (!_this.localMediaStream) {
                onAllTracksClosed();
            }
            var tracksToClose = _this.localMediaStream.getVideoTracks().length;
            var tracksClosed = 0;
            var removeQrRegion = function () {
                if (!_this.element) {
                    return;
                }
                while (_this.element.getElementsByClassName(Constants.SHADED_REGION_CLASSNAME).length) {
                    var shadedChild = _this.element.getElementsByClassName(Constants.SHADED_REGION_CLASSNAME)[0];
                    _this.element.removeChild(shadedChild);
                }
            };
            _this.localMediaStream.getVideoTracks().forEach(function (videoTrack) {
                _this.localMediaStream.removeTrack(videoTrack);
                videoTrack.stop();
                ++tracksClosed;
                if (tracksClosed >= tracksToClose) {
                    onAllTracksClosed();
                }
            });
        });
    };
    Html5Qrcode.prototype.scanFile = function (imageFile, showImage) {
        var _this = this;
        if (!imageFile || !(imageFile instanceof File)) {
            throw "imageFile argument is mandatory and should be instance "
                + "of File. Use 'event.target.files[0]'.";
        }
        if (showImage === undefined) {
            showImage = true;
        }
        if (this.isScanning) {
            throw "Close ongoing scan before scanning a file.";
        }
        return new Promise(function (resolve, reject) {
            _this.possiblyCloseLastScanImageFile();
            _this.clearElement();
            _this.lastScanImageFile = URL.createObjectURL(imageFile);
            var inputImage = new Image;
            inputImage.onload = function () {
                var imageWidth = inputImage.width;
                var imageHeight = inputImage.height;
                var element = document.getElementById(_this.elementId);
                var containerWidth = element.clientWidth
                    ? element.clientWidth : Constants.DEFAULT_WIDTH;
                var containerHeight = Math.max(element.clientHeight ? element.clientHeight : imageHeight, Constants.FILE_SCAN_MIN_HEIGHT);
                var config = _this.computeCanvasDrawConfig(imageWidth, imageHeight, containerWidth, containerHeight);
                if (showImage) {
                    var visibleCanvas = _this.createCanvasElement(containerWidth, containerHeight, 'qr-canvas-visible');
                    visibleCanvas.style.display = "inline-block";
                    element.appendChild(visibleCanvas);
                    var context_1 = visibleCanvas.getContext('2d');
                    if (!context_1) {
                        throw "Unable to get 2d context from canvas";
                    }
                    context_1.canvas.width = containerWidth;
                    context_1.canvas.height = containerHeight;
                    context_1.drawImage(inputImage, 0, 0, imageWidth, imageHeight, config.x, config.y, config.width, config.height);
                }
                var hiddenCanvas = _this.createCanvasElement(config.width, config.height);
                element.appendChild(hiddenCanvas);
                var context = hiddenCanvas.getContext('2d');
                if (!context) {
                    throw "Unable to get 2d context from canvas";
                }
                context.canvas.width = config.width;
                context.canvas.height = config.height;
                context.drawImage(inputImage, 0, 0, imageWidth, imageHeight, 0, 0, config.width, config.height);
                try {
                    var result = _this.qrcode.decode(hiddenCanvas);
                    resolve(result.text);
                }
                catch (exception) {
                    reject("QR code parse error, error = " + exception);
                }
            };
            inputImage.onerror = reject;
            inputImage.onabort = reject;
            inputImage.onstalled = reject;
            inputImage.onsuspend = reject;
            inputImage.src = URL.createObjectURL(imageFile);
        });
    };
    Html5Qrcode.prototype.clear = function () {
        this.clearElement();
    };
    Html5Qrcode.getCameras = function () {
        if (navigator.mediaDevices) {
            return Html5Qrcode.getCamerasFromMediaDevices();
        }
        var mst = MediaStreamTrack;
        if (MediaStreamTrack && mst.getSources) {
            return Html5Qrcode.getCamerasFrmoMediaStreamTrack();
        }
        var isHttpsOrLocalhost = function () {
            if (location.protocol === "https:") {
                return true;
            }
            var host = location.host.split(":")[0];
            return host === "127.0.0.1" || host === "localhost";
        };
        var errorMessage = Html5QrcodeStrings.unableToQuerySupportedDevices();
        if (!isHttpsOrLocalhost()) {
            errorMessage = Html5QrcodeStrings.insecureContextCameraQueryError();
        }
        return Promise.reject(errorMessage);
    };
    Html5Qrcode.prototype.getRunningTrackCapabilities = function () {
        if (this.localMediaStream == null) {
            throw "Scanning is not in running state, call this API only when"
                + " QR code scanning using camera is in running state.";
        }
        if (this.localMediaStream.getVideoTracks().length == 0) {
            throw "No video tracks found";
        }
        var videoTrack = this.localMediaStream.getVideoTracks()[0];
        return videoTrack.getCapabilities();
    };
    Html5Qrcode.prototype.applyVideoConstraints = function (videoConstaints) {
        var _this = this;
        if (!videoConstaints) {
            throw "videoConstaints is required argument.";
        }
        else if (!VideoConstraintsUtil.isMediaStreamConstraintsValid(videoConstaints, this.logger)) {
            throw "invalid videoConstaints passed, check logs for more details";
        }
        if (this.localMediaStream == null) {
            throw "Scanning is not in running state, call this API only when"
                + " QR code scanning using camera is in running state.";
        }
        if (this.localMediaStream.getVideoTracks().length == 0) {
            throw "No video tracks found";
        }
        return new Promise(function (resolve, reject) {
            if ("aspectRatio" in videoConstaints) {
                reject("Chaning 'aspectRatio' in run-time is not yet "
                    + "supported.");
                return;
            }
            var videoTrack = _this.localMediaStream.getVideoTracks()[0];
            videoTrack.applyConstraints(videoConstaints)
                .then(function (_) {
                resolve(_);
            })
                .catch(function (error) {
                reject(error);
            });
        });
    };
    Html5Qrcode.getCamerasFromMediaDevices = function () {
        return new Promise(function (resolve, reject) {
            navigator.mediaDevices.getUserMedia({ audio: false, video: true })
                .then(function (stream) {
                var closeActiveStreams = function (stream) {
                    var tracks = stream.getVideoTracks();
                    for (var i = 0; i < tracks.length; i++) {
                        var track = tracks[i];
                        track.enabled = false;
                        track.stop();
                        stream.removeTrack(track);
                    }
                };
                navigator.mediaDevices.enumerateDevices()
                    .then(function (devices) {
                    var results = [];
                    for (var i = 0; i < devices.length; i++) {
                        var device = devices[i];
                        if (device.kind == "videoinput") {
                            results.push({
                                id: device.deviceId,
                                label: device.label
                            });
                        }
                    }
                    closeActiveStreams(stream);
                    resolve(results);
                })
                    .catch(function (err) {
                    reject(err.name + " : " + err.message);
                });
            })
                .catch(function (err) {
                reject(err.name + " : " + err.message);
            });
        });
    };
    Html5Qrcode.getCamerasFrmoMediaStreamTrack = function () {
        return new Promise(function (resolve, _) {
            var callback = function (sourceInfos) {
                var results = [];
                for (var i = 0; i !== sourceInfos.length; ++i) {
                    var sourceInfo = sourceInfos[i];
                    if (sourceInfo.kind === 'video') {
                        results.push({
                            id: sourceInfo.id,
                            label: sourceInfo.label
                        });
                    }
                }
                resolve(results);
            };
            var mst = MediaStreamTrack;
            mst.getSources(callback);
        });
    };
    Html5Qrcode.prototype.setupUi = function (width, height, internalConfig) {
        var qrboxSize = internalConfig.qrbox;
        if (qrboxSize > height) {
            this.logger.warn("[Html5Qrcode] config.qrboxsize is greater "
                + "than video height. Shading will be ignored");
        }
        var shouldShadingBeApplied = internalConfig.isShadedBoxEnabled() && qrboxSize <= height;
        var defaultQrRegion = {
            x: 0,
            y: 0,
            width: width,
            height: height
        };
        var qrRegion = shouldShadingBeApplied
            ? this.getShadedRegionBounds(width, height, qrboxSize)
            : defaultQrRegion;
        var canvasElement = this.createCanvasElement(qrRegion.width, qrRegion.height);
        var context = canvasElement.getContext('2d');
        context.canvas.width = qrRegion.width;
        context.canvas.height = qrRegion.height;
        this.element.append(canvasElement);
        if (shouldShadingBeApplied) {
            this.possiblyInsertShadingElement(this.element, width, height, qrboxSize);
        }
        this.qrRegion = qrRegion;
        this.context = context;
        this.canvasElement = canvasElement;
    };
    Html5Qrcode.prototype.scanContext = function (qrCodeSuccessCallback, qrCodeErrorCallback) {
        try {
            var result = this.qrcode.decode(this.canvasElement);
            qrCodeSuccessCallback(result.text, Html5QrcodeResultFactory.createFrom(result.text));
            this.possiblyUpdateShaders(true);
            return true;
        }
        catch (exception) {
            this.possiblyUpdateShaders(false);
            var errorMessage = Html5QrcodeStrings.codeParseError(exception);
            qrCodeErrorCallback(errorMessage, Html5QrcodeErrorFactory.createFrom(errorMessage));
            return false;
        }
    };
    Html5Qrcode.prototype.foreverScan = function (internalConfig, qrCodeSuccessCallback, qrCodeErrorCallback) {
        var _this = this;
        if (!this.shouldScan) {
            return;
        }
        if (this.localMediaStream) {
            var videoElement = this.videoElement;
            var widthRatio = videoElement.videoWidth / videoElement.clientWidth;
            var heightRatio = videoElement.videoHeight / videoElement.clientHeight;
            if (!this.qrRegion) {
                throw "qrRegion undefined when localMediaStream is ready.";
            }
            var sWidthOffset = this.qrRegion.width * widthRatio;
            var sHeightOffset = this.qrRegion.height * heightRatio;
            var sxOffset = this.qrRegion.x * widthRatio;
            var syOffset = this.qrRegion.y * heightRatio;
            this.context.drawImage(videoElement, sxOffset, syOffset, sWidthOffset, sHeightOffset, 0, 0, this.qrRegion.width, this.qrRegion.height);
            if (!this.scanContext(qrCodeSuccessCallback, qrCodeErrorCallback)
                && internalConfig.disableFlip !== true) {
                this.context.translate(this.context.canvas.width, 0);
                this.context.scale(-1, 1);
                this.scanContext(qrCodeSuccessCallback, qrCodeErrorCallback);
            }
        }
        this.foreverScanTimeout = setTimeout(function () {
            _this.foreverScan(internalConfig, qrCodeSuccessCallback, qrCodeErrorCallback);
        }, this.getTimeoutFps(internalConfig.fps));
    };
    Html5Qrcode.prototype.onMediaStreamReceived = function (mediaStream, internalConfig, areVideoConstraintsEnabled, clientWidth, qrCodeSuccessCallback, qrCodeErrorCallback) {
        var _this = this;
        var $this = this;
        return new Promise(function (resolve, reject) {
            var setupVideo = function () {
                var videoElement = _this.createVideoElement(clientWidth);
                $this.element.append(videoElement);
                videoElement.onabort = reject;
                videoElement.onerror = reject;
                videoElement.onplaying = function () {
                    var videoWidth = videoElement.clientWidth;
                    var videoHeight = videoElement.clientHeight;
                    $this.setupUi(videoWidth, videoHeight, internalConfig);
                    $this.foreverScan(internalConfig, qrCodeSuccessCallback, qrCodeErrorCallback);
                    resolve(null);
                };
                videoElement.srcObject = mediaStream;
                videoElement.play();
                $this.videoElement = videoElement;
            };
            $this.localMediaStream = mediaStream;
            if (areVideoConstraintsEnabled || !internalConfig.aspectRatio) {
                setupVideo();
            }
            else {
                var constraints = {
                    aspectRatio: internalConfig.aspectRatio
                };
                var track = mediaStream.getVideoTracks()[0];
                track.applyConstraints(constraints)
                    .then(function (_) { return setupVideo(); })
                    .catch(function (error) {
                    $this.logger.logErrors(["[Html5Qrcode] Constriants could not "
                            + "be satisfied, ignoring constraints",
                        error]);
                    setupVideo();
                });
            }
        });
    };
    Html5Qrcode.prototype.createVideoConstraints = function (cameraIdOrConfig) {
        if (typeof cameraIdOrConfig == "string") {
            return { deviceId: { exact: cameraIdOrConfig } };
        }
        else if (typeof cameraIdOrConfig == "object") {
            var facingModeKey = "facingMode";
            var deviceIdKey = "deviceId";
            var allowedFacingModeValues_1 = { "user": true, "environment": true };
            var exactKey = "exact";
            var isValidFacingModeValue = function (value) {
                if (value in allowedFacingModeValues_1) {
                    return true;
                }
                else {
                    throw "config has invalid 'facingMode' value = "
                        + ("'" + value + "'");
                }
            };
            var keys = Object.keys(cameraIdOrConfig);
            if (keys.length != 1) {
                throw "'cameraIdOrConfig' object should have exactly 1 key,"
                    + (" if passed as an object, found " + keys.length + " keys");
            }
            var key = Object.keys(cameraIdOrConfig)[0];
            if (key != facingModeKey && key != deviceIdKey) {
                throw "Only '" + facingModeKey + "' and '" + deviceIdKey + "' "
                    + " are supported for 'cameraIdOrConfig'";
            }
            if (key == facingModeKey) {
                var facingMode = cameraIdOrConfig.facingMode;
                if (typeof facingMode == "string") {
                    if (isValidFacingModeValue(facingMode)) {
                        return { facingMode: facingMode };
                    }
                }
                else if (typeof facingMode == "object") {
                    if (exactKey in facingMode) {
                        if (isValidFacingModeValue(facingMode[exactKey])) {
                            return {
                                facingMode: {
                                    exact: facingMode[exactKey]
                                }
                            };
                        }
                    }
                    else {
                        throw "'facingMode' should be string or object with"
                            + (" " + exactKey + " as key.");
                    }
                }
                else {
                    var type_1 = (typeof facingMode);
                    throw "Invalid type of 'facingMode' = " + type_1;
                }
            }
            else {
                var deviceId = cameraIdOrConfig[key];
                if (typeof deviceId == "string") {
                    return { deviceId: deviceId };
                }
                else if (typeof deviceId == "object") {
                    if (exactKey in deviceId) {
                        return {
                            deviceId: { exact: deviceId[exactKey] }
                        };
                    }
                    else {
                        throw "'deviceId' should be string or object with"
                            + (" " + exactKey + " as key.");
                    }
                }
                else {
                    var type_2 = (typeof deviceId);
                    throw "Invalid type of 'deviceId' = " + type_2;
                }
            }
        }
        var type = (typeof cameraIdOrConfig);
        throw "Invalid type of 'cameraIdOrConfig' = " + type;
    };
    Html5Qrcode.prototype.computeCanvasDrawConfig = function (imageWidth, imageHeight, containerWidth, containerHeight) {
        if (imageWidth <= containerWidth
            && imageHeight <= containerHeight) {
            var xoffset = (containerWidth - imageWidth) / 2;
            var yoffset = (containerHeight - imageHeight) / 2;
            return {
                x: xoffset,
                y: yoffset,
                width: imageWidth,
                height: imageHeight
            };
        }
        else {
            var formerImageWidth = imageWidth;
            var formerImageHeight = imageHeight;
            if (imageWidth > containerWidth) {
                imageHeight = (containerWidth / imageWidth) * imageHeight;
                imageWidth = containerWidth;
            }
            if (imageHeight > containerHeight) {
                imageWidth = (containerHeight / imageHeight) * imageWidth;
                imageHeight = containerHeight;
            }
            this.logger.log("Image downsampled from "
                + (formerImageWidth + "X" + formerImageHeight)
                + (" to " + imageWidth + "X" + imageHeight + "."));
            return this.computeCanvasDrawConfig(imageWidth, imageHeight, containerWidth, containerHeight);
        }
    };
    Html5Qrcode.prototype.clearElement = function () {
        if (this.isScanning) {
            throw 'Cannot clear while scan is ongoing, close it first.';
        }
        var element = document.getElementById(this.elementId);
        if (element) {
            element.innerHTML = "";
        }
    };
    Html5Qrcode.prototype.createVideoElement = function (width) {
        var videoElement = document.createElement('video');
        videoElement.style.width = width + "px";
        videoElement.muted = true;
        videoElement.setAttribute("muted", "true");
        videoElement.playsInline = true;
        return videoElement;
    };
    Html5Qrcode.prototype.possiblyUpdateShaders = function (qrMatch) {
        if (this.qrMatch === qrMatch) {
            return;
        }
        if (this.hasBorderShaders
            && this.borderShaders
            && this.borderShaders.length) {
            this.borderShaders.forEach(function (shader) {
                shader.style.backgroundColor = qrMatch
                    ? Constants.BORDER_SHADER_MATCH_COLOR
                    : Constants.BORDER_SHADER_DEFAULT_COLOR;
            });
        }
        this.qrMatch = qrMatch;
    };
    Html5Qrcode.prototype.possiblyCloseLastScanImageFile = function () {
        if (this.lastScanImageFile) {
            URL.revokeObjectURL(this.lastScanImageFile);
            this.lastScanImageFile = undefined;
        }
    };
    Html5Qrcode.prototype.createCanvasElement = function (width, height, customId) {
        var canvasWidth = width;
        var canvasHeight = height;
        var canvasElement = document.createElement('canvas');
        canvasElement.style.width = canvasWidth + "px";
        canvasElement.style.height = canvasHeight + "px";
        canvasElement.style.display = "none";
        canvasElement.id = customId == undefined ? 'qr-canvas' : customId;
        return canvasElement;
    };
    Html5Qrcode.prototype.getShadedRegionBounds = function (width, height, qrboxSize) {
        if (qrboxSize > width || qrboxSize > height) {
            throw "'config.qrbox' should not be greater than the "
                + "width and height of the HTML element.";
        }
        return {
            x: (width - qrboxSize) / 2,
            y: (height - qrboxSize) / 2,
            width: qrboxSize,
            height: qrboxSize
        };
    };
    Html5Qrcode.prototype.possiblyInsertShadingElement = function (element, width, height, qrboxSize) {
        if ((width - qrboxSize) < 1 || (height - qrboxSize) < 1) {
            return;
        }
        var shadingElement = document.createElement('div');
        shadingElement.style.position = "absolute";
        shadingElement.style.borderLeft
            = (width - qrboxSize) / 2 + "px solid #0000007a";
        shadingElement.style.borderRight
            = (width - qrboxSize) / 2 + "px solid #0000007a";
        shadingElement.style.borderTop
            = (height - qrboxSize) / 2 + "px solid #0000007a";
        shadingElement.style.borderBottom
            = (height - qrboxSize) / 2 + "px solid #0000007a";
        shadingElement.style.boxSizing = "border-box";
        shadingElement.style.top = "0px";
        shadingElement.style.bottom = "0px";
        shadingElement.style.left = "0px";
        shadingElement.style.right = "0px";
        shadingElement.id = "" + Constants.SHADED_REGION_CLASSNAME;
        if ((width - qrboxSize) < 11 || (height - qrboxSize) < 11) {
            this.hasBorderShaders = false;
        }
        else {
            var smallSize = 5;
            var largeSize = 40;
            this.insertShaderBorders(shadingElement, largeSize, smallSize, -smallSize, 0, true);
            this.insertShaderBorders(shadingElement, largeSize, smallSize, -smallSize, 0, false);
            this.insertShaderBorders(shadingElement, largeSize, smallSize, qrboxSize + smallSize, 0, true);
            this.insertShaderBorders(shadingElement, largeSize, smallSize, qrboxSize + smallSize, 0, false);
            this.insertShaderBorders(shadingElement, smallSize, largeSize + smallSize, -smallSize, -smallSize, true);
            this.insertShaderBorders(shadingElement, smallSize, largeSize + smallSize, qrboxSize + smallSize - largeSize, -smallSize, true);
            this.insertShaderBorders(shadingElement, smallSize, largeSize + smallSize, -smallSize, -smallSize, false);
            this.insertShaderBorders(shadingElement, smallSize, largeSize + smallSize, qrboxSize + smallSize - largeSize, -smallSize, false);
            this.hasBorderShaders = true;
        }
        element.append(shadingElement);
    };
    Html5Qrcode.prototype.insertShaderBorders = function (shaderElem, width, height, top, side, isLeft) {
        var elem = document.createElement("div");
        elem.style.position = "absolute";
        elem.style.backgroundColor = Constants.BORDER_SHADER_DEFAULT_COLOR;
        elem.style.width = width + "px";
        elem.style.height = height + "px";
        elem.style.top = top + "px";
        if (isLeft) {
            elem.style.left = side + "px";
        }
        else {
            elem.style.right = side + "px";
        }
        if (!this.borderShaders) {
            this.borderShaders = [];
        }
        this.borderShaders.push(elem);
        shaderElem.appendChild(elem);
    };
    Html5Qrcode.prototype.getTimeoutFps = function (fps) {
        return 1000 / fps;
    };
    return Html5Qrcode;
}());
export { Html5Qrcode };
//# sourceMappingURL=html5-qrcode.js.map