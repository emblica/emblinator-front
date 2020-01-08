import React, { Dispatch, SetStateAction } from 'react'
import { Accordion, Button, Header, Checkbox } from 'semantic-ui-react'
import { useDispatch, useSelector } from 'react-redux'
import { IAnnotatorState } from '../Store'

const PaintFillTools = () => {
  const dispatch = useDispatch()
  const annotatorState: IAnnotatorState = useSelector((s: IAnnotatorState) => s)

  return (
    <>
      <Header as={'h4'}>Actions</Header>
      <Accordion className={'paint-fill-tools'}>
        <Button.Group vertical fluid>
          <Button
            onClick={() => {
              dispatch({ type: 'SAVE_PAINT_FILL' })
              dispatch({ type: 'CLOSE_PAINT_FILL' })
            }}
          >
            Apply
          </Button>
          <Button
            onClick={() => {
              dispatch({ type: 'CLOSE_PAINT_FILL' })
            }}
          >
            Cancel
          </Button>
        </Button.Group>
        <Checkbox
          label={'Update after each stroke'}
          toggle
          checked={annotatorState.paintFillStatus!.autoUpdate}
          onChange={() => {
            dispatch({ type: 'CHANGE_PAINT_FILL_UPDATE_CHECKED' })
          }}
        />
      </Accordion>
    </>
  )
}

export default PaintFillTools
