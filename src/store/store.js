import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../controllers/authController";

export const store = configureStore({
    reducer: {
        auth: authReducer,
    },
});