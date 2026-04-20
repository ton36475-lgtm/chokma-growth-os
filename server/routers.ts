import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addVipNote,
  createLead,
  createLeadEvent,
  createOrUpdateCustomerProfile,
  getDashboardSnapshot,
  listAutomationRuns,
  listBroadcastQueues,
  listCampaigns,
  listRecentLeads,
  listVipNotesForLead,
  listWhaleProfiles,
  updateLeadStatus,
} from "./db";

const leadInputSchema = z.object({
  fullName: z.string().min(1).max(160).optional(),
  phone: z.string().min(5).max(32).optional(),
  lineId: z.string().max(64).optional(),
  telegramHandle: z.string().max(64).optional(),
  landingPage: z.string().max(255).optional(),
  referrer: z.string().max(255).optional(),
  deviceType: z.enum(["mobile", "desktop", "tablet", "unknown"]).default("unknown"),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(120).optional(),
  utmContent: z.string().max(120).optional(),
  utmTerm: z.string().max(120).optional(),
  primaryIntent: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  predictedValueScore: z.number().min(0).max(9999).optional(),
  campaignId: z.number().int().positive().optional(),
  sourceType: z.enum(["ad", "organic", "direct", "affiliate", "broadcast", "manual"]).default("manual"),
});

const customerProfileSchema = z.object({
  leadId: z.number().int().positive(),
  assignedUserId: z.number().int().positive().optional(),
  vipLevel: z.enum(["prospect", "vip", "vvip", "whale"]),
  cumulativeDeposit: z.number().min(0).default(0),
  lifetimeRevenue: z.number().min(0).default(0),
  followUpStatus: z.enum(["pending", "active", "nurturing", "retained", "churn_risk", "closed"]),
  preferredLottery: z.string().max(160).optional(),
  affordabilityBand: z.enum(["unknown", "mid", "high", "whale"]).default("unknown"),
  segmentLabel: z.string().max(160).optional(),
  nextFollowUpAt: z.coerce.date().optional(),
});

const vipNoteSchema = z.object({
  leadId: z.number().int().positive(),
  noteType: z.enum(["call", "chat", "deposit", "insight", "reminder", "system"]).default("insight"),
  content: z.string().min(1).max(4000),
  nextActionAt: z.coerce.date().optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  campaigns: router({
    list: protectedProcedure.query(async () => {
      return listCampaigns();
    }),
  }),
  leads: router({
    submit: publicProcedure.input(leadInputSchema).mutation(async ({ input }) => {
      const leadId = await createLead({
        campaignId: input.campaignId,
        fullName: input.fullName,
        phone: input.phone,
        lineId: input.lineId,
        telegramHandle: input.telegramHandle,
        sourceType: input.sourceType,
        landingPage: input.landingPage,
        referrer: input.referrer,
        deviceType: input.deviceType,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent: input.utmContent,
        utmTerm: input.utmTerm,
        primaryIntent: input.primaryIntent,
        predictedValueScore: input.predictedValueScore?.toFixed(2) ?? "0.00",
        notes: input.notes,
      });

      await createLeadEvent({
        leadId,
        campaignId: input.campaignId,
        eventType: "form_submit",
        eventSource: "system",
        metadata: JSON.stringify({
          landingPage: input.landingPage ?? null,
          referrer: input.referrer ?? null,
          utmSource: input.utmSource ?? null,
          utmMedium: input.utmMedium ?? null,
          utmCampaign: input.utmCampaign ?? null,
          utmContent: input.utmContent ?? null,
          utmTerm: input.utmTerm ?? null,
          deviceType: input.deviceType,
        }),
      });

      await createOrUpdateCustomerProfile({
        leadId,
        vipLevel: input.predictedValueScore && input.predictedValueScore >= 80 ? "whale" : "prospect",
        cumulativeDeposit: "0.00",
        lifetimeRevenue: "0.00",
        followUpStatus: "pending",
        affordabilityBand: input.predictedValueScore && input.predictedValueScore >= 80 ? "whale" : "unknown",
        segmentLabel: input.predictedValueScore && input.predictedValueScore >= 80 ? "High Intent Whale Prospect" : "New Lead",
      });

      return {
        success: true,
        leadId,
      } as const;
    }),
    recent: protectedProcedure.query(async () => {
      return listRecentLeads();
    }),
    updateStatus: protectedProcedure
      .input(
        z.object({
          leadId: z.number().int().positive(),
          leadStatus: z.enum(["new", "contacted", "qualified", "registered", "depositing", "converted", "lost"]),
        }),
      )
      .mutation(async ({ input }) => {
        await updateLeadStatus(input.leadId, input.leadStatus);
        await createLeadEvent({
          leadId: input.leadId,
          eventType: "status_change",
          eventSource: "user",
          metadata: JSON.stringify({ leadStatus: input.leadStatus }),
        });
        return { success: true } as const;
      }),
  }),
  dashboard: router({
    snapshot: protectedProcedure.query(async () => {
      return getDashboardSnapshot();
    }),
    actualVsResult: protectedProcedure.query(async () => {
      const snapshot = await getDashboardSnapshot();
      const automationRuns = await listAutomationRuns(10);
      return {
        summary: snapshot,
        automationRuns,
      };
    }),
  }),
  crm: router({
    whales: protectedProcedure.query(async () => {
      return listWhaleProfiles();
    }),
    upsertProfile: protectedProcedure.input(customerProfileSchema).mutation(async ({ input }) => {
      const profileId = await createOrUpdateCustomerProfile({
        leadId: input.leadId,
        assignedUserId: input.assignedUserId,
        vipLevel: input.vipLevel,
        cumulativeDeposit: input.cumulativeDeposit.toFixed(2),
        lifetimeRevenue: input.lifetimeRevenue.toFixed(2),
        followUpStatus: input.followUpStatus,
        preferredLottery: input.preferredLottery,
        affordabilityBand: input.affordabilityBand,
        segmentLabel: input.segmentLabel,
        nextFollowUpAt: input.nextFollowUpAt,
      });
      return { success: true, profileId } as const;
    }),
    addNote: protectedProcedure.input(vipNoteSchema).mutation(async ({ ctx, input }) => {
      const noteId = await addVipNote({
        leadId: input.leadId,
        authorUserId: ctx.user.id,
        noteType: input.noteType,
        content: input.content,
        nextActionAt: input.nextActionAt,
      });
      await createLeadEvent({
        leadId: input.leadId,
        eventType: "note_added",
        eventSource: "user",
        metadata: JSON.stringify({ noteId, noteType: input.noteType }),
      });
      return { success: true, noteId } as const;
    }),
    notesByLead: protectedProcedure
      .input(z.object({ leadId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return listVipNotesForLead(input.leadId);
      }),
  }),
  operations: router({
    automationRuns: protectedProcedure.query(async () => {
      return listAutomationRuns();
    }),
    broadcastQueues: adminProcedure.query(async () => {
      return listBroadcastQueues();
    }),
  }),
});

export type AppRouter = typeof appRouter;
