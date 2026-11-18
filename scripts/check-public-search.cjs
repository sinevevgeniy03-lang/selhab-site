const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function element(){return {children:[],listeners:{},value:'',hidden:false,textContent:'',append(...items){this.children.push(...items)},replaceChildren(){this.children=[]},setAttribute(){},removeAttribute(){},addEventListener(event,fn){this.listeners[event]=fn}};}
const nodes=Object.fromEntries(['#parts-search-form','#parts-search-status','#parts-search-results','#parts-search-more'].map(k=>[k,element()]));const input=element();nodes['#parts-search-form'].querySelector=()=>input;
const document={querySelector:k=>nodes[k],createElement:()=>element()};let requests=0;
const context={document,Map,Set,fetch:async url=>{requests++;const file=path.join(root,url);return fs.existsSync(file)?{status:200,ok:true,json:async()=>JSON.parse(fs.readFileSync(file,'utf8'))}:{status:404,ok:false};}};
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/parts-search.js'),'utf8'),context);
(async()=>{
 input.value='RE504836';await nodes['#parts-search-form'].listeners.submit({preventDefault(){}});assert(nodes['#parts-search-results'].children.length>0,'Known article missing');
 const first=nodes['#parts-search-results'].children[0];assert(first.children[0].textContent.includes('RE504836'));assert.equal(first.children[3].href,'tel:+79524155056');assert.equal(first.children[2].textContent,'Цена по запросу');
 input.value='<script>nonexistent-test-424242</script>';await nodes['#parts-search-form'].listeners.submit({preventDefault(){}});assert.equal(nodes['#parts-search-results'].children.length,0);
 input.value='фи';await nodes['#parts-search-form'].listeners.submit({preventDefault(){}});assert(nodes['#parts-search-status'].textContent.includes('минимум'));
 console.log('PASS: actual exported article, safe rendering, phone link, no-results and minimum length; requests:',requests);
})().catch(e=>{console.error(e);process.exitCode=1});
