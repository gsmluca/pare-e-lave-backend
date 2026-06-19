import { COOKIE_NAME } from "./constants";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createService,
  getServicesByDate,
  getServicesByPeriod,
  searchServices,
  deleteService,
  getAllServices,
  createExpense,
  getExpensesByPeriod,
  getAllExpenses,
  deleteExpense,
  getOrCreateOwnerProfile,
  updateOwnerProfile,
} from "./db";
import { InsertService, InsertExpense } from "../drizzle/schema";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  services: router({
    create: protectedProcedure
      .input(
        z.object({
          vehicleType: z.enum(["car", "motorcycle", "suv", "truck", "other"]),
          clientName: z.string().optional(),
          description: z.string().optional(),
          value: z.string().refine((val) => !isNaN(parseFloat(val)), "Invalid number"),
          paymentMethod: z.enum(["pix", "cash", "card", "other"]),
          createdAt: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const service: InsertService = {
          userId: ctx.user.id,
          vehicleType: input.vehicleType,
          clientName: input.clientName || null,
          description: input.description || null,
          value: input.value,
          paymentMethod: input.paymentMethod,
          createdAt: input.createdAt ? new Date(input.createdAt) : undefined,
        };
        await createService(service);
        return { success: true };
      }),

    getTodayServices: protectedProcedure.query(async ({ ctx }) => {
      const today = new Date().toISOString().split("T")[0];
      return await getServicesByDate(ctx.user.id, today);
    }),

    getByPeriod: protectedProcedure
      .input(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await getServicesByPeriod(
          ctx.user.id,
          input.startDate,
          input.endDate
        );
      }),

    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ ctx, input }) => {
        return await searchServices(ctx.user.id, input.query);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteService(input.id, ctx.user.id);
        return { success: true };
      }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
      return await getAllServices(ctx.user.id);
    }),

    getStats: protectedProcedure
      .input(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
        })
      )
      .query(async ({ ctx, input }) => {
        const svc = await getServicesByPeriod(
          ctx.user.id,
          input.startDate,
          input.endDate
        );

        const stats = {
          totalServices: svc.length,
          totalValue: svc.reduce(
            (sum, s) => sum + parseFloat(s.value as any),
            0
          ),
          carCount: svc.filter((s) => s.vehicleType === "car").length,
          motorcycleCount: svc.filter((s) => s.vehicleType === "motorcycle")
            .length,
          suvCount: svc.filter((s) => s.vehicleType === "suv").length,
          truckCount: svc.filter((s) => s.vehicleType === "truck").length,
          pixCount: svc.filter((s) => s.paymentMethod === "pix").length,
          cashCount: svc.filter((s) => s.paymentMethod === "cash").length,
          cardCount: svc.filter((s) => s.paymentMethod === "card").length,
          pixValue: svc
            .filter((s) => s.paymentMethod === "pix")
            .reduce((sum, s) => sum + parseFloat(s.value as any), 0),
          cashValue: svc
            .filter((s) => s.paymentMethod === "cash")
            .reduce((sum, s) => sum + parseFloat(s.value as any), 0),
          cardValue: svc
            .filter((s) => s.paymentMethod === "card")
            .reduce((sum, s) => sum + parseFloat(s.value as any), 0),
        };

        return stats;
      }),
  }),

  expenses: router({
    create: protectedProcedure
      .input(
        z.object({
          category: z.string(),
          description: z.string().optional(),
          amount: z.string().refine((val) => !isNaN(parseFloat(val)), "Invalid number"),
          createdAt: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const expense: InsertExpense = {
          userId: ctx.user.id,
          category: input.category,
          description: input.description || null,
          amount: input.amount,
          createdAt: input.createdAt ? new Date(input.createdAt) : undefined,
        };
        await createExpense(expense);
        return { success: true };
      }),

    getByPeriod: protectedProcedure
      .input(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await getExpensesByPeriod(
          ctx.user.id,
          input.startDate,
          input.endDate
        );
      }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
      return await getAllExpenses(ctx.user.id);
    }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteExpense(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  ownerProfile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getOrCreateOwnerProfile(ctx.user.id);
    }),

    update: protectedProcedure
      .input(
        z.object({
          businessName: z.string().optional(),
          ownerFirstName: z.string().optional(),
          ownerLastName: z.string().optional(),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateOwnerProfile(ctx.user.id, input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
