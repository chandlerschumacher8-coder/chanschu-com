// ══════════════════════════════════════════════
// POS ADMIN MODULE
// ══════════════════════════════════════════════

// ══════════════════════════════════════════════
// AI ASSISTANT
// ══════════════════════════════════════════════
function toggleAI(){aiOpen=!aiOpen;document.getElementById('ai-drawer').classList.toggle('open',aiOpen);if(aiOpen){updateAIChips();document.getElementById('ai-inp').focus();}}
function updateAIChips(){
  var chips={dashboard:['Sales summary','Top sellers','Daily report'],sale:['Price check','Compare models','Customer quote','Margin calc'],inventory:['Stock report','Low stock summary','Reorder suggestions','PO status'],orders:['Order status help','Delivery scheduling'],delivery:['Route optimization','Schedule conflict check'],service:['Diagnose issue','Part lookup','Warranty check'],admin:['Tax rate lookup','Exemption rules','User management']}[currentTab]||['General help'];
  document.getElementById('ai-chips').innerHTML=chips.map(function(c){return '<button class="ai-chip" onclick="aiChip(\''+c+'\')">'+c+'</button>';}).join('');
}
function aiChip(text){document.getElementById('ai-inp').value=text;aiSend();}
function aiAddMsg(role,html){var m=document.getElementById('ai-msgs'),d=document.createElement('div');d.className='ai-msg '+role;d.innerHTML=html;m.appendChild(d);m.scrollTop=m.scrollHeight;return d;}
async function aiSend(){
  var inp=document.getElementById('ai-inp'),btn=document.getElementById('ai-send'),text=inp.value.trim();if(!text)return;
  inp.value='';btn.disabled=true;aiAddMsg('user',text);aiHistory.push({role:'user',content:text});
  var typing=aiAddMsg('ai','<span class="dots"><span>.</span><span>.</span><span>.</span></span>');
  var sys='You are an AI assistant for DC Appliance, an appliance retail store. Current tab: '+currentTab+'. You help with pricing, quotes, inventory management, service scheduling, delivery logistics, and general business questions. Be concise and helpful. Today is '+new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})+'.';
  try{var data=await claudeApiCall({system:sys,messages:aiHistory,max_tokens:600});var reply=data.content[0].text||'Sorry, try again.';aiHistory.push({role:'assistant',content:reply});typing.remove();aiAddMsg('ai',reply);}
  catch(e){typing.remove();aiAddMsg('ai',e.message||'Connection issue — please try again');}btn.disabled=false;inp.focus();
}

// ══════════════════════════════════════════════
// ADMIN
// ══════════════════════════════════════════════
var adminSection='categories';
var adminDataLoaded=false;
var adminCategories=[{name:'AUDIO',dept:'DC Electronics'},{name:'BED FRAMES',dept:'DC Furniture'},{name:'BEDROOM',dept:'DC Furniture'},{name:'BEVERAGE CENTER',dept:'DC Appliance'},{name:'BOTTOM MOUNT FRIDGE',dept:'DC Appliance'},{name:'BUILT IN',dept:'DC Appliance'},{name:'COMBO WASHER DRYER',dept:'DC Appliance'},{name:'COOK TOP',dept:'DC Appliance'},{name:'COUNTERTOP MICRO',dept:'DC Appliance'},{name:'DINING ROOM',dept:'DC Furniture'},{name:'DISHWASHERS',dept:'DC Appliance'},{name:'DRYERS',dept:'DC Appliance'},{name:'FILTER',dept:'DC Appliance'},{name:'FIREPLACES',dept:'DC Outdoor'},{name:'FOUNDATIONS',dept:'DC Mattress'},{name:'FREEZER',dept:'DC Appliance'},{name:'FRENCH DOOR FRIDGE',dept:'DC Appliance'},{name:'FURNITURE ACCESSORIES',dept:'DC Furniture'},{name:'FURNITURE BATTERY',dept:'DC Furniture'},{name:'GRILL',dept:'DC Outdoor'},{name:'GRILLING ACCESSORIES',dept:'DC Outdoor'},{name:'HOODS',dept:'DC Appliance'},{name:'ICEMKR',dept:'DC Appliance'},{name:'KITCHEN ACCESSORIES',dept:'DC Appliance'},{name:'LAUNDRY ACCESSORIES',dept:'DC Appliance'},{name:'LIVING ROOM',dept:'DC Furniture'},{name:'MATTRESS ACCESSORIES',dept:'DC Mattress'},{name:'MATTRESS PROTECTORS',dept:'DC Mattress'},{name:'MATTRESSES',dept:'DC Mattress'},{name:'OTR',dept:'DC Appliance'},{name:'OUTDOOR FURNITURE',dept:'DC Outdoor'},{name:'PEDASTALS',dept:'DC Appliance'},{name:'PELLETS',dept:'DC Outdoor'},{name:'PILLOWS',dept:'DC Mattress'},{name:'RANGES',dept:'DC Appliance'},{name:'RUGS',dept:'DC Furniture'},{name:'SAUCES SPICES',dept:'DC Outdoor'},{name:'SHEETS',dept:'DC Mattress'},{name:'SIDE BY SIDE FRIDGE',dept:'DC Appliance'},{name:'SMALL APPLIANCES',dept:'DC Appliance'},{name:'TOP MOUNT',dept:'DC Appliance'},{name:'TRASH COMPACTOR',dept:'DC Appliance'},{name:'TRIM KITS',dept:'DC Appliance'},{name:'TV',dept:'DC Electronics'},{name:'TV MOUNTS',dept:'DC Electronics'},{name:'VENT',dept:'DC Appliance'},{name:'WALL ART',dept:'DC Furniture'},{name:'WARRANTIES',dept:'DC Electronics'},{name:'WASHERS',dept:'DC Appliance'}];
var adminBrands=['Samsung','LG','Whirlpool','Bosch','GE','KitchenAid','Blomberg','Maytag','Frigidaire'];
var adminCommissions={defaults:{},overrides:[]};
var adminVendors=[];
var adminTaxZones=[
  {name:'Ellis County',counties:['Ellis'],stateRate:6.5,countyRate:1.5,cityRate:0.5},
  {name:'Russell County',counties:['Russell'],stateRate:6.5,countyRate:1.0,cityRate:0.5},
  {name:'Trego County',counties:['Trego'],stateRate:6.5,countyRate:0.75,cityRate:0.5},
  {name:'Rush County',counties:['Rush'],stateRate:6.5,countyRate:1.25,cityRate:0.5},
  {name:'Ford County',counties:['Ford'],stateRate:6.5,countyRate:1.5,cityRate:0.65}
];
var adminUsers=[];
var adminTechs=[];
// Extended warranty tiers
var warrantyTiers=[
  {id:1,name:'5 Year Appliance Warranty $699 Max',priceFrom:1,priceTo:699,cost:99,active:true},
  {id:2,name:'5 Year Appliance Warranty $999 Max',priceFrom:700,priceTo:999,cost:149,active:true},
  {id:3,name:'5 Year Appliance Warranty $1999 Max',priceFrom:1000,priceTo:1999,cost:199,active:true},
  {id:4,name:'5 Year Appliance Warranty $2999 Max',priceFrom:2000,priceTo:2999,cost:249,active:true},
  {id:5,name:'5 Year Appliance Warranty $4999 Max',priceFrom:3000,priceTo:4999,cost:299,active:true}
];
var wtyNextId=6;

async function adminLoad(){
  var keys=['admin-categories','admin-brands','admin-commissions','admin-tax-zones','pos-settings','admin-vendors','warranty-tiers'];
  for(var i=0;i<keys.length;i++){
    try{
      var res=await apiFetch('/api/admin-get?key='+encodeURIComponent(keys[i]));
      var json=await res.json();
      if(json&&json.data){
        if(keys[i]==='admin-categories' && json.data.length) adminCategories=json.data;
        if(keys[i]==='admin-brands' && json.data.length) adminBrands=json.data;
        if(keys[i]==='admin-commissions' && json.data.defaults) adminCommissions=json.data;
        if(keys[i]==='admin-tax-zones' && json.data.length) adminTaxZones=json.data;
        if(keys[i]==='admin-vendors' && Array.isArray(json.data)) adminVendors=json.data;
        if(keys[i]==='warranty-tiers' && json.data){
          if(Array.isArray(json.data.tiers)&&json.data.tiers.length){warrantyTiers=json.data.tiers;wtyNextId=json.data.nextId||warrantyTiers.length+1;}
        }
        if(keys[i]==='pos-settings' && json.data){
          if(json.data.invoiceMessage!==undefined) adminInvoiceMessage=json.data.invoiceMessage;
          if(json.data.deliveryPrice!==undefined) adminDeliveryPrice=json.data.deliveryPrice;
          if(json.data.inactivityMinutes!==undefined){adminInactivityMinutes=json.data.inactivityMinutes;PIN_TIMEOUT_MS=adminInactivityMinutes*60*1000;resetInactivity();}
        }
      }
    }catch(e){/* use defaults */}
  }
  // Load unified user database from users:dc-appliance
  await _loadUnifiedUsers();
  adminDataLoaded=true;
}

// POS Employees — stored in Redis key: users:dc-appliance
// Service Techs — stored in Redis key: service:techs (separate system)
async function _loadUnifiedUsers(){
  // Load POS employees
  try{
    var res=await apiFetch('/api/employees-get?companyId='+SVC_COMPANY_ID);
    var data=await res.json();
    if(data.users&&data.users.length){
      // Filter out any techs that may have been in the old unified DB
      adminUsers=data.users.filter(function(u){return u.role!=='tech';});
    }
  }catch(e){}
  // Migrate: if empty, seed from old pos:admin-users (POS employees only)
  if(!adminUsers.length){
    try{
      var old=await apiFetch('/api/admin-get?key=admin-users');var oj=await old.json();
      if(oj&&oj.data&&oj.data.length){
        adminUsers=oj.data.filter(function(u){return !u._svcTech;}).map(function(u){
          return{
            name:u.name, password:u.pin||'changeme', role:'admin',
            tech:u.name, posRole:u.role||'Sales', pin:u.pin||'',
            email:u.email||'', phone:u.phone||'', permissions:u.permissions||null
          };
        });
        await saveAllUsers();
        console.log('Migrated '+adminUsers.length+' POS employees');
      }
    }catch(e){}
  }
  // Ensure there's at least one Owner/Admin for POS
  if(!adminUsers.some(function(u){return u.posRole==='Owner/Admin';})){
    adminUsers.unshift({name:'Chandler',password:'DCA123',role:'admin',tech:'Chandler',posRole:'Owner/Admin',pin:'',email:'',phone:'',permissions:null,active:true});
    saveAllUsers();
  }
  // Ensure every POS employee has required fields
  adminUsers.forEach(function(u){
    if(!u.posRole)u.posRole=u.role==='admin'?'Owner/Admin':'Sales';
    if(!u.role)u.role='admin';
    if(!u.password)u.password='changeme';
    if(u.pin===undefined)u.pin='';
    if(u.email===undefined)u.email='';
    if(u.phone===undefined)u.phone='';
    if(u.tech===undefined)u.tech=u.name;
    if(u.active===undefined)u.active=true;
  });
  // Load service techs (separate Redis key)
  await _loadServiceTechs();
}

async function _loadServiceTechs(){
  try{
    var res=await apiFetch('/api/techs-get');
    var data=await res.json();
    if(data.techs&&data.techs.length){adminTechs=data.techs;}
  }catch(e){}
  // Migrate: pull techs from old unified DB if service:techs is empty
  if(!adminTechs.length){
    try{
      var res2=await apiFetch('/api/employees-get?companyId='+SVC_COMPANY_ID);
      var data2=await res2.json();
      var oldTechs=(data2.users||[]).filter(function(u){return u.role==='tech';});
      if(oldTechs.length){
        adminTechs=oldTechs.map(function(u){
          return{name:u.name,password:u.password||'changeme',tech:u.tech||u.name,phone:u.phone||'',email:u.email||'',active:u.active!==false};
        });
        await saveAllTechs();
        console.log('Migrated '+adminTechs.length+' service techs to service:techs');
      }
    }catch(e){}
  }
  // Ensure defaults
  adminTechs.forEach(function(t){
    if(!t.password)t.password='changeme';
    if(!t.tech)t.tech=t.name;
    if(t.active===undefined)t.active=true;
  });
  // Update svcTechList for POS service tab
  _updateSvcTechList();
}

var _posEmpTechNames=[];
var _posContractorTechNames=[];
function _updateSvcTechList(){
  _posContractorTechNames=adminTechs.filter(function(t){return t.active!==false;}).map(function(t){return t.tech||t.name;});
  // Employee techs from adminUsers
  _posEmpTechNames=adminUsers.filter(function(u){
    if(u.active===false)return false;
    var r=(u.posRole||'').toLowerCase();
    return r.indexOf('tech')>=0||r.indexOf('service')>=0||r==='owner/admin'||r==='general manager'||r==='manager';
  }).map(function(u){return u.tech||u.name;});
  svcTechList=['Unassigned'].concat(_posEmpTechNames).concat(_posContractorTechNames);
  // Populate the new-job assign dropdown if it exists
  var fTech=document.getElementById('svc-f-tech');
  if(fTech){fTech.innerHTML=_buildSvcTechOptions(fTech.value||'Unassigned');}
}
function _buildSvcTechOptions(selected){
  var h='<option value="Unassigned"'+(selected==='Unassigned'?' selected':'')+'>Unassigned</option>';
  if(_posEmpTechNames.length){
    h+='<optgroup label="Employees">';
    _posEmpTechNames.forEach(function(t){h+='<option value="'+t+'"'+(selected===t?' selected':'')+'>'+t+'</option>';});
    h+='</optgroup>';
  }
  if(_posContractorTechNames.length){
    h+='<optgroup label="Independent Contractors">';
    _posContractorTechNames.forEach(function(t){h+='<option value="'+t+'"'+(selected===t?' selected':'')+'>'+t+'</option>';});
    h+='</optgroup>';
  }
  return h;
}

async function saveAllTechs(){
  try{
    var res=await apiFetch('/api/techs-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({techs:adminTechs,requesterPassword:'DCA123'})});
    var data=await res.json();
    if(!data.ok)throw new Error(data.error);
    _updateSvcTechList();
    return true;
  }catch(e){toast('Save techs failed: '+e.message,'error');return false;}
}

async function saveAllUsers(){
  // Ensure at least one admin for POS
  if(!adminUsers.some(function(u){return u.role==='admin';})){
    toast('Must have at least one admin employee','error');return false;
  }
  try{
    var res=await apiFetch('/api/employees-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({companyId:SVC_COMPANY_ID,users:adminUsers,requesterPassword:'DCA123'})});
    var data=await res.json();
    if(!data.ok)throw new Error(data.error);
    return true;
  }catch(e){toast('Save failed: '+e.message,'error');return false;}
}

async function adminSave(key,data){
  try{
    await apiFetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:key,data:data})});
    toast('Saved','success');
  }catch(e){toast('Save failed','error');}
}

function renderAdmin(){
  if(!adminDataLoaded){adminLoad().then(function(){renderAdminSection();});}
  else{renderAdminSection();}
}

function selectAdminSection(section){
  adminSection=section;
  document.querySelectorAll('.admin-menu-item').forEach(function(el){el.classList.remove('active');});
  event.currentTarget.classList.add('active');
  document.querySelectorAll('.admin-panel').forEach(function(p){p.classList.remove('active');});
  var panel=document.getElementById('admin-panel-'+section);
  if(panel) panel.classList.add('active');
  renderAdminSection();
}

function renderAdminSection(){
  if(adminSection==='categories') renderAdminCategories();
  else if(adminSection==='brands') renderAdminBrands();
  else if(adminSection==='commissions') renderAdminCommissions();
  else if(adminSection==='commreport') renderCommReport();
  else if(adminSection==='taxrates') renderTaxList();
  else if(adminSection==='taxzones') renderAdminTaxZones();
  else if(adminSection==='priceupdate') renderPriceHistory();
  else if(adminSection==='users') renderAdminUsers();
  else if(adminSection==='timeclockadmin') renderTcAdmin();
  else if(adminSection==='reports') renderReportsSection();
  else if(adminSection==='permissions') renderPermEditor();
  else if(adminSection==='serviceadmin') svcAdminLoadTechs();
  else if(adminSection==='vendors') renderVendors();
  else if(adminSection==='mergetool') renderMergeTool();
  else if(adminSection==='storesettings') renderStoreSettings();
  else if(adminSection==='receiveinv') renderReceiveInv();
  else if(adminSection==='dataimport') renderDataImport();
  else if(adminSection==='arreport') renderARReport();
  else if(adminSection==='eomreports') renderEomReports();
  else if(adminSection==='warranties') renderWarrantyTiers();
  else if(adminSection==='possettings') renderPosSettings();
}

// --- Categories ---
function renderAdminCategories(){
  var wrap=document.getElementById('admin-categories-list');
  if(!adminCategories.length){wrap.innerHTML='<div class="admin-empty">No categories yet.</div>';return;}
  // Group by department
  var byDept={};
  adminCategories.forEach(function(cat,i){
    var d=(typeof cat==='string')?'Uncategorized':(cat.dept||'Uncategorized');
    var n=(typeof cat==='string')?cat:cat.name;
    if(!byDept[d])byDept[d]=[];
    byDept[d].push({name:n,idx:i});
  });
  var h='';
  Object.keys(byDept).forEach(function(dept){
    h+='<div style="font-size:12px;font-weight:700;color:#2563eb;margin:12px 0 6px;padding-bottom:4px;border-bottom:1px solid #e5e7eb;">'+dept+'</div>';
    byDept[dept].forEach(function(c){
      h+='<div class="admin-card"><span class="admin-card-name">'+c.name+'</span><div class="admin-card-actions">'
        +'<button class="admin-card-btn edit" onclick="adminEditCategory('+c.idx+')">Edit</button>'
        +'<button class="admin-card-btn delete" onclick="adminDeleteCategory('+c.idx+')">Delete</button>'
        +'</div></div>';
    });
  });
  wrap.innerHTML=h;
}
function adminAddCategory(){
  var deptNames=DEPARTMENTS.map(function(d){return d.name;});
  var dept=prompt('Department:\n'+deptNames.join(', '),'DC Appliance');
  if(!dept)return;
  var name=prompt('Category name:');
  if(!name||!name.trim())return;
  adminCategories.push({name:name.trim(),dept:dept.trim()});
  // Also add to DEPARTMENTS if not there
  var d=DEPARTMENTS.find(function(x){return x.name===dept.trim();});
  if(d&&d.cats.indexOf(name.trim())===-1)d.cats.push(name.trim());
  else if(!d)DEPARTMENTS.push({name:dept.trim(),cats:[name.trim()]});
  renderAdminCategories();
  adminSave('admin-categories',adminCategories);
}
function adminEditCategory(i){
  var cat=adminCategories[i];
  var oldName=(typeof cat==='string')?cat:cat.name;
  var oldDept=(typeof cat==='string')?'':cat.dept;
  var newName=prompt('Category name:',oldName);
  if(!newName||!newName.trim())return;
  var newDept=prompt('Department:',oldDept);
  adminCategories[i]={name:newName.trim(),dept:(newDept||oldDept).trim()};
  renderAdminCategories();adminSave('admin-categories',adminCategories);
}
function adminDeleteCategory(i){
  var cat=adminCategories[i];
  var name=(typeof cat==='string')?cat:cat.name;
  if(!confirm('Delete "'+name+'"?'))return;
  adminCategories.splice(i,1);
  renderAdminCategories();adminSave('admin-categories',adminCategories);
}

// --- Brands ---
function renderAdminBrands(){
  var wrap=document.getElementById('admin-brands-list');
  if(!adminBrands.length){wrap.innerHTML='<div class="admin-empty">No brands yet.</div>';return;}
  var h='';
  adminBrands.forEach(function(brand,i){
    h+='<div class="admin-card"><span class="admin-card-name">'+brand+'</span><div class="admin-card-actions">'
      +'<button class="admin-card-btn edit" onclick="adminEditBrand('+i+')">Edit</button>'
      +'<button class="admin-card-btn delete" onclick="adminDeleteBrand('+i+')">Delete</button>'
      +'</div></div>';
  });
  wrap.innerHTML=h;
}
function adminAddBrand(){
  var wrap=document.getElementById('admin-inline-brand');
  wrap.style.display='block';
  wrap.innerHTML='<div class="admin-inline-input"><input class="inp" id="admin-new-brand" placeholder="Brand name..." autofocus/>'
    +'<button class="admin-save-btn" onclick="adminSaveNewBrand()">Save</button>'
    +'<button class="admin-cancel-btn" onclick="document.getElementById(\'admin-inline-brand\').style.display=\'none\'">Cancel</button></div>';
  document.getElementById('admin-new-brand').focus();
}
function adminSaveNewBrand(){
  var v=document.getElementById('admin-new-brand').value.trim();
  if(!v){toast('Enter a name','error');return;}
  adminBrands.push(v);
  document.getElementById('admin-inline-brand').style.display='none';
  renderAdminBrands();
  adminSave('admin-brands',adminBrands);
}
function adminEditBrand(i){
  var newName=prompt('Edit brand:',adminBrands[i]);
  if(newName!==null&&newName.trim()){
    adminBrands[i]=newName.trim();
    renderAdminBrands();
    adminSave('admin-brands',adminBrands);
  }
}
function adminDeleteBrand(i){
  if(!confirm('Delete "'+adminBrands[i]+'"?')) return;
  adminBrands.splice(i,1);
  renderAdminBrands();
  adminSave('admin-brands',adminBrands);
}

