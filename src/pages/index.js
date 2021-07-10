import React from "react"
import { graphql } from "gatsby"
import { makeStyles } from "@material-ui/core"
import { Checkbox } from "@material-ui/core"

import Layout from "../components/Layout"

const useStyles = makeStyles((theme) => {
  root: {
  }
})
const Home = () => {
  const classes = useStyles()

  return (
    <Layout>
      <h1>Home</h1>
      <Checkbox defaultChecked classes={{ root: classes.root }} />
    </Layout>
  )
}

export default Home;