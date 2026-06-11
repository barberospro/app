// v1781136246802
// BarberOS V2 Features v3.0 - Comissao, Dashboard, Acesso Barbeiro
(function(){

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
  
  // Fetch barbers with commission and user access info
  var r1 = await db.from("barbers").select("*").eq("shop_id", S.shopId).order("name");
  var data = r1.data || [];
  var usersSet = new Set();
  try {
    var r2 = await db.from("barber_users").select("barber_id").eq("shop_id", S.shopId);
    usersSet = new Set((r2.data||[]).map(function(x){return x.barber_id;}));
  } catch(e){ console.log("barber_users error:", e); }
  
  el.innerHTML = data.map(function(b){
    var hu = usersSet.has(b.id);
    var nm = (b.name||"").replace(/'/g,"");
    var sp = (b.specialty||"").replace(/'/g,"");
    var cm = b.commission_pct || 0;
    var accBtn = hu
      ? '<span style="color:#27AE60;font-size:11px">\u2713 Acesso ativo</span>'
      : '<button onclick="event.stopPropagation();openCreateBarberUser(\x27'+b.id+'\x27,\x27'+nm+'\x27)" style="background:#C9A84C;color:#0E0E0E;border:none;border-radius:50px;padding:4px 10px;font-size:10px;font-weight:700;cursor:pointer;margin-left:6px">+ Criar acesso</button>';
    return '<div class="ci" style="flex-wrap:wrap;gap:8px;align-items:center">'
      +'<div class="cii">'+(b.avatar_emoji||'\u{1F464}')+'</div>'
      +'<div class="cit" style="flex:1;min-width:100px;cursor:pointer" onclick="editBarber(\x27'+b.id+'\x27,\x27'+nm+'\x27,\x27'+sp+'\x27,'+cm+')">'
      +'<div class="citn">'+b.name+'</div>'
      +'<div class="cits">'+(b.specialty||'')+' \u2022 Comiss\u00e3o: '+cm+'%</div>'
      +'</div>'
      +'<div style="display:flex;align-items:center;gap:6px">'
      +accBtn
      +'<div class="tog'+(b.active?' on':'')+'" onclick="togBarb(\x27'+b.id+'\x27,'+b.active+')"></div>'
      +'<button onclick="delBarb(\x27'+b.id+'\x27)" style="background:rgba(192,57,43,.15);border:1px solid #E74C3C;color:#E74C3C;border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer">\u2715</button>'
      +'</div></div>';
  }).join("");
}

// === FUNCTIONS ===
window.addBarber = function(){
  if(!document.getElementById("mod-barber")) return;
  document.getElementById("brb-name").value="";
  document.getElementById("brb-spec").value="";
  document.getElementById("brb-comm").value="0";
  document.getElementById("brb-comm-val").textContent="0";
  document.getElementById("brb-edit-id").value="";
  document.getElementById("mod-barber-title").textContent="Adicionar Barbeiro";
  openMod("mod-barber");
};

window.editBarber = function(id,name,spec,comm){
  if(!document.getElementById("mod-barber")) return;
  document.getElementById("brb-name").value=name||"";
  document.getElementById("brb-spec").value=spec||"";
  document.getElementById("brb-comm").value=comm||0;
  document.getElementById("brb-comm-val").textContent=comm||0;
  document.getElementById("brb-edit-id").value=id;
  document.getElementById("mod-barber-title").textContent="Editar Barbeiro";
  openMod("mod-barber");
};

window.saveBarber = async function(){
  var name=document.getElementById("brb-name").value.trim();
  if(!name){toast("Informe o nome","err");return;}
  var spec=document.getElementById("brb-spec").value.trim();
  var comm=Number(document.getElementById("brb-comm").value)||0;
  var eid=document.getElementById("brb-edit-id").value;
  var error;
  if(eid){var r=await db.from("barbers").update({name:name,specialty:spec,commission_pct:comm}).eq("id",eid);error=r.error;}
  else{var r2=await db.from("barbers").insert({shop_id:S.shopId,name:name,specialty:spec,avatar_emoji:"\u{1F464}",rating:5.0,reviews_count:0,active:true,commission_pct:comm});error=r2.error;}
  if(error){toast("Erro: "+error.message,"err");return;}
  toast(eid?"Atualizado!":"Adicionado!","ok");
  closeMod("mod-barber");
  // Trigger original loadBarbCfg which will then be enhanced by observer
  if(typeof loadBarbers==="function")loadBarbers();
  // Force re-render
  setTimeout(enhanceBarbList, 300);
};

window.openCreateBarberUser = async function(bid,bn){
  var r=await db.from("barber_users").select("id").eq("shop_id",S.shopId);
  if((r.data||[]).length>=3){toast("Limite de 3 acessos atingido.","err");return;}
  document.getElementById("buser-barber-name").textContent=bn;
  document.getElementById("buser-barber-id").value=bid;
  document.getElementById("buser-email").value="";
  document.getElementById("buser-pwd").value="";
  document.getElementById("buser-count").textContent=(r.data||[]).length+"/3 acessos criados";
  openMod("mod-barber-user");
};

window.saveBarberUser = async function(){
  var bid=document.getElementById("buser-barber-id").value;
  var email=document.getElementById("buser-email").value.trim().toLowerCase();
  var pwd=document.getElementById("buser-pwd").value;
  if(!email||!pwd){toast("Preencha e-mail e senha.","err");return;}
  if(pwd.length<6){toast("Senha minimo 6 caracteres.","err");return;}
  try{
    var sess=await db.auth.getSession();
    var tk=sess.data.session?sess.data.session.access_token:"";
    var res=await fetch(SB_URL+"/functions/v1/create-barber-user",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+tk},body:JSON.stringify({email:email,password:pwd,barber_id:bid,shop_id:S.shopId})});
    var d=await res.json();
    if(!d.ok){toast("Erro: "+(d.error||"Falha ao criar"),"err");return;}
    toast("Acesso criado para "+email+"!","ok");
    closeMod("mod-barber-user");
    setTimeout(enhanceBarbList, 300);
  }catch(e){toast("Erro: "+e.message,"err");}
};

window.filterDash = async function(period){
  document.querySelectorAll(".fbtn").forEach(function(b){b.classList.remove("active");});
  var btn=document.getElementById("fd-"+period);if(btn)btn.classList.add("active");
  var cd=document.getElementById("dash-period-custom");
  if(period==="custom")cd.style.display="block";else cd.style.display="none";
  var now=new Date(),from,to=now.toISOString().split("T")[0];
  if(period==="week")from=new Date(now-7*86400000).toISOString().split("T")[0];
  else if(period==="biweek")from=new Date(now-14*86400000).toISOString().split("T")[0];
  else if(period==="month")from=new Date(now.getFullYear(),now.getMonth(),1).toISOString().split("T")[0];
  else if(period==="year")from=new Date(now.getFullYear(),0,1).toISOString().split("T")[0];
  else if(period==="custom"){from=document.getElementById("dash-from").value;to=document.getElementById("dash-to").value;if(!from||!to){document.getElementById("dash-profit-result").innerHTML="Selecione as datas.";return;}}
  try{
    var r=await db.from("appointments").select("service_price,barber_name,barber_id,status").gte("appointment_date",from).lte("appointment_date",to).eq("shop_id",S.shopId).in("status",["done","executed","finished"]);
    var appts=r.data||[];
    var r2=await db.from("barbers").select("id,name,commission_pct").eq("shop_id",S.shopId);
    var bm={};(r2.data||[]).forEach(function(b){bm[b.id]={name:b.name,pct:Number(b.commission_pct)||0};});
    var total=appts.reduce(function(s,a){return s+Number(a.service_price||0);},0);
    var cb={};
    appts.forEach(function(a){var bid=a.barber_id||"x";if(!cb[bid])cb[bid]={name:a.barber_name||"?",total:0,comm:0,pct:0};var p=Number(a.service_price||0);cb[bid].total+=p;var pct=bm[bid]?bm[bid].pct:0;cb[bid].pct=pct;cb[bid].comm+=p*(pct/100);});
    var tc=Object.values(cb).reduce(function(s,b){return s+b.comm;},0);
    var liq=total-tc;
    var h="<div style='display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px'><div style='background:var(--dk3);border-radius:8px;padding:12px;text-align:center'><div style='font-size:11px;color:#9A9080'>Receita</div><div style='font-size:18px;font-weight:700;color:#C9A84C'>"+fmt(total)+"</div></div><div style='background:var(--dk3);border-radius:8px;padding:12px;text-align:center'><div style='font-size:11px;color:#9A9080'>Lucro</div><div style='font-size:18px;font-weight:700;color:#27AE60'>"+fmt(liq)+"</div></div></div>";
    h+="<div style='font-weight:600;font-size:13px;margin-bottom:8px'>Comiss\u00f5es por Barbeiro:</div>";
    var ls=Object.values(cb).sort(function(a,b){return b.comm-a.comm;});
    if(!ls.length)h+="<div style='color:#9A9080;font-size:12px'>Nenhum atendimento no per\u00edodo.</div>";
    else ls.forEach(function(b){h+="<div style='display:flex;justify-content:space-between;padding:8px;background:var(--dk3);border-radius:6px;margin-bottom:4px'><div><b>"+b.name+"</b> <span style='color:#9A9080;font-size:11px'>("+b.pct+"%)</span></div><div style='text-align:right'><div style='font-weight:600;color:#C9A84C'>"+fmt(b.comm)+"</div><div style='font-size:10px;color:#9A9080'>de "+fmt(b.total)+"</div></div></div>";});
    h+="<div style='margin-top:10px;padding-top:10px;border-top:1px solid var(--dk4);display:flex;justify-content:space-between;font-size:12px'><span>Total comiss\u00f5es:</span><span style='font-weight:700;color:#E74C3C'>-"+fmt(tc)+"</span></div>";
    document.getElementById("dash-profit-result").innerHTML=h;
  }catch(e){document.getElementById("dash-profit-result").innerHTML="Erro: "+e.message;}
};

// === UI INJECTION ===
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
  if(dl&&!document.getElementById("dash-profit-section")){
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
  }
},500);

})();
