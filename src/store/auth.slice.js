import { createSlice } from "@reduxjs/toolkit";
import { localStorageKey } from "../utilities/constant/constants";

const initialState = {
    isAuthenticated: false,
    user: null,
    accessToken: typeof window !== "undefined" ? localStorage.getItem(localStorageKey.ACCESS_TOKEN_KEY) || null : null,
    isInitializing: true
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAccessToken: (state, action) => {
            state.accessToken = action.payload;
            if (state.user) {
                state.isAuthenticated = true;
            }
        },
        loginSuccess: (state, action) => {
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
            state.isAuthenticated = !!action.payload.user;
            state.isInitializing = false;
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.user = null;
            state.accessToken = null;
            state.isInitializing = false;
        },
        setInitialized: (state) => {
            state.isInitializing = false;
        }
    }
});

export const { setAccessToken, loginSuccess, logout, setInitialized } = authSlice.actions;
const authReducer = authSlice.reducer;
export default authReducer;