// --- Commission Rates ---
function renderAdminCommissions(){
  var wrap=document.getElementById('admin-commissions-content');
  var h='<div style="margin-bottom:16px;"><div style="font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--gray-2);margin-bottom:8px;">Default Rates by Category</div>';
  h+='<table class="admin-table"><thead><tr><th>Category</th><th style="width:120px;">Commission %</th></tr></thead><tbody>';
  adminCategories.forEach(function(cat){
    var pct=adminCommissions.defaults[cat]||'';
    h+='<tr><td>'+cat+'</td><td><input type="number" step="0.1" min="0" max="100" value="'+pct+'" onchange="adminSetDefaultComm(\''+cat.replace(/'/g,"\\'")+'\',this.value)" placeholder="0"/></td></tr>';
  });
  h+='</tbody></table></div>';
  h+='<div style="font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--gray-2);margin-bottom:8px;">Salesperson Overrides</div>';
  if(adminCommissions.overrides.length){
    h+='<table class="admin-table"><thead><tr><th>Salesperson</th><th>Category</th><th style="width:100px;">%</th><th style="width:60px;"></th></tr></thead><tbody>';
    adminCommissions.overrides.forEach(function(ov,i){
      h+='<tr><td>'+ov.person+'</td><td>'+ov.cat+'</td><td>'+ov.pct+'%</td>'
        +'<td><button class="admin-card-btn delete" onclick="adminDeleteCommOverride('+i+')">Del</button></td></tr>';
    });
    h+='</tbody></table>';
  }else{
    h+='<div class="admin-empty" style="padding:20px;">No overrides configured.</div>';
  }
  wrap.innerHTML=h;
}
function adminSetDefaultComm(cat,val){
  var n=parseFloat(val);
  if(isNaN(n)||n<=0){delete adminCommissions.defaults[cat];}
  else{adminCommissions.defaults[cat]=n;}
  adminSave('admin-commissions',adminCommissions);
}
function adminAddCommOverride(){
  var person=prompt('Salesperson name:');
  if(!person||!person.trim()) return;
  var cat=prompt('Category ('+adminCategories.join(', ')+'):');
  if(!cat||!cat.trim()) return;
  var pct=prompt('Commission %:');
  if(!pct) return;
  var n=parseFloat(pct);
  if(isNaN(n)){toast('Invalid percentage','error');return;}
  adminCommissions.overrides.push({person:person.trim(),cat:cat.trim(),pct:n});
  renderAdminCommissions();
  adminSave('admin-commissions',adminCommissions);
}
function adminDeleteCommOverride(i){
  if(!confirm('Delete this override?')) return;
  adminCommissions.overrides.splice(i,1);
  renderAdminCommissions();
  adminSave('admin-commissions',adminCommissions);
}

// --- Tax Zones ---
function renderAdminTaxZones(){
  var wrap=document.getElementById('admin-taxzones-list');
  if(!adminTaxZones.length){wrap.innerHTML='<div class="admin-empty">No tax zones.</div>';return;}
  var h='';
  adminTaxZones.forEach(function(z,i){
    var combined=(z.stateRate+z.countyRate+z.cityRate).toFixed(2);
    h+='<div class="admin-zone-card"><div class="admin-zone-hdr"><span class="admin-zone-name">'+z.name+'</span>'
      +'<div class="admin-card-actions">'
      +'<button class="admin-card-btn edit" onclick="adminEditTaxZone('+i+')">Edit</button>'
      +'<button class="admin-card-btn delete" onclick="adminDeleteTaxZone('+i+')">Delete</button>'
      +'</div></div>'
      +'<div class="admin-zone-counties">Counties: '+z.counties.join(', ')+'</div>'
      +'<div class="admin-zone-rates">'
      +'<div class="admin-zone-rate-item"><div class="admin-zone-rate-label">State</div><div class="admin-zone-rate-val">'+z.stateRate+'%</div></div>'
      +'<div class="admin-zone-rate-item"><div class="admin-zone-rate-label">County</div><div class="admin-zone-rate-val">'+z.countyRate+'%</div></div>'
      +'<div class="admin-zone-rate-item"><div class="admin-zone-rate-label">City</div><div class="admin-zone-rate-val">'+z.cityRate+'%</div></div>'
      +'</div>'
      +'<div class="admin-zone-rate" style="margin-top:8px;">Combined: '+combined+'%</div>'
      +'</div>';
  });
  wrap.innerHTML=h;
}
function adminAddTaxZone(){
  var choice=prompt('Enter jurisdiction name to search KS database, or type "custom" for manual entry:');
  if(!choice||!choice.trim()) return;
  if(choice.trim().toLowerCase()==='custom'){
    var name=prompt('Zone name:');if(!name||!name.trim()) return;
    var counties=prompt('Counties (comma-separated):');if(!counties) return;
    var stateRate=parseFloat(prompt('State rate %:','6.5'));
    var countyRate=parseFloat(prompt('County rate %:','1.0'));
    var cityRate=parseFloat(prompt('City rate %:','0.5'));
    if(isNaN(stateRate)||isNaN(countyRate)||isNaN(cityRate)){toast('Invalid rates','error');return;}
    adminTaxZones.push({name:name.trim(),counties:counties.split(',').map(function(c){return c.trim();}),stateRate:stateRate,countyRate:countyRate,cityRate:cityRate});
  } else {
    var q=choice.trim().toLowerCase();
    var matches=KS_TAX.filter(function(t){return t.n.toLowerCase().indexOf(q)!==-1;});
    if(matches.length===0){toast('No matching jurisdiction found','error');return;}
    var pick=matches[0];
    if(matches.length>1){var list=matches.slice(0,10).map(function(t,i){return (i+1)+'. '+t.n+' ('+t.r+'%)';}).join('\n');
      var idx=parseInt(prompt('Multiple matches:\n'+list+'\n\nEnter number:'));
      if(isNaN(idx)||idx<1||idx>matches.length){toast('Invalid selection','error');return;}
      pick=matches[idx-1];
    }
    if(adminTaxZones.find(function(z){return z.name===pick.n;})){toast(pick.n+' already exists','info');return;}
    adminTaxZones.push({name:pick.n,counties:[pick.n],stateRate:pick.s,countyRate:pick.co,cityRate:pick.ci});
  }
  renderAdminTaxZones();
  adminSave('admin-tax-zones',adminTaxZones);
}
function adminEditTaxZone(i){
  var z=adminTaxZones[i];
  var name=prompt('Zone name:',z.name);
  if(!name||!name.trim()) return;
  var counties=prompt('Counties (comma-separated):',z.counties.join(', '));
  if(!counties) return;
  var stateRate=parseFloat(prompt('State rate %:',z.stateRate));
  var countyRate=parseFloat(prompt('County rate %:',z.countyRate));
  var cityRate=parseFloat(prompt('City rate %:',z.cityRate));
  if(isNaN(stateRate)||isNaN(countyRate)||isNaN(cityRate)){toast('Invalid rates','error');return;}
  adminTaxZones[i]={name:name.trim(),counties:counties.split(',').map(function(c){return c.trim();}),stateRate:stateRate,countyRate:countyRate,cityRate:cityRate};
  renderAdminTaxZones();
  adminSave('admin-tax-zones',adminTaxZones);
}
function adminDeleteTaxZone(i){
  if(!confirm('Delete "'+adminTaxZones[i].name+'"?')) return;
  adminTaxZones.splice(i,1);
  renderAdminTaxZones();
  adminSave('admin-tax-zones',adminTaxZones);
}

// --- Users ---
var ROLE_PERMS={
  'Owner/Admin':['sale','inventory','orders','delivery','service','customers','timeclock','admin'],
  'General Manager':['sale','inventory','orders','delivery','service','customers','timeclock'],
  'Manager':['sale','inventory','orders','delivery','service','customers','timeclock'],
  'Sales':['sale','orders','customers','timeclock'],
  'CSR':['sale','customers','orders','timeclock'],
  'Delivery':['delivery','timeclock']
};
function _findDuplicatePins(){
  var pinMap={};var dupes={};
  adminUsers.forEach(function(u,i){
    if(!u.pin||u.active===false)return;
    if(pinMap[u.pin]!==undefined){dupes[u.pin]=dupes[u.pin]||[adminUsers[pinMap[u.pin]].name];dupes[u.pin].push(u.name);}
    else{pinMap[u.pin]=i;}
  });
  return dupes;
}
function renderAdminUsers(){
  var wrap=document.getElementById('admin-users-list');
  if(!adminUsers.length){wrap.innerHTML='<div class="admin-empty">No employees.</div>';return;}
  var dupes=_findDuplicatePins();
  var h='';
  // Show duplicate PIN warnings at top
  var dupPins=Object.keys(dupes);
  if(dupPins.length){
    h+='<div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:12px 16px;margin-bottom:14px;">';
    dupPins.forEach(function(pin){
      h+='<div style="font-size:12px;color:#92400e;font-weight:600;margin-bottom:4px;">&#9888;&#65039; Duplicate PIN — '+dupes[pin].join(' and ')+' share PIN '+pin+'. Please update one.</div>';
    });
    h+='</div>';
  }
  h+='<table class="admin-table"><thead><tr><th>Name</th><th>POS Role</th><th>PIN</th><th>Status</th><th style="width:180px;"></th></tr></thead><tbody>';
  adminUsers.forEach(function(u,i){
    var inactive=u.active===false;
    var statusBadge=inactive
      ?'<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:100px;background:#fee2e2;color:#dc2626;">INACTIVE</span>'
      :'<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:100px;background:#dcfce7;color:#16a34a;">ACTIVE</span>';
    var rowStyle=inactive?'opacity:0.5;':'';
    var pinDupe=u.pin&&dupes[u.pin];
    var pinDisplay=u.pin||'—';
    if(pinDupe)pinDisplay='<span style="color:#dc2626;font-weight:700;">'+u.pin+' &#9888;</span>';
    h+='<tr style="'+rowStyle+'"><td style="font-weight:600;">'+u.name+'</td>'
      +'<td>'+(u.posRole||'—')+'</td>'
      +'<td><span class="pin-cell" onclick="inlineEditPin(this,'+i+')" style="cursor:pointer;min-width:40px;display:inline-block;" title="Click to edit PIN">'+pinDisplay+'</span></td>'
      +'<td>'+statusBadge+'</td>'
      +'<td><div class="admin-card-actions">'
      +'<button class="admin-card-btn edit" onclick="adminEditUser('+i+')">Edit</button>'
      +(inactive?'<button class="admin-card-btn edit" style="border-color:#86efac;color:#16a34a;" onclick="adminToggleActive('+i+',true)">Activate</button>':'<button class="admin-card-btn delete" style="border-color:#fca5a5;color:#dc2626;" onclick="adminToggleActive('+i+',false)">Deactivate</button>')
      +'<button class="admin-card-btn delete" onclick="adminDeleteUser('+i+')">Delete</button>'
      +'</div></td></tr>';
  });
  h+='</tbody></table>';
  wrap.innerHTML=h;
}
function inlineEditPin(span,i){
  var u=adminUsers[i];if(!u)return;
  var inp=document.createElement('input');
  inp.type='text';inp.maxLength=4;inp.value=u.pin||'';
  inp.style.cssText='width:60px;text-align:center;font-size:inherit;padding:2px 4px;border:1px solid #3b82f6;border-radius:4px;outline:none;';
  inp.setAttribute('inputmode','numeric');inp.setAttribute('pattern','[0-9]*');
  function save(){
    var val=inp.value.trim();
    if(val&&(val.length!==4||isNaN(val))){toast('PIN must be 4 digits','error');inp.focus();return;}
    if(val&&adminUsers.find(function(x,j){return j!==i&&x.pin===val;})){toast('PIN already in use','error');inp.focus();return;}
    u.pin=val;renderAdminUsers();saveAllUsers().then(function(){if(val)toast(u.name+' PIN updated','success');});
  }
  inp.addEventListener('blur',save);
  inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();inp.blur();}if(e.key==='Escape'){u.pin=u.pin;renderAdminUsers();}});
  span.textContent='';span.appendChild(inp);inp.focus();inp.select();
}
function adminToggleActive(i,active){
  var u=adminUsers[i];if(!u)return;
  var action=active?'activate':'deactivate';
  if(!confirm((active?'Activate':'Deactivate')+' "'+u.name+'"?'+(active?'':' They will be locked out of POS.')))return;
  u.active=active;
  saveAllUsers().then(function(ok){
    if(ok!==false){renderAdminUsers();toast(u.name+(active?' activated':' deactivated'),(active?'success':'info'));}
  });
}
function adminAddUser(){
  var name=prompt('Employee name:');if(!name||!name.trim())return;
  var posRole=prompt('POS role (Owner/Admin, General Manager, Sales, CSR, Delivery):','Sales');if(!posRole)return;
  var pin=prompt('4-digit POS PIN (or leave blank):','');
  if(pin&&(pin.length!==4||isNaN(pin))){toast('PIN must be 4 digits','error');return;}
  if(pin&&adminUsers.find(function(u){return u.pin===pin;})){toast('PIN already in use','error');return;}
  var pw=prompt('Password (for admin access):','')||'changeme';
  var email=prompt('Email:','')||'';
  var phone=prompt('Phone:','')||'';
  adminUsers.push({name:name.trim(),password:pw.trim(),role:'admin',tech:name.trim(),posRole:posRole.trim(),pin:pin||'',email:email.trim(),phone:phone.trim(),permissions:null,active:true});
  saveAllUsers().then(function(ok){if(ok!==false){renderAdminUsers();toast('Employee added','success');}});
}
function adminEditUser(i){
  var u=adminUsers[i];
  var name=prompt('Name:',u.name);if(!name||!name.trim())return;
  var posRole=prompt('POS role (Owner/Admin, General Manager, Sales, CSR, Delivery):',u.posRole||'');
  var pw=prompt('Password:',u.password)||u.password;
  var email=prompt('Email:',u.email||'')||'';
  var phone=prompt('Phone:',u.phone||'')||'';
  u.name=name.trim();u.posRole=(posRole||u.posRole||'').trim();u.password=pw.trim();u.tech=name.trim();u.email=email.trim();u.phone=phone.trim();
  saveAllUsers().then(function(ok){if(ok!==false){renderAdminUsers();toast('Employee updated','success');}});
}
// ── Service Tech Management (independent contractors — service:techs) ──
function svcAdminLoadTechs(){svcAdminRender();}
function svcAdminRender(){
  var wrap=document.getElementById('svc-admin-techs');if(!wrap)return;
  if(!adminTechs.length){wrap.innerHTML='<div class="admin-empty">No service techs configured.</div>';return;}
  var h='<table class="admin-table"><thead><tr><th>Name</th><th>Display Name</th><th>Password</th><th>Phone</th><th>Status</th><th style="width:180px;"></th></tr></thead><tbody>';
  adminTechs.forEach(function(t,i){
    var inactive=t.active===false;
    var statusBadge=inactive
      ?'<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:100px;background:#fee2e2;color:#dc2626;">INACTIVE</span>'
      :'<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:100px;background:#dcfce7;color:#16a34a;">ACTIVE</span>';
    var rowStyle=inactive?'opacity:0.5;':'';
    h+='<tr style="'+rowStyle+'"><td style="font-weight:600;">'+t.name+'</td>'
      +'<td>'+(t.tech||'—')+'</td>'
      +'<td style="font-family:monospace;font-size:11px;">'+(t.password||'—')+'</td>'
      +'<td>'+(t.phone||'—')+'</td>'
      +'<td>'+statusBadge+'</td>'
      +'<td><div class="admin-card-actions">'
      +'<button class="admin-card-btn edit" onclick="svcAdminEditTech('+i+')">Edit</button>'
      +(inactive?'<button class="admin-card-btn edit" style="border-color:#86efac;color:#16a34a;" onclick="svcAdminToggleTech('+i+',true)">Activate</button>':'<button class="admin-card-btn delete" style="border-color:#fca5a5;color:#dc2626;" onclick="svcAdminToggleTech('+i+',false)">Deactivate</button>')
      +'<button class="admin-card-btn delete" onclick="svcAdminDeleteTech('+i+')">Delete</button>'
      +'</div></td></tr>';
  });
  h+='</tbody></table>';
  wrap.innerHTML=h;
}
function svcAdminAddTech(){
  var name=prompt('Tech login name:');if(!name||!name.trim())return;
  var techDisplay=prompt('Tech display name (shown in service portal):',name.trim())||name.trim();
  var pw=prompt('Service portal password:');if(!pw||!pw.trim())return;
  var phone=prompt('Phone:','')||'';
  adminTechs.push({name:name.trim(),password:pw.trim(),tech:techDisplay.trim(),phone:phone.trim(),email:'',active:true});
  saveAllTechs().then(function(ok){if(ok!==false){svcAdminRender();toast('Service tech added','success');}});
}
function svcAdminEditTech(i){
  var t=adminTechs[i];
  var name=prompt('Login name:',t.name);if(!name||!name.trim())return;
  var techDisplay=prompt('Display name:',t.tech||t.name)||t.name;
  var pw=prompt('Password:',t.password)||t.password;
  var phone=prompt('Phone:',t.phone||'')||'';
  t.name=name.trim();t.tech=techDisplay.trim();t.password=pw.trim();t.phone=phone.trim();
  saveAllTechs().then(function(ok){if(ok!==false){svcAdminRender();toast('Tech updated','success');}});
}
function svcAdminToggleTech(i,active){
  var t=adminTechs[i];if(!t)return;
  if(!confirm((active?'Activate':'Deactivate')+' "'+t.name+'"?'))return;
  t.active=active;
  saveAllTechs().then(function(ok){if(ok!==false){svcAdminRender();toast(t.name+(active?' activated':' deactivated'),(active?'success':'info'));}});
}
function svcAdminDeleteTech(i){
  if(!confirm('Delete "'+adminTechs[i].name+'"?'))return;
  adminTechs.splice(i,1);svcAdminRender();saveAllTechs();
}

// ── Employee Permissions ──
var PERM_TABS=['dashboard','sale','customers','inventory','orders','delivery','service','timeclock','reorder','admin'];
var PERM_FEATURES=['canDiscount','canVoid','canEditPrices','canReturns','canViewReports','canManageEmployees'];
var PERM_LABELS={dashboard:'Dashboard',sale:'New Sale',customers:'Customers',inventory:'Inventory',orders:'Open Orders',delivery:'Delivery',service:'Service',timeclock:'Time Clock',reorder:'Reorder',admin:'Admin Panel',canDiscount:'Can Apply Discounts',canVoid:'Can Void Sales',canEditPrices:'Can Edit Prices',canReturns:'Can Process Returns',canViewReports:'Can View Reports',canManageEmployees:'Can Manage Employees'};
var PERM_PRESETS={
  'Owner/Admin':{tabs:PERM_TABS.slice(),features:PERM_FEATURES.slice()},
  'General Manager':{tabs:PERM_TABS.slice(),features:PERM_FEATURES.filter(function(f){return f!=='canManageEmployees';})},
  'Sales':{tabs:['sale','customers','inventory','orders','timeclock'],features:['canDiscount','canReturns']},
  'CSR':{tabs:['sale','customers','orders','timeclock'],features:[]},
  'Delivery':{tabs:['delivery','timeclock'],features:[]},
  'Tech':{tabs:['service','timeclock'],features:[]}
};
function renderPermEditor(){
  var wrap=document.getElementById('perm-editor');if(!wrap)return;
  if(!adminUsers.length){wrap.innerHTML='<div class="admin-empty">No employees. Add employees first.</div>';return;}
  var allPerms=PERM_TABS.concat(PERM_FEATURES);
  var h='';
  function renderPermCard(u,idx){
    var perms=u.permissions||{};
    if(!u.permissions){
      var preset=PERM_PRESETS[u.posRole]||PERM_PRESETS['Sales'];
      perms={};allPerms.forEach(function(p){perms[p]=false;});
      preset.tabs.forEach(function(t){perms[t]=true;});
      preset.features.forEach(function(f){perms[f]=true;});
    }
    var card='<div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:12px;">';
    card+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">';
    card+='<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:14px;font-weight:700;color:#1f2937;">'+u.name+'</span>';
    card+='<span style="font-size:11px;color:#6b7280;margin-left:4px;">'+(u.posRole||'Sales')+'</span></div>';
    card+='<div style="display:flex;gap:4px;flex-wrap:wrap;">';
    Object.keys(PERM_PRESETS).forEach(function(preset){
      card+='<button class="ghost-btn" style="padding:3px 8px;font-size:9px;" onclick="permApplyPreset('+idx+',\''+preset+'\')">'+preset+'</button>';
    });
    card+='</div></div>';
    card+='<div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Tabs</div>';
    card+='<div style="display:flex;flex-wrap:wrap;gap:6px 14px;margin-bottom:10px;">';
    PERM_TABS.forEach(function(p){
      var checked=perms[p]?'checked':'';
      card+='<label style="display:flex;align-items:center;gap:4px;font-size:11px;color:#374151;cursor:pointer;"><input type="checkbox" class="perm-cb" data-emp="'+idx+'" data-perm="'+p+'" '+checked+' style="accent-color:#2563eb;"/> '+PERM_LABELS[p]+'</label>';
    });
    card+='</div>';
    card+='<div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Features</div>';
    card+='<div style="display:flex;flex-wrap:wrap;gap:6px 14px;margin-bottom:10px;">';
    PERM_FEATURES.forEach(function(p){
      var checked=perms[p]?'checked':'';
      card+='<label style="display:flex;align-items:center;gap:4px;font-size:11px;color:#374151;cursor:pointer;"><input type="checkbox" class="perm-cb" data-emp="'+idx+'" data-perm="'+p+'" '+checked+' style="accent-color:#2563eb;"/> '+PERM_LABELS[p]+'</label>';
    });
    card+='</div>';
    card+='<button class="primary-btn" style="padding:5px 14px;font-size:11px;" onclick="permSaveUser('+idx+')">Save Permissions</button>';
    card+='</div>';
    return card;
  }
  // POS Employees only
  adminUsers.forEach(function(u,i){h+=renderPermCard(u,i);});
  wrap.innerHTML=h;
}
function permApplyPreset(empIdx,presetName){
  var preset=PERM_PRESETS[presetName];if(!preset)return;
  var allPerms=PERM_TABS.concat(PERM_FEATURES);
  document.querySelectorAll('.perm-cb[data-emp="'+empIdx+'"]').forEach(function(cb){
    var perm=cb.getAttribute('data-perm');
    cb.checked=preset.tabs.indexOf(perm)!==-1||preset.features.indexOf(perm)!==-1;
  });
  toast('Applied "'+presetName+'" preset for '+adminUsers[empIdx].name,'info');
}
function permSaveUser(empIdx){
  var u=adminUsers[empIdx];if(!u)return;
  u.permissions={};
  document.querySelectorAll('.perm-cb[data-emp="'+empIdx+'"]').forEach(function(cb){
    u.permissions[cb.getAttribute('data-perm')]=cb.checked;
  });
  saveAllUsers().then(function(ok){if(ok!==false)toast(u.name+' permissions saved','success');});
}

// Override applyPermissions to use granular permissions
var _origApplyPermissions=typeof applyPermissions==='function'?applyPermissions:null;

// ═══ COMMISSION REPORT ═══
function getCommReportData(yearMonth){
  // yearMonth = '2026-04' format
  var data=[];
  orders.forEach(function(o){
    if(o.status==='Quote')return;
    o.items.forEach(function(item){
      if(!item.delivered)return;
      var dAt=item.deliveredAt||o.date;
      if(!dAt)return;
      var ym=dAt.slice(0,7);
      if(ym!==yearMonth)return;
      data.push({
        clerk:item.deliveredBy||o.clerk||'Unknown',
        product:item.name,
        model:item.model||'',
        price:item.price,
        qty:item.qty,
        lineTotal:item.price*item.qty,
        rate:item.commissionRate||0,
        earned:item.commissionEarned||0,
        date:dAt.slice(0,10),
        orderId:o.id,
        serial:item.serial||''
      });
    });
  });
  return data;
}

function renderCommReport(){
  var monthEl=document.getElementById('comm-report-month');
  if(!monthEl.value){var now=new Date();monthEl.value=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');}
  var ym=monthEl.value;
  var data=getCommReportData(ym);
  var wrap=document.getElementById('comm-report-content');
  if(!data.length){wrap.innerHTML='<div class="admin-empty" style="padding:20px;">No delivered items for this month.</div>';return;}

  // Group by clerk
  var grouped={};
  data.forEach(function(d){
    if(!grouped[d.clerk])grouped[d.clerk]={items:[],total:0,earned:0};
    grouped[d.clerk].items.push(d);
    grouped[d.clerk].total+=d.lineTotal;
    grouped[d.clerk].earned+=d.earned;
  });

  var monthLabel=new Date(ym+'-15').toLocaleDateString('en-US',{month:'long',year:'numeric'});
  var h='<div style="font-size:13px;font-weight:600;color:var(--gray-2);margin-bottom:12px;">'+monthLabel+' — '+data.length+' delivered items</div>';

  Object.keys(grouped).sort().forEach(function(clerk){
    var g=grouped[clerk];
    h+='<div style="margin-bottom:20px;border:1px solid var(--border);border-radius:8px;overflow:hidden;">';
    h+='<div style="background:var(--bg3);padding:10px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);">';
    h+='<span style="font-size:14px;font-weight:700;">'+clerk+'</span>';
    h+='<span style="font-size:13px;font-weight:700;color:var(--green);">Commission: '+fmt(g.earned)+'</span>';
    h+='</div>';
    h+='<table class="admin-table" style="font-size:11px;margin:0;"><thead><tr><th>Date</th><th>Order</th><th>Product</th><th>Model</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Sale Price</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Earned</th></tr></thead><tbody>';
    g.items.forEach(function(d){
      h+='<tr><td>'+d.date+'</td><td>'+d.orderId+'</td><td>'+d.product+'</td><td>'+d.model+'</td><td style="text-align:center;">'+d.qty+'</td><td style="text-align:right;">'+fmt(d.lineTotal)+'</td><td style="text-align:right;">'+d.rate+'%</td><td style="text-align:right;font-weight:600;color:var(--green);">'+fmt(d.earned)+'</td></tr>';
    });
    h+='<tr style="font-weight:700;background:var(--bg3);"><td colspan="5">Total</td><td style="text-align:right;">'+fmt(g.total)+'</td><td></td><td style="text-align:right;color:var(--green);">'+fmt(g.earned)+'</td></tr>';
    h+='</tbody></table></div>';
  });

  // Grand total
  var grandTotal=data.reduce(function(s,d){return s+d.earned;},0);
  h+='<div style="text-align:right;font-size:15px;font-weight:700;margin-top:8px;">Grand Total Commission: <span style="color:var(--green);">'+fmt(grandTotal)+'</span></div>';
  wrap.innerHTML=h;
}

function exportCommReportCSV(){
  var monthEl=document.getElementById('comm-report-month');
  if(!monthEl.value)return;
  var data=getCommReportData(monthEl.value);
  if(!data.length){toast('No data to export','error');return;}
  var csv='Salesperson,Date,Order,Product,Model,Qty,Sale Price,Commission Rate %,Commission Earned\n';
  data.forEach(function(d){
    csv+='"'+d.clerk+'","'+d.date+'","'+d.orderId+'","'+d.product+'","'+d.model+'",'+d.qty+','+d.lineTotal.toFixed(2)+','+d.rate+','+d.earned.toFixed(2)+'\n';
  });
  var blob=new Blob([csv],{type:'text/csv'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='commission-report-'+monthEl.value+'.csv';a.click();
  toast('CSV exported','success');
}

function exportCommReportPDF(){
  var monthEl=document.getElementById('comm-report-month');
  if(!monthEl.value)return;
  var data=getCommReportData(monthEl.value);
  if(!data.length){toast('No data to export','error');return;}
  var monthLabel=new Date(monthEl.value+'-15').toLocaleDateString('en-US',{month:'long',year:'numeric'});

  // Group by clerk
  var grouped={};
  data.forEach(function(d){if(!grouped[d.clerk])grouped[d.clerk]={items:[],total:0,earned:0};grouped[d.clerk].items.push(d);grouped[d.clerk].total+=d.lineTotal;grouped[d.clerk].earned+=d.earned;});

  var win=window.open('','_blank');
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Commission Report</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:16px;}.hdr{display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:14px;}.hdr h1{font-size:16px;}.clerk{margin-bottom:16px;border:1px solid #ddd;border-radius:6px;overflow:hidden;}.clerk-hdr{background:#f5f5f5;padding:8px 12px;display:flex;justify-content:space-between;font-weight:700;border-bottom:1px solid #ddd;}table{width:100%;border-collapse:collapse;}th{background:#222;color:#fff;font-size:10px;padding:5px 8px;text-align:left;font-weight:700;}td{padding:6px 8px;border-bottom:1px solid #eee;font-size:11px;}tr.total td{font-weight:700;background:#f5f5f5;}.grand{text-align:right;font-size:15px;font-weight:700;margin-top:12px;}@media print{@page{margin:10mm;size:letter;}}</style></head><body>';
  html+='<div class="hdr" style="text-align:center;flex-direction:column;"><img src="'+DC_APPLIANCE_LOGO+'" style="max-width:180px;height:auto;margin:0 auto 8px;" alt="DC Appliance"/><h1>DC Appliance — Commission Report</h1><div style="font-size:11px;color:#666;">'+monthLabel+'</div><div style="font-size:10px;color:#666;margin-top:4px;">(620) 371-6417 · Dodge City, KS</div></div>';

  Object.keys(grouped).sort().forEach(function(clerk){
    var g=grouped[clerk];
    html+='<div class="clerk"><div class="clerk-hdr"><span>'+clerk+'</span><span style="color:#16a34a;">Commission: $'+g.earned.toFixed(2)+'</span></div>';
    html+='<table><thead><tr><th>Date</th><th>Order</th><th>Product</th><th>Model</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Sale</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Earned</th></tr></thead><tbody>';
    g.items.forEach(function(d){html+='<tr><td>'+d.date+'</td><td>'+d.orderId+'</td><td>'+d.product+'</td><td>'+d.model+'</td><td style="text-align:center;">'+d.qty+'</td><td style="text-align:right;">$'+d.lineTotal.toFixed(2)+'</td><td style="text-align:right;">'+d.rate+'%</td><td style="text-align:right;">$'+d.earned.toFixed(2)+'</td></tr>';});
    html+='<tr class="total"><td colspan="5">Total</td><td style="text-align:right;">$'+g.total.toFixed(2)+'</td><td></td><td style="text-align:right;">$'+g.earned.toFixed(2)+'</td></tr>';
    html+='</tbody></table></div>';
  });

  var grandTotal=data.reduce(function(s,d){return s+d.earned;},0);
  html+='<div class="grand">Grand Total: $'+grandTotal.toFixed(2)+'</div>';
  html+='</body></html>';
  win.document.write(html);win.document.close();
  setTimeout(function(){win.print();},400);
}

// ═══ VENDOR MANAGEMENT ═══
function saveVendors(){apiFetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'admin-vendors',data:adminVendors})});}

function renderVendors(){
  var wrap=document.getElementById('admin-vendors-list');
  if(!adminVendors.length){wrap.innerHTML='<div class="admin-empty">No vendors added yet.</div>';return;}
  var h='<table class="admin-table"><thead><tr><th>Name</th><th>Rep</th><th>Phone</th><th>Email</th><th>Account #</th><th>Terms</th><th style="width:120px;"></th></tr></thead><tbody>';
  adminVendors.forEach(function(v,i){
    h+='<tr><td style="font-weight:600;">'+v.name+'</td><td>'+(v.repName||'—')+'</td><td>'+(v.phone||'—')+'</td><td>'+(v.email||'—')+'</td><td>'+(v.accountNum||'—')+'</td><td>'+(v.paymentTerms||'—')+'</td><td><button class="admin-card-btn edit" onclick="vendorEdit('+i+')">Edit</button><button class="admin-card-btn delete" onclick="vendorDelete('+i+')">Del</button></td></tr>';
  });
  h+='</tbody></table>';wrap.innerHTML=h;
}

function vendorAdd(){
  var name=prompt('Vendor name:');if(!name)return;
  var rep=prompt('Rep name:','')||'';
  var phone=prompt('Phone:','')||'';
  var email=prompt('Email:','')||'';
  var acct=prompt('Account number:','')||'';
  var terms=prompt('Payment terms (Net 30, COD, etc):','Net 30')||'';
  adminVendors.push({name:name.trim(),repName:rep.trim(),phone:phone.trim(),email:email.trim(),accountNum:acct.trim(),paymentTerms:terms.trim()});
  saveVendors();renderVendors();toast('Vendor added','success');
}

function vendorEdit(i){
  var v=adminVendors[i];if(!v)return;
  var name=prompt('Vendor name:',v.name);if(!name)return;
  v.name=name.trim();
  v.repName=(prompt('Rep name:',v.repName||'')||'').trim();
  v.phone=(prompt('Phone:',v.phone||'')||'').trim();
  v.email=(prompt('Email:',v.email||'')||'').trim();
  v.accountNum=(prompt('Account number:',v.accountNum||'')||'').trim();
  v.paymentTerms=(prompt('Payment terms:',v.paymentTerms||'')||'').trim();
  saveVendors();renderVendors();toast('Vendor updated','success');
}

function vendorDelete(i){
  if(!confirm('Delete vendor "'+adminVendors[i].name+'"?'))return;
  adminVendors.splice(i,1);saveVendors();renderVendors();toast('Vendor deleted','info');
}

// ═══ MERGE TOOL ═══
var _mtCat='brands';
var _mtGroups=[];
var mergeHistory=[];
var mtIgnored={}; // category -> array of groupKey strings

async function loadMergeData(){
  try{var r=await apiFetch('/api/admin-get?key=merge-history');var d=await r.json();if(d&&d.data)mergeHistory=d.data.history||[];if(d&&d.data&&d.data.ignored)mtIgnored=d.data.ignored||{};}catch(e){}
}
async function saveMergeData(){
  try{await apiFetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'merge-history',data:{history:mergeHistory,ignored:mtIgnored}})});}catch(e){}
}

function mtNormalize(s){return (s||'').toString().toLowerCase().replace(/[\s\-_.,]+/g,'').trim();}
function mtLevenshtein(a,b){if(!a||!b)return 99;var m=[];for(var i=0;i<=b.length;i++)m[i]=[i];for(var j=0;j<=a.length;j++)m[0][j]=j;for(i=1;i<=b.length;i++){for(j=1;j<=a.length;j++){if(b.charAt(i-1)===a.charAt(j-1))m[i][j]=m[i-1][j-1];else m[i][j]=Math.min(m[i-1][j-1]+1,m[i][j-1]+1,m[i-1][j]+1);}}return m[b.length][a.length];}
function mtSimilar(a,b){var na=mtNormalize(a),nb=mtNormalize(b);if(!na||!nb)return false;if(na===nb)return true;var dist=mtLevenshtein(na,nb);var maxLen=Math.max(na.length,nb.length);return dist<=2||(maxLen>5&&dist/maxLen<=0.25);}

function renderMergeTool(){
  loadMergeData().then(function(){mtSwitchCat(_mtCat||'brands');});
}

function mtSwitchCat(cat){
  _mtCat=cat;
  document.querySelectorAll('[data-mt-cat]').forEach(function(b){b.classList.toggle('active',b.dataset.mtCat===cat);});
  var tb=document.getElementById('mt-toolbar');
  var exp=document.getElementById('mt-export-history');
  if(cat==='history'){if(tb)tb.querySelectorAll('.primary-btn,.ghost-btn:not(#mt-export-history)').forEach(function(b){b.style.display='none';});if(exp)exp.style.display='';mtRenderHistory();}
  else{if(tb)tb.querySelectorAll('.primary-btn,.ghost-btn').forEach(function(b){b.style.display=b.id==='mt-export-history'?'none':'';});_mtGroups=[];document.getElementById('mt-content').innerHTML='<div class="admin-empty" style="padding:30px;">Click "Scan for Duplicates" to find matching '+cat+'.</div>';}
}

function mtGetRecords(cat){
  if(cat==='brands')return adminBrands.map(function(b,i){return{id:i,key:b,name:b,_refs:PRODUCTS.filter(function(p){return (p.brand||'').toLowerCase()===b.toLowerCase();}).length};});
  if(cat==='contacts')return (typeof customers!=='undefined'?customers:[]).map(function(c,i){return{id:i,key:c.name,name:c.name,phone:c.phone||'',email:c.email||'',address:c.address||'',_refs:orders.filter(function(o){return o.customer===c.name;}).length};});
  if(cat==='departments'){var depts=(typeof DEPARTMENTS!=='undefined'?DEPARTMENTS:[]);return depts.map(function(d,i){return{id:i,key:d.name,name:d.name,_refs:PRODUCTS.filter(function(p){return (d.cats||[]).indexOf(p.cat)>=0;}).length};});}
  if(cat==='vendors')return (adminVendors||[]).map(function(v,i){return{id:i,key:v.name,name:v.name,phone:v.phone||'',email:v.email||'',accountNum:v.accountNum||'',_refs:PRODUCTS.filter(function(p){return (p.vendor||'').toLowerCase()===(v.name||'').toLowerCase();}).length};});
  if(cat==='skus')return PRODUCTS.map(function(p,i){return{id:p.id,key:p.sku||p.model||'',name:p.sku||p.model||'','product':p.name,'brand':p.brand||'',_refs:0};}).filter(function(r){return r.key;});
  if(cat==='models')return PRODUCTS.map(function(p,i){return{id:p.id,key:p.model||p.sku||'',name:p.model||p.sku||'','product':p.name,'brand':p.brand||'',_refs:0};}).filter(function(r){return r.key;});
  return[];
}

