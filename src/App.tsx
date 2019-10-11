import React from 'react'
import { BrowserRouter, Route } from 'react-router-dom'
import { Container } from 'semantic-ui-react'
import TopMenu from './components/TopMenu'
import FileChooser from './components/FileChooser'
import Jobs from './components/Jobs'
import AnnotationNew from './components/AnnotationNew'
import AnnotationEdit from './components/AnnotationEdit'
import './App.css'
import 'semantic-ui-css/semantic.css'
import 'react-toastify/dist/ReactToastify.css'

import { ToastContainer } from 'react-toastify'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Container fluid>
        <TopMenu />
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
