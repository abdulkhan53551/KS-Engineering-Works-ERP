import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

// Login
export const getUserProfile = asyncHandler(async () => {
  const res = await api.request({
    url: '/users/current-user',
    method: requestMethod.GET
  });

  return res.data;
})

// Get state
export const getState = asyncHandler(async () => {
  const res = await api.request({
    url: '/masters/states',
    method: requestMethod.GET
  });

  return res.data;
});

// Get city
export const getCity = asyncHandler(async (selectedState) => {
  const res = await api.request({
    url: `/masters/states/${selectedState}/cities`,
    method: requestMethod.GET
  });

  return res.data;
});