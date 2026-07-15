import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { NextRequest } from "next/server";

// POST: Submit for first review, approve/reject first review, approve/reject second review
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;
  const body = await req.json();
  const { action, comment } = body;

  const preInvoice = await db.preInvoice.findUnique({ where: { id } });
  if (!preInvoice) return error("预制发票不存在", 404);

  const now = new Date();
  let updateData: Record<string, unknown> = {};
  let logAction = "";

  switch (action) {
    case "submit_first":
      if (preInvoice.reviewStatus !== "DRAFT" && preInvoice.reviewStatus !== "REJECTED") {
        return error("当前状态不可提交一审");
      }
      updateData = { reviewStatus: "PENDING_FIRST" };
      logAction = "SUBMIT_FIRST_REVIEW";
      break;

    case "first_approve":
      if (preInvoice.reviewStatus !== "PENDING_FIRST") {
        return error("当前状态不可进行一审");
      }
      updateData = {
        reviewStatus: "FIRST_APPROVED",
        firstReviewComment: comment || null,
        firstReviewedAt: now,
      };
      logAction = "FIRST_REVIEW_APPROVE";
      break;

    case "first_reject":
      if (preInvoice.reviewStatus !== "PENDING_FIRST") {
        return error("当前状态不可进行一审");
      }
      updateData = {
        reviewStatus: "REJECTED",
        firstReviewComment: comment || null,
        firstReviewedAt: now,
      };
      logAction = "FIRST_REVIEW_REJECT";
      break;

    case "submit_second":
      if (preInvoice.reviewStatus !== "FIRST_APPROVED") {
        return error("一审通过后才可提交二审");
      }
      updateData = { reviewStatus: "PENDING_SECOND" };
      logAction = "SUBMIT_SECOND_REVIEW";
      break;

    case "second_approve":
      if (preInvoice.reviewStatus !== "PENDING_SECOND") {
        return error("当前状态不可进行二审");
      }
      updateData = {
        reviewStatus: "APPROVED",
        secondReviewComment: comment || null,
        secondReviewedAt: now,
      };
      logAction = "SECOND_REVIEW_APPROVE";
      break;

    case "second_reject":
      if (preInvoice.reviewStatus !== "PENDING_SECOND") {
        return error("当前状态不可进行二审");
      }
      updateData = {
        reviewStatus: "REJECTED",
        secondReviewComment: comment || null,
        secondReviewedAt: now,
      };
      logAction = "SECOND_REVIEW_REJECT";
      break;

    default:
      return error("未知操作");
  }

  const updated = await db.preInvoice.update({
    where: { id },
    data: updateData,
    include: { items: true },
  });

  await db.operationLog.create({
    data: {
      userId: session.user.id,
      action: logAction,
      entityType: "pre_invoice",
      entityId: id,
      newValue: JSON.stringify({ action, comment, reviewStatus: updated.reviewStatus }),
    },
  });

  return success(updated);
}
