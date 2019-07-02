import React from 'react'
import axios from 'axios'

import './Annotator.scss'
import Annotator from './Annotator'
import { Dimmer, Loader } from 'semantic-ui-react'
import { showError } from '../utils/Helpers'
import config from '../config'
import { RouteComponentProps } from 'react-router'

const annotationsUrl = `${config.API_URL}${config.FILE_ANNOTATION}`

interface IAnnotation {
  id: number
  file_id: number
  image_url: string
}

interface IAnnotationEditProps {
  jobId: string
  annotationId: string
}

const AnnotationEdit = ({
  match,
}: RouteComponentProps<IAnnotationEditProps>) => {
  const { jobId, annotationId } = match.params

  const [loading, setLoading] = React.useState<boolean>(true)
  const [annotation, setAnnotation] = React.useState<IAnnotation | undefined>(
    undefined,
  )

  const loadAnnotation = async (id: string) => {
    try {
      const response = await axios.get(annotationsUrl + '/' + id)
      const responseAnnotation: IAnnotation = response.data
      setLoading(false)
      setAnnotation(responseAnnotation)
    } catch (e) {
      showError()
    }
  }

  React.useEffect(() => {
    loadAnnotation(annotationId)
  }, [annotationId])

  return loading || !annotation ? (
    <div className={'my-segment'}>
      <Dimmer active inverted>
        <Loader>Loading..</Loader>
      </Dimmer>
    </div>
  ) : (
    <Annotator
      fileId={annotation!.file_id.toString()}
      jobId={jobId}
      baseFileUrl={annotation!.image_url}
    />
  )
}

export default AnnotationEdit
