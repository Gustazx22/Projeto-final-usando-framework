import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("identidade visual usa paleta, tipografia e raios do design system fornecido", () => {
  const theme = read("src/styles/farmavida-brand.css");
  assert.match(theme, /--verde-vivo:\s*#12B24B/i);
  assert.match(theme, /--verde-escuro:\s*#0B6B3A/i);
  assert.match(theme, /--verde-floresta:\s*#0A4D2E/i);
  assert.match(theme, /--vermelho-cruz:\s*#C8372D/i);
  assert.match(theme, /--fonte-principal:\s*'Outfit'/);
  assert.match(theme, /--raio-lg:\s*32px/);
  assert.match(read("index.html"), /family=Outfit/);
  assert.match(read("src/main.jsx"), /farmavida-brand\.css/);
});

test("menu principal permanece simplificado e pesquisa usa filtros existentes", () => {
  const header = read("src/components/Header/Header.jsx");
  const catalog = read("src/components/Categories/Categories.jsx");
  assert.match(header, /label: 'Medicamentos'/);
  assert.match(header, /label: 'Ofertas'/);
  assert.doesNotMatch(
    header,
    /label: 'Genéricos'|label: 'Higiene'|label: 'Vitaminas'/,
  );
  assert.match(header, /farmavida:search-products/);
  assert.match(catalog, /farmavida:search-products/);
  assert.match(catalog, /setSelectedCategory\('all'\)/);
  assert.match(header, /className="menu" id="mobile-menu"/);
});

test("remodelação mantém segurança, avisos reais e acesso ao painel", () => {
  const hero = read("src/components/Hero/Hero.jsx");
  const app = read("src/App.jsx");
  const theme = read("src/styles/farmavida-brand.css");
  assert.match(hero, /Não há dispensação ou pagamento real/);
  assert.doesNotMatch(hero, /PROJETO ACADÊMICO|Projeto demo/);
  assert.match(app, /isPharmacist && selectedView !== 'client'/);
  assert.match(theme, /\.ph-workspace/);
  assert.match(theme, /@media \(prefers-reduced-motion: reduce\)/);
});
