import React from "react"
import PropTypes from "prop-types"
import { CssBaseline } from "@material-ui/core"

import Header from "../Header"

const Layout = ({ children }) => (
  <>
    <CssBaseline/>
    <Header />
    <main>{ children }</main>
  </>
)

Layout.propTypes = {
  children: PropTypes.node.isRequired
}

export default Layout