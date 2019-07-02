import React, {
  Dispatch,
  SetStateAction,
  SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import axios from 'axios'
import config from '../config'
import { hexToRgb } from '../utils/CanvasHelpers'
import { toast } from 'react-toastify'
import { Dimmer, Loader } from 'semantic-ui-react'
import { showError } from '../utils/Helpers'
import { useDispatch, useSelector } from 'react-redux'
import { IAnnotatorState } from '../Store'

interface IBucketFillProps {
  color: string
  zoom: number
}

const PaintFiller = ({ color, zoom }: IBucketFillProps) => {
  const annotatorState: IAnnotatorState = useSelector((s: IAnnotatorState) => s)
  const dispatch = useDispatch()

  const paintFillStatus = annotatorState.paintFillStatus!
  const dataString = paintFillStatus.baseDataString

  const [maskData, setMatchData] = useState<string | undefined>(undefined)

  const [loading, setLoading] = useState(true)
  const [size, setSize] = useState<{ width: number; height: number }>({
    height: 0,
    width: 0,
  })
  const [drawing, setDrawing] = useState<undefined | 'black' | 'white'>(
    undefined,
  )

  const maskImgRef = useRef<HTMLImageElement>(null)
  const originalImgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (originalImgRef.current) {
      setSize({
        height: originalImgRef.current.height,
        width: originalImgRef.current.width,
      })
    }
  }, [originalImgRef.current])

  const onUpdate = async () => {
    console.log('onUpdate called')

    const url = `${config.API_URL}${config.PAINT_FILL}`
    const rgbColor = hexToRgb(color)
    if (rgbColor === null) {
      toast.warn('Invalid color')
      return
    }
    const maskStringData = canvasRef.current!.toDataURL()
    setLoading(true)
    try {
      const { data } = await axios.post(url, {
        color: [rgbColor.r, rgbColor.g, rgbColor.b],
        dataString,
        maskData: maskStringData,
        points: [],
      })
      setMatchData(data.image_data)
    } catch (e) {
      showError()
    }
    setLoading(false)
  }

  useEffect(() => {
    if (canvasRef.current && canvasRef.current.width > 0) {
      onUpdate()
    }
  }, [canvasRef.current])

  useEffect(() => {
    if (canvasRef.current && canvasRef.current.width > 0) {
      if (paintFillStatus.autoUpdate == true) {
        onUpdate()
      }
    }
  }, [paintFillStatus.autoUpdate])

  const drawOnMouse = (e: React.MouseEvent, drawStyle: 'white' | 'black') => {
    const rect: DOMRect | ClientRect = e.currentTarget!.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom
    const context = canvasRef.current!.getContext('2d')!
    context.fillStyle = drawStyle === 'white' ? '#FFF' : '#000'
    context.fillRect(x - 1, y - 1, 3, 3)
  }

  return (
    <div className={'bucket-fill-content'} style={size}>
      <div
        className={'bucket-fill-image-container'}
        onMouseMove={(e: React.MouseEvent<HTMLDivElement>) => {
          if (drawing !== undefined) {
            drawOnMouse(e, drawing)
          }
        }}
        onMouseDown={(e: React.MouseEvent) => {
          const drawStyle = e.button === 2 ? 'black' : 'white'
          drawOnMouse(e, drawStyle)
          setDrawing(drawStyle)
        }}
        onMouseUp={e => {
          setDrawing(undefined)
          if (paintFillStatus.autoUpdate) {
            onUpdate()
          }
        }}
        onContextMenu={e => {
          e.preventDefault()
          return false
        }}
        onDragStart={e => {
          e.preventDefault()
          return false
        }}
      >
        <img src={dataString} ref={originalImgRef} />
        {maskData && (
          <img
            onLoad={(event: SyntheticEvent<HTMLImageElement>) => {
              const canvas = document.createElement('canvas')
              canvas.width = size.width
              canvas.height = size.height
              const context = canvas.getContext('2d')!
              context.drawImage(maskImgRef.current!, 0, 0)
              dispatch({
                payload: { maskData: canvas },
                type: 'SET_PAINT_FILL_MASK',
              })
            }}
            src={maskData}
            className={'mask'}
            style={{ opacity: annotatorState.opacity }}
            ref={maskImgRef}
          />
        )}
        <canvas ref={canvasRef} width={size.width} height={size.height} />
      </div>
      <Dimmer active={loading} inverted>
        <Loader active />
      </Dimmer>
    </div>
  )
}

export default PaintFiller
