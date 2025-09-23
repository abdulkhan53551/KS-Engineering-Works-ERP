export const ACCESS_TOKEN_KEY = "accessToken";

// 🔹 Save token to state + localStorage
export const saveToken = (newToken) => {
  if (newToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

// 🔹 Login (fake for now, just sets token)
export const login = (fakeToken) => {
  saveToken(fakeToken);
};

// 🔹 Logout
export const logout = () => {
  saveToken(null);
};