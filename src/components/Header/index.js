import React from "react"
import { Link } from "gatsby"

import { AppBar, Toolbar } from "@material-ui/core"

const Header = () => {
  return (
    <AppBar>
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

export default Header;