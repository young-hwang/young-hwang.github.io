const path = require('path')

exports.createPages = ({ boundActionCreators, graphql }) => {
  const { createPages } = boundActionCreators;

  const postTemplate = path.resolve('src/tedmplates/blogTemplate')
}

return graphql(`
  {
    allMarkdownRemark {
      edges {
        node {
          frontmatter {
            path
          }
        }
      }
    }
  }
`).then(res => {
  if (res.errors) { return Promise.reject(res.errors) }

  res.data.allMarkdownRemark.edges.forEach(({ node }) => {
    createPages({
      path: node.frontmatter.path,
      components: postTemplate
    })
  })
})