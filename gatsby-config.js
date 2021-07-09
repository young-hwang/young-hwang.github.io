/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.com/docs/gatsby-config/
 */
const config = require('./config');

module.exports = {
  siteMetadata: {
    title: config.siteTitle,
    description: config.siteDescription
  },
  /* Your site config here */
  plugins: [
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        footnotes: true,
        gfm: true,
      }
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `pages`,
        path: `${__dirname}/contents`
      }
    },
    {
      resolve: `gatsby-plugin-material-ui`,
      options: {
      }
    }
  ],
}
