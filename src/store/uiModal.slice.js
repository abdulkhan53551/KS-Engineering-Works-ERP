// store/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const uiModalSlice = createSlice({
    name: 'ui',
    initialState: {
        isLoading: false,
        modalLoadingKey: null, // allows multiple operations to be tracked uniquely if needed
    },
    reducers: {
        setLoading(state, action) {
            state.isLoading = action.payload;
        },
        setModalLoading(state, action) {
            state.modalLoadingKey = action.payload.key;
            state.isLoading = action.payload.isLoading;
        },
        clearLoading(state) {
            state.isLoading = false;
            state.modalLoadingKey = null;
        }
    },
});

export const { setLoading, setModalLoading, clearLoading } = uiModalSlice.actions;
const uiModalReducer = uiModalSlice.reducer
export default uiModalReducer;