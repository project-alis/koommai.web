const fmt = (n, digits=2) => new Intl.NumberFormat('th-TH',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(Number.isFinite(n)?n:0);
const money = (n) => `${fmt(n,2)} บาท`;

async function loadRecommendations(tool){
  const box=document.querySelector('[data-recommendations]'); if(!box) return;
  try{
    const r=await fetch(`/api/recommendations?tool=${encodeURIComponent(tool)}`);
    const d=await r.json();
    if(!d.items?.length){
      box.hidden=true;
      box.innerHTML='';
      return;
    }
    box.hidden=false;
    box.innerHTML=`<div class="rec-head"><div><span class="eyebrow">ตัวเลือกที่เกี่ยวข้อง</span><h2>ตัวเลือกที่ระบบคัดไว้ให้</h2></div><p>รูป ชื่อ ราคา และคำแนะนำสร้างจากข้อมูลสินค้าในระบบอัตโนมัติ</p></div><div class="rec-grid">${d.items.map(x=>{
      const img=x.image_url||'/assets/product-placeholder.svg';
      return `<article class="rec product-card">
        <div class="product-media"><img src="${escapeAttr(img)}" alt="${escapeAttr(x.image_alt||x.name)}" loading="lazy" decoding="async" width="640" height="480" data-fallback="1"></div>
        <div class="product-body">
          <div class="product-meta"><span class="product-badge">${escapeHtml(x.badge||'แนะนำ')}</span>${x.merchant?`<span class="merchant">${escapeHtml(x.merchant)}</span>`:''}</div>
          <h3>${escapeHtml(x.name)}</h3>
          ${x.display_price?`<div class="product-price">${escapeHtml(x.display_price)}</div>`:''}
          <p>${escapeHtml(x.reason||'ตัวเลือกที่เกี่ยวข้องกับผลคำนวณของคุณ')}</p>
          <a class="button product-cta" rel="sponsored nofollow noopener" href="${escapeAttr(x.go_url)}">ดูราคาวันนี้</a>
        </div>
      </article>`;
    }).join('')}</div><p class="affiliate-note"><small>ลิงก์บางรายการอาจเป็น Affiliate หากมีการซื้อ เว็บไซต์อาจได้รับค่าคอมมิชชัน โดยราคาที่คุณจ่ายไม่เพิ่มขึ้น</small></p>`;
    box.querySelectorAll('img[data-fallback]').forEach(img=>img.addEventListener('error',()=>{
      if(!img.src.endsWith('/assets/product-placeholder.svg')) img.src='/assets/product-placeholder.svg';
    },{once:true}));
  }catch{ box.hidden=true; }
}
function escapeHtml(s){return String(s??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));}
function escapeAttr(s){return escapeHtml(s).replace(/`/g,'&#96;');}

function initProfit(){
 const f=document.querySelector('#profit-form'); if(!f)return;
 loadRecommendations('profit-online');
 f.addEventListener('submit',e=>{e.preventDefault();
  const sale=+f.sale.value||0,cost=+f.cost.value||0,pack=+f.pack.value||0,fee=(+f.fee.value||0)/100,aff=(+f.affiliate.value||0)/100,ads=+f.ads.value||0,target=(+f.target.value||30)/100;
  const rate=fee+aff, fixed=cost+pack+ads, profit=sale*(1-rate)-fixed, margin=sale>0?profit/sale:0;
  const breakEven=(1-rate)>0?fixed/(1-rate):NaN; const targetPrice=(1-rate-target)>0?fixed/(1-rate-target):NaN;
  const box=document.querySelector('#profit-result'); box.hidden=false;
  const state=profit>0?(margin>=.2?['🟢 ยังมีกำไร','good']:['🟡 มีกำไร แต่บาง','warn']):['🔴 ขาดทุน','bad'];
  box.innerHTML=`<span class="pill">ผลคำนวณ</span><div class="big-number ${state[1]}">${state[0]}</div><div class="kpis"><div class="kpi">กำไรต่อชิ้น<b>${money(profit)}</b></div><div class="kpi">Margin<b>${fmt(margin*100,1)}%</b></div><div class="kpi">ราคาคุ้มทุน<b>${Number.isFinite(breakEven)?money(breakEven):'คำนวณไม่ได้'}</b></div></div><p>${Number.isFinite(targetPrice)?`ถ้าต้องการ Margin ${fmt(target*100,0)}% ควรขายอย่างน้อยประมาณ <strong>${money(targetPrice)}</strong>`:'ค่าธรรมเนียมรวมกับ Margin เป้าหมายสูงเกินไป'}</p><p><small>ผลลัพธ์เป็นการประมาณจากข้อมูลที่กรอก ค่าธรรมเนียมจริงขึ้นกับแพลตฟอร์ม หมวดสินค้า และโปรแกรมที่เข้าร่วม</small></p>`;
  box.scrollIntoView({behavior:'smooth',block:'nearest'});
 });
}
function initPromo(){
 const f=document.querySelector('#promo-form'); if(!f)return;
 loadRecommendations('promo-check');
 f.addEventListener('submit',e=>{e.preventDefault();
  const list=+f.list.value||0,store=Math.min(+f.store.value||0,list),pct=(+f.percent.value||0)/100,cap=+f.cap.value||Infinity,shipping=+f.shipping.value||0,cashback=+f.cashback.value||0;
  const base=Math.max(0,list-store),coupon=Math.min(base*pct,cap),checkout=Math.max(0,base-coupon)+shipping,effective=Math.max(0,checkout-cashback),saved=list-effective,disc=list>0?saved/list:0;
  const box=document.querySelector('#promo-result'); box.hidden=false;
  let label='🟡 ต้องดูบริบท',cls='warn'; if(disc>=.2){label='🟢 โปรค่อนข้างคุ้ม';cls='good'} else if(disc<.08){label='🔴 ส่วนลดจริงยังน้อย';cls='bad'};
  box.innerHTML=`<span class="pill">ผลคำนวณ</span><div class="big-number ${cls}">${label}</div><div class="kpis"><div class="kpi">จ่ายตอน Checkout<b>${money(checkout)}</b></div><div class="kpi">ต้นทุนสุทธิหลังเงินคืน<b>${money(effective)}</b></div><div class="kpi">ลดจริงเทียบราคาป้าย<b>${fmt(disc*100,1)}%</b></div></div><p>ประโยชน์รวมที่คำนวณได้ประมาณ <strong>${money(saved)}</strong> (รวมผลของค่าส่งและเงินคืนตามที่กรอก)</p><p><small>คำว่า “คุ้ม” เป็นเกณฑ์ช่วยตัดสินใจทั่วไป ไม่ได้อ้างอิงประวัติราคาของสินค้านั้น</small></p>`;
  box.scrollIntoView({behavior:'smooth',block:'nearest'});
 });
}
function initUnit(){
 const f=document.querySelector('#unit-form'); if(!f)return;
 loadRecommendations('unit-price');
 f.addEventListener('submit',e=>{e.preventDefault();
  const ap=+f.ap.value||0,aq=+f.aq.value||0,bp=+f.bp.value||0,bq=+f.bq.value||0,unit=f.unit.value||'หน่วย';
  const au=aq>0?ap/aq:NaN,bu=bq>0?bp/bq:NaN; const box=document.querySelector('#unit-result'); box.hidden=false;
  if(!Number.isFinite(au)||!Number.isFinite(bu)){box.innerHTML='<div class="big-number bad">กรุณากรอกราคาและปริมาณให้มากกว่า 0</div>';return;}
  const winner=au<bu?'A':bu<au?'B':'เท่ากัน'; const cheap=Math.min(au,bu),exp=Math.max(au,bu); const pct=exp>0?(exp-cheap)/exp:0;
  box.innerHTML=`<span class="pill">ผลคำนวณ</span><div class="big-number good">${winner==='เท่ากัน'?'ราคา/หน่วยเท่ากัน':`🏆 ตัวเลือก ${winner} คุ้มกว่า`}</div><div class="kpis"><div class="kpi">A ต่อ ${escapeHtml(unit)}<b>${fmt(au,4)} บาท</b></div><div class="kpi">B ต่อ ${escapeHtml(unit)}<b>${fmt(bu,4)} บาท</b></div><div class="kpi">ต่างกัน<b>${fmt(pct*100,1)}%</b></div></div><p>${winner==='เท่ากัน'?'เลือกจากคุณภาพ ความสะดวก หรือโปรอื่นได้เลย':`ถ้าคุณภาพใกล้เคียงกัน ตัวเลือก ${winner} ให้ปริมาณต่อเงินที่ดีกว่า`}</p>`;
  box.scrollIntoView({behavior:'smooth',block:'nearest'});
 });
}


const HOME_PREVIEW_ITEMS = [
  {name:'Power bank 10,000mAh ชาร์จเร็ว',category:'powerbank',display_price:'฿699',previous_price:'฿890',discount_percent:21,merchant:'ร้านตัวอย่าง',badge:'คุ้มมาก',state:'good',reason:'ราคาตัวอย่างต่ำกว่าราคาอ้างอิง เหมาะกับการดูรูปแบบการ์ด',image_url:'/assets/product-placeholder.svg',go_url:'#',demo:true},
  {name:'หัวชาร์จ USB-C PD 30W',category:'charger',display_price:'฿329',previous_price:'฿399',discount_percent:18,merchant:'ร้านตัวอย่าง',badge:'ราคาดี',state:'good',reason:'ตัวอย่างการ์ดที่ระบบจะสร้างจากข้อมูลสินค้าอัตโนมัติ',image_url:'/assets/product-placeholder.svg',go_url:'#',demo:true},
  {name:'USB Hub 6-in-1 สำหรับโน้ตบุ๊ก',category:'office',display_price:'฿590',previous_price:'฿790',discount_percent:25,merchant:'ร้านไอทีตัวอย่าง',badge:'คุ้มมาก',state:'good',reason:'เหมาะกับคนที่ต้องการเพิ่มพอร์ตสำหรับงานประจำวัน',image_url:'/assets/product-placeholder.svg',go_url:'#',demo:true},
  {name:'ซองไปรษณีย์ 100 ใบ',category:'packaging',display_price:'฿149',previous_price:'฿169',discount_percent:12,merchant:'ร้านแพ็กของตัวอย่าง',badge:'ราคาดี',state:'good',reason:'ตัวอย่างสินค้าสำหรับร้านออนไลน์ที่ต้องแพ็กของเป็นประจำ',image_url:'/assets/product-placeholder.svg',go_url:'#',demo:true},
  {name:'เครื่องชั่งดิจิทัลสำหรับพัสดุ',category:'office',display_price:'฿429',previous_price:'฿459',discount_percent:7,merchant:'ร้านตัวอย่าง',badge:'พอใช้',state:'neutral',reason:'ส่วนต่างยังไม่มาก ถ้าไม่รีบอาจรอโปรเพิ่ม',image_url:'/assets/product-placeholder.svg',go_url:'#',demo:true},
  {name:'กระดาษทิชชูแบบแพ็ก',category:'household',display_price:'฿189',previous_price:'฿219',discount_percent:14,merchant:'ร้านของใช้ตัวอย่าง',badge:'ราคาดี',state:'good',reason:'ใช้คู่กับเครื่องมือเทียบราคาต่อหน่วยเพื่อดูว่าคุ้มจริงหรือไม่',image_url:'/assets/product-placeholder.svg',go_url:'#',demo:true},
  {name:'น้ำยาซักผ้า 1,800 ml',category:'household',display_price:'฿129',previous_price:'฿135',discount_percent:4,merchant:'ร้านของใช้ตัวอย่าง',badge:'ควรรอ',state:'warn',reason:'ส่วนลดตัวอย่างยังน้อย ควรเทียบราคาต่อ ml ก่อนตัดสินใจ',image_url:'/assets/product-placeholder.svg',go_url:'#',demo:true},
  {name:'สติกเกอร์ฉลากความร้อน',category:'label',display_price:'฿99',previous_price:'฿129',discount_percent:23,merchant:'ร้านแพ็กของตัวอย่าง',badge:'คุ้มมาก',state:'good',reason:'ตัวอย่างอุปกรณ์ร้านออนไลน์ที่ราคาลดลงชัดเจน',image_url:'/assets/product-placeholder.svg',go_url:'#',demo:true},
  {name:'ขาตั้งมือถือพับได้',category:'general',display_price:'฿79',previous_price:'฿99',discount_percent:20,merchant:'ร้านตัวอย่าง',badge:'คุ้มมาก',state:'good',reason:'การ์ดตัวอย่างสำหรับสินค้าทั่วไป',image_url:'/assets/product-placeholder.svg',go_url:'#',demo:true},
  {name:'แชมพูแพ็กคู่',category:'personal',display_price:'฿259',previous_price:'฿299',discount_percent:13,merchant:'ร้านของใช้ตัวอย่าง',badge:'ราคาดี',state:'good',reason:'ควรเทียบราคาต่อ ml และจำนวนชิ้นก่อนซื้อ',image_url:'/assets/product-placeholder.svg',go_url:'#',demo:true}
];

function productCardHtml(x, index=0){
  const demo=!!x.demo;
  const cls=x.state==='warn'?'warn':x.state==='bad'?'bad':'good';
  const old=x.previous_price?`<span class="old-price">${escapeHtml(x.previous_price)}</span>`:'';
  const discount=Number.isFinite(Number(x.discount_percent))&&Number(x.discount_percent)>0?`<span class="discount-chip">-${fmt(Number(x.discount_percent),0)}%</span>`:'';
  const img=x.image_url||'/assets/product-placeholder.svg';
  const action=demo
    ? `<span class="demo-action">ตัวอย่าง UI</span>`
    : `<a class="deal-action" rel="sponsored nofollow noopener" href="${escapeAttr(x.go_url)}">ดูราคาวันนี้</a>`;
  return `<article class="deal-card" data-category="${escapeAttr(x.category||'general')}">
    <div class="deal-image"><img src="${escapeAttr(img)}" alt="${escapeAttr(x.image_alt||x.name)}" loading="lazy" decoding="async" data-fallback="1"><span class="worth-badge ${cls}">${escapeHtml(x.badge||'น่าจับตา')}</span><span class="deal-rank ${index<3?'top':''}">${index+1}</span></div>
    <div class="deal-body">
      <div class="deal-merchant">${escapeHtml(x.merchant||'Marketplace')}</div>
      <h3>${escapeHtml(x.name)}</h3>
      <div class="price-line">${old}<strong>${escapeHtml(x.display_price||'เช็กราคา')}</strong>${discount}</div>
      <p>${escapeHtml(x.reason||'รายการที่ระบบคัดจากข้อมูลล่าสุดที่มี')}</p>
      ${action}
    </div>
  </article>`;
}

function renderHomeFeed(items, shops=[], preview=false){
  const grid=document.querySelector('#home-product-grid');
  const empty=document.querySelector('#home-feed-empty');
  const status=document.querySelector('#feed-status');
  if(!grid)return;
  const data=items||[];
  if(!data.length){
    grid.innerHTML=''; if(empty)empty.hidden=false; if(status)status.hidden=true;
  }else{
    if(empty)empty.hidden=true;
    grid.innerHTML=data.map(productCardHtml).join('');
    grid.querySelectorAll('img[data-fallback]').forEach(img=>img.addEventListener('error',()=>{img.src='/assets/product-placeholder.svg';},{once:true}));
    if(status){status.hidden=false;status.innerHTML=preview?'โหมดตัวอย่าง UI — ข้อมูลและราคาในส่วนนี้เป็นตัวอย่าง ไม่ใช่ราคาจริง':'อัปเดตอัตโนมัติจากรายการสินค้าที่เปิดใช้งานในระบบ';status.classList.toggle('preview',preview)}
  }
  const shopGrid=document.querySelector('#home-shop-grid');
  if(shopGrid){
    if(preview){
      shops=[{merchant:'ร้านตัวอย่าง',count:4},{merchant:'ร้านไอทีตัวอย่าง',count:2},{merchant:'ร้านของใช้ตัวอย่าง',count:2},{merchant:'ร้านแพ็กของตัวอย่าง',count:2}];
    }
    shopGrid.innerHTML=(shops||[]).length?shops.map(s=>`<article class="shop-card"><div class="shop-mark">${escapeHtml((s.merchant||'?').slice(0,1).toUpperCase())}</div><div><h3>${escapeHtml(s.merchant)}</h3><p>${fmt(Number(s.count)||0,0)} รายการที่มีข้อมูล</p></div><span>→</span></article>`).join(''):`<div class="shop-empty">เมื่อมีสินค้าที่เปิดใช้งาน ร้านค้าที่เกี่ยวข้องจะขึ้นตรงนี้อัตโนมัติ</div>`;
  }
}

function applyHomeCategory(cat){
  document.querySelectorAll('.deal-card').forEach(card=>{card.hidden=cat!=='all'&&card.dataset.category!==cat});
  document.querySelectorAll('[data-home-category]').forEach(b=>b.classList.toggle('active',b.dataset.homeCategory===cat));
}

async function loadHomeFeed(){
  const grid=document.querySelector('#home-product-grid'); if(!grid)return;
  const preview=new URLSearchParams(location.search).get('preview')==='1';
  if(preview){renderHomeFeed(HOME_PREVIEW_ITEMS,[],true);return;}
  try{
    const r=await fetch('/api/home-feed'); const d=await r.json();
    renderHomeFeed(d.items||[],d.shops||[],false);
  }catch{renderHomeFeed([],[],false)}
}

async function homeSearch(query){
  const out=document.querySelector('#home-search-result'); if(!out)return;
  const q=String(query||'').trim(); if(!q){out.hidden=true;out.innerHTML='';return;}
  out.hidden=false; out.innerHTML='<div class="search-loading">กำลังค้นหา…</div>';
  try{
    const r=await fetch(`/api/product-search?q=${encodeURIComponent(q)}`); const d=await r.json();
    if(!d.items?.length){
      out.innerHTML=`<div class="search-empty"><b>ยังไม่พบรายการนี้ใน MEEPIAP</b><span>ลองพิมพ์ชื่อสินค้าแทนลิงก์ หรือใช้เครื่องมือเช็กโปรด้านล่างได้เลย</span><a href="/tools/promo-check/">ไปเช็กโปร →</a></div>`;return;
    }
    out.innerHTML=`<div class="search-result-head"><b>พบ ${d.items.length} รายการ</b><button type="button" data-close-search>ปิด</button></div><div class="search-result-grid">${d.items.map(productCardHtml).join('')}</div>`;
    out.querySelector('[data-close-search]')?.addEventListener('click',()=>{out.hidden=true});
  }catch{out.innerHTML='<div class="search-empty"><b>ค้นหาไม่ได้ชั่วคราว</b><span>ลองใหม่อีกครั้ง หรือใช้เครื่องมือคำนวณได้ตามปกติ</span></div>'}
}

function initHome(){
  const form=document.querySelector('#home-search-form'); if(!form)return;
  loadHomeFeed();
  form.addEventListener('submit',e=>{e.preventDefault();homeSearch(form.q.value)});
  document.querySelector('#paste-link')?.addEventListener('click',async()=>{
    try{const t=await navigator.clipboard.readText();if(t){form.q.value=t;form.q.focus()}}catch{form.q.focus()}
  });
  document.querySelectorAll('[data-home-category]').forEach(b=>b.addEventListener('click',()=>applyHomeCategory(b.dataset.homeCategory)));
}

document.addEventListener('DOMContentLoaded',()=>{initHome();initProfit();initPromo();initUnit();});
