import React from 'react'

import './Annotator.scss'
import Annotator from './Annotator'
import { RouteComponentProps } from 'react-router'

interface IAnnotationNewProps {
  jobId: string
  fileId: string
}

const AnnotationNew = ({ match }: RouteComponentProps<IAnnotationNewProps>) => {
  const { jobId, fileId } = match.params

  return <Annotator key={fileId} jobId={jobId} fileId={fileId} />
}

export default AnnotationNew
