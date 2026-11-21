import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("rodapé não anuncia links, registros ou perfis sociais inventados", () => {
  const footer = read("src/components/Footer/Footer.jsx");
  assert.doesNotMatch(footer, /href=["']#["']/);
  assert.doesNotMatch(
    footer,
    /href="https:\/\/(?:wa\.me|instagram\.com|facebook\.com)\//,
  );
  assert.doesNotMatch(footer, /CRF\/SP 00000|CNPJ: 00\.000/);
  assert.match(footer, /Projeto acadêmico/);
});

test("rodapé permite abrir as áreas da conta com login quando necessário", () => {
  const footer = read("src/components/Footer/Footer.jsx");
  assert.match(footer, /openAccount\(tab\)/);
  assert.match(footer, /openAuth\('login'\)/);
  assert.match(footer, /farmavida:navigate-category/);
});

test("atalhos de teclado e foco têm suporte nos modais reutilizáveis", () => {
  const modal = read("src/components/ui/Modal.jsx");
  assert.match(modal, /event\.key === 'Escape'/);
  assert.match(modal, /event\.key !== 'Tab'/);
  assert.match(modal, /previousFocus\.focus/);
  assert.match(modal, /aria-labelledby=\{titleId\}/);
});

test("visualização rápida tem janela visível, acessível e quantidade limitada", () => {
  const view = read("src/components/QuickViewModal/QuickViewModal.jsx");
  const style = read("src/components/QuickViewModal/QuickViewModal.css");
  assert.match(view, /role="dialog"/);
  assert.match(view, /Math\.min\(99/);
  assert.match(style, /\.quick-view-modal\s*\{/);
  assert.match(style, /visibility:\s*visible/);
});

test("menu móvel tem estilo compatível com a classe renderizada", () => {
  const header = read("src/components/Header/Header.jsx");
  const style = read("src/components/Header/Header.css");
  assert.match(header, /className="menu" id="mobile-menu"/);
  assert.match(style, /\.site-header \.menu/);
  assert.match(header, /aria-expanded=\{menuAberto\}/);
});

test("mensagens principais identificam o ambiente como demonstração acadêmica", () => {
  const html = read("index.html");
  const hero = read("src/components/Hero/Hero.jsx");
  assert.match(html, /protótipo acadêmico/);
  assert.match(hero, /Não há dispensação ou pagamento real/);
  assert.doesNotMatch(hero, /10k\+|5★|ENTREGA RÁPIDA EM TODO BRASIL/);
});

test("arquivos de providers e hooks estão isolados para Fast Refresh", () => {
  for (const name of ["Cart", "Toast", "User"]) {
    assert.doesNotMatch(
      read(`src/context/${name}Context.jsx`),
      new RegExp(`export function use${name}`),
    );
    assert.match(
      read(`src/context/use${name}.js`),
      new RegExp(`export function use${name}`),
    );
  }
});

test("arquivo de ambiente local permanece ignorado", () => {
  assert.match(read(".gitignore"), /\.env/);
});
