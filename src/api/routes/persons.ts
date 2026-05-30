import { Hono } from "hono";
import { cacheMiddleware } from "../middleware/cache";
import { listPersons, getPersonBySlug } from "../../services/personService";
import { serializePerson } from "../../services/serializers";

const toPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const personsRouter = new Hono();

personsRouter.get("/", cacheMiddleware(), async (c) => {
  const items = await listPersons(
    toPositiveInt(c.req.query("limit"), 50),
    toPositiveInt(c.req.query("offset"), 0),
    c.req.query("includeLinkedOnly") === "true"
  );
  return c.json(items.map(serializePerson));
});

personsRouter.get("/:slug", cacheMiddleware(), async (c) => {
  const person = await getPersonBySlug(c.req.param("slug"));
  if (!person) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json(serializePerson(person));
});