function mtScanDuplicates(){
  if(_mtCat==='history')return;
  var records=mtGetRecords(_mtCat);
  var groups=[];
  var assigned={};
  for(var i=0;i<records.length;i++){
    if(assigned[i])continue;
    var group=[records[i]];
    for(var j=i+1;j<records.length;j++){
      if(assigned[j])continue;
      var isDup=mtSimilar(records[i].key,records[j].key);
      // Extra matchers for contacts/vendors
      if(!isDup&&_mtCat==='contacts'){
        if(records[i].phone&&records[i].phone===records[j].phone)isDup=true;
        else if(records[i].email&&records[i].email.toLowerCase()===(records[j].email||'').toLowerCase())isDup=true;
      }
      if(!isDup&&_mtCat==='vendors'){
        if(records[i].phone&&records[i].phone===records[j].phone)isDup=true;
        else if(records[i].email&&records[i].email.toLowerCase()===(records[j].email||'').toLowerCase())isDup=true;
      }
      if(isDup){group.push(records[j]);assigned[j]=true;}
    }
    if(group.length>1){assigned[i]=true;groups.push(group);}
  }
  // Filter out ignored groups
  var ignoredList=mtIgnored[_mtCat]||[];
  groups=groups.filter(function(g){var k=g.map(function(r){return r.key;}).sort().join('|');return ignoredList.indexOf(k)<0;});
  _mtGroups=groups;
  if(!groups.length){document.getElementById('mt-content').innerHTML='<div class="admin-empty" style="padding:30px;color:var(--green);">&#x2713; No duplicates found in '+_mtCat+'.</div>';return;}
  mtRenderGroups();
}

function mtRenderGroups(){
  var el=document.getElementById('mt-content');
  var h='<div style="font-size:12px;font-weight:600;margin-bottom:10px;">Found '+_mtGroups.length+' duplicate set'+(_mtGroups.length===1?'':'s')+':</div>';
  _mtGroups.forEach(function(group,gi){
    h+='<div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px;background:var(--bg3);">';
    h+='<div style="font-size:11px;font-weight:700;color:var(--gray-2);text-transform:uppercase;margin-bottom:8px;">Duplicate Set #'+(gi+1)+'</div>';
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">';
    group.forEach(function(rec,ri){
      var checked=ri===0?'checked':'';
      h+='<label style="flex:1;min-width:180px;background:#fff;border:1px solid var(--border);border-radius:6px;padding:8px 10px;cursor:pointer;">';
      h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><input type="radio" name="mt-master-'+gi+'" value="'+ri+'" '+checked+' style="accent-color:var(--gold,#2563eb);"/><strong style="font-size:12px;">'+rec.name+'</strong></div>';
      if(rec.phone)h+='<div style="font-size:10px;color:var(--gray-2);">'+rec.phone+'</div>';
      if(rec.email)h+='<div style="font-size:10px;color:var(--gray-2);">'+rec.email+'</div>';
      if(rec.product)h+='<div style="font-size:10px;color:var(--gray-2);">'+rec.product+(rec.brand?' ('+rec.brand+')':'')+'</div>';
      if(rec.accountNum)h+='<div style="font-size:10px;color:var(--gray-2);">Acct: '+rec.accountNum+'</div>';
      h+='<div style="font-size:10px;color:var(--blue);margin-top:4px;font-weight:600;">'+rec._refs+' refs</div>';
      h+='</label>';
    });
    h+='</div>';
    h+='<div style="display:flex;gap:6px;"><button class="primary-btn" onclick="mtMergeGroup('+gi+')">Merge</button><button class="ghost-btn" onclick="mtSkipGroup('+gi+')">Skip</button><button class="ghost-btn" style="border-color:#fca5a5;color:#dc2626;" onclick="mtNotDuplicate('+gi+')">Not a Duplicate</button></div>';
    h+='</div>';
  });
  el.innerHTML=h;
}

function mtSkipGroup(gi){_mtGroups.splice(gi,1);mtRenderGroups();if(!_mtGroups.length)document.getElementById('mt-content').innerHTML='<div class="admin-empty" style="padding:30px;">All groups handled.</div>';}

function mtNotDuplicate(gi){
  var group=_mtGroups[gi];if(!group)return;
  var key=group.map(function(r){return r.key;}).sort().join('|');
  if(!mtIgnored[_mtCat])mtIgnored[_mtCat]=[];
  mtIgnored[_mtCat].push(key);
  saveMergeData();mtSkipGroup(gi);
  toast('Group marked as not a duplicate','info');
}

async function mtMergeGroup(gi){
  var group=_mtGroups[gi];if(!group)return;
  var masterIdx=parseInt((document.querySelector('input[name="mt-master-'+gi+'"]:checked')||{}).value||0);
  var master=group[masterIdx];
  var losers=group.filter(function(_,i){return i!==masterIdx;});
  if(!confirm('This will merge '+losers.length+' record'+(losers.length===1?'':'s')+' into "'+master.name+'". This cannot be undone. Continue?'))return;
  await mtExecuteMerge(_mtCat,master,losers);
  // Log
  mergeHistory.unshift({ts:new Date().toISOString(),by:currentEmployee?currentEmployee.name:'Admin',category:_mtCat,kept:master.name,merged:losers.map(function(l){return l.name;})});
  await saveMergeData();
  _mtGroups.splice(gi,1);
  mtRenderGroups();
  if(!_mtGroups.length)document.getElementById('mt-content').innerHTML='<div class="admin-empty" style="padding:30px;color:var(--green);">&#x2713; All duplicates merged.</div>';
  toast('Merged '+losers.length+' record'+(losers.length===1?'':'s')+' into '+master.name,'success');
}

async function mtExecuteMerge(cat,master,losers){
  var loserKeys=losers.map(function(l){return l.key;});
  var loserIds=losers.map(function(l){return l.id;});
  if(cat==='brands'){
    // Update products
    PRODUCTS.forEach(function(p){if(loserKeys.some(function(k){return mtNormalize(p.brand)===mtNormalize(k);}))p.brand=master.name;});
    adminBrands=adminBrands.filter(function(b){return !loserKeys.some(function(k){return mtNormalize(b)===mtNormalize(k);});});
    await saveProducts();await apiFetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'admin-brands',data:adminBrands})});
  }else if(cat==='contacts'){
    // Update customer records and orders
    var masterCust=customers.find(function(c){return c.name===master.key;});
    orders.forEach(function(o){if(loserKeys.indexOf(o.customer)>=0)o.customer=master.name;});
    losers.forEach(function(l){
      var lc=customers.find(function(c){return c.name===l.key;});
      if(lc&&masterCust){
        // Merge payments, adjustments, refunds, notes
        if(lc.payments)masterCust.payments=(masterCust.payments||[]).concat(lc.payments);
        if(lc.adjustments)masterCust.adjustments=(masterCust.adjustments||[]).concat(lc.adjustments);
        if(lc.refunds)masterCust.refunds=(masterCust.refunds||[]).concat(lc.refunds);
        if(lc.ledgerNotes)masterCust.ledgerNotes=(masterCust.ledgerNotes||[]).concat(lc.ledgerNotes);
        if(lc.contacts)masterCust.contacts=(masterCust.contacts||[]).concat(lc.contacts);
        // Fill missing fields from loser
        ['phone','cell','fax','email','address','city','state','zip','arNum'].forEach(function(f){if(!masterCust[f]&&lc[f])masterCust[f]=lc[f];});
      }
    });
    customers=customers.filter(function(c){return loserKeys.indexOf(c.name)<0;});
    await saveCustomers();await saveOrders();
  }else if(cat==='vendors'){
    // Update products + remove losers from adminVendors
    PRODUCTS.forEach(function(p){if(loserKeys.some(function(k){return mtNormalize(p.vendor)===mtNormalize(k);}))p.vendor=master.name;});
    adminVendors=adminVendors.filter(function(v){return !loserKeys.some(function(k){return mtNormalize(v.name)===mtNormalize(k);});});
    await saveProducts();saveVendors();
  }else if(cat==='departments'){
    // Reassign dept cats
    if(typeof DEPARTMENTS!=='undefined'){
      var masterDept=DEPARTMENTS.find(function(d){return d.name===master.name;});
      if(masterDept){losers.forEach(function(l){var ld=DEPARTMENTS.find(function(d){return d.name===l.key;});if(ld){ld.cats.forEach(function(c){if(masterDept.cats.indexOf(c)<0)masterDept.cats.push(c);});}});
      // Remove losers
      for(var i=DEPARTMENTS.length-1;i>=0;i--){if(loserKeys.indexOf(DEPARTMENTS[i].name)>=0)DEPARTMENTS.splice(i,1);}}
    }
  }else if(cat==='skus'||cat==='models'){
    // Merge product records — keep master, migrate loser product IDs to master
    var masterProduct=PRODUCTS.find(function(p){return p.id===master.id;});
    losers.forEach(function(l){
      var loserProd=PRODUCTS.find(function(p){return p.id===l.id;});
      if(loserProd&&masterProduct){
        // Combine stock + sold
        masterProduct.stock=(masterProduct.stock||0)+(loserProd.stock||0);
        masterProduct.sold=(masterProduct.sold||0)+(loserProd.sold||0);
        // Update orders + POs referencing loser product id
        orders.forEach(function(o){(o.items||[]).forEach(function(it){if(it.id===l.id)it.id=master.id;});});
        (typeof purchaseOrders!=='undefined'?purchaseOrders:[]).forEach(function(po){(po.items||[]).forEach(function(it){if(it.productId===l.id)it.productId=master.id;});});
      }
    });
    PRODUCTS=PRODUCTS.filter(function(p){return loserIds.indexOf(p.id)<0;});
    await saveProducts();await saveOrders();
    if(typeof savePOs==='function')savePOs();
  }
}

function mtManualMerge(){
  if(_mtCat==='history')return;
  var records=mtGetRecords(_mtCat);
  if(records.length<2){toast('Not enough records to merge','error');return;}
  var opts=records.map(function(r,i){return (i+1)+'. '+r.name+(r.phone?' ('+r.phone+')':'')+(r.brand?' ['+r.brand+']':'')+' — '+r._refs+' refs';}).slice(0,50).join('\n');
  var sel=prompt('Enter the numbers of 2+ records to merge (comma-separated):\n\n'+opts+(records.length>50?'\n...and '+(records.length-50)+' more':''),'1,2');
  if(!sel)return;
  var nums=sel.split(',').map(function(s){return parseInt(s.trim())-1;}).filter(function(n){return n>=0&&n<records.length;});
  if(nums.length<2){toast('Select at least 2 records','error');return;}
  var group=nums.map(function(n){return records[n];});
  _mtGroups=[group];
  mtRenderGroups();
}

function mtRenderHistory(){
  var el=document.getElementById('mt-content');
  if(!mergeHistory.length){el.innerHTML='<div class="admin-empty" style="padding:30px;">No merges yet.</div>';return;}
  var h='<table class="admin-table" style="font-size:11px;"><thead><tr><th>Date</th><th>Employee</th><th>Category</th><th>Kept</th><th>Merged</th></tr></thead><tbody>';
  mergeHistory.forEach(function(m){
    h+='<tr><td>'+new Date(m.ts).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'})+'</td><td>'+m.by+'</td><td style="text-transform:capitalize;">'+m.category+'</td><td style="font-weight:600;">'+m.kept+'</td><td style="font-size:10px;color:var(--gray-2);">'+(m.merged||[]).join(', ')+'</td></tr>';
  });
  h+='</tbody></table>';
  el.innerHTML=h;
}

function mtExportHistoryCSV(){
  if(!mergeHistory.length){toast('No history to export','error');return;}
  var csv='Date,Employee,Category,Kept,Merged\n';
  mergeHistory.forEach(function(m){csv+='"'+new Date(m.ts).toISOString()+'","'+m.by+'","'+m.category+'","'+m.kept+'","'+(m.merged||[]).join('; ')+'"\n';});
  var blob=new Blob([csv],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='merge-history.csv';a.click();
  toast('CSV exported','success');
}

// ═══ RECEIVE INVENTORY ═══
function renderReceiveInv(){
  var wrap=document.getElementById('recv-inv-content');
  wrap.innerHTML='<div style="margin-bottom:16px;">'
    +'<div style="border:2px dashed var(--border);border-radius:10px;padding:24px;text-align:center;background:var(--bg3);cursor:pointer;position:relative;" id="recv-dz" ondragover="event.preventDefault();this.style.borderColor=\'var(--gold)\'" ondragleave="this.style.borderColor=\'var(--border)\'" ondrop="recvHandleDrop(event)">'
    +'<input type="file" accept=".pdf,.csv,.xlsx,.xls,image/*" style="position:absolute;inset:0;opacity:0;cursor:pointer;" onchange="recvHandleFile(this.files[0])"/>'
    +'<div style="font-size:24px;opacity:0.3;margin-bottom:6px;">&#x1F4E6;</div>'
    +'<div style="font-size:13px;font-weight:600;color:var(--gold);">Drop vendor invoice here</div>'
    +'<div style="font-size:11px;color:var(--gray-3);margin-top:4px;">PDF, image, CSV, or Excel — AI will extract products and serial numbers</div>'
    +'</div>'
    +'<div id="recv-loading" style="display:none;text-align:center;padding:20px;font-size:13px;color:var(--gold);font-weight:600;"><div class="bs-spinner" style="display:inline-block;width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--gold);border-radius:50%;animation:spin 0.6s linear infinite;margin-right:8px;vertical-align:middle;"></div>Reading invoice with AI...</div>'
    +'</div>'
    +'<div id="recv-preview" style="display:none;"></div>';
}

function recvHandleDrop(e){e.preventDefault();document.getElementById('recv-dz').style.borderColor='var(--border)';if(e.dataTransfer.files.length)recvHandleFile(e.dataTransfer.files[0]);}

async function recvHandleFile(file){
  if(!file)return;
  document.getElementById('recv-loading').style.display='block';
  try{
    var b64=await new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result.split(',')[1]);};r.onerror=rej;r.readAsDataURL(file);});
    var contentType=file.type==='application/pdf'?'document':'image';
    if(file.name.match(/\.(csv|xlsx|xls)$/i))contentType='document';
    var msgs=[{role:'user',content:[{type:contentType,source:{type:'base64',media_type:file.type||'application/octet-stream',data:b64}},{type:'text',text:'Extract all items from this vendor invoice/packing list. Return JSON only: {"vendor":"Vendor Name","items":[{"model":"MODEL#","description":"Product Name","qty":1,"cost":0,"serials":["SN1","SN2"]}]}. Include ALL serial numbers found. JSON only, no explanation.'}]}];
    var data=await claudeApiCall({messages:msgs,max_tokens:2000});
    var parsed=JSON.parse(data.content[0].text.match(/\{[\s\S]*\}/)[0]);
    recvShowPreview(parsed);
  }catch(e){toast('Could not read invoice: '+e.message,'error');console.error(e);}
  document.getElementById('recv-loading').style.display='none';
}

var _recvParsed=null;
function recvShowPreview(parsed){
  _recvParsed=parsed;
  var wrap=document.getElementById('recv-preview');
  var h='<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-top:12px;">';
  h+='<div style="background:var(--bg3);padding:10px 14px;font-weight:700;border-bottom:1px solid var(--border);">Vendor: '+(parsed.vendor||'Unknown')+' — '+parsed.items.length+' items</div>';
  h+='<table class="admin-table" style="margin:0;"><thead><tr><th>Model</th><th>Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Cost</th><th>Serial Numbers</th></tr></thead><tbody>';
  parsed.items.forEach(function(it,i){
    var snList=(it.serials||[]).join(', ')||'None';
    h+='<tr><td><input class="inp" id="recv-model-'+i+'" value="'+(it.model||'')+'" style="font-size:11px;padding:4px 6px;"/></td><td><input class="inp" id="recv-desc-'+i+'" value="'+(it.description||'')+'" style="font-size:11px;padding:4px 6px;"/></td><td style="text-align:center;"><input class="inp" id="recv-qty-'+i+'" value="'+(it.qty||1)+'" type="number" style="font-size:11px;padding:4px 6px;width:50px;text-align:center;"/></td><td style="text-align:right;"><input class="inp" id="recv-cost-'+i+'" value="'+(it.cost||0)+'" type="number" step="0.01" style="font-size:11px;padding:4px 6px;width:80px;text-align:right;"/></td><td><input class="inp" id="recv-sn-'+i+'" value="'+snList+'" style="font-size:10px;padding:4px 6px;" placeholder="Comma-separated SNs"/></td></tr>';
  });
  h+='</tbody></table></div>';
  h+='<div style="margin-top:12px;display:flex;gap:8px;"><button class="primary-btn" onclick="recvConfirm()">Confirm &amp; Add to Inventory</button><button class="ghost-btn" onclick="recvCancel()">Cancel</button></div>';
  wrap.innerHTML=h;wrap.style.display='block';
}

function recvCancel(){_recvParsed=null;document.getElementById('recv-preview').style.display='none';document.getElementById('recv-preview').innerHTML='';}

function recvConfirm(){
  if(!_recvParsed)return;
  var added=0,updated=0;
  _recvParsed.items.forEach(function(it,i){
    var model=(document.getElementById('recv-model-'+i)||{}).value||it.model||'';
    var desc=(document.getElementById('recv-desc-'+i)||{}).value||it.description||'';
    var qty=parseInt((document.getElementById('recv-qty-'+i)||{}).value)||it.qty||1;
    var cost=parseFloat((document.getElementById('recv-cost-'+i)||{}).value)||it.cost||0;
    var snStr=(document.getElementById('recv-sn-'+i)||{}).value||'';
    var serials=snStr?snStr.split(',').map(function(s){return s.trim();}).filter(Boolean):[];

    // Find matching product by model
    var p=PRODUCTS.find(function(x){return (x.model||'').toLowerCase()===model.toLowerCase()||(x.sku||'').toLowerCase()===model.toLowerCase();});
    if(p){
      p.stock=(p.stock||0)+qty;
      if(cost)p.cost=cost;
      if(!p.serialPool)p.serialPool=[];
      serials.forEach(function(sn){p.serialPool.push({sn:sn,status:'Available',receivedAt:new Date().toISOString(),vendor:_recvParsed.vendor||''});});
      updated++;
    }else{
      var newP={id:PRODUCTS.length+100+i,model:model,sku:model,name:desc,brand:'',cat:'',price:0,cost:cost,stock:qty,sold:0,reorderPt:2,reorderQty:3,sales30:0,serial:'',warranty:'1 Year',icon:'&#x1F4E6;',serialTracked:true,vendor:_recvParsed.vendor||'',serialPool:[]};
      serials.forEach(function(sn){newP.serialPool.push({sn:sn,status:'Available',receivedAt:new Date().toISOString(),vendor:_recvParsed.vendor||''});});
      PRODUCTS.push(newP);added++;
    }
  });
  saveProducts();recvCancel();renderReceiveInv();
  toast(updated+' products updated, '+added+' new products added','success');
}

// ═══ DATA IMPORT ═══
function renderDataImport(){
  var wrap=document.getElementById('data-import-content');
  wrap.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">'
    // Inventory import
    +'<div style="border:1px solid var(--border);border-radius:8px;padding:16px;">'
    +'<div style="font-size:14px;font-weight:700;margin-bottom:8px;">Inventory Import</div>'
    +'<div style="font-size:11px;color:var(--gray-2);margin-bottom:12px;">CSV/Excel with columns: Model, Name, Brand, Category, Cost, Price, Vendor, Serial Tracked, Qty</div>'
    +'<div style="border:2px dashed var(--border);border-radius:8px;padding:16px;text-align:center;cursor:pointer;position:relative;background:var(--bg3);">'
    +'<input type="file" accept=".csv,.xlsx,.xls" style="position:absolute;inset:0;opacity:0;cursor:pointer;" onchange="diHandleInvFile(this.files[0])"/>'
    +'<div style="font-size:12px;font-weight:600;color:var(--gold);">Drop inventory file or click to browse</div></div>'
    +'<div id="di-inv-preview" style="display:none;margin-top:12px;"></div></div>'
    // Customer import
    +'<div style="border:1px solid var(--border);border-radius:8px;padding:16px;">'
    +'<div style="font-size:14px;font-weight:700;margin-bottom:8px;">Customer Import</div>'
    +'<div style="font-size:11px;color:var(--gray-2);margin-bottom:12px;">CSV/Excel with columns: Name, Phone, Email, Address, City, State, Zip</div>'
    +'<div style="border:2px dashed var(--border);border-radius:8px;padding:16px;text-align:center;cursor:pointer;position:relative;background:var(--bg3);">'
    +'<input type="file" accept=".csv,.xlsx,.xls" style="position:absolute;inset:0;opacity:0;cursor:pointer;" onchange="diHandleCustFile(this.files[0])"/>'
    +'<div style="font-size:12px;font-weight:600;color:var(--gold);">Drop customer file or click to browse</div></div>'
    +'<div id="di-cust-preview" style="display:none;margin-top:12px;"></div></div>'
    +'</div>'
    // Sales History Import (full width)
    +'<div style="border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:16px;">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:10px;">'
    +'<div><div style="font-size:14px;font-weight:700;">Sales History Import</div><div style="font-size:11px;color:var(--gray-2);">Import historical sales from SmartTouch POS Sales Journal (PDF) or CSV</div></div>'
    +'<button class="ghost-btn" onclick="diShowImportHistory()" style="font-size:11px;">View Import History</button>'
    +'</div>'
    +'<div style="border:2px dashed var(--gold,#c9973a);border-radius:10px;padding:24px 20px;text-align:center;cursor:pointer;position:relative;background:#fffbeb;">'
    +'<input type="file" accept=".pdf,.csv" style="position:absolute;inset:0;opacity:0;cursor:pointer;" onchange="diHandleSalesFile(this.files[0])"/>'
    +'<div style="font-size:32px;margin-bottom:6px;">&#x1F4D2;</div>'
    +'<div style="font-size:14px;font-weight:700;color:var(--gold-d,#9e7228);">Drop Sales Journal PDF or CSV to Import Sales History</div>'
    +'<div style="font-size:11px;color:var(--gray-2);margin-top:4px;">AI reads the SmartTouch format and imports invoices, customers, line items, and serial numbers</div>'
    +'<div id="di-sales-loading" style="display:none;margin-top:10px;font-size:12px;color:var(--gold-d,#9e7228);font-weight:600;"><span style="display:inline-block;width:14px;height:14px;border:2px solid #fef3c7;border-top-color:var(--gold,#c9973a);border-radius:50%;animation:spin 0.6s linear infinite;vertical-align:middle;margin-right:6px;"></span>Reading sales journal...</div>'
    +'</div>'
    +'<div id="di-sales-preview" style="display:none;margin-top:12px;"></div></div>'
    // Serial Number Import (full width)
    +'<div style="border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:16px;">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:10px;">'
    +'<div><div style="font-size:14px;font-weight:700;">Serial Number Import</div><div style="font-size:11px;color:var(--gray-2);">Import serials from SmartTouch spreadsheet (XLS/XLSX) or PDF report</div></div>'
    +'<button class="ghost-btn" onclick="diShowSerialImportHistory()" style="font-size:11px;">View Import History</button>'
    +'</div>'
    +'<div style="margin-bottom:10px;display:flex;gap:10px;align-items:center;">'
    +'<label style="font-size:11px;font-weight:700;color:var(--gray-2);">Brand Override:</label>'
    +'<select id="di-serial-brand" style="padding:5px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-family:inherit;background:#fff;"><option value="">(Auto-detect from filename)</option>'
    +(typeof adminBrands!=='undefined'?adminBrands.map(function(b){return '<option value="'+b+'">'+b+'</option>';}).join(''):'')
    +'</select>'
    +'</div>'
    +'<div style="border:2px dashed #bfdbfe;border-radius:10px;padding:24px 20px;text-align:center;cursor:pointer;position:relative;background:#eff6ff;">'
    +'<input type="file" accept=".xls,.xlsx,.csv,.pdf" style="position:absolute;inset:0;opacity:0;cursor:pointer;" onchange="diHandleSerialFile(this.files[0])"/>'
    +'<div style="font-size:32px;margin-bottom:6px;">&#x1F4CA;</div>'
    +'<div style="font-size:14px;font-weight:700;color:#1e40af;">Drop Serial Number Report to Import</div>'
    +'<div style="font-size:11px;color:var(--gray-2);margin-top:4px;">Accepts XLS, XLSX, CSV, or PDF. Extracts brand, models, serials, PO numbers, date received, and condition flags.</div>'
    +'<div id="di-serial-loading" style="display:none;margin-top:10px;font-size:12px;color:#2563eb;font-weight:600;"><span style="display:inline-block;width:14px;height:14px;border:2px solid #bfdbfe;border-top-color:#2563eb;border-radius:50%;animation:spin 0.6s linear infinite;vertical-align:middle;margin-right:6px;"></span>Reading serial report...</div>'
    +'</div>'
    +'<div id="di-serial-preview" style="display:none;margin-top:12px;"></div></div>'
    // Clear Data section
    +'<div style="border:2px solid #fca5a5;background:#fff1f1;border-radius:8px;padding:16px;">'
    +'<div style="font-size:14px;font-weight:700;margin-bottom:4px;color:#991b1b;">&#x26A0; Clear Data — Danger Zone</div>'
    +'<div style="font-size:11px;color:var(--gray-2);margin-bottom:14px;">Permanently delete data for Store #'+(typeof currentStoreId!=='undefined'?currentStoreId:1)+' ('+((typeof currentStore!=='undefined'&&currentStore&&currentStore.store_name)||'DC Appliance')+'). Other stores unaffected.</div>'
    +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">'
    +'<button class="ghost-btn" style="border-color:#fca5a5;color:#991b1b;padding:12px 8px;font-size:11px;font-weight:700;text-align:left;" onclick="clearDataStart(\'inventory\')">Clear Inventory<br/><span style="font-weight:400;font-size:10px;opacity:0.8;">Products + serial pools</span></button>'
    +'<button class="ghost-btn" style="border-color:#fca5a5;color:#991b1b;padding:12px 8px;font-size:11px;font-weight:700;text-align:left;" onclick="clearDataStart(\'sales\')">Clear Sales History<br/><span style="font-weight:400;font-size:10px;opacity:0.8;">All invoices + line items</span></button>'
    +'<button class="ghost-btn" style="border-color:#fca5a5;color:#991b1b;padding:12px 8px;font-size:11px;font-weight:700;text-align:left;" onclick="clearDataStart(\'customers\')">Clear Customers<br/><span style="font-weight:400;font-size:10px;opacity:0.8;">All customer records</span></button>'
    +'<button class="ghost-btn" style="border-color:#dc2626;color:#fff;background:#dc2626;padding:12px 8px;font-size:11px;font-weight:700;text-align:left;" onclick="clearDataStart(\'all\')">CLEAR ALL<br/><span style="font-weight:400;font-size:10px;opacity:0.9;">Inventory + Sales + Customers</span></button>'
    +'</div></div>';
}

var _diInvRows=[];
var _diInvHeaders=[];
var _diInvRawRows=[];
var _diInvMapping={};
var DI_INV_FIELDS=[
  {key:'model',label:'Model Number',req:true,aliases:['model','modelnumber','model number','model#','modelno','model no','item model']},
  {key:'name',label:'Description',req:true,aliases:['description','desc','name','product name','product','item description','item name','long description']},
  {key:'price',label:'Retail Price',req:true,aliases:['price','retailprice','retail price','retail','sell price','sellprice','msrp','list price','list']},
  {key:'upc',label:'UPC',req:false,aliases:['upc','barcode','gtin','upc code','upc#','ean']},
  {key:'brand',label:'Brand',req:false,aliases:['brand','manufacturer','mfg','mfr','maker']},
  {key:'cost',label:'Cost',req:false,aliases:['cost','wholesale','wholesale cost','unit cost','unitcost','our cost']},
  {key:'vendor',label:'Vendor',req:false,aliases:['vendor','supplier','distributor']},
  {key:'sku',label:'PLU / SKU',req:false,aliases:['sku','plu','item#','item number','itemnum','plu#']},
  {key:'cat',label:'Category',req:false,aliases:['category','cat','product category','type']},
  {key:'dept',label:'Department',req:false,aliases:['department','dept','dept.']},
  {key:'serialTracked',label:'Serial Tracked',req:false,aliases:['serial tracked','serialtracked','sn tracked','tracks serial','serialized','track serial']},
  {key:'reorderPt',label:'Min Quantity',req:false,aliases:['min qty','min quantity','min','reorder pt','reorder point','reorderpt','minimum','min stock']},
  {key:'reorderQty',label:'Reorder Quantity',req:false,aliases:['reorder qty','reorderqty','reorder quantity','order qty','reorder']},
  {key:'qty',label:'Qty / Stock',req:false,aliases:['qty','quantity','stock','stock qty','on hand','onhand','inventory','count']}
];

function loadInvMapping(){try{return JSON.parse(localStorage.getItem('di-inv-mapping')||'{}');}catch(e){return{};}}
function saveInvMapping(){try{localStorage.setItem('di-inv-mapping',JSON.stringify(_diInvMapping));}catch(e){}}

