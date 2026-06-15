const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Compute alert status for a payment based on due date and current status
 */
const computePaymentStatus = (dueDate, status) => {
  if (status === 'RECEIVED') return 'RECEIVED';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'OVERDUE';
  if (diffDays <= 3) return 'DUE_SOON';
  return status;
};

/**
 * Get all alerts for a user based on their role and project access
 * @param {number} userId
 * @param {string} role - 'ADMIN' | 'STAFF' | 'DEVELOPER'
 * @param {number[]} projectIds - accessible project IDs (for STAFF/DEVELOPER)
 * @returns {Array} alerts
 */
const getAlerts = async (userId, role, projectIds) => {
  const alerts = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build project filter
  const projectFilter = role === 'ADMIN' ? {} : { projectId: { in: projectIds } };

  // 1. Fetch all active deals with schedules
  const deals = await prisma.deal.findMany({
    where: { ...projectFilter, registryStatus: { not: 'DONE' } },
    include: {
      client: { select: { name: true } },
      unit: { select: { unitNumber: true } },
      project: { select: { name: true } },
      marginSchedule: { where: { status: { not: 'RECEIVED' } } },
      loanSchedule: { where: { status: { not: 'RECEIVED' } } },
      cashSchedule: { where: { status: { not: 'RECEIVED' } } }
    }
  });

  for (const deal of deals) {
    const baseInfo = {
      dealId: deal.id,
      unitNumber: deal.unit.unitNumber,
      clientName: deal.client.name,
      projectName: deal.project.name
    };

    // Margin schedule alerts
    for (const item of deal.marginSchedule) {
      const computedStatus = computePaymentStatus(item.dueDate, item.status);
      if (computedStatus === 'OVERDUE' || computedStatus === 'DUE_SOON') {
        alerts.push({
          type: computedStatus,
          scheduleType: 'MARGIN',
          scheduleId: item.id,
          description: item.description,
          dueDate: item.dueDate,
          amount: parseFloat(item.amount),
          ...baseInfo
        });
      }
    }

    // Loan schedule alerts
    for (const item of deal.loanSchedule) {
      const computedStatus = computePaymentStatus(item.expectedDate, item.status);
      if (computedStatus === 'OVERDUE' || computedStatus === 'DUE_SOON') {
        alerts.push({
          type: computedStatus,
          scheduleType: 'LOAN',
          scheduleId: item.id,
          description: item.stageDescription,
          dueDate: item.expectedDate,
          amount: parseFloat(item.amount),
          ...baseInfo
        });
      }
    }

    // Cash schedule alerts
    for (const item of deal.cashSchedule) {
      const computedStatus = computePaymentStatus(item.dueDate, item.status);
      if (computedStatus === 'OVERDUE' || computedStatus === 'DUE_SOON') {
        alerts.push({
          type: computedStatus,
          scheduleType: 'CASH',
          scheduleId: item.id,
          description: item.description,
          dueDate: item.dueDate,
          amount: parseFloat(item.amount),
          isCash: true,
          ...baseInfo
        });
      }
    }

    // Possession date alerts (ADMIN only)
    if (role === 'ADMIN' && deal.possessionDate) {
      const possession = new Date(deal.possessionDate);
      possession.setHours(0, 0, 0, 0);
      const daysUntilPossession = Math.floor((possession - today) / (1000 * 60 * 60 * 24));

      if (daysUntilPossession >= 0 && daysUntilPossession <= 30) {
        alerts.push({
          type: 'POSSESSION_NEAR',
          scheduleType: null,
          description: `Possession in ${daysUntilPossession} days`,
          dueDate: deal.possessionDate,
          amount: null,
          ...baseInfo
        });
      }

      // Registry due after possession
      if (daysUntilPossession < 0 && deal.registryStatus === 'PENDING') {
        alerts.push({
          type: 'REGISTRY_DUE',
          scheduleType: null,
          description: 'Possession date has passed — registry pending',
          dueDate: deal.registryTargetDate || deal.possessionDate,
          amount: null,
          ...baseInfo
        });
      }
    }
  }

  // GST Review — projects that changed to READY with open deals (ADMIN only)
  if (role === 'ADMIN') {
    const readyProjectsWithOpenDeals = await prisma.project.findMany({
      where: { status: 'READY' },
      include: {
        deals: {
          where: { registryStatus: { not: 'DONE' }, gstOverridden: false },
          select: { id: true, unit: { select: { unitNumber: true } }, client: { select: { name: true } } }
        }
      }
    });

    for (const project of readyProjectsWithOpenDeals) {
      for (const deal of project.deals) {
        alerts.push({
          type: 'GST_REVIEW',
          dealId: deal.id,
          unitNumber: deal.unit.unitNumber,
          clientName: deal.client.name,
          projectName: project.name,
          scheduleType: null,
          description: `Project is now READY — verify GST on this deal`,
          dueDate: null,
          amount: null
        });
      }
    }
  }

  // Sort: OVERDUE first, then DUE_SOON, then others
  const priority = { OVERDUE: 0, DUE_SOON: 1, REGISTRY_DUE: 2, POSSESSION_NEAR: 3, GST_REVIEW: 4 };
  alerts.sort((a, b) => (priority[a.type] ?? 99) - (priority[b.type] ?? 99));

  return alerts;
};

module.exports = { getAlerts, computePaymentStatus };
