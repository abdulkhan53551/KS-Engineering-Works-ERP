import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    // Add customer
    initCustomerAdd: false,
    customerAddData: {},
    isFailCustomerAdd: false
}

export const customerSlice = createSlice({
    name: 'customer',
    initialState,
    reducers: {
        initCustomerAdd: (state, action) => {
            state.initCustomerAdd = true;
            state.customerAddData = {};
            state.isFailCustomerAdd = false
        },
        successCustomerAdd: (state, action) => {
            state.initCustomerAdd = false;
            state.customerAddData = action.payload;
            state.isFailCustomerAdd = false
        },
        failCustomerAdd: (state, action) => {
            state.initCustomerAdd = false;
            state.customerAddData = {};
            state.isFailCustomerAdd = true
        },
    },
    // extraReducers: (builder) => {
    //   builder
    //     .addCase(fetchInvoices.pending, (state) => {
    //       state.loading = true;
    //     })
    //     .addCase(fetchInvoices.fulfilled, (state, action) => {
    //       state.loading = false;
    //       state.list = action.payload;
    //     })
    //     .addCase(fetchInvoices.rejected, (state, action) => {
    //       state.loading = false;
    //       state.error = action.error.message;
    //     });
    // },
});

export const { initCustomerAdd, successCustomerAdd, failCustomerAdd } = customerSlice.actions;
const customerReducer = customerSlice.reducer
export default customerReducer;