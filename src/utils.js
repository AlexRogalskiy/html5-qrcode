var VideoConstraintsUtil = (function () {
    function VideoConstraintsUtil() {
    }
    VideoConstraintsUtil.isMediaStreamConstraintsValid = function (videoConstraints, logger) {
        if (typeof videoConstraints !== "object") {
            var typeofVideoConstraints = typeof videoConstraints;
            logger.logError("videoConstraints should be of type object, the "
                + ("object passed is of type " + typeofVideoConstraints + "."), true);
            return false;
        }
        var bannedKeys = [
            "autoGainControl",
            "channelCount",
            "echoCancellation",
            "latency",
            "noiseSuppression",
            "sampleRate",
            "sampleSize",
            "volume"
        ];
        var bannedkeysSet = new Set(bannedKeys);
        var keysInVideoConstraints = Object.keys(videoConstraints);
        for (var i = 0; i < keysInVideoConstraints.length; i++) {
            var key = keysInVideoConstraints[i];
            if (bannedkeysSet.has(key)) {
                logger.logError(key + " is not supported videoConstaints.", true);
                return false;
            }
        }
        return true;
    };
    return VideoConstraintsUtil;
}());
export { VideoConstraintsUtil };
//# sourceMappingURL=utils.js.map