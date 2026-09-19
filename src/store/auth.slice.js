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
        },
        updateActiveRole: (state, action) => {
            if (state.user) {
                if (action.payload.role) state.user.role = action.payload.role;
                if (action.payload.roleId) state.user.roleId = action.payload.roleId;
                if (action.payload.roleName) state.user.roleName = action.payload.roleName;
                if (action.payload.roleSlug) state.user.roleSlug = action.payload.roleSlug;
                if (action.payload.dataScope) state.user.dataScope = action.payload.dataScope;
                if (action.payload.permissions) state.user.permissions = action.payload.permissions;
                if (action.payload.firmId !== undefined) state.user.firmId = action.payload.firmId;
                if (action.payload.branchId !== undefined) state.user.branchId = action.payload.branchId;
            }
        }
    }
});

export const { setAccessToken, loginSuccess, logout, setInitialized, updateActiveRole } = authSlice.actions;
const authReducer = authSlice.reducer;
export default authReducer;