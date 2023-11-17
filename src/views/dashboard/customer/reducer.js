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
});

export default customerSlice.reducer;