import { CommentModel } from "../models/comment";

export const listComments = async (articleId: string) =>
  CommentModel.find({ articleId, status: "approved" })
    .sort({ createdAt: -1 })
    .lean();

export const submitComment = async (payload: {
  articleId: string;
  parentCommentId?: string;
  content: string;
  authorId?: string;
  authorPseudonym: string;
  sources: unknown[];
}) =>
  CommentModel.create({
    ...payload,
    status: "approved",
  });

export const reviewComment = async (input: {
  commentId: string;
  status: "approved" | "rejected";
}) => CommentModel.findByIdAndUpdate(input.commentId, { status: input.status }, { new: true });
