(() => {
  const typeMeta = {
    all: ['🔎', 'ทั้งหมด'],
    product: ['🛒', 'ของเพียบ'],
    service: ['🔧', 'ซ่อมเพียบ'],
    secondhand: ['♻️', 'มือสองเพียบ'],
    free: ['🎁', 'ฟรีเพียบ'],
    shop: ['🏪', 'ร้านเพียบ'],
    food: ['🍜', 'กินเพียบ']
  };

  let selectedType = 'all';
  let nearCoords = null;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  function setType(type) {
    selectedType = typeMeta[type] ? type : 'all';
    document.querySelectorAll('[data-discovery-type]').forEach((button) => {
      button.classList.toggle('active', button.dataset.discoveryType === selectedType);
    });
    const label = document.querySelector('#discovery-type-label');
    if (label) label.textContent = typeMeta[selectedType][1];
  }

  function cardHtml(item) {
    const icon = typeMeta[item.kind]?.[0] || '📌';
    const image = item.image_url
      ? `<img src="${esc(item.image_url)}" alt="${esc(item.name)}" loading="lazy" decoding="async">`
      : `<div class="discover-card-placeholder" aria-hidden="true">${icon}</div>`;
    const distance = Number.isFinite(Number(item.distance_km)) ? `<span>📍 ${esc(item.distance_km)} กม.</span>` : '';
    const location = item.location_text ? `<span>📍 ${esc(item.location_text)}</span>` : '';
    const price = item.price_text ? `<strong class="discover-price">${esc(item.price_text)}</strong>` : '';
    const badge = item.badge ? `<span class="discover-badge">${esc(item.badge)}</span>` : '';
    const source = item.source_name ? `<small>แหล่งข้อมูล: ${esc(item.source_name)}</small>` : '';
    const action = item.action_url
      ? `<a class="discover-action" href="${esc(item.action_url)}" ${item.kind === 'product' ? 'rel="sponsored nofollow noopener"' : 'rel="nofollow noopener"'}>${esc(item.action_label || 'ดูรายละเอียด')} →</a>`
      : `<span class="discover-action disabled">กำลังเพิ่มข้อมูล</span>`;

    return `<article class="discover-card">
      <div class="discover-card-media">${image}<span class="discover-kind">${icon} ${esc(item.type_label || typeMeta[item.kind]?.[1] || 'รายการเพียบ')}</span></div>
      <div class="discover-card-body">
        <div class="discover-card-top">${badge}${price}</div>
        <h3>${esc(item.name)}</h3>
        ${item.description ? `<p>${esc(item.description)}</p>` : ''}
        <div class="discover-meta">${distance}${location}</div>
        ${source}
        ${action}
      </div>
    </article>`;
  }

  async function runSearch() {
    const form = document.querySelector('#discover-search-form');
    const result = document.querySelector('#discovery-result');
    if (!form || !result) return;
    const q = String(form.q.value || '').trim();

    if (!q && selectedType === 'all' && !nearCoords) {
      result.hidden = false;
      result.innerHTML = '<div class="discover-message"><b>ลองพิมพ์สิ่งที่กำลังหา</b><span>เช่น “แอร์”, “โต๊ะทำงาน”, “ร้านซ่อมมือถือ” หรือเลือกหมวดด้านล่าง</span></div>';
      return;
    }

    result.hidden = false;
    result.innerHTML = '<div class="discover-message"><b>กำลังค้นให้…</b><span>OHOPIAP กำลังรวมผลจากหลายประเภท</span></div>';

    const params = new URLSearchParams({ type: selectedType });
    if (q) params.set('q', q);
    if (nearCoords) {
      params.set('lat', String(nearCoords.lat));
      params.set('lng', String(nearCoords.lng));
    }

    try {
      const response = await fetch(`/api/discover?${params.toString()}`);
      const data = await response.json();
      const items = data.items || [];
      if (!items.length) {
        result.innerHTML = `<div class="discover-message"><b>ยังไม่พบข้อมูลที่ตรงกัน</b><span>โครงค้นหาพร้อมแล้ว ตอนนี้เรากำลังเพิ่มข้อมูลจริงของ ${esc(typeMeta[selectedType]?.[1] || 'หมวดนี้')} เข้าระบบ</span></div>`;
        return;
      }
      result.innerHTML = `<div class="discover-result-head"><div><b>เจอ ${items.length} รายการ</b><span>${q ? `สำหรับ “${esc(q)}”` : typeMeta[selectedType][1]}${nearCoords ? ' • เรียงรายการที่มีพิกัดตามระยะใกล้ก่อน' : ''}</span></div><button type="button" id="close-discovery">ปิด</button></div><div class="discover-grid">${items.map(cardHtml).join('')}</div>`;
      document.querySelector('#close-discovery')?.addEventListener('click', () => { result.hidden = true; });
      result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      result.innerHTML = '<div class="discover-message"><b>ค้นหาไม่ได้ชั่วคราว</b><span>ลองใหม่อีกครั้งได้เลย</span></div>';
    }
  }

  function initDiscovery() {
    const form = document.querySelector('#discover-search-form');
    if (!form) return;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      runSearch();
    });

    document.querySelectorAll('[data-discovery-type]').forEach((button) => {
      button.addEventListener('click', () => {
        setType(button.dataset.discoveryType);
        if (form.q.value.trim()) runSearch();
        else form.q.focus();
      });
    });

    document.querySelectorAll('[data-discovery-preset]').forEach((button) => {
      button.addEventListener('click', () => {
        setType(button.dataset.discoveryPreset);
        form.q.focus();
        if (form.q.value.trim()) runSearch();
      });
    });

    document.querySelector('#near-me')?.addEventListener('click', () => {
      const status = document.querySelector('#near-status');
      if (!navigator.geolocation) {
        if (status) status.textContent = 'อุปกรณ์นี้ไม่รองรับตำแหน่ง';
        return;
      }
      if (status) status.textContent = 'กำลังหาตำแหน่ง…';
      navigator.geolocation.getCurrentPosition((position) => {
        nearCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
        document.querySelector('#near-me')?.classList.add('active');
        if (status) status.textContent = 'เปิด “ใกล้ฉัน” แล้ว';
        runSearch();
      }, () => {
        if (status) status.textContent = 'ไม่ได้รับสิทธิ์ตำแหน่ง — ยังค้นแบบปกติได้';
      }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
    });

    setType('all');
  }

  document.addEventListener('DOMContentLoaded', initDiscovery);
})();
