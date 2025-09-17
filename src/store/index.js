// import { createStore, combineReducers } from 'redux'
// import Mode from './setting/setting'
// export default createStore(
//     combineReducers({
//         mode: Mode
//     })
// )


import { configureStore } from '@reduxjs/toolkit';
import settingReducer from './setting/reducers';
import customerReducer from './customer.slice';
import authReducer from './auth.slice';
import userReducer from './user.slice';

export const store = configureStore({
  reducer: {
    setting: settingReducer,
    customer: customerReducer,
    authReducer: authReducer,
    userReducer: userReducer,
  },
  devTools: process.env.NODE_ENV !== "production", // enable only in dev
});
