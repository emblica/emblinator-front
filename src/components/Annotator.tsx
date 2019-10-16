import React, { useCallback } from 'react'
import axios from 'axios'

import './Annotator.scss'
import AnnotatorImage from './AnnotatorImage'
import { IFile } from './FileChooser'
import { Breadcrumb, Dimmer, Loader } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import { showError } from '../utils/Helpers'
import config from '../config'
import Tools from './Tools'
import { useDispatch } from 'react-redux'

const filesUrl = `${config.API_URL}${config.FILES}`
const categoriesUrl = `${config.API_URL}${config.CATEGORIES}`

export interface ICategory {
  color: string
  name: string
  id: number
  job_id: number
}

export interface IBrushChoice {
  id: number
  size: number
  type: string
}

export interface IAnnotatorProps {
  fileId: string
  jobId: string
  baseFileUrl?: string
}

const Annotator = ({ fileId, jobId, baseFileUrl }: IAnnotatorProps) => {
  const brushSizeChoices: IBrushChoice[] = [
    { id: 0, size: 5, type: 'brush' },
    { id: 1, size: 10, type: 'brush' },
    { id: 2, size: 25, type: 'brush' },
    { id: 3, size: 50, type: 'brush' },
    { id: 4, size: 100, type: 'brush' },
    { id: 5, size: 10, type: 'fill' },
    { id: 6, size: 10, type: 'paint-fill' },
  ]

  const dispatch = useDispatch()

  const makeClear = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [dispatch])

  React.useEffect(makeClear, [makeClear])

  const [categoryChoice, setCategoryChoice] = React.useState<ICategory>({
    color: 'drag',
    id: -2,
    job_id: -2,
    name: '',
  })
  const [brushChoice, setBrushChoice] = React.useState<IBrushChoice>(
    brushSizeChoices[2],
  )
  const [file, setFile] = React.useState<IFile | undefined>(undefined)
  const [categoryChoices, setCategoryChoices] = React.useState<ICategory[]>([])

  React.useEffect(() => {
    const loadFileInfo = async () => {
      try {
        const response = await axios.get(filesUrl + '/' + fileId)
        setFile(response.data)
      } catch (e) {
        showError()
      }
    }
    loadFileInfo()
  }, [fileId])

  React.useEffect(() => {
    const loadCategoryChoices = async () => {
      try {
        const response = await axios.get(categoriesUrl, {
          params: { job_id: jobId },
        })
        setCategoryChoices([
          ...response.data,
          {
            color: 'erase',
            id: -1,
            job_id: -1,
            name: 'Erase',
          },
          {
            color: 'drag',
            id: -2,
            job_id: -2,
            name: 'Drag&Drop',
          },
        ])
      } catch (e) {
        showError()
      }
    }
    loadCategoryChoices()
  }, [jobId])

  const onClickColorChoice = (category: ICategory) => {
    setCategoryChoice(category)
  }

  const onClickBrushSizeChoice = (id: number) => {
    setBrushChoice(brushSizeChoices.find(choice => choice.id === id)!)
  }

  return (
    <React.Fragment>
      <Breadcrumb size={'large'}>
        <Breadcrumb.Section link as={Link} to={'/'}>
          Jobs
        </Breadcrumb.Section>
        <Breadcrumb.Divider icon={'right angle'} />
        <Breadcrumb.Section link as={Link} to={'/jobs/' + jobId}>
          Files
        </Breadcrumb.Section>
        <Breadcrumb.Divider icon={'right angle'} />
        <Breadcrumb.Section active>Annotate</Breadcrumb.Section>
      </Breadcrumb>
      <div className={'annotator'}>
        {file === undefined ? (
          <div className={'my-annotator-segment'}>
            <Dimmer active inverted>
              <Loader>Loading..</Loader>
            </Dimmer>
          </div>
        ) : (
          <React.Fragment>
            <div className={'accordion-container active'}>
              <Tools
                categoryChoice={categoryChoice}
                categoryChoices={categoryChoices}
                brushChoice={brushChoice}
                brushSizeChoices={brushSizeChoices}
                onClickBrushSizeChoice={onClickBrushSizeChoice}
                onClickColorChoice={onClickColorChoice}
              />
            </div>
            <AnnotatorImage
              categoryChoice={categoryChoice}
              categoryChoices={categoryChoices}
              brushChoice={brushChoice}
              file={file}
              baseFileUrl={baseFileUrl}
            />
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  )
}

export default Annotator