async function diHandleInvFile(file){
  if(!file)return;
  var isExcel=file.name.match(/\.(xlsx|xls)$/i);
  _diInvHeaders=[];_diInvRawRows=[];
  if(isExcel){
    if(!window.XLSX){toast('Excel library loading — try again','error');return;}
    var arrayBuffer=await file.arrayBuffer();
    var wb=window.XLSX.read(arrayBuffer,{type:'array'});
    var sheet=wb.Sheets[wb.SheetNames[0]];
    var rows=window.XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});
    if(!rows.length){toast('File is empty','error');return;}
    _diInvHeaders=rows[0].map(function(h){return String(h||'').trim();});
    for(var i=1;i<rows.length;i++){
      var r=rows[i];
      // Skip blank rows
      if(r.every(function(c){return !String(c||'').trim();}))continue;
      _diInvRawRows.push(r.map(function(c){return String(c==null?'':c).trim();}));
    }
  }else{
    var text=await file.text();
    var lines=text.split(/\r?\n/).filter(Boolean);
    if(lines.length<2){toast('File is empty','error');return;}
    // Simple CSV parser that handles quoted values with commas
    var parseCsvLine=function(line){
      var out=[],cur='',inQ=false;
      for(var c=0;c<line.length;c++){
        var ch=line[c];
        if(ch==='"'){if(inQ&&line[c+1]==='"'){cur+='"';c++;}else inQ=!inQ;}
        else if(ch===','&&!inQ){out.push(cur);cur='';}
        else cur+=ch;
      }
      out.push(cur);
      return out.map(function(x){return x.trim();});
    };
    _diInvHeaders=parseCsvLine(lines[0]);
    for(var i=1;i<lines.length;i++){
      var cols=parseCsvLine(lines[i]);
      _diInvRawRows.push(cols);
    }
  }
  // Build initial mapping: check saved prefs, then auto-detect by alias (case-insensitive + normalize)
  var normalize=function(s){return String(s||'').toLowerCase().replace(/[\s_\-#.]+/g,'');};
  var saved=loadInvMapping();
  _diInvMapping={};
  DI_INV_FIELDS.forEach(function(f){
    // Try saved mapping first
    if(saved[f.key]&&_diInvHeaders.indexOf(saved[f.key])>=0){_diInvMapping[f.key]=saved[f.key];return;}
    // Auto-detect by alias (normalized)
    var normalizedAliases=f.aliases.map(normalize);
    for(var i=0;i<_diInvHeaders.length;i++){
      var nh=normalize(_diInvHeaders[i]);
      if(normalizedAliases.indexOf(nh)>=0){_diInvMapping[f.key]=_diInvHeaders[i];return;}
    }
    _diInvMapping[f.key]='';
  });
  console.log('Auto-mapped columns:',_diInvMapping);
  showInvMappingScreen();
}

function showInvMappingScreen(){
  var h='<div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:14px;">';
  h+='<div style="font-size:12px;font-weight:700;margin-bottom:4px;">Step 1 — Map Your CSV Columns</div>';
  h+='<div style="font-size:11px;color:var(--gray-2);margin-bottom:12px;">Match your CSV columns to the system fields. Required fields marked with *. Your mapping is saved for next time.</div>';
  h+='<div style="max-height:320px;overflow:auto;">';
  h+='<table class="admin-table" style="font-size:11px;margin:0;"><thead><tr><th>System Field</th><th>Your CSV Column</th><th style="width:40%;">Sample Value</th></tr></thead><tbody>';
  DI_INV_FIELDS.forEach(function(f){
    var mapped=_diInvMapping[f.key]||'';
    var colIdx=mapped?_diInvHeaders.indexOf(mapped):-1;
    var sample=(colIdx>=0&&_diInvRawRows[0])?(_diInvRawRows[0][colIdx]||''):'';
    h+='<tr><td style="font-weight:600;">'+f.label+(f.req?' <span style="color:var(--red);">*</span>':'')+'</td>';
    h+='<td><select class="sel" onchange="_diInvMapping[\''+f.key+'\']=this.value;showInvMappingScreen();" style="font-size:11px;padding:4px 8px;">';
    h+='<option value="">— skip —</option>';
    _diInvHeaders.forEach(function(hdr){h+='<option value="'+hdr.replace(/"/g,'&quot;')+'"'+(mapped===hdr?' selected':'')+'>'+hdr+'</option>';});
    h+='</select></td>';
    h+='<td style="font-size:10px;color:var(--gray-3);font-family:monospace;">'+sample+'</td></tr>';
  });
  h+='</tbody></table></div>';
  // Validate required — show default value inputs for missing required fields
  var missingReq=DI_INV_FIELDS.filter(function(f){return f.req&&!_diInvMapping[f.key];});
  if(missingReq.length){
    h+='<div style="margin-top:12px;padding:12px 14px;background:#fffbeb;border-left:3px solid #eab308;border-radius:6px;">';
    h+='<div style="font-size:11px;font-weight:700;color:#713f12;margin-bottom:8px;">'+missingReq.length+' required field'+(missingReq.length>1?'s':'')+' not found in CSV — provide a default value or leave blank to flag as needing attention:</div>';
    missingReq.forEach(function(f){
      var defVal=window._diInvDefaults&&window._diInvDefaults[f.key]||'';
      var placeholder=f.key==='price'?'0.00 (flags as Needs Pricing)':f.key==='name'?'(use Model Number as fallback)':'Default value';
      var inputType=f.key==='price'?'number step="0.01"':'text';
      h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:11px;">';
      h+='<span style="font-weight:700;min-width:120px;color:#713f12;">'+f.label+':</span>';
      h+='<input type="'+inputType+'" value="'+defVal+'" oninput="window._diInvDefaults=window._diInvDefaults||{};window._diInvDefaults[\''+f.key+'\']=this.value;" placeholder="'+placeholder+'" style="flex:1;font-size:11px;padding:5px 8px;border:1px solid #fcd34d;border-radius:4px;"/>';
      h+='</div>';
    });
    h+='</div>';
  }
  h+='<div style="display:flex;gap:8px;margin-top:12px;">';
  h+='<button class="primary-btn" onclick="proceedToInvPreview()">Continue to Preview</button>';
  h+='<button class="ghost-btn" onclick="_diInvRawRows=[];_diInvHeaders=[];window._diInvDefaults={};document.getElementById(\'di-inv-preview\').style.display=\'none\';">Cancel</button>';
  h+='</div></div>';
  document.getElementById('di-inv-preview').innerHTML=h;
  document.getElementById('di-inv-preview').style.display='block';
}

function proceedToInvPreview(){
  saveInvMapping();
  var defaults=window._diInvDefaults||{};
  // Build rows using mapping
  _diInvRows=[];
  var newCount=0,updateCount=0,needsPricing=0;
  var newBrands={},newVendors={},newCats={},newDepts={};
  var matchedCats={},matchedDepts={};
  var existingBrands={};(adminBrands||[]).forEach(function(b){existingBrands[(b||'').toLowerCase()]=true;});
  var existingVendors={};(adminVendors||[]).forEach(function(v){if(v.name)existingVendors[v.name.toLowerCase()]=true;});
  var existingCats={};(adminCategories||[]).forEach(function(c){if(c&&c.name)existingCats[c.name.toLowerCase()]=true;});
  var existingDepts={};
  (typeof DEPARTMENTS!=='undefined'?DEPARTMENTS:[]).forEach(function(d){if(d&&d.name)existingDepts[d.name.toLowerCase()]=true;});
  (adminCategories||[]).forEach(function(c){if(c&&c.dept)existingDepts[c.dept.toLowerCase()]=true;});
  var errors=[];
  _diInvRawRows.forEach(function(cols,rowIdx){
    var getVal=function(key){
      var col=_diInvMapping[key];if(!col)return defaults[key]||'';
      var ci=_diInvHeaders.indexOf(col);if(ci<0)return defaults[key]||'';
      var v=(cols[ci]||'').trim();
      return v||defaults[key]||'';
    };
    var model=getVal('model');
    var name=getVal('name')||model; // fallback to model if no name
    var price=parseFloat(getVal('price'))||0;
    if(!model){errors.push('Row '+(rowIdx+2)+': missing model number');return;}
    var existing=PRODUCTS.find(function(p){return (p.model||'').toLowerCase()===model.toLowerCase()||(p.sku||'').toLowerCase()===model.toLowerCase();});
    // Only flag needsPricing if no valid new price AND no existing price will be preserved
    var existingPrice=existing?(existing.price||0):0;
    var flagNeedsPricing=price<=0&&existingPrice<=0;
    if(flagNeedsPricing)needsPricing++;
    var brand=getVal('brand');
    var vendor=getVal('vendor');
    var cat=getVal('cat');
    var dept=getVal('dept');
    if(brand&&!existingBrands[brand.toLowerCase()])newBrands[brand]=true;
    if(vendor&&!existingVendors[vendor.toLowerCase()])newVendors[vendor]=true;
    if(cat){if(existingCats[cat.toLowerCase()])matchedCats[cat]=true;else newCats[cat]=true;}
    if(dept){if(existingDepts[dept.toLowerCase()])matchedDepts[dept]=true;else newDepts[dept]=true;}
    _diInvRows.push({
      model:model,name:name,brand:brand,vendor:vendor,
      upc:getVal('upc'),cat:cat,dept:dept,sku:getVal('sku'),
      cost:parseFloat(getVal('cost'))||0,price:price,
      reorderPt:parseInt(getVal('reorderPt'))||null,
      reorderQty:parseInt(getVal('reorderQty'))||null,
      serialTracked:getVal('serialTracked'),qty:parseInt(getVal('qty'))||0,
      isUpdate:!!existing,needsPricing:flagNeedsPricing
    });
    if(existing)updateCount++;else newCount++;
  });
  // Build summary screen
  var newBrandList=Object.keys(newBrands);
  var newVendorList=Object.keys(newVendors);
  var newCatList=Object.keys(newCats);
  var newDeptList=Object.keys(newDepts);
  var matchedCatCount=Object.keys(matchedCats).length;
  var matchedDeptCount=Object.keys(matchedDepts).length;
  var h='<div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:14px;">';
  h+='<div style="font-size:12px;font-weight:700;margin-bottom:10px;">Step 2 — Review &amp; Confirm Import</div>';
  h+='<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:8px;">';
  h+='<div style="padding:10px 14px;background:#f0fdf4;border:1px solid #86efac;border-radius:6px;"><div style="font-size:9px;font-weight:700;color:#166534;text-transform:uppercase;">Products to Create</div><div style="font-size:20px;font-weight:800;color:#16a34a;">'+newCount+'</div></div>';
  h+='<div style="padding:10px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;"><div style="font-size:9px;font-weight:700;color:#1e40af;text-transform:uppercase;">Products to Update</div><div style="font-size:20px;font-weight:800;color:#2563eb;">'+updateCount+'</div></div>';
  h+='<div style="padding:10px 14px;background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;"><div style="font-size:9px;font-weight:700;color:#92400e;text-transform:uppercase;">New Brands</div><div style="font-size:20px;font-weight:800;color:#d97706;">'+newBrandList.length+'</div>'+(newBrandList.length?'<div style="font-size:10px;color:#92400e;margin-top:2px;">'+newBrandList.slice(0,5).join(', ')+(newBrandList.length>5?' +'+(newBrandList.length-5)+' more':'')+'</div>':'')+'</div>';
  h+='<div style="padding:10px 14px;background:#faf5ff;border:1px solid #c4b5fd;border-radius:6px;"><div style="font-size:9px;font-weight:700;color:#5b21b6;text-transform:uppercase;">New Vendors</div><div style="font-size:20px;font-weight:800;color:#7c3aed;">'+newVendorList.length+'</div>'+(newVendorList.length?'<div style="font-size:10px;color:#5b21b6;margin-top:2px;">'+newVendorList.slice(0,5).join(', ')+(newVendorList.length>5?' +'+(newVendorList.length-5)+' more':'')+' — add contact details later</div>':'')+'</div>';
  h+='<div style="padding:10px 14px;background:#ecfeff;border:1px solid #67e8f9;border-radius:6px;"><div style="font-size:9px;font-weight:700;color:#155e75;text-transform:uppercase;">New Categories</div><div style="font-size:20px;font-weight:800;color:#0891b2;">'+newCatList.length+'</div>'+(newCatList.length?'<div style="font-size:10px;color:#155e75;margin-top:2px;">'+newCatList.slice(0,5).join(', ')+(newCatList.length>5?' +'+(newCatList.length-5)+' more':'')+'</div>':'<div style="font-size:10px;color:#155e75;margin-top:2px;">'+matchedCatCount+' matched</div>')+'</div>';
  h+='<div style="padding:10px 14px;background:#f0f9ff;border:1px solid #7dd3fc;border-radius:6px;"><div style="font-size:9px;font-weight:700;color:#075985;text-transform:uppercase;">New Departments</div><div style="font-size:20px;font-weight:800;color:#0284c7;">'+newDeptList.length+'</div>'+(newDeptList.length?'<div style="font-size:10px;color:#075985;margin-top:2px;">'+newDeptList.slice(0,5).join(', ')+(newDeptList.length>5?' +'+(newDeptList.length-5)+' more':'')+'</div>':'<div style="font-size:10px;color:#075985;margin-top:2px;">'+matchedDeptCount+' matched</div>')+'</div>';
  h+='</div>';
  if(matchedCatCount||matchedDeptCount){
    h+='<div style="font-size:10px;color:var(--gray-2);margin-bottom:10px;">'+matchedCatCount+' categor'+(matchedCatCount===1?'y':'ies')+' matched, '+matchedDeptCount+' department'+(matchedDeptCount===1?'':'s')+' matched to existing records</div>';
  }
  if(errors.length){h+='<div style="padding:8px 12px;background:#fef2f2;border-left:3px solid #dc2626;border-radius:4px;margin-bottom:10px;font-size:11px;color:#991b1b;max-height:80px;overflow:auto;"><strong>'+errors.length+' row'+(errors.length===1?'':'s')+' will be skipped:</strong><br/>'+errors.slice(0,8).join('<br/>')+(errors.length>8?'<br/>... +'+(errors.length-8)+' more':'')+'</div>';}
  if(needsPricing){h+='<div style="padding:8px 12px;background:#fffbeb;border-left:3px solid #eab308;border-radius:4px;margin-bottom:10px;font-size:11px;color:#713f12;"><strong>'+needsPricing+' product'+(needsPricing===1?'':'s')+' will be flagged as Needs Pricing</strong> — no price in file. You can set prices later in Inventory.</div>';}
  h+='<div style="max-height:180px;overflow:auto;border:1px solid var(--border);border-radius:6px;margin-bottom:10px;"><table class="admin-table" style="font-size:10px;margin:0;"><thead><tr><th>Model</th><th>Name</th><th>Brand</th><th>Vendor</th><th style="text-align:right;">Price</th><th>Status</th></tr></thead><tbody>';
  _diInvRows.slice(0,15).forEach(function(r){
    // For existing products with no valid new price, show "Keeping existing price"
    var priceCell;
    if(r.isUpdate&&!(r.price>0)){
      priceCell='<span style="color:#9ca3af;font-style:italic;font-size:10px;">Keeping existing</span>';
    }else if(r.price>0){
      priceCell='$'+r.price.toFixed(2);
    }else{
      priceCell='<span style="color:#d97706;font-style:italic;font-size:10px;">Needs pricing</span>';
    }
    h+='<tr><td>'+r.model+'</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+r.name+'</td><td>'+r.brand+'</td><td>'+r.vendor+'</td><td style="text-align:right;">'+priceCell+'</td><td style="font-weight:700;color:'+(r.isUpdate?'#2563eb':'#16a34a')+';">'+(r.isUpdate?'Update':'New')+'</td></tr>';
  });
  if(_diInvRows.length>15)h+='<tr><td colspan="6" style="text-align:center;color:var(--gray-3);font-style:italic;">... and '+(_diInvRows.length-15)+' more rows</td></tr>';
  h+='</tbody></table></div>';
  h+='<div style="display:flex;gap:8px;">';
  h+='<button class="primary-btn" onclick="diConfirmInv()">Import '+_diInvRows.length+' Products</button>';
  h+='<button class="ghost-btn" onclick="showInvMappingScreen()">← Back to Mapping</button>';
  h+='</div></div>';
  document.getElementById('di-inv-preview').innerHTML=h;
}

async function diConfirmInv(){
  var added=0,updated=0,brandsAdded=0,vendorsAdded=0,catsAdded=0,deptsAdded=0;
  // Auto-create brands
  var existingBrandMap={};(adminBrands||[]).forEach(function(b){existingBrandMap[(b||'').toLowerCase()]=true;});
  _diInvRows.forEach(function(r){
    if(r.brand&&!existingBrandMap[r.brand.toLowerCase()]){
      adminBrands.push(r.brand);existingBrandMap[r.brand.toLowerCase()]=true;brandsAdded++;
    }
  });
  if(brandsAdded){try{await apiFetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'admin-brands',data:adminBrands})});}catch(e){}}
  // Auto-create vendors
  var existingVendorMap={};(adminVendors||[]).forEach(function(v){if(v.name)existingVendorMap[v.name.toLowerCase()]=true;});
  _diInvRows.forEach(function(r){
    if(r.vendor&&!existingVendorMap[r.vendor.toLowerCase()]){
      adminVendors.push({name:r.vendor,repName:'',phone:'',email:'',accountNum:'',paymentTerms:'Net 30'});
      existingVendorMap[r.vendor.toLowerCase()]=true;vendorsAdded++;
    }
  });
  if(vendorsAdded)saveVendors();
  // Auto-create categories
  var existingCatMap={};(adminCategories||[]).forEach(function(c){if(c&&c.name)existingCatMap[c.name.toLowerCase()]=c;});
  // Auto-create departments
  var existingDeptMap={};
  (typeof DEPARTMENTS!=='undefined'?DEPARTMENTS:[]).forEach(function(d){if(d&&d.name)existingDeptMap[d.name.toLowerCase()]=d;});
  (adminCategories||[]).forEach(function(c){if(c&&c.dept&&!existingDeptMap[c.dept.toLowerCase()])existingDeptMap[c.dept.toLowerCase()]={name:c.dept,cats:[]};});
  _diInvRows.forEach(function(r){
    // Department first
    if(r.dept&&!existingDeptMap[r.dept.toLowerCase()]){
      var newDept={name:r.dept,cats:[]};
      if(typeof DEPARTMENTS!=='undefined')DEPARTMENTS.push(newDept);
      existingDeptMap[r.dept.toLowerCase()]=newDept;
      deptsAdded++;
    }
    // Then category, associate with department if provided
    if(r.cat&&!existingCatMap[r.cat.toLowerCase()]){
      var newCat={name:r.cat,dept:r.dept||''};
      adminCategories.push(newCat);existingCatMap[r.cat.toLowerCase()]=newCat;catsAdded++;
      // Also add category to its department's cats list
      if(r.dept&&existingDeptMap[r.dept.toLowerCase()]){
        var deptObj=existingDeptMap[r.dept.toLowerCase()];
        if(!deptObj.cats)deptObj.cats=[];
        if(deptObj.cats.indexOf(r.cat)<0)deptObj.cats.push(r.cat);
      }
    }
  });
  if(catsAdded){try{await apiFetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'admin-categories',data:adminCategories})});}catch(e){}}
  // Process products
  _diInvRows.forEach(function(r){
    var p=PRODUCTS.find(function(x){return (x.model||'').toLowerCase()===r.model.toLowerCase()||(x.sku||'').toLowerCase()===r.model.toLowerCase();});
    if(p){
      // Never overwrite existing values with blank, null, or zero
      var hasStr=function(v){return v&&String(v).trim().length>0;};
      var hasNum=function(v){return typeof v==='number'&&!isNaN(v)&&v>0;};
      if(hasStr(r.name))p.name=r.name;
      if(hasStr(r.brand))p.brand=r.brand;
      if(hasStr(r.cat))p.cat=r.cat;
      if(hasStr(r.upc))p.upc=r.upc;
      if(hasStr(r.sku))p.sku=r.sku;
      if(hasNum(r.cost))p.cost=r.cost;
      if(hasNum(r.price))p.price=r.price;
      if(hasStr(r.vendor))p.vendor=r.vendor;
      if(r.reorderPt!=null&&hasNum(r.reorderPt))p.reorderPt=r.reorderPt;
      if(r.reorderQty!=null&&hasNum(r.reorderQty))p.reorderQty=r.reorderQty;
      if(hasNum(r.qty))p.stock=(p.stock||0)+r.qty;
      // Only set needsPricing if still no valid price after update
      if(!(p.price>0))p.needsPricing=true;else delete p.needsPricing;
      updated++;
    }else{
      var st=String(r.serialTracked||'').toLowerCase();
      PRODUCTS.push({id:PRODUCTS.length+200+added,model:r.model,sku:r.sku||r.model,name:r.name,brand:r.brand,cat:r.cat,price:r.price,cost:r.cost,stock:r.qty,sold:0,reorderPt:r.reorderPt||2,reorderQty:r.reorderQty||3,sales30:0,serial:'',warranty:'1 Year',icon:'&#x1F4E6;',serialTracked:st==='false'||st==='0'||st==='no'?false:true,vendor:r.vendor,upc:r.upc||'',serialPool:[],needsPricing:r.needsPricing||false});
      added++;
    }
  });
  await saveProducts();
  _diInvRows=[];_diInvRawRows=[];_diInvHeaders=[];
  document.getElementById('di-inv-preview').style.display='none';
  var parts=[added+' added',updated+' updated'];
  if(brandsAdded)parts.push(brandsAdded+' brands created');
  if(vendorsAdded)parts.push(vendorsAdded+' vendors created');
  if(catsAdded)parts.push(catsAdded+' categories created');
  if(deptsAdded)parts.push(deptsAdded+' departments created');
  toast(parts.join(', '),'success');
}

var _diCustRows=[];
async function diHandleCustFile(file){
  if(!file)return;
  var text=await file.text();
  var lines=text.split(/\r?\n/).filter(Boolean);
  if(lines.length<2){toast('File is empty','error');return;}
  var headers=lines[0].split(',').map(function(h){return h.trim().replace(/"/g,'').toLowerCase();});
  _diCustRows=[];var newCount=0,updateCount=0;
  for(var i=1;i<lines.length;i++){
    var cols=lines[i].split(',').map(function(c){return c.trim().replace(/^"|"$/g,'');});
    var row={};headers.forEach(function(h,j){row[h]=cols[j]||'';});
    var name=row.name||row['customer name']||'';
    var phone=row.phone||row.telephone||'';
    if(!name&&!phone)continue;
    var existing=customers.find(function(c){return phone&&c.phone===phone;});
    _diCustRows.push({name:name,phone:phone,email:row.email||'',address:row.address||row.street||'',city:row.city||'',state:row.state||row.st||'',zip:row.zip||row.zipcode||'',isUpdate:!!existing});
    if(existing)updateCount++;else newCount++;
  }
  var h='<div style="font-size:12px;font-weight:700;margin-bottom:6px;">'+_diCustRows.length+' customers: <span style="color:var(--green);">'+newCount+' new</span>, <span style="color:var(--blue);">'+updateCount+' updates</span></div>';
  h+='<div style="max-height:200px;overflow:auto;border:1px solid var(--border);border-radius:6px;"><table class="admin-table" style="font-size:10px;margin:0;"><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>City</th><th>Status</th></tr></thead><tbody>';
  _diCustRows.forEach(function(r){h+='<tr><td>'+r.name+'</td><td>'+r.phone+'</td><td>'+r.email+'</td><td>'+r.city+'</td><td style="font-weight:700;color:'+(r.isUpdate?'var(--blue)':'var(--green)')+';">'+(r.isUpdate?'Update':'New')+'</td></tr>';});
  h+='</tbody></table></div><button class="primary-btn" onclick="diConfirmCust()" style="margin-top:8px;">Import '+_diCustRows.length+' Customers</button>';
  document.getElementById('di-cust-preview').innerHTML=h;document.getElementById('di-cust-preview').style.display='block';
}

function diConfirmCust(){
  var added=0,updated=0;
  _diCustRows.forEach(function(r){
    var c=customers.find(function(c){return r.phone&&c.phone===r.phone;});
    if(c){
      if(r.name)c.name=r.name;if(r.email)c.email=r.email;if(r.address)c.address=r.address;
      if(r.city)c.city=r.city;if(r.state)c.state=r.state;if(r.zip)c.zip=r.zip;
      updated++;
    }else{
      customers.push({name:r.name,phone:r.phone,email:r.email,address:r.address,city:r.city,state:r.state,zip:r.zip,customerNum:'IMP-'+Date.now()+'-'+added,notes:''});
      added++;
    }
  });
  saveCustomers();_diCustRows=[];
  document.getElementById('di-cust-preview').style.display='none';
  toast(added+' added, '+updated+' updated','success');
}

// ═══ CLEAR DATA (Admin danger zone) ═══
var _clearType='';
var _clearStep=1;

function clearDataStart(type){
  // Role check — only Owner/Admin can clear data
  var role=(typeof currentEmployee!=='undefined'&&currentEmployee)?(currentEmployee.posRole||''):'Owner/Admin';
  if(role!=='Owner/Admin'&&role!=='General Manager'){toast('Only Owner/Admin can clear data','error');return;}
  _clearType=type;_clearStep=1;
  var productCount=PRODUCTS.length;
  var orderCount=(orders||[]).length;
  var custCount=(customers||[]).length;
  var titles={inventory:'All Inventory',sales:'All Sales History',customers:'All Customer Records',all:'ALL Data (Inventory + Sales + Customers)'};
  var counts={
    inventory:productCount+' products (and their serial pools)',
    sales:orderCount+' sales/invoices (and all line items)',
    customers:custCount+' customer records (and their ledgers)',
    all:productCount+' products, '+orderCount+' sales, '+custCount+' customers'
  };
  var storeName=(typeof currentStore!=='undefined'&&currentStore&&currentStore.store_name)||'DC Appliance';
  document.getElementById('cd-warning-msg').innerHTML='This will <strong>soft-delete</strong> '+titles[type]+' for <strong>'+storeName+'</strong>.<br/><span style="font-size:11px;color:#6b7280;">Records are hidden but recoverable from Supabase.</span>';
  document.getElementById('cd-record-counts').innerHTML='<strong>Will soft-delete:</strong> '+counts[type];
  document.getElementById('cd-step-1').style.display='block';
  document.getElementById('cd-step-2').style.display='none';
  document.getElementById('cd-step-3').style.display='none';
  document.getElementById('cd-continue-btn').style.display='';
  document.getElementById('cd-delete-btn').style.display='none';
  document.getElementById('cd-cancel-btn').style.display='';
  document.getElementById('cd-confirm-input').value='';
  openModal('clear-data-modal');
}

function clearDataReset(){_clearType='';_clearStep=1;}

function clearDataNextStep(){
  _clearStep=2;
  document.getElementById('cd-step-1').style.display='none';
  document.getElementById('cd-step-2').style.display='block';
  document.getElementById('cd-continue-btn').style.display='none';
  document.getElementById('cd-delete-btn').style.display='';
  setTimeout(function(){document.getElementById('cd-confirm-input').focus();},100);
}

function clearDataInputCheck(){
  var val=document.getElementById('cd-confirm-input').value.trim().toUpperCase();
  var btn=document.getElementById('cd-delete-btn');
  if(val==='DELETE'){btn.disabled=false;btn.style.opacity='1';btn.style.cursor='pointer';}
  else{btn.disabled=true;btn.style.opacity='0.4';btn.style.cursor='not-allowed';}
}

async function clearDataExecute(){
  if(document.getElementById('cd-confirm-input').value.trim().toUpperCase()!=='DELETE')return;
  document.getElementById('cd-step-2').style.display='none';
  document.getElementById('cd-step-3').style.display='block';
  document.getElementById('cd-cancel-btn').style.display='none';
  document.getElementById('cd-delete-btn').style.display='none';
  var bar=document.getElementById('cd-progress-bar');
  var text=document.getElementById('cd-progress-text');
  var deletedCounts={products:0,orders:0,customers:0};

  bar.style.width='30%';text.textContent='Soft-deleting records...';
  await new Promise(function(r){setTimeout(r,100);});

  try{
    // Call soft-delete API endpoint — sets deleted=true instead of hard deleting
    var res=await apiFetch('/api/admin-clear',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:_clearType})});
    var result=await res.json();
    if(!result.ok)throw new Error(result.error||'Clear failed');

    bar.style.width='70%';text.textContent='Updating local state...';
    await new Promise(function(r){setTimeout(r,100);});

    // Update local state to match (clear in-memory arrays)
    if(result.results.inventory){
      deletedCounts.products=result.results.inventory.products||0;
      PRODUCTS.length=0;
    }
    if(result.results.sales){
      deletedCounts.orders=result.results.sales.orders||0;
      orders.length=0;
      nextOrderId=1001;nextQuoteId=1;
    }
    if(result.results.customers){
      deletedCounts.customers=result.results.customers.count||0;
      customers.length=0;
    }
  }catch(e){
    console.error('[Clear Data] Error:',e);
    bar.style.width='100%';bar.style.background='#dc2626';
    text.textContent='Error: '+e.message;
    setTimeout(function(){closeModal('clear-data-modal');clearDataReset();toast('Clear failed: '+e.message,'error');},2000);
    return;
  }

  bar.style.width='100%';text.textContent='Complete — records soft-deleted (recoverable)';

  // Log the clear action
  try{
    var logRes=await apiFetch('/api/admin-get?key=data-clear-log');
    var logData=await logRes.json();
    var log=(logData&&Array.isArray(logData.data))?logData.data:[];
    log.unshift({ts:new Date().toISOString(),by:(currentEmployee&&currentEmployee.name)||'Admin',type:_clearType,method:'soft-delete',storeId:(typeof currentStoreId!=='undefined'?currentStoreId:1),deleted:deletedCounts});
    await apiFetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'data-clear-log',data:log.slice(0,100)})});
  }catch(e){console.error('Clear log save failed:',e);}

  var total=deletedCounts.products+deletedCounts.orders+deletedCounts.customers;
  setTimeout(function(){
    closeModal('clear-data-modal');
    clearDataReset();
    toast('Soft-deleted '+total+' records (recoverable from Supabase)','success');
    // Refresh current views
    if(typeof renderInventory==='function')renderInventory();
    if(typeof renderOrders==='function')renderOrders();
    if(typeof custFilterList==='function')custFilterList();
  },1400);
}

// ═══ SALES HISTORY IMPORT (SmartTouch PDF/CSV) ═══
var _diSalesParsed=null;
var _diSalesImportHistory=[];

async function diLoadImportHistory(){
  try{var r=await apiFetch('/api/admin-get?key=sales-import-history');var d=await r.json();if(d&&Array.isArray(d.data))_diSalesImportHistory=d.data;}catch(e){}
}
async function diSaveImportHistory(){
  try{await apiFetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'sales-import-history',data:_diSalesImportHistory})});}catch(e){}
}

