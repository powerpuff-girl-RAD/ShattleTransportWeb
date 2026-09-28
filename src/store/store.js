import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../controllers/authController";
import employeeReducer from "../controllers/employeeController";
import routeReducer from "../controllers/routeController";
import scheduleReducer from "../controllers/scheduleController";
import vehicleReducer from "../controllers/vehicleController";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        employees: employeeReducer,
        routes: routeReducer,
        schedules: scheduleReducer,
        vehicles: vehicleReducer,
    },
});