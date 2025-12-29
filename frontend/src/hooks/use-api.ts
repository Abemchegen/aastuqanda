// use-api.ts
// React hooks wrapping main API calls: spaces, posts, comments, profiles, notifications

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
  voteComment,
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
  getUserPostsByUsername,
  getUserCommentsByUsername,
  updatePost,
  updateComment,
  uploadSpaceImage,
  updateSpaceImage,
  deleteSpaceImage,
  updateSpaceDescription,
} from  "../api/api"

export const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const call = async (fn: Function, ...args: any[]) => {
    try {
      setLoading(true);
      return await fn(...args);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.response?.data?.error || err.message || "Something went wrong",
        variant: "destructive",
      });
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
      data: { name: string; description: string; image?: string },
      token: string
    ) => call(requestNewSpace, data, token),
    uploadSpaceImage: (file: File, token: string) => call(uploadSpaceImage, file, token),
    setSpaceImage: (spaceId: string, image: string, token: string) =>
      call(updateSpaceImage, spaceId, image, token),
    setSpaceDescription: (spaceId: string, description: string, token: string) =>
      call(updateSpaceDescription, spaceId, description, token),
    removeSpaceImage: (spaceId: string, token: string) =>
      call(deleteSpaceImage, spaceId, token),
    joinSpace: (id: string, token: string) => call(joinSpace, id, token),
    leaveSpace: (id: string, token: string) => call(leaveSpace, id, token),
    fetchMySpaces: (token: string) => call(getMySpaces, token),
    fetchMyPosts: (token: string) => call(getMyPosts, token),
    fetchMyComments: (token: string) => call(getMyComments, token),
    fetchMySavedPosts: (token: string) => call(getMySavedPosts, token),
    fetchUserPostsPublic: (username: string) => call(getUserPostsByUsername, username),
    fetchUserCommentsPublic: (username: string) => call(getUserCommentsByUsername, username),

    // Posts
    fetchPosts: () => call(getPosts),
    fetchPostsPaged: (params: { page?: number; limit?: number; sort?: "hot" | "new" | "top"; spaceSlug?: string; joinedOnly?: boolean }) =>
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
    voteOnComment: (
      postId: string,
      commentId: string,
      data: { type: "upvote" | "downvote" | "none" },
      token: string
    ) => call(voteComment, postId, commentId, data, token),
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
