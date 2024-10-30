import * as Api from "../services/api/ApiByAxios";

// Authentication
export const loginRequest = async (params) => {
  try {
    const response = await Api.postRequest("/v1.0/login", params);
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
  return Api.postRequest("/v1.0/logout");
};

export const signupRequest = (params) => {
  return Api.postRequest("/v1.0/register", params);
};

export const getHomePosts = () => {
  return Api.getRequest("/v1.0/topics");
};

export const incrementPostView = (id) => {
  return Api.postRequest("/v1.0/topics/" + id + "/views");
};

export const incrementPostViewAuthenticated = (id) => {
  return Api.postRequest("/v1.0/topics/" + id + "/views/authenticated");
};

export const votePost = (id, params) => {
  return Api.postRequest("/v1.0/topics/" + id + "/votes", params);
};

export const savePost = (id) => {
  return Api.postRequest("/v1.0/user/saved-topics", { topic_id: id });
};

export const unsavePost = (id) => {
  return Api.deleteRequest("/v1.0/user/saved-topics/" + id);
};

export const createPost = (params) => {
  return Api.postRequest("/v1.0/user/saved-topics", params);
};

export const verifyEmail = (token) => {
  return Api.getRequest("/email/verify/" + token);
};
