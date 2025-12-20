const { prisma } = require("../db/prisma");
const { newId } = require("../utils/ids");

// Helpers
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Users
async function addUser({ username, email, password }) {
  const user = await prisma.user.create({
    data: { username, email, password },
  });
  return user;
}
async function getUserByUsername(username) {
  return prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
  });
}
async function getUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}
async function getUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

// Spaces
async function addSpace({ name, description, createdBy }) {
  const slug = slugify(name);
  const space = await prisma.space.create({
    data: { name, description: description || "", slug, createdBy },
  });
  await prisma.spaceMembership.create({
    data: { spaceId: space.id, userId: createdBy },
  });
  return space;
}

const spaceInclude = {
  creator: { select: { id: true, username: true, email: true, avatar: true } },
  _count: { select: { members: true } },
};

function shapeSpace(space) {
  if (!space) return null;
  return {
    ...space,
    memberCount: space._count?.members ?? 0,
  };
}

async function getSpaces() {
  const spaces = await prisma.space.findMany({ include: spaceInclude });
  return spaces.map(shapeSpace);
}
async function getSpaceById(id) {
  const space = await prisma.space.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: spaceInclude,
  });
  return shapeSpace(space);
}
async function getSpaceBySlug(slug) {
  const space = await prisma.space.findUnique({
    where: { slug },
    include: spaceInclude,
  });
  return shapeSpace(space);
}

function getSpaces() {
  return prisma.space
    .findMany({ include: spaceInclude })
    .then((spaces) => spaces.map(shapeSpace));
}
function getSpaceById(id) {
  return prisma.space
    .findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: spaceInclude,
    })
    .then((space) => shapeSpace(space));
}
function getSpaceBySlug(slug) {
  return prisma.space
    .findUnique({ where: { slug }, include: spaceInclude })
    .then((space) => shapeSpace(space));
}
async function joinSpace(spaceIdOrSlug, userId) {
  // Accept either internal id or public slug
  let space = await getSpaceById(spaceIdOrSlug);
  if (!space) {
    space = await getSpaceBySlug(spaceIdOrSlug);
  }
  if (!space) return null;
  await prisma.spaceMembership.upsert({
    where: { userId_spaceId: { userId, spaceId: space.id } },
    create: { userId, spaceId: space.id },
    update: {},
  });
  return space;
}
async function leaveSpace(spaceIdOrSlug, userId) {
  // Accept either internal id or public slug
  let space = await getSpaceById(spaceIdOrSlug);
  if (!space) {
    space = await getSpaceBySlug(spaceIdOrSlug);
  }
  if (!space) return null;
  await prisma.spaceMembership
    .delete({ where: { userId_spaceId: { userId, spaceId: space.id } } })
    .catch(() => {});
  return space;
}

async function getUserSpaces(userId) {
  return prisma.spaceMembership.findMany({
    where: { userId },
    include: { space: true },
  });
}

