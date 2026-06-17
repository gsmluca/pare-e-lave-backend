import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("services", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
  });

  it("should create a service with valid input", async () => {
    const caller = appRouter.createCaller(ctx);

    const result = await caller.services.create({
      vehicleType: "car",
      clientName: "João Silva",
      description: "Lavagem completa",
      value: "25.50",
      paymentMethod: "pix",
    });

    expect(result).toEqual({ success: true });
  });

  it("should get today's services", async () => {
    const caller = appRouter.createCaller(ctx);

    // Create a service first
    await caller.services.create({
      vehicleType: "motorcycle",
      clientName: "Maria Santos",
      description: "Lavagem simples",
      value: "15.00",
      paymentMethod: "cash",
    });

    // Get today's services
    const services = await caller.services.getTodayServices();
    expect(Array.isArray(services)).toBe(true);
  });

  it("should get statistics for a period", async () => {
    const caller = appRouter.createCaller(ctx);

    const today = new Date().toISOString().split("T")[0];
    const stats = await caller.services.getStats({
      startDate: today,
      endDate: today,
    });

    expect(stats).toHaveProperty("totalServices");
    expect(stats).toHaveProperty("totalValue");
    expect(stats).toHaveProperty("carCount");
    expect(stats).toHaveProperty("motorcycleCount");
    expect(stats).toHaveProperty("pixCount");
    expect(stats).toHaveProperty("cashCount");
  });

  it("should require authentication for services procedures", async () => {
    const unauthenticatedCtx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(unauthenticatedCtx);

    try {
      await caller.services.create({
        vehicleType: "car",
        clientName: "Test",
        description: "Test",
        value: "10.00",
        paymentMethod: "pix",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });
});
