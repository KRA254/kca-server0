import { Hono } from "hono";
import { z } from "zod";
import { validateBody } from "../../middleware/validate";
import { createPerson, deletePerson, listPersons, updatePerson } from "../../../services/personService";
import { logAdminAction } from "../../../services/adminAuditService";

const personSchema = z.object({
  fullName: z.string().min(3),
  nationality: z.string().min(2),
  position: z.string().optional(),
  bio: z.string().optional(),
  photoUrl: z.string().url().optional(),
  totalCases: z.number().min(0).optional(),
  totalScore: z.number().min(0).optional(),
  totalAmountLinked: z.number().min(0).optional(),
  totalAmountRecovered: z.number().min(0).optional(),
  amountCurrency: z.string().min(3).max(8).optional(),
  rank: z.number().min(1).optional(),
  profileVisibility: z.enum(["public", "linked_only"]).optional(),
});

const personPatchSchema = personSchema.partial();

const audit = async (c: any, action: string, targetId: string, metadata: Record<string, unknown>) => {
  const adminWallet = c.get("adminWallet") as string;
  await logAdminAction({
    adminWallet,
    action,
    targetType: "person",
    targetId,
    metadata,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "",
    userAgent: c.req.header("user-agent") ?? "",
  });
};

export const adminPersonsRouter = new Hono();

adminPersonsRouter.get("/", async (c) => {
  const limit = Number(c.req.query("limit") ?? 100);
  const items = await listPersons(Number.isFinite(limit) ? limit : 100, 0, true);
  return c.json({ items });
});

adminPersonsRouter.post("/", validateBody(personSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof personSchema>;
  const person = await createPerson(body);
  await audit(c, "person.create", person._id.toString(), body);
  return c.json({ person }, 201);
});

adminPersonsRouter.patch("/:personId", validateBody(personPatchSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof personPatchSchema>;
  const person = await updatePerson(c.req.param("personId"), body);
  if (!person) return c.json({ error: "Not found" }, 404);
  await audit(c, "person.update", c.req.param("personId"), body);
  return c.json({ person });
});

adminPersonsRouter.delete("/:personId", async (c) => {
  const person = await deletePerson(c.req.param("personId"));
  if (!person) return c.json({ error: "Not found" }, 404);
  await audit(c, "person.delete", c.req.param("personId"), {});
  return c.json({ ok: true });
});
