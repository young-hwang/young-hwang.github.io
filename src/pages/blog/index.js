import React from "react"
import { graphql } from "gatsby"

import Layout from "../../components/Layout"
import PostCard from "../../components/PostCard"

const Blog = ({ data }) => {
  return (
  <Layout>
    <h1>Blog</h1>
    {
      data.allMarkdownRemark.edges.map(post => {
        const { title, author, date, description, path } = post.node.frontmatter;

        return(
          <PostCard
            title={title}
            author={author}
            date={date}
            description={description}
            path={path}
            key={`${date}__${title}`}
          />
        )
      })
    }
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