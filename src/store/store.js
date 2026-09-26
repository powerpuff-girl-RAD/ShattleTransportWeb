import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../controllers/authController";
import employeeReducer from "../controllers/employeeController";
import routeReducer from "../controllers/routeController";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        employees: employeeReducer,
        routes: routeReducer,
    },
});