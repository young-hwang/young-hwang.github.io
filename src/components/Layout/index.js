import React from "react"
import PropTypes from "prop-types"
import { CssBaseline } from "@material-ui/core"
import { ThemeProvider, makeStyles } from "@material-ui/core/styles"

import theme from "../../theme"

import Navbar from "../Navbar"
import Sidebar from "../Sidebar"

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    display: 'flex',
    height: '100%',
    width: '100%',
    overflow: 'hidden'
  },
  wrapper: {
    display: 'flex',
    flex: '1 1 auto',
    overflow: 'hidden',
    paddingTop: 64,
    [theme.breakpoints.up('lg')]: {
      paddingLeft: 256
    }
  },
  container: {
    display: 'flex',
    flex: '1 1 auto',
    overflow: 'hidden'
  },
  content : {
    flex: '1 1 auto',
    height: '100%',
    overflow: 'hidden'
  }
}))

const Layout = ({ children }) => {
  const classes = useStyles()

  return (
    <ThemeProvider theme={theme} >
      <CssBaseline />
      <div className={classes.root} >
        <Navbar />
        <Sidebar />
        <div className={classes.wrapper} >
          <div className={classes.container} >
            <div className={classes.content} >
              <main>{ children }</main>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired
}

export default Layout