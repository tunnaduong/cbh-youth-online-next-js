import * as Api from "../services/api/ApiByAxios";

// Authentication
export const loginRequest = async (params) => {
  try {
    const response = await Api.postRequest("/login", params);
    return response;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    } else if (
      error.response &&
      error.response.data &&
      error.response.data.message
    ) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error("Đã có lỗi không mong muốn xảy ra.");
    }
  }
};

export const logoutRequest = () => {
  return Api.postRequest("/logout");
};

export const signupRequest = (params) => {
  return Api.postRequest("/register", params);
};

export const getHomePosts = () => {
  return Api.getRequest("/topics");
};
