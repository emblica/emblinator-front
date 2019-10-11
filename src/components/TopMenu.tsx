import React from 'react'
import { Menu } from 'semantic-ui-react'
import { Link } from 'react-router-dom'

const TopMenu = () => {
  return (
    <Menu>
      <Menu.Item as={Link} to="/">
        <b>Annotator</b>
      </Menu.Item>
      <Menu.Item as={Link} to="/">
        Jobs
      </Menu.Item>
    </Menu>
  )
}

export default TopMenu