async function diHandleSalesFile(file){
  if(!file)return;
  document.getElementById('di-sales-loading').style.display='block';
  document.getElementById('di-sales-preview').style.display='none';
  try{
    var b64=await new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result.split(',')[1]);};r.onerror=rej;r.readAsDataURL(file);});
    var contentType=file.name.match(/\.pdf$/i)?'document':'document';
    var prompt='Extract ALL sales invoices from this SmartTouch POS Sales Journal. Return JSON only: '
      +'{"invoices":[{"invoiceNumber":"","date":"YYYY-MM-DD","customer":"","clerkInitials":"","taxCounty":"","status":"Sold",'
      +'"items":[{"plu":"","dept":"","model":"","description":"","serial":"","so":"","qty":1,"unitPrice":0,"discount":0,"extPrice":0}],'
      +'"subtotal":0,"salesTax":0,"total":0}]}. '
      +'For walk-ins the customer will be "Cash", "Check", or "Charge". JSON only, no explanation.';
    var msgs=[{role:'user',content:[{type:contentType,source:{type:'base64',media_type:file.type||'application/pdf',data:b64}},{type:'text',text:prompt}]}];
    var data=await claudeApiCall({messages:msgs,max_tokens:8000});
    var match=data.content[0].text.match(/\{[\s\S]*\}/);
    if(!match)throw new Error('Could not parse AI response');
    var parsed=JSON.parse(match[0]);
    _diSalesParsed={file:file.name,data:parsed};
    diShowSalesPreview();
  }catch(e){
    document.getElementById('di-sales-preview').innerHTML='<div style="padding:12px 16px;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;color:#991b1b;font-size:12px;">Import failed: '+e.message+'</div>';
    document.getElementById('di-sales-preview').style.display='block';
  }
  document.getElementById('di-sales-loading').style.display='none';
}

function diShowSalesPreview(){
  var p=_diSalesParsed.data;var invoices=p.invoices||[];
  if(!invoices.length){document.getElementById('di-sales-preview').innerHTML='<div style="padding:12px 16px;background:#fef2f2;border-radius:8px;color:#991b1b;font-size:12px;">No invoices found in this file.</div>';document.getElementById('di-sales-preview').style.display='block';return;}

  // Analyze
  var dates=invoices.map(function(i){return i.date;}).filter(Boolean).sort();
  var dateRange=dates.length?dates[0]+' to '+dates[dates.length-1]:'—';
  var totalSales=invoices.reduce(function(s,i){return s+(parseFloat(i.total)||0);},0);
  var clerkInitials={};invoices.forEach(function(i){if(i.clerkInitials)clerkInitials[i.clerkInitials]=(clerkInitials[i.clerkInitials]||0)+1;});
  var existingInitials={};(adminUsers||[]).forEach(function(u){
    if(u.name){var parts=u.name.split(' ');var init=parts[0][0]+(parts.length>1?parts[parts.length-1][0]:'');existingInitials[init.toUpperCase()]=u.name;}
    if(u.initials)existingInitials[u.initials.toUpperCase()]=u.name;
  });
  var unmatchedClerks=Object.keys(clerkInitials).filter(function(k){return !existingInitials[k.toUpperCase()];});
  // Duplicate check
  var existingIds={};(orders||[]).forEach(function(o){if(o.id)existingIds[o.id]=true;if(o.importedInvoice)existingIds[o.importedInvoice]=true;});
  var duplicates=invoices.filter(function(i){return existingIds[i.invoiceNumber];}).length;
  var walkIns=invoices.filter(function(i){var c=(i.customer||'').toLowerCase();return c==='cash'||c==='check'||c==='charge'||!c;}).length;

  var h='<div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:14px;">';
  h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">';
  h+='<div><div style="font-size:10px;font-weight:700;color:var(--gray-2);text-transform:uppercase;">Invoices</div><div style="font-size:20px;font-weight:800;">'+invoices.length+'</div></div>';
  h+='<div><div style="font-size:10px;font-weight:700;color:var(--gray-2);text-transform:uppercase;">Date Range</div><div style="font-size:11px;font-weight:600;">'+dateRange+'</div></div>';
  h+='<div><div style="font-size:10px;font-weight:700;color:var(--gray-2);text-transform:uppercase;">Total Sales</div><div style="font-size:20px;font-weight:800;color:var(--green);">'+fmt(totalSales)+'</div></div>';
  h+='<div><div style="font-size:10px;font-weight:700;color:var(--gray-2);text-transform:uppercase;">Walk-Ins</div><div style="font-size:20px;font-weight:800;color:var(--gray-2);">'+walkIns+'</div></div>';
  h+='</div>';

  // Flags
  if(duplicates){h+='<div style="padding:8px 12px;background:#fef2f2;border-left:3px solid #dc2626;border-radius:4px;margin-bottom:8px;font-size:11px;color:#991b1b;"><strong>'+duplicates+' duplicate invoice'+(duplicates===1?'':'s')+'</strong> already exist in the system — will be skipped.</div>';}
  if(unmatchedClerks.length){
    h+='<div style="padding:8px 12px;background:#fffbeb;border-left:3px solid #eab308;border-radius:4px;margin-bottom:8px;font-size:11px;color:#713f12;"><strong>Unmatched clerk initials:</strong> '+unmatchedClerks.join(', ')+' — <a href="#" onclick="event.preventDefault();diShowClerkMatch();" style="color:#1d4ed8;font-weight:700;">match manually</a></div>';
    h+='<div id="di-clerk-match" style="display:none;padding:10px 12px;background:#fff;border:1px solid #eab308;border-radius:6px;margin-bottom:8px;"><div style="font-size:11px;font-weight:700;margin-bottom:6px;">Assign employees:</div>';
    unmatchedClerks.forEach(function(init){
      var empOpts='<option value="">(leave unmatched)</option>'+(adminUsers||[]).filter(function(u){return u.active!==false;}).map(function(u){return '<option value="'+u.name+'">'+u.name+'</option>';}).join('');
      h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:11px;"><span style="font-weight:700;min-width:40px;">'+init+'</span><span>→</span><select class="sel di-clerk-assign" data-init="'+init+'" style="font-size:11px;padding:4px 8px;">'+empOpts+'</select><span style="color:var(--gray-3);">('+clerkInitials[init]+' invoices)</span></div>';
    });
    h+='</div>';
  }

  // Options
  h+='<div style="display:flex;gap:16px;margin-bottom:12px;font-size:12px;">';
  h+='<label style="display:flex;align-items:center;gap:6px;cursor:pointer;"><input type="checkbox" id="di-skip-dup" checked style="accent-color:var(--gold,#2563eb);"/> Skip duplicates</label>';
  h+='<label style="display:flex;align-items:center;gap:6px;cursor:pointer;"><input type="checkbox" id="di-skip-walkin" style="accent-color:var(--gold,#2563eb);"/> Skip walk-in sales</label>';
  h+='</div>';

  // Preview table
  h+='<div style="font-size:11px;font-weight:700;margin-bottom:4px;">First 10 invoices:</div>';
  h+='<div style="max-height:240px;overflow:auto;border:1px solid var(--border);border-radius:6px;margin-bottom:12px;"><table class="admin-table" style="font-size:10px;margin:0;"><thead><tr><th>Invoice #</th><th>Date</th><th>Customer</th><th>Clerk</th><th style="text-align:center;">Items</th><th style="text-align:right;">Total</th></tr></thead><tbody>';
  invoices.slice(0,10).forEach(function(inv){
    var isDup=existingIds[inv.invoiceNumber];
    h+='<tr'+(isDup?' style="background:#fef2f2;"':'')+'><td style="font-weight:600;">'+inv.invoiceNumber+'</td><td>'+inv.date+'</td><td>'+(inv.customer||'—')+'</td><td>'+(inv.clerkInitials||'—')+'</td><td style="text-align:center;">'+((inv.items||[]).length)+'</td><td style="text-align:right;font-weight:600;">'+fmt(parseFloat(inv.total)||0)+'</td></tr>';
  });
  h+='</tbody></table></div>';

  h+='<div id="di-sales-progress" style="display:none;margin-bottom:10px;"><div style="background:var(--bg4);border-radius:100px;height:6px;overflow:hidden;"><div id="di-sales-bar" style="height:100%;width:0%;background:var(--green);transition:width 0.2s;"></div></div><div id="di-sales-progress-text" style="font-size:10px;color:var(--gray-2);margin-top:4px;text-align:center;"></div></div>';
  h+='<div style="display:flex;gap:8px;"><button class="primary-btn" onclick="diImportSales()">Import '+invoices.length+' Invoices</button><button class="ghost-btn" onclick="diCancelSalesImport()">Cancel</button></div>';
  h+='</div>';
  document.getElementById('di-sales-preview').innerHTML=h;
  document.getElementById('di-sales-preview').style.display='block';
}

function diShowClerkMatch(){var el=document.getElementById('di-clerk-match');if(el)el.style.display=el.style.display==='none'?'block':'none';}
function diCancelSalesImport(){_diSalesParsed=null;document.getElementById('di-sales-preview').style.display='none';document.getElementById('di-sales-preview').innerHTML='';}

async function diImportSales(){
  if(!_diSalesParsed)return;
  var invoices=_diSalesParsed.data.invoices||[];
  var skipDup=document.getElementById('di-skip-dup').checked;
  var skipWalkIn=document.getElementById('di-skip-walkin').checked;
  // Build clerk mapping
  var clerkMap={};document.querySelectorAll('.di-clerk-assign').forEach(function(sel){if(sel.value)clerkMap[sel.dataset.init]=sel.value;});
  var existingInitials={};(adminUsers||[]).forEach(function(u){if(u.name){var parts=u.name.split(' ');var init=parts[0][0]+(parts.length>1?parts[parts.length-1][0]:'');existingInitials[init.toUpperCase()]=u.name;}if(u.initials)existingInitials[u.initials.toUpperCase()]=u.name;});
  var existingIds={};(orders||[]).forEach(function(o){if(o.id)existingIds[o.id]=true;if(o.importedInvoice)existingIds[o.importedInvoice]=true;});

  document.getElementById('di-sales-progress').style.display='block';
  var bar=document.getElementById('di-sales-bar');
  var text=document.getElementById('di-sales-progress-text');

  var stats={imported:0,custCreated:0,custMatched:0,serialsRecorded:0,skipped:0,errors:0};

  for(var i=0;i<invoices.length;i++){
    var inv=invoices[i];
    try{
      // Skip duplicate
      if(skipDup&&existingIds[inv.invoiceNumber]){stats.skipped++;continue;}
      // Skip walk-in if requested
      var custName=(inv.customer||'').trim();
      var isWalkIn=['cash','check','charge',''].indexOf(custName.toLowerCase())>=0;
      if(skipWalkIn&&isWalkIn){stats.skipped++;continue;}

      // Map clerk initials to employee name
      var clerkName=clerkMap[inv.clerkInitials]||existingInitials[(inv.clerkInitials||'').toUpperCase()]||inv.clerkInitials||'';

      // Match or create customer
      var custRecord=null;
      if(!isWalkIn&&custName){
        custRecord=customers.find(function(c){return c.name.toLowerCase()===custName.toLowerCase();});
        if(custRecord){stats.custMatched++;}
        else{
          custRecord={name:custName,phone:'',email:'',address:'',city:'',state:'',zip:'',customerNum:'IMP-'+Date.now()+'-'+stats.custCreated,notes:'Imported from SmartTouch',payments:[]};
          customers.push(custRecord);stats.custCreated++;
        }
      }

      // Build order items
      var orderItems=(inv.items||[]).map(function(it){
        if(it.serial)stats.serialsRecorded++;
        var prod=PRODUCTS.find(function(p){return (p.model||'').toLowerCase()===(it.model||'').toLowerCase()||(p.sku||'').toLowerCase()===(it.model||'').toLowerCase();});
        return{id:prod?prod.id:null,plu:it.plu||'',dept:it.dept||'',model:it.model||'',name:it.description||'',price:parseFloat(it.unitPrice)||0,qty:parseInt(it.qty)||1,serial:it.serial||'',discount:parseFloat(it.discount)||0,so:it.so||''};
      });

      var order={
        id:inv.invoiceNumber||'IMP-'+Date.now()+'-'+i,
        importedInvoice:inv.invoiceNumber,
        importedFrom:'SmartTouch',
        importedAt:new Date().toISOString(),
        customer:isWalkIn?'Walk-In Customer':custName,
        items:orderItems,
        subtotal:parseFloat(inv.subtotal)||0,
        tax:parseFloat(inv.salesTax)||0,
        total:parseFloat(inv.total)||0,
        taxZone:inv.taxCounty||'',
        payment:isWalkIn?(custName||'Cash'):'Charge Customer',
        status:inv.status==='Return'?'Return':'Delivered',
        date:inv.date?new Date(inv.date).toISOString():new Date().toISOString(),
        clerk:clerkName,
        soldTo:{name:isWalkIn?'':custName,addr:'',city:'',state:'',zip:'',phone:''},
        shipTo:{name:'',addr:'',city:'',state:'',zip:''},
        notes:'',address:'',deliveryDate:'',po:'',job:'',invoiceNotes:'',shipperNotes:''
      };
      orders.unshift(order);existingIds[order.id]=true;
      stats.imported++;
    }catch(e){stats.errors++;console.error('Import row failed:',e);}
    // Update progress
    var pct=Math.round(((i+1)/invoices.length)*100);
    bar.style.width=pct+'%';
    text.textContent='Importing invoice '+(i+1)+' of '+invoices.length+'...';
    if(i%10===0)await new Promise(function(r){setTimeout(r,0);}); // yield to UI
  }

  // Save everything
  await saveOrders();
  await saveCustomers();

  // Log import
  _diSalesImportHistory.unshift({
    date:new Date().toISOString(),
    file:_diSalesParsed.file,
    dateRange:invoices.map(function(i){return i.date;}).filter(Boolean).sort().slice(0,1).concat(invoices.map(function(i){return i.date;}).filter(Boolean).sort().slice(-1)).join(' to '),
    count:stats.imported,
    by:currentEmployee?currentEmployee.name:'Admin',
    stats:stats
  });
  await diSaveImportHistory();

  text.textContent='Complete!';
  toast(stats.imported+' invoices imported, '+stats.custCreated+' customers created, '+stats.serialsRecorded+' serials recorded'+(stats.skipped?', '+stats.skipped+' skipped':''),'success');
  setTimeout(function(){diCancelSalesImport();renderOrders();},1500);
}

async function diShowImportHistory(){
  await diLoadImportHistory();
  if(!_diSalesImportHistory.length){alert('No imports yet.');return;}
  var win=window.open('','_blank','width=720,height=600');
  var html='<!DOCTYPE html><html><head><title>Sales Import History</title><style>body{font-family:Arial,sans-serif;padding:20px;font-size:12px;}h1{font-size:18px;margin-bottom:14px;}table{width:100%;border-collapse:collapse;}th{background:#222;color:#fff;padding:7px 10px;font-size:10px;text-align:left;}td{padding:7px 10px;border-bottom:1px solid #ddd;}</style></head><body>';
  html+='<h1>Sales Import History</h1><table><thead><tr><th>Date</th><th>File</th><th>Date Range</th><th>Invoices</th><th>Imported By</th><th>Stats</th></tr></thead><tbody>';
  _diSalesImportHistory.forEach(function(h){
    var st=h.stats||{};
    var statStr=(st.imported||0)+' imported, '+(st.custCreated||0)+' new cust, '+(st.custMatched||0)+' matched, '+(st.serialsRecorded||0)+' serials'+(st.skipped?', '+st.skipped+' skipped':'');
    html+='<tr><td>'+new Date(h.date).toLocaleString()+'</td><td>'+h.file+'</td><td>'+(h.dateRange||'—')+'</td><td>'+h.count+'</td><td>'+h.by+'</td><td style="font-size:11px;color:#666;">'+statStr+'</td></tr>';
  });
  html+='</tbody></table></body></html>';
  win.document.write(html);win.document.close();
}

// ═══ SERIAL NUMBER IMPORT (SmartTouch PDF) ═══
var _diSerialParsed=null;
var _diSerialImportHistory=[];
var CONDITION_KEYWORDS=['dented','used','damaged','scratched','open box','openbox','open-box','return','demo','floor model','floormodel','refurbished','refurb'];

async function diLoadSerialImportHistory(){
  try{var r=await apiFetch('/api/admin-get?key=serial-import-history');var d=await r.json();if(d&&Array.isArray(d.data))_diSerialImportHistory=d.data;}catch(e){}
}
async function diSaveSerialImportHistory(){
  try{await apiFetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'serial-import-history',data:_diSerialImportHistory})});}catch(e){}
}

function cleanSerialAndFlag(rawSerial){
  var sn=(rawSerial||'').trim();
  var conditions=[];
  var lower=sn.toLowerCase();
  CONDITION_KEYWORDS.forEach(function(kw){
    if(lower.indexOf(kw)>=0){
      conditions.push(kw.charAt(0).toUpperCase()+kw.slice(1));
      // Remove the keyword from the serial
      var re=new RegExp(kw.replace('-','\\-').replace(' ','\\s*'),'gi');
      sn=sn.replace(re,'').trim();
    }
  });
  // Clean up leftover punctuation/whitespace
  sn=sn.replace(/^[\s\-:,]+|[\s\-:,]+$/g,'').replace(/\s{2,}/g,' ');
  return{serial:sn,condition:conditions.join(', ')};
}

// Client-side PDF text extraction + SmartTouch format parser
async function diExtractPdfText(file){
  if(!window.pdfjsLib)throw new Error('PDF library not loaded');
  var arrayBuffer=await file.arrayBuffer();
  var pdf=await window.pdfjsLib.getDocument({data:arrayBuffer}).promise;
  var loadingEl=document.getElementById('di-serial-loading');
  var pages=[];
  for(var i=1;i<=pdf.numPages;i++){
    if(loadingEl)loadingEl.innerHTML='<span style="display:inline-block;width:14px;height:14px;border:2px solid #bfdbfe;border-top-color:#2563eb;border-radius:50%;animation:spin 0.6s linear infinite;vertical-align:middle;margin-right:6px;"></span>Parsing page '+i+' of '+pdf.numPages+'...';
    var page=await pdf.getPage(i);
    var content=await page.getTextContent();
    // Group text items by y-coordinate (line) then sort by x
    var lines={};
    content.items.forEach(function(item){
      var y=Math.round(item.transform[5]);
      if(!lines[y])lines[y]=[];
      lines[y].push({x:item.transform[4],text:item.str});
    });
    var keys=Object.keys(lines).map(Number).sort(function(a,b){return b-a;});
    keys.forEach(function(y){
      lines[y].sort(function(a,b){return a.x-b.x;});
      pages.push(lines[y].map(function(i){return i.str;}).join(' '));
    });
    pages.push(''); // page separator
  }
  return pages.join('\n');
}

function diParseSmartTouchSerials(text){
  console.log('[Serial Parser] Raw extracted text length:',text.length);
  console.log('[Serial Parser] First 500 chars:',text.slice(0,500));
  var lines=text.split(/\r?\n/).map(function(l){return l.trim();}).filter(Boolean);
  console.log('[Serial Parser] Total lines after trim+filter:',lines.length);

  // Known conditions that may prefix a serial with no space
  var conditions=['dented','used','damaged','scratched','openbox','return','demo','floormodel','refurbished','refurb'];
  // Regex patterns based on exact SmartTouch format
  // MODEL LINE: "MK2220AB 19905" or "MTK2227PZ S22924"
  var modelRe=/^([A-Z0-9][A-Z0-9\-_\/.]*)\s+(S?\d{3,8})$/;
  // SERIAL LINE: "XVA0800143 2404 02-15-2022 NOT SPECIFIED $67.00"
  // With condition: "dentedFD4301309 6082 10-31-2024 NOT SPECIFIED $372.00"
  var serialRe=/^(dented|used|damaged|scratched|openbox|return|demo|floormodel|refurbished|refurb)?([A-Z0-9][A-Z0-9\-_]+)\s+(\S+)\s+(\d{2}-\d{2}-\d{4})\s+NOT\s+SPECIFIED\s+\$([0-9,]+\.\d{2})$/i;
  // Skip patterns — lines that aren't model/serial data
  var skipPatterns=[
    /^page\s+\d+/i,
    /^serialized\s+inventory/i,
    /^serial\s+number\s+report/i,
    /^report\s+date/i,
    /^print\s+date/i,
    /^copyright/i,
    /^©/,
    /^subtotal/i,
    /^total/i,
    /^grand\s+total/i,
    /^brand\s*:/i,
    /^store\s*:/i,
    /^report\s+by/i,
    /^\d+\s+of\s+\d+$/i, // page X of Y
    /^_+$/, // separators
    /^-+$/,
    /^=+$/
  ];

  function isSkipLine(line){
    for(var i=0;i<skipPatterns.length;i++){if(skipPatterns[i].test(line))return true;}
    return false;
  }

  // Detect brand: look for ALL CAPS single-word lines near the top (before the first model line)
  var brand='';
  for(var i=0;i<Math.min(lines.length,20);i++){
    var line=lines[i];
    if(isSkipLine(line))continue;
    // If we hit a model line, stop looking
    if(modelRe.test(line))break;
    // ALL CAPS brand name (letters only, possibly multi-word)
    if(/^[A-Z][A-Z\s&.\-]{2,30}$/.test(line)&&line.length<=30){
      brand=line.trim();
      console.log('[Serial Parser] Detected brand:',brand);
      break;
    }
  }

  var models=[];
  var currentModel=null;
  var modelLinesFound=0,serialLinesFound=0,skippedCount=0;

  lines.forEach(function(line,lineIdx){
    if(isSkipLine(line)){skippedCount++;return;}

    // Try serial line FIRST (more specific match)
    var sm=line.match(serialRe);
    if(sm){
      if(!currentModel){
        console.warn('[Serial Parser] Serial found but no current model (line '+lineIdx+'):',line);
        return;
      }
      var rawCondition=sm[1]||'';
      var condition=rawCondition?rawCondition.charAt(0).toUpperCase()+rawCondition.slice(1).toLowerCase():'';
      var cost=parseFloat(sm[5].replace(/,/g,''))||0;
      // Normalize date MM-DD-YYYY → YYYY-MM-DD
      var dParts=sm[4].split('-');
      var dateStr=dParts[2]+'-'+dParts[0]+'-'+dParts[1];
      currentModel.serials.push({serial:sm[2],invoice:sm[3],date:dateStr,cost:cost,condition:condition});
      serialLinesFound++;
      return;
    }

    // Try model line
    var mm=line.match(modelRe);
    if(mm){
      currentModel={model:mm[1],plu:mm[2],serials:[]};
      models.push(currentModel);
      modelLinesFound++;
      return;
    }

    // Unmatched line — log for debugging
    if(line.length<120)console.log('[Serial Parser] Unmatched line '+lineIdx+':',JSON.stringify(line));
  });

  console.log('[Serial Parser] Summary — models:',modelLinesFound,'serials:',serialLinesFound,'skipped:',skippedCount);
  // Keep all models (even with 0 serials) for debugging, but filter for final output
  var nonEmpty=models.filter(function(m){return m.serials.length>0;});
  console.log('[Serial Parser] Models with serials:',nonEmpty.length);
  return{brand:brand,models:nonEmpty};
}

// ── Spreadsheet serial parser (XLS/XLSX/CSV) ──
function diParseSerialSpreadsheet(workbook,filename){
  var sheet=workbook.Sheets[workbook.SheetNames[0]];
  var rows=XLSX.utils.sheet_to_json(sheet,{header:1,raw:false,dateNF:'MM-DD-YYYY'});
  // Detect brand from filename (e.g. "serialnumbersbybrandwhirlpool.xls")
  var brandSel=document.getElementById('di-serial-brand');
  var brand=(brandSel&&brandSel.value)?brandSel.value:'';
  if(!brand){
    var fn=filename.toLowerCase().replace(/[^a-z0-9]/g,'');
    var knownBrands=(typeof adminBrands!=='undefined'?adminBrands:['Samsung','LG','Whirlpool','Bosch','GE','KitchenAid','Maytag','Frigidaire','Blomberg']);
    for(var b=0;b<knownBrands.length;b++){if(fn.indexOf(knownBrands[b].toLowerCase())>=0){brand=knownBrands[b];break;}}
  }
  console.log('[Serial XLS] Brand:',brand||'(unknown)','| Total rows:',rows.length);
  var models=[],currentModel=null,modelMap={};
  for(var i=0;i<rows.length;i++){
    var row=rows[i];if(!row||!row.length)continue;
    var colA=(row[0]||'').toString().trim();
    var colB=(row[1]||'').toString().trim();
    var colC=(row[2]||'').toString().trim();
    var colD=(row[3]||'').toString().trim();
    // If column A has a value → model row
    if(colA&&!colB){
      // Skip header rows
      if(colA.toLowerCase()==='model'||colA.toLowerCase()==='item')continue;
      currentModel=colA;
      if(!modelMap[currentModel]){modelMap[currentModel]={model:currentModel,plu:'',serials:[]};models.push(modelMap[currentModel]);}
      continue;
    }
    // If column A blank and column B has a value → serial row
    if(!colA&&colB&&currentModel){
      var cleaned=cleanSerialAndFlag(colB);
      // Convert Excel date serial number if colD is numeric
      var dateStr=colD;
      if(dateStr&&!isNaN(Number(dateStr))){
        try{var dt=XLSX.SSF.parse_date_code(Number(dateStr));dateStr=(dt.m<10?'0':'')+dt.m+'-'+(dt.d<10?'0':'')+dt.d+'-'+dt.y;}catch(e){}
      }
      // Normalize date to YYYY-MM-DD
      if(dateStr){
        var dm=dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
        if(dm){var yr=dm[3].length===2?'20'+dm[3]:dm[3];dateStr=yr+'-'+(dm[1].length===1?'0':'')+dm[1]+'-'+(dm[2].length===1?'0':'')+dm[2];}
      }
      if(!modelMap[currentModel])continue;
      modelMap[currentModel].serials.push({serial:cleaned.serial,invoice:colC,date:dateStr,cost:0,condition:cleaned.condition});
    }
  }
  var nonEmpty=models.filter(function(m){return m.serials.length>0;});
  console.log('[Serial XLS] Parsed',nonEmpty.length,'models,',nonEmpty.reduce(function(s,m){return s+m.serials.length;},0),'serials');
  return{brand:brand,models:nonEmpty};
}

async function diHandleSerialFile(file){
  if(!file)return;
  var loadingEl=document.getElementById('di-serial-loading');
  var spinHtml='<span style="display:inline-block;width:14px;height:14px;border:2px solid #bfdbfe;border-top-color:#2563eb;border-radius:50%;animation:spin 0.6s linear infinite;vertical-align:middle;margin-right:6px;"></span>';
  loadingEl.style.display='block';
  document.getElementById('di-serial-preview').style.display='none';
  var isSpreadsheet=file.name.match(/\.(xls|xlsx|csv)$/i);
  var isPdf=file.name.match(/\.pdf$/i)||file.type.match(/pdf/i);
  try{
    var parsed=null;
    if(isSpreadsheet){
      // ── Spreadsheet path (XLS/XLSX/CSV) ──
      loadingEl.innerHTML=spinHtml+'Reading spreadsheet...';
      var ab=await file.arrayBuffer();
      if(!window.XLSX)throw new Error('XLSX library not loaded — please refresh the page');
      var wb=XLSX.read(ab,{type:'array',cellDates:false,raw:false});
      loadingEl.innerHTML=spinHtml+'Parsing serial numbers...';
      parsed=diParseSerialSpreadsheet(wb,file.name);
    }else if(isPdf){
      // ── PDF path (legacy SmartTouch format) ──
      loadingEl.innerHTML=spinHtml+'Extracting PDF text...';
      var text=await diExtractPdfText(file);
      console.log('Extracted '+text.length+' chars from PDF. Preview:',text.slice(0,500));
      loadingEl.innerHTML=spinHtml+'Parsing serial numbers...';
      parsed=diParseSmartTouchSerials(text);
      var totalSerials=(parsed.models||[]).reduce(function(s,m){return s+m.serials.length;},0);
      console.log('Parser found '+parsed.models.length+' models, '+totalSerials+' serials. Brand:',parsed.brand);
      if(totalSerials===0){
        console.warn('Client-side parser found 0 serials. Trying AI fallback...');
        loadingEl.innerHTML=spinHtml.replace('#2563eb','#d97706').replace('#bfdbfe','#fcd34d')+'Pattern match found no serials — trying AI fallback...';
        try{
          var b64=await new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result.split(',')[1]);};r.onerror=rej;r.readAsDataURL(file);});
          var prompt='Extract ALL serial numbers from this SmartTouch POS Serial Number Report by Brand. Return JSON only: {"brand":"Brand Name","models":[{"model":"MODEL#","plu":"","serials":[{"serial":"SN123","invoice":"INV/PO#","date":"YYYY-MM-DD","cost":0}]}]}. Keep any prefixes like "dented", "used", "damaged", "open box" in the serial field exactly as shown. JSON only, no explanation.';
          var msgs=[{role:'user',content:[{type:'document',source:{type:'base64',media_type:'application/pdf',data:b64}},{type:'text',text:prompt}]}];
          var data=await claudeApiCall({messages:msgs,max_tokens:8000});
          var m=data.content[0].text.match(/\{[\s\S]*\}/);
          if(m)parsed=JSON.parse(m[0]);
        }catch(apiErr){console.error('AI fallback failed:',apiErr);}
      }
    }else{
      throw new Error('Unsupported file format. Please upload XLS, XLSX, CSV, or PDF.');
    }
    // Check results
    var finalSerialCount=(parsed&&parsed.models||[]).reduce(function(s,m){return s+m.serials.length;},0);
    if(!finalSerialCount){
      document.getElementById('di-serial-preview').innerHTML='<div style="padding:14px 16px;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;color:#991b1b;font-size:12px;"><strong>Could not parse file</strong> — no serial numbers found. Check format and try again.<br/><button class="ghost-btn" onclick="document.getElementById(\'di-serial-preview\').style.display=\'none\';" style="margin-top:8px;">Try Another File</button></div>';
      document.getElementById('di-serial-preview').style.display='block';
      loadingEl.style.display='none';
      return;
    }
    // Apply brand override if set
    var brandSel=document.getElementById('di-serial-brand');
    if(brandSel&&brandSel.value)parsed.brand=brandSel.value;
    _diSerialParsed={file:file.name,data:parsed};
    diShowSerialPreview();
  }catch(e){
    console.error('Serial import error:',e);
    document.getElementById('di-serial-preview').innerHTML='<div style="padding:12px 16px;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;color:#991b1b;font-size:12px;"><strong>Import failed:</strong> '+e.message+'<br/><button class="ghost-btn" onclick="document.getElementById(\'di-serial-preview\').style.display=\'none\';" style="margin-top:8px;">Try Again</button></div>';
    document.getElementById('di-serial-preview').style.display='block';
  }
  loadingEl.style.display='none';
}

