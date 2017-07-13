(function() {
    'use strict';

    /**
     * Convert an <code>ArrayBuffer</code> to a <code>Blob</code>. Returns a Promise.
     *
     * @param {ArrayBuffer} buffer
     * @param {string|undefined} type - the content type (optional)
     * @returns {Promise} Promise that resolves with the <code>Blob</code>
     */
    function arrayBufferToBlob(buffer, type) {
        return Promise.resolve().then(function() {
            return createBlob([buffer], type);
        });
    }

    /**
     * Convert a <code>Blob</code> to a binary string. Returns a Promise.
     * @param {Blob} blob
     * @returns {Promise} Promise that resolves with the binary string
     */
    function blobToBase64String(blob) {
        return blobToBinaryString(blob).then(function(binary) {
            return btoa(binary);
        });
    }

    function binaryStringToArrayBuffer(binary) {
        var length = binary.length;
        var buf = new ArrayBuffer(length);
        var arr = new Uint8Array(buf);
        var i = -1;
        while (++i < length) {
            arr[i] = binary.charCodeAt(i);
        }
        return buf;
    }

    /**
     * Convert a <code>Blob</code> to a binary string. Returns a Promise.
     *
     * @param {Blob} blob
     * @returns {Promise} Promise that resolves with the binary string
     */
    function blobToBinaryString(blob) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            var hasBinaryString = typeof reader.readAsBinaryString === 'function';
            reader.onloadend = function(e) {
                var result = e.target.result || '';
                if (hasBinaryString) {
                    return resolve(result);
                }
                resolve(arrayBufferToBinaryString(result));
            };
            reader.onerror = reject;
            if (hasBinaryString) {
                reader.readAsBinaryString(blob);
            } else {
                reader.readAsArrayBuffer(blob);
            }
        });
    }

    function base64StringToBlob(base64, type) {
        return Promise.resolve().then(function() {
            var parts = [binaryStringToArrayBuffer(atob(base64))];
            return type ? createBlob(parts, { type: type }) : createBlob(parts);
        });
    }

    /**
     * Convert a <code>Blob</code> to an <code>ArrayBuffer</code>. Returns a Promise.
     * @param {Blob} blob
     * @returns {Promise} Promise that resolves with the <code>ArrayBuffer</code>
     */
    function blobToArrayBuffer(blob) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onloadend = function(e) {
                var result = e.target.result || new ArrayBuffer(0);
                resolve(result);
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(blob);
        });
    }

    /**
     * Shim for
     * [new Blob()]{@link https://developer.mozilla.org/en-US/docs/Web/API/Blob.Blob}
     * to support
     * [older browsers that use the deprecated <code>BlobBuilder</code> API]{@link http://caniuse.com/blob}.
     *
     * @param {Array} parts - content of the <code>Blob</code>
     * @param {Object} options - usually just <code>{type: myContentType}</code>
     * @returns {Blob}
     */
    function createBlob(parts, options) {
        options = options || {};
        if (typeof options === 'string') {
            options = { type: options }; // do you a solid here
        }
        return new Blob(parts, options);
    }

    (function(f) {
        if (typeof exports === "object" && typeof module !== "undefined") { module.exports = f() } else if (typeof define === "function" && define.amd) { define([], f) } else {
            var g;
            if (typeof window !== "undefined") { g = window } else if (typeof global !== "undefined") { g = global } else if (typeof self !== "undefined") { g = self } else { g = this }
            g.blobUtil = f()
        }
    })(function() {
        var define, module, exports;
        return (function e(t, n, r) {
            function s(o, u) {
                if (!n[o]) {
                    if (!t[o]) { var a = typeof require == "function" && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error("Cannot find module '" + o + "'"); throw f.code = "MODULE_NOT_FOUND", f }
                    var l = n[o] = { exports: {} };
                    t[o][0].call(l.exports, function(e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r)
                }
                return n[o].exports
            }
            var i = typeof require == "function" && require;
            for (var o = 0; o < r.length; o++) s(r[o]);
            return s
        })({
            1: [function(_dereq_, module, exports) {
                (function(global) {
                    /**
                     * Create a blob builder even when vendor prefixes exist
                     */

                    var BlobBuilder = global.BlobBuilder ||
                        global.WebKitBlobBuilder ||
                        global.MSBlobBuilder ||
                        global.MozBlobBuilder;

                    /**
                     * Check if Blob constructor is supported
                     */

                    var blobSupported = (function() {
                        try {
                            var a = new Blob(['hi']);
                            return a.size === 2;
                        } catch (e) {
                            return false;
                        }
                    })();

                    /**
                     * Check if Blob constructor supports ArrayBufferViews
                     * Fails in Safari 6, so we need to map to ArrayBuffers there.
                     */

                    var blobSupportsArrayBufferView = blobSupported && (function() {
                        try {
                            var b = new Blob([new Uint8Array([1, 2])]);
                            return b.size === 2;
                        } catch (e) {
                            return false;
                        }
                    })();

                    /**
                     * Check if BlobBuilder is supported
                     */

                    var blobBuilderSupported = BlobBuilder &&
                        BlobBuilder.prototype.append &&
                        BlobBuilder.prototype.getBlob;

                    /**
                     * Helper function that maps ArrayBufferViews to ArrayBuffers
                     * Used by BlobBuilder constructor and old browsers that didn't
                     * support it in the Blob constructor.
                     */

                    function mapArrayBufferViews(ary) {
                        for (var i = 0; i < ary.length; i++) {
                            var chunk = ary[i];
                            if (chunk.buffer instanceof ArrayBuffer) {
                                var buf = chunk.buffer;

                                // if this is a subarray, make a copy so we only
                                // include the subarray region from the underlying buffer
                                if (chunk.byteLength !== buf.byteLength) {
                                    var copy = new Uint8Array(chunk.byteLength);
                                    copy.set(new Uint8Array(buf, chunk.byteOffset, chunk.byteLength));
                                    buf = copy.buffer;
                                }

                                ary[i] = buf;
                            }
                        }
                    }

                    function BlobBuilderConstructor(ary, options) {
                        options = options || {};

                        var bb = new BlobBuilder();
                        mapArrayBufferViews(ary);

                        for (var i = 0; i < ary.length; i++) {
                            bb.append(ary[i]);
                        }

                        return (options.type) ? bb.getBlob(options.type) : bb.getBlob();
                    };

                    function BlobConstructor(ary, options) {
                        mapArrayBufferViews(ary);
                        return new Blob(ary, options || {});
                    };

                    module.exports = (function() {
                        if (blobSupported) {
                            return blobSupportsArrayBufferView ? global.Blob : BlobConstructor;
                        } else if (blobBuilderSupported) {
                            return BlobBuilderConstructor;
                        } else {
                            return undefined;
                        }
                    })();

                }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
            }, {}],
            2: [function(_dereq_, module, exports) {
                (function(global) {
                    'use strict';
                    var Mutation = global.MutationObserver || global.WebKitMutationObserver;

                    var scheduleDrain;

                    {
                        if (Mutation) {
                            var called = 0;
                            var observer = new Mutation(nextTick);
                            var element = global.document.createTextNode('');
                            observer.observe(element, {
                                characterData: true
                            });
                            scheduleDrain = function() {
                                element.data = (called = ++called % 2);
                            };
                        } else if (!global.setImmediate && typeof global.MessageChannel !== 'undefined') {
                            var channel = new global.MessageChannel();
                            channel.port1.onmessage = nextTick;
                            scheduleDrain = function() {
                                channel.port2.postMessage(0);
                            };
                        } else if ('document' in global && 'onreadystatechange' in global.document.createElement('script')) {
                            scheduleDrain = function() {

                                // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
                                // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
                                var scriptEl = global.document.createElement('script');
                                scriptEl.onreadystatechange = function() {
                                    nextTick();

                                    scriptEl.onreadystatechange = null;
                                    scriptEl.parentNode.removeChild(scriptEl);
                                    scriptEl = null;
                                };
                                global.document.documentElement.appendChild(scriptEl);
                            };
                        } else {
                            scheduleDrain = function() {
                                setTimeout(nextTick, 0);
                            };
                        }
                    }

                    var draining;
                    var queue = [];
                    //named nextTick for less confusing stack traces
                    function nextTick() {
                        draining = true;
                        var i, oldQueue;
                        var len = queue.length;
                        while (len) {
                            oldQueue = queue;
                            queue = [];
                            i = -1;
                            while (++i < len) {
                                oldQueue[i]();
                            }
                            len = queue.length;
                        }
                        draining = false;
                    }

                    module.exports = immediate;

                    function immediate(task) {
                        if (queue.push(task) === 1 && !draining) {
                            scheduleDrain();
                        }
                    }

                }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
            }, {}],
            3: [function(_dereq_, module, exports) {
                'use strict';
                var immediate = _dereq_(2);

                /* istanbul ignore next */
                function INTERNAL() {}

                var handlers = {};

                var REJECTED = ['REJECTED'];
                var FULFILLED = ['FULFILLED'];
                var PENDING = ['PENDING'];

                module.exports = exports = Promise;

                function Promise(resolver) {
                    if (typeof resolver !== 'function') {
                        throw new TypeError('resolver must be a function');
                    }
                    this.state = PENDING;
                    this.queue = [];
                    this.outcome = void 0;
                    if (resolver !== INTERNAL) {
                        safelyResolveThenable(this, resolver);
                    }
                }

                Promise.prototype["catch"] = function(onRejected) {
                    return this.then(null, onRejected);
                };
                Promise.prototype.then = function(onFulfilled, onRejected) {
                    if (typeof onFulfilled !== 'function' && this.state === FULFILLED ||
                        typeof onRejected !== 'function' && this.state === REJECTED) {
                        return this;
                    }
                    var promise = new this.constructor(INTERNAL);
                    if (this.state !== PENDING) {
                        var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
                        unwrap(promise, resolver, this.outcome);
                    } else {
                        this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
                    }

                    return promise;
                };

                function QueueItem(promise, onFulfilled, onRejected) {
                    this.promise = promise;
                    if (typeof onFulfilled === 'function') {
                        this.onFulfilled = onFulfilled;
                        this.callFulfilled = this.otherCallFulfilled;
                    }
                    if (typeof onRejected === 'function') {
                        this.onRejected = onRejected;
                        this.callRejected = this.otherCallRejected;
                    }
                }
                QueueItem.prototype.callFulfilled = function(value) {
                    handlers.resolve(this.promise, value);
                };
                QueueItem.prototype.otherCallFulfilled = function(value) {
                    unwrap(this.promise, this.onFulfilled, value);
                };
                QueueItem.prototype.callRejected = function(value) {
                    handlers.reject(this.promise, value);
                };
                QueueItem.prototype.otherCallRejected = function(value) {
                    unwrap(this.promise, this.onRejected, value);
                };

                function unwrap(promise, func, value) {
                    immediate(function() {
                        var returnValue;
                        try {
                            returnValue = func(value);
                        } catch (e) {
                            return handlers.reject(promise, e);
                        }
                        if (returnValue === promise) {
                            handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
                        } else {
                            handlers.resolve(promise, returnValue);
                        }
                    });
                }

                handlers.resolve = function(self, value) {
                    var result = tryCatch(getThen, value);
                    if (result.status === 'error') {
                        return handlers.reject(self, result.value);
                    }
                    var thenable = result.value;

                    if (thenable) {
                        safelyResolveThenable(self, thenable);
                    } else {
                        self.state = FULFILLED;
                        self.outcome = value;
                        var i = -1;
                        var len = self.queue.length;
                        while (++i < len) {
                            self.queue[i].callFulfilled(value);
                        }
                    }
                    return self;
                };
                handlers.reject = function(self, error) {
                    self.state = REJECTED;
                    self.outcome = error;
                    var i = -1;
                    var len = self.queue.length;
                    while (++i < len) {
                        self.queue[i].callRejected(error);
                    }
                    return self;
                };

                function getThen(obj) {
                    // Make sure we only access the accessor once as required by the spec
                    var then = obj && obj.then;
                    if (obj && typeof obj === 'object' && typeof then === 'function') {
                        return function appyThen() {
                            then.apply(obj, arguments);
                        };
                    }
                }

                function safelyResolveThenable(self, thenable) {
                    // Either fulfill, reject or reject with error
                    var called = false;

                    function onError(value) {
                        if (called) {
                            return;
                        }
                        called = true;
                        handlers.reject(self, value);
                    }

                    function onSuccess(value) {
                        if (called) {
                            return;
                        }
                        called = true;
                        handlers.resolve(self, value);
                    }

                    function tryToUnwrap() {
                        thenable(onSuccess, onError);
                    }

                    var result = tryCatch(tryToUnwrap);
                    if (result.status === 'error') {
                        onError(result.value);
                    }
                }

                function tryCatch(func, value) {
                    var out = {};
                    try {
                        out.value = func(value);
                        out.status = 'success';
                    } catch (e) {
                        out.status = 'error';
                        out.value = e;
                    }
                    return out;
                }

                exports.resolve = resolve;

                function resolve(value) {
                    if (value instanceof this) {
                        return value;
                    }
                    return handlers.resolve(new this(INTERNAL), value);
                }

                exports.reject = reject;

                function reject(reason) {
                    var promise = new this(INTERNAL);
                    return handlers.reject(promise, reason);
                }

                exports.all = all;

                function all(iterable) {
                    var self = this;
                    if (Object.prototype.toString.call(iterable) !== '[object Array]') {
                        return this.reject(new TypeError('must be an array'));
                    }

                    var len = iterable.length;
                    var called = false;
                    if (!len) {
                        return this.resolve([]);
                    }

                    var values = new Array(len);
                    var resolved = 0;
                    var i = -1;
                    var promise = new this(INTERNAL);

                    while (++i < len) {
                        allResolver(iterable[i], i);
                    }
                    return promise;

                    function allResolver(value, i) {
                        self.resolve(value).then(resolveFromAll, function(error) {
                            if (!called) {
                                called = true;
                                handlers.reject(promise, error);
                            }
                        });

                        function resolveFromAll(outValue) {
                            values[i] = outValue;
                            if (++resolved === len && !called) {
                                called = true;
                                handlers.resolve(promise, values);
                            }
                        }
                    }
                }

                exports.race = race;

                function race(iterable) {
                    var self = this;
                    if (Object.prototype.toString.call(iterable) !== '[object Array]') {
                        return this.reject(new TypeError('must be an array'));
                    }

                    var len = iterable.length;
                    var called = false;
                    if (!len) {
                        return this.resolve([]);
                    }

                    var i = -1;
                    var promise = new this(INTERNAL);

                    while (++i < len) {
                        resolver(iterable[i]);
                    }
                    return promise;

                    function resolver(value) {
                        self.resolve(value).then(function(response) {
                            if (!called) {
                                called = true;
                                handlers.resolve(promise, response);
                            }
                        }, function(error) {
                            if (!called) {
                                called = true;
                                handlers.reject(promise, error);
                            }
                        });
                    }
                }

            }, { "2": 2 }],
            4: [function(_dereq_, module, exports) {
                module.exports = typeof Promise === 'function' ? Promise : _dereq_(3);

            }, { "3": 3 }],
            5: [function(_dereq_, module, exports) {
                'use strict';

                /* jshint -W079 */
                var Blob = _dereq_(1);
                var Promise = _dereq_(4);

                //
                // PRIVATE
                //

                // From http://stackoverflow.com/questions/14967647/ (continues on next line)
                // encode-decode-image-with-base64-breaks-image (2013-04-21)
                function binaryStringToArrayBuffer(binary) {
                    alert('binaryStringToArrayBuffer');
                    var length = binary.length;
                    var buf = new ArrayBuffer(length);
                    var arr = new Uint8Array(buf);
                    var i = -1;
                    while (++i < length) {
                        arr[i] = binary.charCodeAt(i);
                    }
                    return buf;
                }

                // Can't find original post, but this is close
                // http://stackoverflow.com/questions/6965107/ (continues on next line)
                // converting-between-strings-and-arraybuffers
                function arrayBufferToBinaryString(buffer) {
                    var binary = '';
                    var bytes = new Uint8Array(buffer);
                    var length = bytes.byteLength;
                    var i = -1;
                    while (++i < length) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    return binary;
                }

                // doesn't download the image more than once, because
                // browsers aren't dumb. uses the cache
                function loadImage(src, crossOrigin) {
                    return new Promise(function(resolve, reject) {
                        var img = new Image();
                        if (crossOrigin) {
                            img.crossOrigin = crossOrigin;
                        }
                        img.onload = function() {
                            resolve(img);
                        };
                        img.onerror = reject;
                        img.src = src;
                    });
                }

                function imgToCanvas(img) {
                    var canvas = document.createElement('canvas');

                    canvas.width = img.width;
                    canvas.height = img.height;

                    // copy the image contents to the canvas
                    var context = canvas.getContext('2d');
                    context.drawImage(
                        img,
                        0, 0,
                        img.width, img.height,
                        0, 0,
                        img.width, img.height);

                    return canvas;
                }

                //
                // PUBLIC
                //

                /**
                 * Shim for
                 * [URL.createObjectURL()]{@link https://developer.mozilla.org/en-US/docs/Web/API/URL.createObjectURL}
                 * to support browsers that only have the prefixed
                 * <code>webkitURL</code> (e.g. Android <4.4).
                 * @param {Blob} blob
                 * @returns {string} url
                 */
                function createObjectURL(blob) {
                    return (window.URL || window.webkitURL).createObjectURL(blob);
                }

                /**
                 * Shim for
                 * [URL.revokeObjectURL()]{@link https://developer.mozilla.org/en-US/docs/Web/API/URL.revokeObjectURL}
                 * to support browsers that only have the prefixed
                 * <code>webkitURL</code> (e.g. Android <4.4).
                 * @param {string} url
                 */
                function revokeObjectURL(url) {
                    return (window.URL || window.webkitURL).revokeObjectURL(url);
                }

                /**
                 * Convert a base64-encoded string to a <code>Blob</code>. Returns a Promise.
                 * @param {string} base64
                 * @param {string|undefined} type - the content type (optional)
                 * @returns {Promise} Promise that resolves with the <code>Blob</code>
                 */
                function base64StringToBlob(base64, type) {
                    return Promise.resolve().then(function() {
                        var parts = [binaryStringToArrayBuffer(atob(base64))];
                        return type ? createBlob(parts, { type: type }) : createBlob(parts);
                    });
                }

                /**
                 * Convert a binary string to a <code>Blob</code>. Returns a Promise.
                 * @param {string} binary
                 * @param {string|undefined} type - the content type (optional)
                 * @returns {Promise} Promise that resolves with the <code>Blob</code>
                 */
                function binaryStringToBlob(binary, type) {
                    return Promise.resolve().then(function() {
                        return base64StringToBlob(btoa(binary), type);
                    });
                }

                /**
                 * Convert a data URL string
                 * (e.g. <code>'data:image/png;base64,iVBORw0KG...'</code>)
                 * to a <code>Blob</code>. Returns a Promise.
                 * @param {string} dataURL
                 * @returns {Promise} Promise that resolves with the <code>Blob</code>
                 */
                function dataURLToBlob(dataURL) {
                    return Promise.resolve().then(function() {
                        var type = dataURL.match(/data:([^;]+)/)[1];
                        var base64 = dataURL.replace(/^[^,]+,/, '');

                        var buff = binaryStringToArrayBuffer(atob(base64));
                        return createBlob([buff], { type: type });
                    });
                }

                /**
                 * Convert an image's <code>src</code> URL to a data URL by loading the image and painting
                 * it to a <code>canvas</code>. Returns a Promise.
                 *
                 * <p/>Note: this will coerce the image to the desired content type, and it
                 * will only paint the first frame of an animated GIF.
                 *
                 * @param {string} src
                 * @param {string|undefined} type - the content type (optional, defaults to 'image/png')
                 * @param {string|undefined} crossOrigin - for CORS-enabled images, set this to
                 *                                         'Anonymous' to avoid "tainted canvas" errors
                 * @param {number|undefined} quality - a number between 0 and 1 indicating image quality
                 *                                     if the requested type is 'image/jpeg' or 'image/webp'
                 * @returns {Promise} Promise that resolves with the data URL string
                 */
                function imgSrcToDataURL(src, type, crossOrigin, quality) {
                    type = type || 'image/png';

                    return loadImage(src, crossOrigin).then(function(img) {
                        return imgToCanvas(img);
                    }).then(function(canvas) {
                        return canvas.toDataURL(type, quality);
                    });
                }

                /**
                 * Convert a <code>canvas</code> to a <code>Blob</code>. Returns a Promise.
                 * @param {string} canvas
                 * @param {string|undefined} type - the content type (optional, defaults to 'image/png')
                 * @param {number|undefined} quality - a number between 0 and 1 indicating image quality
                 *                                     if the requested type is 'image/jpeg' or 'image/webp'
                 * @returns {Promise} Promise that resolves with the <code>Blob</code>
                 */
                function canvasToBlob(canvas, type, quality) {
                    return Promise.resolve().then(function() {
                        if (typeof canvas.toBlob === 'function') {
                            return new Promise(function(resolve) {
                                canvas.toBlob(resolve, type, quality);
                            });
                        }
                        return dataURLToBlob(canvas.toDataURL(type, quality));
                    });
                }

                /**
                 * Convert an image's <code>src</code> URL to a <code>Blob</code> by loading the image and painting
                 * it to a <code>canvas</code>. Returns a Promise.
                 *
                 * <p/>Note: this will coerce the image to the desired content type, and it
                 * will only paint the first frame of an animated GIF.
                 *
                 * @param {string} src
                 * @param {string|undefined} type - the content type (optional, defaults to 'image/png')
                 * @param {string|undefined} crossOrigin - for CORS-enabled images, set this to
                 *                                         'Anonymous' to avoid "tainted canvas" errors
                 * @param {number|undefined} quality - a number between 0 and 1 indicating image quality
                 *                                     if the requested type is 'image/jpeg' or 'image/webp'
                 * @returns {Promise} Promise that resolves with the <code>Blob</code>
                 */
                function imgSrcToBlob(src, type, crossOrigin, quality) {
                    type = type || 'image/png';

                    return loadImage(src, crossOrigin).then(function(img) {
                        return imgToCanvas(img);
                    }).then(function(canvas) {
                        return canvasToBlob(canvas, type, quality);
                    });
                }

                /**
                 * Convert a <code>Blob</code> to an <code>ArrayBuffer</code>. Returns a Promise.
                 * @param {Blob} blob
                 * @returns {Promise} Promise that resolves with the <code>ArrayBuffer</code>
                 */
                function blobToArrayBuffer(blob) {
                    alert('blobToArrayBuffer');
                    return new Promise(function(resolve, reject) {
                        var reader = new FileReader();
                        reader.onloadend = function(e) {
                            var result = e.target.result || new ArrayBuffer(0);
                            resolve(result);
                        };
                        reader.onerror = reject;
                        reader.readAsArrayBuffer(blob);
                    });
                }

                module.exports = {
                    createBlob: createBlob,
                    createObjectURL: createObjectURL,
                    revokeObjectURL: revokeObjectURL,
                    imgSrcToBlob: imgSrcToBlob,
                    imgSrcToDataURL: imgSrcToDataURL,
                    canvasToBlob: canvasToBlob,
                    dataURLToBlob: dataURLToBlob,
                    blobToBase64String: blobToBase64String,
                    base64StringToBlob: base64StringToBlob,
                    binaryStringToBlob: binaryStringToBlob,
                    blobToBinaryString: blobToBinaryString,
                    arrayBufferToBlob: arrayBufferToBlob,
                    blobToArrayBuffer: blobToArrayBuffer
                };

            }, { "1": 1, "4": 4 }]
        }, {}, [5])(5)
    });


    const credAlgorithm = 'RS256';

    const buttonLogon = document.getElementById('idButton_Logon');
    const buttonLogonWWinHello = document.getElementById('idButton_LogonWWinHello');
    const buttonLogonWSecKey = document.getElementById('idButton_LogonWSecKey');
    const textboxAcctName = document.getElementById('idDiv_AcctName');
    const textboxPwd = document.getElementById('idInput_Pwd');
    const buttonLogonwPwd = document.getElementById('idButton_LogonWPwd');
    const buttonLogonWoRegister = document.getElementById('idButton_LogonWoRegister');
    const buttonReset = document.getElementById('idButton_Reset');
    const buttonHelloLater = document.getElementById('idButton_Hello_MaybeLater');
    const buttonSecKeyLater = document.getElementById('idButton_SecKey_MaybeLater');
    const buttonRegisterWinHello = document.getElementById('idButton_RegisterWinHello');
    const buttonRegisterSecKey = document.getElementById('idButton_RegisterSecurityKey');
    const buttonSetupWinHello = document.getElementById('idButton_SetupWinHello');
    const divSetupwWinHello = document.getElementById('idDiv_SetupWindowsHello');
    const buttonHelloComplete = document.getElementById('idButton_helloComplete');
    const buttonSecKeyComplete = document.getElementById('idButton_seckeyComplete');

    /*******************************
     *                             *
     *       Helper Functions      *
     *                             *
     *******************************/

    /* eslint-disable */

    // License and other comments
    // library code

    /*
			The following function stringToBytes, utf8Slice, and decodeUtf8Char comes from TextEncoderLite:
	 			https://github.com/coolaj86/TextEncoderLite
	 		Thank you coolaj.86 and Feross et al! :-)
			The TextEncoderLite is licensed under the Apache License, Version 2.0 (the "License"); you may not use these files except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
		*/

	const stringToBytes = function (string, units) {
		units = units || Infinity
		var codePoint
		var length = string.length
		var leadSurrogate = null
		var bytes = []
		var i = 0

		for (; i < length; i++) {
			codePoint = string.charCodeAt(i)

			// is surrogate component
			if (codePoint > 0xD7FF && codePoint < 0xE000) {
				// last char was a lead
				if (leadSurrogate) {
					// 2 leads in a row
					if (codePoint < 0xDC00) {
						if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
						leadSurrogate = codePoint
						continue
					} else {
						// valid surrogate pair
						codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
						leadSurrogate = null
					}
				} else {
					// no lead yet

					if (codePoint > 0xDBFF) {
						// unexpected trail
						if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
						continue
					} else if (i + 1 === length) {
						// unpaired lead
						if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
						continue
					} else {
						// valid lead
						leadSurrogate = codePoint
						continue
					}
				}
			} else if (leadSurrogate) {
				// valid bmp char, but last char was a lead
				if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
				leadSurrogate = null
			}

			// encode utf8
			if (codePoint < 0x80) {
				if ((units -= 1) < 0) break
				bytes.push(codePoint)
			} else if (codePoint < 0x800) {
				if ((units -= 2) < 0) break
				bytes.push(
					codePoint >> 0x6 | 0xC0,
					codePoint & 0x3F | 0x80
				)
			} else if (codePoint < 0x10000) {
				if ((units -= 3) < 0) break
				bytes.push(
					codePoint >> 0xC | 0xE0,
					codePoint >> 0x6 & 0x3F | 0x80,
					codePoint & 0x3F | 0x80
				)
			} else if (codePoint < 0x200000) {
				if ((units -= 4) < 0) break
				bytes.push(
					codePoint >> 0x12 | 0xF0,
					codePoint >> 0xC & 0x3F | 0x80,
					codePoint >> 0x6 & 0x3F | 0x80,
					codePoint & 0x3F | 0x80
				)
			} else {
				throw new Error('Invalid code point')
			}
		}

		return bytes
	}

	const decodeUtf8Char = function (str) {

		try {
			return decodeURIComponent(str)
		} catch (err) {
			return String.fromCharCode(0xFFFD) // UTF 8 invalid char
		}

	}


	const bytesToString = function (buf, start, end) {

		var res = ''
		var tmp = ''
		end = Math.min(buf.length, end || Infinity)
		start = start || 0;

		for (var i = start; i < end; i++) {

			if (buf[i] <= 0x7F) {
				res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
				tmp = ''
			} else {
				tmp += '%' + buf[i].toString(16)
			}
		}

		return res + decodeUtf8Char(tmp)

	}

	const arrayBufferToBase64Str = function (buf) {

		return arrayBufferToBlob(buf, 'string').then( function (blob) {

			return blobToBase64String(blob).then(function (string) {

				return string;

			})}
		).catch( function (err) {
			log(`arrayBufferToBase64Str failed: ${err}`)}
	)};


	const base64StrToArrayBuffer = function (str) {

		return base64StringToBlob(str, 'string').then(function (blob) {

			return blobToArrayBuffer(blob).then(function (array) {

				return array;

			})

		}).catch( function(err) {

			log('arrayBufferToBase64Str failed: ${err}');
		})

	};

	/* eslint-enable */

	/*******************************
	 *                             *
	 *            UI Flow          *
	 *                             *
	 *******************************/

	const gotoHome = function() {
		location.href = 'home.html';
	};

	const gotoRegister = function() {
		location.href = 'webauthnregister.html';
	};

	const sendToServer = function () {
		/* This is where you would send data to the server.
		   Currently nothing is actually sent. */
	};

	const log = function (message) {
		console.log(message);
	};

	// Create random non-capitalized character of different length.
	const randomStr = function (length) {
		let text = '';
		const possible = 'abcdefghijklmnopqrstuvwxyz';

		for (let i = 0; i < length; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	};

	const addPasswordField = function() {
		buttonLogon.style.display = 'block';
		textboxPwd.style.display = 'block';
        buttonLogonWWinHello.style.display = 'none';
        buttonLogonWSecKey.style.display = 'none';
		buttonLogonwPwd.style.display = 'none';
		buttonLogonWoRegister.style.display = 'none';
	};

	const hidePasswordField = function () {
		buttonLogon.style.display = 'none';
        textboxPwd.style.display = 'none';
        textboxAcctName.style.display = 'none';
		buttonLogonWoRegister.style.display = 'none';
        buttonLogonWWinHello.style.display = 'block';
        buttonLogonWSecKey.style.display = 'block';
		buttonLogonwPwd.style.display = 'block';
    };
    
    const helloCompleteUI = function () {
        buttonHelloLater.style.display = 'none';
        buttonRegisterWinHello.style.display = 'none';
        buttonHelloComplete.style.display = 'block';
    };

    const seckeyCompleteUI = function () {
        buttonSecKeyLater.style.display = 'none';
        buttonRegisterSecKey.style.display = 'none';
        buttonHelloLater.style.display = 'block';
    }

	const showSetupWindowsHelloDialog = function (show) {
		if (show) {
			divSetupwWinHello.style.display = 'none';
		} else {
			divSetupwWinHello.style.display = 'none';
		}
	};

	const helpSetup = function (reason) {
		// Windows Hello isn't setup, show dialog explaining how to set up
		if (reason === 'NotAllowedError') {
			showSetupWindowsHelloDialog(true);
		} else {
			/* For other special error, direct to the regular inbox without
			   bothering to set up with windows hello. */
			gotoHome();
		}

		log(`Windows Hello failed (${reason.message}).`);
	};

	const addDirectSignIn = function () {
		textboxPwd.style.display = 'block';
		buttonLogonWoRegister.style.display = 'block';
		buttonLogonwPwd.style.display = 'none';
		buttonLogonWWinHello.style.display = 'none';
	};

	const signinOrRegister = function () {
		if (navigator.credentials) {
			// If Windows Hello is supported, offer to register Windows Hello
			gotoRegister();
		} else {
			/* If the WebAuthN API is not supported, neglect the WebAuthN register
			   page and jump to the inbox page directly. */
			gotoHome();
		}
	};

	const addRandomAcctInfo = function () {
		const randomDisplayName = randomStr(7);
		const randomAcctName = (`${randomDisplayName}@${randomStr(5)}.com`);
		const randomPasswd = randomStr(10);

		/* An account identifier used by the website to control the number of
		   credentials. There is only one credential for every id. */
		const acctId = randomStr(6);

		/* Account related information is typically stored in the server
		   side. To keep the demo as simple as possible, it is stored in
		   localStorage. */
		localStorage.setItem('displayName', randomDisplayName);
		localStorage.setItem('acctName', randomAcctName);
		localStorage.setItem('acctId', acctId);
		localStorage.setItem('passwd', randomPasswd);

		textboxAcctName.setAttribute('value', randomAcctName);
		textboxPwd.setAttribute('value', randomPasswd);
	};

	const resetPage = function () {
		/* Only authenticators can delete credentials. To reset the session, we
		   use a different account name and password. LocalStorage is also cleared
		   to give a fresh start.*/
		addPasswordField();
		localStorage.clear();
		addRandomAcctInfo();
    };


	// Detect whether a credential has been created for this origin.
	const featureDetect = function () {
        const setupSuccess = localStorage.getItem('setupSuccess');

		if (setupSuccess) {
			const acctName = localStorage.getItem('acctName');

			textboxAcctName.setAttribute('value', acctName);

			/* If the user registered to use Windows Hello before, they can logon without using
			 his/her password. */
			hidePasswordField();
		} else {
			// Any error means that the user cannot sign in with WebAuthN and needs sign in with password.
			addPasswordField();
			addRandomAcctInfo();
		}
	};

	/*******************************
	 *                             *
	 *    Calling WebAuthn API     *
	 *                             *
	 *******************************/

	// Register user with Web AuthN API
	const createCredentialHello = function () {
		try {
			var publicKey = {
				/* The challenge is typically a random quantity generated by the server.
				This ensures the assertions are freshly generated and not replays. */
				challenge: new Uint8Array(stringToBytes('Four score and seven years ago')),

				rp: {
					name: 'puppycam', // Name of relying party
				},

				// The following account information is typically stored in the server
				// side. To keep the demo as simple as possible, it is stored in localStorage.
				user: {
					id: localStorage.getItem('acctId'), // Account identifier, such as john.smith@example.com
					name: localStorage.getItem('acctName'), // Detailed name of account
					// User name for display. such as John Smith
					displayName: localStorage.getItem('displayName') 
				},

				 // This Relying Party will accept either an ES256 or RS256 credential, but
  				 // prefers an ES256 credential.
				parameters: [
					{
						type: "public-key",
						algorithm: "RS256",
					},
					{
						type: "public-key",
						algorithm: "ES256",
					},
				],

				/* In consistent with the general Javascript rule about dictionary, if a member is not needed,
				there is no need to specify it or give it a null value. For the sake of
				demonstration, excludeList, and extensions are specified here. */
                excludeList: [], // No excludeList
                
                authenticatorSelection: {
                    attachment: "platform"
                },

				extensions: void 0,
			};

			navigator.credentials.create({publicKey})
				.then(function (credInfo) {
					// Web developers can also store the credential id on their server.
					//localStorage.setItem('credentialId', credInfo.credential.id);
					// The public key here is a JSON object.
                    localStorage.setItem('publicKey', credInfo.publicKey);
                    localStorage.setItem('setupSuccess', 'setupSuccess');

                    helloCompleteUI();
				})
				.catch(function(reason) {
						// Windows Hello isn't setup, show dialog explaining how to set it up
					helpSetup(reason.message);
				});
		} catch (ex) {
			log('Cannot get the display name of the site, the account name, or the account id');
			gotoHome();
		}
	};


    	const createCredentialSecurityKeys = function () {
		try {
			var publicKey = {
				/* The challenge is typically a random quantity generated by the server.
				This ensures the assertions are freshly generated and not replays. */
				challenge: new Uint8Array(stringToBytes('Four score and seven years ago')),

				rp: {
					name: 'puppycam', // Name of relying party
				},

				// The following account information is typically stored in the server
				// side. To keep the demo as simple as possible, it is stored in localStorage.
				user: {
					id: localStorage.getItem('acctId'), // Account identifier, such as john.smith@example.com
					name: localStorage.getItem('acctName'), // Detailed name of account
					// User name for display. such as John Smith
					displayName: localStorage.getItem('displayName') 
				},

				 // This Relying Party will accept either an ES256 or RS256 credential, but
  				 // prefers an ES256 credential.
				parameters: [
					{
						type: "public-key",
						algorithm: "RS256",
					},
					{
						type: "public-key",
						algorithm: "ES256",
					},
				],

				/* In consistent with the general Javascript rule about dictionary, if a member is not needed,
				there is no need to specify it or give it a null value. For the sake of
				demonstration, excludeList, and extensions are specified here. */
                excludeList: [], // No excludeList
                
                authenticatorSelection: {
                    attachment: "cross-platform"
                },

				extensions: void 0,
			};

			navigator.credentials.create({publicKey})
				.then(function (credInfo) {
					// Web developers can also store the credential id on their server.
					//localStorage.setItem('credentialId', credInfo.credential.id);
					// The public key here is a JSON object.
                    localStorage.setItem('publicKey', credInfo.publicKey);
                    localStorage.setItem('setupSuccess', 'setupSuccess');

                    seckeyCompleteUI();
				})
				.catch(function(reason) {
						// Windows Hello isn't setup, show dialog explaining how to set it up
					helpSetup(reason.message);
				});
		} catch (ex) {
			log('Cannot get the display name of the site, the account name, or the account id');
			gotoHome();
		}
	};

	// Authenticate the user
	const verify = function () {
		
		let credIdStrFromStorage = localStorage.getItem('credentialId');

		var allowedCreds = [];

		base64StrToArrayBuffer(credIdStrFromStorage).then(function (credIdArray) {

			// for (const cred of credIdArray) {
			// 	allowedCreds.push({
			// 		/* There is only one type defined in the WebAuthN spec in Sept 29th. The link to
			// 	 	this version of the spec is: http://www.w3.org/TR/2016/WD-webauthn-20160928/ */
			// 		type: "public-key",
			// 		id: cred
			// 	})
			// };

			var options = {
				/*The challenge is typically a random quantity generated by the server
		 		 This ensures that any assertions are freshly generated and not replays */
				challenge : new Uint8Array(stringToBytes('Hello Windows')),
				rpId: void 0,
				extensions: void 0 

			}

			return navigator.credentials.get({"publicKey": options})
				.then(function(assertion) {
					// If the assertion calls succeeds, send assertion to the server.
					sendToServer(assertion);

					// If authenticated, sign in to regular inbox.
					gotoHome();
				})
				.catch(function(err) {
					log(`getAssertion() failed: ${err}`);

					gotoHome();
				});
		})
			.catch(function (err) {
				log(`arrayBufferToBase64Str failed in converting credId: ${err}`);
			});
	};


	/*******************************
	 *                             *
	 *   Add Listener to UI Event  *
	 *                             *
	 *******************************/

	document.addEventListener('DOMContentLoaded', function() {
		/* If the password field exists, detect whether the register with Windows Hello
		   exists. If so, hide the password field and show the "Sign In with Windows  Hello" button. */
		if (textboxAcctName) {
			featureDetect();
		}

		if (buttonLogon) {
			buttonLogon.addEventListener('click', signinOrRegister);
		}

		if (buttonLogonWWinHello) {
			buttonLogonWWinHello.addEventListener('click', verify);
		}

		if (buttonLogonwPwd) {
			buttonLogonwPwd.addEventListener('click', addDirectSignIn);
		}

		if (buttonReset) {
			buttonReset.addEventListener('click', resetPage);
		}

		if (buttonRegisterWinHello) {
			buttonRegisterWinHello.addEventListener('click', createCredentialHello);
        }
        
        if (buttonRegisterSecKey) {
            buttonRegisterSecKey.addEventListener('click', createCredentialSecurityKeys);
        }

		if (buttonSetupWinHello) {
			buttonSetupWinHello.addEventListener('click', showSetupWindowsHelloDialog(false));
		}

		if (buttonLogonWoRegister) {
			buttonLogonWoRegister.addEventListener('click', gotoHome);
		}
	});
}());
