// use-api.ts
// React hooks wrapping main API calls: spaces, posts, comments, profiles, notifications

import { useState } from "react";
import {
  getSpaces,
  getSpaceById,
  requestNewSpace,
  joinSpace,
  leaveSpace,
  getMySpaces,
  getPosts,
  getPostsPaged,
  getPostById,
  createPost,
  deletePost,
  votePost,
  savePost,
  unsavePost,
  getComments,
  createComment,
  deleteComment,
  getUserProfile,
  updateProfile,
  uploadAvatar,
  getNotifications,
  markNotificationAsRead,
  getUnreadNotificationCount,
  getMyPosts,
  getMyComments,
  getMySavedPosts,
  updatePost,
  updateComment,
} from  "../api/api"

export const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = async (fn: Function, ...args: any[]) => {
    try {
      setLoading(true);
      return await fn(...args);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,

    // Spaces
    fetchSpaces: () => call(getSpaces),
    fetchSpaceById: (id: string) => call(getSpaceById, id),
    createSpaceRequest: (
      data: { name: string; description: string },
      token: string
    ) => call(requestNewSpace, data, token),
    joinSpace: (id: string, token: string) => call(joinSpace, id, token),
    leaveSpace: (id: string, token: string) => call(leaveSpace, id, token),
    fetchMySpaces: (token: string) => call(getMySpaces, token),
    fetchMyPosts: (token: string) => call(getMyPosts, token),
    fetchMyComments: (token: string) => call(getMyComments, token),
    fetchMySavedPosts: (token: string) => call(getMySavedPosts, token),

    // Posts
    fetchPosts: () => call(getPosts),
    fetchPostsPaged: (params: { page?: number; limit?: number; sort?: "hot" | "new" | "top"; spaceSlug?: string }) =>
      call(getPostsPaged, params),
    fetchPostById: (id: string) => call(getPostById, id),
    addPost: (
      data: { title: string; content: string; spaceId: string },
      token: string
    ) => call(createPost, data, token),
    removePost: (id: string, token: string) => call(deletePost, id, token),
    editPost: (id: string, data: { title?: string; content?: string }, token: string) =>
      call(updatePost, id, data, token),
    voteOnPost: (
      id: string,
      data: { type: "upvote" | "downvote" | "none" },
      token: string
    ) => call(votePost, id, data, token),
    savePost: (id: string, token: string) => call(savePost, id, token),
    unsavePost: (id: string, token: string) => call(unsavePost, id, token),

    // Comments
    fetchComments: (postId: string) => call(getComments, postId),
    addComment: (
      postId: string,
      data: { content: string; parentId?: string },
      token: string
    ) =>
      call(createComment, postId, data, token),
    removeComment: (postId: string, commentId: string, token: string) =>
      call(deleteComment, postId, commentId, token),
    editComment: (
      postId: string,
      commentId: string,
      content: string,
      token: string
    ) => call(updateComment, postId, commentId, content, token),

    // Profiles
    fetchUserProfile: (username: string) => call(getUserProfile, username),
    editProfile: (
      data: { bio?: string; avatar?: string },
      token: string
    ) => call(updateProfile, data, token),
    uploadAvatar: (file: File, token: string) => call(uploadAvatar, file, token),

    // Notifications
    fetchNotifications: (token: string) => call(getNotifications, token),
    readNotification: (id: string, token: string) =>
      call(markNotificationAsRead, id, token),
    fetchUnreadNotificationCount: (token: string) => call(getUnreadNotificationCount, token),
  };
};