function diShowSerialPreview(){
  var p=_diSerialParsed.data;var models=p.models||[];
  if(!models.length){document.getElementById('di-serial-preview').innerHTML='<div style="padding:12px 16px;background:#fef2f2;border-radius:8px;color:#991b1b;font-size:12px;">No serial numbers found in this file.</div>';document.getElementById('di-serial-preview').style.display='block';return;}

  // Flatten all serials + compute stats
  var totalSerials=0;var unmatchedModels=[];var conditionSerials=[];
  var allSerials=[];
  models.forEach(function(m){
    var prod=PRODUCTS.find(function(x){return (x.model||'').toLowerCase()===(m.model||'').toLowerCase()||(x.sku||'').toLowerCase()===(m.model||'').toLowerCase();});
    if(!prod&&unmatchedModels.indexOf(m.model)<0)unmatchedModels.push(m.model);
    (m.serials||[]).forEach(function(s){
      totalSerials++;
      // Use pre-parsed condition if client-side parser set it, otherwise detect from serial string
      var serialClean=s.serial||'';var condition=s.condition||'';
      if(!condition){var clean=cleanSerialAndFlag(serialClean);serialClean=clean.serial;condition=clean.condition;}
      var entry={model:m.model,plu:m.plu||'',serial:serialClean,condition:condition,invoice:s.invoice||'',date:s.date||'',cost:parseFloat(s.cost)||0,matched:!!prod};
      allSerials.push(entry);
      if(condition)conditionSerials.push(entry);
    });
  });

  var h='<div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:14px;">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px;">';
  h+='<div><div style="font-size:10px;font-weight:700;color:var(--gray-2);text-transform:uppercase;">Brand</div><div style="font-size:20px;font-weight:800;">'+(p.brand||'—')+'</div></div>';
  h+='<div style="display:flex;gap:12px;">';
  h+='<div><div style="font-size:10px;font-weight:700;color:var(--gray-2);text-transform:uppercase;">Models</div><div style="font-size:20px;font-weight:800;">'+models.length+'</div></div>';
  h+='<div><div style="font-size:10px;font-weight:700;color:var(--gray-2);text-transform:uppercase;">Serials</div><div style="font-size:20px;font-weight:800;color:var(--green);">'+totalSerials+'</div></div>';
  h+='<div><div style="font-size:10px;font-weight:700;color:var(--gray-2);text-transform:uppercase;">Condition Flagged</div><div style="font-size:20px;font-weight:800;color:#d97706;">'+conditionSerials.length+'</div></div>';
  h+='</div></div>';

  if(unmatchedModels.length){
    h+='<div style="padding:8px 12px;background:#fffbeb;border-left:3px solid #eab308;border-radius:4px;margin-bottom:8px;font-size:11px;color:#713f12;"><strong>'+unmatchedModels.length+' model'+(unmatchedModels.length===1?'':'s')+' not found in inventory</strong> — placeholder products will be created for: '+unmatchedModels.slice(0,6).join(', ')+(unmatchedModels.length>6?' +'+(unmatchedModels.length-6)+' more':'')+'</div>';
  }
  if(conditionSerials.length){
    h+='<details style="padding:8px 12px;background:#fffbeb;border-left:3px solid #d97706;border-radius:4px;margin-bottom:8px;font-size:11px;color:#713f12;"><summary style="cursor:pointer;font-weight:700;">'+conditionSerials.length+' condition-flagged serial'+(conditionSerials.length===1?'':'s')+' (click to expand)</summary>';
    h+='<div style="margin-top:6px;max-height:100px;overflow:auto;">';
    conditionSerials.slice(0,25).forEach(function(s){h+='<div style="padding:2px 0;font-family:monospace;font-size:10px;">'+s.serial+' — <span style="font-weight:700;">'+s.condition+'</span> ('+s.model+')</div>';});
    if(conditionSerials.length>25)h+='<div style="font-style:italic;color:var(--gray-3);">+'+(conditionSerials.length-25)+' more</div>';
    h+='</div></details>';
  }

  // Preview first 20 serials
  h+='<div style="font-size:11px;font-weight:700;margin-bottom:4px;">First 20 serials:</div>';
  h+='<div style="max-height:240px;overflow:auto;border:1px solid var(--border);border-radius:6px;margin-bottom:12px;"><table class="admin-table" style="font-size:10px;margin:0;"><thead><tr><th>Model</th><th>PLU</th><th>Serial #</th><th>Condition</th><th>Invoice</th><th>Date</th><th style="text-align:right;">Cost</th><th>Match</th></tr></thead><tbody>';
  allSerials.slice(0,20).forEach(function(s){
    var condBadge=s.condition?'<span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:3px;background:#fef3c7;color:#92400e;">'+s.condition+'</span>':'';
    var matchBadge=s.matched?'<span style="color:#16a34a;font-weight:700;">✓</span>':'<span style="color:#dc2626;font-weight:700;">New</span>';
    h+='<tr><td>'+s.model+'</td><td>'+s.plu+'</td><td style="font-family:monospace;">'+s.serial+'</td><td>'+condBadge+'</td><td>'+s.invoice+'</td><td>'+s.date+'</td><td style="text-align:right;">'+(s.cost?'$'+s.cost.toFixed(2):'')+'</td><td>'+matchBadge+'</td></tr>';
  });
  h+='</tbody></table></div>';

  h+='<div id="di-serial-progress" style="display:none;margin-bottom:10px;"><div style="background:var(--bg4);border-radius:100px;height:6px;overflow:hidden;"><div id="di-serial-bar" style="height:100%;width:0%;background:var(--green);transition:width 0.2s;"></div></div><div id="di-serial-progress-text" style="font-size:10px;color:var(--gray-2);margin-top:4px;text-align:center;"></div></div>';
  h+='<div style="display:flex;gap:8px;"><button class="primary-btn" onclick="diImportSerials()">Import '+totalSerials+' Serial Numbers</button><button class="ghost-btn" onclick="diCancelSerialImport()">Cancel</button></div>';
  h+='</div>';
  document.getElementById('di-serial-preview').innerHTML=h;
  document.getElementById('di-serial-preview').style.display='block';
  // Store flattened serials for import
  _diSerialParsed.flat=allSerials;
}

function diCancelSerialImport(){_diSerialParsed=null;document.getElementById('di-serial-preview').style.display='none';document.getElementById('di-serial-preview').innerHTML='';}

async function diImportSerials(){
  if(!_diSerialParsed||!_diSerialParsed.flat)return;
  var serials=_diSerialParsed.flat;
  var brand=_diSerialParsed.data.brand||'';
  document.getElementById('di-serial-progress').style.display='block';
  var bar=document.getElementById('di-serial-bar');
  var text=document.getElementById('di-serial-progress-text');

  var stats={imported:0,matched:0,placeholders:0,conditionFlagged:0,skipped:0};
  var placeholderIds={};

  for(var i=0;i<serials.length;i++){
    var s=serials[i];
    try{
      var prod=PRODUCTS.find(function(x){return (x.model||'').toLowerCase()===s.model.toLowerCase()||(x.sku||'').toLowerCase()===s.model.toLowerCase();});
      if(!prod){
        // Create placeholder unless we already made one this run
        if(placeholderIds[s.model.toLowerCase()]){
          prod=PRODUCTS.find(function(x){return x.id===placeholderIds[s.model.toLowerCase()];});
        }else{
          var newId=PRODUCTS.length+500+stats.placeholders;
          prod={id:newId,model:s.model,sku:s.model,name:s.model+' (Needs Details)',brand:brand,cat:'',price:0,cost:s.cost||0,stock:0,sold:0,reorderPt:2,reorderQty:3,sales30:0,serial:'',warranty:'1 Year',icon:'&#x1F4E6;',serialTracked:true,vendor:brand,upc:'',serialPool:[],needsDetails:true};
          PRODUCTS.push(prod);
          placeholderIds[s.model.toLowerCase()]=newId;
          stats.placeholders++;
        }
      }else{
        if(!stats._matchedModels)stats._matchedModels={};
        if(!stats._matchedModels[prod.id]){stats.matched++;stats._matchedModels[prod.id]=true;}
      }
      if(!prod.serialPool)prod.serialPool=[];
      // Check if serial already exists in pool
      var dup=prod.serialPool.find(function(x){return x.sn===s.serial;});
      if(dup){stats.skipped++;}
      else{
        var entry={sn:s.serial,status:'Available',receivedAt:s.date?new Date(s.date).toISOString():new Date().toISOString(),cost:s.cost,invoice:s.invoice,vendor:brand,importedFrom:'SmartTouch',importedAt:new Date().toISOString()};
        if(s.condition){entry.condition=s.condition;stats.conditionFlagged++;}
        prod.serialPool.push(entry);
        stats.imported++;
      }
    }catch(e){console.error('Serial import row failed:',e);}
    // Update progress
    var pct=Math.round(((i+1)/serials.length)*100);
    bar.style.width=pct+'%';
    text.textContent='Importing serial '+(i+1)+' of '+serials.length+'...';
    if(i%25===0)await new Promise(function(r){setTimeout(r,0);});
  }

  await saveProducts();
  delete stats._matchedModels;

  // Log import
  _diSerialImportHistory.unshift({
    date:new Date().toISOString(),
    file:_diSerialParsed.file,
    brand:brand,
    count:stats.imported,
    by:currentEmployee?currentEmployee.name:'Admin',
    stats:stats
  });
  await diSaveSerialImportHistory();

  text.textContent='Complete!';
  toast(stats.imported+' serials imported, '+stats.matched+' models matched'+(stats.placeholders?', '+stats.placeholders+' placeholders created':'')+(stats.conditionFlagged?', '+stats.conditionFlagged+' flagged':'')+(stats.skipped?', '+stats.skipped+' duplicates skipped':''),'success');
  setTimeout(function(){diCancelSerialImport();if(typeof renderInventory==='function')renderInventory();},1500);
}

async function diShowSerialImportHistory(){
  await diLoadSerialImportHistory();
  if(!_diSerialImportHistory.length){alert('No serial imports yet.');return;}
  var win=window.open('','_blank','width=720,height=600');
  var html='<!DOCTYPE html><html><head><title>Serial Import History</title><style>body{font-family:Arial,sans-serif;padding:20px;font-size:12px;}h1{font-size:18px;margin-bottom:14px;}table{width:100%;border-collapse:collapse;}th{background:#222;color:#fff;padding:7px 10px;font-size:10px;text-align:left;}td{padding:7px 10px;border-bottom:1px solid #ddd;}</style></head><body>';
  html+='<h1>Serial Number Import History</h1><table><thead><tr><th>Date</th><th>File</th><th>Brand</th><th>Imported</th><th>By</th><th>Details</th></tr></thead><tbody>';
  _diSerialImportHistory.forEach(function(h){
    var st=h.stats||{};
    var detail=(st.matched||0)+' matched, '+(st.placeholders||0)+' new placeholders, '+(st.conditionFlagged||0)+' condition flagged'+(st.skipped?', '+st.skipped+' skipped':'');
    html+='<tr><td>'+new Date(h.date).toLocaleString()+'</td><td>'+h.file+'</td><td>'+(h.brand||'—')+'</td><td>'+h.count+'</td><td>'+h.by+'</td><td style="font-size:11px;color:#666;">'+detail+'</td></tr>';
  });
  html+='</tbody></table></body></html>';
  win.document.write(html);win.document.close();
}

// ═══ ACCOUNTS RECEIVABLE ═══
function getCustomerBalance(custName){
  var custOrders=orders.filter(function(o){return o.customer===custName&&o.status!=='Quote';});
  var totalOwed=custOrders.reduce(function(s,o){return s+(o.total||0);},0);
  var c=customers.find(function(c){return c.name===custName;});
  var payments=(c&&c.payments)||[];
  var totalPaid=payments.reduce(function(s,p){return s+(p.amount||0);},0);
  return{owed:totalOwed,paid:totalPaid,balance:totalOwed-totalPaid,orders:custOrders,payments:payments};
}

function renderARReport(){
  var wrap=document.getElementById('ar-report-content');
  var now=new Date();
  var arList=[];
  customers.forEach(function(c){
    var bal=getCustomerBalance(c.name);
    if(bal.balance<=0)return;
    // Calculate oldest unpaid invoice date
    var oldest=null;
    bal.orders.forEach(function(o){if(!oldest||new Date(o.date)<oldest)oldest=new Date(o.date);});
    var daysOut=oldest?Math.floor((now-oldest)/(1000*60*60*24)):0;
    var lastPayment=bal.payments.length?bal.payments[bal.payments.length-1]:null;
    arList.push({name:c.name,balance:bal.balance,daysOut:daysOut,lastPayment:lastPayment,email:c.email||''});
  });
  if(!arList.length){wrap.innerHTML='<div class="admin-empty" style="padding:20px;">No open balances.</div>';return;}
  arList.sort(function(a,b){return b.balance-a.balance;});

  // Aging buckets
  var current=0,d30=0,d60=0,d90=0,d90p=0;
  arList.forEach(function(a){
    if(a.daysOut<=30)current+=a.balance;
    else if(a.daysOut<=60)d30+=a.balance;
    else if(a.daysOut<=90)d60+=a.balance;
    else d90p+=a.balance;
  });
  var total=arList.reduce(function(s,a){return s+a.balance;},0);

  var h='<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:16px;">';
  h+='<div style="background:#dcfce7;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:10px;font-weight:700;color:#166534;">CURRENT</div><div style="font-size:16px;font-weight:700;color:#166534;">'+fmt(current)+'</div></div>';
  h+='<div style="background:#fef9c3;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:10px;font-weight:700;color:#854d0e;">31-60 DAYS</div><div style="font-size:16px;font-weight:700;color:#854d0e;">'+fmt(d30)+'</div></div>';
  h+='<div style="background:#ffedd5;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:10px;font-weight:700;color:#9a3412;">61-90 DAYS</div><div style="font-size:16px;font-weight:700;color:#9a3412;">'+fmt(d60)+'</div></div>';
  h+='<div style="background:#fee2e2;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:10px;font-weight:700;color:#991b1b;">90+ DAYS</div><div style="font-size:16px;font-weight:700;color:#991b1b;">'+fmt(d90p)+'</div></div>';
  h+='<div style="background:var(--bg3);border:2px solid var(--border);border-radius:8px;padding:10px;text-align:center;"><div style="font-size:10px;font-weight:700;color:var(--gray-2);">TOTAL AR</div><div style="font-size:16px;font-weight:700;">'+fmt(total)+'</div></div>';
  h+='</div>';

  h+='<table class="admin-table"><thead><tr><th>Customer</th><th style="text-align:right;">Balance</th><th style="text-align:center;">Days Out</th><th>Last Payment</th><th style="width:140px;"></th></tr></thead><tbody>';
  arList.forEach(function(a){
    var aging=a.daysOut<=30?'color:var(--green);':a.daysOut<=60?'color:#854d0e;':a.daysOut<=90?'color:#9a3412;':'color:#991b1b;font-weight:700;';
    var lpStr=a.lastPayment?new Date(a.lastPayment.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})+' — '+fmt(a.lastPayment.amount):'Never';
    h+='<tr><td style="font-weight:600;">'+a.name+'</td><td style="text-align:right;font-weight:700;">'+fmt(a.balance)+'</td><td style="text-align:center;'+aging+'">'+a.daysOut+' days</td><td style="font-size:11px;">'+lpStr+'</td><td><button class="admin-card-btn edit" onclick="arRecordPayment(\''+a.name.replace(/'/g,"\\'")+'\')">Record Payment</button></td></tr>';
  });
  h+='</tbody></table>';
  wrap.innerHTML=h;
}

function arRecordPayment(custName){
  var c=customers.find(function(x){return x.name===custName;});if(!c)return;
  var amount=prompt('Payment amount for '+custName+':','');
  if(!amount)return;amount=parseFloat(amount);if(isNaN(amount)||amount<=0)return;
  var method=prompt('Payment method (Cash, Check, Card, Financing):','Check')||'Check';
  if(!c.payments)c.payments=[];
  c.payments.push({date:new Date().toISOString(),amount:amount,method:method.trim(),recordedBy:currentEmployee?currentEmployee.name:'Admin'});
  // Check if paid in full
  var bal=getCustomerBalance(custName);
  if(bal.balance<=0){
    // Mark all unpaid orders as Paid
    orders.forEach(function(o){if(o.customer===custName&&o.status!=='Quote'&&o.status!=='Paid in Full')o.status='Paid in Full';});
    saveOrders();
  }
  saveCustomers();renderARReport();toast('Payment of '+fmt(amount)+' recorded','success');
}

function exportARCSV(){
  var arList=[];
  customers.forEach(function(c){var bal=getCustomerBalance(c.name);if(bal.balance>0)arList.push({name:c.name,balance:bal.balance,email:c.email||''});});
  if(!arList.length){toast('No AR data','error');return;}
  var csv='Customer,Balance,Email\n';
  arList.forEach(function(a){csv+='"'+a.name+'",'+a.balance.toFixed(2)+',"'+a.email+'"\n';});
  var blob=new Blob([csv],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='accounts-receivable.csv';a.click();
  toast('CSV exported','success');
}

function exportARPDF(){
  var arList=[];var now=new Date();
  customers.forEach(function(c){var bal=getCustomerBalance(c.name);if(bal.balance<=0)return;var oldest=null;bal.orders.forEach(function(o){if(!oldest||new Date(o.date)<oldest)oldest=new Date(o.date);});arList.push({name:c.name,balance:bal.balance,daysOut:oldest?Math.floor((now-oldest)/(1000*60*60*24)):0});});
  if(!arList.length){toast('No AR data','error');return;}
  arList.sort(function(a,b){return b.balance-a.balance;});
  var total=arList.reduce(function(s,a){return s+a.balance;},0);
  var win=window.open('','_blank');
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>AR Report</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;font-size:12px;padding:16px;}.hdr{border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:14px;display:flex;justify-content:space-between;}.hdr h1{font-size:16px;}table{width:100%;border-collapse:collapse;}th{background:#222;color:#fff;font-size:10px;padding:6px 10px;text-align:left;}td{padding:8px 10px;border-bottom:1px solid #ddd;}.total{font-weight:700;font-size:14px;text-align:right;margin-top:12px;}@media print{@page{margin:10mm;}}</style></head><body>';
  html+='<div class="hdr" style="text-align:center;flex-direction:column;"><img src="'+DC_APPLIANCE_LOGO+'" style="max-width:180px;height:auto;margin:0 auto 8px;" alt="DC Appliance"/><h1>DC Appliance — Accounts Receivable</h1><div style="font-size:10px;color:#666;">'+now.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})+'</div><div style="font-size:10px;color:#666;margin-top:4px;">(620) 371-6417</div></div>';
  html+='<table><thead><tr><th>Customer</th><th style="text-align:right;">Balance</th><th style="text-align:center;">Days Out</th></tr></thead><tbody>';
  arList.forEach(function(a){html+='<tr><td>'+a.name+'</td><td style="text-align:right;font-weight:700;">$'+a.balance.toFixed(2)+'</td><td style="text-align:center;">'+a.daysOut+'</td></tr>';});
  html+='</tbody></table><div class="total">Total AR: $'+total.toFixed(2)+'</div></body></html>';
  win.document.write(html);win.document.close();setTimeout(function(){win.print();},400);
}

