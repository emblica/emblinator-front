import { ICanvasSize } from '../components/AnnotatorImage'
import { ILine, IPoint } from '../Store'

interface IPixelColor {
  r: number
  g: number
  b: number
  a: number
}

const drawLine = (ctx: CanvasRenderingContext2D, line: ILine) => {
  ctx.strokeStyle = line.color
  ctx.lineWidth = Math.floor(line.width)
  ctx.globalAlpha = 1.0
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  if (line.color === 'erase') {
    ctx.globalCompositeOperation = 'destination-out'
  } else {
    ctx.globalCompositeOperation = 'source-over'
  }

  if (line.points.length > 0) {
    const firstPoint = line.points[0]
    ctx.beginPath()
    ctx.moveTo(Math.floor(firstPoint.x), Math.floor(firstPoint.y))
    line.points.forEach((point: IPoint) => {
      ctx.lineTo(Math.floor(point.x), Math.floor(point.y))
    })
    ctx.stroke()
  }
}

export const hexToRgb = (hex: string): IPixelColor | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        a: 255,
        b: parseInt(result[3], 16),
        g: parseInt(result[2], 16),
        r: parseInt(result[1], 16),
      }
    : null
}

const fillBucket = (ctx: CanvasRenderingContext2D, line: ILine) => {
  const height = ctx.canvas.clientHeight
  const width = ctx.canvas.clientWidth

  const tempCanvas = document.createElement('canvas')
  const tempCtx: CanvasRenderingContext2D = tempCanvas.getContext('2d')!
  tempCanvas.width = width
  tempCanvas.height = height
  tempCtx.drawImage(ctx.canvas, 0, 0)
  const colorLayer = tempCtx.getImageData(0, 0, width, height)

  const readPixelColor = (x: number, y: number): IPixelColor => {
    const dataPoint = (x + y * width) * 4
    const r = colorLayer.data[dataPoint + 0]
    const g = colorLayer.data[dataPoint + 1]
    const b = colorLayer.data[dataPoint + 2]
    const a = colorLayer.data[dataPoint + 3]
    return { r, g, b, a }
  }

  const colorSame = (color1: IPixelColor, color2: IPixelColor): boolean => {
    return (
      color1.r === color2.r &&
      color1.g === color2.g &&
      color1.b === color2.b &&
      color1.a === color2.a
    )
  }

  const fillColor = hexToRgb(line.color)

  let x = Math.floor(line.points[0].x)
  let y = Math.floor(line.points[0].y)

  const originalColor = readPixelColor(x, y)

  const stack = [{ x, y }]

  const seen: any = {}
  const isSeen = (x: number, y: number) => {
    if (seen[x] === undefined) {
      return false
    }
    return seen[x].some(({ yMin, yMax }: any) => {
      if (y >= yMin && y <= yMax) {
        return true
      }
      return false
    })
  }
  const setSeen = (x: number, yMin: number, yMax: number) => {
    if (seen[x] === undefined) {
      seen[x] = []
    }
    seen[x].push({ yMin, yMax })
  }

  let stackCount = 0

  while (stack.length > 0) {
    const top = stack.pop()

    stackCount += 1

    if (stackCount > 50000) {
      break
    }

    x = top!.x
    y = top!.y

    if (x < 0 || x >= width) {
      continue
    }

    while (
      y >= 0 &&
      y < height &&
      colorSame(originalColor, readPixelColor(x, y - 1))
    ) {
      y -= 1
    }

    let size = 0
    while (colorSame(originalColor, readPixelColor(x, y + size))) {
      size += 1
    }
    // ctx.fillRect(x, y, 1, size)
    setSeen(x, y - 3, y + size + 3)
    // ctx.putImageData(colorLayer, 0, 0)

    let stackingLeft = true
    let stackingRight = true
    let size2 = 0
    while (size2 < size) {
      const dataPoint = (x + (y + size2) * width) * 4
      colorLayer.data[dataPoint + 0] = fillColor!.r
      colorLayer.data[dataPoint + 1] = fillColor!.g
      colorLayer.data[dataPoint + 2] = fillColor!.b
      colorLayer.data[dataPoint + 3] = fillColor!.a

      size2 += 1

      if (
        colorSame(originalColor, readPixelColor(x + 1, y + size2)) &&
        stackingRight &&
        !isSeen(x + 1, y + size2)
      ) {
        stack.push({ x: x + 1, y: y + size2 })
        stackingRight = false
      }
      if (
        !stackingRight &&
        !colorSame(originalColor, readPixelColor(x + 1, y + size2))
      ) {
        stackingRight = true
      }
      if (
        colorSame(originalColor, readPixelColor(x - 1, y + size2)) &&
        stackingLeft &&
        !isSeen(x - 1, y + size2)
      ) {
        stack.push({ x: x - 1, y: y + size2 })
        stackingLeft = false
      }
      if (
        !stackingLeft &&
        !colorSame(originalColor, readPixelColor(x - 1, y + size2))
      ) {
        stackingLeft = true
      }
    }
  }

  tempCanvas.width = width
  tempCanvas.height = height
  tempCtx.putImageData(colorLayer, 0, 0)
  ctx.drawImage(tempCanvas, 0, 0)
}

const paintFill = (ctx: CanvasRenderingContext2D, line: ILine) => {
  const x = Math.floor(line.points[0].x)
  const y = Math.floor(line.points[0].y)

  ctx.drawImage(line.paintFillMaskData!, x, y)
}

const drawLineOrFill = (line: ILine, ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = line.color
  if (line.points.length === 0) {
    return
  }
  if (line.type === 'fill') {
    fillBucket(ctx, line)
  } else if (line.type === 'paint-fill') {
    paintFill(ctx, line)
  } else {
    drawLine(ctx, line)
  }
}

const reDrawImage = (
  canvas: HTMLCanvasElement,
  canvasSize: ICanvasSize,
  lines: ILine[],
  baseFileLoaded: boolean,
  baseImageCanvas: HTMLCanvasElement,
  onlyLastLine: boolean,
) => {
  const ctx = canvas.getContext('2d')!

  ctx.globalCompositeOperation = 'source-over'
  ctx.imageSmoothingEnabled = false

  if (onlyLastLine) {
    const lastLine = lines[lines.length - 1]
    drawLineOrFill(
      {
        ...lastLine,
        points: lastLine.points.slice(
          lastLine.points.length - 2,
          lastLine.points.length,
        ),
      },
      ctx,
    )
  } else {
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height)
    if (baseFileLoaded) {
      ctx.drawImage(baseImageCanvas, 0, 0)
    }
    lines.forEach(line => {
      drawLineOrFill(line, ctx)
    })
  }
}

export default reDrawImage
