import {
    createTheme,
} from "@mui/material/styles";

const theme = createTheme({

    palette: {

        primary: {
            main: "#064b43",
        },

        secondary: {
            main: "#f4a51c",
        },

        background: {
            default: "#edf6f1",
        },
    },

    typography: {

        fontFamily:
            '"Segoe UI", "Helvetica Neue", sans-serif',

        h5: {
            fontWeight: 600,
        },
    },

    shape: {
        borderRadius: 8,
    },
});

export default theme;