// ═══ END OF MONTH REPORTS ═══
function renderEomReports(){
  var monthEl=document.getElementById('eom-month');
  if(!monthEl.value){var now=new Date();monthEl.value=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');}
  var ym=monthEl.value;
  var monthLabel=new Date(ym+'-15').toLocaleDateString('en-US',{month:'long',year:'numeric'});
  var wrap=document.getElementById('eom-content');

  var h='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">';

  // 1. Commission Report card
  h+='<div style="border:1px solid var(--border);border-radius:8px;padding:14px;cursor:pointer;" onclick="selectAdminSection2(\'commreport\',\''+ym+'\')">';
  h+='<div style="font-size:14px;font-weight:700;margin-bottom:4px;">Commission Report</div>';
  h+='<div style="font-size:11px;color:var(--gray-2);">Delivered products grouped by salesperson, commission per item</div></div>';

  // 2. Spiffs Report card
  h+='<div style="border:1px solid var(--border);border-radius:8px;padding:14px;">';
  h+='<div style="font-size:14px;font-weight:700;margin-bottom:4px;">Spiffs Report</div>';
  h+='<div style="font-size:11px;color:var(--gray-2);margin-bottom:8px;">Spiff bonuses per employee for '+monthLabel+'</div>';
  h+=eomSpiffsHtml(ym);
  h+='<div style="margin-top:6px;"><button class="ghost-btn" style="font-size:10px;padding:3px 10px;" onclick="exportEomCSV(\'spiffs\',\''+ym+'\')">CSV</button></div></div>';

  // 3. Sales Tax Report card
  h+='<div style="border:1px solid var(--border);border-radius:8px;padding:14px;">';
  h+='<div style="font-size:14px;font-weight:700;margin-bottom:4px;">Sales Tax Report</div>';
  h+='<div style="font-size:11px;color:var(--gray-2);margin-bottom:8px;">Tax on delivered products by jurisdiction</div>';
  h+=eomSalesTaxHtml(ym);
  h+='<div style="margin-top:6px;"><button class="ghost-btn" style="font-size:10px;padding:3px 10px;" onclick="exportEomCSV(\'salestax\',\''+ym+'\')">CSV</button> <button class="ghost-btn" style="font-size:10px;padding:3px 10px;" onclick="exportEomPDF(\'salestax\',\''+ym+'\')">PDF</button></div></div>';

  // 4. Inventory Report card
  h+='<div style="border:1px solid var(--border);border-radius:8px;padding:14px;">';
  h+='<div style="font-size:14px;font-weight:700;margin-bottom:4px;">Inventory Report</div>';
  h+='<div style="font-size:11px;color:var(--gray-2);margin-bottom:8px;">Stock levels and sold units</div>';
  h+=eomInventoryHtml(ym);
  h+='<div style="margin-top:6px;"><button class="ghost-btn" style="font-size:10px;padding:3px 10px;" onclick="exportEomCSV(\'inventory\',\''+ym+'\')">CSV</button> <button class="ghost-btn" style="font-size:10px;padding:3px 10px;" onclick="exportEomPDF(\'inventory\',\''+ym+'\')">PDF</button></div></div>';

  // 5. AR Summary card
  h+='<div style="border:1px solid var(--border);border-radius:8px;padding:14px;">';
  h+='<div style="font-size:14px;font-weight:700;margin-bottom:4px;">AR Summary</div>';
  h+='<div style="font-size:11px;color:var(--gray-2);margin-bottom:8px;">Open balances and aging</div>';
  var totalAR=0;customers.forEach(function(c){var b=getCustomerBalance(c.name);if(b.balance>0)totalAR+=b.balance;});
  h+='<div style="font-size:20px;font-weight:700;color:var(--red);">'+fmt(totalAR)+'</div>';
  h+='<div style="font-size:11px;color:var(--gray-2);">total outstanding</div>';
  h+='<div style="margin-top:6px;"><button class="ghost-btn" style="font-size:10px;padding:3px 10px;" onclick="selectAdminSection2(\'arreport\')">View Full Report</button></div></div>';

  // 6. Overtime Commission card
  h+='<div style="border:1px solid var(--border);border-radius:8px;padding:14px;">';
  h+='<div style="font-size:14px;font-weight:700;margin-bottom:4px;">Overtime Commission</div>';
  h+='<div style="font-size:11px;color:var(--gray-2);margin-bottom:8px;">Employees over 40 hrs/week — awaiting calculation formula</div>';
  h+='<div style="font-size:12px;color:var(--orange);font-weight:600;">Formula pending upload</div></div>';

  // 7. Warranty Report card
  h+='<div style="border:1px solid var(--border);border-radius:8px;padding:14px;">';
  h+='<div style="font-size:14px;font-weight:700;margin-bottom:4px;">Warranty Report</div>';
  h+='<div style="font-size:11px;color:var(--gray-2);margin-bottom:8px;">Extended warranty sales, declines, and acceptance rates</div>';
  h+=eomWarrantyHtml(ym);
  h+='<div style="margin-top:6px;"><button class="ghost-btn" style="font-size:10px;padding:3px 10px;" onclick="exportWarrantyCSV(\''+ym+'\')">CSV</button> <button class="ghost-btn" style="font-size:10px;padding:3px 10px;" onclick="exportWarrantyPDF(\''+ym+'\')">PDF</button></div></div>';

  h+='</div>';
  wrap.innerHTML=h;
}

function selectAdminSection2(section,ym){
  var items=document.querySelectorAll('.admin-menu-item');
  items.forEach(function(el){el.classList.remove('active');
    if(el.textContent.trim().replace(/\s+/g,' ').indexOf(section==='commreport'?'Commission Report':section==='arreport'?'Accounts Receivable':'')!==-1)el.classList.add('active');
  });
  adminSection=section;
  document.querySelectorAll('.admin-panel').forEach(function(p){p.classList.remove('active');});
  var panel=document.getElementById('admin-panel-'+section);if(panel)panel.classList.add('active');
  if(ym&&section==='commreport'){var me=document.getElementById('comm-report-month');if(me)me.value=ym;}
  renderAdminSection();
}

function eomSpiffsHtml(ym){
  // Spiffs: look for items with spiff field on delivered items
  var spiffData=[];
  orders.forEach(function(o){if(o.status==='Quote')return;o.items.forEach(function(item){if(!item.delivered)return;var dAt=(item.deliveredAt||o.date||'').slice(0,7);if(dAt!==ym)return;if(item.spiff){spiffData.push({clerk:o.clerk||'Unknown',product:item.name,spiff:item.spiff});}});});
  if(!spiffData.length)return '<div style="font-size:11px;color:var(--gray-3);">No spiff bonuses this month</div>';
  var h='<table class="admin-table" style="font-size:10px;margin:0;"><thead><tr><th>Employee</th><th>Product</th><th style="text-align:right;">Spiff</th></tr></thead><tbody>';
  spiffData.forEach(function(d){h+='<tr><td>'+d.clerk+'</td><td>'+d.product+'</td><td style="text-align:right;">'+fmt(d.spiff)+'</td></tr>';});
  h+='</tbody></table>';return h;
}

function eomSalesTaxHtml(ym){
  var taxData={};
  orders.forEach(function(o){
    if(o.status==='Quote')return;
    var hasDelivered=o.items.some(function(i){return !!i.delivered;});
    if(!hasDelivered)return;
    var oMonth=(o.date||'').slice(0,7);
    // Use delivered items' month
    var deliveredTotal=0;
    o.items.forEach(function(i){if(i.delivered){var dm=(i.deliveredAt||o.date||'').slice(0,7);if(dm===ym)deliveredTotal+=i.price*i.qty;}});
    if(deliveredTotal<=0)return;
    var zone=o.taxZone||'Default';
    var rate=o.tax&&o.subtotal?(o.tax/o.subtotal):0;
    var taxAmt=deliveredTotal*rate;
    if(!taxData[zone])taxData[zone]={taxable:0,tax:0,rate:rate};
    taxData[zone].taxable+=deliveredTotal;taxData[zone].tax+=taxAmt;
  });
  var zones=Object.keys(taxData);
  if(!zones.length)return '<div style="font-size:11px;color:var(--gray-3);">No taxable deliveries this month</div>';
  var h='<table class="admin-table" style="font-size:10px;margin:0;"><thead><tr><th>Zone</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Taxable</th><th style="text-align:right;">Tax</th></tr></thead><tbody>';
  var totalTax=0;
  zones.forEach(function(z){var d=taxData[z];totalTax+=d.tax;h+='<tr><td>'+z+'</td><td style="text-align:right;">'+(d.rate*100).toFixed(3)+'%</td><td style="text-align:right;">'+fmt(d.taxable)+'</td><td style="text-align:right;font-weight:700;">'+fmt(d.tax)+'</td></tr>';});
  h+='<tr style="font-weight:700;background:var(--bg3);"><td colspan="3">Total Tax Collected</td><td style="text-align:right;">'+fmt(totalTax)+'</td></tr>';
  h+='</tbody></table>';return h;
}

function eomInventoryHtml(ym){
  var active=PRODUCTS.filter(function(p){return p.active!==false;});
  if(!active.length)return '<div style="font-size:11px;color:var(--gray-3);">No inventory data</div>';
  // Calculate month-specific sold counts from orders
  var monthSold={};
  orders.forEach(function(o){
    if(o.status==='Quote')return;
    var om=(o.date||'').slice(0,7);
    if(om!==ym)return;
    (o.items||[]).forEach(function(i){monthSold[i.id]=(monthSold[i.id]||0)+(i.qty||0);});
  });
  var totalStock=0,totalSoldMonth=0,totalAvail=0,totalInvValue=0,totalSoldValue=0;
  active.forEach(function(p){
    var stock=p.stock||0;
    var sold=monthSold[p.id]||0;
    totalStock+=stock;
    totalSoldMonth+=sold;
    totalAvail+=Math.max(0,stock-sold);
    totalInvValue+=stock*(p.cost||0);
    totalSoldValue+=sold*(p.price||0);
  });
  var h='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">';
  h+='<div style="padding:6px 0;"><div style="color:var(--gray-3);font-size:9px;font-weight:700;text-transform:uppercase;">Units in Stock</div><div style="font-size:18px;font-weight:700;">'+totalStock.toLocaleString()+'</div></div>';
  h+='<div style="padding:6px 0;"><div style="color:var(--gray-3);font-size:9px;font-weight:700;text-transform:uppercase;">Units Sold</div><div style="font-size:18px;font-weight:700;">'+totalSoldMonth.toLocaleString()+'</div></div>';
  h+='<div style="padding:6px 0;"><div style="color:var(--gray-3);font-size:9px;font-weight:700;text-transform:uppercase;">Units Available</div><div style="font-size:18px;font-weight:700;">'+totalAvail.toLocaleString()+'</div></div>';
  h+='<div style="padding:6px 0;"><div style="color:var(--gray-3);font-size:9px;font-weight:700;text-transform:uppercase;">Inventory Value</div><div style="font-size:18px;font-weight:700;">'+fmt(totalInvValue)+'</div></div>';
  h+='<div style="padding:6px 0;grid-column:1/-1;"><div style="color:var(--gray-3);font-size:9px;font-weight:700;text-transform:uppercase;">Sold Value (Retail)</div><div style="font-size:18px;font-weight:700;color:var(--green);">'+fmt(totalSoldValue)+'</div></div>';
  h+='</div>';
  return h;
}

function exportEomCSV(type,ym){
  var csv='';
  if(type==='salestax'){
    csv='Zone,Rate,Taxable Sales,Tax Collected\n';
    // Rebuild data
    var taxData={};
    orders.forEach(function(o){if(o.status==='Quote')return;var deliveredTotal=0;o.items.forEach(function(i){if(i.delivered){var dm=(i.deliveredAt||o.date||'').slice(0,7);if(dm===ym)deliveredTotal+=i.price*i.qty;}});if(deliveredTotal<=0)return;var zone=o.taxZone||'Default';var rate=o.tax&&o.subtotal?(o.tax/o.subtotal):0;var taxAmt=deliveredTotal*rate;if(!taxData[zone])taxData[zone]={taxable:0,tax:0,rate:rate};taxData[zone].taxable+=deliveredTotal;taxData[zone].tax+=taxAmt;});
    Object.keys(taxData).forEach(function(z){var d=taxData[z];csv+='"'+z+'",'+(d.rate*100).toFixed(3)+','+d.taxable.toFixed(2)+','+d.tax.toFixed(2)+'\n';});
  }else if(type==='inventory'){
    var monthSold={};
    orders.forEach(function(o){if(o.status==='Quote')return;var om=(o.date||'').slice(0,7);if(om!==ym)return;(o.items||[]).forEach(function(i){monthSold[i.id]=(monthSold[i.id]||0)+(i.qty||0);});});
    var tStock=0,tSold=0,tAvail=0,tInvVal=0,tSoldVal=0;
    PRODUCTS.filter(function(p){return p.active!==false;}).forEach(function(p){var s=p.stock||0;var sld=monthSold[p.id]||0;tStock+=s;tSold+=sld;tAvail+=Math.max(0,s-sld);tInvVal+=s*(p.cost||0);tSoldVal+=sld*(p.price||0);});
    csv='Metric,Value\n';
    csv+='"Total Units in Stock",'+tStock+'\n';
    csv+='"Total Units Sold",'+tSold+'\n';
    csv+='"Total Units Available",'+tAvail+'\n';
    csv+='"Total Inventory Value",'+tInvVal.toFixed(2)+'\n';
    csv+='"Total Sold Value (Retail)",'+tSoldVal.toFixed(2)+'\n';
  }else if(type==='spiffs'){
    csv='Employee,Product,Spiff Amount\n';
    orders.forEach(function(o){if(o.status==='Quote')return;o.items.forEach(function(item){if(!item.delivered)return;var dAt=(item.deliveredAt||o.date||'').slice(0,7);if(dAt!==ym||!item.spiff)return;csv+='"'+(o.clerk||'')+'","'+item.name+'",'+item.spiff+'\n';});});
  }
  if(!csv||csv.split('\n').length<=2){toast('No data to export','error');return;}
  var blob=new Blob([csv],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=type+'-report-'+ym+'.csv';a.click();toast('CSV exported','success');
}

function exportEomPDF(type,ym){
  if(type==='salestax'){
    var taxData={};
    orders.forEach(function(o){if(o.status==='Quote')return;var deliveredTotal=0;o.items.forEach(function(i){if(i.delivered){var dm=(i.deliveredAt||o.date||'').slice(0,7);if(dm===ym)deliveredTotal+=i.price*i.qty;}});if(deliveredTotal<=0)return;var zone=o.taxZone||'Default';var rate=o.tax&&o.subtotal?(o.tax/o.subtotal):0;var taxAmt=deliveredTotal*rate;if(!taxData[zone])taxData[zone]={taxable:0,tax:0,rate:rate};taxData[zone].taxable+=deliveredTotal;taxData[zone].tax+=taxAmt;});
    var zones=Object.keys(taxData);if(!zones.length){toast('No data','error');return;}
    var totalTax=zones.reduce(function(s,z){return s+taxData[z].tax;},0);
    var monthLabel=new Date(ym+'-15').toLocaleDateString('en-US',{month:'long',year:'numeric'});
    var win=window.open('','_blank');
    var html='<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Sales Tax Report</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;font-size:12px;padding:16px;}.hdr{border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:14px;display:flex;justify-content:space-between;}.hdr h1{font-size:16px;}table{width:100%;border-collapse:collapse;}th{background:#222;color:#fff;font-size:10px;padding:6px 10px;text-align:left;}td{padding:8px 10px;border-bottom:1px solid #ddd;}@media print{@page{margin:10mm;}}</style></head><body>';
    html+='<div class="hdr" style="text-align:center;flex-direction:column;"><img src="'+DC_APPLIANCE_LOGO+'" style="max-width:180px;height:auto;margin:0 auto 8px;" alt="DC Appliance"/><h1>DC Appliance — Sales Tax Report</h1><div style="font-size:11px;color:#666;">'+monthLabel+'</div><div style="font-size:10px;color:#666;margin-top:4px;">(620) 371-6417</div></div>';
    html+='<table><thead><tr><th>Zone</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Taxable Sales</th><th style="text-align:right;">Tax Collected</th></tr></thead><tbody>';
    zones.forEach(function(z){var d=taxData[z];html+='<tr><td>'+z+'</td><td style="text-align:right;">'+(d.rate*100).toFixed(3)+'%</td><td style="text-align:right;">$'+d.taxable.toFixed(2)+'</td><td style="text-align:right;font-weight:700;">$'+d.tax.toFixed(2)+'</td></tr>';});
    html+='<tr style="font-weight:700;background:#f5f5f5;"><td colspan="3">Total</td><td style="text-align:right;">$'+totalTax.toFixed(2)+'</td></tr>';
    html+='</tbody></table></body></html>';
    win.document.write(html);win.document.close();setTimeout(function(){win.print();},400);
  }else if(type==='inventory'){
    var monthSold={};
    orders.forEach(function(o){if(o.status==='Quote')return;var om=(o.date||'').slice(0,7);if(om!==ym)return;(o.items||[]).forEach(function(i){monthSold[i.id]=(monthSold[i.id]||0)+(i.qty||0);});});
    var tStock=0,tSold=0,tAvail=0,tInvVal=0,tSoldVal=0;
    PRODUCTS.filter(function(p){return p.active!==false;}).forEach(function(p){var s=p.stock||0;var sld=monthSold[p.id]||0;tStock+=s;tSold+=sld;tAvail+=Math.max(0,s-sld);tInvVal+=s*(p.cost||0);tSoldVal+=sld*(p.price||0);});
    var monthLabel=new Date(ym+'-15').toLocaleDateString('en-US',{month:'long',year:'numeric'});
    var win=window.open('','_blank');
    var html='<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Inventory Report</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;font-size:12px;padding:16px;}.hdr{border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:14px;text-align:center;}.hdr h1{font-size:16px;}table{width:100%;border-collapse:collapse;margin-top:10px;}th{background:#222;color:#fff;font-size:10px;padding:8px 12px;text-align:left;}td{padding:10px 12px;border-bottom:1px solid #ddd;font-size:13px;}td.val{text-align:right;font-weight:700;}@media print{@page{margin:10mm;}}</style></head><body>';
    html+='<div class="hdr"><img src="'+DC_APPLIANCE_LOGO+'" style="max-width:180px;height:auto;margin:0 auto 8px;" alt="DC Appliance"/><h1>DC Appliance — Inventory Report</h1><div style="font-size:11px;color:#666;">'+monthLabel+'</div><div style="font-size:10px;color:#666;margin-top:4px;">(620) 371-6417</div></div>';
    html+='<table><thead><tr><th>Metric</th><th style="text-align:right;">Value</th></tr></thead><tbody>';
    html+='<tr><td>Total Units in Stock</td><td class="val">'+tStock.toLocaleString()+'</td></tr>';
    html+='<tr><td>Total Units Sold</td><td class="val">'+tSold.toLocaleString()+'</td></tr>';
    html+='<tr><td>Total Units Available</td><td class="val">'+tAvail.toLocaleString()+'</td></tr>';
    html+='<tr><td>Total Inventory Value (at cost)</td><td class="val">$'+tInvVal.toFixed(2)+'</td></tr>';
    html+='<tr style="background:#f0fdf4;"><td><strong>Total Sold Value (at retail)</strong></td><td class="val" style="color:#16a34a;">$'+tSoldVal.toFixed(2)+'</td></tr>';
    html+='</tbody></table></body></html>';
    win.document.write(html);win.document.close();setTimeout(function(){win.print();},400);
  }
}

// Commission is now global per-category, managed in POS Settings
function adminResetPin(i){
  var u=adminUsers[i];
  var pin=prompt('New 4-digit PIN for '+u.name+':',u.pin||'');
  if(!pin)return;
  if(pin.length!==4||isNaN(pin)){toast('PIN must be 4 digits','error');return;}
  if(adminUsers.find(function(x,j){return j!==i&&x.pin===pin;})){toast('PIN already in use','error');return;}
  u.pin=pin;renderAdminUsers();saveAllUsers().then(function(){toast(u.name+' PIN updated','success');});
}
function adminDeleteUser(i){
  if(!confirm('Delete "'+adminUsers[i].name+'"?'))return;
  adminUsers.splice(i,1);renderAdminUsers();saveAllUsers();
}

// --- POS Settings ---
// ═══ STORE SETTINGS (Appliance OS multi-tenant) ═══
function renderStoreSettings(){
  var s=currentStore||{};
  var setVal=function(id,v){var el=document.getElementById(id);if(el)el.value=v||'';};
  setVal('ss-store-id',s.store_id||1);
  setVal('ss-subdomain',s.subdomain||'dcappliance');
  document.getElementById('ss-store-id').textContent=s.store_id||1;
  document.getElementById('ss-subdomain').textContent=s.subdomain||'dcappliance';
  setVal('ss-name',s.store_name);
  setVal('ss-tagline',s.tagline);
  setVal('ss-address',s.address);
  setVal('ss-city',s.city);setVal('ss-state',s.state);setVal('ss-zip',s.zip);
  setVal('ss-phone',s.phone);setVal('ss-email',s.email);
  setVal('ss-hours',s.store_hours);
  setVal('ss-logo',s.logo_url);
  // Show logo preview
  var prev=document.getElementById('ss-logo-preview-img');
  if(prev&&s.logo_url){prev.src=s.logo_url;prev.style.display='block';prev.onerror=function(){prev.style.display='none';};}
  setVal('ss-color',s.primary_color||'#2563eb');
  setVal('ss-tax-county',s.tax_county);
  setVal('ss-tax-rate',((s.tax_rate||0)*100).toFixed(3));
  setVal('ss-invmsg',s.invoice_message);
  setVal('ss-delivery-terms',s.delivery_terms);
  setVal('ss-rent',s.rent_amount||0);
  setVal('ss-landlord',s.landlord_name);
  setVal('ss-cc-names',s.credit_card_names);
  setVal('ss-bank-names',s.bank_names);
  setVal('ss-tier',s.subscription_tier||'enterprise');
  setVal('ss-status',s.subscription_status||'active');
  // Require Serial Pool toggle
  var rp=document.getElementById('ss-require-pool');if(rp)rp.checked=!!s.require_serial_pool;
}

async function uploadStoreLogo(file){
  if(!file)return;
  var status=document.getElementById('ss-logo-upload-status');
  status.innerHTML='<span style="color:#2563eb;">Uploading logo...</span>';
  try{
    var b64=await new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result.split(',')[1]);};r.onerror=rej;r.readAsDataURL(file);});
    // Use delivery-photo-upload (Vercel Blob) — stored as logos/{store_id}/logo.{ext}
    var ext=(file.name.split('.').pop()||'png').toLowerCase();
    var safeName='logo-'+Date.now()+'.'+ext;
    var res=await apiFetch('/api/delivery-photo-upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:safeName,contentType:file.type,data:b64,deliveryId:'store-'+currentStoreId+'-logo'})});
    var data=await res.json();
    if(!data.ok)throw new Error(data.error||'Upload failed');
    document.getElementById('ss-logo').value=data.url;
    var prev=document.getElementById('ss-logo-preview-img');
    prev.src=data.url;prev.style.display='block';
    status.innerHTML='<span style="color:#16a34a;">&#x2713; Logo uploaded — click Save Store Settings to apply</span>';
  }catch(e){
    status.innerHTML='<span style="color:#dc2626;">Upload failed: '+e.message+'</span>';
  }
}

async function saveStoreSettings(){
  var getVal=function(id){var el=document.getElementById(id);return el?el.value.trim():'';};
  currentStore.store_name=getVal('ss-name');
  currentStore.tagline=getVal('ss-tagline');
  currentStore.address=getVal('ss-address');
  currentStore.city=getVal('ss-city');currentStore.state=getVal('ss-state');currentStore.zip=getVal('ss-zip');
  currentStore.phone=getVal('ss-phone');currentStore.email=getVal('ss-email');
  currentStore.store_hours=getVal('ss-hours');
  currentStore.logo_url=getVal('ss-logo');
  currentStore.primary_color=getVal('ss-color')||'#2563eb';
  currentStore.tax_county=getVal('ss-tax-county');
  currentStore.tax_rate=(parseFloat(getVal('ss-tax-rate'))||0)/100;
  currentStore.invoice_message=getVal('ss-invmsg');
  currentStore.delivery_terms=getVal('ss-delivery-terms');
  currentStore.rent_amount=parseFloat(getVal('ss-rent'))||0;
  currentStore.landlord_name=getVal('ss-landlord');
  currentStore.credit_card_names=getVal('ss-cc-names');
  currentStore.bank_names=getVal('ss-bank-names');
  currentStore.require_serial_pool=(document.getElementById('ss-require-pool')||{}).checked||false;
  var ok=await saveStoreConfig();
  if(ok){adminInvoiceMessage=currentStore.invoice_message;toast('Store settings saved','success');}
  else{toast('Save failed','error');}
}

function renderPosSettings(){
  document.getElementById('admin-invoice-msg').value=adminInvoiceMessage;
  document.getElementById('admin-delivery-price').value=adminDeliveryPrice;
  var sel=document.getElementById('admin-inactivity-timeout');
  if(sel)sel.value=String(adminInactivityMinutes);
  hbRenderEditor();
  commRenderEditor();
}
async function savePosSettings(){
  adminInvoiceMessage=document.getElementById('admin-invoice-msg').value.trim();
  adminDeliveryPrice=parseFloat(document.getElementById('admin-delivery-price').value)||79.99;
  var sel=document.getElementById('admin-inactivity-timeout');
  if(sel)adminInactivityMinutes=parseInt(sel.value)||0;
  PIN_TIMEOUT_MS=adminInactivityMinutes*60*1000;
  resetInactivity();
  try{localStorage.setItem('pos-admin-invoice-msg',adminInvoiceMessage);localStorage.setItem('pos-admin-delivery-price',String(adminDeliveryPrice));}catch(e){}
  try{
    await apiFetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'pos-settings',data:{invoiceMessage:adminInvoiceMessage,deliveryPrice:adminDeliveryPrice,inactivityMinutes:adminInactivityMinutes}})});
    toast('POS settings saved','success');
  }catch(e){toast('Save failed','error');}
}

// ── Commission Rates (Global by Category + Brand Overrides) ──
var commCategoryRates={};
var commBrandOverrides={};
var _commLoaded=false;

