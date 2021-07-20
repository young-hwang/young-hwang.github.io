import { createMuiTheme } from "@material-ui/core/styles"
import { colors } from "@material-ui/core"

const theme = createMuiTheme({
  overrides: {
    MuiCssBaseline: {
      '@global': {
        ul: {
          listStyleType: 'none'
        },
        li: {
          float: 'left'
        }
      }
    }
  },
  palette: {
    background: {
      default: '#F4F6F8',
      paper: colors.common.white
    },
  },
  status: {
    danger: colors.orange[700],
    drawerWidth: 240
  }
})

export default theme;