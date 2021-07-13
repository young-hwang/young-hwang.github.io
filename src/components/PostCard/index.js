import React from 'react'
import { Link } from 'gatsby'

import Button from '@material-ui/core/Button'

const PostCard = ({ title, author, date, description, path }) => {
  return (
    <div className="post">
      <h3 className="post-title">{ title }</h3>
      <p className="post-description">{ description }</p>
      <p className="post-written-by">Written by { author } on { date }</p>
      <Button>test</Button>
      <Link to={ path }>Read more</Link>
    </div>
  )
}

export default PostCard;