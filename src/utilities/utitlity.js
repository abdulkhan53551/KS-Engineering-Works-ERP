export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
import { jwtDecode } from "jwt-decode";

export const decodeToken = (token) => {
  try {
    return jwtDecode(token);
  } catch {
    return null
  }
}