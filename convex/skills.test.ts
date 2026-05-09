import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

const modules = import.meta.glob("./**/*.*s");

function setup() {
  return convexTest(schema, modules);
}

describe("skills", () => {
  test("create a skill", async () => {
    const t = setup();
    const id = await t.mutation(api.skills.create, {
      name: "test-skill",
      description: "A test skill",
      content: "# Test\nDo the thing.",
      tags: ["test"],
    });
    expect(id).toBeDefined();
  });

  test("create rejects duplicate names", async () => {
    const t = setup();
    await t.mutation(api.skills.create, {
      name: "dupe",
      description: "First",
      content: "content",
      tags: [],
    });
    await expect(
      t.mutation(api.skills.create, {
        name: "dupe",
        description: "Second",
        content: "other",
        tags: [],
      })
    ).rejects.toThrow('Skill "dupe" already exists');
  });

  test("list returns all active skills", async () => {
    const t = setup();
    await t.mutation(api.skills.create, {
      name: "skill-a",
      description: "A",
      content: "content-a",
      tags: ["a"],
    });
    await t.mutation(api.skills.create, {
      name: "skill-b",
      description: "B",
      content: "content-b",
      tags: ["b"],
    });

    const skills = await t.query(api.skills.list, { activeOnly: true });
    expect(skills).toHaveLength(2);
    expect(skills.map((s) => s.name).sort()).toEqual(["skill-a", "skill-b"]);
  });

  test("list excludes content for efficient discovery", async () => {
    const t = setup();
    await t.mutation(api.skills.create, {
      name: "has-content",
      description: "desc",
      content: "# Big markdown body\nLots of text here",
      tags: [],
    });

    const skills = await t.query(api.skills.list, {});
    expect(skills[0]).not.toHaveProperty("content");
    expect(skills[0]).toHaveProperty("name");
    expect(skills[0]).toHaveProperty("description");
  });

  test("list filters by agent", async () => {
    const t = setup();
    await t.mutation(api.skills.create, {
      name: "dev-skill",
      description: "Developer skill",
      content: "content",
      agent: "developer",
      tags: [],
    });
    await t.mutation(api.skills.create, {
      name: "ceo-skill",
      description: "CEO skill",
      content: "content",
      agent: "ceo",
      tags: [],
    });

    const devSkills = await t.query(api.skills.list, { agent: "developer" });
    expect(devSkills).toHaveLength(1);
    expect(devSkills[0].name).toBe("dev-skill");
  });

  test("getByName returns full skill with content", async () => {
    const t = setup();
    await t.mutation(api.skills.create, {
      name: "full-skill",
      description: "desc",
      content: "# Full content\nStep 1: do this",
      tags: ["test"],
    });

    const skill = await t.query(api.skills.getByName, { name: "full-skill" });
    expect(skill).not.toBeNull();
    expect(skill!.content).toBe("# Full content\nStep 1: do this");
    expect(skill!.version).toBe(1);
    expect(skill!.isActive).toBe(true);
  });

  test("getByName returns null for missing skill", async () => {
    const t = setup();
    const skill = await t.query(api.skills.getByName, {
      name: "nonexistent",
    });
    expect(skill).toBeNull();
  });

  test("get by id", async () => {
    const t = setup();
    const id = await t.mutation(api.skills.create, {
      name: "by-id",
      description: "desc",
      content: "content",
      tags: [],
    });

    const skill = await t.query(api.skills.get, { skillId: id });
    expect(skill).not.toBeNull();
    expect(skill!.name).toBe("by-id");
  });

  test("update content increments version", async () => {
    const t = setup();
    const id = await t.mutation(api.skills.create, {
      name: "versioned",
      description: "v1",
      content: "original",
      tags: [],
    });

    await t.mutation(api.skills.update, {
      skillId: id,
      content: "updated content",
    });

    const skill = await t.query(api.skills.get, { skillId: id });
    expect(skill!.content).toBe("updated content");
    expect(skill!.version).toBe(2);
  });

  test("update description without content does not bump version", async () => {
    const t = setup();
    const id = await t.mutation(api.skills.create, {
      name: "no-bump",
      description: "old desc",
      content: "content",
      tags: [],
    });

    await t.mutation(api.skills.update, {
      skillId: id,
      description: "new desc",
    });

    const skill = await t.query(api.skills.get, { skillId: id });
    expect(skill!.description).toBe("new desc");
    expect(skill!.version).toBe(1);
  });

  test("update can deactivate a skill", async () => {
    const t = setup();
    const id = await t.mutation(api.skills.create, {
      name: "to-deactivate",
      description: "desc",
      content: "content",
      tags: [],
    });

    await t.mutation(api.skills.update, {
      skillId: id,
      isActive: false,
    });

    const skill = await t.query(api.skills.get, { skillId: id });
    expect(skill!.isActive).toBe(false);

    const activeSkills = await t.query(api.skills.list, { activeOnly: true });
    expect(activeSkills).toHaveLength(0);
  });

  test("remove deletes a skill", async () => {
    const t = setup();
    const id = await t.mutation(api.skills.create, {
      name: "to-remove",
      description: "desc",
      content: "content",
      tags: [],
    });

    await t.mutation(api.skills.remove, { skillId: id });

    const skill = await t.query(api.skills.get, { skillId: id });
    expect(skill).toBeNull();
  });

  test("seed populates initial skills", async () => {
    const t = setup();
    const result = await t.mutation(api.seedSkills.seed, {});
    expect(result.status).toBe("seeded");
    expect(result.count).toBe(5);

    const skills = await t.query(api.skills.list, {});
    expect(skills).toHaveLength(5);

    const names = skills.map((s) => s.name).sort();
    expect(names).toEqual([
      "code-review",
      "content-writing",
      "deploy-checklist",
      "design-system",
      "ticket-triage",
    ]);
  });

  test("seed is idempotent", async () => {
    const t = setup();
    await t.mutation(api.seedSkills.seed, {});
    const result = await t.mutation(api.seedSkills.seed, {});
    expect(result.status).toBe("already seeded");
    expect(result.count).toBe(5);
  });
});
