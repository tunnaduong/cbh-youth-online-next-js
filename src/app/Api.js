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

export const deletePost = (id) => {
  return Api.deleteRequest("/v1.0/topics/" + id);
};

export const updatePost = (id, params) => {
  return Api.postFormDataRequest("/v1.0/topics/" + id, params);
};

export const verifyEmail = (token) => {
  return Api.getRequest("/v1.0/email/verify/" + token);
};

export const resendVerificationEmail = () => {
  return Api.postRequest("/v1.0/email/resend-verification");
};

export const getCurrentUser = () => {
  return Api.getRequest("/v1.0/user");
};

export const getUserProfile = (username) => {
  return Api.getRequest(`/v1.0/users/${username}/profile`);
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

export const getMessages = (conversationId, page = 1) => {
  return Api.getRequest(`/v1.0/chat/conversations/${conversationId}/messages`, {
    page,
  });
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

// Public Chat (accessible to everyone, no auth required)
export const getPublicChatMessages = (page = 1) => {
  return Api.getRequest(`/v1.0/chat/public/messages?page=${page}`);
};

export const sendPublicMessage = (params) => {
  return Api.postRequest("/v1.0/chat/public/messages", params);
};

export const getPublicChatParticipants = () => {
  return Api.getRequest("/v1.0/chat/public/participants");
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

export const getPostUrl = (params) => {
  return Api.getRequest("/v1.0/post-url", params);
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
  return Api.postFormDataRequest(`/v1.0/users/${username}/avatar`, params);
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

export const deleteAccount = (params) => {
  return Api.postRequest("/v1.0/user/delete-account", params);
};

// Notification Settings
export const getNotificationSettings = () => {
  return Api.getRequest("/v1.0/notification-settings");
};

export const updateNotificationSettings = (params) => {
  return Api.putRequest("/v1.0/notification-settings", params);
};

// Notifications
export const getNotifications = (params = {}) => {
  return Api.getRequest("/v1.0/notifications", params);
};

export const getUnreadNotificationCount = () => {
  return Api.getRequest("/v1.0/notifications/unread-count");
};

export const markNotificationAsRead = (id) => {
  return Api.postRequest(`/v1.0/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = () => {
  return Api.postRequest("/v1.0/notifications/read-all");
};

export const deleteNotification = (id) => {
  return Api.deleteRequest(`/v1.0/notifications/${id}`);
};

// Push Notification Subscriptions
export const subscribeToPushNotifications = (subscription) => {
  return Api.postRequest("/v1.0/notifications/subscribe", subscription);
};

export const unsubscribeFromPushNotifications = (endpoint = null) => {
  return Api.deleteRequest("/v1.0/notifications/unsubscribe", {
    endpoint: endpoint,
  });
};

export const getNotificationSubscriptions = () => {
  return Api.getRequest("/v1.0/notifications/subscriptions");
};

export const getVapidPublicKey = () => {
  return Api.getRequest("/v1.0/notifications/vapid-public-key");
};

// Study Materials
export const getStudyMaterials = (params = "") => {
  return Api.getRequest(`/v1.0/study-materials${params ? `?${params}` : ""}`);
};

export const getStudyMaterial = (id) => {
  return Api.getRequest(`/v1.0/study-materials/${id}`);
};

export const createStudyMaterial = (params) => {
  return Api.postRequest("/v1.0/study-materials", params);
};

export const updateStudyMaterial = (id, params) => {
  return Api.putRequest(`/v1.0/study-materials/${id}`, params);
};

export const deleteStudyMaterial = (id) => {
  return Api.deleteRequest(`/v1.0/study-materials/${id}`);
};

export const purchaseMaterial = (id) => {
  return Api.postRequest(`/v1.0/study-materials/${id}/purchase`);
};

export const downloadMaterial = (id) => {
  return Api.getRequest(`/v1.0/study-materials/${id}/download`);
};

export const viewMaterial = (id) => {
  return Api.postRequest(`/v1.0/study-materials/${id}/view`);
};

export const getMaterialPreview = (id) => {
  return Api.getRequest(`/v1.0/study-materials/${id}/preview`);
};

export const getUserStudyMaterials = (username) => {
  return Api.getRequest(`/v1.0/users/${username}/study-materials`);
};

// Study Material Ratings
export const rateMaterial = (materialId, params) => {
  return Api.postRequest(`/v1.0/study-materials/${materialId}/ratings`, params);
};

export const updateRating = (id, params) => {
  return Api.putRequest(`/v1.0/ratings/${id}`, params);
};

export const deleteRating = (id) => {
  return Api.deleteRequest(`/v1.0/ratings/${id}`);
};

export const getMaterialRatings = (materialId, params = "") => {
  return Api.getRequest(
    `/v1.0/study-materials/${materialId}/ratings${params ? `?${params}` : ""}`
  );
};

// Wallet
export const getWalletBalance = () => {
  return Api.getRequest("/v1.0/wallet/balance");
};

export const getWalletTransactions = (params = "") => {
  return Api.getRequest(
    `/v1.0/wallet/transactions${params ? `?${params}` : ""}`
  );
};

export const requestWithdrawal = (params) => {
  return Api.postRequest("/v1.0/wallet/withdrawal-request", params);
};

export const getWithdrawalRequests = () => {
  return Api.getRequest("/v1.0/wallet/withdrawal-requests");
};

export const cancelWithdrawalRequest = (id) => {
  return Api.postRequest(`/v1.0/wallet/withdrawal-requests/${id}/cancel`);
};

export const getWithdrawalHistory = () => {
  return Api.getRequest("/v1.0/wallet/withdrawal-history");
};

export const createDepositRequest = (params) => {
  return Api.postRequest("/v1.0/wallet/deposit-request", params);
};

// Study Material Categories
export const getStudyMaterialCategories = () => {
  return Api.getRequest("/v1.0/study-material-categories");
};

export const getStudyMaterialCategory = (id) => {
  return Api.getRequest(`/v1.0/study-material-categories/${id}`);
};
// Gift Shop
export const getShopProducts = (params = "") => {
  return Api.getRequest(`/v1.0/shop/products${params ? `?${params}` : ""}`);
};

export const getShopProduct = (id) => {
  return Api.getRequest(`/v1.0/shop/products/${id}`);
};

export const getShopCategories = () => {
  return Api.getRequest("/v1.0/shop/categories");
};

export const placeShopOrder = (params) => {
  return Api.postRequest("/v1.0/shop/orders", params);
};

export const getMyShopOrders = (params = "") => {
  return Api.getRequest(`/v1.0/shop/my-orders${params ? `?${params}` : ""}`);
};
