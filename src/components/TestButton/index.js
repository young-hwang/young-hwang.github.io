import React from "react"

import { makeStyles } from "@material-ui/styles"
import { Checkbox } from "@material-ui/core"

const useStyles = makeStyles((theme) => ({
  root: {
    color: theme.status.danger
  }
}))

const TestButton = (theme) => {
  const classes = useStyles();

  return (
    <Checkbox defaultChecked className={ classes.root } />
  )
}

export default TestButton