// Posts
async function addPost({ title, content, spaceId, authorId }) {
  const post = await prisma.post.create({
    data: { title, content, spaceId, authorId },
  });
  // Auto-upvote by owner to make default score 1
  await prisma.vote
    .create({
      data: { userId: authorId, postId: post.id, type: "UPVOTE" },
    })
    .catch(() => {});
  const baseVotes =
    typeof post.votes === "number"
      ? post.votes
      : (post.upvotes || 0) - (post.downvotes || 0);
  const updated = await prisma.post.update({
    where: { id: post.id },
    data: { votes: baseVotes + 1 },
  });
  return updated;
}
async function updatePost({ id, authorId, title, content }) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return { ok: false, reason: "not-found" };
  if (post.authorId !== authorId) return { ok: false, reason: "forbidden" };
  const updated = await prisma.post.update({
    where: { id },
    data: { title: title ?? post.title, content: content ?? post.content },
  });
  return { ok: true, post: updated };
}
async function getPostById(id, userId) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: { space: true, author: { select: { id: true, username: true } } },
  });
  if (!post) return null;
  if (!userId) return post;
  const vote = await prisma.vote.findUnique({
    where: { userId_postId: { userId, postId: id } },
  });
  return {
    ...post,
    currentUserVote:
      vote?.type === "UPVOTE"
        ? "upvote"
        : vote?.type === "DOWNVOTE"
        ? "downvote"
        : null,
  };
}
async function deletePost(id, userId) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return { ok: false, reason: "not-found" };
  if (post.authorId !== userId) return { ok: false, reason: "forbidden" };
  const placeholder = "This post was deleted by the owner.";
  const updated = await prisma.post.update({
    where: { id },
    data: {
      title: post.title || "",
      content: placeholder,
    },
  });
  return { ok: true, post: updated };
}
async function listPosts({
  page = 1,
  limit = 10,
  sort = "new",
  spaceSlug,
  userId,
}) {
  let where = {};
  if (spaceSlug) {
    const space = await prisma.space.findUnique({ where: { slug: spaceSlug } });
    where.spaceId = space ? space.id : "__none__"; // will yield empty if not found
  }
  const items = await prisma.post.findMany({
    where,
    include: { space: true },
    orderBy: sort === "new" ? { createdAt: "desc" } : undefined,
  });
  function score(p) {
    return typeof p.votes === "number"
      ? p.votes
      : (p.upvotes || 0) - (p.downvotes || 0);
  }
  function ageHours(p) {
    return (Date.now() - new Date(p.createdAt).getTime()) / 36e5;
  }
  let sorted = items;
  if (sort === "top") sorted = [...items].sort((a, b) => score(b) - score(a));
  else if (sort === "hot")
    sorted = [...items].sort(
      (a, b) =>
        score(b) / Math.log(ageHours(b) + 2) -
        score(a) / Math.log(ageHours(a) + 2)
    );
  const total = sorted.length;
  const start = (page - 1) * limit;
  const paged = sorted.slice(start, start + limit);
  // Attach spaceSlug for frontend filtering convenience
  const withSlugs = await Promise.all(
    paged.map(async (p) => {
      if (!userId)
        return { ...p, spaceSlug: p.space ? p.space.slug : undefined };
      const vote = await prisma.vote.findUnique({
        where: { userId_postId: { userId, postId: p.id } },
      });
      return {
        ...p,
        spaceSlug: p.space ? p.space.slug : undefined,
        currentUserVote:
          vote?.type === "UPVOTE"
            ? "upvote"
            : vote?.type === "DOWNVOTE"
            ? "downvote"
            : null,
      };
    })
  );
  return { items: withSlugs, total, page, limit };
}

// Votes & saves
async function castVote({ postId, userId, type }) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return { ok: false, reason: "not-found" };
  const prev = await prisma.vote.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  let votes =
    typeof post.votes === "number"
      ? post.votes
      : (post.upvotes || 0) - (post.downvotes || 0);
  if (prev?.type === "UPVOTE") votes -= 1;
  else if (prev?.type === "DOWNVOTE") votes += 1;

  if (type === "upvote") {
    votes += 1;
    await prisma.vote.upsert({
      where: { userId_postId: { userId, postId } },
      create: { userId, postId, type: "UPVOTE" },
      update: { type: "UPVOTE" },
    });
  } else if (type === "downvote") {
    votes -= 1;
    await prisma.vote.upsert({
      where: { userId_postId: { userId, postId } },
      create: { userId, postId, type: "DOWNVOTE" },
      update: { type: "DOWNVOTE" },
    });
  } else if (type === "none") {
    await prisma.vote
      .delete({ where: { userId_postId: { userId, postId } } })
      .catch(() => {});
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { votes },
  });
  return { ok: true, post: updated };
}
async function savePost({ postId, userId }) {
  await prisma.savedPost.upsert({
    where: { userId_postId: { userId, postId } },
    create: { userId, postId },
    update: {},
  });
  return true;
}
async function unsavePost({ postId, userId }) {
  await prisma.savedPost
    .delete({ where: { userId_postId: { userId, postId } } })
    .catch(() => {});
  return true;
}

// User activity
function getUserPosts(userId) {
  return prisma.post.findMany({
    where: { authorId: userId },
    include: { space: true },
    orderBy: { createdAt: "desc" },
  });
}
function getUserComments(userId) {
  return prisma.comment.findMany({
    where: { authorId: userId },
    include: { post: true },
    orderBy: { createdAt: "desc" },
  });
}
async function getUserSavedPosts(userId) {
  const rows = await prisma.savedPost.findMany({
    where: { userId },
    include: { post: { include: { space: true } } },
    orderBy: { post: { createdAt: "desc" } },
  });
  return rows.map((r) => r.post);
}

