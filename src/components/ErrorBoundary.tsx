import React from 'react'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Grid, Container, Image, Button } from 'semantic-ui-react'
import logo from '../logo.svg'
import styled from 'styled-components'

const StyledContainer = styled(Container)`
  margin: 3em;
`

class ErrorBoundary extends React.Component<RouteComponentProps> {
  state = { error: null }

  toHomePage = () => {
    this.setState({ error: null })
    this.props.history.push('/')
  }

  componentDidCatch(error: Error | null, errorInfo: any) {
    this.setState({ error })
    Object.keys(errorInfo).forEach(key => {
      console.error(`${key}: ${errorInfo[key]}`)
    })
  }
  render() {
    if (!this.state.error) {
      return this.props.children
    }
    return (
      <StyledContainer>
        <Image src={logo} size="medium" />
        <Container fluid>
          <Grid.Column>
            <p>We're sorry — something's gone wrong.</p>
            <p>Our team has been notified.</p>
            <Button onClick={this.toHomePage}>Return to home page</Button>
          </Grid.Column>
        </Container>
      </StyledContainer>
    )
  }
}

export default withRouter(ErrorBoundary)
