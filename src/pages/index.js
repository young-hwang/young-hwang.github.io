import React from "react"
import { graphql } from "gatsby"
import { makeStyles } from "@material-ui/core"
import { Checkbox } from "@material-ui/core"

import Layout from "../components/Layout"
import TestButton from "../components/TestButton"

const Home = () => {
  return (
    <Layout>
      <h1>Home</h1>
      <TestButton />
    </Layout>
  )
}

export default Home;