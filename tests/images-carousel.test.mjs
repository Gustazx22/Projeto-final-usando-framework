import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { demoCatalog } from "../src/data/demoCatalog.js";
import {
  getProductImageSrc,
  getLocalProductImage,
} from "../src/utils/productImage.js";
import {
  carouselMetrics,
  clampCarouselOffset,
} from "../src/utils/carouselMetrics.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const products = demoCatalog.flatMap((group) => group.products);

test("36 produtos preservados, com imagem apropriada e diferente para cada item", () => {
  assert.equal(products.length, 36);
  assert.equal(new Set(products.map((p) => p.id)).size, 36);
  assert.equal(new Set(products.map((p) => p.image)).size, 36);
  assert.equal(products.filter((p) => p.category === "higiene").length, 6);
  for (const product of products) {
    const img = getProductImageSrc(product);
    assert.ok(typeof img === "string" && img.length > 5);
    if (product.category !== "higiene") {
      const local = getLocalProductImage(product);
      assert.ok(
        existsSync(path.join(root, "public", local.replace(/^\//, ""))),
        `${product.id} sem fallback`,
      );
    }
  }
});

test("carrossel para 6 produtos exibe o último card inteiro em desktop, tablet e celular", () => {
  for (const visible of [4, 3, 2, 1]) {
    const step = 260 + 32;
    const viewport = 260 * visible + 32 * (visible - 1);
    const scrollWidth = step * 6 - 32;
    const m = carouselMetrics({
      scrollWidth,
      clientWidth: viewport,
      cardWidth: 260,
      gap: 32,
    });
    assert.equal(m.maxIndex, 6 - visible);
    assert.equal(
      clampCarouselOffset(m.maxIndex * m.step, m.maxScroll),
      m.maxScroll,
    );
    assert.equal(
      clampCarouselOffset(m.maxIndex * m.step + 500, m.maxScroll),
      m.maxScroll,
    );
  }
});

test("SQL atualiza somente image e preserva os produtos de higiene", () => {
  const sql = readFileSync(
    path.join(root, "supabase/atualizar-imagens-catalogo.sql"),
    "utf8",
  );
  assert.match(sql, /SET image = v\.image/i);
  assert.doesNotMatch(sql, /SET (price|name|category_id|active)\s*=/i);
  assert.ok(!sql.includes("(3::bigint,"));
  assert.ok(!sql.includes("(24::bigint,"));
  assert.equal((sql.match(/::bigint,/g) || []).length, 30);
});