// Comments
async function addComment({ postId, authorId, content, parentId }) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return null;
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.postId !== postId) return null;
  }
  const comment = await prisma.comment.create({
    data: { postId, authorId, content, parentId: parentId ?? null },
  });
  return comment;
}
async function updateComment({ postId, commentId, userId, content }) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.postId !== postId)
    return { ok: false, reason: "not-found" };
  if (comment.authorId !== userId) return { ok: false, reason: "forbidden" };
  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content },
  });
  return { ok: true, comment: updated };
}
function getComments(postId) {
  return prisma.comment.findMany({
    where: { postId },
    include: { author: { select: { id: true, username: true } } },
    orderBy: { createdAt: "desc" },
  });
}
async function deleteComment({ postId, commentId, userId }) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.postId !== postId)
    return { ok: false, reason: "not-found" };
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!(comment.authorId === userId || (post && post.authorId === userId)))
    return { ok: false, reason: "forbidden" };
  const placeholder = "This comment was deleted by the owner.";
  await prisma.comment.update({
    where: { id: commentId },
    data: { content: placeholder },
  });
  return { ok: true, deleted: true, content: placeholder };
}

// Profiles
async function getPublicProfile(username) {
  const user = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
  });
  if (!user) return null;
  const memberships = await prisma.spaceMembership.findMany({
    where: { userId: user.id },
    include: { space: true },
  });
  return {
    username: user.username,
    bio: user.bio,
    avatar: user.avatar,
    createdAt: user.createdAt,
    spaces: memberships.map((m) => ({
      id: m.space.id,
      name: m.space.name,
      slug: m.space.slug,
    })),
  };
}
function updateProfile(userId, { bio, avatar }) {
  return prisma.user.update({
    where: { id: userId },
    data: { bio: bio ?? undefined, avatar: avatar ?? undefined },
  });
}

// Notifications
function addNotification({ userId, type, payload }) {
  return prisma.notification.create({ data: { userId, type, payload } });
}
function getUserNotifications(userId) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
async function markNotificationRead(userId, notificationId) {
  const n = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!n || n.userId !== userId) return false;
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
  return true;
}
function getUnreadCount(userId) {
  return prisma.notification.count({ where: { userId, read: false } });
}

// Tags (disabled)
async function listTags() {
  return [];
}

// Refresh tokens
async function createRefreshToken(userId) {
  const token = newId();
  await prisma.refreshToken.create({ data: { token, userId } });
  return token;
}
async function getUserIdByRefreshToken(token) {
  const rt = await prisma.refreshToken.findUnique({ where: { token } });
  return rt?.userId || null;
}
async function revokeRefreshTokensForUser(userId) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

// Email verification
async function createVerificationToken(userId) {
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h
  const token = newId();
  await prisma.verificationToken.create({ data: { token, userId, expiresAt } });
  return token;
}

async function reissueVerificationToken(userId) {
  await prisma.verificationToken.deleteMany({ where: { userId } });
  return createVerificationToken(userId);
}

async function verifyEmailByToken(token) {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });
  if (!record) return null;
  if (record.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return null;
  }
  const user = await prisma.user.update({
    where: { id: record.userId },
    data: { isVerified: true },
  });
  await prisma.verificationToken.deleteMany({
    where: { userId: record.userId },
  });
  return user;
}
async function getUserMembershipSpaceIds(userId) {
  const memberships = await prisma.spaceMembership.findMany({
    where: { userId },
    select: { spaceId: true },
  });
  return new Set(memberships.map((m) => m.spaceId));
}
module.exports = {
  // users
  addUser,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  // spaces
  addSpace,
  getSpaces,
  getSpaceById,
  getSpaceBySlug,
  joinSpace,
  leaveSpace,
  getUserSpaces,
  getUserMembershipSpaceIds,
  // posts
  addPost,
  updatePost,
  getPostById,
  deletePost,
  listPosts,
  castVote,
  savePost,
  unsavePost,
  getUserPosts,
  getUserComments,
  getUserSavedPosts,
  // comments
  addComment,
  getComments,
  updateComment,
  deleteComment,
  // profiles
  getPublicProfile,
  updateProfile,
  // notifications
  addNotification,
  getUserNotifications,
  markNotificationRead,
  getUnreadCount,
  // tags
  listTags,
  // refresh tokens
  createRefreshToken,
  getUserIdByRefreshToken,
  revokeRefreshTokensForUser,
  createVerificationToken,
  verifyEmailByToken,
  reissueVerificationToken,
};
