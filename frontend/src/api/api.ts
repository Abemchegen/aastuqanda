// api.ts
// Main API endpoints for posts, spaces, comments, profiles, and notifications

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";
// Spaces
export const getSpaces = async () => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("campusloop_access_token")
      : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const response = await axios.get(`${API_BASE}/spaces`, { headers });
  console.log("getSpaces response", response.data);
  return response.data;
};

export const getSpaceById = async (spaceId: string) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("campusloop_access_token")
      : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const response = await axios.get(`${API_BASE}/spaces/${spaceId}`, {
    headers,
  });
  console.log("getSpaceById response", response.data);
  return response.data;
};

export const requestNewSpace = async (
  data: { name: string; description: string; image?: string },
  token: string
) => {
  const response = await axios.post(`${API_BASE}/spaces/request`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("requestNewSpace response", response.data);
  return response.data;
};

export const uploadSpaceImage = async (file: File, token: string) => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await axios.post(`${API_BASE}/spaces/images`, formData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("uploadSpaceImage response", response.data);
  return response.data;
};

export const updateSpaceImage = async (
  spaceId: string,
  image: string,
  token: string
) => {
  const response = await axios.put(
    `${API_BASE}/spaces/${spaceId}/image`,
    { image },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log("updateSpaceImage response", response.data);
  return response.data;
};

export const deleteSpaceImage = async (spaceId: string, token: string) => {
  const response = await axios.delete(`${API_BASE}/spaces/${spaceId}/image`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("deleteSpaceImage response", response.data);
  return response.data;
};
export const deleteSpace = async (
  spaceId: string,
  token: string,
) => {
  const response = await axios.delete(
    `${API_BASE}/spaces/${spaceId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log("deleteSpace response", response.data);
  return response.data;
};

export const joinSpace = async (spaceId: string, token: string) => {
  const response = await axios.post(
    `${API_BASE}/spaces/${spaceId}/join`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log("joinSpace response", response.data);
  return response.data;
};

// Posts
export const getPosts = async () => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("campusloop_access_token")
      : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const response = await axios.get(`${API_BASE}/posts`, { headers });
  console.log("getPosts response", response.data);
  return response.data;
};

// Get posts with pagination and sorting
export const getPostsPaged = async (
  params: { page?: number; limit?: number; sort?: "hot" | "new" | "top"; spaceSlug?: string }
) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("campusloop_access_token")
      : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const response = await axios.get(`${API_BASE}/posts`, { params, headers });
  console.log("getPostsPaged response", response.data);
  return response.data;
};

export const getPostById = async (postId: string) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("campusloop_access_token")
      : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const response = await axios.get(`${API_BASE}/posts/${postId}`, { headers });
  console.log("getPostById response", response.data);
  return response.data;
};

export const createPost = async (
  data: { title: string; content: string; spaceId: string },
  token: string
) => {
  const response = await axios.post(`${API_BASE}/posts`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("createPost response", response.data);
  return response.data;
};

export const uploadPostImages = async (
  files: File[],
  token: string
) => {
  const formData = new FormData();
  files.forEach((f) => formData.append("images", f));
  const response = await axios.post(`${API_BASE}/posts/images`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  console.log("uploadPostImages response", response.data);
  return response.data;
};

export const deletePost = async (postId: string, token: string) => {
  const response = await axios.delete(`${API_BASE}/posts/${postId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("deletePost response", response.data);
  return response.data;
};

// Voting
export const votePost = async (
  postId: string,
  data: { type: "upvote" | "downvote" | "none" },
  token: string
) => {
  const response = await axios.post(`${API_BASE}/posts/${postId}/vote`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("votePost response", response.data);
  return response.data;
};

// Save/Unsave post (bookmark)
export const savePost = async (postId: string, token: string) => {
  const response = await axios.post(
    `${API_BASE}/posts/${postId}/save`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log("savePost response", response.data);
  return response.data;
};

export const unsavePost = async (postId: string, token: string) => {
  const response = await axios.post(
    `${API_BASE}/posts/${postId}/unsave`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log("unsavePost response", response.data);
  return response.data;
};

// Comments
export const getComments = async (postId: string) => {
  const response = await axios.get(`${API_BASE}/posts/${postId}/comments`);
  console.log("getComments response", response.data);
  return response.data;
};

export const createComment = async (
  postId: string,
  data: { content: string; parentId?: string },
  token: string
) => {
  const response = await axios.post(`${API_BASE}/posts/${postId}/comments`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("createComment response", response.data);
  return response.data;
};
export const updatePost = async (
  postId: string,
  data: { title?: string; content?: string },
  token: string
) => {
  const res = await axios.put(`${API_BASE}/posts/${postId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("updatePost response", res.data);
  return res.data;
};
export const updateComment = async (
  postId: string,
  commentId: string,
  content: string,
  token: string
) => {
  const res = await axios.put(
    `${API_BASE}/posts/${postId}/comments/${commentId}`,
    { content },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log("updateComment response", res.data);
  return res.data;
};

export const deleteComment = async (
  postId: string,
  commentId: string,
  token: string
) => {
  const response = await axios.delete(
    `${API_BASE}/posts/${postId}/comments/${commentId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log("deleteComment response", response.data);
  return response.data;
};

// User Profiles
export const getUserProfile = async (username: string) => {
  const response = await axios.get(`${API_BASE}/profiles/${username}`);
  console.log("getUserProfile response", response.data);
  return response.data;
};

export const getUserPostsByUsername = async (username: string) => {
  const response = await axios.get(`${API_BASE}/profiles/${username}/posts`);
  console.log("getUserPostsByUsername response", response.data);
  return response.data;
};

export const getUserCommentsByUsername = async (username: string) => {
  const response = await axios.get(`${API_BASE}/profiles/${username}/comments`);
  console.log("getUserCommentsByUsername response", response.data);
  return response.data;
};

export const updateProfile = async (
  data: { bio?: string; avatar?: string },
  token: string
) => {
  const response = await axios.put(`${API_BASE}/profiles/update`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("updateProfile response", response.data);
  return response.data;
};

// Avatar upload
export const uploadAvatar = async (file: File, token: string) => {
  const formData = new FormData();
  formData.append("avatar", file);
  const response = await axios.post(`${API_BASE}/profiles/avatar`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  console.log("uploadAvatar response", response.data);
  return response.data;
};

// Notifications
export const getNotifications = async (token: string) => {
  const response = await axios.get(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("getNotifications response", response.data);
  return response.data;
};

export const markNotificationAsRead = async (
  notificationId: string,
  token: string
) => {
  const response = await axios.post(
    `${API_BASE}/notifications/${notificationId}/read`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log("markNotificationAsRead response", response.data);
  return response.data;
};

export const getUnreadNotificationCount = async (token: string) => {
  const response = await axios.get(`${API_BASE}/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("getUnreadNotificationCount response", response.data);
  return response.data;
};

// Tags removed: no-op helpers retained for backward compatibility
export const getTags = async () => {
  console.log("getTags response", []);
  return [];
};

export const getPostsByTag = async (_tag: string) => {
  const response = await axios.get(`${API_BASE}/posts`);
  console.log("getPostsByTag response", response.data);
  return response.data;
};

// Space membership
export const leaveSpace = async (spaceId: string, token: string) => {
  const response = await axios.post(
    `${API_BASE}/spaces/${spaceId}/leave`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log("leaveSpace response", response.data);
  return response.data;
};

export const getMySpaces = async (token: string) => {
  const response = await axios.get(`${API_BASE}/users/me/spaces`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("getMySpaces response", response.data);
  return response.data;
};

export const getMyPosts = async (token: string) => {
  const response = await axios.get(`${API_BASE}/users/me/posts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("getMyPosts response", response.data);
  return response.data;
};

export const getMyComments = async (token: string) => {
  const response = await axios.get(`${API_BASE}/users/me/comments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("getMyComments response", response.data);
  return response.data;
};

export const getMySavedPosts = async (token: string) => {
  const response = await axios.get(`${API_BASE}/users/me/saved-posts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("getMySavedPosts response", response.data);
  return response.data;
};
