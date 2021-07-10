import React from "react"
import PropTypes from "prop-types"
import { CssBaseline } from "@material-ui/core"
import { ThemeProvider } from "@material-ui/core/styles"

import Header from "../Header"
import theme from "../../theme"

const Layout = ({ children }) => (
  <>
    <CssBaseline/>
    <ThemeProvider theme={theme}>
      <Header />
      <main>{ children }</main>
    </ThemeProvider>
  </>
)

Layout.propTypes = {
  children: PropTypes.node.isRequired
}

export default Layout