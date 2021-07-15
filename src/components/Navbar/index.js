import React from 'react'
import { Link } from 'gatsby'

import { makeStyles } from '@material-ui/core/styles'
import { AppBar, Toolbar } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({
  appBar: {
    zIndex: theme.zIndex.drawer + 1
  }
}))

const Navbar = () => {
  const classes = useStyles()

  return (
     <AppBar className={classes.appBar}>
      <Toolbar>
        <nav className="nav">
          <ul className="nav-list">
            <li className="nav-list-item">
              <Link to="/">Home</Link>
            </li>
            <li className="nav-list-item">
              <Link to="/blog">Blog</Link>
            </li>
            <li className="nav-list-item">
              <Link to="/tags">Tags</Link>
            </li>
            <li className="nav-list-item">
              <Link to="/contact">Contact</Link>
            </li>
          </ul>
        </nav>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar;