import axiosInstance from "./AxiosCustom";

// Get data
export const getRequest = (endpoint, params = {}) => {
  return axiosInstance.get(endpoint, params);
};

// Post Data with optional data
export const postRequest = (endpoint, params = {}) => {
  return axiosInstance.post(endpoint, params);
};

// Put Data with optional data
export const putRequest = (endpoint, params = {}) => {
  return axiosInstance.put(endpoint, params);
};

// Delete Data with optional data
export const deleteRequest = (endpoint, params = {}) => {
  return axiosInstance.delete(endpoint, params);
};
