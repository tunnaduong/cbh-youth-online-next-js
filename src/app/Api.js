import * as Api from "../services/api/ApiByAxios";

// Authentication
export const loginRequest = (params) => {
  return Api.postRequest("/v1.0/login", params);
};

export const logoutRequest = () => {
  return Api.postRequest("/v1.0/logout");
};

export const signupRequest = (params) => {
  return Api.postRequest("/v1.0/register", params);
};

export const getFeedPosts = (page = 1) => {
  return Api.getRequest("/v1.0/topics?page=" + page);
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
  return Api.postRequest("/v1.0/topics", params);
};

export const verifyEmail = (token) => {
  return Api.getRequest("/v1.0/email/verify/" + token);
};

export const forgotPassword = (params) => {
  return Api.postRequest("/v1.0/password/reset", params);
};

export const uploadFile = (formData) => {
  return Api.postFormDataRequest("/v1.0/upload", formData);
};

export const forgotPasswordVerify = (params) => {
  return Api.postRequest("/v1.0/password/reset/verify", params);
};

export const getPostDetail = (id) => {
  return Api.getRequest("/v1.0/topics/" + id);
};

export const commentPost = (id, params) => {
  return Api.postRequest("/v1.0/topics/" + id + "/comments", params);
};

export const voteComment = (id, params) => {
  return Api.postRequest("/v1.0/comments/" + id + "/votes", params);
};

export const getForumCategories = () => {
  return Api.getRequest("/v1.0/forum/categories");
};

export const getForumData = () => {
  return Api.getRequest("/v1.0/forum-data");
};

export const getHomeData = (sort = "latest") => {
  return Api.getRequest(`/v1.0/home?sort=${sort}`);
};

export const getTopUsers = (limit = 8) => {
  return Api.getRequest(`/v1.0/users/ranking?limit=${limit}`);
};

export const getYouthNews = (page = 1) => {
  return Api.getRequest(`/v1.0/youth-news?page=${page}`);
};

// Activities
export const getActivities = () => {
  return Api.getRequest("/v1.0/activities");
};

export const getCommentedPosts = () => {
  return Api.getRequest("/v1.0/activities/commented");
};

export const getLikedPosts = () => {
  return Api.getRequest("/v1.0/activities/liked");
};

export const getCreatedPosts = () => {
  return Api.getRequest("/v1.0/activities/posts");
};

// Online Users
export const trackOnlineUser = () => {
  return Api.postRequest("/v1.0/online-users/track");
};

// Chat
export const getConversations = () => {
  return Api.getRequest("/v1.0/chat/conversations");
};

export const createPrivateConversation = (params) => {
  return Api.postRequest("/v1.0/chat/conversations", params);
};

export const getMessages = (conversationId) => {
  return Api.getRequest(`/v1.0/chat/conversations/${conversationId}/messages`);
};

export const sendMessage = (conversationId, params) => {
  return Api.postRequest(
    `/v1.0/chat/conversations/${conversationId}/messages`,
    params
  );
};

export const markAsRead = (conversationId) => {
  return Api.postRequest(`/v1.0/chat/conversations/${conversationId}/read`);
};

export const createGroupConversation = (params) => {
  return Api.postRequest("/v1.0/chat/groups", params);
};

export const updateGroupConversation = (conversationId, params) => {
  return Api.putRequest(`/v1.0/chat/groups/${conversationId}`, params);
};

export const addGroupParticipants = (conversationId, params) => {
  return Api.postRequest(
    `/v1.0/chat/groups/${conversationId}/participants`,
    params
  );
};

export const removeGroupParticipant = (conversationId, userId) => {
  return Api.deleteRequest(
    `/v1.0/chat/groups/${conversationId}/participants/${userId}`
  );
};

export const deleteMessage = (messageId) => {
  return Api.deleteRequest(`/v1.0/chat/messages/${messageId}`);
};

export const editMessage = (messageId, params) => {
  return Api.putRequest(`/v1.0/chat/messages/${messageId}`, params);
};

