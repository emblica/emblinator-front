import { Header, Icon, List } from 'semantic-ui-react'
import React from 'react'
import { IBrushChoice, ICategory } from './Annotator'

interface IDrawToolsProps {
  categoryChoices: ICategory[]
  brushSizeChoices: IBrushChoice[]
  onClickColorChoice: (category: ICategory) => void
  onClickBrushSizeChoice: (id: number) => void
  brushChoice: IBrushChoice
  categoryChoice: ICategory
}

const DrawTools = ({
  categoryChoices,
  brushSizeChoices,
  onClickBrushSizeChoice,
  onClickColorChoice,
  brushChoice,
  categoryChoice,
}: IDrawToolsProps) => {
  return (
    <>
      <Header as={'h4'}>Type</Header>
      <List divided>
        {categoryChoices.map(choice => {
          const toolIconClassName =
            'color-indicator' +
            (categoryChoice.id === choice.id ? ' active' : '')
          const style = { backgroundColor: '#EEE' }
          if (choice.id > 0) {
            style.backgroundColor = choice.color
          }
          return (
            <List.Item
              onClick={() => {
                onClickColorChoice(choice)
              }}
              className={'color-picker'}
              key={choice.id}
            >
              <div style={style} className={toolIconClassName}>
                {choice.id === -1 && <Icon name={'eraser'} />}
                {choice.id === -2 && <Icon name={'move'} />}
              </div>
              <List.Content>
                <List.Header>{choice.name}</List.Header>
                <List.Description>{choice.color}</List.Description>
              </List.Content>
            </List.Item>
          )
        })}
      </List>
      <Header as={'h4'}>Size</Header>
      <List divided>
        {brushSizeChoices.map(choice => {
          return (
            <List.Item
              onClick={() => {
                onClickBrushSizeChoice(choice.id)
              }}
              key={choice.id}
              className={'' + (brushChoice.id === choice.id ? 'active' : '')}
            >
              <List.Content>
                {(() => {
                  if (choice.type === 'brush') {
                    return (
                      <React.Fragment>
                        <div
                          className={
                            'size-indicator' +
                            (brushChoice.id === choice.id ? ' active' : '')
                          }
                          style={{
                            width: choice.size,
                            height: choice.size,
                            borderRadius: choice.size,
                          }}
                        ></div>
                        <span>Size: {choice.size}</span>
                      </React.Fragment>
                    )
                  }

                  return (
                    <div
                      className={
                        '' + (brushChoice.id === choice.id ? 'active' : '')
                      }
                    >
                      {choice.type === 'fill' ? (
                        <React.Fragment>
                          <Icon name={'tint'} />
                          <span>Fill tool</span>
                        </React.Fragment>
                      ) : (
                        <React.Fragment>
                          <Icon name={'print'} />
                          <span>Paint Fill</span>
                        </React.Fragment>
                      )}
                    </div>
                  )
                })()}
              </List.Content>
            </List.Item>
          )
        })}
      </List>
    </>
  )
}

export default DrawTools
