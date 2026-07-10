import { db } from "@/lib/db";

const DEFAULT_WORKFLOWS: Record<string, { name: string; steps: Array<{ role: string; label: string; threshold?: number }> }> = {
  APPLICATION: { name: "开票申请审批", steps: [{ role: "business_manager", label: "业务经理" }, { role: "finance_manager", label: "财务主管", threshold: 100000 }] },
  RED_FLUSH: { name: "红冲申请审批", steps: [{ role: "finance_manager", label: "财务主管" }, { role: "admin", label: "总经理", threshold: 50000 }] },
  VOID: { name: "作废申请审批", steps: [{ role: "finance_manager", label: "财务主管" }] },
  ADVANCE: { name: "代垫确认审批", steps: [{ role: "business_manager", label: "业务经理" }, { role: "finance_manager", label: "财务主管", threshold: 10000 }] },
};

async function ensureWorkflow(entityType: string) {
  const def = DEFAULT_WORKFLOWS[entityType];
  if (!def) return null;
  let wf = await db.workflowDefinition.findFirst({ where: { entityType } });
  if (!wf) wf = await db.workflowDefinition.create({ data: { entityType, name: def.name, steps: JSON.stringify(def.steps) } });
  return wf;
}

export const approvalService = {
  submit: async (entityType: string, entityId: string, entityTitle: string, userId: string, amount?: number) => {
    const wf = await ensureWorkflow(entityType);
    if (!wf) return { success: false as const, error: "未找到审批流定义" };

    const steps = JSON.parse(wf.steps) as Array<{ role: string; label: string; threshold?: number }>;
    const effectiveSteps = amount ? steps.filter((s, i) => !s.threshold || amount >= s.threshold || i === 0) : steps;

    const instance = await db.workflowInstance.create({
      data: { entityType, entityId, entityTitle, totalSteps: effectiveSteps.length, currentStep: 0, stepsData: JSON.stringify(effectiveSteps.map((s, i) => ({ ...s, step: i, status: i === 0 ? "PENDING" : "WAITING", assigneeId: null, assigneeName: null, comment: null, timestamp: null }))) },
    });

    await db.operationLog.create({ data: { userId, action: "SUBMIT_APPROVAL", entityType: "workflow", entityId: instance.id } });
    return { success: true as const, data: instance };
  },

  approve: async (instanceId: string, userId: string, userName: string, comment?: string) => {
    const instance = await db.workflowInstance.findUnique({ where: { id: instanceId } });
    if (!instance || instance.status !== "IN_PROGRESS") return { success: false as const, error: "实例不存在或已结束" };

    const steps = JSON.parse(instance.stepsData) as Array<{ step: number; role: string; label: string; status: string; assigneeId: string | null; assigneeName: string | null; comment: string | null; timestamp: string | null; threshold?: number }>;
    const currentStep = steps[instance.currentStep];
    if (!currentStep) return { success: false as const, error: "当前步骤不存在" };

    currentStep.status = "APPROVED";
    currentStep.assigneeId = userId;
    currentStep.assigneeName = userName;
    currentStep.comment = comment ?? "同意";
    currentStep.timestamp = new Date().toISOString();

    await db.approvalRecord.create({ data: { instanceId, stepOrder: instance.currentStep, approverId: userId, approverName: userName, action: "APPROVED", comment: comment ?? "同意" } });

    const nextStepIdx = instance.currentStep + 1;
    if (nextStepIdx >= instance.totalSteps) {
      await db.workflowInstance.update({ where: { id: instanceId }, data: { status: "APPROVED", stepsData: JSON.stringify(steps) } });
      return { success: true as const, data: { ...instance, status: "APPROVED" }, message: "审批通过（终审）" };
    }

    steps[nextStepIdx]!.status = "PENDING";
    await db.workflowInstance.update({ where: { id: instanceId }, data: { currentStep: nextStepIdx, stepsData: JSON.stringify(steps) } });
    return { success: true as const, data: { ...instance, currentStep: nextStepIdx, stepsData: JSON.stringify(steps) }, message: `已通过，进入下一级：${steps[nextStepIdx]!.label}` };
  },

  reject: async (instanceId: string, userId: string, userName: string, comment?: string) => {
    const instance = await db.workflowInstance.findUnique({ where: { id: instanceId } });
    if (!instance || instance.status !== "IN_PROGRESS") return { success: false as const, error: "实例不存在或已结束" };

    await db.approvalRecord.create({ data: { instanceId, stepOrder: instance.currentStep, approverId: userId, approverName: userName, action: "REJECTED", comment: comment ?? "驳回" } });
    await db.workflowInstance.update({ where: { id: instanceId }, data: { status: "REJECTED" } });
    return { success: true as const, data: { ...instance, status: "REJECTED" }, message: "已驳回" };
  },

  listAll: async () => {
    const items = await db.workflowInstance.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { records: true } });
    return { items, total: items.length };
  },

  myPending: async (role: string) => {
    const all = await db.workflowInstance.findMany({ where: { status: "IN_PROGRESS" }, orderBy: { createdAt: "desc" }, take: 100, include: { records: true } });
    const mine = all.filter((inst) => {
      const steps = JSON.parse(inst.stepsData) as Array<{ step: number; role: string; status: string }>;
      const current = steps[inst.currentStep];
      return current && current.status === "PENDING" && current.role === role;
    });
    return { items: mine, total: mine.length };
  },
};
