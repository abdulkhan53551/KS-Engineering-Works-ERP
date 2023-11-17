import { customerSlice } from "./reducer";

export const {
    // Add customer
    initCustomerAdd,
    successCustomerAdd,
    failCustomerAdd
} = customerSlice.actions;
export default customerSlice.actions