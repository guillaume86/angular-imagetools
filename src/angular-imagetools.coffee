###
external dependencies: StackBlur
###

class ImageTools
  @$inject =   ['$q','imagesWeservNl']
  constructor: (@$q ,@imagesWeservNl ) ->

  _getDataUri: (imageUrl) -> @imagesWeservNl.getDataUri(imageUrl)

  _getLuminance: (rgb) -> 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]

  getCanvas: (imageUrl, sampleW, sampleH, offsetX = 0, offsetY = 0, canvasW = sampleW, canvasH = sampleH) ->
    deferred = @$q.defer()

    image = new Image()
    image.crossOrigin = 'Anonymous'
    image.src = imageUrl

    isTainted = (ctx) ->
      try
        pixel = ctx.getImageData(0, 0, 1, 1)
        return false
      catch e
        return e.code == 18
        
    loadWithProxy = =>
      @imagesWeservNl.getDataUri(imageUrl)
        .then((dataUri) ->
          image.src = dataUri
          image.onload = onImageLoaded
          image.onerror = null
        )

    onImageLoaded = ->
      width = sampleW || image.width
      height = sampleH || Math.round(image.height * (width / image.width))

      canvas = document.createElement('canvas')

      image.width = width
      image.height = Math.round(image.height * (width / image.width))
      
      canvas.width = canvasW
      canvas.height = canvasH
      canvasContext = canvas.getContext("2d")
      canvasContext.drawImage(image, -offsetX, -offsetY, image.width, image.height)

      if isTainted(canvasContext)
        loadWithProxy()
      else
        deferred.resolve(canvas)
        
    onImageError = (err) -> loadWithProxy()

    image.onload = onImageLoaded
    image.onerror = onImageError

    deferred.promise

  # getColorMap: (canvas) -> # TODO to make nice albums views like iTunes ?

  getLuminance: (canvas) ->
    context = canvas.getContext("2d")
    pdata = context.getImageData(0, 0, canvas.width, canvas.height).data
    pixels = ([r, pdata[idx+1], pdata[idx+2]] for r, idx in pdata by 4)
    return pixels.map(@_getLuminance.bind(this))
      .reduce((a, b) -> a + b) / pixels.length

  blurCanvas: (canvas, blurRadius) ->
    canvas.id = 'temp-canvas-' + new Date().getTime() unless canvas.id
    isAttached = canvas.parentNode
    document.body.appendChild(canvas) unless isAttached
    # Unfortunatly the lib take ids and not canvas element as argument
    window.stackBlurCanvasRGB(canvas.id, 0, 0, canvas.width, canvas.height, blurRadius)
    document.body.removeChild(canvas) unless isAttached
    canvas

  getBlurredImage: (imageUrl, blurRadius = 15, sampleW, sampleH, offsetX = 0, offsetY = 0, canvasW = sampleW, canvasH = sampleH) ->
    @getCanvas(imageUrl, sampleW, sampleH, offsetX, offsetY, canvasW, canvasH)
      .then((canvas) =>
        @blurCanvas(canvas, blurRadius)
        canvas.toDataURL("image/jpeg")
      )

angular.module('imagetools', ['images-weserv-nl'])
  .service('imagetools', ImageTools)
