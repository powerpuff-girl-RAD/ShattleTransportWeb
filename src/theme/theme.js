import {
    createTheme,
} from "@mui/material/styles";

const theme = createTheme({

    palette: {

        primary: {
            main: "#1976d2",
        },

        secondary: {
            main: "#9c27b0",
        },

        background: {
            default: "#f5f6fa",
        },
    },

    typography: {

        fontFamily:
            "Roboto, Arial, sans-serif",

        h5: {
            fontWeight: 600,
        },
    },

    shape: {
        borderRadius: 8,
    },
});

export default theme;