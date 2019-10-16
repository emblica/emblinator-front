import React, { MutableRefObject, SyntheticEvent, useCallback } from 'react'
import axios from 'axios'
import { IFile } from './FileChooser'
import { Button, Icon } from 'semantic-ui-react'
import { IBrushChoice, ICategory } from './Annotator'
import reDrawImage from '../utils/CanvasHelpers'
import { Route } from 'react-router'
import { toast } from 'react-toastify'
import { showError } from '../utils/Helpers'
import config from '../config'
import PaintFiller from './PaintFiller'
import { IAnnotatorState, ILine, IPaintFillStatus } from '../Store'
import { useDispatch, useSelector } from 'react-redux'

interface IAnnotatorImageProps {
  categoryChoice: ICategory
  categoryChoices: ICategory[]
  brushChoice: IBrushChoice
  file: IFile
  baseFileUrl?: string
}

export const canvasStoredOriginalLines = (
  lines: ILine[],
  currentCanvas: HTMLCanvasElement,
): ILine[] => {
  if (lines.length === 0) {
    return []
  }
  const canvasCheckpoint: HTMLCanvasElement = document.createElement('canvas')
  canvasCheckpoint.width = currentCanvas.width
  canvasCheckpoint.height = currentCanvas.height
  canvasCheckpoint.getContext('2d')!.drawImage(currentCanvas, 0, 0)

  const backPart: ILine[] =
    lines.length < 10 ? lines.slice(0, -1) : lines.slice(1, -1)

  return [
    ...backPart,
    {
      ...lines[lines.length - 1],
      checkpoint: canvasCheckpoint,
    },
  ]
}

export interface ICanvasSize {
  height: number
  width: number
}

interface ITransition {
  zoom: number
  x: number
  y: number
}

interface IDrawAreaSize {
  width: number
  height: number
}

interface IDragStatus {
  originalX: number
  originalY: number
  dragStartX: number
  dragStartY: number
  dragCurrentX: number
  dragCurrentY: number
}

const fileAnnotationsUrl = `${config.API_URL}${config.FILE_ANNOTATION}`
const fileBaseUrl = `${config.API_URL}${config.FILES}`

const getBoundingBox = (
  dragStatus: IDragStatus,
  transition: ITransition,
  canvas: HTMLImageElement,
) => {
  const rect = canvas.getBoundingClientRect()

  const limitUpperLowerFloor = (value: number, max: number, min: number) => {
    return Math.floor(Math.max(min, Math.min(value, max)))
  }

  const xMin = limitUpperLowerFloor(
    (Math.min(dragStatus.dragStartX, dragStatus.dragCurrentX) - rect.left) /
      transition.zoom,
    canvas.width,
    0,
  )
  const xMax = limitUpperLowerFloor(
    (Math.max(dragStatus.dragStartX, dragStatus.dragCurrentX) - rect.left) /
      transition.zoom,
    canvas.width,
    0,
  )
  const yMin = limitUpperLowerFloor(
    (Math.min(dragStatus.dragStartY, dragStatus.dragCurrentY) - rect.top) /
      transition.zoom,
    canvas.height,
    0,
  )
  const yMax = limitUpperLowerFloor(
    (Math.max(dragStatus.dragStartY, dragStatus.dragCurrentY) - rect.top) /
      transition.zoom,
    canvas.height,
    0,
  )

  return {
    height: Math.abs(yMin - yMax),
    width: Math.abs(xMin - xMax),
    xMax,
    xMin,
    yMax,
    yMin,
  }
}

const boxFromDragStatus = (
  dragStatus: IDragStatus,
  left: number,
  top: number,
) => {
  return {
    height: Math.abs(dragStatus.dragStartY - dragStatus.dragCurrentY),
    left: Math.min(dragStatus.dragCurrentX, dragStatus.dragStartX) - left,
    top: Math.min(dragStatus.dragCurrentY, dragStatus.dragStartY) - top,
    width: Math.abs(dragStatus.dragStartX - dragStatus.dragCurrentX),
  }
}

