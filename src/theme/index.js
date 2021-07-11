import { createMuiTheme } from "@material-ui/core/styles"
import { colors } from "@material-ui/core"

const theme = createMuiTheme({
  palette: {
    background: {
      default: '#F4F6F8',
      paper: colors.common.white
    },
  },
  status: {
    danger: colors.orange[700]
  }
})

export default theme;