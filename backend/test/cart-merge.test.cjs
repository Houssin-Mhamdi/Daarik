require("ts-node/register");
const test = require("node:test");
const assert = require("node:assert/strict");
const { CartService } = require("../src/cart/cart.service");

function cartFixture() {
  const dishes = {
    existing: { id: "existing", slug: "existing", cookId: "one", status: "LIVE", portionsLeft: 5, cook: { kitchenOpen: true } },
    same: { id: "same", slug: "same", cookId: "one", status: "LIVE", portionsLeft: 5, cook: { kitchenOpen: true } },
    other: { id: "other", slug: "other", cookId: "two", status: "LIVE", portionsLeft: 5, cook: { kitchenOpen: true } },
  };
  let replacement;
  const prisma = {
    dish: {
      findFirst: async ({ where }) => dishes[where.OR[0].id] || null,
    },
    $transaction: async (operation) => operation({
      cartItem: {
        deleteMany: async () => {},
        createMany: async ({ data }) => { replacement = data; },
      },
    }),
  };
  const service = new CartService(prisma);
  service.getCart = async () => ({
    items: [{ dishId: "existing", qty: 2 }],
    pickupSlot: "2026-11-20",
    pickupTime: "18:30",
    note: "Keep account note",
  });
  return { service, replacement: () => replacement };
}

test("guest merge keeps account quantities and pickup details", async () => {
  const fixture = cartFixture();
  await fixture.service.mergeCart("user", {
    items: [{ dishId: "existing", qty: 1 }, { dishId: "same", qty: 3 }],
    note: "Guest note",
  });
  assert.deepEqual(fixture.replacement().map(({ dishId, qty }) => ({ dishId, qty })), [
    { dishId: "existing", qty: 2 },
    { dishId: "same", qty: 3 },
  ]);
  assert.equal(fixture.replacement()[1].pickupSlot, "2026-11-20");
  assert.equal(fixture.replacement()[1].note, "Keep account note");
});

test("guest merge rejects different kitchens before replacing the account cart", async () => {
  const fixture = cartFixture();
  await assert.rejects(
    fixture.service.mergeCart("user", { items: [{ dishId: "other", qty: 1 }] }),
    (error) => error.getStatus() === 409 && error.getResponse().code === "DIFFERENT_COOK",
  );
  assert.equal(fixture.replacement(), undefined);
});
