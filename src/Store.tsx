import { createStore } from 'redux'
import { canvasStoredOriginalLines } from './components/AnnotatorImage'

export interface IPoint {
  x: number
  y: number
}

export interface ILine {
  color: string
  width: number
  points: IPoint[]
  paintFillMaskData: HTMLCanvasElement | undefined
  type: 'fill' | 'paint-fill' | 'line'
  checkpoint: HTMLCanvasElement | undefined
  isFirst: boolean
}

export interface IPaintFillStatus {
  baseDataString: string
  xMin: number
  yMin: number
  maskData: HTMLCanvasElement | undefined
  autoUpdate: boolean
}

export interface IAnnotatorState {
  state: 'drawing' | 'paint-fill'
  opacity: number
  paintFillStatus: undefined | IPaintFillStatus
  lines: ILine[]
  canvasRef: undefined | HTMLCanvasElement
}

export interface IAction {
  type:
    | 'CLEAR'
    | 'SET_OPACITY'
    | 'CLOSE_PAINT_FILL'
    | 'OPEN_PAINT_FILL'
    | 'SET_LINES'
    | 'SET_PAINT_FILL_MASK'
    | 'SAVE_PAINT_FILL'
    | 'SET_CANVAS_REF'
    | 'CHANGE_PAINT_FILL_UPDATE_CHECKED'
  payload: any
}

const initialState: IAnnotatorState = {
  canvasRef: undefined,
  lines: [],
  opacity: 0.7,
  paintFillStatus: undefined,
  state: 'drawing',
}

const annotatorReducer = (
  state = initialState,
  action: IAction,
): IAnnotatorState => {
  switch (action.type) {
    case 'CLEAR':
      return initialState
    case 'SET_LINES':
      return { ...state, lines: action.payload.lines }
    case 'SET_OPACITY':
      return { ...state, opacity: action.payload.opacity }
    case 'CLOSE_PAINT_FILL':
      return { ...state, paintFillStatus: undefined, state: 'drawing' }
    case 'SET_PAINT_FILL_MASK':
      return {
        ...state,
        paintFillStatus: {
          ...state.paintFillStatus!,
          maskData: action.payload.maskData,
        },
      }
    case 'OPEN_PAINT_FILL':
      return {
        ...state,
        paintFillStatus: action.payload.paintFillStatus,
        state: 'paint-fill',
      }
    case 'CHANGE_PAINT_FILL_UPDATE_CHECKED':
      return {
        ...state,
        paintFillStatus: {
          ...state.paintFillStatus!,
          autoUpdate: !state.paintFillStatus!.autoUpdate,
        },
      }
    case 'SET_CANVAS_REF':
      return { ...state, canvasRef: action.payload.canvasRef }
    case 'SAVE_PAINT_FILL':
      const lines = state.lines
      const newLines: ILine[] = [
        ...canvasStoredOriginalLines(lines, state.canvasRef!),
        {
          checkpoint: undefined,
          // color: categoryChoice.color,
          color: '#FFF',
          isFirst: lines.length === 0,
          paintFillMaskData: state.paintFillStatus!.maskData,
          points: [
            { x: state.paintFillStatus!.xMin, y: state.paintFillStatus!.yMin },
          ],
          type: 'paint-fill',
          width: 0,
        },
      ]
      return {
        ...state,
        lines: newLines,
      }
    default:
      return state
  }
}

const store = createStore(annotatorReducer)

export default store
