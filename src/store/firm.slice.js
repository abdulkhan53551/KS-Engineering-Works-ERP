import { createSlice } from "@reduxjs/toolkit";
import { localStorageKey } from "../utilities/constant/constants";

const getSavedJson = (key) => {
    if (typeof window === "undefined") return null;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch {
        return null;
    }
};

const initialState = {
    activeFirm: getSavedJson(localStorageKey.ACTIVE_FIRM_KEY),
    activeBranch: getSavedJson(localStorageKey.ACTIVE_BRANCH_KEY), // null = "All Branches"
    userFirms: []
};

const firmSlice = createSlice({
    name: "firm",
    initialState,
    reducers: {
        setActiveFirm: (state, action) => {
            state.activeFirm = action.payload;
            if (typeof window !== "undefined") {
                if (action.payload) {
                    localStorage.setItem(localStorageKey.ACTIVE_FIRM_KEY, JSON.stringify(action.payload));
                } else {
                    localStorage.removeItem(localStorageKey.ACTIVE_FIRM_KEY);
                }
            }
        },
        setActiveBranch: (state, action) => {
            state.activeBranch = action.payload; // null = "All Branches"
            if (typeof window !== "undefined") {
                if (action.payload) {
                    localStorage.setItem(localStorageKey.ACTIVE_BRANCH_KEY, JSON.stringify(action.payload));
                } else {
                    localStorage.removeItem(localStorageKey.ACTIVE_BRANCH_KEY);
                }
            }
        },
        setUserFirms: (state, action) => {
            state.userFirms = action.payload || [];

            // If activeFirm is currently 'all', retain it (for consolidated view)
            if (state.activeFirm?.id === 'all') {
                return;
            }

            // If activeFirm is not set or not in userFirms, auto-select first available
            if (state.userFirms.length > 0) {
                const existing = state.userFirms.find(f => f.id === state.activeFirm?.id);
                if (!existing) {
                    const defaultFirm = state.userFirms.find(f => f.isDefault) || state.userFirms[0];
                    state.activeFirm = defaultFirm;
                    if (typeof window !== "undefined") {
                        localStorage.setItem(localStorageKey.ACTIVE_FIRM_KEY, JSON.stringify(defaultFirm));
                    }

                    // Default to head office branch
                    const defaultBranch = defaultFirm?.branches?.find(b => b.isHeadOffice) || defaultFirm?.branches?.[0] || null;
                    state.activeBranch = defaultBranch;
                    if (typeof window !== "undefined" && defaultBranch) {
                        localStorage.setItem(localStorageKey.ACTIVE_BRANCH_KEY, JSON.stringify(defaultBranch));
                    }
                }
            }
        },
        clearFirmState: (state) => {
            state.activeFirm = null;
            state.activeBranch = null;
            state.userFirms = [];
            if (typeof window !== "undefined") {
                localStorage.removeItem(localStorageKey.ACTIVE_FIRM_KEY);
                localStorage.removeItem(localStorageKey.ACTIVE_BRANCH_KEY);
            }
        }
    }
});

export const { setActiveFirm, setActiveBranch, setUserFirms, clearFirmState } = firmSlice.actions;
const firmReducer = firmSlice.reducer;
export default firmReducer;
