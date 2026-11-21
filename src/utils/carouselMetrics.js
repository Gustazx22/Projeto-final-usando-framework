export function carouselMetrics({ scrollWidth, clientWidth, cardWidth, gap }) {
  const step = Math.max(1, Number(cardWidth || 0) + Number(gap || 0));
  const maxScroll = Math.max(
    0,
    Number(scrollWidth || 0) - Number(clientWidth || 0),
  );
  const maxIndex = maxScroll > 1 ? Math.ceil((maxScroll - 1) / step) : 0;
  return { step, maxScroll, maxIndex };
}

export function clampCarouselOffset(offset, maxScroll) {
  return Math.max(0, Math.min(Number(offset || 0), maxScroll));
}
