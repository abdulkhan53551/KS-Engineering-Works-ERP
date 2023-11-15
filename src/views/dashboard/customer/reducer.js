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
      successCustomerAdd: (state, action) => {
        state.initCustomerAdd = true;
        state.customerAddData = action.payload;
        state.isFailCustomerAdd = true
      },
    },
  });
  
  export default customerSlice.reducer;