async function commLoad(){
  if(_commLoaded)return;
  try{var r=await apiFetch('/api/admin-get?key=commission-rates');var d=await r.json();
    if(d&&d.data){commCategoryRates=d.data.categories||{};commBrandOverrides=d.data.brands||{};}
  }catch(e){}
  _commLoaded=true;
}
async function commSaveRates(){
  commReadEditor();
  try{
    await apiFetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'commission-rates',data:{categories:commCategoryRates,brands:commBrandOverrides}})});
    toast('Commission rates saved','success');
    var btn=document.getElementById('comm-save-btn');
    if(btn){btn.textContent='Saved!';btn.style.background='#16a34a';setTimeout(function(){btn.textContent='Save Commission Rates';btn.style.background='';},2000);}
  }catch(e){toast('Failed to save commission rates','error');}
}
function commReadEditor(){
  commCategoryRates={};
  document.querySelectorAll('.comm-cat-inp').forEach(function(inp){
    var cat=inp.getAttribute('data-cat');
    var val=parseFloat(inp.value)||0;
    if(val>0)commCategoryRates[cat]=val;
  });
}
function commRenderEditor(){
  commLoad().then(function(){
    var wrap=document.getElementById('comm-cat-editor');if(!wrap)return;
    var byDept={};
    adminCategories.forEach(function(cat){
      var d=(typeof cat==='string')?'Uncategorized':(cat.dept||'Uncategorized');
      var n=(typeof cat==='string')?cat:cat.name;
      if(!byDept[d])byDept[d]=[];
      byDept[d].push(n);
    });
    var h='';
    Object.keys(byDept).sort().forEach(function(dept){
      h+='<div style="margin-bottom:12px;">';
      h+='<div style="font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #e5e7eb;">'+dept+'</div>';
      h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;">';
      byDept[dept].forEach(function(catName){
        var val=commCategoryRates[catName]||'';
        h+='<div style="display:flex;align-items:center;gap:6px;">'
          +'<label style="flex:1;font-size:12px;color:#374151;">'+catName+'</label>'
          +'<div style="display:flex;align-items:center;gap:2px;"><input class="inp comm-cat-inp" data-cat="'+catName+'" type="number" step="0.5" min="0" max="100" value="'+val+'" style="width:65px;padding:4px 6px;font-size:12px;text-align:right;"/><span style="font-size:11px;color:#6b7280;">%</span></div></div>';
      });
      h+='</div></div>';
    });
    wrap.innerHTML=h;
    commRenderBrands();
  });
}
function commRenderBrands(){
  var el=document.getElementById('comm-brand-list');if(!el)return;
  var brands=Object.keys(commBrandOverrides);
  if(!brands.length){el.innerHTML='<div style="font-size:12px;color:#9ca3af;">No brand overrides set.</div>';return;}
  var h='<table class="admin-table" style="font-size:12px;"><thead><tr><th>Brand</th><th>Rate</th><th style="width:60px;"></th></tr></thead><tbody>';
  brands.sort().forEach(function(b){
    h+='<tr><td style="font-weight:600;">'+b+'</td><td>'+commBrandOverrides[b]+'%</td><td><button class="admin-card-btn delete" onclick="commRemoveBrand(\''+b.replace(/'/g,"\\'")+'\')">Remove</button></td></tr>';
  });
  h+='</tbody></table>';
  el.innerHTML=h;
}
function commAddBrandOverride(){
  var name=(document.getElementById('comm-brand-name').value||'').trim();
  var rate=parseFloat(document.getElementById('comm-brand-rate').value)||0;
  if(!name){toast('Enter a brand name','error');return;}
  if(rate<=0){toast('Enter a commission rate','error');return;}
  commBrandOverrides[name]=rate;
  document.getElementById('comm-brand-name').value='';
  document.getElementById('comm-brand-rate').value='';
  commRenderBrands();
}
function commRemoveBrand(name){
  delete commBrandOverrides[name];
  commRenderBrands();
}
function commSetAllCats(){
  var val=prompt('Set all categories to what %?','5');
  if(val===null)return;
  var n=parseFloat(val)||0;
  document.querySelectorAll('.comm-cat-inp').forEach(function(inp){inp.value=n||'';});
}
function commClearAllCats(){
  document.querySelectorAll('.comm-cat-inp').forEach(function(inp){inp.value='';});
}
function commGetRate(cat,brand){
  // Brand override takes priority
  if(brand&&commBrandOverrides[brand])return commBrandOverrides[brand]/100;
  if(commCategoryRates[cat])return commCategoryRates[cat]/100;
  return 0;
}

// ── Hot Buttons Editor ──
async function hbLoad(){
  if(_hotButtonsLoaded)return;
  try{var r=await apiFetch('/api/admin-get?key=hot-buttons');var d=await r.json();if(d&&d.data&&Array.isArray(d.data)&&d.data.length)hotButtons=d.data;}catch(e){}
  // Ensure always 13 slots
  while(hotButtons.length<13)hotButtons.push({label:'',type:'charge',chargeName:'',amount:0,itemModel:'',active:false});
  _hotButtonsLoaded=true;
}
function hbSave(){
  hbReadEditor();
  adminSave('hot-buttons',hotButtons);
  renderHotBar();
  toast('Hot buttons saved','success');
}
function hbReadEditor(){
  var slots=document.querySelectorAll('.hb-slot');
  var updated=[];
  slots.forEach(function(slot){
    var idx=parseInt(slot.getAttribute('data-idx'));
    var b=hotButtons[idx]||{};
    b.label=(slot.querySelector('.hb-label-inp')||{}).value||'';
    b.type=(slot.querySelector('.hb-type-sel')||{}).value||'charge';
    b.amount=parseFloat((slot.querySelector('.hb-amt-inp')||{}).value)||0;
    b.chargeName=b.label;
    var itemInp=slot.querySelector('.hb-item-search-inp');
    if(itemInp)b.itemModel=itemInp.getAttribute('data-model')||'';
    var catSel=slot.querySelector('.hb-cat-sel');
    if(catSel)b.category=catSel.value||'';
    b.active=!!(slot.querySelector('.hb-toggle input')||{}).checked;
    updated.push(b);
  });
  hotButtons=updated;
  while(hotButtons.length<13)hotButtons.push({label:'',type:'charge',chargeName:'',amount:0,itemModel:'',active:false});
}

var _hbDragIdx=-1;
function hbRenderEditor(){
  hbLoad().then(function(){
    var wrap=document.getElementById('hb-editor-slots');if(!wrap)return;
    wrap.innerHTML=hotButtons.slice(0,13).map(function(b,i){
      var isCharge=b.type==='charge'||!b.type;
      var isItem=b.type==='item';
      var isCat=b.type==='category';
      var itemName='';
      if(isItem&&b.itemModel){var p=PRODUCTS.find(function(x){return x.model===b.itemModel;});if(p)itemName=p.model+' — '+p.name;}
      return '<div class="hb-slot" data-idx="'+i+'" draggable="true" ondragstart="hbDragStart(event,'+i+')" ondragover="hbDragOver(event)" ondragenter="hbDragEnter(event)" ondragleave="hbDragLeave(event)" ondrop="hbDrop(event,'+i+')" ondragend="hbDragEnd(event)">'
        +'<span class="hb-drag" title="Drag to reorder">&#x2630;</span>'
        +'<span class="hb-num">'+(i+1)+'</span>'
        +'<input class="inp hb-label-inp" maxlength="12" placeholder="Label..." value="'+((b.label||'').replace(/"/g,'&quot;'))+'"/>'
        +'<select class="sel hb-type-sel" onchange="hbTypeChange(this,'+i+')">'
          +'<option value="charge"'+(isCharge?' selected':'')+'>Charge</option>'
          +'<option value="item"'+(isItem?' selected':'')+'>Quick Add Item</option>'
          +'<option value="category"'+(isCat?' selected':'')+'>Category Shortcut</option>'
        +'</select>'
        +'<input class="inp hb-amt-inp" type="number" step="0.01" min="0" placeholder="$0.00" value="'+(b.amount||'')+'" style="display:'+(isCharge?'':'none')+'"/>'
        +'<div style="position:relative;display:'+(isItem?'inline-block':'none')+';">'
          +'<input class="inp hb-item-search-inp" placeholder="Search model#..." value="'+((itemName).replace(/"/g,'&quot;'))+'" data-model="'+(b.itemModel||'')+'" oninput="hbItemSearch(this)" onfocus="hbItemSearch(this)" onblur="setTimeout(function(){document.querySelectorAll(\'.hb-item-dd\').forEach(function(d){d.classList.remove(\'open\');});},200)"/>'
          +'<div class="hb-item-dd"></div>'
        +'</div>'
        +'<select class="sel hb-cat-sel" style="width:150px;padding:5px 8px;font-size:11px;display:'+(isCat?'':'none')+';">'
          +'<option value="">Category...</option>'
          +adminCategories.map(function(c){var cn=(typeof c==='string')?c:c.name;return '<option value="'+cn+'"'+(b.category===cn?' selected':'')+'>'+cn+'</option>';}).join('')
        +'</select>'
        +'<label class="hb-toggle"><input type="checkbox"'+(b.active?' checked':'')+'><span class="hb-slider"></span></label>'
        +'<span class="hb-preview'+(b.active?'':' inactive')+'">'+(b.label||'Empty')+'</span>'
      +'</div>';
    }).join('');
  });
}
function hbTypeChange(sel,idx){
  var slot=sel.closest('.hb-slot');
  var type=sel.value;
  slot.querySelector('.hb-amt-inp').style.display=type==='charge'?'':'none';
  var itemWrap=slot.querySelector('.hb-item-search-inp');if(itemWrap)itemWrap.parentElement.style.display=type==='item'?'inline-block':'none';
  var catSel=slot.querySelector('.hb-cat-sel');if(catSel)catSel.style.display=type==='category'?'':'none';
}
function hbItemSearch(inp){
  var q=inp.value.toLowerCase();
  var dd=inp.parentElement.querySelector('.hb-item-dd');
  if(q.length<1){dd.classList.remove('open');return;}
  var matches=PRODUCTS.filter(function(p){return p.active!==false&&((p.model||'').toLowerCase().includes(q)||p.name.toLowerCase().includes(q));}).slice(0,8);
  if(!matches.length){dd.innerHTML='<div class="hb-item-dd-opt" style="color:#9ca3af;">No matches</div>';dd.classList.add('open');return;}
  dd.innerHTML=matches.map(function(p){
    return '<div class="hb-item-dd-opt" onmousedown="hbItemSelect(this,\''+p.model+'\',\''+p.name.replace(/'/g,"\\'")+'\')">'
      +'<span style="font-weight:600;">'+p.model+'</span> — '+p.name+' <span style="color:#6b7280;">'+fmt(p.price)+'</span></div>';
  }).join('');
  dd.classList.add('open');
}
function hbItemSelect(el,sku,name){
  var inp=el.closest('div').parentElement.querySelector('.hb-item-search-inp');
  inp.value=sku+' — '+name;
  inp.setAttribute('data-sku',sku);
  el.closest('.hb-item-dd').classList.remove('open');
}
// Drag reorder
function hbDragStart(e,idx){_hbDragIdx=idx;e.currentTarget.classList.add('dragging');e.dataTransfer.effectAllowed='move';}
function hbDragOver(e){e.preventDefault();e.dataTransfer.dropEffect='move';}
function hbDragEnter(e){e.preventDefault();e.currentTarget.closest('.hb-slot').classList.add('drag-over');}
function hbDragLeave(e){e.currentTarget.closest('.hb-slot').classList.remove('drag-over');}
function hbDragEnd(e){e.currentTarget.classList.remove('dragging');document.querySelectorAll('.hb-slot').forEach(function(s){s.classList.remove('drag-over');});}
function hbDrop(e,toIdx){
  e.preventDefault();
  var fromIdx=_hbDragIdx;if(fromIdx<0||fromIdx===toIdx)return;
  hbReadEditor();
  var moved=hotButtons.splice(fromIdx,1)[0];
  hotButtons.splice(toIdx,0,moved);
  hbRenderEditor();
}

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
// PRICE UPDATE TOOL
// ══════════════════════════════════════════════
var puPendingChanges=[];
var puPriceHistory=[];
try{var ph=localStorage.getItem('pos-price-history');if(ph)puPriceHistory=JSON.parse(ph);}catch(e){}

function puHandleDrop(e){e.preventDefault();document.getElementById('pu-dropzone').classList.remove('drag-over');var f=e.dataTransfer.files[0];if(f)puHandleFile(f);}
async function puHandleFile(file){
  if(!file)return;
  document.getElementById('pu-status').style.display='block';
  document.getElementById('pu-preview').style.display='none';
  document.getElementById('pu-result').style.display='none';
  try{
    var b64=await toB64(file);var isPdf=file.type==='application/pdf';
    var msgs=[{role:'user',content:[{type:'document',source:{type:'base64',media_type:file.type||'text/csv',data:b64}},{type:'text',text:'This is a pricing spreadsheet from an appliance buying group. Extract model numbers and new sell prices. Return JSON array only: [{"model":"MODEL#","description":"Item Name","newPrice":999.99}]. Include ALL rows. JSON only, no explanation.'}]}];
    var data=await claudeApiCall({messages:msgs,max_tokens:4000});
    var text=data.content[0].text;var match=text.match(/\[[\s\S]*\]/);if(!match)throw new Error('Could not parse pricing data');
    var parsed=JSON.parse(match[0]);
    puPendingChanges=[];var up=0,down=0,same=0;
    parsed.forEach(function(item){
      var prod=PRODUCTS.find(function(p){return p.model===item.model||p.name.toLowerCase().includes((item.description||'').toLowerCase().slice(0,10));});
      var currentPrice=prod?prod.price:null;
      var newPrice=parseFloat(item.newPrice)||0;
      if(!newPrice)return;
      var change=currentPrice!==null?(newPrice-currentPrice):0;
      var pct=currentPrice?((change/currentPrice)*100):0;
      var status=currentPrice===null?'new':Math.abs(change)<0.01?'same':change>0?'up':'down';
      if(status==='up')up++;else if(status==='down')down++;else same++;
      puPendingChanges.push({model:item.model,description:item.description||'',currentPrice:currentPrice,newPrice:newPrice,change:change,pct:pct,status:status,prodId:prod?prod.id:null});
    });
    document.getElementById('pu-summary-pre').textContent=puPendingChanges.length+' items found — '+down+' price decreases, '+up+' price increases, '+same+' unchanged';
    var tbody=document.getElementById('pu-tbody');
    tbody.innerHTML=puPendingChanges.map(function(c){
      var rc=c.status==='up'?'pu-row-up':c.status==='down'?'pu-row-down':'pu-row-same';
      var arrow=c.status==='up'?'&#9650;':c.status==='down'?'&#9660;':'—';
      var cc=c.status==='up'?'var(--red)':c.status==='down'?'var(--green)':'var(--gray-2)';
      return '<tr class="'+rc+'"><td>'+c.model+'</td><td>'+c.description+'</td><td>'+(c.currentPrice!==null?fmt(c.currentPrice):'N/A')+'</td><td>'+fmt(c.newPrice)+'</td><td style="color:'+cc+';font-weight:700;">'+arrow+' '+(Math.abs(c.change)>0.01?fmt(Math.abs(c.change))+' ('+c.pct.toFixed(1)+'%)':'No change')+'</td></tr>';
    }).join('');
    document.getElementById('pu-preview').style.display='block';
  }catch(e){toast('Error reading file: '+e.message,'error');}
  finally{document.getElementById('pu-status').style.display='none';}
}
async function puApply(){
  var updated=0,increased=0,decreased=0;
  puPendingChanges.forEach(function(c){
    if(!c.prodId||c.status==='same')return;
    var p=PRODUCTS.find(function(x){return x.id===c.prodId;});
    if(!p)return;
    p.price=c.newPrice;updated++;
    if(c.status==='up')increased++;else if(c.status==='down')decreased++;
  });
  // Save to Redis
  await saveProducts();
  // Log to history
  puPriceHistory.unshift({date:new Date().toISOString(),total:updated,increased:increased,decreased:decreased,items:puPendingChanges.filter(function(c){return c.status!=='same'&&c.prodId;}).map(function(c){return{model:c.model,from:c.currentPrice,to:c.newPrice};})});
  try{localStorage.setItem('pos-price-history',JSON.stringify(puPriceHistory.slice(0,50)));}catch(e){}
  document.getElementById('pu-preview').style.display='none';
  document.getElementById('pu-result').style.display='block';
  document.getElementById('pu-result').innerHTML='<div style="background:rgba(82,183,136,0.08);border:1px solid rgba(82,183,136,0.2);border-radius:8px;padding:16px;"><div style="font-size:14px;font-weight:700;color:var(--green);margin-bottom:8px;">Price Update Complete</div><div style="font-size:12px;color:var(--gray-1);line-height:1.8;">'+updated+' items updated<br/>'+increased+' prices increased<br/>'+decreased+' prices decreased</div></div>';
  puPendingChanges=[];renderPriceHistory();refreshSaleView();renderInventory();
  toast(updated+' prices updated','success');
}
function puReset(){puPendingChanges=[];document.getElementById('pu-preview').style.display='none';document.getElementById('pu-result').style.display='none';}
function renderPriceHistory(){
  var el=document.getElementById('pu-history');if(!el)return;
  if(!puPriceHistory.length){el.innerHTML='<div style="font-size:12px;color:var(--gray-2);">No price updates yet.</div>';return;}
  el.innerHTML=puPriceHistory.slice(0,20).map(function(h){
    var d=new Date(h.date);
    return '<div class="pu-hist-card"><div class="pu-hist-date">'+d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+' at '+d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})+'</div><div class="pu-hist-stats">'+h.total+' updated — '+h.decreased+' decreased, '+h.increased+' increased</div></div>';
  }).join('');
}

// ══════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
// AUTH & PERMISSIONS — PIN-ONLY LOGIN
// ══════════════════════════════════════════════
var currentEmployee=null;
var _inactivityTimer=null;
var PIN_TIMEOUT_MS=5*60*1000;
var adminInactivityMinutes=5;
var _posPinValue='';

// PIN pad functions
function posPinKey(n){if(_posPinValue.length>=4)return;_posPinValue+=n;posUpdatePinDots();if(_posPinValue.length===4){if(_posTcMode)posTcPinSubmit();else posPinSubmit();}}
function posPinBack(){_posPinValue=_posPinValue.slice(0,-1);posUpdatePinDots();}
function posPinClear(){_posPinValue='';posUpdatePinDots();document.getElementById('pos-login-err').style.display='none';}
function posUpdatePinDots(){
  for(var i=0;i<4;i++){var d=document.getElementById('pos-pd'+i);if(d)d.classList.toggle('filled',i<_posPinValue.length);}
  var btn=document.getElementById('pos-login-btn');if(btn)btn.disabled=_posPinValue.length<4;
  var tcBtn=document.getElementById('pos-tc-btn');if(tcBtn)tcBtn.disabled=_posPinValue.length<4;
}

function posPinSubmit(){
  if(_posPinValue.length<4)return;
  _doPinLookup();
}

async function _doPinLookup(){
  try{
    var res=await fetch('/api/session-create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:_posPinValue,companyId:'dc-appliance'})});
    var data=await res.json();
    if(data.ok&&data.token&&data.employee){
      // Step 1: store token FIRST before any API calls
      window._authToken=data.token;
      localStorage.setItem(POS_TOKEN_KEY,data.token);
      _loginTimestamp=Date.now();
      // Step 2: THEN proceed with login
      empLoginAs(data.employee);
    }else{
      document.getElementById('pos-login-err').style.display='block';
      document.getElementById('pos-login-err').textContent=data.error||'Incorrect PIN — please try again';
      _posPinValue='';posUpdatePinDots();
    }
  }catch(e){
    document.getElementById('pos-login-err').style.display='block';
    document.getElementById('pos-login-err').textContent='Connection error — please try again';
    _posPinValue='';posUpdatePinDots();
  }
}

async function empLoginAs(user){
  currentEmployee=user;
  localStorage.setItem(POS_EMP_KEY,JSON.stringify(user));
  document.getElementById('pos-login').style.display='none';
  document.getElementById('tb-user-badge').textContent=user.name;
  document.getElementById('tb-user-badge').style.display='';
  applyPermissions();
  // Navigate to dashboard on login
  var dashTab=document.querySelector('.tb-tab[onclick*="dashboard"]');
  nav('dashboard',dashTab);
  // Auto-set clerk on cart
  var cl=document.getElementById('cart-clerk');
  if(cl){for(var i=0;i<cl.options.length;i++){if(cl.options[i].value===user.name){cl.selectedIndex=i;break;}}}
  // Load all app data after login
  await initAppData();
  // Load time clock data
  tcLoadPunches().then(function(){if(typeof empTcRenderGrid==='function')empTcRenderGrid();});
  startTokenRotation();
  resetInactivity();
}
function empSwitchUser(){
  // Delete server session
  var token=localStorage.getItem(POS_TOKEN_KEY);
  if(token){fetch('/api/session-delete',{method:'POST',headers:{'Authorization':'Bearer '+token}}).catch(function(){});}
  localStorage.removeItem(POS_TOKEN_KEY);
  localStorage.removeItem(POS_EMP_KEY);
  window._authToken=null;
  stopTokenRotation();
  stopInactivityTracking();
  currentEmployee=null;
  document.getElementById('pos-login').style.display='flex';
  document.getElementById('tb-user-badge').style.display='none';
  posExitTcMode();
}
function empLogoutMaster(){empSwitchUser();}
function applyPermissions(){
  var tabs=document.querySelectorAll('.tb-tab');
  if(!currentEmployee){tabs.forEach(function(t){t.style.display='';});return;}
  var perms=currentEmployee.permissions;
  var allowed;
  if(perms&&Object.keys(perms).length){
    allowed=PERM_TABS.filter(function(t){return perms[t];});
    if(allowed.indexOf('dashboard')===-1)allowed.unshift('dashboard');
  } else {
    var role=currentEmployee.posRole||currentEmployee.role;
    allowed=ROLE_PERMS[role]||['sale','timeclock'];
  }
  var tabMap={'Dashboard':'dashboard','New Sale':'sale','Inventory':'inventory','Open Orders':'orders','Delivery':'delivery','Service':'service','Customers':'customers','Time Clock':'timeclock','Admin':'admin'};
  tabs.forEach(function(t){
    var label=t.textContent.replace(/[0-9]/g,'').trim();
    var viewKey=tabMap[label];
    if(!viewKey)return;
    t.style.display=allowed.includes(viewKey)?'':'none';
  });
}
// Inactivity timeout — returns to PIN login
// Uses localStorage lastActivity timestamp so timeout persists across tab close/reopen
var _lastActivityInterval=null;

function updateLastActivity(){
  try{localStorage.setItem('pos-lastActivity',String(Date.now()));}catch(e){}
}

function checkInactivityTimeout(){
  if(adminInactivityMinutes<=0)return false; // "Never" = no timeout
  var lastActivity=localStorage.getItem('pos-lastActivity');
  if(!lastActivity)return false;
  var elapsed=Date.now()-parseInt(lastActivity);
  var limit=adminInactivityMinutes*60*1000;
  if(elapsed>limit){
    console.log('Inactivity timeout — logged out after '+Math.round(elapsed/1000)+'s idle (limit: '+adminInactivityMinutes+'min)');
    if(currentEmployee){empSwitchUser();}
    return true;
  }
  return false;
}

function resetInactivity(){
  if(_inactivityTimer)clearTimeout(_inactivityTimer);
  if(_lastActivityInterval){clearInterval(_lastActivityInterval);_lastActivityInterval=null;}
  if(adminInactivityMinutes<=0)return; // "Never" = no timeout
  PIN_TIMEOUT_MS=adminInactivityMinutes*60*1000;
  updateLastActivity();
  var logoutTime=new Date(Date.now()+PIN_TIMEOUT_MS);
  console.log('Inactivity timer started — will logout at '+logoutTime.toLocaleTimeString());
  _inactivityTimer=setTimeout(function(){
    if(currentEmployee){empSwitchUser();}
  },PIN_TIMEOUT_MS);
  // Update lastActivity every 30 seconds while page is active
  _lastActivityInterval=setInterval(function(){
    if(document.visibilityState==='visible'){updateLastActivity();}
  },30000);
}

function stopInactivityTracking(){
  if(_inactivityTimer){clearTimeout(_inactivityTimer);_inactivityTimer=null;}
  if(_lastActivityInterval){clearInterval(_lastActivityInterval);_lastActivityInterval=null;}
  try{localStorage.removeItem('pos-lastActivity');}catch(e){}
}

// Reset timer on user interaction
document.addEventListener('click',function(){if(currentEmployee){updateLastActivity();resetInactivity();}});
document.addEventListener('keydown',function(){if(currentEmployee){updateLastActivity();resetInactivity();}});
document.addEventListener('mousemove',(function(){
  var _lastMove=0;
  return function(){
    var now=Date.now();
    if(now-_lastMove<5000)return; // throttle mousemove to every 5s
    _lastMove=now;
    if(currentEmployee){updateLastActivity();resetInactivity();}
  };
})());

// Page Visibility API — check timeout when tab becomes visible again
document.addEventListener('visibilitychange',function(){
  if(document.visibilityState==='visible'&&currentEmployee){
    if(!checkInactivityTimeout()){
      resetInactivity(); // still active, restart timer
    }
  }
});

// ── TIME CLOCK ON LOGIN SCREEN ──
var _posTcMode=false;
var _posTcUser=null;

function posEnterTcMode(){
  _posTcMode=true;
  document.getElementById('pos-login-mode').style.display='none';
  document.getElementById('pos-tc-mode').style.display='block';
  document.getElementById('pos-tc-result').style.display='none';
  document.getElementById('pos-login-err').style.display='none';
  var sub=document.getElementById('pos-login-sub');if(sub)sub.textContent='Time Clock — Enter your PIN';
  _posPinValue='';posUpdatePinDots();
}
function posExitTcMode(){
  _posTcMode=false;
  document.getElementById('pos-tc-mode').style.display='none';
  document.getElementById('pos-tc-result').style.display='none';
  document.getElementById('pos-login-mode').style.display='block';
  document.getElementById('pos-login-err').style.display='none';
  // Restore pin pad visibility (may have been hidden by TC result)
  var box=document.querySelector('.pos-login-box');
  if(box){var pd=box.querySelector('.pos-pin-display');if(pd)pd.style.display='';var pp=box.querySelector('.pos-pin-pad');if(pp)pp.style.display='';}
  var sub=document.getElementById('pos-login-sub');if(sub)sub.textContent='ApexPOS \u2014 Enter your PIN';
  _posPinValue='';posUpdatePinDots();
}
function posTcPinSubmit(){
  if(_posPinValue.length<4)return;
  _doTcPinLookup();
}
async function _doTcPinLookup(){
  try{
    var res=await fetch('/api/session-create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:_posPinValue,companyId:'dc-appliance',authType:'timeclock'})});
    var data=await res.json();
    if(data.ok&&data.employee){
      // Store temp token for time clock API calls
      window._tcToken=data.token;
      _posTcUser=data.employee;
      _showTcResult();
    }else{
      document.getElementById('pos-login-err').style.display='block';
      document.getElementById('pos-login-err').textContent=data.error||'Incorrect PIN — please try again';
      _posPinValue='';posUpdatePinDots();
    }
  }catch(e){
    document.getElementById('pos-login-err').style.display='block';
    document.getElementById('pos-login-err').textContent='Connection error — please try again';
    _posPinValue='';posUpdatePinDots();
  }
}
function _showTcResult(){
  if(!_posTcUser)return;
  // Temporarily set auth token for time clock API calls
  var prevToken=window._authToken;
  window._authToken=window._tcToken||prevToken;
  // Load punches then show status
  tcLoadPunches().then(function(){
    var active=(typeof tcPunches!=='undefined')?tcPunches.find(function(p){return p.employee===_posTcUser.name&&!p.clockOut;}):null;
    document.getElementById('pos-tc-name').textContent=_posTcUser.name;
    var now=new Date();
    var timeStr=now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
    document.getElementById('pos-tc-status').textContent=active?'Currently clocked in since '+new Date(active.clockIn).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):'Not clocked in — '+timeStr;
    // Show appropriate buttons
    var btns=document.getElementById('pos-tc-btns');
    btns.style.display='flex';
    btns.querySelector('.pos-tc-btn-in').style.display=active?'none':'';
    btns.querySelector('.pos-tc-btn-out').style.display=active?'':'none';
    document.getElementById('pos-tc-confirm').textContent='';
    // Hide pad, show result
    document.getElementById('pos-tc-mode').style.display='none';
    var box=document.querySelector('.pos-login-box');
    var pd=box.querySelector('.pos-pin-display');if(pd)pd.style.display='none';
    var pp=box.querySelector('.pos-pin-pad');if(pp)pp.style.display='none';
    document.getElementById('pos-tc-result').style.display='block';
  });
}
function posDoTcPunch(action){
  if(!_posTcUser)return;
  var empName=_posTcUser.name;
  var active=(typeof tcPunches!=='undefined')?tcPunches.find(function(p){return p.employee===empName&&!p.clockOut;}):null;
  var nowISO=new Date().toISOString();
  var todayStr=nowISO.slice(0,10);
  var fmtTime=function(iso){return new Date(iso).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});};
  var confirmEl=document.getElementById('pos-tc-confirm');
  var btnsEl=document.getElementById('pos-tc-btns');
  var hour=new Date().getHours();
  var greeting=hour<12?'Good morning':'Good afternoon';

  if(action==='in'){
    if(active){confirmEl.textContent=empName+' is already clocked in';confirmEl.style.color='#ea580c';return;}
    tcPunches.push({id:'TC-'+Date.now(),employee:empName,date:todayStr,clockIn:nowISO,clockOut:null,type:'regular',hours:0});
    confirmEl.innerHTML='<span style="color:#16a34a;">'+greeting+', '+empName+'</span><br>Clocked in at '+fmtTime(nowISO);
  }else{
    if(!active){confirmEl.textContent=empName+' is not clocked in';confirmEl.style.color='#ea580c';return;}
    active.clockOut=nowISO;
    active.hours=Math.round(((new Date(active.clockOut)-new Date(active.clockIn))/3600000)*100)/100;
    confirmEl.innerHTML='<span style="color:#dc2626;">'+empName+' clocked out</span><br>'+active.hours.toFixed(2)+' hours logged';
  }
  btnsEl.style.display='none';
  if(typeof tcSavePunches==='function')tcSavePunches();
  // Auto-return to login after 3 seconds
  setTimeout(function(){posCloseTcResult();},3000);
}
function posCloseTcResult(){
  // Clean up temp time clock token
  if(window._tcToken){
    fetch('/api/session-delete',{method:'POST',headers:{'Authorization':'Bearer '+window._tcToken}}).catch(function(){});
    window._tcToken=null;
  }
  // Restore previous auth token (null if not logged in)
  window._authToken=localStorage.getItem(POS_TOKEN_KEY)||null;
  _posTcUser=null;
  posExitTcMode();
}

// Keyboard support for POS PIN pad + time clock
document.addEventListener('keydown',function(e){
  var login=document.getElementById('pos-login');
  if(!login||login.style.display==='none')return;
  // Don't capture when typing in other inputs
  var tag=document.activeElement?document.activeElement.tagName:'';
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
  // Don't capture when TC result is showing (waiting for auto-close)
  var tcResult=document.getElementById('pos-tc-result');
  if(tcResult&&tcResult.style.display==='block')return;
  var key=e.key;
  if(key>='0'&&key<='9'){e.preventDefault();posPinKey(key);_flashPosPinKey(key);}
  else if(key==='Backspace'){e.preventDefault();posPinBack();_flashPosPinKey('back');}
  else if(key==='Escape'){e.preventDefault();posPinClear();_flashPosPinKey('clear');}
  else if(key==='Enter'){e.preventDefault();if(_posTcMode)posTcPinSubmit();else posPinSubmit();}
});
function _flashPosPinKey(val){
  var btns=document.querySelectorAll('.pos-pin-key');
  btns.forEach(function(b){
    var txt=b.textContent.trim();
    if(val==='back'&&b.innerHTML.indexOf('232B')>=0){b.classList.add('flash');}
    else if(val==='clear'&&txt==='Clear'){b.classList.add('flash');}
    else if(txt===val){b.classList.add('flash');}
  });
  setTimeout(function(){btns.forEach(function(b){b.classList.remove('flash');});},120);
}

// ══════════════════════════════════════════════
// EXTENDED WARRANTY SYSTEM
// ══════════════════════════════════════════════

function renderWarrantyTiers(){
  var wrap=document.getElementById('wty-tiers-list');if(!wrap)return;
  if(!warrantyTiers.length){wrap.innerHTML='<div style="color:var(--gray-2);font-size:12px;padding:20px;">No warranty tiers configured. Click "+ Add Tier" to create one.</div>';return;}
  var h='<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px;">';
  h+='<thead><tr style="background:var(--bg);border-bottom:2px solid var(--border);"><th style="text-align:left;padding:8px;">Tier Name</th><th style="text-align:right;padding:8px;">From $</th><th style="text-align:right;padding:8px;">To $</th><th style="text-align:right;padding:8px;">Cost</th><th style="text-align:center;padding:8px;">Active</th><th style="text-align:center;padding:8px;">Actions</th></tr></thead><tbody>';
  warrantyTiers.forEach(function(t){
    h+='<tr style="border-bottom:1px solid var(--border);">';
    h+='<td style="padding:8px;font-weight:600;">'+t.name+'</td>';
    h+='<td style="padding:8px;text-align:right;">$'+t.priceFrom.toLocaleString()+'</td>';
    h+='<td style="padding:8px;text-align:right;">$'+t.priceTo.toLocaleString()+'</td>';
    h+='<td style="padding:8px;text-align:right;font-weight:700;">$'+t.cost.toFixed(2)+'</td>';
    h+='<td style="padding:8px;text-align:center;"><span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;'+(t.active?'background:#dcfce7;color:#16a34a;':'background:#f3f4f6;color:#9ca3af;')+'">'+(t.active?'Active':'Inactive')+'</span></td>';
    h+='<td style="padding:8px;text-align:center;"><button class="ghost-btn" style="font-size:10px;padding:2px 8px;" onclick="wtyEditTier('+t.id+')">Edit</button> <button class="ghost-btn" style="font-size:10px;padding:2px 8px;color:#dc2626;border-color:#fca5a5;" onclick="wtyDeleteTier('+t.id+')">Delete</button></td>';
    h+='</tr>';
  });
  h+='</tbody></table>';
  wrap.innerHTML=h;
}

function wtyAddTier(){
  var name=prompt('Tier name (e.g. "5 Year Appliance Warranty $699 Max"):');
  if(!name||!name.trim())return;
  var from=parseFloat(prompt('Price range FROM ($):','1'));if(isNaN(from))return;
  var to=parseFloat(prompt('Price range TO ($):','699'));if(isNaN(to))return;
  var cost=parseFloat(prompt('Warranty cost ($):','99'));if(isNaN(cost))return;
  warrantyTiers.push({id:wtyNextId++,name:name.trim(),priceFrom:from,priceTo:to,cost:cost,active:true});
  wtySaveTiers();renderWarrantyTiers();
}

function wtyEditTier(id){
  var t=warrantyTiers.find(function(x){return x.id===id;});if(!t)return;
  var name=prompt('Tier name:',t.name);if(!name||!name.trim())return;
  var from=parseFloat(prompt('Price range FROM ($):',t.priceFrom));if(isNaN(from))return;
  var to=parseFloat(prompt('Price range TO ($):',t.priceTo));if(isNaN(to))return;
  var cost=parseFloat(prompt('Warranty cost ($):',t.cost));if(isNaN(cost))return;
  var active=confirm('Active? OK=Active, Cancel=Inactive');
  t.name=name.trim();t.priceFrom=from;t.priceTo=to;t.cost=cost;t.active=active;
  wtySaveTiers();renderWarrantyTiers();
}

function wtyDeleteTier(id){
  if(!confirm('Delete this warranty tier?'))return;
  warrantyTiers=warrantyTiers.filter(function(x){return x.id!==id;});
  wtySaveTiers();renderWarrantyTiers();
}

async function wtySaveTiers(){
  try{
    await apiFetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'warranty-tiers',data:{tiers:warrantyTiers,nextId:wtyNextId}})});
    toast('Warranty tiers saved','success');
  }catch(e){toast('Save failed','error');}
}

// Find matching warranty tier for a given price
function wtyFindTier(price){
  if(price<100)return null;
  var match=null;
  warrantyTiers.forEach(function(t){
    if(t.active&&price>=t.priceFrom&&price<=t.priceTo)match=t;
  });
  return match;
}

// Check if a cart item needs a warranty prompt
function wtyNeedsPrompt(cartItem){
  if(cartItem.isService)return false;
  if(cartItem.isWarranty)return false;
  if(cartItem.price<100)return false;
  var p=PRODUCTS.find(function(x){return x.id===cartItem.id;});
  if(!p)return false;
  // Skip non-serial-tracked items
  if(!isSerialTracked(p))return false;
  // Skip items already in warranty categories
  var cat=(p.cat||'').toUpperCase();
  if(cat==='WARRANTIES')return false;
  return !!wtyFindTier(cartItem.price);
}

// Get warranty tier code from tier name
function wtyTierCode(tier){
  var maxMatch=tier.name.match(/\$(\d+)\s*Max/i);
  return '5YEAR'+(maxMatch?maxMatch[1]:'');
}

// Accept warranty for a cart item
function wtyAccept(cartIdx){
  var c=cart[cartIdx];if(!c)return;
  var parentId=c.id;
  var tier=wtyFindTier(c.price);if(!tier)return;
  c.warrantyStatus='accepted';c.warrantyTierId=tier.id;
  // Remove any existing linked warranty for this item
  cart=cart.filter(function(x){return x._warrantyParentId!==parentId;});
  // Re-find parent index after filter
  var newIdx=cart.findIndex(function(x){return x.id===parentId&&!x.isWarranty;});
  if(newIdx<0){renderCart();return;}
  // Add warranty line item right after this item
  var wtyItem={
    id:80000+Date.now()+(Math.random()*1000|0),
    name:tier.name,
    model:wtyTierCode(tier),
    price:tier.cost,
    qty:1,
    serial:'',
    isService:true,
    isWarranty:true,
    _warrantyParentId:parentId
  };
  cart.splice(newIdx+1,0,wtyItem);
  renderCart();
}

// Decline warranty for a cart item
function wtyDecline(cartIdx){
  var c=cart[cartIdx];if(!c)return;
  var parentId=c.id;
  c.warrantyStatus='declined';c.warrantyTierId=null;
  // Remove any linked warranty line item
  cart=cart.filter(function(x){return x._warrantyParentId!==parentId;});
  renderCart();
}

// Check if all warranty-eligible items have been accepted/declined
function wtyAllDecided(){
  var missing=[];
  cart.forEach(function(c,idx){
    if(wtyNeedsPrompt(c)&&!c.warrantyStatus)missing.push(c.name);
  });
  return missing;
}

// ── Warranty EOM Report ──
function eomWarrantyHtml(ym){
  var monthOrders=orders.filter(function(o){return o.date&&o.date.substring(0,7)===ym;});
  var accepted=0,declined=0,revenue=0;
  var byClerk={};
  monthOrders.forEach(function(o){
    var clerk=o.clerk||'Unknown';
    if(!byClerk[clerk])byClerk[clerk]={accepted:0,declined:0,revenue:0};
    (o.items||[]).forEach(function(it){
      if(it.isWarranty){accepted++;revenue+=it.price*it.qty;byClerk[clerk].accepted++;byClerk[clerk].revenue+=it.price*it.qty;}
      if(it.warrantyDeclined){declined++;byClerk[clerk].declined++;}
    });
  });
  var total=accepted+declined;
  var rate=total>0?((accepted/total)*100).toFixed(1):'0.0';
  var h='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">';
  h+='<div><div style="font-size:20px;font-weight:700;color:#16a34a;">'+accepted+'</div><div style="font-size:10px;color:var(--gray-2);">Warranties Sold</div></div>';
  h+='<div><div style="font-size:20px;font-weight:700;color:#2563eb;">'+fmt(revenue)+'</div><div style="font-size:10px;color:var(--gray-2);">Revenue</div></div>';
  h+='<div><div style="font-size:20px;font-weight:700;color:#ea580c;">'+rate+'%</div><div style="font-size:10px;color:var(--gray-2);">Acceptance Rate</div></div>';
  h+='<div><div style="font-size:20px;font-weight:700;color:#dc2626;">'+declined+'</div><div style="font-size:10px;color:var(--gray-2);">Declined</div></div>';
  h+='</div>';
  // Per-clerk breakdown
  var clerks=Object.keys(byClerk);
  if(clerks.length){
    h+='<table style="width:100%;font-size:10px;border-collapse:collapse;margin-top:4px;"><thead><tr style="border-bottom:1px solid var(--border);"><th style="text-align:left;padding:3px;">Salesperson</th><th style="text-align:right;padding:3px;">Sold</th><th style="text-align:right;padding:3px;">Declined</th><th style="text-align:right;padding:3px;">Rate</th><th style="text-align:right;padding:3px;">Revenue</th></tr></thead><tbody>';
    clerks.forEach(function(ck){
      var d=byClerk[ck];var t2=d.accepted+d.declined;var r2=t2>0?((d.accepted/t2)*100).toFixed(1):'—';
      h+='<tr style="border-bottom:1px solid var(--border);"><td style="padding:3px;">'+ck+'</td><td style="padding:3px;text-align:right;">'+d.accepted+'</td><td style="padding:3px;text-align:right;">'+d.declined+'</td><td style="padding:3px;text-align:right;">'+r2+'%</td><td style="padding:3px;text-align:right;">'+fmt(d.revenue)+'</td></tr>';
    });
    h+='</tbody></table>';
  }
  return h;
}

function exportWarrantyCSV(ym){
  var monthOrders=orders.filter(function(o){return o.date&&o.date.substring(0,7)===ym;});
  var rows=[['Date','Order','Clerk','Item','Model','Price','Warranty','Status','Warranty Cost']];
  monthOrders.forEach(function(o){
    (o.items||[]).forEach(function(it){
      if(it.isWarranty||it.warrantyDeclined||it.warrantyStatus){
        var status=it.isWarranty?'Warranty Item':(it.warrantyDeclined?'Declined':(it.warrantyStatus||''));
        rows.push([new Date(o.date).toLocaleDateString(),o.id,o.clerk||'',it.name,it.model||'',it.price.toFixed(2),it.isWarranty?it.name:'',status,it.isWarranty?it.price.toFixed(2):'0.00']);
      }
    });
  });
  var csv=rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',');}).join('\n');
  var blob=new Blob([csv],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='warranty-report-'+ym+'.csv';a.click();
}

function exportWarrantyPDF(ym){
  var html=eomWarrantyHtml(ym);
  var win=window.open('','_blank');
  win.document.write('<!DOCTYPE html><html><head><title>Warranty Report '+ym+'</title><style>body{font-family:sans-serif;padding:20px;}</style></head><body><h2>Warranty Report — '+ym+'</h2>'+html+'<script>setTimeout(function(){window.print();},300);<\/script></body></html>');
  win.document.close();
}

// Init — preload users for fast PIN lookup
adminLoad();
