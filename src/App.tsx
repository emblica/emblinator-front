import React from 'react'
import { BrowserRouter, Route, Link } from 'react-router-dom'
import { Container, Menu } from 'semantic-ui-react'

import './App.css'
import 'semantic-ui-css/semantic.css'
import 'react-toastify/dist/ReactToastify.css'

import FileChooser from './components/FileChooser'
import Jobs from './components/Jobs'
import AnnotationNew from './components/AnnotationNew'
import AnnotationEdit from './components/AnnotationEdit'

import { ToastContainer } from 'react-toastify'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Container fluid>
        <Menu>
          <Menu.Item>
            <b>Annotator</b>
          </Menu.Item>
          <Menu.Item as={Link} to="/">
            Jobs
          </Menu.Item>
        </Menu>
        <Route exact path="/" component={Jobs}></Route>
        <Route exact path="/jobs/:jobId" component={FileChooser}></Route>
        <Route
          exact
          path="/jobs/:jobId/annotate/:fileId"
          component={AnnotationNew}
        ></Route>
        <Route
          exact
          path="/jobs/:jobId/edit/:annotationId"
          component={AnnotationEdit}
        ></Route>
        <ToastContainer />
      </Container>
    </BrowserRouter>
  )
}

export default App