const AnnotatorImage = ({
  categoryChoice,
  categoryChoices,
  brushChoice,
  file,
  baseFileUrl,
}: IAnnotatorImageProps) => {
  const canvasRef: MutableRefObject<
    any
  > = React.useRef<null | HTMLCanvasElement>(null)
  const baseImageRef = React.useRef(null)
  const backgroundImageRef = React.useRef<HTMLImageElement>(null)

  const annotatorState: IAnnotatorState = useSelector((s: IAnnotatorState) => s)
  const dispatch = useDispatch()

  const [transition, setTransition] = React.useState<ITransition>({
    x: 0,
    y: 0,
    zoom: 0.2,
  })
  const [canvasSize, setCanvasSize] = React.useState<ICanvasSize>({
    height: 500,
    width: 500,
  })
  const [dragStatus, setDragStatus] = React.useState<IDragStatus>({
    dragCurrentX: 0,
    dragCurrentY: 0,
    dragStartX: 0,
    dragStartY: 0,
    originalX: 0,
    originalY: 0,
  })

  const [saveStatus, setSaveStatus] = React.useState<string>('dirty')
  const [savingAndGoingToNext, setSavingAndGoingToNext] = React.useState<
    boolean
  >(false)

  const [drawing, setDrawing] = React.useState<string>('false')
  const [baseFileLoaded, setBaseFileLoaded] = React.useState<boolean>(false)
  const [drawAreaSize, setDrawAreaSize] = React.useState<IDrawAreaSize>({
    height: 100,
    width: 100,
  })

  React.useEffect(() => {
    const updateDrawAreaSize = () => {
      const canvas: HTMLCanvasElement = canvasRef.current!

      setDrawAreaSize({
        height: canvas.parentElement!.clientHeight,
        width: canvas.parentElement!.clientWidth,
      })
    }

    updateDrawAreaSize()

    window.addEventListener('resize', updateDrawAreaSize)
    return () => {
      window.removeEventListener('resize', updateDrawAreaSize)
    }
  }, [])

  const callReDraw = useCallback(
    (drawingLines: ILine[], onlyLastLine: boolean) => {
      reDrawImage(
        canvasRef.current!,
        canvasSize,
        drawingLines,
        baseFileLoaded,
        baseImageRef.current!,
        onlyLastLine,
      )
    },
    [canvasSize, baseFileLoaded],
  )

  React.useEffect(() => {
    callReDraw(annotatorState.lines, false)
  }, [callReDraw, annotatorState.lines])

  React.useEffect(() => {
    if (canvasRef.current) {
      dispatch({
        payload: { canvasRef: canvasRef.current },
        type: 'SET_CANVAS_REF',
      })
    }
  }, [dispatch])

  React.useEffect(() => {
    if (annotatorState.lines.length > 0) {
      if (
        annotatorState.lines[annotatorState.lines.length - 1].checkpoint ===
        undefined
      ) {
        callReDraw(annotatorState.lines, true)
      }
    }
  }, [annotatorState.lines, callReDraw])

  const undo = () => {
    if (
      annotatorState.lines.length === 1 &&
      annotatorState.lines[0].isFirst !== true
    ) {
      return
    }

    setSaveStatus('dirty')

    const newLines = annotatorState.lines.slice(0, -1)
    dispatch({ type: 'SET_LINES', payload: { lines: newLines } })

    canvasRef
      .current!.getContext('2d')
      .clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)

    if (newLines.length > 0) {
      const canvas = newLines[newLines.length - 1].checkpoint
      canvasRef.current!.getContext('2d').globalCompositeOperation =
        'source-over'
      canvasRef.current!.getContext('2d').drawImage(canvas, 0, 0)
    } else {
      callReDraw([], false)
    }
  }

  const save = async () => {
    setSaveStatus('saving')

    const canvas: HTMLCanvasElement = canvasRef.current!
    const imgData = canvas.toDataURL()

    try {
      await axios.post(fileAnnotationsUrl, {
        categories: JSON.stringify(categoryChoices),
        file_id: file.id,
        image_data: imgData,
      })
    } catch (e) {
      showError()
    }

    setSaveStatus('saved')
  }

  const transitionXY = (x: number, y: number) => {
    return {
      x: x / transition.zoom,
      y: y / transition.zoom,
    }
  }

  const appendPoint = (x: number, y: number) => {
    setSaveStatus('dirty')
    const lines = annotatorState.lines
    const newLines = [
      ...lines.slice(0, -1),
      {
        ...lines[lines.length - 1],
        points: [...lines[lines.length - 1].points, transitionXY(x, y)],
      },
    ]
    dispatch({ type: 'SET_LINES', payload: { lines: newLines } })
  }

  const zoom = (scale: number) => {
    setTransition({ ...transition, zoom: transition.zoom * scale })
  }

  const startNewLine = (x: number, y: number) => {
    setSaveStatus('dirty')

    const lines = annotatorState.lines
    const newLines: ILine[] = [
      ...canvasStoredOriginalLines(lines, canvasRef.current!),
      {
        checkpoint: undefined,
        color: categoryChoice.color,
        isFirst: lines.length === 0,
        paintFillMaskData: undefined,
        points: [transitionXY(x, y)],
        type: 'line',
        width: brushChoice.size / transition.zoom,
      },
    ]
    dispatch({ type: 'SET_LINES', payload: { lines: newLines } })
  }

  const fill = (x: number, y: number) => {
    setSaveStatus('dirty')
    const lines = annotatorState.lines
    const newLines: ILine[] = [
      ...canvasStoredOriginalLines(lines, canvasRef.current!),
      {
        checkpoint: undefined,
        color: categoryChoice.color,
        isFirst: lines.length === 0,
        paintFillMaskData: undefined,
        points: [transitionXY(x, y)],
        type: 'fill',
        width: 0,
      },
    ]
    dispatch({ type: 'SET_LINES', payload: { lines: newLines } })
  }

  const zoomStyles = {
    transform:
      `translate(-50%, -50%) ` +
      `translate(${drawAreaSize.width / 2}px, ${drawAreaSize.height / 2}px) ` +
      `scale(${transition.zoom}) ` +
      `translate(${transition.x}px, ${transition.y}px)`,
    // transition: 'all 100ms',
  }

  const getPaintFillZoomStyles = () => {
    if (annotatorState.paintFillStatus === undefined) {
      return {}
    }
    if (!backgroundImageRef.current) {
      return {}
    }

    return {
      transform:
        `translate(-50%, -50%) ` +
        `translate(${drawAreaSize.width / 2}px, ${drawAreaSize.height /
          2}px) ` +
        `scale(${transition.zoom}) ` +
        `translate(${transition.x}px, ${transition.y}px) ` +
        `translate(${-backgroundImageRef.current!.width /
          2}px, ${-backgroundImageRef.current!.height / 2}px) ` +
        `translate(${annotatorState.paintFillStatus.xMin}px, ` +
        `${annotatorState.paintFillStatus.yMin}px) ` +
        `translate(50%, 50%) ` +
        ``,
    }
  }
  const paintFillZoomStyles = getPaintFillZoomStyles()

  const renderSaveButton = (status: string) => {
    switch (status) {
      case 'dirty':
        return (
          <Button onClick={save}>
            <Button.Content>Save</Button.Content>
          </Button>
        )
      case 'saving':
        return (
          <Button disabled loading onClick={save}>
            <Button.Content>Saving</Button.Content>
          </Button>
        )
      case 'saved':
        return (
          <Button disabled color="green" onClick={save}>
            <Button.Content>
              Saved <Icon name="check" />
            </Button.Content>
          </Button>
        )
    }
  }

  const saveAndGoNext = async (history: any) => {
    setSavingAndGoingToNext(true)
    await save()
    try {
      const response = await axios.get(`${fileBaseUrl}/${file.id}/next`)
      const data: IFile = response.data
      history.push(`/jobs/${data.job_id}/annotate/${data.id}`)
    } catch (e) {
      if (e.response && e.response.status === 404) {
        toast.success('Done! Nothing more to annotate!')
        setSavingAndGoingToNext(false)
      } else {
        showError()
      }
    }
  }

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    return false
  }

  const onClick = (e: React.MouseEvent) => {
    if (brushChoice.type === 'fill' && categoryChoice.id > 0) {
      const canvas: HTMLCanvasElement = canvasRef.current!
      const rect = canvas.getBoundingClientRect()

      fill(e.clientX - rect.left, e.clientY - rect.top)
    }
  }

  const onMouseDown = (e: React.MouseEvent) => {
    const eventIsDrag = e.button === 2 || categoryChoice.color === 'drag'
    // const eventIsPaintFill = categoryChoice.color === 'paint-fill'
    const eventIsPaintFill = brushChoice.type === 'paint-fill'

    const canvas: HTMLCanvasElement = canvasRef.current!
    const rect = canvas.getBoundingClientRect()

    setDragStatus({
      dragCurrentX: e.clientX,
      dragCurrentY: e.clientY,
      dragStartX: e.clientX,
      dragStartY: e.clientY,
      originalX: transition.x,
      originalY: transition.y,
    })

    if (
      !(brushChoice.type === 'fill' && categoryChoice.id > 0) ||
      eventIsDrag
    ) {
      if (eventIsDrag) {
        setDrawing('drag')
      } else if (annotatorState.state !== 'drawing') {
        return
      } else if (eventIsPaintFill) {
        setDrawing('paint-fill')
      } else {
        setDrawing('true')
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        startNewLine(x, y)
      }
    }
  }

  const onMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (drawing === 'paint-fill') {
      const element: HTMLImageElement = backgroundImageRef.current!

      const { xMin, yMin, width, height } = getBoundingBox(
        dragStatus,
        transition,
        element,
      )

      if (width > 50 && width < 1000 && height > 50 && height < 1000) {
        const paintFillCanvas: HTMLCanvasElement = document.createElement(
          'canvas',
        )

        paintFillCanvas.width = width
        paintFillCanvas.height = height

        paintFillCanvas
          .getContext('2d')!
          .drawImage(
            element,
            xMin,
            yMin,
            paintFillCanvas.width,
            paintFillCanvas.height,
            0,
            0,
            paintFillCanvas.width,
            paintFillCanvas.height,
          )

        if (categoryChoice.id < 0) {
          toast.warn(
            'Invalid color. You must choose color for paint fill tool.',
          )
        } else {
          const paintFillStatus: IPaintFillStatus = {
            autoUpdate: true,
            baseDataString: paintFillCanvas.toDataURL(),
            maskData: undefined,
            xMin,
            yMin,
          }
          dispatch({ payload: { paintFillStatus }, type: 'OPEN_PAINT_FILL' })
        }
      } else {
        toast.warn(
          `Invalid size (${width}, ${height}) for Paint Fill. Minimum ` +
            'size is (50x50) and maximum (1000x1000). Drag in order to choose the size',
        )
      }
    }

    setDrawing('false')
  }

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setDragStatus({
      ...dragStatus,
      dragCurrentX: e.clientX,
      dragCurrentY: e.clientY,
    })

    const eventIsDrag = drawing === 'drag' || categoryChoice.color === 'drag'

    if (drawing !== 'false') {
      const canvas: HTMLCanvasElement = canvasRef.current!
      const rect = canvas.getBoundingClientRect()
      if (eventIsDrag) {
        setTransition({
          ...transition,
          x:
            dragStatus.originalX -
            (dragStatus.dragStartX - e.clientX) / transition.zoom,
          y:
            dragStatus.originalY -
            (dragStatus.dragStartY - e.clientY) / transition.zoom,
        })
      } else if (drawing === 'paint-fill') {
      } else {
        appendPoint(e.clientX - rect.left, e.clientY - rect.top)
      }
    }
  }

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY < 0) {
      zoom(1.1)
    } else {
      zoom(0.9)
    }
  }

  return (
    <div className={'annotator-image'}>
      {/*Buttons*/}
      <div className={'button-container'}>
        {annotatorState.state === 'drawing' && (
          <>
            <Button onClick={undo}>
              <Button.Content>Undo</Button.Content>
            </Button>
            {renderSaveButton(saveStatus)}
            <Route
              render={({ history }) => {
                return savingAndGoingToNext ? (
                  <Button disabled loading>
                    <Button.Content>Save and Next</Button.Content>
                  </Button>
                ) : (
                  <Button onClick={() => saveAndGoNext(history)}>
                    <Button.Content>Save and Next</Button.Content>
                  </Button>
                )
              }}
            />
          </>
        )}
        <Button onClick={() => zoom(1.1)}>
          <Button.Content>
            <Icon name={'zoom-in'} />
          </Button.Content>
        </Button>
        <Button onClick={() => zoom(0.9)}>
          <Button.Content>
            <Icon name={'zoom-out'} />
          </Button.Content>
        </Button>
      </div>
      {/*Image*/}
      <div className={'image-container'}>
        {/*Hidden image to load the base image*/}
        {baseFileUrl && (
          <img
            alt={baseFileUrl}
            crossOrigin={'anonymous'}
            className={'hidden'}
            onLoad={() => {
              setBaseFileLoaded(true)
            }}
            ref={baseImageRef}
            src={baseFileUrl}
          />
        )}
        <img
          alt={file.signed_url}
          crossOrigin={'anonymous'}
          src={file.signed_url}
          style={zoomStyles}
          ref={backgroundImageRef}
          onLoad={(event: SyntheticEvent<HTMLImageElement, Event>) => {
            setCanvasSize({
              height: event.currentTarget.height,
              width: event.currentTarget.width,
            })
          }}
        />
        <canvas
          style={{ ...zoomStyles, opacity: annotatorState.opacity }}
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
        />
        {drawing === 'paint-fill' &&
          (() => {
            const canvasParent: HTMLElement = canvasRef.current!.parentElement
            const rect = canvasParent.getBoundingClientRect()
            const style = boxFromDragStatus(dragStatus, rect.left, rect.top)
            return <div className={'select-tool-selection'} style={style}></div>
          })()}
        {annotatorState.paintFillStatus && (
          <div className={'paint-fill-dimmer'} />
        )}
        <div
          className={'annotator-click-handler'}
          onClick={onClick}
          onContextMenu={onContextMenu}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
          onWheel={onWheel}
        />

        {/*Paint fill tool*/}
        {annotatorState.paintFillStatus && (
          <>
            <div style={paintFillZoomStyles} onWheel={onWheel}>
              <PaintFiller
                color={categoryChoice.color}
                zoom={transition.zoom}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AnnotatorImage
