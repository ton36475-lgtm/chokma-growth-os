import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  addVipNote: vi.fn(),
  createLead: vi.fn(),
  createLeadEvent: vi.fn(),
  createOrUpdateCustomerProfile: vi.fn(),
  getCampaignPerformance: vi.fn(),
  getDashboardSnapshot: vi.fn(),
  listDepositEventsForLead: vi.fn(),
  listAutomationRuns: vi.fn(),
  listBroadcastQueues: vi.fn(),
  listCampaigns: vi.fn(),
  listRecentLeads: vi.fn(),
  listVipNotesForLead: vi.fn(),
  listWhaleProfiles: vi.fn(),
  updateLeadStatus: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(user?: AuthenticatedUser): TrpcContext {
  return {
    user: user ?? null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUser(role: "user" | "admin" = "user"): AuthenticatedUser {
  return {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

describe("marketing router", () => {
  beforeEach(() => {
    Object.values(dbMocks).forEach((mock) => mock.mockReset());
  });

  it("submits a lead with UTM metadata and creates an initial customer profile", async () => {
    dbMocks.createLead.mockResolvedValue(44);
    dbMocks.createLeadEvent.mockResolvedValue(88);
    dbMocks.createOrUpdateCustomerProfile.mockResolvedValue(12);

    const caller = appRouter.createCaller(createContext());

    const result = await caller.leads.submit({
      fullName: "Ton Whale",
      phone: "0890000000",
      lineId: "@tonwhale",
      landingPage: "/?utm_source=meta",
      referrer: "https://facebook.com",
      deviceType: "mobile",
      utmSource: "meta",
      utmMedium: "cpc",
      utmCampaign: "chokma-whale",
      utmContent: "payout-7000",
      utmTerm: "หวยจ่ายสูง",
      primaryIntent: "high-value lottery prospect",
      notes: "สนใจข้อเสนอ 4 ตัว 7,000 บาท",
      predictedValueScore: 85,
      sourceType: "ad",
    });

    expect(result).toEqual({ success: true, leadId: 44 });
    expect(dbMocks.createLead).toHaveBeenCalledWith(
      expect.objectContaining({
        utmSource: "meta",
        utmCampaign: "chokma-whale",
        predictedValueScore: "85.00",
        sourceType: "ad",
      }),
    );
    expect(dbMocks.createLeadEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: 44,
        eventType: "form_submit",
      }),
    );
    expect(dbMocks.createOrUpdateCustomerProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: 44,
        vipLevel: "whale",
        segmentLabel: "High Intent Whale Prospect",
      }),
    );
  });

  it("returns per-campaign analytics for dashboard ROI and CPA cards", async () => {
    dbMocks.getCampaignPerformance.mockResolvedValue([
      {
        id: 7,
        name: "CHOKMA Whale Meta",
        objective: "Lead acquisition",
        channel: "meta",
        status: "active",
        landingPath: "/",
        spend: 12000,
        leadCount: 24,
        convertedCount: 6,
        totalDeposits: 46000,
        estimatedCpa: 500,
        roi: 283.3,
      },
    ]);

    const caller = appRouter.createCaller(createContext(createUser()));

    const result = await caller.dashboard.campaignPerformance();

    expect(dbMocks.getCampaignPerformance).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      expect.objectContaining({
        name: "CHOKMA Whale Meta",
        estimatedCpa: 500,
        roi: 283.3,
      }),
    ]);
  });

  it("returns deposit history for a selected lead in crm", async () => {
    dbMocks.listDepositEventsForLead.mockResolvedValue([
      {
        id: 31,
        leadId: 44,
        campaignId: 7,
        depositType: "first",
        amount: "3500.00",
        occurredAt: new Date("2026-04-20T10:00:00Z"),
        createdAt: new Date("2026-04-20T10:05:00Z"),
      },
    ]);

    const caller = appRouter.createCaller(createContext(createUser()));

    const result = await caller.crm.depositsByLead({ leadId: 44 });

    expect(dbMocks.listDepositEventsForLead).toHaveBeenCalledWith(44);
    expect(result).toEqual([
      expect.objectContaining({
        leadId: 44,
        depositType: "first",
        amount: "3500.00",
      }),
    ]);
  });

  it("rejects protected dashboard access when the user is not authenticated", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(caller.dashboard.snapshot()).rejects.toMatchObject<Partial<TRPCError>>({
      code: "UNAUTHORIZED",
    });
  });

  it("builds actual-versus-result dashboard data from snapshot and automation runs", async () => {
    dbMocks.getDashboardSnapshot.mockResolvedValue({
      newLeads: 12,
      totalDeposits: 45000,
      conversionRate: 20,
      roi: 160,
      activeCampaigns: 3,
      queuedAutomations: 2,
    });
    dbMocks.listAutomationRuns.mockResolvedValue([
      {
        id: 1,
        module: "lead_scoring",
        status: "completed",
        plannedActions: 10,
        actualActions: 9,
        expectedResult: "จัดอันดับ whale prospects",
        actualResult: "จัดอันดับสำเร็จ 9 ราย",
      },
    ]);

    const caller = appRouter.createCaller(createContext(createUser()));

    const result = await caller.dashboard.actualVsResult();

    expect(dbMocks.getDashboardSnapshot).toHaveBeenCalledTimes(1);
    expect(dbMocks.listAutomationRuns).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      summary: expect.objectContaining({
        newLeads: 12,
        totalDeposits: 45000,
      }),
      automationRuns: [
        expect.objectContaining({
          module: "lead_scoring",
          actualResult: "จัดอันดับสำเร็จ 9 ราย",
        }),
      ],
    });
  });
});
