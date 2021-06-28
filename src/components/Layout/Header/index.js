import React from "react"
import { Link } from "gatsby"

const Nav = () => {
  return (
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
  )
}

export default Nav;