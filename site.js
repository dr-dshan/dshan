
const pubs = [...document.querySelectorAll('.pub')];
const yearBtns = [...document.querySelectorAll('[data-year]')];
const search = document.querySelector('#pubSearch');
const sortSel = document.querySelector('#sortOrder');

function applyFilters(){
  if(!pubs.length) return;
  const active = document.querySelector('[data-year].active');
  const year = active ? active.dataset.year : 'all';
  const q = (search?.value || '').trim().toLowerCase();
  pubs.forEach(p=>{
    const matchYear = year === 'all' || p.dataset.year === year;
    const matchQ = !q || p.innerText.toLowerCase().includes(q);
    p.style.display = matchYear && matchQ ? 'grid' : 'none';
  });
}
yearBtns.forEach(b=>b.addEventListener('click',()=>{
  yearBtns.forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  applyFilters();
}));
search?.addEventListener('input',applyFilters);

sortSel?.addEventListener('change',()=>{
  const list=document.querySelector('.pub-list');
  const items=[...list.querySelectorAll('.pub')];
  items.sort((a,b)=>{
    const ya=Number(a.dataset.year||0), yb=Number(b.dataset.year||0);
    return sortSel.value==='asc' ? ya-yb : yb-ya;
  });
  items.forEach(x=>list.appendChild(x));
  applyFilters();
});
