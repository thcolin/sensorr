const CanvasImage = function (image) {
  this.canvas = document.createElement('canvas')
  document.body.appendChild(this.canvas)

  this.context = this.canvas.getContext('2d')

  this.width = this.canvas.width = image.width
  this.height = this.canvas.height = image.height

  this.canvas.style.display = 'none'

  this.context.drawImage(image, 0, 0, this.width, this.height)
}

CanvasImage.prototype.clear = function () {
  this.context.clearRect(0, 0, this.width, this.height)
}

CanvasImage.prototype.update = function (imageData) {
  this.context.putImageData(imageData, 0, 0)
}

CanvasImage.prototype.getPixelCount = function () {
  return this.width * this.height
}

CanvasImage.prototype.getImageData = function () {
  return this.context.getImageData(0, 0, this.width, this.height)
}

CanvasImage.prototype.removeCanvas = function () {
  if (this.canvas.parentNode) {
    this.canvas.parentNode.removeChild(this.canvas)
  }
}

export function getImagePalette(src) {
  return new Promise(resolve => {
    const worker = new Worker('./palette.worker.js', { type: 'module' })
    worker.onmessage = e => resolve(e.data)
    const image = new Image()

    image.crossOrigin = 'anonymous'
    image.src = src
    image.onload = () => {
      const canvas = new CanvasImage(image)
      const imageData = canvas.getImageData()
      const pixels = imageData.data
      const pixelCount = canvas.getPixelCount()
      canvas.removeCanvas()
      worker.postMessage({ pixels, pixelCount })
    }
  })
}
