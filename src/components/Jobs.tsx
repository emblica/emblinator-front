import React from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import {
  Breadcrumb,
  Dimmer,
  Icon,
  Label,
  Loader,
  Table,
} from 'semantic-ui-react'
import { showError } from '../utils/Helpers'
import config from '../config'

const jobsUrl = `${config.API_URL}${config.JOBS}`

interface IJob {
  id: number
  name: string
  prefix: string
  file_count: number
  annotated_count: number
  done_count: number
}

const Jobs = () => {
  const [loading, setLoading] = React.useState<boolean>(true)
  const [jobs, setJobs] = React.useState<IJob[]>([])

  const loadJobs = async () => {
    try {
      const response = await axios.get(jobsUrl)
      setLoading(false)
      setJobs(response.data)
    } catch (e) {
      showError()
    }
  }

  React.useEffect(() => {
    loadJobs()
  }, [])

  return (
    <React.Fragment>
      <Breadcrumb size={'large'}>
        <Breadcrumb.Section active>Jobs</Breadcrumb.Section>
      </Breadcrumb>
      {loading ? (
        <div className={'my-segment'}>
          <Dimmer active inverted>
            <Loader>Loading..</Loader>
          </Dimmer>
        </div>
      ) : (
        <Table className={'jobs-table'}>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Job</Table.HeaderCell>
              <Table.HeaderCell>Annotated</Table.HeaderCell>
              <Table.HeaderCell>Marked As Done</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {jobs.map(job => {
              return (
                <Table.Row key={job.id}>
                  <Table.Cell>
                    <Link to={`/jobs/${job.id}`}>
                      <Icon name={'folder'} />
                      {job.name}
                      <Label
                        className={'job-list-info-label'}
                        pointing={'left'}
                        size={'mini'}
                      >
                        prefix:"{job.prefix}", id:"{job.id}"
                      </Label>
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    <Link to={`/jobs/${job.id}`}>
                      <Label>
                        {job.annotated_count} / {job.file_count}
                      </Label>
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    <Link to={`/jobs/${job.id}`}>
                      <Label>
                        {job.done_count} / {job.file_count}
                      </Label>
                    </Link>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      )}
    </React.Fragment>
  )
}

export default Jobs
