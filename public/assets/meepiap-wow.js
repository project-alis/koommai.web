(() => {
  const examples = [
    ['🔧','ร้านซ่อมมือถือ'],
    ['🎁','ของฟรี'],
    ['♻️','โต๊ะทำงานมือสอง'],
    ['🍜','ของกินใกล้ฉัน']
  ];

  function submitSearch(value){
    const form = document.querySelector('#discover-search-form');
    if(!form) return;
    const input = form.querySelector('input[name="q"]');
    if(!input) return;
    input.value = value;
    input.focus();
    form.requestSubmit();
  }

  function initQuickSearch(){
    const status = document.querySelector('#near-status');
    if(!status || document.querySelector('.mee-quick-searches')) return;
    const box = document.createElement('div');
    box.className = 'mee-quick-searches';
    box.setAttribute('aria-label','คำค้นยอดนิยมสำหรับลองใช้งาน');
    box.innerHTML = '<span class="mee-quick-label">ลองค้นเลย</span>' + examples.map(([icon,label]) => `<button type="button" data-mee-query="${label}">${icon} ${label}</button>`).join('');
    status.insertAdjacentElement('afterend', box);
    box.querySelectorAll('[data-mee-query]').forEach(button => button.addEventListener('click', () => submitSearch(button.dataset.meeQuery)));
  }

  function initHeroHint(){
    const input = document.querySelector('#discover-search-form input[name="q"]');
    if(!input) return;
    const hints = ['แอร์','ร้านซ่อมมือถือ','โต๊ะทำงานมือสอง','ของฟรี','ร้านอาหารใกล้ฉัน'];
    let i = 0;
    const rotate = () => {
      if(document.activeElement === input || input.value) return;
      input.placeholder = `หาอะไรอยู่? เช่น ${hints[i % hints.length]}`;
      i += 1;
    };
    rotate();
    const timer = setInterval(rotate, 3200);
    window.addEventListener('pagehide', () => clearInterval(timer), {once:true});
  }

  function init(){
    initQuickSearch();
    initHeroHint();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