export const searchUserForChat = (params) => {
  return Api.getRequest("/v1.0/chat/search/users", params);
};

// Comments
export const getReplies = (commentId) => {
  return Api.getRequest(`/v1.0/comments/${commentId}/replies`);
};

export const updateComment = (id, params) => {
  return Api.putRequest(`/v1.0/comments/${id}`, params);
};

export const destroyComment = (id) => {
  return Api.deleteRequest(`/v1.0/comments/${id}`);
};

export const getVotesForComment = (id) => {
  return Api.getRequest(`/v1.0/comments/${id}/votes`);
};

export const voteOnComment = (id, params) => {
  return Api.postRequest(`/v1.0/comments/${id}/votes`, params);
};

export const destroyCommentVote = (id) => {
  return Api.deleteRequest(`/v1.0/comments/${id}/votes`);
};

// Forum
export const getSubforumsByRole = () => {
  return Api.getRequest("/v1.0/forum/subforums");
};

export const getSubforumPosts = (subforum) => {
  return Api.getRequest(`/v1.0/forum/subforums/${subforum}/topics`);
};

// Search
export const search = (params) => {
  return Api.getRequest("/v1.0/search", params);
};

// Stories
export const getStories = () => {
  return Api.getRequest("/v1.0/stories");
};

export const createStory = (params) => {
  return Api.postFormDataRequest("/v1.0/stories", params);
};

export const getStory = (storyId) => {
  return Api.getRequest(`/v1.0/stories/${storyId}`);
};

export const deleteStory = (storyId) => {
  return Api.deleteRequest(`/v1.0/stories/${storyId}`);
};

export const reactToStory = (storyId, params) => {
  return Api.postRequest(`/v1.0/stories/${storyId}/react`, params);
};

export const removeStoryReaction = (storyId) => {
  return Api.deleteRequest(`/v1.0/stories/${storyId}/react`);
};

export const markStoryAsViewed = (storyId) => {
  return Api.postRequest(`/v1.0/stories/${storyId}/view`);
};

// Topics
export const getComments = (id) => {
  return Api.getRequest(`/v1.0/topics/${id}/comments`);
};

export const addComment = (id, params) => {
  return Api.postRequest(`/v1.0/topics/${id}/comments`, params);
};

export const getViews = (id) => {
  return Api.getRequest(`/v1.0/topics/${id}/views`);
};

export const registerView = (id) => {
  return Api.postRequest(`/v1.0/topics/${id}/views`);
};

export const getVotes = (id) => {
  return Api.getRequest(`/v1.0/topics/${id}/votes`);
};

export const registerVote = (id, params) => {
  return Api.postRequest(`/v1.0/topics/${id}/votes`, params);
};

export const destroyTopicVote = (id) => {
  return Api.deleteRequest(`/v1.0/topics/${id}/votes`);
};

export const getSavedTopics = () => {
  return Api.getRequest("/v1.0/user/saved-topics");
};

export const saveTopicForUser = (params) => {
  return Api.postRequest("/v1.0/user/saved-topics", params);
};

export const destroySavedTopic = (id) => {
  return Api.deleteRequest(`/v1.0/user/saved-topics/${id}`);
};

// Users
export const getAvatar = (username) => {
  return Api.getRequest(`/v1.0/users/${username}/avatar`);
};

export const updateAvatar = (username, params) => {
  return Api.postRequest(`/v1.0/users/${username}/avatar`, params);
};

export const followUser = (username) => {
  return Api.postRequest(`/v1.0/users/${username}/follow`);
};

export const getProfile = (username) => {
  return Api.getRequest(`/v1.0/users/${username}/profile`);
};

export const updateProfile = (username, params) => {
  return Api.putRequest(`/v1.0/users/${username}/profile`, params);
};

export const unfollowUser = (username) => {
  return Api.deleteRequest(`/v1.0/users/${username}/unfollow`);
};
