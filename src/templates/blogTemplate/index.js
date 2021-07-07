import React from "react"
import { graphql, Link } from "gatsby"

import Button from "@material-ui/core/Button"

import Layout from "../../components/Layout"

const Template = ({ data }) => {
  const post = data.markdownRemark
  const { title, author, date } = post.frontmatter

  return (
    <Layout>
      <div className="blogTemplate">
        <Link to="/blog"><Button>Back to blogs</Button></Link>
        <h1>{title}</h1>
        <p>Posted by {author} on {date}</p>
        <div dangerouslySetInnerHTML={{__html: post.html}} />
      </div>
    </Layout>
  )
}

export const postQuery = graphql`
  query BlogPost($path:String!) {
    markdownRemark(frontmatter: {path: {eq: $path}}) {
      frontmatter {
  			author
        date
        title
        path
    	}
      html
    }
  }
`

export default Template