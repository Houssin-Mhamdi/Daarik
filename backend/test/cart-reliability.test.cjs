const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { PrismaClient } = require("@prisma/client");

const baseUrl = process.env.CART_TEST_API_URL || "http://localhost:4000/api";

class Device {
  constructor() {
    this.cookies = new Map();
  }

  async request(path, method = "GET", body) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "darna",
        Cookie: [...this.cookies].map(([key, value]) => `${key}=${value}`).join("; "),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const header of response.headers.getSetCookie()) {
      const [pair] = header.split(";");
      const index = pair.indexOf("=");
      this.cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
    return { status: response.status, body: await response.json() };
  }
}

test("cart and refresh sessions work independently across two devices", async () => {
  const prisma = new PrismaClient();
  const email = `cart-test-${randomUUID()}@example.invalid`;
  const password = `Test-${randomUUID()}!`;
  const first = new Device();
  const second = new Device();
  try {
    const registration = await first.request("/auth/register", "POST", {
      email,
      password,
      name: "Cart Test",
    });
    assert.equal(registration.status, 201);
    assert.equal((await second.request("/auth/login", "POST", { email, password })).status, 200);

    const catalog = await first.request("/dishes");
    assert.equal(catalog.status, 200);
    const dishes = catalog.body.items.filter((dish) => dish.portionsLeft > 0);
    assert.ok(dishes.length, "This integration test requires an available dish");

    let added;
    for (const dish of dishes) {
      added = await first.request("/cart/items", "POST", { dishId: dish.id, qty: 1 });
      if (added.status === 201) break;
    }
    assert.equal(added.status, 201);
    const dishId = added.body.items[0].dishId;
    const updated = await first.request("/cart/details", "PATCH", {
      pickupSlot: "2026-11-20",
      pickupTime: "18:30",
      note: "Integration test",
    });
    assert.equal(updated.status, 200);
    const otherCart = await second.request("/cart");
    assert.equal(otherCart.status, 200);
    assert.deepEqual(otherCart.body.items.map((item) => item.dishId), [dishId]);
    assert.equal(otherCart.body.pickupSlot, "2026-11-20");
    assert.equal(otherCart.body.pickupTime, "18:30");
    assert.equal(otherCart.body.note, "Integration test");

    const previousRefresh = first.cookies.get("darna_rt");
    assert.equal((await first.request("/auth/refresh", "POST", {})).status, 200);
    const replay = new Device();
    replay.cookies.set("darna_rt", previousRefresh);
    assert.equal((await replay.request("/auth/refresh", "POST", {})).status, 401);
    assert.equal((await second.request("/auth/refresh", "POST", {})).status, 200);
    assert.equal((await first.request("/auth/logout", "POST", {})).status, 200);
    assert.equal((await second.request("/auth/refresh", "POST", {})).status, 200);
    assert.equal((await second.request("/cart", "DELETE")).status, 200);
    assert.equal((await second.request("/cart")).body.items.length, 0);
  } finally {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  }
});
