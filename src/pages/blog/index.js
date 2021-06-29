import React from "react"
import { graphql } from "gatsby"

import Layout from "../../components/Layout"

const Blog = ({ data }) => {
  return (
  <Layout>
    <h1>Blog</h1>
    { console.log(data) }
  </Layout>
  )
}

export const AllBlogsQuery = graphql`
  query AllBlogPosts {
    allMarkdownRemark {
      edges {
        node {
          frontmatter {
            path
            date
            title
            description
            author
            tags
          }
        }
      }
    }
  }
`
export default Blog