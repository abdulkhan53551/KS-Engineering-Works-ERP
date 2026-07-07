import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

// Login
export const login = asyncHandler(async (request) => {
  const res = await api.request({
    url: '/auth/login',
    method: requestMethod.POST,
    data: request
  });

  return res.data;
})

// Logout
export const logout = asyncHandler(async () => {
  const res = await api.request({
    url: '/auth/logout',
    method: requestMethod.POST
  });

  return res.data;
});