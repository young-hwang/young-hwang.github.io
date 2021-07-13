import React from 'react'

import {
  Avatar,
  Box,
  Button,
  Typography
} from '@material-ui/core'

const user = {
  avatar: '../../images/avatars/avatar01.jpg',
  job: 'Developer',
  name: 'Young Hwang'
}

const Sidebar = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          p: 2
        }}
      >
        <Avatar
          src={user.avatar}
          to="/contact"
        />
        <Typography
          color="textPrimary"
          variant="h5"
        >
          { user.name }
        </Typography>
        Test
        </Box>
    </Box>
  )
}

export default Sidebar