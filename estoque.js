// BarberOS — Módulo Estoque v1
// =================== MÓDULO ESTOQUE ===================

// --- Tab switcher ---
function swEstoqueTab(tab, el){
  document.querySelectorAll('#estoque-tabs .tab').forEach(function(t){t.classList.remove('active');});
  if(el)el.classList.add('active');
  var ep=document.getElementById('est-produtos');
  var ei=document.getElementById('est-insumos');
  if(ep)ep.style.display=tab==='produtos'?'block':'none';
  if(ei)ei.style.display=tab==='insumos'?'block':'none';
  if(tab==='produtos')loadAdmProds();
  else loadAdmSups();
}
function loadEstoque(){
  swEstoqueTab('produtos', document.querySelector('#estoque-tabs .tab'));
  loadDashEstoque();
}

// =================== PRODUTOS (admin) ===================
async function loadAdmProds(){
  var el=document.getElementById('prod-list');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:30px"><div class="spin"></div></div>';
  if(!S.shopId){el.innerHTML='<div style="padding:20px;color:var(--txm);text-align:center">Carregando dados da barbearia...</div>';return;}
  try{
  var{data,error}=await db.from('products').select('*').eq('shop_id',S.shopId).order('name');
  if(error){el.innerHTML='<div style="padding:20px;color:var(--red);text-align:center">Erro: '+error.message+'<br><small>Verifique se o SQL do módulo foi executado no Supabase.</small></div>';return;}
  var prods=data||[];
  var lbl=document.getElementById('prod-count-lbl');
  if(lbl)lbl.textContent=prods.length+' produto'+(prods.length!==1?'s':'');
  if(!prods.length){el.innerHTML='<div style="padding:20px;color:var(--txm);text-align:center">Nenhum produto cadastrado.</div>';return;}
  el.innerHTML=prods.map(function(p){
    var lowStock=p.min_quantity>0&&p.quantity<=p.min_quantity;
    var imgHtml=p.image_url?'<img src="'+p.image_url+'" style="width:44px;height:44px;object-fit:cover;border-radius:var(--rs);flex-shrink:0" alt="">':'<div style="width:44px;height:44px;border-radius:var(--rs);background:var(--dk4);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">📦</div>';
    return'<div style="display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid var(--dk3)">'+
      imgHtml+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:14px;font-weight:600;display:flex;align-items:center;gap:6px">'+p.name+(p.active?'':'<span style="font-size:10px;color:var(--txm);background:var(--dk4);padding:1px 6px;border-radius:4px">inativo</span>')+'</div>'+
        '<div style="font-size:12px;color:var(--txm)">'+fmt(p.price)+' · '+p.category+'</div>'+
        '<div style="font-size:12px;margin-top:2px;color:'+(lowStock?'var(--red)':'var(--grn)')+'">'+
          (lowStock?'⚠ ':'')+p.quantity+' '+p.unit+' em estoque'+
        '</div>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">'+
        '<button onclick="openProdMovMod(\''+p.id+'\',\''+p.name.replace(/'/g,'')+'\','+p.quantity+',\''+p.unit+'\')" style="background:var(--gold);color:var(--dk);border:none;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">± Mov.</button>'+
        '<button onclick="openProdHist(\''+p.id+'\',\''+p.name.replace(/'/g,'')+'\''+')" style="background:var(--dk3);border:1px solid var(--dk4);color:var(--txm);border-radius:6px;padding:5px 10px;font-size:11px;cursor:pointer;font-family:inherit">Histórico</button>'+
        '<button onclick="openProdMod(\''+p.id+'\')" style="background:var(--dk3);border:1px solid var(--dk4);color:var(--gold);border-radius:6px;padding:5px 10px;font-size:11px;cursor:pointer;font-family:inherit">Editar</button>'+
      '</div>'+
    '</div>';
  }).join('');
  }catch(e){el.innerHTML='<div style="padding:20px;color:var(--red);text-align:center">Erro ao carregar produtos.<br><small>'+e.message+'</small></div>';}
}

function openProdMod(id){
  document.getElementById('prod-edit-id').value=id||'';
  document.getElementById('prod-mod-title').textContent=id?'Editar Produto':'Novo Produto';
  document.getElementById('prod-err').style.display='none';
  clearProdImg();
  if(id){
    db.from('products').select('*').eq('id',id).single().then(function(r){
      var p=r.data;if(!p)return;
      document.getElementById('prod-name').value=p.name;
      document.getElementById('prod-desc').value=p.description||'';
      document.getElementById('prod-price').value=p.price;
      document.getElementById('prod-cost').value=p.cost_price||'';
      document.getElementById('prod-cat').value=p.category||'Outros';
      document.getElementById('prod-unit').value=p.unit||'un';
      document.getElementById('prod-qty').value=p.quantity;
      document.getElementById('prod-minqty').value=p.min_quantity||0;
      document.getElementById('prod-img-url').value=p.image_url||'';
      if(p.image_url){
        var thumb=document.getElementById('prod-img-thumb');
        var prev=document.getElementById('prod-img-preview');
        if(thumb)thumb.src=p.image_url;
        if(prev)prev.style.display='block';
      }
    });
  }else{
    ['prod-name','prod-desc','prod-price','prod-cost','prod-qty','prod-minqty','prod-img-url'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});
    document.getElementById('prod-qty').value=0;
    document.getElementById('prod-minqty').value=0;
  }
  openMod('mod-prod');
}

function previewProdImg(input){
  var file=input.files&&input.files[0];if(!file)return;
  var thumb=document.getElementById('prod-img-thumb');
  var prev=document.getElementById('prod-img-preview');
  var reader=new FileReader();
  reader.onload=function(e){if(thumb)thumb.src=e.target.result;if(prev)prev.style.display='block';};
  reader.readAsDataURL(file);
}
function clearProdImg(){
  var fi=document.getElementById('prod-img-file');if(fi)fi.value='';
  var thumb=document.getElementById('prod-img-thumb');if(thumb)thumb.src='';
  var prev=document.getElementById('prod-img-preview');if(prev)prev.style.display='none';
}

async function uploadProdImg(file){
  if(!file)return null;
  try{
    var ext=file.name.split('.').pop().toLowerCase()||'jpg';
    var path='shop-'+S.shopId+'/'+Date.now()+'.'+ext;
    var{data,error}=await db.storage.from('product-images').upload(path,file,{upsert:true,contentType:file.type});
    if(error)throw error;
    var{data:urlData}=db.storage.from('product-images').getPublicUrl(path);
    return urlData&&urlData.publicUrl?urlData.publicUrl:null;
  }catch(e){console.warn('uploadProdImg error:',e);return null;}
}

async function saveProd(){
  var btn=document.getElementById('prod-save-btn');
  var err=document.getElementById('prod-err');
  var name=document.getElementById('prod-name').value.trim();
  var price=parseFloat(document.getElementById('prod-price').value)||0;
  var cost=parseFloat(document.getElementById('prod-cost').value)||0;
  var desc=document.getElementById('prod-desc').value.trim();
  var cat=document.getElementById('prod-cat').value;
  var unit=document.getElementById('prod-unit').value;
  var qty=parseInt(document.getElementById('prod-qty').value)||0;
  var minqty=parseInt(document.getElementById('prod-minqty').value)||0;
  var imgUrl=document.getElementById('prod-img-url').value||'';
  var editId=document.getElementById('prod-edit-id').value;
  if(!name){err.textContent='Informe o nome do produto.';err.style.display='block';return;}
  btn.disabled=true;btn.textContent='Salvando...';
  // Upload de foto se tiver novo arquivo
  var fileInput=document.getElementById('prod-img-file');
  if(fileInput&&fileInput.files&&fileInput.files[0]){
    var uploaded=await uploadProdImg(fileInput.files[0]);
    if(uploaded)imgUrl=uploaded;
  }
  var payload={shop_id:S.shopId,name:name,description:desc,price:price,cost_price:cost,category:cat,unit:unit,quantity:qty,min_quantity:minqty,image_url:imgUrl,active:true};
  var result;
  if(editId){result=await db.from('products').update(payload).eq('id',editId);}
  else{result=await db.from('products').insert(payload);}
  btn.disabled=false;btn.textContent='Salvar produto';
  if(result&&result.error){err.textContent='Erro: '+result.error.message;err.style.display='block';return;}
  toast('Produto salvo!','ok');closeMod('mod-prod');loadAdmProds();loadDashEstoque();
}

async function deleteProd(id){
  if(!confirm('Excluir este produto?'))return;
  await db.from('products').delete().eq('id',id);
  toast('Produto removido!','ok');loadAdmProds();loadDashEstoque();
}

// --- Movimentações de produto ---
function openProdMovMod(id,name,qtdAtual,unit){
  document.getElementById('pmov-product-id').value=id;
  document.getElementById('prod-mov-name').textContent=name;
  document.getElementById('prod-mov-qty-atual').textContent=qtdAtual+' '+unit;
  document.getElementById('pmov-qty').value='';
  document.getElementById('pmov-price').value='';
  document.getElementById('pmov-notes').value='';
  document.getElementById('pmov-date').value=todayLocal();
  setProdMovType('entrada');
  openMod('mod-prod-mov');
}
function setProdMovType(type){
  document.getElementById('pmov-type').value=type;
  var be=document.getElementById('pmov-btn-entrada');
  var bs=document.getElementById('pmov-btn-saida');
  var pl=document.getElementById('pmov-price-lbl');
  if(type==='entrada'){
    be.style.background='rgba(39,174,96,.15)';be.style.borderColor='var(--grn)';be.style.color='var(--grn)';
    bs.style.background='var(--dk3)';bs.style.borderColor='var(--dk4)';bs.style.color='var(--txm)';
    if(pl)pl.textContent='Custo unitário (R$)';
  }else{
    bs.style.background='rgba(201,168,76,.15)';bs.style.borderColor='var(--gold)';bs.style.color='var(--gold)';
    be.style.background='var(--dk3)';be.style.borderColor='var(--dk4)';be.style.color='var(--txm)';
    if(pl)pl.textContent='Preço de venda (R$)';
  }
}
async function saveProdMov(){
  var pid=document.getElementById('pmov-product-id').value;
  var type=document.getElementById('pmov-type').value;
  var qty=parseInt(document.getElementById('pmov-qty').value)||0;
  var price=parseFloat(document.getElementById('pmov-price').value)||0;
  var notes=document.getElementById('pmov-notes').value.trim();
  var date=document.getElementById('pmov-date').value||todayLocal();
  if(!qty||qty<=0){toast('Informe a quantidade.','err');return;}
  // Buscar produto atual para atualizar estoque
  var{data:prod}=await db.from('products').select('quantity').eq('id',pid).single();
  if(!prod){toast('Produto não encontrado.','err');return;}
  var newQty=type==='entrada'?prod.quantity+qty:prod.quantity-qty;
  if(newQty<0){toast('Estoque insuficiente para saída.','err');return;}
  // Inserir movimentação
  var{error:mvErr}=await db.from('product_movements').insert({
    shop_id:S.shopId,product_id:pid,type:type,quantity:qty,
    unit_price:price,total_price:qty*price,notes:notes,movement_date:date
  });
  if(mvErr){toast('Erro: '+mvErr.message,'err');return;}
  // Atualizar estoque
  await db.from('products').update({quantity:newQty}).eq('id',pid);
  toast(type==='entrada'?'Entrada registrada!':'Saída registrada!','ok');
  closeMod('mod-prod-mov');loadAdmProds();loadDashEstoque();
}

async function openProdHist(id,name){
  document.getElementById('prod-hist-title').textContent='Histórico — '+name;
  document.getElementById('prod-hist-list').innerHTML='<div style="text-align:center;padding:20px"><div class="spin"></div></div>';
  openMod('mod-prod-hist');
  var{data}=await db.from('product_movements').select('*').eq('product_id',id).order('movement_date',{ascending:false}).order('created_at',{ascending:false}).limit(50);
  var movs=data||[];
  if(!movs.length){document.getElementById('prod-hist-list').innerHTML='<div style="padding:16px;color:var(--txm);text-align:center">Nenhuma movimentação.</div>';return;}
  document.getElementById('prod-hist-list').innerHTML=movs.map(function(m){
    var isEnt=m.type==='entrada';
    return'<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--dk3)">'+
      '<div style="width:32px;height:32px;border-radius:50%;background:'+(isEnt?'rgba(39,174,96,.15)':'rgba(201,168,76,.12)')+';display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">'+(isEnt?'↓':'↑')+'</div>'+
      '<div style="flex:1">'+
        '<div style="font-size:13px;font-weight:600;color:'+(isEnt?'var(--grn)':'var(--gold)')+'">'+( isEnt?'Entrada':'Saída')+' · '+m.quantity+' un</div>'+
        '<div style="font-size:11px;color:var(--txm)">'+new Date(m.movement_date+'T12:00').toLocaleDateString('pt-BR')+(m.notes?' · '+m.notes:'')+'</div>'+
      '</div>'+
      '<div style="text-align:right;font-size:12px;font-weight:700;color:'+(isEnt?'var(--txm)':'var(--gold)')+'">'+( m.total_price?fmt(m.total_price):'')+'</div>'+
    '</div>';
  }).join('');
}

// =================== INSUMOS (admin) ===================
async function loadAdmSups(){
  var el=document.getElementById('sup-list');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:30px"><div class="spin"></div></div>';
  if(!S.shopId){el.innerHTML='<div style="padding:20px;color:var(--txm);text-align:center">Carregando dados da barbearia...</div>';return;}
  try{
  var{data,error}=await db.from('supplies').select('*').eq('shop_id',S.shopId).order('name');
  if(error){el.innerHTML='<div style="padding:20px;color:var(--red);text-align:center">Erro: '+error.message+'<br><small>Verifique se o SQL do módulo foi executado no Supabase.</small></div>';return;}
  var sups=data||[];
  var lbl=document.getElementById('sup-count-lbl');
  if(lbl)lbl.textContent=sups.length+' insumo'+(sups.length!==1?'s':'');
  if(!sups.length){el.innerHTML='<div style="padding:20px;color:var(--txm);text-align:center">Nenhum insumo cadastrado.</div>';return;}
  el.innerHTML=sups.map(function(s){
    var lowStock=s.min_quantity>0&&s.quantity<=s.min_quantity;
    return'<div style="display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid var(--dk3)">'+
      '<div style="width:44px;height:44px;border-radius:var(--rs);background:var(--dk4);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🧴</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:14px;font-weight:600">'+s.name+'</div>'+
        '<div style="font-size:12px;color:var(--txm)">'+s.category+' · '+s.unit+'</div>'+
        '<div style="font-size:12px;margin-top:2px;color:'+(lowStock?'var(--red)':'var(--grn)')+'">'+
          (lowStock?'⚠ ':'')+s.quantity+' '+s.unit+' em estoque'+
        '</div>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">'+
        '<button onclick="openSupMovMod(\''+s.id+'\',\''+s.name.replace(/'/g,'')+'\','+s.quantity+',\''+s.unit+'\')" style="background:var(--gold);color:var(--dk);border:none;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">± Mov.</button>'+
        '<button onclick="openSupHist(\''+s.id+'\',\''+s.name.replace(/'/g,'')+'\''+')" style="background:var(--dk3);border:1px solid var(--dk4);color:var(--txm);border-radius:6px;padding:5px 10px;font-size:11px;cursor:pointer;font-family:inherit">Histórico</button>'+
        '<button onclick="openSupMod(\''+s.id+'\')" style="background:var(--dk3);border:1px solid var(--dk4);color:var(--gold);border-radius:6px;padding:5px 10px;font-size:11px;cursor:pointer;font-family:inherit">Editar</button>'+
      '</div>'+
    '</div>';
  }).join('');
  }catch(e){el.innerHTML='<div style="padding:20px;color:var(--red);text-align:center">Erro ao carregar insumos.<br><small>'+e.message+'</small></div>';}
}

function openSupMod(id){
  document.getElementById('sup-edit-id').value=id||'';
  document.getElementById('sup-mod-title').textContent=id?'Editar Insumo':'Novo Insumo';
  if(id){
    db.from('supplies').select('*').eq('id',id).single().then(function(r){
      var s=r.data;if(!s)return;
      document.getElementById('sup-name').value=s.name;
      document.getElementById('sup-cat').value=s.category||'Outros';
      document.getElementById('sup-unit').value=s.unit||'un';
      document.getElementById('sup-qty').value=s.quantity;
      document.getElementById('sup-minqty').value=s.min_quantity||0;
    });
  }else{
    ['sup-name','sup-qty','sup-minqty'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});
    document.getElementById('sup-qty').value=0;
    document.getElementById('sup-minqty').value=0;
  }
  openMod('mod-sup');
}

async function saveSup(){
  var name=document.getElementById('sup-name').value.trim();
  var cat=document.getElementById('sup-cat').value;
  var unit=document.getElementById('sup-unit').value;
  var qty=parseFloat(document.getElementById('sup-qty').value)||0;
  var minqty=parseFloat(document.getElementById('sup-minqty').value)||0;
  var editId=document.getElementById('sup-edit-id').value;
  if(!name){toast('Informe o nome do insumo.','err');return;}
  var payload={shop_id:S.shopId,name:name,category:cat,unit:unit,quantity:qty,min_quantity:minqty,active:true};
  var result;
  if(editId)result=await db.from('supplies').update(payload).eq('id',editId);
  else result=await db.from('supplies').insert(payload);
  if(result&&result.error){toast('Erro: '+result.error.message,'err');return;}
  toast('Insumo salvo!','ok');closeMod('mod-sup');loadAdmSups();loadDashEstoque();
}

// --- Movimentações de insumo ---
function openSupMovMod(id,name,qtdAtual,unit){
  document.getElementById('smov-supply-id').value=id;
  document.getElementById('sup-mov-name').textContent=name;
  document.getElementById('sup-mov-qty-atual').textContent=qtdAtual+' '+unit;
  document.getElementById('smov-qty').value='';
  document.getElementById('smov-cost').value='';
  document.getElementById('smov-notes').value='';
  document.getElementById('smov-date').value=todayLocal();
  setSupMovType('entrada');
  openMod('mod-sup-mov');
}
function setSupMovType(type){
  document.getElementById('smov-type').value=type;
  var be=document.getElementById('smov-btn-entrada');
  var bc=document.getElementById('smov-btn-consumo');
  if(type==='entrada'){
    be.style.background='rgba(39,174,96,.15)';be.style.borderColor='var(--grn)';be.style.color='var(--grn)';
    bc.style.background='var(--dk3)';bc.style.borderColor='var(--dk4)';bc.style.color='var(--txm)';
  }else{
    bc.style.background='rgba(192,57,43,.12)';bc.style.borderColor='var(--red)';bc.style.color='var(--red)';
    be.style.background='var(--dk3)';be.style.borderColor='var(--dk4)';be.style.color='var(--txm)';
  }
}
async function saveSupMov(){
  var sid=document.getElementById('smov-supply-id').value;
  var type=document.getElementById('smov-type').value;
  var qty=parseFloat(document.getElementById('smov-qty').value)||0;
  var cost=parseFloat(document.getElementById('smov-cost').value)||0;
  var notes=document.getElementById('smov-notes').value.trim();
  var date=document.getElementById('smov-date').value||todayLocal();
  if(!qty||qty<=0){toast('Informe a quantidade.','err');return;}
  var{data:sup}=await db.from('supplies').select('quantity').eq('id',sid).single();
  if(!sup){toast('Insumo não encontrado.','err');return;}
  var newQty=type==='entrada'?sup.quantity+qty:sup.quantity-qty;
  if(newQty<0){toast('Estoque insuficiente para consumo.','err');return;}
  var{error:mvErr}=await db.from('supply_movements').insert({
    shop_id:S.shopId,supply_id:sid,type:type,quantity:qty,
    unit_cost:cost,total_cost:qty*cost,notes:notes,movement_date:date
  });
  if(mvErr){toast('Erro: '+mvErr.message,'err');return;}
  await db.from('supplies').update({quantity:newQty}).eq('id',sid);
  toast(type==='entrada'?'Entrada registrada!':'Consumo registrado!','ok');
  closeMod('mod-sup-mov');loadAdmSups();loadDashEstoque();
}

async function openSupHist(id,name){
  document.getElementById('sup-hist-title').textContent='Histórico — '+name;
  document.getElementById('sup-hist-list').innerHTML='<div style="text-align:center;padding:20px"><div class="spin"></div></div>';
  openMod('mod-sup-hist');
  var{data}=await db.from('supply_movements').select('*').eq('supply_id',id).order('movement_date',{ascending:false}).order('created_at',{ascending:false}).limit(50);
  var movs=data||[];
  if(!movs.length){document.getElementById('sup-hist-list').innerHTML='<div style="padding:16px;color:var(--txm);text-align:center">Nenhuma movimentação.</div>';return;}
  document.getElementById('sup-hist-list').innerHTML=movs.map(function(m){
    var isEnt=m.type==='entrada';
    return'<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--dk3)">'+
      '<div style="width:32px;height:32px;border-radius:50%;background:'+(isEnt?'rgba(39,174,96,.15)':'rgba(192,57,43,.12)')+';display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">'+(isEnt?'↓':'↑')+'</div>'+
      '<div style="flex:1">'+
        '<div style="font-size:13px;font-weight:600;color:'+(isEnt?'var(--grn)':'var(--red)')+'">'+( isEnt?'Entrada':'Consumo')+' · '+m.quantity+'</div>'+
        '<div style="font-size:11px;color:var(--txm)">'+new Date(m.movement_date+'T12:00').toLocaleDateString('pt-BR')+(m.notes?' · '+m.notes:'')+'</div>'+
      '</div>'+
      '<div style="text-align:right;font-size:12px;font-weight:700;color:var(--txm)">'+( m.total_cost?fmt(m.total_cost):'')+'</div>'+
    '</div>';
  }).join('');
}

// =================== VITRINE CLIENTE (loja) ===================
async function loadLoja(){
  var grid=document.getElementById('loja-grid');
  var cats=document.getElementById('loja-cats');
  var countEl=document.getElementById('loja-count');
  if(!grid)return;
  grid.innerHTML='<div style="grid-column:span 2;text-align:center;padding:30px"><div class="spin"></div></div>';
  if(!S.shopId){
    // retry
    var retries=0;
    while(!S.shopId&&retries<6){await new Promise(function(r){setTimeout(r,500);});retries++;}
    if(!S.shopId){grid.innerHTML='<div style="grid-column:span 2;padding:20px;color:var(--txm);text-align:center">Nenhum produto disponível.</div>';return;}
  }
  var{data}=await db.from('products').select('*').eq('shop_id',S.shopId).eq('active',true).gt('quantity',0).order('category').order('name');
  var prods=data||[];
  if(countEl)countEl.textContent=prods.length+' produto'+(prods.length!==1?'s':'');
  if(!prods.length){grid.innerHTML='<div style="grid-column:span 2;padding:30px;color:var(--txm);text-align:center">Nenhum produto disponível no momento.</div>';return;}
  // Categorias únicas
  var catList=[...new Set(prods.map(function(p){return p.category;}))];
  if(cats){
    cats.innerHTML='<button onclick="filterLoja(\'\')" id="loja-cat-all" style="background:var(--gold);color:var(--dk);border:none;border-radius:50px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit">Todos</button>'+
      catList.map(function(c){return'<button onclick="filterLoja(\''+c+'\')" style="background:var(--dk3);border:1px solid var(--dk4);color:var(--txm);border-radius:50px;padding:6px 14px;font-size:12px;cursor:pointer;white-space:nowrap;font-family:inherit">'+c+'</button>';}).join('');
  }
  window._lojaProds=prods;
  renderLojaGrid(prods);
}
function filterLoja(cat){
  document.querySelectorAll('#loja-cats button').forEach(function(b){
    b.style.background='var(--dk3)';b.style.color='var(--txm)';b.style.border='1px solid var(--dk4)';
  });
  var allBtn=document.getElementById('loja-cat-all');
  var prods=window._lojaProds||[];
  if(!cat){
    if(allBtn){allBtn.style.background='var(--gold)';allBtn.style.color='var(--dk)';allBtn.style.border='none';}
    renderLojaGrid(prods);
  }else{
    // Highlight categoria clicada
    var filtered=prods.filter(function(p){return p.category===cat;});
    renderLojaGrid(filtered);
  }
}
function renderLojaGrid(prods){
  var grid=document.getElementById('loja-grid');if(!grid)return;
  grid.innerHTML=prods.map(function(p){
    var img=p.image_url?'<img src="'+p.image_url+'" alt="'+p.name+'" style="width:100%;height:120px;object-fit:cover;border-radius:var(--rs) var(--rs) 0 0" loading="lazy">':
      '<div style="width:100%;height:120px;background:var(--dk4);border-radius:var(--rs) var(--rs) 0 0;display:flex;align-items:center;justify-content:center;font-size:36px">📦</div>';
    return'<div style="background:var(--dk3);border:1px solid var(--dk4);border-radius:var(--r);overflow:hidden">'+
      img+
      '<div style="padding:10px">'+
        '<div style="font-size:13px;font-weight:700;margin-bottom:2px">'+p.name+'</div>'+
        (p.description?'<div style="font-size:11px;color:var(--txm);margin-bottom:6px;line-height:1.4">'+p.description+'</div>':'')+
        '<div style="font-size:16px;font-weight:700;color:var(--gold)">'+fmt(p.price)+'</div>'+
        '<div style="font-size:10px;color:var(--txm);margin-top:2px">'+p.quantity+' '+p.unit+' disponível'+(p.quantity!==1?'is':'')+'</div>'+
      '</div>'+
    '</div>';
  }).join('');
}

// =================== DASHBOARD ESTOQUE ===================
async function loadDashEstoque(){
  if(!S.shopId)return;
  var block=document.getElementById('dash-estoque-block');
  if(!block)return;
  block.style.display='block';
  try{
    var mesInicio=todayLocal().slice(0,7)+'-01';
    // Vendas de produtos no mês (saídas)
    var{data:vendas}=await db.from('product_movements')
      .select('total_price').eq('shop_id',S.shopId).eq('type','saida')
      .gte('movement_date',mesInicio);
    var totalVendas=(vendas||[]).reduce(function(s,m){return s+Number(m.total_price||0);},0);
    var elV=document.getElementById('dash-prod-vendas');if(elV)elV.textContent=fmt(totalVendas);
    // Custo insumos no mês (entradas com custo)
    var{data:custos}=await db.from('supply_movements')
      .select('total_cost').eq('shop_id',S.shopId).eq('type','entrada')
      .gte('movement_date',mesInicio);
    var totalCusto=(custos||[]).reduce(function(s,m){return s+Number(m.total_cost||0);},0);
    var elC=document.getElementById('dash-sup-custo');if(elC)elC.textContent=fmt(totalCusto);
    // Alertas de estoque baixo
    var{data:baixoProds}=await db.from('products').select('name,quantity,min_quantity,unit')
      .eq('shop_id',S.shopId).eq('active',true)
      .filter('quantity','lte','min_quantity').gt('min_quantity',0);
    var{data:baixoSups}=await db.from('supplies').select('name,quantity,min_quantity,unit')
      .eq('shop_id',S.shopId).eq('active',true)
      .filter('quantity','lte','min_quantity').gt('min_quantity',0);
    var alertas=[...(baixoProds||[]).map(function(p){return{nome:p.name,qty:p.quantity,unit:p.unit,tipo:'produto'};}),...(baixoSups||[]).map(function(s){return{nome:s.name,qty:s.quantity,unit:s.unit,tipo:'insumo'};})];
    var alertEl=document.getElementById('dash-estoque-alertas');
    if(alertEl){
      if(alertas.length){
        alertEl.innerHTML='<div style="background:rgba(192,57,43,.1);border:1px solid var(--red);border-radius:var(--rs);padding:10px 14px">'+
          '<div style="font-size:11px;font-weight:700;color:var(--red);margin-bottom:6px">⚠ Estoque baixo</div>'+
          alertas.map(function(a){return'<div style="font-size:12px;color:var(--tx);padding:2px 0">'+a.nome+': <span style="color:var(--red);font-weight:700">'+a.qty+' '+a.unit+'</span></div>';}).join('')+
        '</div>';
      }else{
        alertEl.innerHTML='';
      }
    }
  }catch(e){console.warn('loadDashEstoque error:',e);}
}
