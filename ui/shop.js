// ─────────────────────────────────────────────────────────────────────────
// Desk Shop — Phase 4 PP cosmetics pilot
//
// Catalogue is hard-coded here (8 items, no separate data file) — the
// shop is a proof that PP is spendable, not a generic inventory system.
// If/when we want a real catalog table (rotating stock, limited-time
// items, etc.) move SHOP_ITEMS into data/items.js.
//
// Persistence: purchases are stored on Progress.ownedItems[]. We never
// mutate totalXP — see engine/progress.js for the spendable-PP math.
// ─────────────────────────────────────────────────────────────────────────

const SHOP_ITEMS = [
  { id: 'mug',        emoji: '☕', name: 'Coffee mug',                 cost: 50,
    desc: 'A standard-issue Kedash navy ceramic. Holds warm liquids.' },
  { id: 'cactus',     emoji: '🌵', name: 'Tiny cactus',                cost: 100,
    desc: 'Low-maintenance desk companion. Survives weekends.' },
  { id: 'blinds',     emoji: '🪟', name: 'Window-blind toggle',        cost: 150,
    desc: 'Privacy on demand. Click-clack satisfaction guaranteed.' },
  { id: 'plaque_q',   emoji: '🖼️', name: 'Framed quarter award',       cost: 200,
    desc: 'Generic certificate. The frame is real wood. Probably.' },
  { id: 'dart',       emoji: '🎯', name: 'Dart-board target poster',   cost: 250,
    desc: 'Suitable for productive break-time aiming.' },
  { id: 'plush',      emoji: '🧸', name: 'Stress-relief plush',        cost: 300,
    desc: 'Squeeze during meetings. HR-approved.' },
  { id: 'plaque_eoc', emoji: '🏆', name: 'Employee of the Cycle plaque', cost: 400,
    desc: 'Engraved with your name. Reflective enough to fix your hair.' },
  { id: 'wristrest',  emoji: '🔧', name: 'Ergonomic wristrest',        cost: 500,
    desc: 'Lumbar… for your wrists. Cleared by occupational health.' },
];

function escHtmlShop(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderShop() {
  const main = document.getElementById('main-content');
  const progress = window.App?.progress || window.Progress.load();
  const spend = window.Progress.getSpendablePP(progress);
  const owned = new Set(window.Progress.ownedItemIds(progress));
  const playerName = escHtmlShop(progress.playerName || 'New Hire');

  main.innerHTML = `
    <div class="shop-view">
      <div class="shop-header">
        <div>
          <div class="shop-eyebrow">KEDASH CORP · DESK PERSONALIZATION</div>
          <h1 class="shop-title">🛍️ Desk Shop</h1>
          <p class="shop-sub">Personalize ${playerName}'s desk with PP earned in training.</p>
        </div>
        <div class="shop-pp-card">
          <div class="shop-pp-label">Spendable PP</div>
          <div class="shop-pp-value" id="shop-pp-value">${spend.toLocaleString()}</div>
          <div class="shop-pp-foot">Total earned: ${(progress.totalXP||0).toLocaleString()}</div>
        </div>
      </div>

      <section class="my-desk-panel" aria-label="My Desk">
        <div class="my-desk-head">
          <span class="my-desk-title">My Desk</span>
          <span class="my-desk-count" id="my-desk-count">${owned.size}/${SHOP_ITEMS.length} placed</span>
        </div>
        <div class="my-desk-surface" id="my-desk-surface">
          ${renderDeskSlots(owned)}
          <div class="my-desk-back"></div>
          <div class="my-desk-monitor">▭</div>
          <div class="my-desk-top"></div>
          <div class="my-desk-front"></div>
        </div>
        ${owned.size === 0
          ? '<div class="my-desk-empty">Your desk is bare. Buy something below to make it yours.</div>'
          : ''}
      </section>

      <section class="shop-grid" id="shop-grid">
        ${SHOP_ITEMS.map(item => renderShopCard(item, owned.has(item.id), spend)).join('')}
      </section>
    </div>
  `;

  wireShop();
}

function renderDeskSlots(ownedSet) {
  // 8 slots in two rows on a desktop. Items placed in catalog order so
  // the player gets a stable layout (first purchase → top-left slot).
  return SHOP_ITEMS.map((item, i) => {
    const placed = ownedSet.has(item.id);
    const row = i < 4 ? 'back' : 'front';
    const col = (i % 4) + 1;
    return `
      <div class="desk-slot desk-slot--${row} desk-slot--col${col}" data-slot="${item.id}">
        ${placed
          ? `<span class="desk-slot-emoji" title="${escHtmlShop(item.name)}">${item.emoji}</span>`
          : `<span class="desk-slot-ghost"></span>`}
      </div>
    `;
  }).join('');
}

function renderShopCard(item, ownedFlag, spend) {
  const affordable = !ownedFlag && spend >= item.cost;
  const cls = [
    'shop-card',
    ownedFlag ? 'shop-card--owned' : '',
    !ownedFlag && !affordable ? 'shop-card--locked' : '',
  ].filter(Boolean).join(' ');
  const btn = ownedFlag
    ? `<span class="shop-owned-badge">OWNED</span>`
    : `<button class="btn-primary shop-buy-btn" data-buy="${item.id}" ${affordable ? '' : 'disabled'}>
         ${affordable ? `Buy · ${item.cost} PP` : `Need ${item.cost} PP`}
       </button>`;
  return `
    <article class="${cls}" data-item="${item.id}">
      <div class="shop-card-icon">${item.emoji}</div>
      <div class="shop-card-body">
        <div class="shop-card-name">${escHtmlShop(item.name)}</div>
        <div class="shop-card-desc">${escHtmlShop(item.desc)}</div>
        <div class="shop-card-foot">
          <span class="shop-card-cost">${item.cost} PP</span>
          ${btn}
        </div>
      </div>
    </article>
  `;
}

function wireShop() {
  document.querySelectorAll('.shop-buy-btn[data-buy]').forEach(btn => {
    btn.addEventListener('click', e => {
      const itemId = btn.dataset.buy;
      onBuy(itemId);
    });
  });
}

function onBuy(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;
  const before = window.App.progress;
  const after = window.Progress.purchaseItem(before, item.id, item.cost);
  if (after === before) {
    // Rejected — double-purchase guard or insufficient funds. Either
    // way the UI was already showing OWNED or disabled, so the click
    // shouldn't have fired. Just re-render and bail.
    renderShop();
    return;
  }
  window.App.progress = after;
  window.Progress.save(after);
  // Refresh sidebar (PP doesn't change in the sidebar today, but if
  // we add spendable PP there later this keeps the contract simple).
  if (window.App.refreshSidebar) window.App.refreshSidebar();
  renderShop();
}

window.Shop = {
  render: renderShop,
  ITEMS: SHOP_ITEMS,
};
