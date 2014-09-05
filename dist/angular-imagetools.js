
/*
external dependencies: StackBlur
 */

(function() {
  var ImageTools;

  ImageTools = (function() {
    ImageTools.$inject = ['$q', 'imagesWeservNl'];

    function ImageTools($q, imagesWeservNl) {
      this.$q = $q;
      this.imagesWeservNl = imagesWeservNl;
    }

    ImageTools.prototype._getDataUri = function(imageUrl) {
      return this.imagesWeservNl.getDataUri(imageUrl);
    };

    ImageTools.prototype._getLuminance = function(rgb) {
      return 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
    };

    ImageTools.prototype.getCanvas = function(imageUrl, sampleW, sampleH, offsetX, offsetY, canvasW, canvasH) {
      var deferred, image, isTainted, loadWithProxy, onImageError, onImageLoaded;
      if (offsetX == null) {
        offsetX = 0;
      }
      if (offsetY == null) {
        offsetY = 0;
      }
      if (canvasW == null) {
        canvasW = sampleW;
      }
      if (canvasH == null) {
        canvasH = sampleH;
      }
      deferred = this.$q.defer();
      image = new Image();
      image.crossOrigin = 'Anonymous';
      image.src = imageUrl;
      isTainted = function(ctx) {
        var e, pixel;
        try {
          pixel = ctx.getImageData(0, 0, 1, 1);
          return false;
        } catch (_error) {
          e = _error;
          return e.code === 18;
        }
      };
      loadWithProxy = (function(_this) {
        return function() {
          return _this.imagesWeservNl.getDataUri(imageUrl).then(function(dataUri) {
            image.src = dataUri;
            image.onload = onImageLoaded;
            return image.onerror = null;
          });
        };
      })(this);
      onImageLoaded = function() {
        var canvas, canvasContext, height, width;
        width = sampleW || image.width;
        height = sampleH || Math.round(image.height * (width / image.width));
        canvas = document.createElement('canvas');
        image.width = width;
        image.height = Math.round(image.height * (width / image.width));
        canvas.width = canvasW;
        canvas.height = canvasH;
        canvasContext = canvas.getContext("2d");
        canvasContext.drawImage(image, -offsetX, -offsetY, image.width, image.height);
        if (isTainted(canvasContext)) {
          return loadWithProxy();
        } else {
          return deferred.resolve(canvas);
        }
      };
      onImageError = function(err) {
        return loadWithProxy();
      };
      image.onload = onImageLoaded;
      image.onerror = onImageError;
      return deferred.promise;
    };

    ImageTools.prototype.getLuminance = function(canvas) {
      var context, idx, pdata, pixels, r;
      context = canvas.getContext("2d");
      pdata = context.getImageData(0, 0, canvas.width, canvas.height).data;
      pixels = (function() {
        var _i, _len, _results;
        _results = [];
        for (idx = _i = 0, _len = pdata.length; _i < _len; idx = _i += 4) {
          r = pdata[idx];
          _results.push([r, pdata[idx + 1], pdata[idx + 2]]);
        }
        return _results;
      })();
      return pixels.map(this._getLuminance.bind(this)).reduce(function(a, b) {
        return a + b;
      }) / pixels.length;
    };

    ImageTools.prototype.blurCanvas = function(canvas, blurRadius) {
      var isAttached;
      if (!canvas.id) {
        canvas.id = 'temp-canvas-' + new Date().getTime();
      }
      isAttached = canvas.parentNode;
      if (!isAttached) {
        document.body.appendChild(canvas);
      }
      window.stackBlurCanvasRGB(canvas.id, 0, 0, canvas.width, canvas.height, blurRadius);
      if (!isAttached) {
        document.body.removeChild(canvas);
      }
      return canvas;
    };

    ImageTools.prototype.getBlurredImage = function(imageUrl, blurRadius, sampleW, sampleH, offsetX, offsetY, canvasW, canvasH) {
      if (blurRadius == null) {
        blurRadius = 15;
      }
      if (offsetX == null) {
        offsetX = 0;
      }
      if (offsetY == null) {
        offsetY = 0;
      }
      if (canvasW == null) {
        canvasW = sampleW;
      }
      if (canvasH == null) {
        canvasH = sampleH;
      }
      return this.getCanvas(imageUrl, sampleW, sampleH, offsetX, offsetY, canvasW, canvasH).then((function(_this) {
        return function(canvas) {
          _this.blurCanvas(canvas, blurRadius);
          return canvas.toDataURL("image/jpeg");
        };
      })(this));
    };

    return ImageTools;

  })();

  angular.module('imagetools', ['images-weserv-nl']).service('imagetools', ImageTools);

}).call(this);
