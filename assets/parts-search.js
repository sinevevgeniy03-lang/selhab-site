(()=>{'use strict';
 const form=document.querySelector('#parts-search-form');if(!form)return;
 const input=form.querySelector('input'),status=document.querySelector('#parts-search-status'),results=document.querySelector('#parts-search-results'),more=document.querySelector('#parts-search-more');
 const cache=new Map();let run=0,state=null;
 const norm=s=>s.toLowerCase().replace(/ё/g,'е').replace(/[\s.\-_/]/g,'');
 const keyfile=s=>Array.from(s).map(c=>c.charCodeAt(0).toString(16).padStart(4,'0')).join('');
 async function data(file){if(cache.has(file))return cache.get(file);const response=await fetch('assets/catalog/'+file,{credentials:'omit',referrerPolicy:'no-referrer'});if(response.status===404)return null;if(!response.ok)throw Error('network');const value=await response.json();cache.set(file,value);if(cache.size>100)cache.delete(cache.keys().next().value);return value;}
 function show(row){const card=document.createElement('article');card.className='search-part';const article=document.createElement('p');article.className='search-part-article';article.textContent=row[0]?'Артикул: '+row[0]:'Артикул уточняйте';const title=document.createElement('h3');title.textContent=row[1];const price=document.createElement('p');price.textContent='Цена по запросу';const call=document.createElement('a');call.className='button';call.href='tel:+79524155056';call.textContent='Позвонить в отдел продаж ↗';card.append(article,title,price,call);results.append(card);}
 async function page(token){more.hidden=true;let added=0;const current=state;
  while(current.position<current.ids.length&&added<24){const id=current.ids[current.position++],chunk=await data('rows/'+Math.floor(id/1000)+'.json');if(token!==run)return;const row=chunk?.[id%1000];if(!row)continue;const a=norm(row[0]),n=norm(row[1]);if(a!==current.query&&!current.words.every(w=>a.includes(w)||n.includes(w)))continue;show(row);added++;current.shown++;}
  if(token!==run)return;status.textContent=current.shown?'Показано позиций: '+current.shown+'. Наличие и условия поставки уточняйте по телефону.':'По этому запросу ничего не найдено. Попробуйте другой артикул или позвоните: +7 952 415-50-56.';more.hidden=current.position>=current.ids.length;
 }
 form.addEventListener('submit',async event=>{event.preventDefault();const token=++run;results.replaceChildren();more.hidden=true;const q=input.value.trim().slice(0,100),words=(q.match(/[\p{L}\p{N}./_-]+/gu)||[]).map(norm).filter(Boolean);if(norm(q).length<3||!words.length){status.textContent='Введите минимум 3 символа артикула или названия.';return;}status.textContent='Ищем в каталоге…';form.setAttribute('aria-busy','true');
  try{const query=norm(q),bucket=Array.from(query).reduce((sum,c)=>sum+c.charCodeAt(0),0)%256;const exact=await data('exact/'+bucket+'.json');let ids=null;for(const word of words.filter(w=>w.length>=3)){const found=await data('index/'+keyfile(word.slice(0,3))+'.json')||[];if(ids===null)ids=found;else{const set=new Set(found);ids=ids.filter(id=>set.has(id));}}const exactIds=exact?.[query]||[];if(token!==run)return;state={query,words,ids:exactIds.length?exactIds:[...new Set(ids||[])],position:0,shown:0};await page(token);
  }catch{if(token===run)status.textContent='Не удалось загрузить поиск. Попробуйте ещё раз или позвоните: +7 952 415-50-56.';}finally{if(token===run)form.removeAttribute('aria-busy');}
 });
 more.addEventListener('click',async()=>{more.disabled=true;try{await page(run);}catch{status.textContent='Загрузка прервалась. Повторите поиск или позвоните менеджеру.';}finally{more.disabled=false;}});
})();
