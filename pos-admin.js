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
  try{var res=await fetch('/api/ai-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:sys,messages:aiHistory,max_tokens:600})});var data=await res.json();if(!data.ok)throw new Error(data.error||'API error');var reply=data.content[0].text||'Sorry, try again.';aiHistory.push({role:'assistant',content:reply});typing.remove();aiAddMsg('ai',reply);}
  catch(e){typing.remove();aiAddMsg('ai','Connection error: '+e.message);}btn.disabled=false;inp.focus();
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

async function adminLoad(){
  var keys=['admin-categories','admin-brands','admin-commissions','admin-tax-zones','pos-settings','admin-vendors'];
  for(var i=0;i<keys.length;i++){
    try{
      var res=await fetch('/api/admin-get?key='+encodeURIComponent(keys[i]));
      var json=await res.json();
      if(json&&json.data){
        if(keys[i]==='admin-categories' && json.data.length) adminCategories=json.data;
        if(keys[i]==='admin-brands' && json.data.length) adminBrands=json.data;
        if(keys[i]==='admin-commissions' && json.data.defaults) adminCommissions=json.data;
        if(keys[i]==='admin-tax-zones' && json.data.length) adminTaxZones=json.data;
        if(keys[i]==='admin-vendors' && Array.isArray(json.data)) adminVendors=json.data;
        if(keys[i]==='pos-settings' && json.data){
          if(json.data.invoiceMessage!==undefined) adminInvoiceMessage=json.data.invoiceMessage;
          if(json.data.deliveryPrice!==undefined) adminDeliveryPrice=json.data.deliveryPrice;
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
    var res=await fetch('/api/employees-get?companyId='+SVC_COMPANY_ID);
    var data=await res.json();
    if(data.users&&data.users.length){
      // Filter out any techs that may have been in the old unified DB
      adminUsers=data.users.filter(function(u){return u.role!=='tech';});
    }
  }catch(e){}
  // Migrate: if empty, seed from old pos:admin-users (POS employees only)
  if(!adminUsers.length){
    try{
      var old=await fetch('/api/admin-get?key=admin-users');var oj=await old.json();
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
    var res=await fetch('/api/techs-get');
    var data=await res.json();
    if(data.techs&&data.techs.length){adminTechs=data.techs;}
  }catch(e){}
  // Migrate: pull techs from old unified DB if service:techs is empty
  if(!adminTechs.length){
    try{
      var res2=await fetch('/api/employees-get?companyId='+SVC_COMPANY_ID);
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

function _updateSvcTechList(){
  svcTechList=['Unassigned'].concat(adminTechs.filter(function(t){return t.active!==false;}).map(function(t){return t.tech||t.name;}));
}

async function saveAllTechs(){
  try{
    var res=await fetch('/api/techs-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({techs:adminTechs,requesterPassword:'DCA123'})});
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
    var res=await fetch('/api/employees-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({companyId:SVC_COMPANY_ID,users:adminUsers,requesterPassword:'DCA123'})});
    var data=await res.json();
    if(!data.ok)throw new Error(data.error);
    return true;
  }catch(e){toast('Save failed: '+e.message,'error');return false;}
}

async function adminSave(key,data){
  try{
    await fetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:key,data:data})});
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
  else if(adminSection==='receiveinv') renderReceiveInv();
  else if(adminSection==='dataimport') renderDataImport();
  else if(adminSection==='arreport') renderARReport();
  else if(adminSection==='eomreports') renderEomReports();
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
function renderAdminUsers(){
  var wrap=document.getElementById('admin-users-list');
  if(!adminUsers.length){wrap.innerHTML='<div class="admin-empty">No employees.</div>';return;}
  var h='<table class="admin-table"><thead><tr><th>Name</th><th>POS Role</th><th>PIN</th><th>Status</th><th style="width:180px;"></th></tr></thead><tbody>';
  adminUsers.forEach(function(u,i){
    var inactive=u.active===false;
    var statusBadge=inactive
      ?'<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:100px;background:#fee2e2;color:#dc2626;">INACTIVE</span>'
      :'<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:100px;background:#dcfce7;color:#16a34a;">ACTIVE</span>';
    var rowStyle=inactive?'opacity:0.5;':'';
    h+='<tr style="'+rowStyle+'"><td style="font-weight:600;">'+u.name+'</td>'
      +'<td>'+(u.posRole||'—')+'</td>'
      +'<td><span class="pin-cell" onclick="inlineEditPin(this,'+i+')" style="cursor:pointer;min-width:40px;display:inline-block;" title="Click to edit PIN">'+(u.pin||'—')+'</span></td>'
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
  html+='<div class="hdr"><div><h1>DC Appliance — Commission Report</h1><div style="font-size:11px;color:#666;">'+monthLabel+'</div></div><div style="font-size:10px;color:#666;text-align:right;">(620) 371-6417<br/>Dodge City, KS</div></div>';

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
function saveVendors(){fetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'admin-vendors',data:adminVendors})});}

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
    var res=await fetch('/api/ai-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:msgs,max_tokens:2000})});
    var data=await res.json();
    if(!data.ok)throw new Error(data.error||'AI error');
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
  wrap.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">'
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
    +'</div>';
}

var _diInvRows=[];
async function diHandleInvFile(file){
  if(!file)return;
  var text=await file.text();
  var lines=text.split(/\r?\n/).filter(Boolean);
  if(lines.length<2){toast('File is empty','error');return;}
  var headers=lines[0].split(',').map(function(h){return h.trim().replace(/"/g,'').toLowerCase();});
  _diInvRows=[];var newCount=0,updateCount=0;
  for(var i=1;i<lines.length;i++){
    var cols=lines[i].split(',').map(function(c){return c.trim().replace(/^"|"$/g,'');});
    var row={};headers.forEach(function(h,j){row[h]=cols[j]||'';});
    var model=row.model||row['model number']||row['model#']||row.sku||'';
    if(!model)continue;
    var existing=PRODUCTS.find(function(p){return (p.model||'').toLowerCase()===model.toLowerCase()||(p.sku||'').toLowerCase()===model.toLowerCase();});
    _diInvRows.push({model:model,name:row.name||row.description||'',brand:row.brand||'',cat:row.category||row.cat||'',cost:parseFloat(row.cost)||0,price:parseFloat(row.price||row['retail price']||row.retail)||0,vendor:row.vendor||'',serialTracked:row['serial tracked']||'',qty:parseInt(row.qty||row.stock||row.quantity)||0,isUpdate:!!existing});
    if(existing)updateCount++;else newCount++;
  }
  var h='<div style="font-size:12px;font-weight:700;margin-bottom:6px;">'+_diInvRows.length+' items: <span style="color:var(--green);">'+newCount+' new</span>, <span style="color:var(--blue);">'+updateCount+' updates</span></div>';
  h+='<div style="max-height:200px;overflow:auto;border:1px solid var(--border);border-radius:6px;"><table class="admin-table" style="font-size:10px;margin:0;"><thead><tr><th>Model</th><th>Name</th><th>Brand</th><th>Price</th><th>Status</th></tr></thead><tbody>';
  _diInvRows.forEach(function(r){h+='<tr><td>'+r.model+'</td><td>'+r.name+'</td><td>'+r.brand+'</td><td>$'+(r.price||0).toFixed(2)+'</td><td style="font-weight:700;color:'+(r.isUpdate?'var(--blue)':'var(--green)')+';">'+(r.isUpdate?'Update':'New')+'</td></tr>';});
  h+='</tbody></table></div><button class="primary-btn" onclick="diConfirmInv()" style="margin-top:8px;">Import '+_diInvRows.length+' Products</button>';
  document.getElementById('di-inv-preview').innerHTML=h;document.getElementById('di-inv-preview').style.display='block';
}

function diConfirmInv(){
  var added=0,updated=0;
  _diInvRows.forEach(function(r){
    var p=PRODUCTS.find(function(x){return (x.model||'').toLowerCase()===r.model.toLowerCase()||(x.sku||'').toLowerCase()===r.model.toLowerCase();});
    if(p){
      if(r.name)p.name=r.name;if(r.brand)p.brand=r.brand;if(r.cat)p.cat=r.cat;
      if(r.cost)p.cost=r.cost;if(r.price)p.price=r.price;if(r.vendor)p.vendor=r.vendor;
      if(r.qty)p.stock=(p.stock||0)+r.qty;
      updated++;
    }else{
      PRODUCTS.push({id:PRODUCTS.length+200+added,model:r.model,sku:r.model,name:r.name,brand:r.brand,cat:r.cat,price:r.price,cost:r.cost,stock:r.qty,sold:0,reorderPt:2,reorderQty:3,sales30:0,serial:'',warranty:'1 Year',icon:'&#x1F4E6;',serialTracked:r.serialTracked==='false'?false:true,vendor:r.vendor,serialPool:[]});
      added++;
    }
  });
  saveProducts();_diInvRows=[];
  document.getElementById('di-inv-preview').style.display='none';
  toast(added+' added, '+updated+' updated','success');
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
  html+='<div class="hdr"><div><h1>DC Appliance — Accounts Receivable</h1><div style="font-size:10px;color:#666;">'+now.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})+'</div></div><div style="font-size:10px;color:#666;">(620) 371-6417</div></div>';
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
  h+='<div style="margin-top:6px;"><button class="ghost-btn" style="font-size:10px;padding:3px 10px;" onclick="exportEomCSV(\'inventory\',\''+ym+'\')">CSV</button></div></div>';

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
  var active=PRODUCTS.filter(function(p){return p.active!==false&&(p.stock>0||(p.sold||0)>0);});
  if(!active.length)return '<div style="font-size:11px;color:var(--gray-3);">No inventory data</div>';
  // Show top 20 by sold
  var sorted=active.slice().sort(function(a,b){return (b.sold||0)-(a.sold||0);}).slice(0,20);
  var h='<table class="admin-table" style="font-size:10px;margin:0;"><thead><tr><th>Product</th><th style="text-align:center;">Stock</th><th style="text-align:center;">Sold</th><th style="text-align:center;">Avail</th></tr></thead><tbody>';
  sorted.forEach(function(p){var avail=Math.max(0,p.stock-(p.sold||0));h+='<tr><td>'+p.name+'</td><td style="text-align:center;">'+p.stock+'</td><td style="text-align:center;">'+(p.sold||0)+'</td><td style="text-align:center;font-weight:700;">'+avail+'</td></tr>';});
  h+='</tbody></table>';return h;
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
    csv='Product,Model,Brand,Stock,Sold,Available\n';
    PRODUCTS.filter(function(p){return p.active!==false;}).forEach(function(p){csv+='"'+p.name+'","'+(p.model||'')+'","'+p.brand+'",'+p.stock+','+(p.sold||0)+','+Math.max(0,p.stock-(p.sold||0))+'\n';});
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
    html+='<div class="hdr"><div><h1>DC Appliance — Sales Tax Report</h1><div style="font-size:11px;color:#666;">'+monthLabel+'</div></div><div style="font-size:10px;color:#666;">(620) 371-6417</div></div>';
    html+='<table><thead><tr><th>Zone</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Taxable Sales</th><th style="text-align:right;">Tax Collected</th></tr></thead><tbody>';
    zones.forEach(function(z){var d=taxData[z];html+='<tr><td>'+z+'</td><td style="text-align:right;">'+(d.rate*100).toFixed(3)+'%</td><td style="text-align:right;">$'+d.taxable.toFixed(2)+'</td><td style="text-align:right;font-weight:700;">$'+d.tax.toFixed(2)+'</td></tr>';});
    html+='<tr style="font-weight:700;background:#f5f5f5;"><td colspan="3">Total</td><td style="text-align:right;">$'+totalTax.toFixed(2)+'</td></tr>';
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
function renderPosSettings(){
  document.getElementById('admin-invoice-msg').value=adminInvoiceMessage;
  document.getElementById('admin-delivery-price').value=adminDeliveryPrice;
  hbRenderEditor();
  commRenderEditor();
}
async function savePosSettings(){
  adminInvoiceMessage=document.getElementById('admin-invoice-msg').value.trim();
  adminDeliveryPrice=parseFloat(document.getElementById('admin-delivery-price').value)||79.99;
  try{localStorage.setItem('pos-admin-invoice-msg',adminInvoiceMessage);localStorage.setItem('pos-admin-delivery-price',String(adminDeliveryPrice));}catch(e){}
  try{
    await fetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'pos-settings',data:{invoiceMessage:adminInvoiceMessage,deliveryPrice:adminDeliveryPrice}})});
    toast('POS settings saved','success');
  }catch(e){toast('Save failed','error');}
}

// ── Commission Rates (Global by Category + Brand Overrides) ──
var commCategoryRates={};
var commBrandOverrides={};
var _commLoaded=false;

async function commLoad(){
  if(_commLoaded)return;
  try{var r=await fetch('/api/admin-get?key=commission-rates');var d=await r.json();
    if(d&&d.data){commCategoryRates=d.data.categories||{};commBrandOverrides=d.data.brands||{};}
  }catch(e){}
  _commLoaded=true;
}
async function commSaveRates(){
  commReadEditor();
  try{
    await fetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'commission-rates',data:{categories:commCategoryRates,brands:commBrandOverrides}})});
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
  try{var r=await fetch('/api/admin-get?key=hot-buttons');var d=await r.json();if(d&&d.data&&Array.isArray(d.data)&&d.data.length)hotButtons=d.data;}catch(e){}
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
    var res=await fetch('/api/ai-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:msgs,max_tokens:4000})});
    var data=await res.json();if(!data.ok)throw new Error(data.error);
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
// AUTH & PERMISSIONS
// ══════════════════════════════════════════════
var currentEmployee=null;
var _inactivityTimer=null;
var PIN_TIMEOUT_MS=5*60*1000;

function posLogin(){
  var pw=document.getElementById('pos-pw').value;
  if(pw==='DCA123'){
    localStorage.setItem('pos-auth','1');
    document.getElementById('pos-login').style.display='none';
    showEmpSelect();
  } else {
    document.getElementById('pos-login-err').style.display='block';
    document.getElementById('pos-pw').value='';
  }
}
function showEmpSelect(){
  adminLoad().then(function(){
    var grid=document.getElementById('emp-grid');
    var active=adminUsers.filter(function(u){return u.active!==false;});
    var h='';
    active.forEach(function(u){
      var i=adminUsers.indexOf(u);
      h+='<div class="emp-tile" onclick="empSelectUser('+i+')">'+u.name+'<div style="font-size:10px;color:#6b7280;font-weight:400;margin-top:3px;">'+(u.posRole||'Sales')+'</div></div>';
    });
    grid.innerHTML=h;
    document.getElementById('emp-pin-prompt').classList.remove('show');
    document.getElementById('emp-grid').style.display='';
    document.getElementById('emp-select').classList.add('show');
    // Render time clock status on login screen
    tcLoadPunches().then(function(){empTcRenderGrid();empTcStartRefresh();});
  });
}
var _empSelectedIdx=-1;
function empSelectUser(i){
  _empSelectedIdx=i;
  var u=adminUsers[i];
  if(!u.pin){empLoginAs(u);return;}
  document.getElementById('emp-grid').style.display='none';
  document.getElementById('emp-pin-name').textContent=u.name;
  document.getElementById('emp-pin-input').value='';
  document.getElementById('emp-pin-input').type='password';
  document.getElementById('emp-pin-input').placeholder='PIN';
  document.getElementById('emp-pin-input').maxLength=4;
  document.getElementById('emp-pin-err').style.display='none';
  document.getElementById('emp-pin-prompt').classList.add('show');
  setTimeout(function(){document.getElementById('emp-pin-input').focus();},100);
}
function empPinSubmit(){
  var u=adminUsers[_empSelectedIdx];if(!u)return;
  var val=document.getElementById('emp-pin-input').value;
  var match=(val===u.pin);
  if(match){empLoginAs(u);}
  else{document.getElementById('emp-pin-err').style.display='block';document.getElementById('emp-pin-input').value='';document.getElementById('emp-pin-input').focus();}
}
function empBackToGrid(){
  document.getElementById('emp-pin-prompt').classList.remove('show');
  document.getElementById('emp-pin-input').type='password';
  document.getElementById('emp-pin-input').placeholder='PIN';
  document.getElementById('emp-pin-input').maxLength=4;
  document.getElementById('emp-grid').style.display='';
}
function empLoginAs(user){
  currentEmployee=user;
  document.getElementById('emp-select').classList.remove('show');
  document.getElementById('tb-user-badge').textContent=user.name;
  document.getElementById('tb-user-badge').style.display='';
  applyPermissions();
  // Navigate to dashboard on login
  var dashTab=document.querySelector('.tb-tab[onclick*="dashboard"]');
  nav('dashboard',dashTab);
  // Auto-set clerk on cart
  var cl=document.getElementById('cart-clerk');
  if(cl){for(var i=0;i<cl.options.length;i++){if(cl.options[i].value===user.name){cl.selectedIndex=i;break;}}}
  resetInactivity();
}
function empSwitchUser(){
  currentEmployee=null;
  showEmpSelect();
}
function empLogoutMaster(){
  currentEmployee=null;
  localStorage.removeItem('pos-auth');
  document.getElementById('emp-select').classList.remove('show');
  document.getElementById('pos-login').style.display='flex';
  document.getElementById('pos-pw').value='';
  document.getElementById('pos-pw').focus();
}
function applyPermissions(){
  var tabs=document.querySelectorAll('.tb-tab');
  if(!currentEmployee){tabs.forEach(function(t){t.style.display='';});return;}
  // Use granular permissions if set, otherwise fall back to role presets
  var perms=currentEmployee.permissions;
  var allowed;
  if(perms&&Object.keys(perms).length){
    allowed=PERM_TABS.filter(function(t){return perms[t];});
    // Always include dashboard
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
// Inactivity timeout
function resetInactivity(){
  if(_inactivityTimer)clearTimeout(_inactivityTimer);
  _inactivityTimer=setTimeout(function(){
    if(currentEmployee){currentEmployee=null;showEmpSelect();}
  },PIN_TIMEOUT_MS);
}
document.addEventListener('click',resetInactivity);
document.addEventListener('keydown',resetInactivity);

// Init auth
if(localStorage.getItem('pos-auth')==='1'){
  document.getElementById('pos-login').style.display='none';
  // Load users then show emp select
  setTimeout(function(){showEmpSelect();},100);
} else {
  document.getElementById('pos-pw').focus();
}
