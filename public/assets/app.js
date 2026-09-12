const fmt = (n, digits=2) => new Intl.NumberFormat('th-TH',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(Number.isFinite(n)?n:0);
const money = (n) => `${fmt(n,2)} บาท`;

async function loadRecommendations(tool){
  const box=document.querySelector('[data-recommendations]'); if(!box) return;
  try{
    const r=await fetch(`/api/recommendations?tool=${encodeURIComponent(tool)}`);
    const d=await r.json();
    if(!d.items?.length){ box.hidden=true; return; }
    box.hidden=false;
    box.innerHTML=`<div class="rec-head"><div><span class="eyebrow">ตัวเลือกที่เกี่ยวข้อง</span><h2>ระบบเลือกสินค้าให้จากหมวดนี้</h2></div><p>รูป ข้อความ และปุ่มซื้อถูกสร้างอัตโนมัติจากข้อมูลสินค้าใน D1</p></div><div class="rec-grid">${d.items.map(x=>{
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
document.addEventListener('DOMContentLoaded',()=>{initProfit();initPromo();initUnit();});
