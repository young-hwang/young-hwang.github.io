import React from 'react'

import {
  Avatar,
  Box,
  Button,
  Typography,
  Hidden,
  Drawer
} from '@material-ui/core'

const user = {
  avatar: '../../images/avatars/avatar01.jpg',
  job: 'Developer',
  name: 'Young Hwang'
}

const Sidebar = () => {
  return (
    <>
    <Hidden lgUp>
      <Drawer
        variant="permanent"
        anchor="left"
        PaperProps={{
            sx: {
              width: 256,
              top: 64,
              height: 'calc(100% - 64px)'
            }
          }}
      >
        test
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
            </Box>
        </Box>
      </Drawer>
    </Hidden>
    </>
  )
}

export default Sidebar