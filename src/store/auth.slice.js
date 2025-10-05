import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isAuthenticated: false,
    user: null,
    accessToken: null
};
const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAccessToken: (state, action) => {
            state.accessToken = action.payload;
            state.isAuthenticated = true;
        },
        loginSuccess: (state, action) => {
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.user = null;
            state.accessToken = null;
        },
    }
});

export const { setAccessToken, loginSuccess, logout } = authSlice.actions;
const authReducer = authSlice.reducer
export default authReducer;