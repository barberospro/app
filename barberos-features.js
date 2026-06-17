// v1781192785901
// BarberOS V2 Features v3.0 - Comissao, Dashboard, Acesso Barbeiro
(function(){
// Funcao global chamada pelo onclick dos botoes Editar barbeiro
window._doEditBarber = function(id){
  var d = window._barbersData && window._barbersData[id];
  if(d) {
    editBarber(d.id, d.name, d.specialty, d.commission_pct);
  } else {
    if(window.db && window.S && S.shopId){
      db.from('barbers').select('*').eq('id',id).maybeSingle().then(function(r){
        if(r&&r.data) editBarber(r.data.id, r.data.name||'', r.data.specialty||'', r.data.commission_pct||0);
      });
    }
  }
};


var featReady = false;

// Observe changes to barb-cfg and re-render with commission + access buttons
var barbObserver = new MutationObserver(function(mutations){
  mutations.forEach(function(m){
    if(m.target.id === "barb-cfg" && m.addedNodes.length > 0 && !m.target._featProcessed){
      m.target._featProcessed = true;
      setTimeout(function(){ enhanceBarbList(); m.target._featProcessed = false; }, 50);
    }
  });
});

function startObserving(){
  var el = document.getElementById("barb-cfg");
  if(el) barbObserver.observe(el, {childList: true});
}

async function enhanceBarbList(){
  if(!window.db || !window.S || !S.shopId) return;
  var el = document.getElementById("barb-cfg");
  if(!el || !el.children.length) return;
  
  var r1 = await db.from("barbers").select("id,name,specialty,commission_pct").eq("shop_id", S.shopId).order("name");
  var barbers = r1.data || [];
  
  // Guardar dados globalmente
  if(!window._barbersData) window._barbersData={};
  barbers.forEach(function(b){ window._barbersData[b.id]={id:b.id,name:b.name||"",specialty:b.specialty||"",commission_pct:b.commission_pct||0}; });
  
  var items = el.querySelectorAll(".ci");
  items.forEach(function(item, idx){
    if(item.getAttribute("data-enhanced")==="1") return;
    item.setAttribute("data-enhanced","1");
    var b = barbers[idx];
    if(!b) return;
    
    // Atualizar subtitle
    var sub = item.querySelector(".cits");
    if(sub && !sub.textContent.includes("Comiss")) {
      sub.textContent = (b.specialty||"") + " \u2022 Comiss\u00e3o: " + (b.commission_pct||0) + "%";
    }
    
    // Adicionar botão com onclick attribute (string HTML - mais robusto)
    if(!item.querySelector(".btn-edit-barber")){
      var wrapper = item.querySelector('[style*="display:flex"][style*="gap"]') || item;
      var btn = document.createElement("button");
      btn.className = "btn-edit-barber";
      btn.innerHTML = "Editar";
      btn.setAttribute("style","background:#C9A84C;color:#0E0E0E;border:none;border-radius:8px;padding:8px 14px;font-size:12px;cursor:pointer;font-weight:700;-webkit-tap-highlight-color:rgba(201,168,76,0.3);touch-action:manipulation");
      btn.setAttribute("onclick","window._doEditBarber('"+b.id+"')");
      var togDiv = item.querySelector(".tog");
      if(togDiv && togDiv.parentNode) togDiv.parentNode.insertBefore(btn, togDiv);
      else item.appendChild(btn);
    }
  });
}


// === FUNCTIONS ===
window.addBarber = function(){

    var _as3=document.getElementById("brb-access-section");if(_as3)_as3.style.display="none";
  if(!document.getElementById("mod-barber")){ injectUI(); if(!document.getElementById("mod-barber")) return; }
  document.getElementById("brb-name").value="";
  document.getElementById("brb-spec").value="";
  document.getElementById("brb-comm").value="0";
  document.getElementById("brb-comm-val").textContent="0";
  document.getElementById("brb-edit-id").value="";
  document.getElementById("mod-barber-title").textContent="Adicionar Barbeiro";
  openMod("mod-barber");
};

window.editBarber = function(id,name,spec,comm){
    if(!document.getElementById("mod-barber")){ injectUI(); }
    if(!document.getElementById("mod-barber")) return;
    document.getElementById("brb-name").value=name||"";
    document.getElementById("brb-spec").value=spec||"";
    document.getElementById("brb-comm").value=comm||0;
    document.getElementById("brb-comm-val").textContent=comm||0;
    document.getElementById("brb-edit-id").value=id;
    document.getElementById("mod-barber-title").textContent="Editar Barbeiro";
    // Seção de senha simples
    var accSec=document.getElementById("brb-access-section");
    if(!accSec){
      var md=document.querySelector("#mod-barber .msh");
      if(md){
        accSec=document.createElement("div");
        accSec.id="brb-access-section";
        accSec.innerHTML='<div style="border-top:1px solid rgba(154,144,128,.3);margin-top:12px;padding-top:12px"><div style="font-size:13px;font-weight:700;color:#C9A84C;margin-bottom:8px">Acesso do Barbeiro</div><div class="fg"><label class="fl">Nova senha (vazio = manter)</label><input class="fi" id="brb-access-pwd" type="text" placeholder="Min 6 caracteres"></div></div>';
        var sb=md.querySelector("button");
        if(sb)md.insertBefore(accSec,sb);else md.appendChild(accSec);
      }
    }
    if(accSec)accSec.style.display="block";
    var pwdF=document.getElementById("brb-access-pwd");if(pwdF)pwdF.value="";
    if(typeof openMod==="function")openMod("mod-barber");
    else{var m=document.getElementById("mod-barber");if(m)m.classList.add("open");}
  };


window.filterDash = async function(period){
  document.querySelectorAll(".fbtn").forEach(function(b){b.classList.remove("active");});
  var btn=document.getElementById("fd-"+period);if(btn)btn.classList.add("active");
  var cd=document.getElementById("dash-period-custom");
  if(period==="custom")cd.style.display="block";else cd.style.display="none";
  var now=new Date(),from,to;
  if(period==="week"){from=new Date(now-7*86400000).toISOString().split("T")[0];to=now.toISOString().split("T")[0];}
  else if(period==="biweek"){from=new Date(now-14*86400000).toISOString().split("T")[0];to=now.toISOString().split("T")[0];}
  else if(period==="month"){from=new Date(now.getFullYear(),now.getMonth(),1).toISOString().split("T")[0];to=new Date(now.getFullYear(),now.getMonth()+1,0).toISOString().split("T")[0];}
  else if(period==="year"){from=new Date(now.getFullYear(),0,1).toISOString().split("T")[0];to=new Date(now.getFullYear(),11,31).toISOString().split("T")[0];}
  else if(period==="custom"){from=document.getElementById("dash-from").value;to=document.getElementById("dash-to").value;if(!from||!to){document.getElementById("dash-profit-result").innerHTML="Selecione as datas.";return;}}
  try{
    // Buscar TODOS agendamentos no periodo (nao apenas encerrados) para contagem
    var rAll=await db.from("appointments").select("service_price,barber_name,barber_id,status,appointment_date").gte("appointment_date",from).lte("appointment_date",to).eq("shop_id",S.shopId).neq("status","cancelled");
    var allAppts=rAll.data||[];
    // Filtrar encerrados para calculo de receita/comissao
    var doneAppts=allAppts.filter(function(a){return a.status==="done"||a.status==="finished";});
    // Buscar barbeiros
    var r2=await db.from("barbers").select("id,name,commission_pct").eq("shop_id",S.shopId);
    var bm={};(r2.data||[]).forEach(function(b){bm[b.id]={name:b.name,pct:Number(b.commission_pct)||0};});
    var bmByName={};(r2.data||[]).forEach(function(b){bmByName[(b.name||"").toLowerCase()]={id:b.id,pct:Number(b.commission_pct)||0};});

    // === ATUALIZAR CARDS SUPERIORES ===
    var totalAgend=allAppts.length;
    var totalReceita=doneAppts.reduce(function(s,a){return s+Number(a.service_price||0);},0);
    // Cards: usar labels do periodo
    var periodoLabels={week:"Semana",biweek:"Quinzena",month:"M\u00eas",year:"Ano",custom:"Per\u00edodo"};
    var lbl=periodoLabels[period]||"Per\u00edodo";
    var stToday=document.getElementById("st-today");
    var stRtd=document.getElementById("st-rtd");
    var stMonth=document.getElementById("st-month");
    var stRm=document.getElementById("st-rm");
    // Atualizar labels dos cards
    var slLabels=document.querySelectorAll(".sg .sc .sl");
    if(slLabels.length>=4){
      slLabels[0].textContent="Agendamentos";
      slLabels[1].textContent="Receita (encerrados)";
      slLabels[2].textContent="Encerrados";
      slLabels[3].textContent="Lucro l\u00edquido";
    }
    if(stToday)stToday.textContent=totalAgend;
    if(stRtd)stRtd.textContent=fmt(totalReceita);
    if(stMonth)stMonth.textContent=doneAppts.length;

    // === CALCULAR COMISSOES ===
    var cb={};
    doneAppts.forEach(function(a){
      var bid=a.barber_id;
      if(!bid && a.barber_name){var found=bmByName[(a.barber_name||"").toLowerCase()];if(found)bid=found.id;}
      if(!bid)bid="x";
      if(!cb[bid])cb[bid]={name:bm[bid]?bm[bid].name:(a.barber_name||"?"),total:0,comm:0,pct:0,count:0};
      var p=Number(a.service_price||0);
      cb[bid].total+=p;
      var pct=bm[bid]?bm[bid].pct:(bmByName[(a.barber_name||"").toLowerCase()]||{}).pct||0;
      cb[bid].pct=pct;
      cb[bid].comm+=p*(pct/100);
      cb[bid].count++;
    });
    var tc=Object.values(cb).reduce(function(s,b){return s+b.comm;},0);
    var liq=totalReceita-tc;

    // Atualizar card de lucro liquido
    if(stRm)stRm.textContent=fmt(liq);

    // === RENDERIZAR SECAO COMISSOES ===
    var h="<div style='display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px'><div style='background:var(--dk3);border-radius:8px;padding:12px;text-align:center'><div style='font-size:11px;color:#9A9080'>Receita ("+lbl+")</div><div style='font-size:18px;font-weight:700;color:#C9A84C'>"+fmt(totalReceita)+"</div></div><div style='background:var(--dk3);border-radius:8px;padding:12px;text-align:center'><div style='font-size:11px;color:#9A9080'>Lucro ("+lbl+")</div><div style='font-size:18px;font-weight:700;color:#27AE60'>"+fmt(liq)+"</div></div></div>";
    h+="<div style='font-weight:600;font-size:13px;margin-bottom:8px'>Comiss\u00f5es por Barbeiro:</div>";
    var ls=Object.values(cb).sort(function(a,b){return b.comm-a.comm;});
    if(!ls.length)h+="<div style='color:#9A9080;font-size:12px'>Nenhum atendimento encerrado no per\u00edodo.</div>";
    else ls.forEach(function(b){h+="<div style='display:flex;justify-content:space-between;padding:8px;background:var(--dk3);border-radius:6px;margin-bottom:4px'><div><b>"+b.name+"</b> <span style='color:#9A9080;font-size:11px'>("+b.pct+"%) - "+b.count+" atend.</span></div><div style='text-align:right'><div style='font-weight:600;color:#C9A84C'>"+fmt(b.comm)+"</div><div style='font-size:10px;color:#9A9080'>de "+fmt(b.total)+"</div></div></div>";});
    h+="<div style='margin-top:10px;padding-top:10px;border-top:1px solid var(--dk4);display:flex;justify-content:space-between;font-size:12px'><span>Total comiss\u00f5es:</span><span style='font-weight:700;color:#E74C3C'>-"+fmt(tc)+"</span></div>";
    document.getElementById("dash-profit-result").innerHTML=h;
  }catch(e){document.getElementById("dash-profit-result").innerHTML="Erro: "+e.message;}
};

// === UI INJECTION ===

async function overrideLoadDashForBarber(){
  // Buscar barber_id real da sessao
  // Usar S.barberUserId que já foi definido no doLogin
  var myBid=window.S&&window.S.barberUserId;
  if(!myBid)return;

  // Sobrescrever loadDash
  window.loadDash = async function(){
    var td=new Date().toISOString().split('T')[0];
    var el=document.getElementById('td-lbl');
    if(el)el.textContent='Hoje '+new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
    try{
      // Buscar apenas agendamentos DESTE barbeiro
      var r1=await db.from('appointments').select('*').eq('appointment_date',td).eq('shop_id',S.shopId).eq('barber_id',myBid).neq('status','cancelled').order('appointment_time');
      var ta=r1.data||[];
      var monthStart=td.slice(0,7)+'-01';
      var r2=await db.from('appointments').select('service_price,status').gte('appointment_date',monthStart).eq('shop_id',S.shopId).eq('barber_id',myBid).neq('status','cancelled');
      var ma=r2.data||[];
      // Pegar comissao
      var brR=await db.from('barbers').select('commission_pct').eq('id',myBid).maybeSingle();
      var pct=(brR&&brR.data)?Number(brR.data.commission_pct)||0:0;
      var tc=ta.length;
      var tr=ta.filter(function(a){return a.status==='done'||a.status==='finished';}).reduce(function(s,a){return s+Number(a.service_price||0)*(pct/100);},0);
      var mc=ma.length;
      var mr=ma.filter(function(a){return a.status==='done'||a.status==='finished';}).reduce(function(s,a){return s+Number(a.service_price||0)*(pct/100);},0);
      var stToday=document.getElementById('st-today');if(stToday)stToday.textContent=tc;
      var stRtd=document.getElementById('st-rtd');if(stRtd)stRtd.textContent=fmt(tr);
      var stMonth=document.getElementById('st-month');if(stMonth)stMonth.textContent=mc;
      var stRm=document.getElementById('st-rm');if(stRm)stRm.textContent=fmt(mr);
      // Labels
      document.querySelectorAll('.sl').forEach(function(l){
        if(l.textContent.includes('Receita hoje')||l.textContent.includes('Comissao hoje'))l.textContent='Comissao hoje';
        if(l.textContent.includes('Receita mes')||l.textContent.includes('Comissao mes'))l.textContent='Comissao mes';
        if(l.textContent==='Hoje'||l.textContent==='Meus hoje')l.textContent='Meus hoje';
        if(l.textContent==='Este mes'||l.textContent==='Meus no mes')l.textContent='Meus no mes';
      });
      // Renderizar lista de agendamentos (apenas os do barbeiro)
      var dl=document.getElementById('dash-list');
      if(dl){
        if(ta.length>0){
          dl.innerHTML=ta.map(function(a){return typeof agItemHTML==='function'?agItemHTML(a):'';}).join('');
        } else {
          dl.innerHTML='<div style="text-align:center;padding:30px;color:#9A9080">Nenhum agendamento seu hoje.</div>';
        }
      }
    
      // Injetar seção "Minhas Comissões"
      var brNameR=await db.from('barbers').select('name,commission_pct').eq('id',myBid).maybeSingle();
      var bName=(brNameR&&brNameR.data)?brNameR.data.name:'';
      var bPct=(brNameR&&brNameR.data)?Number(brNameR.data.commission_pct)||0:0;
      var comSec=document.getElementById('barber-dash-section');
      if(!comSec){comSec=document.createElement('div');comSec.id='barber-dash-section';comSec.style.padding='0 20px 16px';var dlParent=dl.parentNode;dlParent.insertBefore(comSec,dl);}
      // Buscar atendimentos encerrados do mes
      var encR=await db.from('appointments').select('service_price,appointment_date,service_name').eq('barber_id',myBid).eq('shop_id',S.shopId).in('status',['finished']).gte('appointment_date',monthStart);
      var encData=encR.data||[];
      var totalEnc=encData.reduce(function(s,a){return s+Number(a.service_price||0);},0);
      var myComm=totalEnc*(bPct/100);
      var comHtml='<div style="background:var(--dk2);border-radius:12px;padding:16px">'
        +'<div style="font-weight:700;font-size:16px;color:#C9A84C;margin-bottom:14px">\u{1F4B0} Minhas Comiss\u00f5es - '+bName+'</div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">'
        +'<div style="background:var(--dk3);border-radius:8px;padding:14px;text-align:center"><div style="font-size:11px;color:#9A9080">Comiss\u00e3o ('+bPct+'%)</div><div style="font-size:20px;font-weight:700;color:#C9A84C">'+fmt(myComm)+'</div></div>'
        +'<div style="background:var(--dk3);border-radius:8px;padding:14px;text-align:center"><div style="font-size:11px;color:#9A9080">Atendimentos (m\u00eas)</div><div style="font-size:20px;font-weight:700;color:#27AE60">'+encData.length+'</div></div>'
        +'</div>';
      if(encData.length>0){
        comHtml+='<div style="font-size:12px;color:#9A9080;margin-bottom:8px">Servi\u00e7os encerrados:</div>';
        encData.forEach(function(a){comHtml+='<div style="display:flex;justify-content:space-between;padding:6px;background:var(--dk3);border-radius:6px;margin-bottom:3px"><div style="font-size:12px"><b>'+a.service_name+'</b><br><span style="color:#9A9080;font-size:10px">'+new Date(a.appointment_date+"T12:00").toLocaleDateString("pt-BR")+'</span></div><div style="text-align:right"><div style="font-weight:600;color:#C9A84C;font-size:12px">'+fmt(Number(a.service_price||0)*(bPct/100))+'</div></div></div>';});
        comHtml+='<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(154,144,128,.3);display:flex;justify-content:space-between;font-size:13px"><b>Total:</b><span style="font-weight:700;color:#C9A84C">'+fmt(myComm)+'</span></div>';
      } else { comHtml+='<div style="color:#9A9080;font-size:12px;padding:10px;text-align:center">Nenhum encerrado este m\u00eas.</div>'; }
      // === FILTRO POR PERIODO ===
      comHtml+='<div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(154,144,128,.2)">';
      comHtml+='<div style="font-weight:700;font-size:14px;color:#C9A84C;margin-bottom:10px">\u{1F4CA} Consultar por Per\u00edodo</div>';
      comHtml+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">';
      comHtml+='<button class="fbtn" onclick="filterBarberDash(\'week\')">Semanal</button>';
      comHtml+='<button class="fbtn" onclick="filterBarberDash(\'biweek\')">Quinzenal</button>';
      comHtml+='<button class="fbtn" onclick="filterBarberDash(\'month\')">Mensal</button>';
      comHtml+='<button class="fbtn" onclick="filterBarberDash(\'year\')">Anual</button>';
      comHtml+='<button class="fbtn" onclick="filterBarberDash(\'custom\')">Per\u00edodo</button>';
      comHtml+='</div>';
      comHtml+='<div id="barber-period-custom" style="display:none;margin-bottom:10px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="fg"><label class="fl">De</label><input type="date" class="fi" id="bp-from"></div><div class="fg"><label class="fl">At\u00e9</label><input type="date" class="fi" id="bp-to"></div></div><button class="btn btn-out" onclick="filterBarberDash(\'custom\')" style="margin-top:8px;font-size:12px;padding:8px">Consultar</button></div>';
      comHtml+='<div id="barber-period-result" style="font-size:12px;color:#9A9080">Selecione um per\u00edodo acima.</div>';
      comHtml+='</div>';
      comHtml+='</div>';
      comSec.innerHTML=comHtml;
}catch(e){console.warn('loadDash barber error:',e);}
  };
  // Executar imediatamente
  window.loadDash();
}


// === FILTRO PERIODO DO BARBEIRO ===
window.filterBarberDash = async function(period){
  // Highlight active button
  var btns=document.querySelectorAll('#barber-dash-section .fbtn');
  btns.forEach(function(b){b.classList.remove('active');});
  if(event&&event.target)event.target.classList.add('active');
  // Custom period toggle
  var cd=document.getElementById('barber-period-custom');
  if(cd){cd.style.display=(period==='custom')?'block':'none';}
  // Calculate date range
  var now=new Date(),from,to=now.toISOString().split('T')[0];
  if(period==='week')from=new Date(now-7*86400000).toISOString().split('T')[0];
  else if(period==='biweek')from=new Date(now-14*86400000).toISOString().split('T')[0];
  else if(period==='month')from=new Date(now.getFullYear(),now.getMonth(),1).toISOString().split('T')[0];
  else if(period==='year')from=new Date(now.getFullYear(),0,1).toISOString().split('T')[0];
  else if(period==='custom'){
    from=document.getElementById('bp-from').value;
    to=document.getElementById('bp-to').value;
    if(!from||!to){document.getElementById('barber-period-result').innerHTML='Selecione as datas.';return;}
  }
  var resultEl=document.getElementById('barber-period-result');
  if(!resultEl)return;
  resultEl.innerHTML='<div style="text-align:center;padding:10px"><div class="spin"></div></div>';
  try{
    var bid=S.barberUserId||S._barberBid;
    if(!bid){resultEl.innerHTML='Erro: barbeiro n\u00e3o identificado.';return;}
    var r=await db.from('appointments').select('service_price,service_name,appointment_date,status')
      .eq('barber_id',bid).gte('appointment_date',from).lte('appointment_date',to)
      .eq('shop_id',S.shopId).in('status',['done','finished']);
    var appts=r.data||[];
    var r2=await db.from('barbers').select('commission_pct').eq('id',bid).maybeSingle();
    var pct=Number((r2.data||{}).commission_pct)||0;
    var total=appts.reduce(function(s,a){return s+Number(a.service_price||0);},0);
    var comm=total*(pct/100);
    var count=appts.length;
    var h='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">'
      +'<div style="background:var(--dk3);border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:#9A9080">Atendimentos</div><div style="font-size:18px;font-weight:700;color:#C9A84C">'+count+'</div></div>'
      +'<div style="background:var(--dk3);border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:#9A9080">Faturado</div><div style="font-size:14px;font-weight:700;color:#fff">'+fmt(total)+'</div></div>'
      +'<div style="background:var(--dk3);border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:#9A9080">Comiss\u00e3o ('+pct+'%)</div><div style="font-size:18px;font-weight:700;color:#27AE60">'+fmt(comm)+'</div></div>'
      +'</div>';
    if(appts.length>0){
      var svcMap={};
      appts.forEach(function(a){var sn=a.service_name||'Servi\u00e7o';if(!svcMap[sn])svcMap[sn]={count:0,total:0};svcMap[sn].count++;svcMap[sn].total+=Number(a.service_price||0);});
      h+='<div style="font-size:11px;color:#9A9080;margin-bottom:4px">Detalhamento:</div>';
      Object.keys(svcMap).forEach(function(sn){
        var s=svcMap[sn];
        h+='<div style="display:flex;justify-content:space-between;padding:5px 8px;background:var(--dk3);border-radius:6px;margin-bottom:3px;font-size:11px"><span>'+sn+' ('+s.count+'x)</span><span style="font-weight:600;color:#C9A84C">'+fmt(s.total*(pct/100))+'</span></div>';
      });
      h+='<div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(154,144,128,.2);display:flex;justify-content:space-between;font-size:12px"><b>Total comiss\u00e3o:</b><span style="font-weight:700;color:#27AE60">'+fmt(comm)+'</span></div>';
    } else {
      h+='<div style="color:#9A9080;font-size:11px;text-align:center">Nenhum atendimento encerrado neste per\u00edodo.</div>';
    }
    resultEl.innerHTML=h;
  }catch(e){resultEl.innerHTML='Erro: '+e.message;}
};

function injectUI(){
  // Modal Barbeiro
  if(!document.getElementById("mod-barber")){
    var d=document.createElement("div");d.className="mov";d.id="mod-barber";
    d.innerHTML='<div class="msh"><div class="mhd"></div><div class="mt" id="mod-barber-title">Adicionar Barbeiro</div><div class="fg"><label class="fl">Nome *</label><input class="fi" id="brb-name" placeholder="Nome"></div><div class="fg"><label class="fl">Especialidade</label><input class="fi" id="brb-spec" placeholder="Especialidade"></div><div class="fg"><label class="fl">Comiss\u00e3o: <span id="brb-comm-val">0</span>%</label><input type="range" id="brb-comm" min="0" max="100" value="0" step="5" oninput="document.getElementById(\x27brb-comm-val\x27).textContent=this.value" style="width:100%;accent-color:#C9A84C"><div style="display:flex;justify-content:space-between;font-size:11px;color:#9A9080"><span>0%</span><span>50%</span><span>100%</span></div></div><input type="hidden" id="brb-edit-id" value=""><button class="btn" onclick="saveBarber()" style="width:100%;margin-top:12px">Salvar</button></div>';
    document.body.appendChild(d);
  }
  // Modal Criar Acesso
  if(!document.getElementById("mod-barber-user")){
    var d2=document.createElement("div");d2.className="mov";d2.id="mod-barber-user";
    d2.innerHTML='<div class="msh"><div class="mhd"></div><div class="mt">Criar Acesso</div><div id="buser-barber-name" style="color:#C9A84C;font-weight:700;margin-bottom:12px"></div><div class="fg"><label class="fl">E-mail *</label><input class="fi" id="buser-email" type="email" placeholder="email@exemplo.com"></div><div class="fg"><label class="fl">Senha *</label><input class="fi" id="buser-pwd" type="text" placeholder="Min 6 caracteres"></div><input type="hidden" id="buser-barber-id" value=""><button class="btn" onclick="saveBarberUser()" style="width:100%;margin-top:8px">Criar acesso</button><div id="buser-count" style="font-size:11px;color:#9A9080;text-align:center;margin-top:8px"></div></div>';
    document.body.appendChild(d2);
  }
  // Dashboard filters
  var dl=document.getElementById("dash-list");
  // Esconder seção de lucros do proprietário se for barbeiro
  if(window.S&&S.role==='barber'){
    var profitSec=document.getElementById('dash-profit-section');
    if(profitSec)profitSec.style.display='none';
    if(typeof loadBarberDash==='function')setTimeout(loadBarberDash,500);
    return;
  }
  if(dl&&!document.getElementById("dash-profit-section")&&S.role!=='barber'){
    var sec=document.createElement("div");sec.id="dash-profit-section";sec.style.padding="0 20px 16px";
    sec.innerHTML='<div style="background:var(--dk2);border-radius:12px;padding:16px"><div style="font-weight:700;font-size:15px;color:#C9A84C;margin-bottom:12px">Lucros e Comiss\u00f5es</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px"><button class="fbtn" onclick="filterDash(\x27week\x27)" id="fd-week">Semanal</button><button class="fbtn" onclick="filterDash(\x27biweek\x27)" id="fd-biweek">Quinzenal</button><button class="fbtn" onclick="filterDash(\x27month\x27)" id="fd-month">Mensal</button><button class="fbtn" onclick="filterDash(\x27year\x27)" id="fd-year">Anual</button><button class="fbtn" onclick="filterDash(\x27custom\x27)" id="fd-custom">Periodo</button></div><div id="dash-period-custom" style="display:none;margin-bottom:12px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="fg"><label class="fl">De</label><input type="date" class="fi" id="dash-from"></div><div class="fg"><label class="fl">At\u00e9</label><input type="date" class="fi" id="dash-to"></div></div><button class="btn btn-out" onclick="filterDash(\x27custom\x27)" style="margin-top:8px;font-size:12px;padding:8px">Consultar</button></div><div id="dash-profit-result" style="font-size:13px;color:#9A9080">Selecione um per\u00edodo.</div></div>';
    dl.parentNode.insertBefore(sec,dl);
  }
  // CSS
  if(!document.getElementById("feat-css")){
    var st=document.createElement("style");st.id="feat-css";
    st.textContent=".fbtn{background:var(--dk3);border:1px solid var(--dk4);color:var(--txm);border-radius:50px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer;transition:all .2s}.fbtn.active,.fbtn:hover{background:#C9A84C;color:#0E0E0E;border-color:#C9A84C}";
    document.head.appendChild(st);
  }
}

// === BARBER ROLE DETECTION ===
async function checkBarberRole(){
  try{
    var sess=await db.auth.getSession();
    if(!sess.data.session) return;
    var uid=sess.data.session.user.id;
    var shopCheck=await db.from("shops").select("id").eq("owner_id",uid).maybeSingle();
    if(shopCheck.data){S.role="owner";return;}
    var bCheck=await db.from("barber_users").select("barber_id").eq("user_id",uid).maybeSingle();
    if(bCheck.data){
      S.role="barber";
      S.barberUserId=bCheck.data.barber_id;
      // Hide owner-only tabs (config, services, barbers list, clients)
      document.querySelectorAll(".ni").forEach(function(n){
        var oc=n.getAttribute("onclick")||"";
        if(oc.includes("'cfg'")||oc.includes("'svcs'")||oc.includes("'barbs'")||oc.includes("'clientes'"))n.style.display="none";
      });
      // Block onboarding - barbeiros nao podem criar barbearia
      var origEnterApp = window.enterApp;
      if(typeof origEnterApp === "function"){
        window.enterApp = function(mode){
          if(mode === "onboarding" && S.role === "barber") mode = "admin";
          origEnterApp(mode);
        };
      }
      // Hide "Encerrar" button via observer - barbeiro pode Confirmar, Cancelar, Feito, mas NAO Encerrar
      var obs=new MutationObserver(function(){
        document.querySelectorAll("button,a,[onclick]").forEach(function(el){
          var txt=(el.textContent||"").toLowerCase();
          var oc=(el.getAttribute("onclick")||"").toLowerCase();
          // Ocultar botoes de "encerrar" / "finished" / "encerrado" para barbeiros
          if(txt.includes("encerrar")||txt.includes("finalizar")||oc.includes("finished")||oc.includes("encerr")){
            el.style.display="none";
          }
        });
      });
      var app=document.getElementById("admin-app");
      if(app)obs.observe(app,{childList:true,subtree:true});
    }
  }catch(e){}
}

// === INIT ===
function init(){
  injectUI();
  startObserving();
  // Override loadDash para barbeiro - filtrar apenas seus agendamentos
  // Override será aplicado via interval abaixo
  // Re-render barber list after a delay
  setTimeout(function(){
    if(S.shopId) enhanceBarbList();
  }, 2000);
  // Check role after login
  setTimeout(checkBarberRole, 3000);
}

// Start when ready
var checkInterval = setInterval(function(){
  if(window.db && window.S && window.S.shopId){
    clearInterval(checkInterval);
    init();
    // Apply barber restrictions immediately if role is set
    if(S.role === "barber") applyBarberMode();
  }
},500);

function applyBarberMode(){
  // Hide tabs: config, services, barbers list, clients
  setTimeout(function(){
    document.querySelectorAll(".ni").forEach(function(n){
      var oc=n.getAttribute("onclick")||"";
      if(oc.includes("'cfg'")||oc.includes("'svcs'")||oc.includes("'barbs'")||oc.includes("'clientes'"))n.style.display="none";
    });
    // Watch for "Encerrar" buttons and hide them
    var obs=new MutationObserver(function(){
      document.querySelectorAll("button,a,[onclick]").forEach(function(el){
        var txt=(el.textContent||"").toLowerCase();
        var oc=(el.getAttribute("onclick")||"").toLowerCase();
        if(txt.includes("encerrar")||txt.includes("finalizar")||oc.includes("finished")||oc.includes("encerr")){
          el.style.display="none";
        }
      });
    });
    var app=document.getElementById("admin-app");
    if(app)obs.observe(app,{childList:true,subtree:true});
  },300);
}


// === BARBER DASHBOARD ===
window.loadBarberDash = async function(){ return; // Desativado - overrideLoadDashForBarber faz tudo
  if(S.role !== 'barber') return;
  var dl = document.getElementById('dash-list');
  if(!dl) return;
  // Buscar o barber_id do user logado ATUAL
  var sess = await db.auth.getSession();
  if(!sess||!sess.data||!sess.data.session) return;
  var currentUid = sess.data.session.user.id;
  var buR = await db.from('barber_users').select('barber_id').eq('user_id',currentUid).maybeSingle();
  if(!buR||!buR.data) return;
  var myBarberId = buR.data.barber_id;
  myBarberId = myBarberId; // Atualizar
  // Buscar comissão do barbeiro
  var br = await db.from('barbers').select('name,commission_pct').eq('id',myBarberId).maybeSingle();
  var pct = (br&&br.data) ? Number(br.data.commission_pct)||0 : 0;
  var bName = (br&&br.data) ? br.data.name : '';
  // Buscar agendamentos encerrados deste barbeiro
  var now = new Date();
  var monthStart = new Date(now.getFullYear(),now.getMonth(),1).toISOString().split('T')[0];
  var today = now.toISOString().split('T')[0];
  var r = await db.from('appointments').select('service_price,appointment_date,status,service_name').eq('barber_id',myBarberId).eq('shop_id',S.shopId).in('status',['finished']).gte('appointment_date',monthStart).lte('appointment_date',today);
  var appts = r.data || [];
  var totalServicos = appts.reduce(function(s,a){return s+Number(a.service_price||0);},0);
  var minhaComissao = totalServicos * (pct/100);
  // Contar atendimentos
  var totalAtend = appts.length;
  // Criar HTML do dashboard do barbeiro
  var sec = document.getElementById('barber-dash-section');
  if(!sec){
    sec = document.createElement('div');
    sec.id = 'barber-dash-section';
    sec.style.padding = '0 20px 16px';
    var parent = dl.parentNode;
    parent.insertBefore(sec, dl);
  }
  sec.innerHTML = '<div style="background:var(--dk2);border-radius:12px;padding:16px;margin-bottom:12px">'
    +'<div style="font-weight:700;font-size:16px;color:var(--gold);margin-bottom:14px">\u{1F4B0} Minhas Comiss\u00f5es - '+bName+'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">'
    +'<div style="background:var(--dk3);border-radius:8px;padding:14px;text-align:center"><div style="font-size:11px;color:#9A9080">Comiss\u00e3o ('+pct+'%)</div><div style="font-size:20px;font-weight:700;color:var(--gold)">'+fmt(minhaComissao)+'</div></div>'
    +'<div style="background:var(--dk3);border-radius:8px;padding:14px;text-align:center"><div style="font-size:11px;color:#9A9080">Atendimentos (m\u00eas)</div><div style="font-size:20px;font-weight:700;color:#27AE60">'+totalAtend+'</div></div>'
    +'</div>'
    +'<div style="font-size:12px;color:#9A9080;margin-bottom:8px">Servicos encerrados este m\u00eas:</div>';
  if(appts.length === 0){
    sec.innerHTML += '<div style="color:#9A9080;font-size:12px;padding:10px;text-align:center">Nenhum atendimento encerrado este m\u00eas.</div>';
  } else {
    var listHtml = '';
    appts.forEach(function(a){
      listHtml += '<div style="display:flex;justify-content:space-between;padding:8px;background:var(--dk3);border-radius:6px;margin-bottom:4px">'
        +'<div style="font-size:12px"><span style="font-weight:600">'+a.service_name+'</span><br><span style="color:#9A9080;font-size:10px">'+new Date(a.appointment_date+'T12:00').toLocaleDateString('pt-BR')+'</span></div>'
        +'<div style="text-align:right"><div style="font-weight:600;color:var(--gold);font-size:12px">'+fmt(Number(a.service_price||0)*(pct/100))+'</div><div style="font-size:10px;color:#9A9080">de '+fmt(Number(a.service_price||0))+'</div></div>'
        +'</div>';
    });
    sec.innerHTML += listHtml;
  }
  sec.innerHTML += '<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--dk4);display:flex;justify-content:space-between;font-size:13px"><span style="font-weight:700">Total do m\u00eas:</span><span style="font-weight:700;color:var(--gold)">'+fmt(minhaComissao)+'</span></div></div>';
};

// Auto-load barber dash when barber enters
// Esconder lucros do proprietario quando barbeiro
var _hideOwnerDash = setInterval(function(){
  if(window.S&&window.S.role==='barber'){
    var ps=document.getElementById('dash-profit-section');
    if(ps){ps.remove();clearInterval(_hideOwnerDash);}
  } else if(window.S&&S.role==='owner'){clearInterval(_hideOwnerDash);}
},500);

var _barberDashInterval = setInterval(function(){ return; // Desativado
  if(S.role === 'barber' && S.barberUserId && S.shopId && document.getElementById('dash-list')){
    clearInterval(_barberDashInterval);
    loadBarberDash();
  }
},1000);


// === Override loadDash para barbeiro ===
var _origLoadDash = null;
var _dashOverrideInterval = setInterval(function(){
  if(typeof window.loadDash === 'undefined' && typeof loadDash === 'undefined') return;
  if(S.role !== 'barber') { clearInterval(_dashOverrideInterval); return; }
  clearInterval(_dashOverrideInterval);
  
  // Override: substituir os valores dos cards para mostrar apenas dados do barbeiro
  var _cardUpdateCount=0;var _cardInterval=setInterval(async function updateBarberCards(){return; // Desativado_cardUpdateCount++;if(_cardUpdateCount>5)clearInterval(_cardInterval);
    if(!S.shopId) return;
    var _sess2=await db.auth.getSession();if(!_sess2||!_sess2.data||!_sess2.data.session)return;var _uid2=_sess2.data.session.user.id;var _buR2=await db.from("barber_users").select("barber_id").eq("user_id",_uid2).maybeSingle();if(!_buR2||!_buR2.data)return;var _myBid=_buR2.data.barber_id;_myBid=_myBid;
    var td = new Date().toISOString().split('T')[0];
    var monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    var pctR = await db.from('barbers').select('commission_pct').eq('id', _myBid).maybeSingle();
    var pct = (pctR && pctR.data) ? Number(pctR.data.commission_pct) || 0 : 0;
    
    // Hoje - apenas agendamentos deste barbeiro
    var todayR = await db.from('appointments').select('service_price,status').eq('appointment_date', td).eq('shop_id', S.shopId).eq('barber_id', _myBid).neq('status','cancelled');
    var todayData = todayR.data || [];
    var todayCount = todayData.length;
    var todayRevenue = todayData.filter(function(a){return a.status==='finished';}).reduce(function(s,a){return s+Number(a.service_price||0)*(pct/100);},0);
    
    // Mes - apenas agendamentos deste barbeiro
    var monthR = await db.from('appointments').select('service_price,status').gte('appointment_date', monthStart).eq('shop_id', S.shopId).eq('barber_id', _myBid).neq('status','cancelled');
    var monthData = monthR.data || [];
    var monthCount = monthData.length;
    var monthRevenue = monthData.filter(function(a){return a.status==='finished';}).reduce(function(s,a){return s+Number(a.service_price||0)*(pct/100);},0);
    
    // Atualizar cards
    var stToday = document.getElementById('st-today');
    var stRtd = document.getElementById('st-rtd');
    var stMonth = document.getElementById('st-month');
    var stRm = document.getElementById('st-rm');
    if(stToday) stToday.textContent = todayCount;
    if(stRtd) stRtd.textContent = fmt(todayRevenue);
    if(stMonth) stMonth.textContent = monthCount;
    if(stRm) stRm.textContent = fmt(monthRevenue);
    
    // Mudar labels para indicar que é comissão
    var labels = document.querySelectorAll('.sl');
    labels.forEach(function(l){
      if(l.textContent === 'Receita hoje') l.textContent = 'Comissao hoje';
      if(l.textContent === 'Receita mes') l.textContent = 'Comissao mes';
      if(l.textContent === 'Hoje') l.textContent = 'Meus hoje';
      if(l.textContent === 'Este mes') l.textContent = 'Meus no mes';
    });
  }, 3000);
}, 1500);


// === WATCHER: verifica se user atual e realmente barbeiro ===
var _roleWatcher = setInterval(async function(){
  if(!window.S || !window.db || !S.shopId) return;
  if(window._barberOverrideApplied) { clearInterval(_roleWatcher); return; }
  try{
    var sess=await db.auth.getSession();
    if(!sess||!sess.data||!sess.data.session)return;
    var uid=sess.data.session.user.id;
    // Verificar se este user é owner da shop
    var ownerCheck=await db.from('shops').select('id').eq('owner_id',uid).maybeSingle();
    if(ownerCheck&&ownerCheck.data){
      // É owner - NAO aplicar override
      S.role='owner';
      clearInterval(_roleWatcher);
      return;
    }
    // Verificar se é barbeiro
    var barberCheck=await db.from('barber_users').select('barber_id').eq('user_id',uid).maybeSingle();
    if(barberCheck&&barberCheck.data){
      S.role='barber';
      S.barberUserId=barberCheck.data.barber_id;
      window._barberOverrideApplied=true;
      clearInterval(_roleWatcher);
      overrideLoadDashForBarber();
    }
  }catch(e){}
}, 1500);





// Periodic check - só enhance se necessário
setInterval(function(){
  var el = document.getElementById("barb-cfg");
  if(el && el.children.length > 0 && el.querySelector(".ci:not([data-enhanced])")){
    enhanceBarbList();
  }
}, 2000);


// Event delegation removido - usando onclick direto





})();