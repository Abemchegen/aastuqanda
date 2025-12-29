export interface Space {
  id: string;
  name: string;
  slug: string;
  description: string;
  memberCount: number;
  icon: string;
  image?: string;
  creator: { id: string; username: string; email: string; avatar: string };
  joined?: boolean;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  spaceSlug: string;
  spaceName: string;
  authorId: string;
  author?: { id: string; username: string };
  votes: number;
  commentCount: number;
  createdAt: Date;
  isFaq?: boolean;
  tags?: string[];
}

export interface Comment {
  id: string;
  postId: string;
  parentId?: string;
  content: string;
  authorId: string;
  author?: { id: string; username: string };
  votes?: number;
  currentUserVote?: "upvote" | "downvote" | null;
  createdAt: Date;
  replies?: Comment[];
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  spaceSlug: string;
  viewCount: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  createdAt: Date;
  bio?: string;
}
