import React from 'react'
import { Breadcrumb, Image } from 'semantic-ui-react'
import { Link } from 'react-router-dom'

interface IBreadcrumbProps {
  jobId: string
}

const AnnotatorBreadcrumb = ({ jobId }: IBreadcrumbProps) => {
  return (
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
  )
}

export default AnnotatorBreadcrumb
