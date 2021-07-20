import React from 'react'
import { makeStyles } from '@material-ui/styles'

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

const useStyles = makeStyles((theme) => ({
  drawer: {
    flexshrink: 0,
    width: theme.status.drawerWidth
  }
}))

const Sidebar = () => {
  const classes = useStyles()

  return (
    <>
      <Drawer
        className={classes.drawer}
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
    </>
  )
}

export default Sidebar