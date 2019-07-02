import { Accordion, Header, Icon } from 'semantic-ui-react'
import React, { Dispatch, SetStateAction } from 'react'
import { IBrushChoice, ICategory } from './Annotator'
import { Slider } from 'react-semantic-ui-range'
import DrawTools from './DrawTools'
import PaintFillTools from './PaintFillTools'
import { IAnnotatorState } from '../Store'
import { useDispatch, useSelector } from 'react-redux'

interface IToolsProps {
  categoryChoices: ICategory[]
  brushSizeChoices: IBrushChoice[]
  onClickColorChoice: (category: ICategory) => void
  onClickBrushSizeChoice: (id: number) => void
  brushChoice: IBrushChoice
  categoryChoice: ICategory
}

const Tools = ({
  categoryChoices,
  brushSizeChoices,
  onClickBrushSizeChoice,
  onClickColorChoice,
  brushChoice,
  categoryChoice,
}: IToolsProps) => {
  const [toolsActive, setToolsActive] = React.useState<boolean>(true)

  const annotatorState: IAnnotatorState = useSelector((s: IAnnotatorState) => s)
  const dispatch = useDispatch()

  return (
    <Accordion styled>
      <Accordion.Title
        active={toolsActive}
        onClick={() => {
          setToolsActive(!toolsActive)
        }}
      >
        <Icon name={'dropdown'} />
        Tools
      </Accordion.Title>
      <Accordion.Content active={toolsActive}>
        <Header as={'h4'}>Mask opacity</Header>
        <Slider
          color={'grey'}
          value={annotatorState.opacity * 100}
          settings={{
            max: 100,
            min: 0,
            onChange: (value: number) => {
              dispatch({
                payload: { opacity: value / 100 },
                type: 'SET_OPACITY',
              })
            },
            step: 1,
          }}
        />
        {annotatorState.state === 'drawing' && (
          <DrawTools
            categoryChoice={categoryChoice}
            categoryChoices={categoryChoices}
            brushChoice={brushChoice}
            brushSizeChoices={brushSizeChoices}
            onClickBrushSizeChoice={onClickBrushSizeChoice}
            onClickColorChoice={onClickColorChoice}
          />
        )}
        {annotatorState.state === 'paint-fill' && <PaintFillTools />}
      </Accordion.Content>
    </Accordion>
  )
}

export default Tools
