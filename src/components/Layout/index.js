import React from "react"
import PropTypes from "prop-types"
import { CssBaseline } from "@material-ui/core"
import { ThemeProvider, makeStyles } from "@material-ui/core/styles"

import Header from "../Header"
import theme from "../../theme"

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    height: '100%',
    width: '100%',
    overflow: 'hidden'
  },
  wrapper: {
    display: 'flex',
    flex: '1 1 auto',
    overflow: 'hidden',
    paddingTop: 64
  }
}))

const Layout = ({ children }) => {
  const classes = useStyles()

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className={classes.root} >
        <Header />
        <div className={classes.wrapper} >
          <main>{ children }</main>
        </div>
      </div>
    </ThemeProvider>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired
}

export default Layout