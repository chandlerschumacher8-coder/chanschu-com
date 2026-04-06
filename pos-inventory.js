// ══════════════════════════════════════════════
// POS INVENTORY MODULE
// ══════════════════════════════════════════════

// ── Email Builders (shared by POS) ──
function buildDeliveryEmailHtml(d){
  var apps=d.appliances&&d.appliances.length?d.appliances:[{a:d.appliance||'',m:''}];
  var appsHtml=apps.map(function(a){return '<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;">'+a.a+'</td><td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;color:#666;">'+(a.m||'')+'</td></tr>';}).join('');
  var dateStr=new Date(d.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">'
    +'<div style="max-width:600px;margin:0 auto;background:#fff;">'
    +'<div style="background:#1a2744;padding:20px 32px;text-align:center;"><img src="'+DC_APPLIANCE_LOGO+'" style="max-width:160px;height:auto;display:block;margin:0 auto 8px;" alt="DC Appliance"/><h1 style="margin:0;color:#fff;font-size:22px;">DC Appliance</h1><p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Delivery Confirmation</p></div>'
    +'<div style="padding:28px 32px;">'
    +'<p style="font-size:16px;color:#1f2937;">Hi <strong>'+d.name+'</strong>,</p>'
    +'<p style="font-size:14px;color:#4b5563;line-height:1.6;">Your delivery has been scheduled. Here are the details:</p>'
    +'<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;"><table style="width:100%;border-collapse:collapse;">'
    +'<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;font-weight:700;width:120px;">DATE</td><td style="padding:6px 0;font-size:14px;color:#1f2937;font-weight:600;">'+dateStr+'</td></tr>'
    +'<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;font-weight:700;">TIME</td><td style="padding:6px 0;font-size:14px;color:#1f2937;">'+(d.time||'TBD')+'</td></tr>'
    +'<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;font-weight:700;">ADDRESS</td><td style="padding:6px 0;font-size:14px;color:#1f2937;">'+d.address+', '+d.city+'</td></tr>'
    +'<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;font-weight:700;">TYPE</td><td style="padding:6px 0;font-size:14px;color:#1f2937;">'+(d.deliveryType||'Full Install')+'</td></tr>'
    +(d.invoice?'<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;font-weight:700;">INVOICE</td><td style="padding:6px 0;font-size:14px;color:#1f2937;">'+d.invoice+'</td></tr>':'')
    +'</table></div>'
    +'<h3 style="font-size:14px;color:#1f2937;margin:20px 0 8px;">Appliances</h3>'
    +'<table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:6px;"><thead><tr><th style="padding:8px 12px;background:#f8fafc;font-size:12px;color:#6b7280;text-align:left;font-weight:700;">APPLIANCE</th><th style="padding:8px 12px;background:#f8fafc;font-size:12px;color:#6b7280;text-align:left;font-weight:700;">MODEL</th></tr></thead><tbody>'+appsHtml+'</tbody></table>'
    +(d.notes?'<div style="margin-top:16px;padding:12px 16px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;font-size:13px;color:#92400e;"><strong>Notes:</strong> '+d.notes+'</div>':'')
    +'<p style="font-size:14px;color:#4b5563;margin-top:24px;line-height:1.6;">If you need to reschedule or have any questions, please contact us:</p>'
    +'<p style="font-size:14px;color:#1f2937;font-weight:600;margin:4px 0;">(620) 371-6417</p>'
    +'<p style="font-size:13px;color:#6b7280;">DC Appliance &mdash; Dodge City, KS</p>'
    +'</div>'
    +'<div style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;"><p style="font-size:12px;color:#9ca3af;margin:0;">Thank you for choosing DC Appliance!</p></div></div></body></html>';
}

function buildInvoiceEmailHtml(order){
  var itemsHtml=order.items.map(function(it){var lt=it.price*it.qty;return '<tr><td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;">'+it.name+(it.model?' <span style="color:#6b7280;font-size:12px;">'+it.model+'</span>':'')+'</td><td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:center;">'+it.qty+'</td><td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:right;">$'+it.price.toFixed(2)+'</td><td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:right;font-weight:600;">$'+lt.toFixed(2)+'</td></tr>';}).join('');
  var dateStr=new Date(order.date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  var thankYou=typeof adminInvoiceMessage!=='undefined'?adminInvoiceMessage:'THANK YOU FOR YOUR BUSINESS!';
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">'
    +'<div style="max-width:600px;margin:0 auto;background:#fff;">'
    +'<div style="background:#1a2744;padding:20px 32px;text-align:center;"><img src="'+DC_APPLIANCE_LOGO+'" style="max-width:160px;height:auto;display:block;margin:0 auto 8px;" alt="DC Appliance"/><h1 style="margin:0;color:#fff;font-size:22px;">DC Appliance</h1><p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Invoice / Receipt</p></div>'
    +'<div style="padding:28px 32px;">'
    +'<table style="width:100%;"><tr><td><p style="margin:0;font-size:13px;color:#6b7280;font-weight:700;">INVOICE</p><p style="margin:2px 0 0;font-size:18px;font-weight:700;color:#1f2937;">'+order.id+'</p></td><td style="text-align:right;"><p style="margin:0;font-size:13px;color:#6b7280;font-weight:700;">DATE</p><p style="margin:2px 0 0;font-size:14px;color:#1f2937;">'+dateStr+'</p></td></tr></table>'
    +'<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">'
    +'<p style="margin:0 0 4px;font-size:13px;color:#6b7280;font-weight:700;">BILL TO</p>'
    +'<p style="margin:0;font-size:15px;font-weight:600;color:#1f2937;">'+(order.soldTo?order.soldTo.name:order.customer)+'</p>'
    +(order.soldTo&&order.soldTo.addr?'<p style="margin:2px 0 0;font-size:13px;color:#4b5563;">'+order.soldTo.addr+'</p>':'')
    +(order.soldTo&&order.soldTo.city?'<p style="margin:0;font-size:13px;color:#4b5563;">'+order.soldTo.city+(order.soldTo.state?', '+order.soldTo.state:'')+(order.soldTo.zip?' '+order.soldTo.zip:'')+'</p>':'')
    +(order.soldTo&&order.soldTo.phone?'<p style="margin:4px 0 0;font-size:13px;color:#4b5563;">'+order.soldTo.phone+'</p>':'')
    +'</div>'
    +'<table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:6px;"><thead><tr><th style="padding:10px 12px;background:#f8fafc;font-size:12px;color:#6b7280;text-align:left;font-weight:700;">ITEM</th><th style="padding:10px 12px;background:#f8fafc;font-size:12px;color:#6b7280;text-align:center;font-weight:700;">QTY</th><th style="padding:10px 12px;background:#f8fafc;font-size:12px;color:#6b7280;text-align:right;font-weight:700;">PRICE</th><th style="padding:10px 12px;background:#f8fafc;font-size:12px;color:#6b7280;text-align:right;font-weight:700;">TOTAL</th></tr></thead><tbody>'+itemsHtml+'</tbody></table>'
    +'<div style="margin-top:16px;text-align:right;">'
    +'<p style="margin:4px 0;font-size:14px;color:#4b5563;">Subtotal: <strong>$'+order.subtotal.toFixed(2)+'</strong></p>'
    +'<p style="margin:4px 0;font-size:14px;color:#4b5563;">Tax'+(order.taxZone?' ('+order.taxZone+')':'')+': <strong>$'+order.tax.toFixed(2)+'</strong></p>'
    +'<p style="margin:8px 0;font-size:18px;font-weight:700;color:#1f2937;">Total: $'+order.total.toFixed(2)+'</p>'
    +'</div>'
    +'<div style="margin-top:12px;padding:10px 14px;background:#f0fdf4;border-radius:6px;font-size:13px;color:#166534;"><strong>Payment:</strong> '+order.payment+'</div>'
    +(order.clerk?'<p style="margin-top:12px;font-size:13px;color:#6b7280;">Salesperson: <strong>'+order.clerk+'</strong></p>':'')
    +(order.invoiceNotes?'<div style="margin-top:12px;padding:12px 16px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;font-size:13px;color:#92400e;">'+order.invoiceNotes+'</div>':'')
    +'<div style="margin-top:28px;text-align:center;padding:16px;background:#f8fafc;border-radius:8px;"><p style="font-size:15px;font-weight:700;color:#1f2937;margin:0;">'+thankYou+'</p></div>'
    +'<p style="font-size:14px;color:#1f2937;font-weight:600;margin:16px 0 4px;text-align:center;">(620) 371-6417</p>'
    +'<p style="font-size:13px;color:#6b7280;text-align:center;">DC Appliance &mdash; Dodge City, KS</p>'
    +'</div></div></body></html>';
}

// ══════════════════════════════════════════════
// INVENTORY TAB
// ══════════════════════════════════════════════
var invViewMode='active';
function invSetView(mode){
  invViewMode=mode;
  document.getElementById('inv-tog-active').classList.toggle('active',mode==='active');
  document.getElementById('inv-tog-inactive').classList.toggle('active',mode==='inactive');
  renderInventory();
}
function getProductDept(p){
  var cat=p.cat||'';
  for(var i=0;i<DEPARTMENTS.length;i++){
    for(var j=0;j<DEPARTMENTS[i].cats.length;j++){
      if(DEPARTMENTS[i].cats[j]===cat)return DEPARTMENTS[i].name;
      // fuzzy match for legacy category names
      if(cat==='Washers & Dryers'&&(DEPARTMENTS[i].cats[j]==='Washers'||DEPARTMENTS[i].cats[j]==='Dryers'))return DEPARTMENTS[i].name;
      if(cat==='Ovens & Ranges'&&(DEPARTMENTS[i].cats[j]==='Ranges'||DEPARTMENTS[i].cats[j]==='Wall Ovens'))return DEPARTMENTS[i].name;
    }
  }
  return p.dept||'';
}
var _invSort={col:'name',dir:'asc'};
function invSortBy(col){
  if(_invSort.col===col)_invSort.dir=_invSort.dir==='asc'?'desc':'asc';
  else{_invSort.col=col;_invSort.dir='asc';}
  renderInventory();
}
function invFilterByVendor(vendor){
  var sel=document.getElementById('inv-vendor-filter');if(sel)sel.value=vendor||'';
  renderInventory();
}
function invPopulateVendorFilter(){
  var sel=document.getElementById('inv-vendor-filter');if(!sel)return;
  var expected=Object.keys(PRODUCTS.reduce(function(a,p){if(p.vendor)a[p.vendor]=true;return a;},{})).length;
  if(sel.options.length===expected+1)return; // already populated
  var cur=sel.value;
  var vendors={};PRODUCTS.forEach(function(p){if(p.vendor)vendors[p.vendor]=(vendors[p.vendor]||0)+1;});
  var names=Object.keys(vendors).sort();
  sel.innerHTML='<option value="">All Vendors</option>'+names.map(function(v){return '<option value="'+v+'">'+v+' ('+vendors[v]+')</option>';}).join('');
  if(cur)sel.value=cur;
}

function renderInventory(){
  invPopulateVendorFilter();
  var s=(document.getElementById('inv-search')||{}).value||'';s=s.toLowerCase();
  var vendorFilter=(document.getElementById('inv-vendor-filter')||{}).value||'';
  var hasSearch=s.length>0;
  var filtered=PRODUCTS.filter(function(p){
    var isActive=p.active!==false;
    var matchesSearch=!s||p.name.toLowerCase().includes(s)||p.brand.toLowerCase().includes(s)||(p.model||'').toLowerCase().includes(s)||(p.upc||'').toLowerCase().includes(s)||(p.vendor||'').toLowerCase().includes(s);
    var matchesVendor=!vendorFilter||(p.vendor||'')===vendorFilter;
    if(hasSearch) return matchesSearch&&matchesVendor;
    return matchesSearch&&matchesVendor&&(invViewMode==='active'?isActive:!isActive);
  });
  // Sort
  var col=_invSort.col,dir=_invSort.dir==='asc'?1:-1;
  filtered.sort(function(a,b){
    var va,vb;
    if(col==='stock'){va=(a.stock||0)-(a.sold||0);vb=(b.stock||0)-(b.sold||0);}
    else if(col==='price'){va=a.price||0;vb=b.price||0;}
    else{va=(a[col]||'').toString().toLowerCase();vb=(b[col]||'').toString().toLowerCase();}
    if(va<vb)return -1*dir;if(va>vb)return 1*dir;return 0;
  });
  // Sort indicators
  ['model','name','brand','vendor','stock','price'].forEach(function(c){
    var el=document.getElementById('inv-sort-'+c);if(el)el.textContent=(c===col)?(dir===1?'↑':'↓'):'';
  });
  var tb=document.getElementById('inv-tbody');
  tb.innerHTML=filtered.map(function(p){
    var isActive=p.active!==false;
    var sold=p.sold||0;
    var availMinusSold=Math.max(0,p.stock-sold);
    var oversold=sold>p.stock;
    var sc=oversold?'sp-out':availMinusSold<=0?'sp-out':availMinusSold<=p.reorderPt?'sp-low':'sp-in';
    var sl=oversold?'Oversold':availMinusSold<=0?'Out of Stock':availMinusSold<=p.reorderPt?'Low Stock':'In Stock';
    var dept=getProductDept(p);
    var badge=hasSearch?'<span class="inv-active-badge '+(isActive?'active-badge':'inactive-badge')+'">'+(isActive?'Active':'Inactive')+'</span>':'';
    var actBtn=isActive?
      '<button class="inv-act-btn deactivate" onclick="invDeactivate('+p.id+')">Deactivate</button>':
      '<button class="inv-act-btn activate" onclick="invActivate('+p.id+')">Activate</button>';
    var snBadge=isSerialTracked(p)?'<span style="font-size:8px;font-weight:700;background:#dbeafe;color:#1d4ed8;padding:1px 5px;border-radius:3px;margin-left:4px;">SN</span>':'';
    var lockBadge=p.priceLocked?' <span title="Price locked" style="cursor:pointer;" onclick="togglePriceLock('+p.id+')">&#x1F512;</span>':' <span title="Click to lock price" style="cursor:pointer;color:#d1d5db;" onclick="togglePriceLock('+p.id+')">&#x1F513;</span>';
    var vendorCell=p.vendor?'<a href="#" onclick="event.preventDefault();invFilterByVendor(\''+(p.vendor||'').replace(/'/g,"\\'")+'\')" style="color:#2563eb;font-weight:600;text-decoration:none;">'+p.vendor+'</a>':'<span style="color:#9ca3af;">—</span>';
    return '<tr'+(isActive?'':' style="opacity:0.6;"')+'><td><a class="pc-link" onclick="openProductCard('+p.id+')">'+(p.model||'—')+'</a></td><td><a class="pc-link" style="color:#1f2937;" onclick="openProductCard('+p.id+')">'+p.name+'</a>'+snBadge+badge+'</td><td>'+p.brand+'</td><td style="font-size:10px;">'+vendorCell+'</td><td style="font-size:10px;">'+dept+'</td><td style="font-size:10px;">'+(p.cat||'')+'</td><td style="font-size:10px;color:#6b7280;">'+(p.upc||'')+'</td><td>'+p.stock+'</td><td>'+sold+'</td><td style="font-weight:700;">'+availMinusSold+'</td><td><span class="status-pill '+sc+'">'+sl+'</span></td><td>'+fmt(p.price)+lockBadge+'</td><td>'+fmt(p.cost)+'</td><td>'+actBtn+'</td></tr>';
  }).join('');
  // Low stock alerts — active items only, based on Avail-Sold
  var alerts=PRODUCTS.filter(function(p){var ams=p.stock-(p.sold||0);return p.active!==false&&ams<=p.reorderPt;});
  document.getElementById('inv-alerts-list').innerHTML=alerts.length?alerts.map(function(p){
    var ams=p.stock-(p.sold||0);
    return '<div class="alert-card"><div class="alert-card-name">'+p.name+'</div><div class="alert-card-meta">'+(ams<=0?'OUT OF STOCK':'Only '+ams+' left')+' (reorder at '+p.reorderPt+')</div></div>';
  }).join(''):'<div style="color:var(--gray-2);font-size:12px;text-align:center;padding:20px;">All stock levels OK</div>';
}
function invActivate(pid){
  var p=PRODUCTS.find(function(x){return x.id===pid;});if(!p)return;
  var qty=prompt('Qty on hand for '+p.name+':',p.stock||'0');
  if(qty===null)return;
  p.active=true;
  p.stock=parseInt(qty)||0;
  if(!p.sold)p.sold=0;
  saveProducts();
  renderInventory();refreshSaleView();
  toast(p.name+' activated with '+p.stock+' available','success');
}
function togglePriceLock(pid){
  // Only Owner/Admin can lock/unlock prices
  var role=(currentEmployee&&currentEmployee.posRole)||'Owner/Admin';
  if(role!=='Owner/Admin'&&role!=='General Manager'){toast('Only Owner/Admin can lock prices','error');return;}
  var p=PRODUCTS.find(function(x){return x.id===pid;});if(!p)return;
  p.priceLocked=!p.priceLocked;
  saveProducts();renderInventory();
  toast(p.name+(p.priceLocked?' — price locked':' — price unlocked'),'info');
}
function invDeactivate(pid){
  var p=PRODUCTS.find(function(x){return x.id===pid;});if(!p)return;
  if(!confirm('Deactivate '+p.name+'? It will be hidden from sales.'))return;
  p.active=false;
  saveProducts();
  renderInventory();refreshSaleView();
  toast(p.name+' deactivated','info');
}
function exportCSV(){
  var rows=[['SKU','Product','Brand','Stock','Reorder Pt','Reorder Qty','Retail','Cost','Serial','Warranty']];
  PRODUCTS.forEach(function(p){rows.push([p.model||'',p.name,p.brand,p.stock,p.reorderPt,p.reorderQty,p.price,p.cost,p.serial,p.warranty,p.upc||'']);});
  var csv=rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',');}).join('\n');
  var blob=new Blob([csv],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='inventory.csv';a.click();
  toast('CSV exported','success');
}
// ═══ SERIAL TRACKED — central lists ═══
// Category names (from inventory data) that require serial tracking
var SERIAL_TRACKED_CATS=['BOTTOM MOUNT FRIDGE','BUILT IN','COMBO WASHER DRYER','COOK TOP','DISHWASHERS','DRYERS','FREEZER','FRENCH DOOR FRIDGE','ICEMKR','RANGES','SIDE BY SIDE FRIDGE','TOP MOUNT','TRASH COMPACTOR','WASHERS','BEVERAGE CENTER','Refrigerators','Washers & Dryers','Dishwashers','Ovens & Ranges','Wall Ovens','Microwaves','MICROWAVE','OTR MICROWAVE','COUNTERTOP MICROWAVE','BUILT-IN MICROWAVE','Ice Makers','ICE MAKER'];
// Appliance type names (from delivery dropdown) that require serial tracking
var SERIAL_TRACKED_APPLIANCES=['Refrigerator','Washer','Dryer','Dishwasher','Oven / Range','Wall Oven','Microwave','Freezer','Ice Maker','Garbage Disposal','AC Unit','TV'];

function isSerialTracked(p){
  if(p.serialTracked!==undefined)return !!p.serialTracked;
  // Check by category name
  if(SERIAL_TRACKED_CATS.indexOf(p.cat)!==-1)return true;
  // Check by product name containing a tracked appliance type
  var nm=(p.name||'').toLowerCase();
  return SERIAL_TRACKED_APPLIANCES.some(function(a){return nm.indexOf(a.toLowerCase())>=0;});
}

function populateVendorDropdown(selId){
  var sel=document.getElementById(selId);if(!sel)return;
  var val=sel.value;sel.innerHTML='<option value="">— Select —</option>';
  (typeof adminVendors!=='undefined'?adminVendors:[]).forEach(function(v){sel.innerHTML+='<option value="'+v.name+'">'+v.name+'</option>';});
  if(val)sel.value=val;
}

// ═══ MODEL LOOKUP — AI POWERED ═══
async function lookupModel(){
  var sku=(document.getElementById('ap-sku')||{}).value.trim();
  if(!sku){toast('Enter a model number first','error');return;}
  var resultEl=document.getElementById('ap-lookup-result');
  resultEl.style.display='block';
  resultEl.innerHTML='<div style="display:flex;align-items:center;gap:8px;"><div style="width:14px;height:14px;border:2px solid #bfdbfe;border-top-color:#2563eb;border-radius:50%;animation:spin 0.6s linear infinite;"></div> Looking up '+sku+' from manufacturer sites...</div>';
  try{
    var prompt='Look up appliance model number "'+sku+'" from manufacturer sources (Whirlpool, Maytag, KitchenAid, Amana, LG, Samsung, GE Appliances, Frigidaire/Electrolux). '
      +'Return JSON only: {"brand":"Brand Name","description":"Full product description with key features","category":"Category","specs":{"dimensions":"","capacity":"","features":""},"specSheetUrl":"","found":true}. '
      +'If you cannot find reliable info, return {"found":false}. JSON only, no explanation.';
    var data=await claudeApiCall({messages:[{role:'user',content:prompt}],max_tokens:600});
    var match=data.content[0].text.match(/\{[\s\S]*\}/);
    if(!match)throw new Error('No JSON found');
    var parsed=JSON.parse(match[0]);
    if(!parsed.found){
      resultEl.innerHTML='<div style="color:#9a3412;">&#x26A0; Could not find info for '+sku+' — please fill in manually.</div>';
      return;
    }
    // Show preview + confirm
    var h='<div style="font-weight:700;margin-bottom:6px;color:#1e40af;">Found: '+sku+'</div>';
    if(parsed.brand)h+='<div><strong>Brand:</strong> '+parsed.brand+'</div>';
    if(parsed.description)h+='<div style="margin:4px 0;"><strong>Description:</strong> '+parsed.description+'</div>';
    if(parsed.category)h+='<div><strong>Category:</strong> '+parsed.category+'</div>';
    if(parsed.specs){
      if(parsed.specs.dimensions)h+='<div><strong>Dimensions:</strong> '+parsed.specs.dimensions+'</div>';
      if(parsed.specs.capacity)h+='<div><strong>Capacity:</strong> '+parsed.specs.capacity+'</div>';
      if(parsed.specs.features)h+='<div><strong>Features:</strong> '+parsed.specs.features+'</div>';
    }
    if(parsed.specSheetUrl)h+='<div style="margin-top:4px;"><a href="'+parsed.specSheetUrl+'" target="_blank" style="color:#2563eb;">View Spec Sheet</a></div>';
    h+='<div style="margin-top:8px;display:flex;gap:6px;"><button class="primary-btn" onclick="applyLookup()" type="button">Use This</button><button class="ghost-btn" onclick="document.getElementById(\'ap-lookup-result\').style.display=\'none\';" type="button">Dismiss</button></div>';
    resultEl.innerHTML=h;
    window._lookupData=parsed;
  }catch(e){
    resultEl.innerHTML='<div style="color:#9a3412;">&#x26A0; Lookup failed: '+e.message+' — please fill in manually.</div>';
  }
}

function applyLookup(){
  var p=window._lookupData;if(!p)return;
  var nameEl=document.getElementById('ap-name');
  var brandEl=document.getElementById('ap-brand');
  var catEl=document.getElementById('ap-cat');
  if(p.description)nameEl.value=p.description;
  if(p.brand&&!brandEl.value)brandEl.value=p.brand;
  if(p.category&&catEl){
    for(var i=0;i<catEl.options.length;i++){if(catEl.options[i].value.toLowerCase()===p.category.toLowerCase()){catEl.selectedIndex=i;break;}}
  }
  // Store spec sheet URL for later save
  window._lookupSpecSheetUrl=p.specSheetUrl||'';
  document.getElementById('ap-lookup-result').innerHTML='<div style="color:#16a34a;font-weight:600;">&#x2713; Applied — fields filled in.</div>';
  setTimeout(function(){document.getElementById('ap-lookup-result').style.display='none';},2000);
}

function addProduct(){
  var sku=document.getElementById('ap-sku').value.trim(),name=document.getElementById('ap-name').value.trim(),brand=document.getElementById('ap-brand').value.trim();
  if(!sku||!name||!brand){toast('Fill in required fields','error');return;}
  var stEl=document.getElementById('ap-serial-tracked');
  PRODUCTS.push({id:PRODUCTS.length+100,sku:sku,model:sku,name:name,brand:brand,cat:document.getElementById('ap-cat').value,price:parseFloat(document.getElementById('ap-price').value)||0,cost:parseFloat(document.getElementById('ap-cost').value)||0,stock:parseInt(document.getElementById('ap-stock').value)||0,reorderPt:parseInt(document.getElementById('ap-reorder').value)||2,reorderQty:parseInt(document.getElementById('ap-reorderqty').value)||3,sales30:0,serial:document.getElementById('ap-serial').value,warranty:document.getElementById('ap-warranty').value,icon:'&#x1F4E6;',serialTracked:stEl?stEl.checked:true,upc:(document.getElementById('ap-upc')||{}).value||'',vendor:(document.getElementById('ap-vendor')||{}).value||'',serialPool:[],specSheetUrl:window._lookupSpecSheetUrl||''});
  window._lookupSpecSheetUrl='';window._lookupData=null;
  saveProducts();
  closeModal('add-product-modal');renderInventory();refreshSaleView();toast('Product added','success');
}

// ── CSV INVENTORY UPLOAD ──
var csvParsedRows=[];
function csvReset(){csvParsedRows=[];document.getElementById('csv-preview').style.display='none';document.getElementById('csv-import-btn').style.display='none';document.getElementById('csv-error').style.display='none';var fi=document.getElementById('csv-file-input');if(fi)fi.value='';}
function csvHandleFile(file){
  if(!file){return;}csvReset();
  var reader=new FileReader();
  reader.onload=function(e){
    var lines=e.target.result.split(/\r?\n/).filter(function(l){return l.trim();});
    if(lines.length<2){document.getElementById('csv-error').style.display='block';document.getElementById('csv-error').textContent='CSV must have a header row and at least one data row.';return;}
    var hdr=lines[0].split(',').map(function(h){return h.trim().replace(/^"|"$/g,'').toLowerCase();});
    var colMap={model:-1,desc:-1,brand:-1,cat:-1,cost:-1,price:-1,qty:-1};
    hdr.forEach(function(h,i){
      if(h.match(/model|sku|item/i))colMap.model=i;
      else if(h.match(/desc|name|product/i))colMap.desc=i;
      else if(h.match(/brand|mfg|manufacturer/i))colMap.brand=i;
      else if(h.match(/cat|category|type/i))colMap.cat=i;
      else if(h.match(/cost|wholesale/i))colMap.cost=i;
      else if(h.match(/sell|retail|price/i))colMap.price=i;
      else if(h.match(/qty|quantity|stock|on.?hand/i))colMap.qty=i;
    });
    csvParsedRows=[];var errors=[];
    for(var i=1;i<lines.length;i++){
      var cols=csvParseLine(lines[i]);
      var row={model:cols[colMap.model]||'',desc:cols[colMap.desc]||'',brand:cols[colMap.brand]||'',cat:cols[colMap.cat]||'Uncategorized',cost:parseFloat(cols[colMap.cost])||0,price:parseFloat(cols[colMap.price])||0,qty:parseInt(cols[colMap.qty])||0,status:'new'};
      if(!row.model&&!row.desc){errors.push('Row '+(i+1)+': missing model# and description');row.status='error';}
      else{
        var dup=PRODUCTS.find(function(p){return p.model===row.model;});
        if(dup){row.status='update';row.existingId=dup.id;}
      }
      csvParsedRows.push(row);
    }
    document.getElementById('csv-row-count').textContent=csvParsedRows.length;
    document.getElementById('csv-preview-tbody').innerHTML=csvParsedRows.map(function(r){
      var sc=r.status==='error'?'color:var(--red)':r.status==='update'?'color:var(--orange)':'color:var(--green)';
      var sl=r.status==='error'?'Error':r.status==='update'?'Update':'New';
      return '<tr><td>'+r.model+'</td><td>'+r.desc+'</td><td>'+r.brand+'</td><td>'+r.cat+'</td><td>'+fmt(r.cost)+'</td><td>'+fmt(r.price)+'</td><td>'+r.qty+'</td><td style="'+sc+';font-weight:700;font-size:10px;">'+sl+'</td></tr>';
    }).join('');
    document.getElementById('csv-preview').style.display='block';
    document.getElementById('csv-import-btn').style.display='inline-block';
    if(errors.length>0){document.getElementById('csv-error').style.display='block';document.getElementById('csv-error').textContent=errors.join('; ');}
  };
  reader.readAsText(file);
}
function csvParseLine(line){
  var result=[],current='',inQuotes=false;
  for(var i=0;i<line.length;i++){
    var c=line[i];
    if(c==='"'){inQuotes=!inQuotes;}
    else if(c===','&&!inQuotes){result.push(current.trim());current='';}
    else{current+=c;}
  }
  result.push(current.trim());return result;
}
function csvImport(){
  var added=0,updated=0;
  csvParsedRows.forEach(function(r){
    if(r.status==='error')return;
    if(r.status==='update'&&r.existingId){
      var p=PRODUCTS.find(function(x){return x.id===r.existingId;});
      if(p){p.name=r.desc||p.name;p.brand=r.brand||p.brand;p.cat=r.cat||p.cat;p.cost=r.cost||p.cost;p.price=r.price||p.price;p.stock=r.qty;updated++;}
    }else{
      PRODUCTS.push({id:PRODUCTS.length+200+added,model:r.model,name:r.desc,brand:r.brand,cat:r.cat,price:r.price,cost:r.cost,stock:r.qty,sold:0,upc:'',reorderPt:2,reorderQty:3,sales30:0,serial:'',warranty:'1 Year',icon:'📦'});
      added++;
    }
  });
  saveProducts();
  closeModal('csv-upload-modal');csvReset();renderInventory();refreshSaleView();
  toast(added+' added, '+updated+' updated','success');
}


// ══════════════════════════════════════════════
// OPEN ORDERS TAB
// ══════════════════════════════════════════════
var ooSort='date-asc',ooSpFilter='';
function renderOrders(){
  // Build filter pills
  var filters=[{key:'All',label:'All'},{key:'My Orders',label:'My Orders'},{key:'Online Orders',label:'Online Orders'},{key:'Needs Delivery',label:'Needs Delivery'},{key:'No Delivery Date',label:'No Delivery Date'}];
  // Collect unique salespeople from open orders
  var salesPeople={};
  orders.forEach(function(o){if(!isOrderFullyDelivered(o)&&o.status!=='Quote'&&o.clerk)salesPeople[o.clerk]=(salesPeople[o.clerk]||0)+1;});
  var spNames=Object.keys(salesPeople).sort();
  var spOpts='<option value="">All Salespeople</option>'+spNames.map(function(n){return '<option value="'+n+'"'+(ooSpFilter===n?' selected':'')+'>'+n+' ('+salesPeople[n]+')</option>';}).join('');
  // Sort options
  var sortOpts=[
    {v:'date-asc',l:'Date (Oldest First)'},
    {v:'date-desc',l:'Date (Newest First)'},
    {v:'id',l:'Invoice # (Ascending)'},
    {v:'customer',l:'Customer A-Z'},
    {v:'total',l:'Total (High to Low)'},
    {v:'salesperson',l:'Salesperson A-Z'}
  ];
  var sortSelHtml='<select onchange="ooSort=this.value;renderOrders();" style="font-size:11px;padding:5px 8px;border:1px solid #d1d5db;border-radius:6px;background:#fff;">'+sortOpts.map(function(s){return '<option value="'+s.v+'"'+(ooSort===s.v?' selected':'')+'>'+s.l+'</option>';}).join('')+'</select>';
  // Build toolbar
  var toolbarHtml='<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:8px 12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">';
  toolbarHtml+=filters.map(function(f){return '<button class="oo-filter'+(f.key===ooFilter?' active':'')+'" onclick="ooFilter=\''+f.key+'\';renderOrders();" style="font-size:11px;padding:5px 10px;">'+f.label+'</button>';}).join('');
  toolbarHtml+='<select onchange="ooSpFilter=this.value;renderOrders();" style="font-size:11px;padding:5px 8px;border:1px solid #d1d5db;border-radius:6px;background:#fff;margin-left:auto;">'+spOpts+'</select>';
  toolbarHtml+=sortSelHtml;
  toolbarHtml+='</div>';
  document.getElementById('oo-toolbar').innerHTML=toolbarHtml;

  // Filter orders
  var now=Date.now();
  var filtered=orders.filter(function(o){
    if(o.status==='Quote')return false;
    if(isOrderFullyDelivered(o))return false; // Remove fully delivered
    // Filter pills
    if(ooFilter==='My Orders'){var mine=(currentEmployee&&currentEmployee.name)||'';if(o.clerk!==mine)return false;}
    else if(ooFilter==='Online Orders'){if(o.source!=='online'&&!(o.status||'').toLowerCase().includes('online'))return false;}
    else if(ooFilter==='Needs Delivery'){if(!o.deliveryDate)return false;}
    else if(ooFilter==='No Delivery Date'){if(o.deliveryDate)return false;}
    // Salesperson filter
    if(ooSpFilter&&o.clerk!==ooSpFilter)return false;
    return true;
  });
  // Sort
  filtered.sort(function(a,b){
    if(ooSort==='date-asc')return new Date(a.date)-new Date(b.date);
    if(ooSort==='date-desc')return new Date(b.date)-new Date(a.date);
    if(ooSort==='id')return (a.id||'').localeCompare(b.id||'');
    if(ooSort==='customer')return (a.customer||'').localeCompare(b.customer||'');
    if(ooSort==='total')return (b.total||0)-(a.total||0);
    if(ooSort==='salesperson')return (a.clerk||'').localeCompare(b.clerk||'');
    return 0;
  });

  document.getElementById('oo-list').innerHTML=filtered.length?filtered.map(function(o){
    var daysOpen=Math.floor((now-new Date(o.date))/(1000*60*60*24));
    var ageBg='';if(daysOpen>60)ageBg='background:#fef2f2;border-left:3px solid #dc2626;';else if(daysOpen>30)ageBg='background:#fffbeb;border-left:3px solid #eab308;';
    var isOnline=o.source==='online';
    var partial=o.items&&o.items.some(function(i){return i.delivered;});
    var statusLabel=isOnline?'Online Order':(partial?'Partially Delivered':'Open');
    var statusColor=isOnline?'#7c3aed':(partial?'#ea580c':'#2563eb');
    var statusBg=isOnline?'#ede9fe':(partial?'#ffedd5':'#dbeafe');
    var items=(o.items||[]).map(function(i){return i.name;}).join(', ');
    if(items.length>50)items=items.slice(0,47)+'...';
    var delStr=o.deliveryDate?'&#x1F4C5; '+new Date(o.deliveryDate+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}):'<span style="color:#d97706;">No delivery date</span>';
    // Balance
    var paid=(o.payments||[]).reduce(function(s,p){return s+(p.amount||0);},0);
    var balance=(o.total||0)-paid;
    var balanceHtml=balance>0.01?'<span style="color:#dc2626;font-weight:700;">Due: '+fmt(balance)+'</span>':'<span style="color:#16a34a;font-weight:600;">Paid</span>';
    var isActive=selectedOrder&&selectedOrder.id===o.id;
    return '<div class="oo-card'+(isActive?' active':'')+'" onclick="selectOrder(\''+o.id+'\')" style="padding:10px 12px;margin-bottom:6px;border-radius:6px;cursor:pointer;'+ageBg+(isActive?'border-color:var(--gold);':'')+'">'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">'
      +'<div><div style="font-weight:700;font-size:12px;">'+o.id+'</div><div style="font-size:13px;font-weight:600;">'+o.customer+'</div></div>'
      +'<span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:100px;background:'+statusBg+';color:'+statusColor+';">'+statusLabel+'</span>'
      +'</div>'
      +'<div style="font-size:10px;color:var(--gray-2);margin-bottom:3px;">'+new Date(o.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+' &middot; <strong>Open '+daysOpen+' day'+(daysOpen===1?'':'s')+'</strong> &middot; '+(o.clerk||'—')+'</div>'
      +(items?'<div style="font-size:10px;color:var(--gray-2);margin-bottom:3px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+items+'</div>':'')
      +'<div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-top:4px;">'
      +'<span style="color:var(--gray-2);">'+delStr+'</span>'
      +'<span style="font-weight:700;">'+fmt(o.total)+' &middot; '+balanceHtml+'</span>'
      +'</div>'
      +'</div>';
  }).join(''):'<div style="text-align:center;color:var(--gray-2);padding:30px;font-size:12px;">No open orders</div>';
  if(selectedOrder)renderOrderDetail();
}

function isOrderFullyDelivered(o){
  if(!o||!o.items||!o.items.length)return false;
  // Fully delivered if every item is marked delivered OR order status is Delivered/Complete
  if(o.status==='Delivered'||o.status==='Paid in Full')return o.items.every(function(i){return i.delivered;});
  return o.items.every(function(i){return i.delivered;});
}
function selectOrder(id){
  selectedOrder=orders.find(function(o){return o.id===id;})||null;
  renderOrders();renderOrderDetail();
}
function renderOrderDetail(){
  var el=document.getElementById('oo-detail');
  if(!selectedOrder){el.innerHTML='<div class="oo-detail-empty">Select an order to view details</div>';return;}
  var o=selectedOrder;
  var allDelivered=true;
  var itemsHtml=o.items.map(function(i,idx){
    var p=PRODUCTS.find(function(x){return x.id===i.id;});
    var inStock=p?p.stock>=i.qty:false;
    var tracked=p?isSerialTracked(p):(i.serialTracked||false);
    var delivered=!!i.delivered;
    if(!delivered)allDelivered=false;
    var deliveryHtml='';
    if(!isQuote){
      if(delivered){
        deliveryHtml='<div style="display:flex;align-items:center;gap:6px;margin-top:6px;"><span style="color:var(--green);font-size:14px;">&#x2713;</span><span style="font-size:11px;color:var(--green);font-weight:600;">Delivered</span>'+(i.serial?'<span style="font-size:10px;color:var(--gray-2);background:var(--bg3);padding:2px 6px;border-radius:3px;">SN: '+i.serial+'</span>':'')+(i.deliveredAt?'<span style="font-size:10px;color:var(--gray-3);margin-left:auto;">'+new Date(i.deliveredAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})+'</span>':'')+'</div>';
      }else if(tracked){
        deliveryHtml='<div style="display:flex;align-items:center;gap:6px;margin-top:6px;"><input class="inp" id="ood-sn-'+idx+'" placeholder="Serial number" value="'+(i.serial||'')+'" style="flex:1;font-size:11px;padding:5px 8px;max-width:200px;"/>'+(i.serial==='PENDING'?'<span style="font-size:10px;color:var(--orange);font-weight:700;">SN Pending</span>':'')+'<label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--gray-2);cursor:pointer;white-space:nowrap;"><input type="checkbox" id="ood-del-'+idx+'" style="accent-color:var(--green);"/> Delivered</label></div>';
      }else{
        deliveryHtml='<div style="display:flex;align-items:center;gap:6px;margin-top:6px;"><label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--gray-2);cursor:pointer;"><input type="checkbox" id="ood-del-'+idx+'" style="accent-color:var(--green);"/> Mark Delivered</label></div>';
      }
    }
    return '<div class="ood-item" style="flex-wrap:wrap;"><div class="ood-item-info"><div class="ood-item-name">'+i.name+'</div><div class="ood-item-meta">'+(i.model?'<a class="pc-link" onclick="openProductCardByModel(\''+i.model.replace(/'/g,"\\'")+'\')">'+i.model+'</a>':'')+' x '+i.qty+(inStock?' <span style="color:var(--green);">In Stock</span>':' <span style="color:var(--red);">Low/Out</span>')+'</div></div><div class="ood-item-price">'+fmt(i.price*i.qty)+'</div><div style="width:100%;">'+deliveryHtml+'</div></div>';
  }).join('');
  var isQuote=o.status==='Quote';
  var notesHtml='';
  if(o.invoiceNotes)notesHtml+='<div class="ood-section"><div class="ood-section-title">Invoice Notes</div><div class="ood-notes">'+o.invoiceNotes+'</div></div>';
  if(o.shipperNotes)notesHtml+='<div class="ood-section"><div class="ood-section-title">Shipper Notes <span style="font-size:9px;color:var(--gray-3);font-weight:400;">(internal)</span></div><div class="ood-notes" style="border-left:3px solid var(--orange);">'+o.shipperNotes+'</div></div>';
  var actionsHtml='';
  if(isQuote){
    actionsHtml='<div class="ood-actions"><button class="ood-btn green" onclick="convertQuoteToSale(\''+o.id+'\')">Convert to Sale</button><button class="ood-btn blue" onclick="printInvoice(\''+o.id+'\')">Print Quote</button><button class="ood-btn red" onclick="deleteOrder(\''+o.id+'\')">Delete</button></div>';
  } else {
    actionsHtml='<div class="ood-actions">';
    if(!allDelivered)actionsHtml+='<button class="ood-btn" style="border-color:#86efac;color:#16a34a;background:#f0fdf4;font-weight:700;" onclick="confirmItemDelivery(\''+o.id+'\')">&#x2713; Confirm Delivery</button>';
    actionsHtml+='<button class="ood-btn green" onclick="setOrderStatus(\''+o.id+'\',\'Awaiting Delivery\')">Awaiting Delivery</button><button class="ood-btn orange" onclick="setOrderStatus(\''+o.id+'\',\'Awaiting Product\')">Awaiting Product</button><button class="ood-btn blue" onclick="setOrderStatus(\''+o.id+'\',\'Partial\')">Partial</button><button class="ood-btn" style="border-color:#93c5fd;color:#2563eb;" onclick="editOrder(\''+o.id+'\')">Edit</button><button class="ood-btn" style="border-color:#86efac;color:#16a34a;background:#f0fdf4;" onclick="orderRecordPayment(\''+o.id+'\')">Record Payment</button><button class="ood-btn" style="border-color:#c4b5fd;color:#6d28d9;" onclick="emailOrderReceipt(\''+o.id+'\')">&#x2709; Email Invoice</button><button class="ood-btn" style="border-color:#c4b5fd;color:#6d28d9;" onclick="emailInvoicePdf(\''+o.id+'\')">&#x1F4CE; Email Full Invoice (PDF)</button><button class="ood-btn" style="border-color:rgba(201,151,58,0.3);color:var(--gold);" onclick="printInvoice(\''+o.id+'\')">Print Invoice</button><button class="ood-btn" style="border-color:rgba(224,144,80,0.3);color:var(--orange);" onclick="printShipperTicket(\''+o.id+'\')">Print Shipper Copy</button><button class="ood-btn" style="border-color:#86efac;color:#16a34a;" onclick="printBothDocuments(\''+o.id+'\')">Print Both</button><button class="ood-btn red" onclick="deleteOrder(\''+o.id+'\')">Delete</button></div>';
  }
  el.innerHTML='<div class="ood-hdr"><div class="ood-title">'+o.id+(isQuote?' <span class="oo-quote-badge">Quote</span>':'')+'</div><div class="ood-meta"><a href="#" style="color:var(--blue);text-decoration:none;font-weight:600;" onclick="event.preventDefault();openCustomerProfile(\''+o.customer.replace(/'/g,"\\'")+'\')">'+o.customer+'</a> &middot; '+new Date(o.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+'</div></div>'+
  '<div class="ood-section"><div class="ood-section-title">Items</div>'+itemsHtml+'</div>'+
  '<div class="ood-section"><div class="ood-section-title">'+( isQuote?'Quote':'Order')+' Details</div><div class="ood-grid"><div class="ood-field"><div class="ood-label">Payment</div><div class="ood-val">'+o.payment+'</div></div><div class="ood-field"><div class="ood-label">Tax Zone</div><div class="ood-val">'+(o.taxZone||'')+'</div></div><div class="ood-field"><div class="ood-label">Subtotal</div><div class="ood-val">'+fmt(o.subtotal)+'</div></div><div class="ood-field"><div class="ood-label">Tax</div><div class="ood-val">'+fmt(o.tax)+'</div></div><div class="ood-field"><div class="ood-label">Total</div><div class="ood-val" style="color:var(--gold);font-weight:700;">'+fmt(o.total)+'</div></div><div class="ood-field"><div class="ood-label">Status</div><div class="ood-val">'+o.status+'</div></div></div></div>'+
  notesHtml+
  (o.notes?'<div class="ood-notes">'+o.notes+'</div>':'')+
  (o.emailLog&&o.emailLog.length?'<div class="ood-section"><div class="ood-section-title">Emails Sent</div>'+o.emailLog.map(function(e){var tl=e.type==='invoice_receipt'?'Receipt':e.type==='delivery_confirmation'?'Delivery Confirm':e.type||'Email';return '<div style="font-size:11px;color:var(--gray-2);margin-bottom:4px;display:flex;align-items:center;gap:6px;"><span style="color:var(--green);">&#x2709;</span><span>'+tl+' to <strong>'+e.to+'</strong></span><span style="color:var(--gray-3);margin-left:auto;">'+new Date(e.ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+'</span></div>';}).join('')+'</div>':'')+
  actionsHtml;
}
async function emailOrderReceipt(id){
  var o=orders.find(function(x){return x.id===id;});if(!o)return;
  var custEmail='';
  var c=customers.find(function(c){return c.name===o.customer;});
  if(c&&c.email)custEmail=c.email;
  if(c&&c.emailOptOut){toast('Customer has opted out of emails','error');return;}
  if(!custEmail){
    custEmail=prompt('Enter email address for receipt:','');
    if(!custEmail||!custEmail.includes('@'))return;
  }else{if(!confirm('Send receipt to '+custEmail+'?'))return;}
  toast('Sending receipt...','info');
  var res=await sendInvoiceEmail(o,custEmail);
  if(res.ok){
    if(!o.emailLog)o.emailLog=[];
    o.emailLog.push({ts:new Date().toISOString(),to:custEmail,type:'invoice_receipt',by:currentEmployee?currentEmployee.name:'Admin'});
    saveOrders();renderOrderDetail();
    toast('Email sent to '+custEmail,'success');
  }else{toast('Email failed: '+(res.error||'Unknown error'),'error');}
}
function confirmItemDelivery(id){
  var o=orders.find(function(x){return x.id===id;});if(!o)return;
  var anyChecked=false;
  o.items.forEach(function(item,idx){
    if(item.delivered)return;
    var cb=document.getElementById('ood-del-'+idx);
    if(!cb||!cb.checked)return;
    var p=PRODUCTS.find(function(x){return x.id===item.id;});
    var tracked=p?isSerialTracked(p):(item.serialTracked||false);
    if(tracked){
      var snEl=document.getElementById('ood-sn-'+idx);
      var sn=snEl?snEl.value.trim():'';
      if(!sn){toast('Enter serial number for '+item.name,'error');snEl&&snEl.focus();return;}
      item.serial=sn;
    }
    item.delivered=true;
    item.deliveredAt=new Date().toISOString();
    item.deliveredBy=currentEmployee?currentEmployee.name:(o.clerk||'Admin');
    // Record commission data
    if(p){
      var cat=p.cat||'';
      var commRate=0;
      if(typeof adminCommissions!=='undefined'){
        var ov=adminCommissions.overrides?adminCommissions.overrides.find(function(x){return x.person===(o.clerk||'')&&x.cat===cat;}):null;
        commRate=ov?parseFloat(ov.pct):((adminCommissions.defaults&&adminCommissions.defaults[cat])?parseFloat(adminCommissions.defaults[cat]):0);
      }
      item.commissionRate=commRate;
      item.commissionEarned=(item.price*item.qty)*(commRate/100);
    }
    anyChecked=true;
  });
  if(!anyChecked){toast('Check items to mark as delivered','error');return;}
  // If all items delivered, update order status
  if(o.items.every(function(i){return !!i.delivered;})){o.status='Delivered';}
  else if(o.items.some(function(i){return !!i.delivered;})){o.status='Partial';}
  saveOrders();selectedOrder=o;renderOrderDetail();renderOrders();
  toast('Delivery confirmed','success');
}
function editOrder(id){
  var o=orders.find(function(x){return x.id===id;});if(!o)return;
  if(o.status==='Delivered'||o.status==='Paid in Full'){
    if(!confirm('This order is already '+o.status+'. Edit anyway?'))return;
  }
  // Load into cart for editing
  if(cart.length&&!confirm('Current cart will be replaced. Continue?'))return;
  cart=(o.items||[]).map(function(i){return{id:i.id,name:i.name,model:i.model||'',price:i.price,qty:i.qty,serial:i.serial||'',isService:false};});
  // Fill customer fields
  var st=o.soldTo||{};var sh=o.shipTo||{};
  var fill=function(id,v){var el=document.getElementById(id);if(el)el.value=v||'';};
  fill('cart-sold-name',st.name);fill('cart-sold-addr',st.addr);fill('cart-sold-city',st.city);fill('cart-sold-state',st.state);fill('cart-sold-zip',st.zip);fill('cart-sold-phone',st.phone);
  fill('cart-ship-name',sh.name);fill('cart-ship-addr',sh.addr);fill('cart-ship-city',sh.city);fill('cart-ship-state',sh.state);fill('cart-ship-zip',sh.zip);
  fill('cart-po',o.po);fill('cart-job',o.job);fill('cart-invoice-notes',o.invoiceNotes);fill('cart-shipper-notes',o.shipperNotes);
  if(o.clerk){var cl=document.getElementById('cart-clerk');if(cl)cl.value=o.clerk;}
  // Remove the original order so saving creates a fresh record
  orders=orders.filter(function(x){return x.id!==id;});selectedOrder=null;saveOrders();
  // Navigate to New Sale tab
  var saleTab;document.querySelectorAll('.tb-tab').forEach(function(t){if(t.textContent.trim()==='New Sale')saleTab=t;});
  nav('sale',saleTab);renderCart();refreshSaleView();
  toast('Loaded '+id+' for editing — complete the sale to save changes','info');
}

async function orderRecordPayment(id){
  var o=orders.find(function(x){return x.id===id;});if(!o)return;
  // Calculate current balance
  var paid=(o.payments||[]).reduce(function(s,p){return s+(p.amount||0);},0);
  var balance=o.total-paid;
  if(balance<=0.01){toast('This order is paid in full','info');return;}
  var amt=prompt('Record payment on '+o.id+':\nBalance due: '+fmt(balance),balance.toFixed(2));
  if(!amt)return;amt=parseFloat(amt);if(isNaN(amt)||amt<=0){toast('Invalid amount','error');return;}
  var method=prompt('Payment method (Cash, Check, Card, Financing):','Check')||'Check';
  if(!o.payments)o.payments=[];
  o.payments.push({date:new Date().toISOString(),amount:amt,method:method.trim(),recordedBy:currentEmployee?currentEmployee.name:'Admin'});
  // Also add to customer record for ledger
  var c=customers.find(function(x){return x.name===o.customer;});
  if(c){if(!c.payments)c.payments=[];c.payments.push({date:new Date().toISOString(),amount:amt,method:method.trim(),invoice:o.id,recordedBy:currentEmployee?currentEmployee.name:'Admin'});saveCustomers();}
  // Check if paid in full
  var newPaid=paid+amt;
  if(newPaid>=o.total-0.01)o.status='Paid in Full';
  await saveOrders();renderOrderDetail();renderOrders();
  toast('Payment of '+fmt(amt)+' recorded','success');
}

function setOrderStatus(id,status){var o=orders.find(function(x){return x.id===id;});if(o){o.status=status;saveOrders();renderOrders();toast('Status updated','success');}}
function deleteOrder(id){if(!confirm('Delete this order?'))return;orders=orders.filter(function(o){return o.id!==id;});selectedOrder=null;saveOrders();renderOrders();renderOrderDetail();toast('Order deleted','info');}
function printAddrBlock(label,addr){
  if(!addr||!addr.name)return '';
  return '<div style="margin-bottom:8px;"><div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#888;margin-bottom:2px;">'+label+'</div><div style="font-weight:700;">'+addr.name+'</div>'+(addr.addr?'<div>'+addr.addr+'</div>':'')+(addr.city?'<div>'+addr.city+(addr.state?', '+addr.state:'')+' '+(addr.zip||'')+'</div>':'')+(addr.phone?'<div>'+addr.phone+'</div>':'')+'</div>';
}
// ── SHARED INVOICE DOCUMENT STYLES ──
function getStoreLogoPath(){
  var s=(typeof currentStore!=='undefined'?currentStore:null);
  return (s&&s.logo_url)||'/images/logos/dc-appliance-logo-transparent.png';
}
var INVOICE_LOGO_PATH='/images/logos/dc-appliance-logo-transparent.png';
Object.defineProperty(window,'INVOICE_LOGO_PATH',{get:function(){return getStoreLogoPath();}});
function invoiceDocStyles(){
  return '<style>*{box-sizing:border-box;margin:0;padding:0;}'
    +'body{font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#000;background:#fff;}'
    +'.doc-page{width:8.5in;min-height:11in;padding:0.4in;position:relative;page-break-after:always;}'
    +'.doc-page:last-child{page-break-after:auto;}'
    +'.doc-hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;}'
    +'.doc-hdr-left{flex:1;}'
    +'.doc-logo{max-width:180px;max-height:70px;object-fit:contain;display:block;margin-bottom:4px;}'
    +'.doc-store-tag{font-size:9px;font-weight:700;color:#333;letter-spacing:1px;margin-top:2px;}'
    +'.doc-store-addr{font-size:9px;color:#333;line-height:1.35;margin-top:3px;}'
    +'.doc-hdr-right{width:320px;}'
    +'.doc-title{font-size:28px;font-weight:800;letter-spacing:2px;text-align:right;margin-bottom:4px;}'
    +'.doc-info{border:1px solid #000;}'
    +'.doc-info table{width:100%;border-collapse:collapse;}'
    +'.doc-info td{padding:3px 6px;font-size:9px;border:1px solid #000;}'
    +'.doc-info .lbl{font-size:7px;font-weight:700;text-transform:uppercase;color:#555;display:block;}'
    +'.doc-info .val{font-weight:700;font-size:10px;}'
    +'.doc-info .big .val{font-size:14px;}'
    +'.doc-addr-row{display:flex;gap:10px;margin-bottom:6px;}'
    +'.doc-addr-box{flex:1;border:1px solid #000;padding:6px 8px;}'
    +'.doc-addr-box .box-lbl{font-size:8px;font-weight:700;text-transform:uppercase;background:#eee;padding:2px 4px;margin:-6px -8px 4px -8px;border-bottom:1px solid #000;}'
    +'.doc-addr-box .box-name{font-size:11px;font-weight:700;margin-bottom:2px;}'
    +'.doc-addr-box .box-line{font-size:9px;line-height:1.35;}'
    +'.doc-cat-bar{background:#222;color:#fff;padding:5px 8px;font-size:9px;font-weight:700;letter-spacing:0.5px;text-align:center;margin-bottom:0;}'
    +'.doc-items{width:100%;border-collapse:collapse;border:1px solid #000;}'
    +'.doc-items th{background:#eee;font-size:8px;font-weight:700;text-transform:uppercase;padding:4px 5px;border:1px solid #000;text-align:left;}'
    +'.doc-items td{padding:5px 5px;border:1px solid #000;font-size:9px;vertical-align:top;}'
    +'.doc-items .col-c{text-align:center;}.doc-items .col-r{text-align:right;}'
    +'.doc-watermark{text-align:center;font-size:11px;font-weight:700;color:#bbb;padding:20px 0;letter-spacing:3px;}'
    +'.doc-bot{display:flex;gap:10px;margin-top:10px;}'
    +'.doc-terms{flex:1;font-size:7px;line-height:1.4;color:#333;}'
    +'.doc-terms p{margin-bottom:3px;}'
    +'.doc-totals{width:260px;border:1px solid #000;}'
    +'.doc-totals .tot-row{display:flex;justify-content:space-between;padding:3px 8px;border-bottom:1px solid #000;font-size:10px;}'
    +'.doc-totals .tot-row:last-child{border-bottom:none;font-weight:700;font-size:12px;background:#eee;}'
    +'.doc-totals .tot-row.grand{font-size:14px;font-weight:800;background:#ddd;}'
    +'.doc-paid{font-size:36px;font-weight:800;color:#c00;text-align:center;padding:6px;border:3px solid #c00;transform:rotate(-8deg);margin:6px auto;width:fit-content;letter-spacing:4px;}'
    +'.doc-ledger{width:100%;border-collapse:collapse;border:1px solid #000;margin-top:6px;}'
    +'.doc-ledger th{background:#eee;font-size:7px;font-weight:700;text-transform:uppercase;padding:3px 5px;border:1px solid #000;}'
    +'.doc-ledger td{padding:3px 5px;border:1px solid #000;font-size:8px;}'
    +'.doc-notes-box{border:1px solid #000;padding:6px 8px;min-height:60px;}'
    +'.doc-notes-box .box-lbl{font-size:8px;font-weight:700;text-transform:uppercase;background:#eee;padding:2px 4px;margin:-6px -8px 4px -8px;border-bottom:1px solid #000;}'
    +'.doc-notes-box .box-content{font-size:9px;line-height:1.4;white-space:pre-wrap;}'
    +'.doc-approval{border:1px solid #000;padding:8px;font-size:9px;line-height:1.6;}'
    +'.doc-approval p{margin-bottom:4px;}'
    +'.doc-sig-line{border-bottom:1px solid #000;display:inline-block;min-width:180px;height:14px;margin-left:6px;vertical-align:bottom;}'
    +'.doc-footer{text-align:center;font-size:24px;font-weight:800;color:#c00;letter-spacing:4px;margin-top:14px;padding-top:8px;border-top:2px solid #000;}'
    +'.doc-checkbox{width:14px;height:14px;border:1.5px solid #000;display:inline-block;}'
    +'.doc-store-loc{display:inline-block;padding:3px 10px;border:1px solid #000;font-size:9px;font-weight:700;margin-top:6px;background:#eee;}'
    +'@media print{@page{size:letter;margin:0;}body{margin:0;}.doc-page{box-shadow:none;margin:0;}.no-print{display:none!important;}}'
    +'</style>';
}

function printAddrBox(label,a){
  if(!a||!a.name)a={name:'',addr:'',city:'',state:'',zip:'',phone:''};
  return '<div class="doc-addr-box"><div class="box-lbl">'+label+':</div>'
    +'<div class="box-name">'+(a.name||'')+'</div>'
    +(a.addr?'<div class="box-line">'+a.addr+'</div>':'')
    +(a.city||a.state||a.zip?'<div class="box-line">'+[a.city,a.state,a.zip].filter(Boolean).join(', ').replace(/, ([A-Z]{2})/,' $1')+'</div>':'')
    +(a.phone?'<div class="box-line">'+a.phone+'</div>':'')
    +(a.cid?'<div class="box-line">CID: '+a.cid+'</div>':'')
    +'</div>';
}

function buildInvoiceHeader(o,docTitle){
  var now=new Date();
  var printDate=now.toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'})+' '+now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  var invDate=new Date(o.date).toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'});
  var delDate=o.deliveryDate?new Date(o.deliveryDate+'T12:00:00').toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'}):'';
  var h='<div class="doc-hdr">';
  h+='<div class="doc-hdr-left"><img class="doc-logo" src="'+INVOICE_LOGO_PATH+'" alt="DC Appliance" onerror="this.style.display=\'none\'"/>';
  var s=(typeof currentStore!=='undefined'?currentStore:{});
  var tagline=s.tagline||'MATTRESS &middot; OUTDOOR &middot; ELECTRONICS';
  var storeAddr=(s.address||'2610 Central Ave')+', '+(s.city||'Dodge City')+', '+(s.state||'KS')+' '+(s.zip||'67801');
  var storePhone=s.phone||'620-371-6417';
  h+='<div class="doc-store-tag">'+tagline+'</div>';
  h+='<div class="doc-store-addr">'+storeAddr+'<br/>'+storePhone+'</div></div>';
  h+='<div class="doc-hdr-right">';
  h+='<div class="doc-title">'+docTitle+'</div>';
  h+='<div class="doc-info"><table>';
  h+='<tr class="big"><td><span class="lbl">Date</span><span class="val">'+invDate+'</span></td><td><span class="lbl">Invoice Number</span><span class="val">'+o.id+'</span></td></tr>';
  h+='<tr><td><span class="lbl">Salesperson</span><span class="val">'+(o.clerk||'—')+'</span></td><td><span class="lbl">Terms</span><span class="val">'+(o.payment||'—')+'</span></td></tr>';
  h+='<tr><td><span class="lbl">Print Date</span><span class="val">'+printDate+'</span></td><td><span class="lbl">Del/Pick Up Date</span><span class="val">'+(delDate||'—')+'</span></td></tr>';
  h+='</table></div></div></div>';
  return h;
}

function buildCategoryBar(){
  return '<div class="doc-cat-bar">APPLIANCES &nbsp;|&nbsp; TV\'S &nbsp;|&nbsp; HOME THEATER &nbsp;|&nbsp; MATTRESSES &nbsp;|&nbsp; HARDWARE &nbsp;|&nbsp; APPLIANCE SERVICE</div>';
}

function getCustomerPayments(custName){
  var c=(typeof customers!=='undefined'?customers.find(function(x){return x.name===custName;}):null);
  return (c&&c.payments)||[];
}

function getOrderBalance(o){
  var totalPaid=0;
  // Check if order has direct payments or if it's paid via status
  if(o.status==='Paid in Full'||o.payment==='Cash'||o.payment==='Card'||o.payment==='Check')totalPaid=o.total;
  else if(o.payments)totalPaid=(o.payments||[]).reduce(function(s,p){return s+(p.amount||0);},0);
  return{paid:totalPaid,balance:o.total-totalPaid};
}

function buildCustomerInvoiceDoc(o){
  // Customer invoice items: MODEL# | DESCRIPTION | QTY | PRICE | DISC | EXT PRICE | SERIAL# | S
  var itemRows=o.items.map(function(i){
    var disc=i.discount||0;
    var ext=i.price*i.qty-disc;
    return '<tr><td>'+(i.model||'')+'</td><td>'+i.name+'</td><td class="col-c">'+i.qty+'</td><td class="col-r">'+fmt(i.price)+'</td><td class="col-r">'+(disc?fmt(disc):'—')+'</td><td class="col-r">'+fmt(ext)+'</td><td>'+(i.serial||'')+'</td><td class="col-c">'+(i.warrantyOffered?'Y':'')+'</td></tr>';
  }).join('');
  // Add padding rows so watermark/layout looks consistent
  var blank=Math.max(0,8-o.items.length);
  for(var i=0;i<blank;i++)itemRows+='<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';

  var bal=getOrderBalance(o);
  var payments=getCustomerPayments(o.customer);
  // Build ledger rows
  var ledgerRows='<tr><td>'+new Date(o.date).toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'2-digit'})+'</td><td>Invoice '+o.id+'</td><td class="col-r">'+fmt(o.total)+'</td><td class="col-r">'+fmt(o.total)+'</td></tr>';
  var running=o.total;
  payments.forEach(function(p){running-=p.amount;ledgerRows+='<tr><td>'+new Date(p.date).toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'2-digit'})+'</td><td>Payment ('+p.method+')</td><td class="col-r">-'+fmt(p.amount)+'</td><td class="col-r">'+fmt(running)+'</td></tr>';});

  var h='<div class="doc-page">';
  h+=buildInvoiceHeader(o,'INVOICE');
  // Sold To / Ship To
  h+='<div class="doc-addr-row">';
  h+=printAddrBox('Sold To',o.soldTo||{name:o.customer});
  h+=printAddrBox('Ship To',(o.shipTo&&o.shipTo.name)?o.shipTo:(o.soldTo||{name:o.customer}));
  h+='</div>';
  h+=buildCategoryBar();
  // Items table
  h+='<table class="doc-items"><thead><tr><th style="width:12%;">MODEL#</th><th>DESCRIPTION</th><th style="width:6%;" class="col-c">QTY</th><th style="width:9%;" class="col-r">PRICE</th><th style="width:7%;" class="col-r">DISC</th><th style="width:10%;" class="col-r">EXT PRICE</th><th style="width:12%;">SERIAL#</th><th style="width:4%;" class="col-c">S</th></tr></thead><tbody>'+itemRows+'</tbody></table>';
  h+='<div class="doc-watermark">THANK YOU FOR YOUR BUSINESS!</div>';
  // Terms + totals
  h+='<div class="doc-bot">';
  h+='<div class="doc-terms">';
  // Use store-configured delivery terms if set, otherwise fall back to DC Appliance defaults
  var storeCfg=(typeof currentStore!=='undefined'?currentStore:{});
  if(storeCfg.delivery_terms&&storeCfg.delivery_terms.trim()){
    h+='<div style="white-space:pre-wrap;">'+storeCfg.delivery_terms+'</div>';
  }else{
    h+='<p><strong>Rebates</strong> must be filled out completely online or mailed in by Customer. Rebates are NOT the store\'s responsibility.</p>';
    h+='<p><strong>Delivery</strong> — we will make every effort to set up a delivery time that is convenient for you. We will call and set up a date and time for delivery and call before we leave for delivery. We offer Free Drop off in the city limits between the hours of 9am &amp; 5pm, Monday thru Friday.</p>';
    h+='<p><strong>Measurements</strong> — Customer is responsible for measuring openings and take full responsibility for wrong measurements.</p>';
    h+='<p><strong>Install</strong> — We will make every effort to do the job properly, but should any additional work be needed, we recommend you contact a licensed contractor. We are not Electricians or Plumbers and do not hook up gas lines or do cabinet or countertop work.</p>';
  }
  if(o.invoiceNotes)h+='<p style="margin-top:6px;padding:4px 6px;background:#fffbeb;border-left:3px solid #eab308;"><strong>Delivery Instructions:</strong> '+o.invoiceNotes+'</p>';
  h+='</div>';
  h+='<div style="width:260px;">';
  h+='<div class="doc-totals">';
  h+='<div class="tot-row"><span>Sub-Total:</span><span>'+fmt(o.subtotal)+'</span></div>';
  h+='<div class="tot-row"><span>Sales Tax:</span><span>'+fmt(o.tax)+'</span></div>';
  h+='<div class="tot-row grand"><span>Total Sale:</span><span>'+fmt(o.total)+'</span></div>';
  h+='</div>';
  if(bal.balance<=0.01)h+='<div class="doc-paid">PAID</div>';
  else h+='<div style="text-align:right;font-size:14px;font-weight:800;color:#c00;margin-top:6px;">Balance Due: '+fmt(bal.balance)+'</div>';
  h+='<table class="doc-ledger"><thead><tr><th>DATE</th><th>MEMO</th><th class="col-r">CHG/PMT</th><th class="col-r">BALANCE</th></tr></thead><tbody>'+ledgerRows+'</tbody></table>';
  h+='</div></div>';
  h+='<div class="doc-footer">CUSTOMER COPY</div>';
  h+='</div>';
  return h;
}

function buildShipperCopyDoc(o){
  // Shipper columns: MODEL# | DESCRIPTION | QTY | SERIAL# | S | SHIP DATE | checkbox
  var itemRows=o.items.map(function(i){
    var shipDate=i.deliveredAt?new Date(i.deliveredAt).toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'2-digit'}):'';
    return '<tr><td>'+(i.model||'')+'</td><td>'+i.name+'</td><td class="col-c">'+i.qty+'</td><td>'+(i.serial||'')+'</td><td class="col-c">'+(i.warrantyOffered?'Y':'')+'</td><td>'+shipDate+'</td><td class="col-c"><span class="doc-checkbox"></span></td></tr>';
  }).join('');
  var blank=Math.max(0,8-o.items.length);
  for(var i=0;i<blank;i++)itemRows+='<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td class="col-c"><span class="doc-checkbox"></span></td></tr>';

  var bal=getOrderBalance(o);
  var h='<div class="doc-page">';
  h+=buildInvoiceHeader(o,'SHIPPER COPY');
  h+='<div class="doc-addr-row">';
  h+=printAddrBox('Sold To',o.soldTo||{name:o.customer});
  h+=printAddrBox('Ship To',(o.shipTo&&o.shipTo.name)?o.shipTo:(o.soldTo||{name:o.customer}));
  h+='</div>';
  h+=buildCategoryBar();
  h+='<table class="doc-items"><thead><tr><th style="width:14%;">MODEL#</th><th>DESCRIPTION</th><th style="width:6%;" class="col-c">QTY</th><th style="width:15%;">SERIAL#</th><th style="width:5%;" class="col-c">S</th><th style="width:10%;">SHIP DATE</th><th style="width:6%;" class="col-c">✓</th></tr></thead><tbody>'+itemRows+'</tbody></table>';
  // Two-column bottom
  h+='<div class="doc-bot" style="margin-top:14px;">';
  h+='<div style="flex:1;">';
  h+='<div class="doc-approval">';
  h+='<p>&bull; Items above have been received.</p>';
  h+='<p>&bull; This delivery has been completed to my satisfaction.</p>';
  h+='<p>&bull; No damage to the appliance or the surrounding area has occurred.</p>';
  h+='<p style="margin-top:12px;">Customer approval: <span class="doc-sig-line" style="min-width:220px;"></span></p>';
  h+='<p>Date: <span class="doc-sig-line" style="min-width:140px;"></span></p>';
  h+='</div>';
  h+='</div>';
  h+='<div style="width:260px;">';
  h+='<div class="doc-notes-box"><div class="box-lbl">Delivery Notes / Directions</div><div class="box-content">'+(o.invoiceNotes||o.shipperNotes||'—')+'</div></div>';
  h+='<div class="doc-store-loc">DODGE CITY</div>';
  h+='<div class="doc-totals" style="margin-top:8px;">';
  h+='<div class="tot-row"><span>Sub-Total:</span><span>'+fmt(o.subtotal)+'</span></div>';
  h+='<div class="tot-row"><span>Sales Tax:</span><span>'+fmt(o.tax)+'</span></div>';
  h+='<div class="tot-row grand"><span>Total Sale:</span><span>'+fmt(o.total)+'</span></div>';
  h+='</div>';
  if(bal.balance<=0.01)h+='<div class="doc-paid" style="font-size:28px;">PAID</div>';
  h+='</div></div>';
  h+='<div class="doc-footer">SHIPPER COPY</div>';
  h+='</div>';
  return h;
}

function printInvoice(id){
  var o=orders.find(function(x){return x.id===id;});if(!o)return;
  var win=window.open('','_blank');
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Invoice '+o.id+'</title>'+invoiceDocStyles()+'</head><body>'+buildCustomerInvoiceDoc(o)+'</body></html>';
  win.document.write(html);win.document.close();setTimeout(function(){win.print();},400);
}
function emailInvoicePdf(id){
  var o=orders.find(function(x){return x.id===id;});if(!o)return;
  toast('Use Print dialog to Save as PDF, then attach to email manually.','info');
  var win=window.open('','_blank');
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Invoice '+o.id+'</title>'+invoiceDocStyles()+'</head><body>'+buildCustomerInvoiceDoc(o)+'</body></html>';
  win.document.write(html);win.document.close();setTimeout(function(){win.print();},400);
}

function printShipperTicket(id){
  var o=orders.find(function(x){return x.id===id;});if(!o)return;
  var win=window.open('','_blank');
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Shipper Copy '+o.id+'</title>'+invoiceDocStyles()+'</head><body>'+buildShipperCopyDoc(o)+'</body></html>';
  win.document.write(html);win.document.close();setTimeout(function(){win.print();},400);
}

function printBothDocuments(id){
  var o=orders.find(function(x){return x.id===id;});if(!o)return;
  var win=window.open('','_blank');
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Invoice &amp; Shipper '+o.id+'</title>'+invoiceDocStyles()+'</head><body>'+buildCustomerInvoiceDoc(o)+buildShipperCopyDoc(o)+'</body></html>';
  win.document.write(html);win.document.close();setTimeout(function(){win.print();},400);
}

// ══════════════════════════════════════════════
// TRUCK MAP
// ══════════════════════════════════════════════
var _truckMap=null,_truckMarkers=[],_truckTimer=null,_truckMapVisible=true,_truckData=[];
var _truckParkState={};  // keyed by truck name: {lat,lng,parkedSince}

function _truckUpdateParkState(trucks){
  var now=Date.now();
  trucks.forEach(function(t){
    var key=t.name||'';
    var prev=_truckParkState[key];
    var moved=!prev||Math.abs(t.lat-prev.lat)>0.00005||Math.abs(t.lng-prev.lng)>0.00005;
    if(moved){
      _truckParkState[key]={lat:t.lat,lng:t.lng,parkedSince:now};
    }
    // else keep existing parkedSince
  });
}

function _truckGetStatus(t){
  var key=t.name||'';
  var state=_truckParkState[key];
  if(!state)return{moving:true,minutes:0,color:'#22c55e',label:'In Transit'};
  var mins=Math.floor((Date.now()-state.parkedSince)/60000);
  if(mins<1)return{moving:true,minutes:0,color:'#22c55e',label:'In Transit'};
  var color=mins>=30?'#ef4444':'#eab308';
  var h=Math.floor(mins/60);var m=mins%60;
  var label='Parked '+(h>0?h+'h '+m+'m':m+'m');
  return{moving:false,minutes:mins,color:color,label:label};
}

var _deliveryMarkers=[];
function truckMapInit(){
  var el=document.getElementById('truck-map');if(!el)return;
  var badge=document.getElementById('truck-map-status');
  // Ensure map panel is visible first so container has dimensions
  var row=document.getElementById('del-body-row');
  if(row)row.classList.remove('map-hidden');
  _truckMapVisible=true;
  var btn=document.querySelector('.truck-map-toggle');
  if(btn)btn.textContent='Hide Map';
  // Delay init so container has layout dimensions
  setTimeout(function(){
    try{
      if(!_truckMap){
        if(typeof L==='undefined'){
          el.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6b7280;font-size:12px;">Map unavailable — Leaflet not loaded</div>';
          if(badge){badge.textContent='Unavailable';badge.style.color='#6b7280';}
          return;
        }
        _truckMap=L.map('truck-map',{zoomControl:true,attributionControl:false}).setView([37.7528,-100.0171],13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(_truckMap);
      }
      _truckMap.invalidateSize();
    }catch(e){
      console.error('[Map] Init failed:',e);
      el.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6b7280;font-size:12px;">Map unavailable</div>';
      if(badge){badge.textContent='Unavailable';badge.style.color='#6b7280';}
      return;
    }
    truckMapLoad();
    truckMapShowDeliveryStops();
    if(_truckTimer)clearInterval(_truckTimer);
    _truckTimer=setInterval(truckMapLoad,60000);
  },200);
}

var _truckMockData=[
  {name:'Truck 1 - DC Appliance',driver:'Jeff',lat:37.753,lng:-100.017,speed:0,heading:0,lastUpdated:null},
  {name:'Truck 2 - DC Appliance',driver:'Justin',lat:37.748,lng:-100.005,speed:0,heading:0,lastUpdated:null},
  {name:'Truck 3 - DC Appliance',driver:'',lat:37.745,lng:-99.998,speed:0,heading:0,lastUpdated:null}
];
async function truckMapLoad(){
  var badge=document.getElementById('truck-map-status');
  var data=null;
  try{
    var controller=new AbortController();
    var timeout=setTimeout(function(){controller.abort();},5000);
    var res=await fetch('/api/trucks?_t='+Date.now(),{cache:'no-store',signal:controller.signal});
    clearTimeout(timeout);
    data=await res.json();
    if(!data||!data.ok)data=null;
  }catch(e){
    console.log('[Map] Truck API unavailable, using local fallback');
    data=null;
  }
  // Fallback to client-side mock data if API fails
  var trucks=data?data.trucks||[]:_truckMockData;
  var source=data?data.source:'local';
  if(!_truckMap)return;
  // Clear old markers
  _truckMarkers.forEach(function(m){_truckMap.removeLayer(m);});
  _truckMarkers=[];
  _truckUpdateParkState(trucks);
  var bounds=[];
  trucks.forEach(function(t){
    if(!t.lat&&!t.lng)return;
    var st=_truckGetStatus(t);
    var icon=L.divIcon({
      className:'',
      html:'<div style="background:#1a2332;color:#fff;font-size:10px;font-weight:700;padding:4px 8px;border-radius:6px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid '+(st.moving?'#60a5fa':st.color)+';font-family:\'Plus Jakarta Sans\',sans-serif;">'+
        '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:'+st.color+';margin-right:4px;"></span>'+
        (t.name||'Truck')+' <span style="font-weight:400;opacity:0.7;font-size:9px;">\u00B7 '+st.label+'</span></div>',
      iconSize:[null,null],
      iconAnchor:[12,12]
    });
    var popup='<div style="font-family:\'Plus Jakarta Sans\',sans-serif;">'
      +'<div style="font-weight:700;font-size:13px;color:#1f2937;margin-bottom:4px;">'+(t.name||'Truck')+'</div>'
      +(t.driver?'<div style="font-size:11px;color:#6b7280;margin-bottom:2px;">Driver: <b>'+t.driver+'</b></div>':'')
      +'<div style="font-size:11px;margin-bottom:2px;"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:'+st.color+';margin-right:4px;vertical-align:0px;"></span><b style="color:'+(st.moving?'#16a34a':st.minutes>=30?'#dc2626':'#ca8a04')+';">'+st.label+'</b></div>'
      +(t.speed?'<div style="font-size:11px;color:#6b7280;">Speed: '+t.speed+' mph</div>':'')
      +(t.lastUpdated?'<div style="font-size:10px;color:#9ca3af;margin-top:4px;">Updated: '+new Date(t.lastUpdated).toLocaleTimeString()+'</div>':'')
      +'</div>';
    var m=L.marker([t.lat,t.lng],{icon:icon}).addTo(_truckMap).bindPopup(popup);
    _truckMarkers.push(m);
    bounds.push([t.lat,t.lng]);
  });
  if(bounds.length>1)_truckMap.fitBounds(bounds,{padding:[30,30],maxZoom:14});
  else if(bounds.length===1)_truckMap.setView(bounds[0],14);
  _truckData=trucks;
  truckRenderBadges();
  var srcLabel=source==='live'?'Live':source==='mock'?'API Mock':'Local';
  var now=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  if(badge){badge.textContent=trucks.length+' truck'+(trucks.length!==1?'s':'')+' \u00B7 '+srcLabel+' \u00B7 '+now;badge.style.color='';}
}

function truckMapToggle(){
  _truckMapVisible=!_truckMapVisible;
  var row=document.getElementById('del-body-row');
  var btn=document.querySelector('.truck-map-toggle');
  if(_truckMapVisible){
    if(row)row.classList.remove('map-hidden');
    if(btn)btn.textContent='Hide Map';
    setTimeout(function(){if(_truckMap)_truckMap.invalidateSize();},300);
    if(!_truckTimer)_truckTimer=setInterval(truckMapLoad,60000);
  }else{
    if(row)row.classList.add('map-hidden');
    if(btn)btn.textContent='Show Map';
    if(_truckTimer){clearInterval(_truckTimer);_truckTimer=null;}
  }
}

function truckRenderBadges(){
  var bar=document.getElementById('truck-badge-bar');if(!bar)return;
  bar.innerHTML=_truckData.map(function(t,i){
    var st=_truckGetStatus(t);
    var shortLabel=st.moving?'In Transit':st.label.replace('Parked ','');
    return '<span class="truck-name-badge" onclick="truckFlyTo('+i+')" title="'+(t.name||'Truck')+' \u2013 '+st.label+'"><span class="tnd" style="background:'+st.color+';"></span>'+(t.name||'Truck')+' <span style="opacity:0.6;font-size:8px;">'+shortLabel+'</span></span>';
  }).join('');
}

function truckFlyTo(idx){
  var t=_truckData[idx];if(!t||!t.lat||!t.lng)return;
  if(!_truckMapVisible){truckMapToggle();}
  _truckMap.flyTo([t.lat,t.lng],16,{duration:0.8});
  // Open popup on matching marker
  if(_truckMarkers[idx])_truckMarkers[idx].openPopup();
}

// ── DELIVERY STOP PINS ON MAP ──
function truckMapShowDeliveryStops(){
  if(!_truckMap)return;
  // Clear old delivery markers
  _deliveryMarkers.forEach(function(m){_truckMap.removeLayer(m);});
  _deliveryMarkers=[];
  // Get today's deliveries
  var today=new Date().toISOString().slice(0,10);
  var allDels=(typeof delDeliveries!=='undefined'&&delDeliveries.length)?delDeliveries:(typeof deliveries!=='undefined'?deliveries:[]);
  var todayDels=allDels.filter(function(d){return d.date===today&&d.status!=='Delivered';});
  if(!todayDels.length)return;
  // Geocode addresses and place pins — use a simple queue
  todayDels.forEach(function(d){
    if(!d.address||!d.city)return;
    var addr=encodeURIComponent(d.address+', '+d.city+', KS');
    fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+addr)
      .then(function(r){return r.json();})
      .then(function(data){
        if(!data||!data.length)return;
        var lat=parseFloat(data[0].lat),lng=parseFloat(data[0].lon);
        if(!lat||!lng)return;
        var apps=(d.appliances&&d.appliances.length)?d.appliances.map(function(a){return a.a;}).join(', '):(d.appliance||'');
        var sc=d.status==='Out for Delivery'?'#f59e0b':'#3b82f6';
        var icon=L.divIcon({
          className:'',
          html:'<div style="background:'+sc+';color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;">'+
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg></div>',
          iconSize:[24,24],iconAnchor:[12,24]
        });
        var popup='<div style="font-family:\'Plus Jakarta Sans\',sans-serif;">'
          +'<div style="font-weight:700;font-size:13px;color:#1f2937;">'+d.name+'</div>'
          +'<div style="font-size:11px;color:#6b7280;margin:2px 0;">'+d.address+', '+d.city+'</div>'
          +'<div style="font-size:11px;color:#6b7280;">'+apps+'</div>'
          +'<div style="font-size:11px;margin-top:4px;"><span style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700;background:'+(d.status==='Out for Delivery'?'#fef3c7;color:#92400e':'#dbeafe;color:#1d4ed8')+';">'+d.status+'</span></div>'
          +'<div style="margin-top:6px;font-size:10px;color:#6b7280;">'+d.id+' · '+(d.time||'')+'</div>'
          +'</div>';
        var m=L.marker([lat,lng],{icon:icon}).addTo(_truckMap).bindPopup(popup);
        _deliveryMarkers.push(m);
      })
      .catch(function(){});
  });
}

// ══════════════════════════════════════════════
// DELIVERY TAB - FULL IMPLEMENTATION
// ══════════════════════════════════════════════
function delInit(){delWeekStart=getWeekStart(new Date());delLoadData();}
async function delLoadData(){
  try{var r=await fetch('/api/deliveries-get');var d=await r.json();delDeliveries=d.deliveries||[];delNextId=d.nextId||1;delNotes=Array.isArray(d.notes)?d.notes:[];delNextNoteId=d.nextNoteId||1;}catch(e){delDeliveries=[];delNotes=[];delNextId=1;delNextNoteId=1;}
  _lastDelHash=JSON.stringify({d:delDeliveries,n:delNotes});delRenderCalendar();delStartPolling();
  if(_truckMap)truckMapShowDeliveryStops();
}
async function delSaveData(){
  try{await fetch('/api/deliveries-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({deliveries:delDeliveries,nextId:delNextId,notes:delNotes,nextNoteId:delNextNoteId})});}catch(e){console.error('Save failed:',e);}
}
function delStartPolling(){if(_delPollTimer)clearInterval(_delPollTimer);_delPollTimer=setInterval(delPoll,15000);}
function delStopPolling(){if(_delPollTimer){clearInterval(_delPollTimer);_delPollTimer=null;}}
async function delPoll(){
  try{var res=await fetch('/api/deliveries-get?t='+Date.now());var data=await res.json();var hash=JSON.stringify({d:data.deliveries,n:data.notes});if(hash===_lastDelHash)return;_lastDelHash=hash;delDeliveries=data.deliveries||[];delNextId=data.nextId||1;delNotes=Array.isArray(data.notes)?data.notes:[];delNextNoteId=data.nextNoteId||1;delRenderEvents();var b=document.getElementById('del-sync-badge');if(b){b.style.opacity='1';setTimeout(function(){b.style.opacity='0';},2000);}}catch(e){}
}
function delChangeWeek(d){delWeekStart=new Date(delWeekStart);delWeekStart.setDate(delWeekStart.getDate()+d*7);delRenderCalendar();}
function delGoToday(){delWeekStart=getWeekStart(new Date());delRenderCalendar();}
function delSetTeam(t,btn){DEL_TEAM=t;document.querySelectorAll('.del-tpill').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');delRenderEvents();}
function delToggleNoteTime(){document.getElementById('del-note-time-fields').style.display=document.getElementById('del-n-allday').value==='no'?'block':'none';}

function delRenderCalendar(){
  var days=[];for(var i=0;i<7;i++){var d=new Date(delWeekStart);d.setDate(d.getDate()+i);days.push(d);}
  var ws=days[0],we=days[6];
  document.getElementById('del-week-title').textContent=ws.toLocaleDateString('en-US',{month:'short',day:'numeric'})+' - '+we.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  var today=ds(new Date()),dows=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  document.getElementById('del-days-hdr').innerHTML=days.map(function(d,i){
    var isTod=ds(d)===today;
    return '<div class="del-dhc'+(isTod?' today-col':'')+'" onclick="delShowCtx(event,\''+ds(d)+'\',null)"><div class="del-dhc-dow">'+dows[i]+'</div><div class="del-dhc-num">'+d.getDate()+'</div></div>';
  }).join('');
  var tcb=document.getElementById('del-time-body');var tHtml='';
  for(var h=DEL_HOURS_START;h<DEL_HOURS_END;h++){tHtml+='<div class="del-time-lbl">'+(h===12?'12pm':(h>12?(h-12)+'pm':h+'am'))+'</div>';}
  tcb.innerHTML=tHtml;
  var db=document.getElementById('del-days-body');var totalH=(DEL_HOURS_END-DEL_HOURS_START)*60;
  db.innerHTML=days.map(function(d){
    var isTod=ds(d)===today,dStr=ds(d),cells='';
    for(var h=DEL_HOURS_START;h<DEL_HOURS_END;h++){cells+='<div class="del-hour-cell" onclick="delShowCtx(event,\''+dStr+'\',\''+delMinsToTime(h*60)+'\')"><div class="del-hour-half"></div><div class="del-add-hint">+</div></div>';}
    return '<div class="del-day-col'+(isTod?' today-bg':'')+'" id="del-col-'+dStr+'" data-date="'+dStr+'" style="height:'+totalH+'px;position:relative;">'+cells+'<div class="del-drop-ind" id="del-di-'+dStr+'"></div></div>';
  }).join('');
  delRenderEvents();
  setTimeout(function(){var db2=document.getElementById('del-days-body');if(db2)db2.scrollTop=(8-DEL_HOURS_START)*60;},50);
}

function delRenderEvents(){
  document.querySelectorAll('.del-event').forEach(function(e){e.remove();});
  var days=[];for(var i=0;i<7;i++){var d=new Date(delWeekStart);d.setDate(d.getDate()+i);days.push(ds(d));}
  var maxH=(DEL_HOURS_END-DEL_HOURS_START)*60;
  // Deliveries
  days.forEach(function(dayStr){
    var col=document.getElementById('del-col-'+dayStr);if(!col)return;
    var dayDels=delDeliveries.filter(function(d){return d.date===dayStr&&(DEL_TEAM==='all'||d.team===DEL_TEAM);});
    if(!dayDels.length)return;
    var slots=[];
    dayDels.forEach(function(d){
      var sm=delTimeToMins(d.time),dur=parseInt(d.duration)||60,top=Math.max(0,sm-DEL_HOURS_START*60),bottom=top+dur;
      if(top>=maxH)return;
      var placed=false;
      for(var s=0;s<slots.length;s++){var conflict=false;for(var e=0;e<slots[s].length;e++){var ex=slots[s][e];if(top<ex.bottom&&bottom>ex.top){conflict=true;break;}}if(!conflict){slots[s].push({d:d,top:top,bottom:bottom});placed=true;break;}}
      if(!placed)slots.push([{d:d,top:top,bottom:bottom}]);
    });
    var totalCols=slots.length;
    slots.forEach(function(slot,colIdx){
      slot.forEach(function(item){
        var d=item.d,sm=delTimeToMins(d.time),dur=parseInt(d.duration)||60,top=item.top,height=Math.max(dur,24);
        if(top+height>maxH)height=maxH-top;
        var isOther=d.team==='Other Delivery Team';
        var sc=isOther?(d.status==='Delivered'?'dc-other-delivered':d.status==='Out for Delivery'?'dc-other-out':d.status==='Rescheduled'?'dc-other-rescheduled':'dc-other-scheduled'):(d.status==='Delivered'?'dc-delivered':d.status==='Out for Delivery'?'dc-out':d.status==='Rescheduled'?'dc-rescheduled':'dc-scheduled');
        var apps=(d.appliances&&d.appliances.length)?d.appliances.map(function(a){return a.a;}).join(', '):(d.appliance||'');
        var endTime=delMinsToTime(sm+dur),colW=100/totalCols,leftPct=colIdx*colW;
        var ev=document.createElement('div');
        ev.className='del-event '+sc+(d.status==='Delivered'?' del-ev-delivered':'');
        ev.style.cssText='top:'+top+'px;height:'+height+'px;left:calc('+leftPct+'% + 2px);width:calc('+colW+'% - 4px);right:auto;';
        ev.setAttribute('data-id',d.id);
        var _warn=d.log&&d.log.some(function(e){return DEL_FLAG_WORDS.test(e.text);});
        ev.innerHTML=(_warn?'<div style="position:absolute;top:2px;right:4px;font-size:11px;z-index:5;">&#x26A0;</div>':'')+
          '<div class="del-ev-name">'+d.name+'</div>'+(height>28?'<div class="del-ev-sub">'+apps+(d.city?' &middot; '+d.city:'')+'</div>':'')+(height>46?'<div class="del-ev-time">'+d.time+(dur?' - '+endTime:'')+'</div>':'')+'<div class="del-resize-handle" data-resize="true"></div>';
        ev.onclick=(function(id){return function(e){e.stopPropagation();delOpenDetail(id);};})(d.id);
        ev.addEventListener('mousedown',(function(id,evRef,dObj){return function(e){if(e.button!==0)return;if(e.target.dataset.resize){delStartResize(e,id,evRef,dObj);return;}delStartDrag(e,id,evRef,dObj);};})(d.id,ev,d));
        col.appendChild(ev);
      });
    });
  });
  // Notes
  days.forEach(function(dayStr){
    var col=document.getElementById('del-col-'+dayStr);if(!col)return;
    var dayNotes=delNotes.filter(function(n){return n.date===dayStr;});if(!dayNotes.length)return;
    var noteSlots=[];
    dayNotes.forEach(function(n){
      var top,height;if(n.allDay){top=0;height=24;}else{var sm=delTimeToMins(n.time),dur=parseInt(n.duration)||60;top=Math.max(0,sm-DEL_HOURS_START*60);height=Math.max(dur,22);}
      if(top>=maxH)return;if(top+height>maxH)height=maxH-top;var bottom=top+height;
      var placed=false;for(var s=0;s<noteSlots.length;s++){var conflict=false;for(var e=0;e<noteSlots[s].length;e++){var ex=noteSlots[s][e];if(top<ex.bottom&&bottom>ex.top){conflict=true;break;}}if(!conflict){noteSlots[s].push({n:n,top:top,bottom:bottom});placed=true;break;}}
      if(!placed)noteSlots.push([{n:n,top:top,bottom:bottom}]);
    });
    var totalNoteCols=noteSlots.length;
    noteSlots.forEach(function(slot,colIdx){
      slot.forEach(function(item){
        var n=item.n,color=DEL_NOTE_COLORS.find(function(c){return c.key===n.color;})||DEL_NOTE_COLORS[0];
        var top=item.top,height=item.bottom-item.top,colW=100/totalNoteCols,leftPct=colIdx*colW;
        var ev=document.createElement('div');ev.className='del-event';
        ev.style.cssText='top:'+top+'px;height:'+height+'px;left:calc('+leftPct+'% + 2px);width:calc('+colW+'% - 4px);right:auto;background:'+color.bg+';border-left:3px solid '+color.bd+';color:'+color.txt+';';
        ev.innerHTML='<div class="del-ev-name">'+n.title+'</div>'+(height>28&&n.details?'<div class="del-ev-sub">'+n.details+'</div>':'');
        ev.onclick=function(e){e.stopPropagation();delOpenNoteDetail(n.id);};
        col.appendChild(ev);
      });
    });
  });
}

// Drag & Drop
function delStartDrag(e,id,el,dObj){e.preventDefault();_delDragId=id;_delDragEl=el;_delDragging=true;_delDragMoved=false;_delDragOffsetY=e.clientY-el.getBoundingClientRect().top;_delDragGhost=document.createElement('div');_delDragGhost.className='del-drag-ghost';_delDragGhost.style.background=el.style.background||'#dbeafe';_delDragGhost.style.borderLeft=el.style.borderLeft||'3px solid #2563b0';_delDragGhost.style.color=el.style.color||'#1e3a5f';_delDragGhost.textContent=dObj.name+(dObj.time?' '+dObj.time:'');_delDragGhost.style.left=e.clientX+'px';_delDragGhost.style.top=e.clientY+'px';document.body.appendChild(_delDragGhost);el.classList.add('dragging');document.addEventListener('mousemove',delOnDragMove);document.addEventListener('mouseup',delOnDragEnd);}
function delOnDragMove(e){if(!_delDragId)return;_delDragMoved=true;_delDragGhost.style.left=(e.clientX+10)+'px';_delDragGhost.style.top=(e.clientY-10)+'px';document.querySelectorAll('.del-day-col').forEach(function(c){c.classList.remove('drag-over');});var el=document.elementFromPoint(e.clientX,e.clientY);var col=el?el.closest('.del-day-col'):null;if(col){col.classList.add('drag-over');var db=document.getElementById('del-days-body');var rect=col.getBoundingClientRect();var relY=e.clientY-rect.top+(db?db.scrollTop:0)-_delDragOffsetY;var snapped=Math.round((DEL_HOURS_START*60+Math.max(0,relY))/30)*30;if(snapped<DEL_HOURS_START*60)snapped=DEL_HOURS_START*60;if(snapped>(DEL_HOURS_END-1)*60)snapped=(DEL_HOURS_END-1)*60;var di=document.getElementById('del-di-'+col.dataset.date);if(di){di.style.top=(snapped-DEL_HOURS_START*60)+'px';di.style.display='block';}}}
async function delOnDragEnd(e){document.removeEventListener('mousemove',delOnDragMove);document.removeEventListener('mouseup',delOnDragEnd);if(_delDragGhost){_delDragGhost.remove();_delDragGhost=null;}if(_delDragEl)_delDragEl.classList.remove('dragging');document.querySelectorAll('.del-day-col').forEach(function(c){c.classList.remove('drag-over');});document.querySelectorAll('.del-drop-ind').forEach(function(d){d.style.display='none';});if(_delDragMoved&&_delDragId){var el=document.elementFromPoint(e.clientX,e.clientY);var col=el?el.closest('.del-day-col'):null;if(col){var db=document.getElementById('del-days-body');var rect=col.getBoundingClientRect();var relY=e.clientY-rect.top+(db?db.scrollTop:0)-_delDragOffsetY;var snapped=Math.round((DEL_HOURS_START*60+Math.max(0,relY))/30)*30;if(snapped<DEL_HOURS_START*60)snapped=DEL_HOURS_START*60;if(snapped>(DEL_HOURS_END-1)*60)snapped=(DEL_HOURS_END-1)*60;var d=delDeliveries.find(function(x){return x.id===_delDragId;});if(d){d.date=col.dataset.date;d.time=delMinsToTime(snapped);await delSaveData();delRenderEvents();}}}setTimeout(function(){_delDragging=false;_delDragMoved=false;_delDragId=null;_delDragEl=null;},50);}
function delStartResize(e,id,el,dObj){e.preventDefault();e.stopPropagation();_delResizeId=id;_delResizeEl=el;_delResizeStartY=e.clientY;_delResizeStartDur=parseInt(dObj.duration)||60;_delDragging=true;_delDragMoved=false;el.style.cursor='ns-resize';document.body.style.userSelect='none';document.addEventListener('mousemove',delOnResizeMove);document.addEventListener('mouseup',delOnResizeEnd);}
function delOnResizeMove(e){if(!_delResizeId||!_delResizeEl)return;_delDragMoved=true;var deltaY=e.clientY-_delResizeStartY;var deltaMins=Math.round(deltaY/30)*30;var newDur=Math.max(30,_delResizeStartDur+deltaMins);_delResizeEl.style.height=newDur+'px';}
async function delOnResizeEnd(e){document.removeEventListener('mousemove',delOnResizeMove);document.removeEventListener('mouseup',delOnResizeEnd);document.body.style.userSelect='';if(_delResizeEl)_delResizeEl.style.cursor='';if(_delDragMoved&&_delResizeId){var deltaY=e.clientY-_delResizeStartY;var deltaMins=Math.round(deltaY/30)*30;var newDur=Math.max(30,_delResizeStartDur+deltaMins);newDur=Math.round(newDur/30)*30;var d=delDeliveries.find(function(x){return x.id===_delResizeId;});if(d){d.duration=String(newDur);await delSaveData();delRenderEvents();}}setTimeout(function(){_delDragging=false;_delDragMoved=false;_delResizeId=null;_delResizeEl=null;},50);}

// Context Menu
function delShowCtx(e,date,time){e.stopPropagation();if(_delDragging||_delDragMoved){_delDragMoved=false;return;}delCtxDate=date;delCtxTime=time;var menu=document.getElementById('del-ctx-menu');var dt=new Date(date+'T12:00:00');var label=dt.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});if(time)label+=' at '+time;document.getElementById('del-ctx-hdr').textContent=label;menu.style.left=e.clientX+'px';menu.style.top=e.clientY+'px';menu.classList.add('open');setTimeout(function(){document.addEventListener('click',delCloseCtx,{once:true});},10);}
function delCloseCtx(){document.getElementById('del-ctx-menu').classList.remove('open');}
function delCtxAddDelivery(){delCloseCtx();delOpenAddDelivery(delCtxDate,delCtxTime);}
function delCtxAddNote(){delCloseCtx();delOpenAddNote(delCtxDate,delCtxTime);}

// Add/Edit Delivery
function delOpenAddDelivery(date,time){
  document.getElementById('del-edit-id').value='';document.getElementById('del-modal-title').textContent='Add Delivery Stop';
  ['del-f-name','del-f-phone','del-f-email','del-f-address','del-f-city','del-f-invoice','del-f-notes'].forEach(function(id){document.getElementById(id).value='';});
  document.getElementById('del-f-date').value=date||ds(new Date());document.getElementById('del-f-duration').value='60';document.getElementById('del-f-team').value='Main Delivery Team';
  document.querySelector('input[name="del-dtype"][value="Full Install"]').checked=true;
  if(time){var s=document.getElementById('del-f-time');for(var i=0;i<s.options.length;i++){if(s.options[i].value===time){s.selectedIndex=i;break;}}}else{document.getElementById('del-f-time').selectedIndex=2;}
  delPendingFiles=[];document.getElementById('del-file-attach-list').innerHTML='';document.getElementById('del-file-attach-wrap').style.display='none';
  delInitAppRows([{a:'',m:''}]);openModal('del-delivery-modal');
}
function delOpenEditDelivery(id){
  closeModal('del-detail-modal');var d=delDeliveries.find(function(x){return x.id===id;});if(!d)return;
  document.getElementById('del-edit-id').value=id;document.getElementById('del-modal-title').textContent='Edit Stop';
  document.getElementById('del-f-name').value=d.name||'';document.getElementById('del-f-phone').value=d.phone||'';document.getElementById('del-f-email').value=d.email||'';document.getElementById('del-f-address').value=d.address||'';document.getElementById('del-f-city').value=d.city||'';document.getElementById('del-f-invoice').value=d.invoice||'';document.getElementById('del-f-notes').value=d.notes||'';document.getElementById('del-f-date').value=d.date||'';document.getElementById('del-f-duration').value=d.duration||'60';document.getElementById('del-f-team').value=d.team||'Main Delivery Team';
  var ts=document.getElementById('del-f-time');for(var i=0;i<ts.options.length;i++){if(ts.options[i].value===d.time){ts.selectedIndex=i;break;}}
  var dt=d.deliveryType||'Full Install';document.querySelectorAll('input[name="del-dtype"]').forEach(function(r){r.checked=r.value===dt;});
  var apps=d.appliances&&d.appliances.length?d.appliances:[{a:d.appliance||'',m:d.model||''}];delInitAppRows(apps);
  delPendingFiles=d.invoiceFiles||(d.invoiceFile?[d.invoiceFile]:[]);delRenderPendingFiles();openModal('del-delivery-modal');
}
async function delSaveDelivery(){
  var editId=document.getElementById('del-edit-id').value;
  var name=document.getElementById('del-f-name').value.trim(),phone=document.getElementById('del-f-phone').value.trim(),email=document.getElementById('del-f-email').value.trim(),address=document.getElementById('del-f-address').value.trim(),city=document.getElementById('del-f-city').value.trim(),invoice=document.getElementById('del-f-invoice').value.trim(),notes=document.getElementById('del-f-notes').value.trim(),date=document.getElementById('del-f-date').value,time=document.getElementById('del-f-time').value,duration=document.getElementById('del-f-duration').value,team=document.getElementById('del-f-team').value;
  var deliveryType=document.querySelector('input[name="del-dtype"]:checked').value;
  var apps=[];document.querySelectorAll('.del-app-row').forEach(function(row){var a=row.querySelector('.del-app-sel').value,m=row.querySelector('.del-app-model').value.trim();if(a)apps.push({a:a,m:m});});
  if(!name||!phone||!address||!city||!date||apps.length===0){toast('Fill required fields and at least one appliance','error');return;}
  var invoiceFiles=delPendingFiles.filter(function(f){return f&&f.url;});var invoiceFile=invoiceFiles.length?invoiceFiles[0]:null;var appStr=apps.map(function(x){return x.a;}).join(', ');
  if(editId){var d=delDeliveries.find(function(x){return x.id===editId;});if(!d)return;Object.assign(d,{name:name,phone:phone,email:email,address:address,city:city,invoice:invoice,notes:notes,date:date,time:time,duration:duration,team:team,deliveryType:deliveryType,appliances:apps,appliance:appStr,invoiceFile:invoiceFile,invoiceFiles:invoiceFiles});}
  else{delDeliveries.unshift({id:'DEL-'+String(delNextId).padStart(4,'0'),name:name,phone:phone,email:email,address:address,city:city,invoice:invoice,notes:notes,date:date,time:time,duration:duration,team:team,stopOrder:null,deliveryType:deliveryType,appliances:apps,appliance:appStr,invoiceFile:invoiceFile,invoiceFiles:invoiceFiles,status:'Scheduled',createdAt:new Date().toISOString(),deliveredAt:null});delNextId++;}
  await delSaveData();closeModal('del-delivery-modal');delRenderEvents();toast('Delivery saved','success');
}
// Appliance rows
function delInitAppRows(list){document.getElementById('del-app-list').innerHTML='';list.forEach(function(x){delAddAppRow(x.a||'',x.m||'');});}
function delAddAppRow(av,mv){
  var c=document.getElementById('del-app-list'),idx=c.children.length,div=document.createElement('div');div.className='del-app-row';
  var opts='<option value="">Select appliance...</option>'+DEL_APP_OPTIONS.map(function(o){return '<option value="'+o+'"'+(o===(av||'')?' selected':'')+'>'+o+'</option>';}).join('');
  div.innerHTML='<div class="del-app-row-hdr"><div class="del-app-row-title">Appliance '+(idx+1)+'</div>'+(idx>0?'<button type="button" class="del-app-row-rm" onclick="this.closest(\'.del-app-row\').remove()">&#x2715;</button>':'')+'</div><div class="frow"><select class="sel del-app-sel">'+opts+'</select><input class="inp del-app-model" placeholder="Model #" value="'+(mv||'')+'"/></div>';
  c.appendChild(div);
}
// Invoice
function delHandleInvoiceDrop(e){e.preventDefault();document.getElementById('del-invoice-dz').classList.remove('drag-over');var files=e.dataTransfer.files;for(var i=0;i<files.length;i++)delHandleInvoiceFile(files[i]);}
async function delHandleInvoiceFile(file){
  if(!file)return;document.getElementById('del-idz-loading').style.display='block';
  try{var b64=await toB64(file);var msgs=[{role:'user',content:[{type:file.type==='application/pdf'?'document':'image',source:{type:'base64',media_type:file.type,data:b64}},{type:'text',text:'Extract ALL appliances and customer info from this sales invoice. JSON only: {"customer":{"name":"","phone":"","email":"","address":"","city":""},"appliances":[{"a":"Refrigerator","m":"Model123","invoice":"INV-001"}]}'}]}];
  var data=await claudeApiCall({messages:msgs,max_tokens:800});
  var parsed=JSON.parse(data.content[0].text.match(/\{[\s\S]*\}/)[0]);var cu=parsed.customer||{};
  if(cu.name)document.getElementById('del-f-name').value=cu.name;if(cu.phone)document.getElementById('del-f-phone').value=cu.phone;if(cu.email)document.getElementById('del-f-email').value=cu.email;if(cu.address)document.getElementById('del-f-address').value=cu.address;if(cu.city)document.getElementById('del-f-city').value=cu.city;
  var apps=parsed.appliances||[];if(apps.length>0){if(apps[0].invoice)document.getElementById('del-f-invoice').value=apps[0].invoice;delInitAppRows(apps);}
  var upR=await fetch('/api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:file.name,contentType:file.type,data:b64,companyId:'dc-appliance',jobId:'del-'+Date.now()})});var upD=await upR.json();
  if(upD.ok){delPendingFiles.push({url:upD.url,filename:file.name});delRenderPendingFiles();}}catch(e){toast('Could not read invoice: '+e.message,'error');}finally{document.getElementById('del-idz-loading').style.display='none';}
}
function delRenderPendingFiles(){
  var wrap=document.getElementById('del-file-attach-wrap'),list=document.getElementById('del-file-attach-list');list.innerHTML='';
  if(!delPendingFiles.length){wrap.style.display='none';return;}wrap.style.display='block';
  delPendingFiles.forEach(function(f,i){var div=document.createElement('div');div.className='del-file-attach';div.innerHTML='<span style="font-size:16px;">&#x1F4C4;</span><div class="del-file-attach-name">'+f.filename+'</div><a class="del-file-attach-open" href="'+f.url+'" target="_blank">Open</a><button class="del-file-attach-rm" onclick="delPendingFiles.splice('+i+',1);delRenderPendingFiles();">&#x2715;</button>';list.appendChild(div);});
}
// Notes
function delBuildColorGrid(sel){
  var g=document.getElementById('del-color-grid');g.innerHTML=DEL_NOTE_COLORS.map(function(c){return '<div class="del-color-swatch'+(c.key===sel?' selected':'')+'" style="background:'+c.bg+';border-color:'+c.bd+';border-width:2px;border-style:solid;" title="'+c.label+'" onclick="delSelectedColor=\''+c.key+'\';document.querySelectorAll(\'.del-color-swatch\').forEach(function(s){s.classList.remove(\'selected\');});this.classList.add(\'selected\');"></div>';}).join('');
}
function delOpenAddNote(date,time){
  document.getElementById('del-edit-note-id').value='';document.getElementById('del-note-modal-title').textContent='Add Note / Event';
  document.getElementById('del-n-title').value='';document.getElementById('del-n-details').value='';document.getElementById('del-n-date').value=date||ds(new Date());
  if(time){document.getElementById('del-n-allday').value='no';document.getElementById('del-note-time-fields').style.display='block';var ts=document.getElementById('del-n-time');for(var i=0;i<ts.options.length;i++){if(ts.options[i].value===time){ts.selectedIndex=i;break;}}}
  else{document.getElementById('del-n-allday').value='yes';document.getElementById('del-note-time-fields').style.display='none';}
  delSelectedColor='yellow';delBuildColorGrid('yellow');openModal('del-note-modal');
}
function delOpenEditNote(id){
  closeModal('del-detail-modal');var n=delNotes.find(function(x){return x.id===id;});if(!n)return;
  document.getElementById('del-edit-note-id').value=id;document.getElementById('del-note-modal-title').textContent='Edit Note';
  document.getElementById('del-n-title').value=n.title||'';document.getElementById('del-n-details').value=n.details||'';document.getElementById('del-n-date').value=n.date||'';
  document.getElementById('del-n-allday').value=n.allDay?'yes':'no';document.getElementById('del-note-time-fields').style.display=n.allDay?'none':'block';
  if(!n.allDay&&n.time){var ts=document.getElementById('del-n-time');for(var i=0;i<ts.options.length;i++){if(ts.options[i].value===n.time){ts.selectedIndex=i;break;}}}
  document.getElementById('del-n-duration').value=n.duration||'60';delSelectedColor=n.color||'yellow';delBuildColorGrid(delSelectedColor);openModal('del-note-modal');
}
async function delSaveNote(){
  var editId=document.getElementById('del-edit-note-id').value;var title=document.getElementById('del-n-title').value.trim(),date=document.getElementById('del-n-date').value;
  var allDay=document.getElementById('del-n-allday').value==='yes';var time=allDay?null:document.getElementById('del-n-time').value;var duration=allDay?null:document.getElementById('del-n-duration').value;var details=document.getElementById('del-n-details').value.trim();
  if(!title||!date){toast('Enter title and date','error');return;}
  if(editId){var n=delNotes.find(function(x){return x.id===editId;});if(!n)return;Object.assign(n,{title:title,date:date,allDay:allDay,time:time,duration:duration,details:details,color:delSelectedColor});}
  else{delNotes.push({id:'NOTE-'+String(delNextNoteId).padStart(3,'0'),title:title,date:date,allDay:allDay,time:time,duration:duration,details:details,color:delSelectedColor,createdAt:new Date().toISOString()});delNextNoteId++;}
  await delSaveData();closeModal('del-note-modal');delRenderEvents();toast('Note saved','success');
}
// Detail modals
function delOpenDetail(id){
  var d=delDeliveries.find(function(x){return x.id===id;});if(!d)return;
  document.getElementById('del-det-name').textContent=d.name;var sm=delTimeToMins(d.time),dur=parseInt(d.duration)||60;
  var durStr=d.duration==='480'?'All Day':(d.time!=='Call Ahead'?d.time+' - '+delMinsToTime(sm+dur):d.time);
  document.getElementById('del-det-meta').textContent=d.id+' | '+durStr+' | '+(d.team||'Main Delivery Team');
  var apps=d.appliances&&d.appliances.length?d.appliances:[{a:d.appliance||'',m:d.model||''}];
  var scBadge=d.status==='Delivered'?'del-sb-delivered':d.status==='Out for Delivery'?'del-sb-out':d.status==='Rescheduled'?'del-sb-rescheduled':'del-sb-scheduled';
  var body='<div style="margin-bottom:10px;"><span class="del-status-badge '+scBadge+'">'+d.status+'</span></div>'+
  '<div class="del-detail-grid"><div><div class="del-dl">Phone</div><div class="del-dv"><a href="tel:'+d.phone+'">'+d.phone+'</a></div></div>'+(d.email?'<div><div class="del-dl">Email</div><div class="del-dv"><a href="mailto:'+d.email+'">'+d.email+'</a></div></div>':'<div></div>')+'<div style="grid-column:1/-1"><div class="del-dl">Address</div><div class="del-dv">'+d.address+', '+d.city+'</div></div><div><div class="del-dl">Delivery Type</div><div class="del-dv">'+(d.deliveryType||'Full Install')+'</div></div>'+(d.invoice?'<div><div class="del-dl">Invoice #</div><div class="del-dv">'+d.invoice+'</div></div>':'<div></div>')+'</div>'+
  '<div style="margin-bottom:10px;"><div class="del-dl" style="margin-bottom:4px;">Appliances</div>'+apps.map(function(a){return '<div style="font-size:12px;margin-bottom:3px;">'+a.a+(a.m?' <span style="color:var(--gray-2);font-size:11px;">'+a.m+'</span>':'')+(a.serial?' <span style="color:var(--green);font-size:11px;font-weight:600;">SN: '+a.serial+'</span>':'')+'</div>';}).join('')+'</div>'+
  (d.notes?'<div class="del-dl" style="margin-bottom:4px;">Notes</div><div class="del-notes-blk">'+d.notes+'</div>':'')+
  (d.deliveredAt?'<div style="font-size:11px;color:var(--green);font-weight:600;margin-bottom:8px;">Delivered: '+new Date(d.deliveredAt).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})+'</div>':'')+
  ((d.invoiceFiles&&d.invoiceFiles.length?d.invoiceFiles:(d.invoiceFile&&d.invoiceFile.url?[d.invoiceFile]:[])).map(function(f){return '<div class="del-file-attach" style="margin-top:8px;"><span style="font-size:16px;">&#x1F4C4;</span><div class="del-file-attach-name">'+f.filename+'</div><a class="del-file-attach-open" href="'+f.url+'" target="_blank">Open</a></div>';}).join(''))+
  '<div style="margin-top:12px;"><div class="del-dl" style="margin-bottom:6px;">Photos</div>'+
  '<button class="del-abtn gray" style="margin-bottom:8px;" onclick="document.getElementById(\'del-det-photo-input\').click()">+ Add Photos</button>'+
  '<input type="file" id="del-det-photo-input" accept="image/*" multiple style="display:none" onchange="delDetUploadPhotos(this.files,\''+id+'\')"/>'+
  ((d.photos&&d.photos.length)?'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:6px;">'+d.photos.map(function(p){return '<img src="'+p.url+'" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid var(--bg4);" onclick="delDetViewPhoto(\''+p.url+'\')"/>';}).join('')+'</div>':'<div style="font-size:11px;color:var(--gray-3);">No photos yet</div>')+
  '</div>'+
  delRenderLogHtml(d)+
  delRenderEmailLogHtml(d.emailLog);
  document.getElementById('del-det-body').innerHTML=body;
  var acts='';
  if(d.status!=='Out for Delivery'&&d.status!=='Delivered')acts+='<button class="del-abtn orange" onclick="delSetStatus(\''+id+'\',\'Out for Delivery\')">Out for Delivery</button>';
  if(d.status!=='Delivered')acts+='<button class="del-abtn green" onclick="delSetStatus(\''+id+'\',\'Delivered\')">Mark Delivered</button>';
  if(d.status!=='Scheduled')acts+='<button class="del-abtn blue" onclick="delSetStatus(\''+id+'\',\'Scheduled\')">Reschedule</button>';
  if(d.email)acts+='<button class="del-abtn purple" onclick="delSendConfirmEmail(\''+id+'\')">&#x2709; Email</button>';
  acts+='<button class="del-abtn gray" onclick="delOpenEditDelivery(\''+id+'\')">Edit</button>';
  acts+='<button class="del-abtn red" onclick="delDeleteDelivery(\''+id+'\')">Delete</button>';
  document.getElementById('del-det-actions').innerHTML=acts;openModal('del-detail-modal');
}
function delOpenNoteDetail(id){
  var n=delNotes.find(function(x){return x.id===id;});if(!n)return;
  var color=DEL_NOTE_COLORS.find(function(c){return c.key===n.color;})||DEL_NOTE_COLORS[0];
  document.getElementById('del-det-name').textContent=n.title;
  document.getElementById('del-det-meta').textContent=new Date(n.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})+(n.allDay?' | All Day':n.time?' | '+n.time:'');
  document.getElementById('del-det-body').innerHTML='<div style="width:24px;height:24px;border-radius:4px;background:'+color.bg+';border:2px solid '+color.bd+';margin-bottom:12px;"></div>'+(n.details?'<div class="del-notes-blk">'+n.details+'</div>':'<p style="color:var(--gray-3);font-size:12px;">No details.</p>');
  document.getElementById('del-det-actions').innerHTML='<button class="del-abtn gray" onclick="delOpenEditNote(\''+id+'\')">Edit</button><button class="del-abtn red" onclick="delDeleteNote(\''+id+'\')">Delete</button>';
  openModal('del-detail-modal');
}
async function delSetStatus(id,status){var d=delDeliveries.find(function(x){return x.id===id;});if(!d)return;d.status=status;if(status==='Delivered')d.deliveredAt=new Date().toISOString();else d.deliveredAt=null;await delSaveData();closeModal('del-detail-modal');delRenderEvents();toast('Status: '+status,'success');}
async function delDeleteDelivery(id){if(!confirm('Delete this stop?'))return;delDeliveries=delDeliveries.filter(function(x){return x.id!==id;});await delSaveData();closeModal('del-detail-modal');delRenderEvents();toast('Delivery deleted','info');}
async function delDeleteNote(id){if(!confirm('Delete this note?'))return;delNotes=delNotes.filter(function(x){return x.id!==id;});await delSaveData();closeModal('del-detail-modal');delRenderEvents();toast('Note deleted','info');}
// Delivery photos
async function delDetUploadPhotos(files,deliveryId){
  if(!files||!files.length)return;
  var d=delDeliveries.find(function(x){return x.id===deliveryId;});if(!d)return;
  if(!d.photos)d.photos=[];
  toast('Uploading '+files.length+' photo'+(files.length>1?'s':'')+'...','info');
  for(var i=0;i<files.length;i++){
    try{
      var base64=await new Promise(function(resolve,reject){var r=new FileReader();r.onload=function(){resolve(r.result.split(',')[1]);};r.onerror=reject;r.readAsDataURL(files[i]);});
      var res=await fetch('/api/delivery-photo-upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:files[i].name,contentType:files[i].type,data:base64,deliveryId:deliveryId})});
      var data=await res.json();
      if(data.ok)d.photos.push({url:data.url,filename:data.filename,uploadedAt:new Date().toISOString()});
    }catch(e){console.error(e);}
  }
  await delSaveData();delOpenDetail(deliveryId);toast('Photos uploaded','success');
}
function delDetViewPhoto(url){
  var ov=document.getElementById('del-photo-overlay');
  if(!ov){ov=document.createElement('div');ov.id='del-photo-overlay';ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:pointer;';ov.onclick=function(){ov.style.display='none';};ov.innerHTML='<img style="max-width:95vw;max-height:90vh;object-fit:contain;border-radius:4px;"/>';document.body.appendChild(ov);}
  ov.querySelector('img').src=url;ov.style.display='flex';
}
// Delivery Log
var DEL_FLAG_WORDS=/damaged|broken|missing|wrong|refused|dent|scratch|crack|leak|cancel/i;
var _delLogPendingPhoto=null;

function delRenderLogHtml(d){
  var entries=d.log||[];
  var h='<div style="margin-top:14px;border-top:1px solid var(--bg4);padding-top:10px;">';
  h+='<div style="font-size:9px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:var(--gray-3);margin-bottom:8px;">Delivery Log ('+entries.length+')</div>';
  if(entries.length){
    h+='<div style="max-height:200px;overflow-y:auto;margin-bottom:10px;">';
    entries.forEach(function(e){
      var flagged=DEL_FLAG_WORDS.test(e.text);
      h+='<div style="padding:8px 10px;border-radius:6px;margin-bottom:6px;font-size:12px;'+(flagged?'background:#fef2f2;border:1px solid #fca5a5;':'background:var(--bg3);border:1px solid var(--bg4);')+'">';
      h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;"><span style="font-weight:700;font-size:11px;">'+(flagged?'<span style="color:#dc2626;">&#x26A0;</span> ':'')+e.author+'</span><span style="font-size:10px;color:var(--gray-3);">'+new Date(e.ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+'</span></div>';
      h+='<div style="color:var(--gray-2);line-height:1.4;">'+e.text+'</div>';
      if(e.photo)h+='<img src="'+e.photo+'" style="width:48px;height:48px;object-fit:cover;border-radius:4px;margin-top:4px;cursor:pointer;border:1px solid var(--bg4);" onclick="delDetViewPhoto(\''+e.photo+'\')"/>';
      h+='</div>';
    });
    h+='</div>';
  }
  h+='<div style="display:flex;gap:6px;align-items:flex-end;">';
  h+='<textarea id="del-log-input" placeholder="Add a log note..." rows="1" style="flex:1;font-size:12px;padding:8px 10px;border:1px solid var(--bg4);border-radius:6px;font-family:inherit;outline:none;resize:none;min-height:36px;"></textarea>';
  h+='<button style="min-height:36px;min-width:36px;background:var(--bg3);border:1px solid var(--bg4);border-radius:6px;cursor:pointer;font-size:16px;" onclick="delLogAttachPhoto(\''+d.id+'\')">&#x1F4F7;</button>';
  h+='<button style="min-height:36px;padding:0 14px;background:var(--navy,#1a2744);color:#fff;border:none;border-radius:6px;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;" onclick="delAddLogEntry(\''+d.id+'\')">Add Note</button>';
  h+='</div>';
  h+='<div id="del-log-photo-preview"></div>';
  h+='</div>';
  return h;
}

function delLogAttachPhoto(deliveryId){
  var inp=document.createElement('input');
  inp.type='file';inp.accept='image/*';inp.style.display='none';
  inp.onchange=async function(){
    if(!inp.files||!inp.files[0])return;
    var el=document.getElementById('del-log-photo-preview');
    el.innerHTML='<div style="font-size:10px;color:var(--gold-light,#3b82f6);font-weight:600;margin-top:4px;">Uploading...</div>';
    try{
      var b64=await new Promise(function(resolve,reject){var r=new FileReader();r.onload=function(){resolve(r.result.split(',')[1]);};r.onerror=reject;r.readAsDataURL(inp.files[0]);});
      var res=await fetch('/api/delivery-photo-upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:inp.files[0].name,contentType:inp.files[0].type,data:b64,deliveryId:deliveryId})});
      var data=await res.json();
      if(data.ok){_delLogPendingPhoto=data.url;el.innerHTML='<div style="font-size:10px;color:var(--green);font-weight:600;margin-top:4px;">&#x2713; Photo attached</div>';}
      else{el.innerHTML='';_delLogPendingPhoto=null;}
    }catch(e){el.innerHTML='';_delLogPendingPhoto=null;}
    document.body.removeChild(inp);
  };
  document.body.appendChild(inp);inp.click();
}

async function delAddLogEntry(deliveryId){
  var inp=document.getElementById('del-log-input');
  var text=inp?inp.value.trim():'';
  if(!text){inp&&inp.focus();return;}
  var d=delDeliveries.find(function(x){return x.id===deliveryId;});if(!d)return;
  if(!d.log)d.log=[];
  var author=currentEmployee?currentEmployee.name:'Admin';
  var entry={ts:new Date().toISOString(),author:author,text:text};
  if(_delLogPendingPhoto){entry.photo=_delLogPendingPhoto;_delLogPendingPhoto=null;}
  d.log.push(entry);
  await delSaveData();
  delOpenDetail(deliveryId);
  toast('Log entry added','success');
}

// Email log + send
function delRenderEmailLogHtml(emailLog){
  if(!emailLog||!emailLog.length)return '';
  var h='<div style="margin-top:10px;border-top:1px solid var(--bg4);padding-top:8px;"><div style="font-size:9px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:var(--gray-3);margin-bottom:6px;">Emails Sent</div>';
  emailLog.forEach(function(e){
    var typeLabel=e.type==='delivery_confirmation'?'Delivery Confirmation':e.type==='invoice_receipt'?'Invoice/Receipt':e.type||'Email';
    h+='<div style="font-size:11px;color:var(--gray-2);margin-bottom:4px;display:flex;align-items:center;gap:6px;"><span style="color:var(--green);">&#x2709;</span><span>'+typeLabel+' to <strong>'+e.to+'</strong></span><span style="color:var(--gray-3);margin-left:auto;">'+new Date(e.ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+'</span></div>';
  });
  h+='</div>';return h;
}

async function delSendConfirmEmail(id){
  var d=delDeliveries.find(function(x){return x.id===id;});if(!d||!d.email)return;
  var custOptedOut=false;
  try{var c=customers.find(function(c){return c.name===d.name||c.email===d.email;});if(c&&c.emailOptOut)custOptedOut=true;}catch(e){}
  if(custOptedOut){toast('Customer has opted out of emails','error');return;}
  if(!confirm('Send delivery confirmation email to '+d.email+'?'))return;
  var html=buildDeliveryEmailHtml(d);
  var dateStr=new Date(d.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
  var res=await sendDcEmail(d.email,d.name,'Delivery Confirmation — '+dateStr+' — DC Appliance',html);
  if(res.ok){
    if(!d.emailLog)d.emailLog=[];
    d.emailLog.push({ts:new Date().toISOString(),to:d.email,type:'delivery_confirmation',by:currentEmployee?currentEmployee.name:'Admin'});
    await delSaveData();
    delOpenDetail(id);
    toast('Confirmation email sent','success');
  }else{toast('Failed: '+(res.error||'Unknown error'),'error');}
}

// Print
function delPrintManifest(){document.getElementById('del-print-date').value=ds(new Date());openModal('del-print-modal');}
function delRunPrint(printTeam){
  closeModal('del-print-modal');var selectedDate=document.getElementById('del-print-date').value||ds(new Date());
  var stops=delDeliveries.filter(function(d){return d.date===selectedDate&&(printTeam==='all'||d.team===printTeam);});
  stops.sort(function(a,b){return delTimeToMins(a.time)-delTimeToMins(b.time);});
  var win=window.open('','_blank');
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Delivery Manifest</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:10px;}.hdr{display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:10px;}.hdr h1{font-size:16px;}table{width:100%;border-collapse:collapse;}th{background:#222;color:white;font-size:10px;font-weight:700;text-transform:uppercase;padding:5px 8px;text-align:left;}td{padding:7px 8px;border-bottom:1px solid #ddd;vertical-align:top;}tr:nth-child(even) td{background:#f9f9f9;}.nm{font-weight:700;font-size:13px;}.badge{border:1px solid #aaa;border-radius:3px;padding:2px 6px;font-size:10px;color:#444;margin-top:4px;display:inline-block;}.sn-line{border-bottom:1.5px solid #555;flex:1;min-width:100px;height:14px;display:inline-block;}.app-row{display:flex;align-items:baseline;gap:8px;margin-bottom:5px;}.app-name{font-weight:700;}.notes-box{margin-top:6px;padding:4px 7px;background:#f5f5f5;border-left:3px solid #aaa;font-size:11px;color:#333;border-radius:2px;}@media print{@page{margin:8mm;size:letter;}}</style></head><body>';
  var selDt=new Date(selectedDate+'T12:00:00');
  html+='<div class="hdr"><div style="display:flex;align-items:center;gap:14px;"><img src="'+DC_APPLIANCE_LOGO+'" style="max-width:180px;height:auto;object-fit:contain;" alt="DC Appliance"/><div><h1>DC Appliance - Delivery Manifest</h1><div style="font-size:10px;color:#555;margin-top:2px;">'+(printTeam==='all'?'All Teams':printTeam)+' | '+selDt.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})+'</div></div></div><div style="font-size:10px;text-align:right;color:#555;">(620) 371-6417 | Dodge City, KS<br/>'+stops.length+' stops</div></div>';
  if(!stops.length){html+='<p style="text-align:center;padding:20px;color:#999;">No deliveries.</p>';}
  else{html+='<table><thead><tr><th style="width:28px;">#</th><th style="width:28%;">Customer</th><th style="width:14%;">Time</th><th>Appliances, Serial # & Notes</th></tr></thead><tbody>';
  stops.forEach(function(s,i){
    var apps=s.appliances&&s.appliances.length?s.appliances:[{a:s.appliance||'',m:s.model||''}];var dur=parseInt(s.duration)||60;
    var tstr=s.time==='Call Ahead'?'Call Ahead':(s.time+' - '+delMinsToTime(delTimeToMins(s.time)+dur));
    var appsHtml=apps.map(function(a){return '<div class="app-row"><span class="app-name">'+a.a+'</span>'+(a.m?'<span style="font-size:11px;color:#555;">'+a.m+'</span>':'')+'<span style="font-size:11px;color:#555;">SN#</span>'+(a.serial?'<span style="font-size:11px;font-weight:700;">'+a.serial+'</span>':'<span class="sn-line"></span>')+'</div>';}).join('');
    html+='<tr><td style="font-weight:700;font-size:14px;color:#555;">'+(s.stopOrder||i+1)+'</td><td><div class="nm">'+s.name+'</div><div style="font-size:11px;color:#444;">'+s.phone+'</div><div style="font-size:11px;color:#444;">'+s.address+'<br/>'+s.city+'</div>'+(s.invoice?'<div style="font-size:10px;color:#888;">'+s.invoice+'</div>':'')+'<span class="badge">'+(s.deliveryType||'Full Install')+'</span>'+(s.notes?'<div class="notes-box">'+s.notes+'</div>':'')+'</td><td style="white-space:nowrap;">'+tstr+'</td><td>'+appsHtml+'</td></tr>';
  });html+='</tbody></table>';}
  html+='</body></html>';win.document.write(html);win.document.close();setTimeout(function(){win.print();},400);
}

// ══════════════════════════════════════════════
// SERVICE TAB - FULL IMPLEMENTATION
// ══════════════════════════════════════════════
function svcInit(){
  document.getElementById('svc-f-date').valueAsDate=new Date();
  svcRenderStats();svcRenderFilters();svcLoadJobs();
}
async function svcLoadJobs(){
  try{var res=await fetch('/api/jobs-get?companyId='+SVC_COMPANY_ID);var data=await res.json();svcJobs=data.jobs||[];svcNextId=data.nextId||1;}catch(e){svcJobs=[];svcNextId=1;}
  _lastSvcHash=JSON.stringify(svcJobs);svcRenderJobs();svcRenderStats();svcStartPolling();
}
async function svcSaveJobs(){
  try{await fetch('/api/jobs-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({companyId:SVC_COMPANY_ID,jobs:svcJobs,nextId:svcNextId})});}catch(e){console.error('Save failed:',e);}
}
function svcStartPolling(){if(_svcPollTimer)clearInterval(_svcPollTimer);_svcPollTimer=setInterval(svcPoll,15000);}
function svcStopPolling(){if(_svcPollTimer){clearInterval(_svcPollTimer);_svcPollTimer=null;}}
async function svcPoll(){
  try{var res=await fetch('/api/jobs-get?companyId='+SVC_COMPANY_ID+'&t='+Date.now());var data=await res.json();var hash=JSON.stringify(data.jobs);if(hash===_lastSvcHash)return;_lastSvcHash=hash;svcJobs=data.jobs||[];svcNextId=data.nextId||1;svcRenderJobs();svcRenderStats();}catch(e){}
}
function svcRenderStats(){
  var today=ds(new Date());
  var stats=[
    {key:'New',color:'#a78bfa',count:svcJobs.filter(function(j){return j.status==='New';}).length},
    {key:'In Progress',color:'var(--orange)',count:svcJobs.filter(function(j){return j.status==='In Progress';}).length},
    {key:'Svc Complete',color:'#2dd4bf',count:svcJobs.filter(function(j){return j.status==='Service Complete';}).length},
    {key:'Needs Claimed',color:'#fbbf24',count:svcJobs.filter(function(j){return j.status==='Needs Claimed';}).length},
    {key:'Complete',color:'var(--green)',count:svcJobs.filter(function(j){return j.status==='Complete';}).length}
  ];
  document.getElementById('svc-stats').innerHTML=stats.map(function(s){return '<div class="svc-stat"><div class="svc-stat-val" style="color:'+s.color+';">'+s.count+'</div><div class="svc-stat-key">'+s.key+'</div></div>';}).join('');
}
function svcRenderFilters(){
  var filters=['all','New','In Progress','Service Complete','Needs Claimed','Complete'];
  document.getElementById('svc-filter-row').innerHTML=filters.map(function(f){
    var label=f==='all'?'All':f;
    return '<button class="svc-ftab'+(f===svcFilter?' active':'')+'" onclick="svcFilter=\''+f+'\';document.querySelectorAll(\'.svc-ftab\').forEach(function(b){b.classList.remove(\'active\');});this.classList.add(\'active\');svcRenderJobs();">'+label+'</button>';
  }).join('');
}
function svcRenderJobs(){
  var search=(document.getElementById('svc-search')||{}).value||'';search=search.toLowerCase();
  var techFilter=(document.getElementById('svc-tech-filter')||{}).value||'';
  var filtered=svcJobs.filter(function(j){
    var mf=svcFilter==='all'||j.status===svcFilter;
    var mt=!techFilter||j.tech===techFilter;
    var ms=!search||j.name.toLowerCase().includes(search)||(j.appliance||'').toLowerCase().includes(search)||(j.address||'').toLowerCase().includes(search)||j.id.toLowerCase().includes(search)||(j.brand||'').toLowerCase().includes(search);
    return mf&&mt&&ms;
  });
  // Update tech filter dropdown
  var tf=document.getElementById('svc-tech-filter');
  if(tf){var curVal=tf.value;var filterHtml='<option value="">All Techs</option>';if(typeof _posEmpTechNames!=='undefined'&&_posEmpTechNames.length){filterHtml+='<optgroup label="Employees">';_posEmpTechNames.forEach(function(t){filterHtml+='<option value="'+t+'"'+(curVal===t?' selected':'')+'>'+t+'</option>';});filterHtml+='</optgroup>';}if(typeof _posContractorTechNames!=='undefined'&&_posContractorTechNames.length){filterHtml+='<optgroup label="Independent Contractors">';_posContractorTechNames.forEach(function(t){filterHtml+='<option value="'+t+'"'+(curVal===t?' selected':'')+'>'+t+'</option>';});filterHtml+='</optgroup>';}else{filterHtml+=svcTechList.filter(function(t){return t!=='Unassigned';}).map(function(t){return '<option value="'+t+'"'+(curVal===t?' selected':'')+'>'+t+'</option>';}).join('');}tf.innerHTML=filterHtml;}
  var list=document.getElementById('svc-jobs-list');
  if(!filtered.length){list.innerHTML='<div style="text-align:center;color:var(--gray-2);padding:30px;font-size:12px;">No jobs found</div>';return;}
  list.innerHTML=filtered.map(function(j){
    var sc=j.status==='New'?'svc-s-new':j.status==='In Progress'?'svc-s-prog':j.status==='Service Complete'?'svc-s-svcomplete':j.status==='Needs Claimed'?'svc-s-needsclaimed':'svc-s-done';
    var fd=j.date?new Date(j.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}):'-';
    var wc=j.warranty==='Manufacturer Warranty'?'svc-w-mfg':j.warranty==='5 Year Warranty'?'svc-w-5yr':'svc-w-out';
    var techIdx=svcTechList.indexOf(j.tech);var tcClass=techIdx>0?'tc-'+((techIdx-1)%8):'';
    return '<div class="svc-job-card '+tcClass+'" id="svc-card-'+j.id+'" onclick="svcToggleJob(\''+j.id+'\')">'+
    '<div class="svc-jc-top"><div><div class="svc-jc-id">'+j.id+'</div><div class="svc-jc-name">'+j.name+'</div><div class="svc-jc-appliance">'+(j.brand?j.brand+' ':'')+j.appliance+'</div></div><div class="svc-jc-right"><span class="svc-spill '+sc+'">'+j.status+'</span><span class="svc-tech-pill '+tcClass+'">'+j.tech+'</span></div></div>'+
    '<div class="svc-jc-meta"><span>'+fd+'</span><span>'+j.time+'</span><span>'+j.address.split(',')[0]+(j.city?', '+j.city:'')+'</span></div>'+
    '<div class="svc-job-detail" id="svc-detail-'+j.id+'">'+
    '<div class="svc-assign-row" onclick="event.stopPropagation()"><label>Assign:</label><select class="svc-assign-sel" onchange="svcAssignTech(\''+j.id+'\',this.value)">'+(typeof _buildSvcTechOptions==='function'?_buildSvcTechOptions(j.tech):svcTechList.map(function(t){return '<option value="'+t+'"'+(j.tech===t?' selected':'')+'>'+t+'</option>';}).join(''))+'</select></div>'+
    '<div class="svc-dg"><div class="svc-df"><label>Phone</label><div class="svc-dv"><a href="tel:'+j.phone+'" onclick="event.stopPropagation()">'+j.phone+'</a></div></div>'+(j.email?'<div class="svc-df"><label>Email</label><div class="svc-dv"><a href="mailto:'+j.email+'" onclick="event.stopPropagation()">'+j.email+'</a></div></div>':'<div></div>')+'<div class="svc-df"><label>Address</label><div class="svc-dv">'+j.address+(j.city?', '+j.city:'')+'</div></div><div class="svc-df"><label>Priority</label><div class="svc-dv svc-p-'+j.priority.toLowerCase()+'">'+j.priority+'</div></div>'+(j.warranty?'<div class="svc-df"><label>Warranty</label><div class="svc-dv"><span class="svc-w-pill '+wc+'">'+j.warranty+'</span></div></div>':'')+(j.model?'<div class="svc-df"><label>Model</label><div class="svc-dv">'+j.model+'</div></div>':'')+(j.serial?'<div class="svc-df"><label>Serial</label><div class="svc-dv">'+j.serial+'</div></div>':'')+(j.invoice?'<div class="svc-df"><label>Invoice</label><div class="svc-dv">'+j.invoice+'</div></div>':'')+(j.claim?'<div class="svc-df"><label>Claim</label><div class="svc-dv">'+j.claim+'</div></div>':'')+(j.delivery?'<div class="svc-df"><label>Delivery</label><div class="svc-dv">'+new Date(j.delivery+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})+'</div></div>':'')+'</div>'+
    '<div class="svc-df" style="margin-bottom:8px;"><label>Issue</label><div class="svc-notes-blk">'+j.issue+'</div></div>'+
    (j.notes?'<div class="svc-df" style="margin-bottom:8px;"><label>Notes</label><div class="svc-notes-blk">'+j.notes+'</div></div>':'')+
    '<div class="svc-act-row" onclick="event.stopPropagation()">'+
    (j.status!=='In Progress'?'<button class="svc-abtn orange" onclick="svcSetStatus(\''+j.id+'\',\'In Progress\')">In Progress</button>':'')+
    (j.status!=='Service Complete'?'<button class="svc-abtn teal" onclick="svcSetStatus(\''+j.id+'\',\'Service Complete\')">Svc Complete</button>':'')+
    (j.status!=='Needs Claimed'?'<button class="svc-abtn yellow" onclick="svcSetStatus(\''+j.id+'\',\'Needs Claimed\')">Needs Claimed</button>':'')+
    (j.status!=='Complete'?'<button class="svc-abtn green" onclick="svcSetStatus(\''+j.id+'\',\'Complete\')">Complete</button>':'')+
    (j.status!=='New'?'<button class="svc-abtn blue" onclick="svcSetStatus(\''+j.id+'\',\'New\')">Set New</button>':'')+
    '<button class="svc-abtn blue" onclick="svcOpenEditJob(\''+j.id+'\');event.stopPropagation();">Edit</button>'+
    '<button class="svc-abtn red" onclick="svcDeleteJob(\''+j.id+'\')">Delete</button>'+
    '<button class="svc-abtn" style="border-color:rgba(201,151,58,0.3);color:var(--gold);margin-left:auto;" onclick="svcPrintJob(\''+j.id+'\')">Print</button>'+
    '</div>'+
    // Parts & Customer Status section (In Progress only)
    (j.status==='In Progress'?'<div class="svc-part-section" onclick="event.stopPropagation()"><div class="svc-part-title">Parts & Customer Status</div>'+
    '<div class="svc-status-block"><div class="svc-chk-row"><input type="checkbox" id="svc-chk-part-'+j.id+'"'+(j.partOnOrder?' checked':'')+' onchange="svcTogglePartOrder(\''+j.id+'\',this.checked)"/><label for="svc-chk-part-'+j.id+'">Part on Order</label></div><div class="svc-part-num-field'+(j.partOnOrder?' show':'')+'" id="svc-pnf-'+j.id+'"><input class="inp" id="svc-pnum-'+j.id+'" placeholder="Part number..." value="'+(j.partNumber||'')+'" onblur="svcSavePartNumber(\''+j.id+'\',this.value)"/></div>'+(j.partOrderedAt?'<div class="svc-status-ts">Ordered: '+new Date(j.partOrderedAt).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+(j.partOrderedBy?' by '+j.partOrderedBy:'')+'</div>':'')+'</div>'+
    '<div class="svc-status-block"><div class="svc-chk-row"><input type="checkbox" id="svc-chk-cc-'+j.id+'"'+(j.customerContacted?' checked':'')+' onchange="svcToggleContacted(\''+j.id+'\',this.checked)"/><label for="svc-chk-cc-'+j.id+'">Customer Contacted</label></div>'+(j.customerContactedAt?'<div class="svc-status-ts">Contacted: '+new Date(j.customerContactedAt).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+(j.customerContactedBy?' by '+j.customerContactedBy:'')+'</div>':'')+'</div>'+
    '<div class="svc-status-block"><div class="svc-chk-row"><input type="checkbox" id="svc-chk-sched-'+j.id+'"'+(j.customerScheduled?' checked':'')+' onchange="svcToggleScheduled(\''+j.id+'\',this.checked)"/><label for="svc-chk-sched-'+j.id+'">Customer Scheduled</label></div><div class="svc-sched-fields'+(j.customerScheduled?' show':'')+'" id="svc-sched-fields-'+j.id+'"><div class="svc-sched-row"><div><label style="font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--gray-2);display:block;margin-bottom:3px;">Date</label><input class="inp" type="date" id="svc-sched-date-'+j.id+'" value="'+(j.schedDate||'')+'"/></div><div><label style="font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--gray-2);display:block;margin-bottom:3px;">Time</label><input class="inp" type="time" id="svc-sched-time-'+j.id+'" value="'+(j.schedTime||'')+'"/></div></div><div style="font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--gray-2);margin-top:8px;margin-bottom:4px;">Type</div><div class="svc-type-row"><button class="svc-type-btn'+(j.schedType==='diagnose'?' active':'')+'" onclick="svcSetSchedType(\''+j.id+'\',\'diagnose\',this)">Diagnose</button><button class="svc-type-btn'+(j.schedType==='install'?' active':'')+'" onclick="svcSetSchedType(\''+j.id+'\',\'install\',this)">Install Part</button><button class="svc-type-btn'+(j.schedType==='repair'?' active':'')+'" onclick="svcSetSchedType(\''+j.id+'\',\'repair\',this)">Repair</button></div><button class="svc-sched-save" onclick="svcSaveScheduled(\''+j.id+'\')">Save Appointment</button></div>'+(j.schedDate?'<div class="svc-status-ts">Scheduled: '+new Date(j.schedDate+'T'+(j.schedTime||'12:00')).toLocaleDateString('en-US',{month:'short',day:'numeric'})+(j.schedType?' ('+j.schedType.charAt(0).toUpperCase()+j.schedType.slice(1)+')':'')+(j.scheduledBy?' by '+j.scheduledBy:'')+'</div>':'')+'</div></div>':'')+
    // Tabs: Log & Files
    '<div class="svc-job-tabs" onclick="event.stopPropagation()"><button class="svc-job-tab active" onclick="svcSwitchTab(\''+j.id+'\',\'log\',this)">Activity Log</button><button class="svc-job-tab" onclick="svcSwitchTab(\''+j.id+'\',\'files\',this)">Files & Photos</button></div>'+
    '<div id="svc-tab-log-'+j.id+'" class="svc-tab-panel active" onclick="event.stopPropagation()"><div class="svc-log-list" id="svc-log-'+j.id+'">'+svcRenderLog(j)+'</div><div class="svc-add-log"><select class="svc-log-type-sel" id="svc-ltype-'+j.id+'"><option value="call">Call</option><option value="text">Text</option><option value="note">Note</option><option value="email">Email</option></select><textarea class="svc-log-txta" id="svc-ltxt-'+j.id+'" placeholder="Log a call, text, or note..." rows="1"></textarea><button class="svc-log-addbtn" onclick="svcAddLog(\''+j.id+'\')">Add</button></div></div>'+
    '<div id="svc-tab-files-'+j.id+'" class="svc-tab-panel" onclick="event.stopPropagation()"><div class="svc-attach-grid" id="svc-agrid-'+j.id+'">'+svcRenderFiles(j)+'</div><div class="svc-upload-zone"><input type="file" accept="image/*,.pdf" multiple onchange="svcHandleUpload(\''+j.id+'\',this.files)"/><div style="font-size:12px;color:var(--gray-2);">Click or drag to upload</div><div style="font-size:10px;color:var(--gray-3);margin-top:2px;">Images or PDF</div></div></div>'+
    '</div></div>';
  }).join('');
}
function svcToggleJob(id){
  var d=document.getElementById('svc-detail-'+id),c=document.getElementById('svc-card-'+id);var open=d.classList.contains('open');
  document.querySelectorAll('.svc-job-detail').forEach(function(x){x.classList.remove('open');});document.querySelectorAll('.svc-job-card').forEach(function(x){x.classList.remove('expanded');});
  if(!open){d.classList.add('open');c.classList.add('expanded');}
}
function svcSwitchTab(id,tab,btn){btn.closest('.svc-job-tabs').querySelectorAll('.svc-job-tab').forEach(function(t){t.classList.remove('active');});btn.classList.add('active');document.getElementById('svc-tab-log-'+id).classList.toggle('active',tab==='log');document.getElementById('svc-tab-files-'+id).classList.toggle('active',tab==='files');}
async function svcSetStatus(id,status){var j=svcJobs.find(function(x){return x.id===id;});if(!j)return;j.status=status;if(status==='Complete')j.completedAt=new Date().toISOString();await svcSaveJobs();svcRenderJobs();svcRenderStats();toast('Status: '+status,'success');}
async function svcAssignTech(id,tech){var j=svcJobs.find(function(x){return x.id===id;});if(!j)return;j.tech=tech;await svcSaveJobs();svcRenderJobs();svcRenderStats();setTimeout(function(){svcToggleJob(id);},50);}
async function svcDeleteJob(id){if(!confirm('Delete this job?'))return;svcJobs=svcJobs.filter(function(j){return j.id!==id;});await svcSaveJobs();svcRenderJobs();svcRenderStats();toast('Job deleted','info');}
async function svcAddJob(){
  var name=document.getElementById('svc-f-name').value.trim(),phone=document.getElementById('svc-f-phone').value.trim(),email=document.getElementById('svc-f-email').value.trim(),address=document.getElementById('svc-f-address').value.trim(),city=document.getElementById('svc-f-city').value.trim(),appliance=document.getElementById('svc-f-appliance').value,brand=document.getElementById('svc-f-brand').value.trim(),model=document.getElementById('svc-f-model').value.trim(),serial=document.getElementById('svc-f-serial').value.trim(),warranty=document.getElementById('svc-f-warranty').value,invoice=document.getElementById('svc-f-invoice').value.trim(),claim=document.getElementById('svc-f-claim').value.trim(),delivery=document.getElementById('svc-f-delivery').value,issue=document.getElementById('svc-f-issue').value.trim(),date=document.getElementById('svc-f-date').value,time=document.getElementById('svc-f-time').value,tech=document.getElementById('svc-f-tech').value,priority=document.getElementById('svc-f-priority').value,notes=document.getElementById('svc-f-notes').value.trim();
  if(!name||!phone||!address||!city||!appliance||!issue||!date){toast('Fill all required fields','error');return;}
  var job={id:'JOB-'+String(svcNextId).padStart(4,'0'),name:name,phone:phone,email:email,address:address,city:city,appliance:appliance,brand:brand,model:model,serial:serial,warranty:warranty,invoice:invoice,claim:claim,delivery:delivery,issue:issue,date:date,time:time,tech:tech,priority:priority,notes:notes,status:'New',partOnOrder:false,partNumber:'',customerContacted:false,customerScheduled:false,activityLog:[],files:[],createdAt:new Date().toISOString(),completedAt:null};
  svcNextId++;svcJobs.unshift(job);await svcSaveJobs();
  // Attach pending invoice file
  if(svcPendingInvoiceFile){
    try{var b64=await toB64(svcPendingInvoiceFile);
    var upRes=await fetch('/api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:svcPendingInvoiceFile.name,contentType:svcPendingInvoiceFile.type,data:b64,companyId:SVC_COMPANY_ID,jobId:job.id})});
    var upData=await upRes.json();
    if(upData.ok){job.files=job.files||[];job.files.push({url:upData.url,filename:svcPendingInvoiceFile.name,type:svcPendingInvoiceFile.type,uploadedAt:new Date().toISOString(),label:'Sales Invoice'});await svcSaveJobs();}
    }catch(e){console.warn('Invoice attach failed:',e);}
    svcPendingInvoiceFile=null;
  }
  svcRenderJobs();svcRenderStats();
  ['svc-f-name','svc-f-phone','svc-f-email','svc-f-address','svc-f-city','svc-f-brand','svc-f-model','svc-f-serial','svc-f-invoice','svc-f-claim','svc-f-issue','svc-f-notes'].forEach(function(id){document.getElementById(id).value='';});
  document.getElementById('svc-f-appliance').value='';document.getElementById('svc-f-warranty').value='Out of Warranty';document.getElementById('svc-f-delivery').value='';document.getElementById('svc-f-tech').value='Unassigned';document.getElementById('svc-f-priority').value='Medium';document.getElementById('svc-f-date').valueAsDate=new Date();
  toast('Job '+job.id+' created'+(job.files&&job.files.length?' - Invoice attached':''),'success');
}
// Part/Customer toggles
async function svcTogglePartOrder(id,checked){var j=svcJobs.find(function(x){return x.id===id;});if(!j)return;j.partOnOrder=checked;if(checked){j.partOrderedAt=new Date().toISOString();j.partOrderedBy='POS User';}else{j.partNumber='';j.partOrderedAt=null;j.partOrderedBy='';}var pnf=document.getElementById('svc-pnf-'+id);if(pnf)pnf.classList.toggle('show',checked);await svcSaveJobs();svcRenderJobs();svcRenderStats();setTimeout(function(){svcToggleJob(id);},50);}
async function svcSavePartNumber(id,val){var j=svcJobs.find(function(x){return x.id===id;});if(!j)return;j.partNumber=val.trim();await svcSaveJobs();}
async function svcToggleContacted(id,checked){var j=svcJobs.find(function(x){return x.id===id;});if(!j)return;j.customerContacted=checked;if(checked){j.customerContactedAt=new Date().toISOString();j.customerContactedBy='POS User';}else{j.customerContactedAt=null;j.customerContactedBy='';}await svcSaveJobs();svcRenderJobs();svcRenderStats();setTimeout(function(){svcToggleJob(id);},50);}
async function svcToggleScheduled(id,checked){var j=svcJobs.find(function(x){return x.id===id;});if(!j)return;j.customerScheduled=checked;if(!checked){j.schedDate='';j.schedTime='';j.schedType='';j.scheduledBy='';}var sf=document.getElementById('svc-sched-fields-'+id);if(sf)sf.classList.toggle('show',checked);await svcSaveJobs();}
function svcSetSchedType(id,type,btn){btn.closest('.svc-type-row').querySelectorAll('.svc-type-btn').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');var j=svcJobs.find(function(x){return x.id===id;});if(j)j.schedType=type;}
async function svcSaveScheduled(id){var j=svcJobs.find(function(x){return x.id===id;});if(!j)return;j.schedDate=document.getElementById('svc-sched-date-'+id).value;j.schedTime=document.getElementById('svc-sched-time-'+id).value;j.scheduledBy='POS User';if(!j.schedDate){toast('Enter date','error');return;}await svcSaveJobs();svcRenderJobs();svcRenderStats();setTimeout(function(){svcToggleJob(id);},50);}
// Activity Log
function svcRenderLog(j){var e=j.activityLog||[];if(!e.length)return '<div style="font-size:12px;color:var(--gray-3);padding:6px 0;">No activity yet.</div>';return e.slice().reverse().map(function(x){return '<div class="svc-log-entry '+x.type+'"><div class="svc-log-meta"><span class="svc-lbadge svc-lb-'+x.type+'">'+x.type+'</span><span class="svc-log-time">'+new Date(x.at).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+'</span><span class="svc-log-by">-- '+(x.by||'POS')+'</span></div><div class="svc-log-content">'+x.text+'</div></div>';}).join('');}
async function svcAddLog(id){var j=svcJobs.find(function(x){return x.id===id;});if(!j)return;var type=document.getElementById('svc-ltype-'+id).value,text=document.getElementById('svc-ltxt-'+id).value.trim();if(!text)return;if(!j.activityLog)j.activityLog=[];j.activityLog.push({type:type,text:text,by:'POS User',at:new Date().toISOString()});document.getElementById('svc-ltxt-'+id).value='';await svcSaveJobs();var ll=document.getElementById('svc-log-'+id);if(ll)ll.innerHTML=svcRenderLog(j);}
// Files
function svcRenderFiles(j){var f=j.files||[];if(!f.length)return '';return f.map(function(x,i){var isPdf=x.filename&&x.filename.toLowerCase().endsWith('.pdf');var labelHtml=x.label?'<span style="font-size:9px;font-weight:700;background:rgba(91,159,212,0.15);color:var(--blue);padding:2px 6px;text-align:center;display:block;">'+x.label+'</span>':'';return '<div class="svc-attach-item"><a href="'+x.url+'" target="_blank">'+(isPdf?'<div class="svc-attach-pdf"><div class="svc-attach-pdf-icon">PDF</div><div class="svc-attach-pdf-name">'+x.filename+'</div></div>':'<img class="svc-attach-img" src="'+x.url+'" alt="photo"/>')+labelHtml+'</a><button class="svc-attach-del" onclick="event.stopPropagation();svcDeleteFile(\''+j.id+'\','+i+')">x</button></div>';}).join('');}
async function svcHandleUpload(jobId,files){var j=svcJobs.find(function(x){return x.id===jobId;});if(!j||!files||!files.length)return;if(!j.files)j.files=[];for(var i=0;i<files.length;i++){try{var b64=await toB64(files[i]);var res=await fetch('/api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:files[i].name,contentType:files[i].type,data:b64,companyId:SVC_COMPANY_ID,jobId:jobId})});var d=await res.json();if(d.ok)j.files.push({url:d.url,filename:files[i].name,type:files[i].type,uploadedAt:new Date().toISOString()});}catch(e){toast('Upload failed: '+e.message,'error');}}await svcSaveJobs();var g=document.getElementById('svc-agrid-'+jobId);if(g)g.innerHTML=svcRenderFiles(j);}
async function svcDeleteFile(id,i){if(!confirm('Remove file?'))return;var j=svcJobs.find(function(x){return x.id===id;});if(!j||!j.files)return;j.files.splice(i,1);await svcSaveJobs();var g=document.getElementById('svc-agrid-'+id);if(g)g.innerHTML=svcRenderFiles(j);}
// Invoice
function svcHandleInvoiceDrop(e){e.preventDefault();document.getElementById('svc-invoice-dz').classList.remove('drag-over');var file=e.dataTransfer.files[0];if(file)svcHandleInvoiceFile(file);}
async function svcHandleInvoiceFile(file){
  if(!file)return;svcPendingInvoiceFile=file;var loading=document.getElementById('svc-idz-loading');if(loading)loading.style.display='block';
  try{var b64=await toB64(file);var isPdf=file.type==='application/pdf';
  var msgs=[{role:'user',content:[{type:isPdf?'document':'image',source:{type:'base64',media_type:file.type,data:b64}},{type:'text',text:'Extract customer info and appliance from this invoice. JSON: {"customer":{"name":"","phone":"","email":"","address":"","city":""},"appliances":[{"appliance":"Washer","brand":"Samsung","model":"WF45R6100AW","serial":"ABC123","invoice":"INV-001"}]}'}]}];
  var data=await claudeApiCall({messages:msgs,max_tokens:1000});
  var text=data.content[0].text;var match=text.match(/\{[\s\S]*\}/);if(!match)throw new Error('No data');var parsed=JSON.parse(match[0]);var cust=parsed.customer||{};
  if(cust.name)document.getElementById('svc-f-name').value=cust.name;if(cust.phone)document.getElementById('svc-f-phone').value=cust.phone;if(cust.email)document.getElementById('svc-f-email').value=cust.email;if(cust.address)document.getElementById('svc-f-address').value=cust.address;if(cust.city)document.getElementById('svc-f-city').value=cust.city;
  var apps=parsed.appliances||[];if(apps.length>0){var a=apps[0];if(a.appliance){var sel=document.getElementById('svc-f-appliance');for(var i=0;i<sel.options.length;i++){if(sel.options[i].value&&a.appliance.toLowerCase().includes(sel.options[i].value.toLowerCase().split('/')[0].trim())){sel.selectedIndex=i;break;}}}if(a.brand)document.getElementById('svc-f-brand').value=a.brand;if(a.model)document.getElementById('svc-f-model').value=a.model;if(a.serial)document.getElementById('svc-f-serial').value=a.serial;if(a.invoice)document.getElementById('svc-f-invoice').value=a.invoice;}
  // Show queued file indicator
  var zone=document.getElementById('svc-invoice-dz');
  if(zone&&svcPendingInvoiceFile){var prev=zone.querySelector('.svc-idz-preview');if(!prev){prev=document.createElement('div');prev.className='svc-idz-preview';zone.appendChild(prev);}prev.style.cssText='font-size:11px;color:var(--green);margin-top:6px;font-weight:600;';prev.textContent='Queued: '+svcPendingInvoiceFile.name;}
  toast('Invoice read successfully','success');}catch(e){toast('Could not read invoice: '+e.message,'error');}finally{if(loading)loading.style.display='none';}
}
// Edit Job
function svcOpenEditJob(id){var j=svcJobs.find(function(x){return x.id===id;});if(!j)return;svcEditingJobId=id;
  document.getElementById('svc-e-name').value=j.name||'';document.getElementById('svc-e-phone').value=j.phone||'';document.getElementById('svc-e-email').value=j.email||'';document.getElementById('svc-e-address').value=j.address||'';document.getElementById('svc-e-city').value=j.city||'';document.getElementById('svc-e-brand').value=j.brand||'';document.getElementById('svc-e-model').value=j.model||'';document.getElementById('svc-e-serial').value=j.serial||'';document.getElementById('svc-e-invoice').value=j.invoice||'';document.getElementById('svc-e-claim').value=j.claim||'';document.getElementById('svc-e-delivery').value=j.delivery||'';document.getElementById('svc-e-issue').value=j.issue||'';document.getElementById('svc-e-date').value=j.date||'';document.getElementById('svc-e-notes').value=j.notes||'';
  var as=document.getElementById('svc-e-appliance');for(var i=0;i<as.options.length;i++){if(as.options[i].value===j.appliance){as.selectedIndex=i;break;}}
  var ws=document.getElementById('svc-e-warranty');for(var i=0;i<ws.options.length;i++){if(ws.options[i].value===j.warranty){ws.selectedIndex=i;break;}}
  var ts=document.getElementById('svc-e-time');for(var i=0;i<ts.options.length;i++){if(ts.options[i].value===j.time){ts.selectedIndex=i;break;}}
  var ps=document.getElementById('svc-e-priority');for(var i=0;i<ps.options.length;i++){if(ps.options[i].value===j.priority){ps.selectedIndex=i;break;}}
  var techSel=document.getElementById('svc-e-tech');techSel.innerHTML=(typeof _buildSvcTechOptions==='function'?_buildSvcTechOptions(j.tech):svcTechList.map(function(t){return '<option value="'+t+'"'+(j.tech===t?' selected':'')+'>'+t+'</option>';}).join(''));
  document.getElementById('svc-edit-msg').textContent='';openModal('svc-edit-modal');
}
async function svcSaveEditJob(){var j=svcJobs.find(function(x){return x.id===svcEditingJobId;});if(!j)return;var msg=document.getElementById('svc-edit-msg');
  var name=document.getElementById('svc-e-name').value.trim(),phone=document.getElementById('svc-e-phone').value.trim(),address=document.getElementById('svc-e-address').value.trim(),city=document.getElementById('svc-e-city').value.trim(),appliance=document.getElementById('svc-e-appliance').value,issue=document.getElementById('svc-e-issue').value.trim(),date=document.getElementById('svc-e-date').value;
  if(!name||!phone||!address||!city||!appliance||!issue||!date){msg.textContent='Fill all required fields.';msg.style.color='var(--red)';return;}
  j.name=name;j.phone=document.getElementById('svc-e-phone').value.trim();j.email=document.getElementById('svc-e-email').value.trim();j.address=document.getElementById('svc-e-address').value.trim();j.city=document.getElementById('svc-e-city').value.trim();j.appliance=document.getElementById('svc-e-appliance').value;j.brand=document.getElementById('svc-e-brand').value.trim();j.model=document.getElementById('svc-e-model').value.trim();j.serial=document.getElementById('svc-e-serial').value.trim();j.warranty=document.getElementById('svc-e-warranty').value;j.invoice=document.getElementById('svc-e-invoice').value.trim();j.claim=document.getElementById('svc-e-claim').value.trim();j.delivery=document.getElementById('svc-e-delivery').value;j.issue=document.getElementById('svc-e-issue').value.trim();j.date=document.getElementById('svc-e-date').value;j.time=document.getElementById('svc-e-time').value;j.tech=document.getElementById('svc-e-tech').value;j.priority=document.getElementById('svc-e-priority').value;j.notes=document.getElementById('svc-e-notes').value.trim();
  await svcSaveJobs();svcRenderJobs();svcRenderStats();msg.textContent='Saved!';msg.style.color='var(--green)';setTimeout(function(){closeModal('svc-edit-modal');setTimeout(function(){svcToggleJob(svcEditingJobId);},100);},600);
}
function svcPrintJob(id){var card=document.getElementById('svc-card-'+id);var detail=document.getElementById('svc-detail-'+id);if(!detail.classList.contains('open'))svcToggleJob(id);var win=window.open('','_blank');var j=svcJobs.find(function(x){return x.id===id;});if(!j)return;
  var fd=j.date?new Date(j.date+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}):'';
  var html='<!DOCTYPE html><html><head><title>Work Order '+j.id+'</title><style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px;color:#111;}h1{font-size:18px;border-bottom:2px solid #111;padding-bottom:8px;}table{width:100%;border-collapse:collapse;margin:10px 0;}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #ddd;}th{background:#f5f5f5;font-size:10px;text-transform:uppercase;}.issue{background:#f5f5f5;padding:10px;border-left:3px solid #999;margin:10px 0;}</style></head><body>';
  html+='<h1>Service Work Order - '+j.id+'</h1><table><tr><th>Customer</th><td>'+j.name+'</td><th>Phone</th><td>'+j.phone+'</td></tr><tr><th>Address</th><td>'+j.address+(j.city?', '+j.city:'')+'</td><th>Date</th><td>'+fd+'</td></tr><tr><th>Appliance</th><td>'+(j.brand?j.brand+' ':'')+j.appliance+'</td><th>Tech</th><td>'+j.tech+'</td></tr>'+(j.model?'<tr><th>Model</th><td>'+j.model+'</td><th>Serial</th><td>'+(j.serial||'-')+'</td></tr>':'')+(j.warranty?'<tr><th>Warranty</th><td>'+j.warranty+'</td><th>Priority</th><td>'+j.priority+'</td></tr>':'')+'</table><div class="issue"><strong>Issue:</strong> '+j.issue+'</div>'+(j.notes?'<div class="issue"><strong>Notes:</strong> '+j.notes+'</div>':'')+'</body></html>';
  win.document.write(html);win.document.close();setTimeout(function(){win.print();},300);
}

// ══════════════════════════════════════════════
// ORDERING (was REORDER) TAB
// ══════════════════════════════════════════════
// ═══ ORDER SECTION — vendor-first workflow ═══
var _orderVendor='';
var _orderDraft=[]; // [{productId, name, model, brand, stock, reorderPt, qty, unitCost}]
var _orderNotes='';
var _orderExpected='';

function renderReorder(){
  var el=document.getElementById('order-content');if(!el)return;
  if(!_orderVendor){
    // Step 1 — Vendor selection only
    var vendorOpts=(typeof adminVendors!=='undefined'?adminVendors:[])
      .filter(function(v){return v.name;})
      .sort(function(a,b){return a.name.localeCompare(b.name);})
      .map(function(v){return '<option value="'+v.name+'">'+v.name+'</option>';}).join('');
    // Also include brands used on products that aren't in vendor list, as fallback
    var brandsInUse={};PRODUCTS.forEach(function(p){if(p.vendor)brandsInUse[p.vendor]=true;else if(p.brand)brandsInUse[p.brand]=true;});
    var vendorNames={};(adminVendors||[]).forEach(function(v){vendorNames[v.name]=true;});
    var extraOpts=Object.keys(brandsInUse).filter(function(b){return !vendorNames[b];}).sort().map(function(b){return '<option value="'+b+'">'+b+' (brand)</option>';}).join('');
    el.innerHTML='<div style="max-width:560px;margin:40px auto;text-align:center;">'
      +'<h2 style="font-size:24px;font-weight:700;color:#1f2937;margin-bottom:6px;">Start a New Order</h2>'
      +'<p style="font-size:13px;color:#6b7280;margin-bottom:24px;">Select a vendor to build a suggested purchase order based on current stock levels.</p>'
      +'<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">'
      +'<label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:0.06em;margin-bottom:8px;">Select a Vendor to Begin</label>'
      +'<select class="sel" id="order-vendor-sel" onchange="_orderVendor=this.value;renderReorder();" style="font-size:16px;padding:14px 16px;width:100%;border:2px solid #d1d5db;border-radius:10px;">'
      +'<option value="">— Choose a vendor —</option>'+vendorOpts+(extraOpts?'<optgroup label="Brands (no vendor record)">'+extraOpts+'</optgroup>':'')
      +'</select>'
      +'</div></div>';
    return;
  }
  // Step 2+ — vendor selected
  renderOrderForm();
}

function renderOrderForm(){
  var el=document.getElementById('order-content');
  var vendorProducts=PRODUCTS.filter(function(p){
    if(p.active===false)return false;
    return (p.vendor&&p.vendor.toLowerCase()===_orderVendor.toLowerCase())||(!p.vendor&&p.brand&&p.brand.toLowerCase()===_orderVendor.toLowerCase());
  });
  var vendorProdCount=vendorProducts.length;

  var h='<div style="max-width:1100px;margin:0 auto;">';
  h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap;">';
  h+='<button class="ghost-btn" onclick="orderBackToVendor()" style="font-size:12px;">&#8592; Change Vendor</button>';
  h+='<div style="flex:1;"><div style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;">Ordering For</div><div style="font-size:18px;font-weight:700;color:#1f2937;">'+_orderVendor+'</div><div style="font-size:11px;color:#9ca3af;">'+vendorProdCount+' product'+(vendorProdCount===1?'':'s')+' in inventory</div></div>';
  if(!_orderDraft.length)h+='<button class="primary-btn" onclick="generateSuggestedOrder()" style="font-size:13px;padding:10px 18px;">Generate Suggested Order</button>';
  h+='</div>';

  if(_orderDraft.length){
    // Draft order table
    var total=_orderDraft.reduce(function(s,r){return s+r.qty*r.unitCost;},0);
    h+='<div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:14px;">';
    h+='<table class="admin-table" style="font-size:11px;margin:0;"><thead><tr>';
    h+='<th>Product</th><th>Model #</th><th>Brand</th><th style="text-align:center;">On Hand</th><th style="text-align:center;">Min</th><th style="width:80px;text-align:center;">Order Qty</th><th style="text-align:right;">Unit Cost</th><th style="text-align:right;">Ext. Cost</th><th style="width:40px;"></th>';
    h+='</tr></thead><tbody>';
    _orderDraft.forEach(function(r,i){
      var ext=r.qty*r.unitCost;
      var ams=r.stock-(r.sold||0);
      var bg=ams<=0?'background:#fef2f2;':ams<=r.reorderPt?'background:#fffbeb;':'';
      h+='<tr style="'+bg+'">';
      h+='<td style="font-weight:600;">'+r.name+'</td>';
      h+='<td>'+(r.model||'')+'</td>';
      h+='<td>'+(r.brand||'')+'</td>';
      h+='<td style="text-align:center;font-weight:700;'+(ams<=0?'color:#dc2626;':ams<=r.reorderPt?'color:#d97706;':'')+'">'+ams+'</td>';
      h+='<td style="text-align:center;">'+r.reorderPt+'</td>';
      h+='<td style="text-align:center;"><input type="number" min="1" value="'+r.qty+'" oninput="orderUpdateQty('+i+',this.value)" style="width:60px;padding:4px 6px;text-align:center;border:1px solid #d1d5db;border-radius:4px;font-size:11px;"/></td>';
      h+='<td style="text-align:right;">'+fmt(r.unitCost)+'</td>';
      h+='<td style="text-align:right;font-weight:600;">'+fmt(ext)+'</td>';
      h+='<td><button onclick="orderRemoveRow('+i+')" title="Remove" style="background:transparent;border:none;color:#dc2626;cursor:pointer;font-size:16px;padding:4px 8px;">&#x1F5D1;</button></td>';
      h+='</tr>';
    });
    h+='</tbody></table></div>';
    // Add product row
    h+='<div style="display:flex;gap:8px;margin-bottom:14px;align-items:center;">';
    h+='<select id="order-add-prod" class="sel" style="flex:1;font-size:12px;">';
    h+='<option value="">+ Add another product from '+_orderVendor+'...</option>';
    var draftIds={};_orderDraft.forEach(function(r){draftIds[r.productId]=true;});
    vendorProducts.filter(function(p){return !draftIds[p.id];}).forEach(function(p){
      h+='<option value="'+p.id+'">'+(p.model||p.sku||'')+' — '+p.name+' (on hand: '+(p.stock-(p.sold||0))+')</option>';
    });
    h+='</select>';
    h+='<button class="ghost-btn" onclick="orderAddManual()">Add</button>';
    h+='</div>';
    // Notes + expected date
    h+='<div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;margin-bottom:14px;">';
    h+='<div><label style="font-size:10px;font-weight:700;text-transform:uppercase;color:#6b7280;">PO Notes</label><textarea class="txta" id="order-notes" rows="2" oninput="_orderNotes=this.value;" placeholder="Terms, special instructions..." style="width:100%;">'+_orderNotes+'</textarea></div>';
    h+='<div><label style="font-size:10px;font-weight:700;text-transform:uppercase;color:#6b7280;">Expected Delivery</label><input type="date" class="inp" id="order-expected" value="'+_orderExpected+'" oninput="_orderExpected=this.value;"/></div>';
    h+='</div>';
    // Total + create
    h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;">';
    h+='<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#6b7280;">Total Order Cost</div><div style="font-size:24px;font-weight:800;color:#1f2937;">'+fmt(total)+'</div></div>';
    h+='<button class="primary-btn" onclick="createOrderPO()" style="font-size:14px;padding:12px 24px;">Create Purchase Order</button>';
    h+='</div>';
  }else{
    // No suggestions yet — show empty prompt
    var flagged=vendorProducts.filter(function(p){var ams=p.stock-(p.sold||0);return ams<=0||ams<=p.reorderPt||(p.sold||0)>p.stock;}).length;
    h+='<div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:30px;text-align:center;">';
    if(flagged){
      h+='<div style="font-size:13px;color:#374151;">Click <strong>Generate Suggested Order</strong> to start — '+flagged+' product'+(flagged===1?'':'s')+' for '+_orderVendor+' need'+(flagged===1?'s':'')+' reordering.</div>';
    }else{
      h+='<div style="font-size:14px;color:#16a34a;font-weight:700;margin-bottom:4px;">&#x2713; All products for '+_orderVendor+' are sufficiently stocked</div>';
      h+='<div style="font-size:12px;color:#6b7280;">You can still click <strong>Generate Suggested Order</strong> and manually add products, or change vendor.</div>';
    }
    h+='</div>';
  }

  h+='</div>';
  el.innerHTML=h;
}

function generateSuggestedOrder(){
  var vendorProducts=PRODUCTS.filter(function(p){
    if(p.active===false)return false;
    return (p.vendor&&p.vendor.toLowerCase()===_orderVendor.toLowerCase())||(!p.vendor&&p.brand&&p.brand.toLowerCase()===_orderVendor.toLowerCase());
  });
  var flagged=vendorProducts.filter(function(p){
    var ams=p.stock-(p.sold||0);
    var oversold=(p.sold||0)>p.stock;
    return ams<=0||ams<=(p.reorderPt||0)||oversold;
  });
  if(!flagged.length){
    toast('All products for '+_orderVendor+' are sufficiently stocked','info');
    // Still enter the draft view empty so they can add manually
    _orderDraft=[];renderReorder();return;
  }
  _orderDraft=flagged.map(function(p){
    return{productId:p.id,name:p.name,model:p.model||p.sku||'',brand:p.brand||'',stock:p.stock||0,sold:p.sold||0,reorderPt:p.reorderPt||0,qty:p.reorderQty||1,unitCost:p.cost||0};
  });
  renderReorder();toast('Suggested '+flagged.length+' products to reorder','success');
}

function orderUpdateQty(i,v){var q=parseInt(v)||0;if(q<1)q=1;if(_orderDraft[i])_orderDraft[i].qty=q;renderReorder();}
function orderRemoveRow(i){_orderDraft.splice(i,1);renderReorder();}
function orderBackToVendor(){
  if(_orderDraft.length&&!confirm('Discard current draft order?'))return;
  _orderVendor='';_orderDraft=[];_orderNotes='';_orderExpected='';renderReorder();
}

function orderAddManual(){
  var sel=document.getElementById('order-add-prod');if(!sel||!sel.value)return;
  var p=PRODUCTS.find(function(x){return x.id===parseInt(sel.value);});if(!p)return;
  _orderDraft.push({productId:p.id,name:p.name,model:p.model||p.sku||'',brand:p.brand||'',stock:p.stock||0,sold:p.sold||0,reorderPt:p.reorderPt||0,qty:p.reorderQty||1,unitCost:p.cost||0});
  renderReorder();
}

async function createOrderPO(){
  if(!_orderDraft.length){toast('No items in draft order','error');return;}
  var items=_orderDraft.map(function(r){return{productId:r.productId,model:r.model,name:r.name,qtyOrdered:r.qty,qtyReceived:0,unitCost:r.unitCost};});
  var totalCost=items.reduce(function(s,i){return s+i.qtyOrdered*i.unitCost;},0);
  var poId=nextPOId();
  purchaseOrders.unshift({id:poId,vendor:_orderVendor,expectedDate:_orderExpected,notes:_orderNotes,items:items,totalCost:totalCost,date:new Date().toISOString(),status:'Pending',receivedDate:null,receivedBy:null,createdBy:currentEmployee?currentEmployee.name:'Admin'});
  await savePOs();
  toast('PO '+poId+' created for '+_orderVendor,'success');
  // Reset
  _orderVendor='';_orderDraft=[];_orderNotes='';_orderExpected='';
  renderReorder();
}
function reorderAdj(pid,delta){reorderQtys[pid]=(reorderQtys[pid]||0)+delta;if(reorderQtys[pid]<0)reorderQtys[pid]=0;renderReorder();}
function reorderAutoSuggest(){PRODUCTS.forEach(function(p){if((p.stock-(p.sold||0))<=p.reorderPt)reorderQtys[p.id]=p.reorderQty;});renderReorder();toast('Auto-suggested quantities set','success');}
function renderPO(){
  var items=Object.keys(reorderQtys).filter(function(k){return reorderQtys[k]>0;}).map(function(k){var p=PRODUCTS.find(function(x){return x.id===parseInt(k);});return{name:p.name,qty:reorderQtys[k],cost:p.cost};});
  var el=document.getElementById('reorder-po-items');
  el.innerHTML=items.length?items.map(function(i){return '<div class="reorder-po-item"><span>'+i.name+' x'+i.qty+'</span><span>'+fmt(i.cost*i.qty)+'</span></div>';}).join(''):'<div style="color:var(--gray-2);font-size:12px;text-align:center;padding:20px;">No items in draft PO</div>';
  var total=items.reduce(function(s,i){return s+i.cost*i.qty;},0);
  document.getElementById('reorder-po-total').textContent=fmt(total);
}
function renderPOHistory(){
  var el=document.getElementById('po-history-section');if(!el)return;
  var recent=purchaseOrders.slice(0,5);
  if(!recent.length){el.innerHTML='<div class="po-history"><div class="po-history-title">PO History</div><div style="color:var(--gray-2);font-size:11px;text-align:center;padding:10px;">No POs yet</div></div>';return;}
  el.innerHTML='<div class="po-history"><div class="po-history-title">PO History</div>'+recent.map(function(po){
    var sc=po.status==='Pending'?'po-status-pending':'po-status-received';
    return '<div class="po-history-card"><div class="po-history-card-hdr"><span class="po-history-card-id">'+po.id+'</span><span class="po-history-card-status '+sc+'">'+po.status+'</span></div><div class="po-history-card-meta">'+po.vendor+' | '+po.items.length+' items | '+fmt(po.totalCost)+'</div></div>';
  }).join('')+'</div>';
}
function createVendorPO(brand){
  var prods=PRODUCTS.filter(function(p){return p.brand===brand&&(p.stock-(p.sold||0))<=p.reorderPt;});
  if(!prods.length){toast('No low-stock items for '+brand,'info');return;}
  var items=prods.map(function(p){return{productId:p.id,model:p.model||'',name:p.name,qtyOrdered:p.reorderQty,unitCost:p.cost};});
  var totalCost=items.reduce(function(s,i){return s+i.unitCost*i.qtyOrdered;},0);
  var poId='PO-'+String(nextPONum).padStart(4,'0');nextPONum++;
  var po={id:poId,vendor:brand,items:items,totalCost:totalCost,date:new Date().toISOString(),status:'Pending',receivedDate:null,receivedBy:null};
  purchaseOrders.unshift(po);savePOs();
  toast('Created '+poId+' for '+brand+' ('+items.length+' items)','success');
  renderReorder();
}
function submitPO(){
  var itemKeys=Object.keys(reorderQtys).filter(function(k){return reorderQtys[k]>0;});
  if(!itemKeys.length){toast('No items in PO','error');return;}
  // Group draft items by brand
  var byBrand={};
  itemKeys.forEach(function(k){
    var p=PRODUCTS.find(function(x){return x.id===parseInt(k);});
    if(!p)return;if(!byBrand[p.brand])byBrand[p.brand]=[];
    byBrand[p.brand].push({productId:p.id,model:p.model||'',name:p.name,qtyOrdered:reorderQtys[k],unitCost:p.cost});
  });
  var poIds=[];
  Object.keys(byBrand).forEach(function(brand){
    var items=byBrand[brand];
    var totalCost=items.reduce(function(s,i){return s+i.unitCost*i.qtyOrdered;},0);
    var poId='PO-'+String(nextPONum).padStart(4,'0');nextPONum++;
    purchaseOrders.unshift({id:poId,vendor:brand,items:items,totalCost:totalCost,date:new Date().toISOString(),status:'Pending',receivedDate:null,receivedBy:null});
    poIds.push(poId);
  });
  reorderQtys={};savePOs();renderReorder();refreshSaleView();
  toast('Created '+poIds.join(', ')+' - go to Receiving to update stock','success');
}
async function loadPOs(){
  try{
    var res=await fetch('/api/admin-get?key=purchase-orders');var json=await res.json();
    if(json&&json.data){purchaseOrders=json.data.orders||[];nextPONum=json.data.nextNum||1;}
    else{
      // Migrate from old double-prefixed key
      var old=await fetch('/api/admin-get?key=pos-purchase-orders');var oj=await old.json();
      if(oj&&oj.data){purchaseOrders=oj.data.orders||[];nextPONum=oj.data.nextNum||1;await savePOs();console.log('Migrated POs from pos-purchase-orders to purchase-orders');}
    }
  }catch(e){console.error('PO load failed:',e);}
}
async function savePOs(){
  try{await fetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'purchase-orders',data:{orders:purchaseOrders,nextNum:nextPONum}})});}catch(e){console.error('PO save failed:',e);}
}

// ══════════════════════════════════════════════
// PURCHASE ORDERS TAB — new format + new PO creation
// ══════════════════════════════════════════════
var _poView='open'; // 'open' or 'history'
var _poMonthCounters={}; // YYYYMM -> count

function nextPOId(){
  var now=new Date();
  var ym=now.getFullYear()+String(now.getMonth()+1).padStart(2,'0');
  // Find highest existing number for this month
  var existing=purchaseOrders.filter(function(p){return p.id&&p.id.indexOf('PO-'+ym+'-')===0;});
  var maxN=0;
  existing.forEach(function(p){var n=parseInt(p.id.split('-')[2]);if(n>maxN)maxN=n;});
  return 'PO-'+ym+'-'+String(maxN+1).padStart(3,'0');
}

function poSwitchView(v){
  _poView=v;
  document.getElementById('po-tab-open').classList.toggle('active',v==='open');
  document.getElementById('po-tab-history').classList.toggle('active',v==='history');
  var exp=document.getElementById('po-export-csv');if(exp)exp.style.display=v==='history'?'':'none';
  var exp2=document.getElementById('po-export-pdf');if(exp2)exp2.style.display=v==='history'?'':'none';
  renderPOList();
}

function renderPOList(){
  var el=document.getElementById('po-list-content');if(!el)return;
  var q=(document.getElementById('po-search')||{}).value||'';q=q.toLowerCase();
  var list;
  if(_poView==='open'){
    list=purchaseOrders.filter(function(po){return po.status==='Pending'||po.status==='Partially Received'||po.status==='Awaiting Invoice';});
  }else{
    list=purchaseOrders.filter(function(po){return po.status==='Received'||po.status==='Cancelled';});
  }
  if(q)list=list.filter(function(po){return (po.vendor||'').toLowerCase().indexOf(q)>=0||(po.id||'').toLowerCase().indexOf(q)>=0||(po.date||'').indexOf(q)>=0;});
  list.sort(function(a,b){return new Date(b.date)-new Date(a.date);});

  if(!list.length){el.innerHTML='<div style="text-align:center;padding:40px;color:#9ca3af;">No '+(_poView==='open'?'open POs':'PO history')+' yet</div>';return;}

  if(_poView==='open'){
    // Card layout
    el.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:10px;">'+list.map(function(po){
      var statusColor=po.status==='Pending'?'#2563eb':po.status==='Partially Received'?'#ea580c':'#7c3aed';
      var bgColor=po.status==='Pending'?'#dbeafe':po.status==='Partially Received'?'#ffedd5':'#ede9fe';
      return '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px;">'
        +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">'
        +'<div><div style="font-size:13px;font-weight:700;color:#1f2937;">'+po.id+'</div><div style="font-size:12px;color:#6b7280;">'+(po.vendor||'—')+'</div></div>'
        +'<span style="font-size:9px;font-weight:700;padding:3px 8px;border-radius:100px;background:'+bgColor+';color:'+statusColor+';">'+po.status+'</span>'
        +'</div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;color:#4b5563;margin-bottom:8px;">'
        +'<div><span style="color:#9ca3af;">Created:</span> '+new Date(po.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})+'</div>'
        +'<div><span style="color:#9ca3af;">Expected:</span> '+(po.expectedDate?new Date(po.expectedDate+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}):'—')+'</div>'
        +'<div><span style="color:#9ca3af;">Items:</span> '+(po.items||[]).length+'</div>'
        +'<div style="font-weight:700;color:#1f2937;"><span style="color:#9ca3af;font-weight:400;">Total:</span> '+fmt(po.totalCost||0)+'</div>'
        +'</div>'
        +'<div style="display:flex;gap:4px;flex-wrap:wrap;">'
        +'<button class="ghost-btn" style="flex:1;min-width:60px;font-size:10px;padding:5px 6px;border-color:#86efac;color:#16a34a;" onclick="poReceive(\''+po.id+'\')">Receive</button>'
        +'<button class="ghost-btn" style="flex:1;min-width:50px;font-size:10px;padding:5px 6px;" onclick="poEdit(\''+po.id+'\')">Edit</button>'
        +'<button class="ghost-btn" style="flex:1;min-width:50px;font-size:10px;padding:5px 6px;" onclick="printPO(\''+po.id+'\')">Print</button>'
        +'<button class="ghost-btn" style="flex:1;min-width:60px;font-size:10px;padding:5px 6px;border-color:#c4b5fd;color:#6d28d9;" onclick="poEmailVendor(\''+po.id+'\')">&#x2709; Email</button>'
        +'<button class="ghost-btn" style="flex:1;min-width:50px;font-size:10px;padding:5px 6px;border-color:#fca5a5;color:#dc2626;" onclick="poCancel(\''+po.id+'\')">Cancel</button>'
        +'</div></div>';
    }).join('')+'</div>';
  }else{
    // Table
    var h='<table class="admin-table" style="font-size:11px;"><thead><tr><th>PO #</th><th>Vendor</th><th>Created</th><th>Received</th><th style="text-align:center;">Items</th><th style="text-align:right;">Total</th><th>Status</th><th style="width:80px;"></th></tr></thead><tbody>';
    list.forEach(function(po){
      var sc=po.status==='Received'?'#dcfce7':'#fee2e2';
      var stc=po.status==='Received'?'#16a34a':'#dc2626';
      h+='<tr><td style="font-weight:600;">'+po.id+'</td><td>'+(po.vendor||'—')+'</td><td>'+new Date(po.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+'</td><td>'+(po.receivedDate?new Date(po.receivedDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—')+'</td><td style="text-align:center;">'+((po.items||[]).length)+'</td><td style="text-align:right;font-weight:600;">'+fmt(po.totalCost||0)+'</td><td><span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:100px;background:'+sc+';color:'+stc+';">'+po.status+'</span></td><td><button class="admin-card-btn edit" onclick="poViewReadOnly(\''+po.id+'\')">View</button></td></tr>';
    });
    h+='</tbody></table>';
    el.innerHTML=h;
  }
}

// ═══ PO CREATE / EDIT ═══
function openNewPO(){
  document.getElementById('po-edit-id').value='';
  document.getElementById('po-modal-title').textContent='New Purchase Order';
  document.getElementById('po-vendor').value='';
  document.getElementById('po-expected').value='';
  document.getElementById('po-notes').value='';
  // Populate vendor dropdown
  var sel=document.getElementById('po-vendor');sel.innerHTML='<option value="">Select...</option>';
  (typeof adminVendors!=='undefined'?adminVendors:[]).forEach(function(v){sel.innerHTML+='<option value="'+v.name+'">'+v.name+'</option>';});
  // Clear items + add one blank row
  document.getElementById('po-items-list').innerHTML='';
  poAddItemRow();
  poUpdateTotal();
  openModal('po-modal');
}

function poEdit(id){
  var po=purchaseOrders.find(function(p){return p.id===id;});if(!po)return;
  openNewPO();
  document.getElementById('po-edit-id').value=id;
  document.getElementById('po-modal-title').textContent='Edit PO '+id;
  document.getElementById('po-vendor').value=po.vendor||'';
  document.getElementById('po-expected').value=po.expectedDate||'';
  document.getElementById('po-notes').value=po.notes||'';
  document.getElementById('po-items-list').innerHTML='';
  (po.items||[]).forEach(function(it){poAddItemRow(it);});
  poUpdateTotal();
}

function poAddItemRow(prefill){
  var list=document.getElementById('po-items-list');
  var idx=list.children.length;
  var row=document.createElement('div');
  row.style.cssText='display:grid;grid-template-columns:1fr 60px 90px 100px 28px;gap:6px;align-items:center;margin-bottom:6px;';
  row.innerHTML='<select class="sel po-item-prod" onchange="poItemProdChange(this)" style="font-size:11px;padding:6px 8px;"><option value="">Select product...</option></select>'
    +'<input class="inp po-item-qty" type="number" value="'+(prefill?prefill.qtyOrdered:1)+'" min="1" oninput="poUpdateTotal()" style="font-size:11px;padding:6px 8px;text-align:center;"/>'
    +'<input class="inp po-item-cost" type="number" step="0.01" value="'+(prefill?prefill.unitCost:0)+'" oninput="poUpdateTotal()" style="font-size:11px;padding:6px 8px;text-align:right;"/>'
    +'<div class="po-item-ext" style="font-size:11px;text-align:right;font-weight:600;">$0.00</div>'
    +'<button class="ghost-btn" onclick="this.parentElement.remove();poUpdateTotal();" style="padding:4px 8px;font-size:14px;">&#x2715;</button>';
  list.appendChild(row);
  // Populate product dropdown
  var sel=row.querySelector('.po-item-prod');
  PRODUCTS.filter(function(p){return p.active!==false;}).forEach(function(p){
    var opt=document.createElement('option');
    opt.value=p.id;opt.textContent=(p.model||p.sku||'')+' — '+p.name;
    opt.dataset.cost=p.cost||0;opt.dataset.model=p.model||p.sku||'';opt.dataset.name=p.name;
    sel.appendChild(opt);
  });
  if(prefill&&prefill.productId){sel.value=prefill.productId;}
  poUpdateTotal();
}

function poItemProdChange(sel){
  var row=sel.parentElement;
  var opt=sel.options[sel.selectedIndex];
  if(opt&&opt.dataset.cost){row.querySelector('.po-item-cost').value=opt.dataset.cost;}
  poUpdateTotal();
}

function poUpdateTotal(){
  var total=0;
  document.querySelectorAll('#po-items-list > div').forEach(function(row){
    var q=parseFloat(row.querySelector('.po-item-qty').value)||0;
    var c=parseFloat(row.querySelector('.po-item-cost').value)||0;
    var ext=q*c;total+=ext;
    row.querySelector('.po-item-ext').textContent=fmt(ext);
  });
  document.getElementById('po-total').textContent=fmt(total);
}

function collectPOFromForm(){
  var vendor=document.getElementById('po-vendor').value;
  if(!vendor){toast('Select a vendor','error');return null;}
  var items=[];
  document.querySelectorAll('#po-items-list > div').forEach(function(row){
    var sel=row.querySelector('.po-item-prod');
    var prodId=parseInt(sel.value);if(!prodId)return;
    var opt=sel.options[sel.selectedIndex];
    var qty=parseInt(row.querySelector('.po-item-qty').value)||1;
    var cost=parseFloat(row.querySelector('.po-item-cost').value)||0;
    items.push({productId:prodId,model:opt.dataset.model||'',name:opt.dataset.name||'',qtyOrdered:qty,qtyReceived:0,unitCost:cost});
  });
  if(!items.length){toast('Add at least one item','error');return null;}
  var totalCost=items.reduce(function(s,i){return s+i.qtyOrdered*i.unitCost;},0);
  return{vendor:vendor,expectedDate:document.getElementById('po-expected').value||'',notes:document.getElementById('po-notes').value.trim(),items:items,totalCost:totalCost};
}

async function savePOFromModal(){
  var data=collectPOFromForm();if(!data)return;
  var editId=document.getElementById('po-edit-id').value;
  if(editId){
    var po=purchaseOrders.find(function(p){return p.id===editId;});if(!po)return;
    po.vendor=data.vendor;po.expectedDate=data.expectedDate;po.notes=data.notes;po.items=data.items;po.totalCost=data.totalCost;
    toast('PO '+editId+' updated','success');
  }else{
    var poId=nextPOId();
    purchaseOrders.unshift({id:poId,vendor:data.vendor,expectedDate:data.expectedDate,notes:data.notes,items:data.items,totalCost:data.totalCost,date:new Date().toISOString(),status:'Pending',receivedDate:null,receivedBy:null,createdBy:currentEmployee?currentEmployee.name:'Admin'});
    toast('PO '+poId+' created','success');
  }
  await savePOs();closeModal('po-modal');renderPOList();
}

async function savePOAndPrint(){
  await savePOFromModal();
  // Print the most recent PO
  var po=purchaseOrders[0];if(po)printPO(po.id);
}

function poCancel(id){
  if(!confirm('Cancel PO '+id+'? This cannot be undone.'))return;
  var po=purchaseOrders.find(function(p){return p.id===id;});if(!po)return;
  po.status='Cancelled';po.cancelledAt=new Date().toISOString();po.cancelledBy=currentEmployee?currentEmployee.name:'Admin';
  savePOs();renderPOList();toast('PO cancelled','info');
}

function poReceive(id){
  // Switch to Receive Inventory sub-tab and select this PO
  switchInvTab('receiving');
  setTimeout(function(){recvSelectPO(id);},100);
}

function poViewReadOnly(id){
  var po=purchaseOrders.find(function(p){return p.id===id;});if(!po)return;
  var vendor=(typeof adminVendors!=='undefined'?adminVendors:[]).find(function(v){return v.name===po.vendor;})||{};
  var win=window.open('','_blank','width=800,height=900');
  var itemRows=(po.items||[]).map(function(it){var ext=(it.qtyOrdered||0)*(it.unitCost||0);return '<tr><td>'+(it.model||'')+'</td><td>'+it.name+'</td><td style="text-align:center;">'+it.qtyOrdered+'</td><td style="text-align:right;">$'+(it.unitCost||0).toFixed(2)+'</td><td style="text-align:right;font-weight:700;">$'+ext.toFixed(2)+'</td></tr>';}).join('');
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>PO '+po.id+'</title><style>*{box-sizing:border-box;margin:0;padding:0;font-family:Arial,sans-serif;}body{padding:24px;font-size:12px;color:#111;}.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:16px;}.top-left img{max-width:200px;max-height:70px;}.top-left .store{font-size:10px;color:#333;margin-top:6px;line-height:1.4;}.top-right{text-align:right;}.top-right h1{font-size:26px;font-weight:800;letter-spacing:2px;margin-bottom:6px;}.top-right .meta{font-size:11px;color:#333;}.top-right .meta strong{font-size:13px;}.vendor-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;margin-bottom:14px;}.vendor-box .lbl{font-size:9px;font-weight:700;text-transform:uppercase;color:#6b7280;margin-bottom:4px;}.vendor-box .v-name{font-size:14px;font-weight:700;margin-bottom:2px;}.vendor-box .v-line{font-size:11px;color:#4b5563;line-height:1.4;}table{width:100%;border-collapse:collapse;margin-bottom:12px;}th{background:#222;color:#fff;font-size:10px;padding:7px 10px;text-align:left;text-transform:uppercase;}td{padding:8px 10px;border-bottom:1px solid #ddd;font-size:11px;}.total-row{display:flex;justify-content:flex-end;margin-bottom:12px;}.total-box{background:#eee;padding:8px 18px;border-radius:6px;font-size:16px;font-weight:800;}.notes{margin-top:10px;padding:10px 14px;background:#fffbeb;border-left:4px solid #eab308;font-size:11px;border-radius:4px;}.sig-block{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:40px;}.sig-line{border-bottom:1.5px solid #000;height:22px;margin-bottom:4px;}.sig-label{font-size:10px;color:#666;text-transform:uppercase;letter-spacing:0.05em;}@media print{@page{margin:12mm;size:letter;}body{padding:0;}}</style></head><body>';
  // Header
  var cs=(typeof currentStore!=='undefined'?currentStore:{});
  var csName=cs.store_name||'DC Appliance';
  var csAddr=(cs.address||'2610 Central Ave')+', '+(cs.city||'Dodge City')+', '+(cs.state||'KS')+' '+(cs.zip||'67801');
  var csPhone=cs.phone||'620-371-6417';
  html+='<div class="top"><div class="top-left"><img src="'+(window.DC_APPLIANCE_LOGO||'')+'" onerror="this.style.display=\'none\'" alt="'+csName+'"/><div class="store">'+csName+'<br/>'+csAddr+'<br/>'+csPhone+'</div></div>';
  html+='<div class="top-right"><h1>PURCHASE ORDER</h1><div class="meta"><strong>'+po.id+'</strong><br/>Created: '+new Date(po.date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})+'<br/>Expected: '+(po.expectedDate?new Date(po.expectedDate+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}):'—')+'<br/>Status: '+po.status+'</div></div></div>';
  // Vendor box
  html+='<div class="vendor-box"><div class="lbl">Vendor</div><div class="v-name">'+po.vendor+'</div>';
  if(vendor.repName)html+='<div class="v-line">Rep: '+vendor.repName+'</div>';
  if(vendor.phone)html+='<div class="v-line">Phone: '+vendor.phone+'</div>';
  if(vendor.email)html+='<div class="v-line">Email: '+vendor.email+'</div>';
  if(vendor.accountNum)html+='<div class="v-line">Account #: '+vendor.accountNum+'</div>';
  if(vendor.paymentTerms)html+='<div class="v-line">Terms: '+vendor.paymentTerms+'</div>';
  html+='</div>';
  // Items table
  html+='<table><thead><tr><th style="width:16%;">Model #</th><th>Description</th><th style="width:10%;text-align:center;">Qty Ordered</th><th style="width:12%;text-align:right;">Unit Cost</th><th style="width:14%;text-align:right;">Extended Cost</th></tr></thead><tbody>'+itemRows+'</tbody></table>';
  html+='<div class="total-row"><div class="total-box">Total: $'+(po.totalCost||0).toFixed(2)+'</div></div>';
  if(po.notes)html+='<div class="notes"><strong>Notes:</strong> '+po.notes+'</div>';
  // Signature lines
  html+='<div class="sig-block"><div><div class="sig-line"></div><div class="sig-label">Received By</div></div><div><div class="sig-line"></div><div class="sig-label">Date</div></div></div>';
  html+='</body></html>';
  win.document.write(html);win.document.close();
}

function printPO(id){poViewReadOnly(id);setTimeout(function(){try{window.focus();}catch(e){}},300);}

async function poEmailVendor(id){
  var po=purchaseOrders.find(function(p){return p.id===id;});if(!po)return;
  var vendor=(typeof adminVendors!=='undefined'?adminVendors:[]).find(function(v){return v.name===po.vendor;});
  var toEmail=vendor&&vendor.email?vendor.email:'';
  if(!toEmail){
    toEmail=prompt('Enter vendor email address:','');
    if(!toEmail||!toEmail.includes('@'))return;
  }
  if(!confirm('Send PO '+po.id+' to '+toEmail+'?'))return;
  // Build email HTML
  var itemRows=(po.items||[]).map(function(it){var ext=(it.qtyOrdered||0)*(it.unitCost||0);return '<tr><td style="padding:8px 10px;border-bottom:1px solid #eee;">'+(it.model||'')+'</td><td style="padding:8px 10px;border-bottom:1px solid #eee;">'+it.name+'</td><td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;">'+it.qtyOrdered+'</td><td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;">$'+(it.unitCost||0).toFixed(2)+'</td><td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:700;">$'+ext.toFixed(2)+'</td></tr>';}).join('');
  var html='<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">'
    +'<div style="max-width:700px;margin:0 auto;background:#fff;">'
    +'<div style="background:#1a2744;padding:20px 28px;color:#fff;"><h1 style="margin:0;font-size:24px;letter-spacing:2px;">PURCHASE ORDER</h1><p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">'+po.id+' &middot; '+new Date(po.date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})+'</p></div>'
    +'<div style="padding:24px 28px;">'
    +'<p style="font-size:14px;color:#1f2937;">Hi'+(vendor&&vendor.repName?' '+vendor.repName:'')+',</p>'
    +'<p style="font-size:13px;color:#4b5563;line-height:1.6;">Please process the following purchase order for DC Appliance:</p>'
    +'<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin:16px 0;font-size:12px;">'
    +'<p style="margin:0 0 4px;"><strong>PO #:</strong> '+po.id+'</p>'
    +'<p style="margin:0 0 4px;"><strong>Vendor:</strong> '+po.vendor+'</p>'
    +(vendor&&vendor.accountNum?'<p style="margin:0 0 4px;"><strong>Account #:</strong> '+vendor.accountNum+'</p>':'')
    +'<p style="margin:0;"><strong>Expected Delivery:</strong> '+(po.expectedDate||'—')+'</p>'
    +'</div>'
    +'<table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;">'
    +'<thead><tr><th style="padding:8px 10px;background:#f8fafc;text-align:left;font-size:10px;color:#6b7280;">MODEL #</th><th style="padding:8px 10px;background:#f8fafc;text-align:left;font-size:10px;color:#6b7280;">DESCRIPTION</th><th style="padding:8px 10px;background:#f8fafc;text-align:center;font-size:10px;color:#6b7280;">QTY</th><th style="padding:8px 10px;background:#f8fafc;text-align:right;font-size:10px;color:#6b7280;">UNIT COST</th><th style="padding:8px 10px;background:#f8fafc;text-align:right;font-size:10px;color:#6b7280;">EXT. COST</th></tr></thead>'
    +'<tbody>'+itemRows+'</tbody></table>'
    +'<div style="text-align:right;font-size:16px;font-weight:700;margin-top:14px;">Total: $'+(po.totalCost||0).toFixed(2)+'</div>'
    +(po.notes?'<div style="margin-top:14px;padding:12px 16px;background:#fffbeb;border-left:4px solid #f59e0b;font-size:12px;"><strong>Notes:</strong> '+po.notes+'</div>':'')
    +'<p style="font-size:13px;color:#4b5563;margin-top:24px;">Please confirm receipt of this PO. Contact me with any questions.</p>'
    +'<p style="font-size:13px;color:#1f2937;font-weight:600;">Thank you!<br/>'+(cs.store_name||'DC Appliance')+'<br/>'+csPhone+'</p>'
    +'</div></div></body></html>';
  toast('Sending PO email...','info');
  var res=await sendDcEmail(toEmail,vendor?vendor.name:po.vendor,'Purchase Order '+po.id+' — DC Appliance',html);
  if(res.ok){
    if(!po.emailLog)po.emailLog=[];
    po.emailLog.push({ts:new Date().toISOString(),to:toEmail,type:'po_vendor',by:currentEmployee?currentEmployee.name:'Admin'});
    await savePOs();
    toast('PO emailed to '+toEmail,'success');
  }else{toast('Failed: '+(res.error||'Unknown error'),'error');}
}

function exportPOHistoryCSV(){
  var list=purchaseOrders.filter(function(p){return p.status==='Received'||p.status==='Cancelled';});
  if(!list.length){toast('No history to export','error');return;}
  var csv='PO#,Vendor,Created,Received,Items,Total,Status\n';
  list.forEach(function(po){csv+='"'+po.id+'","'+(po.vendor||'')+'","'+po.date.slice(0,10)+'","'+(po.receivedDate?po.receivedDate.slice(0,10):'')+'",'+((po.items||[]).length)+','+(po.totalCost||0).toFixed(2)+',"'+po.status+'"\n';});
  var blob=new Blob([csv],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='po-history.csv';a.click();
  toast('CSV exported','success');
}

function exportPOHistoryPDF(){
  var list=purchaseOrders.filter(function(p){return p.status==='Received'||p.status==='Cancelled';});
  if(!list.length){toast('No history to export','error');return;}
  var win=window.open('','_blank');
  var total=list.reduce(function(s,p){return s+(p.totalCost||0);},0);
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>PO History</title><style>*{box-sizing:border-box;margin:0;padding:0;font-family:Arial,sans-serif;}body{padding:16px;font-size:11px;}.hdr{text-align:center;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:14px;}.hdr img{max-width:180px;margin-bottom:6px;}table{width:100%;border-collapse:collapse;}th{background:#222;color:#fff;font-size:10px;padding:6px 8px;text-align:left;}td{padding:6px 8px;border-bottom:1px solid #ddd;}.total{text-align:right;font-weight:700;font-size:13px;margin-top:12px;}@media print{@page{margin:10mm;}}</style></head><body>';
  html+='<div class="hdr"><img src="'+(window.DC_APPLIANCE_LOGO||'')+'" onerror="this.style.display=\'none\'"/><h1 style="font-size:16px;">DC Appliance — PO History</h1><div style="font-size:10px;color:#666;">'+new Date().toLocaleDateString()+'</div></div>';
  html+='<table><thead><tr><th>PO#</th><th>Vendor</th><th>Created</th><th>Received</th><th style="text-align:center;">Items</th><th style="text-align:right;">Total</th><th>Status</th></tr></thead><tbody>';
  list.forEach(function(po){html+='<tr><td>'+po.id+'</td><td>'+(po.vendor||'')+'</td><td>'+po.date.slice(0,10)+'</td><td>'+(po.receivedDate?po.receivedDate.slice(0,10):'')+'</td><td style="text-align:center;">'+((po.items||[]).length)+'</td><td style="text-align:right;">$'+(po.totalCost||0).toFixed(2)+'</td><td>'+po.status+'</td></tr>';});
  html+='</tbody></table><div class="total">Total: $'+total.toFixed(2)+'</div></body></html>';
  win.document.write(html);win.document.close();setTimeout(function(){win.print();},400);
}

// ══════════════════════════════════════════════
// RECEIVING TAB
// ══════════════════════════════════════════════
function renderReceiving(){renderRecvList();if(selectedPO)renderRecvDetail();}
function recvSetFilter(f,btn){
  recvFilter=f;
  document.querySelectorAll('.recv-fpill').forEach(function(b){b.classList.remove('active');});
  if(btn)btn.classList.add('active');
  selectedPO=null;renderReceiving();
  document.getElementById('recv-right').innerHTML='<div class="recv-right-empty">Select a PO to view details</div>';
}
function renderRecvList(){
  var filtered=purchaseOrders.filter(function(po){return recvFilter==='pending'?po.status==='Pending':po.status==='Received';});
  var el=document.getElementById('recv-list');
  if(!filtered.length){el.innerHTML='<div style="text-align:center;color:var(--gray-2);padding:30px;font-size:12px;">No '+(recvFilter==='pending'?'pending':'received')+' POs</div>';return;}
  el.innerHTML=filtered.map(function(po){
    var sc=po.status==='Pending'?'po-status-pending':'po-status-received';
    return '<div class="recv-po-card'+(selectedPO&&selectedPO.id===po.id?' active':'')+'" onclick="recvSelectPO(\''+po.id+'\')"><div class="recv-po-card-hdr"><span class="recv-po-card-id">'+po.id+'</span><span class="po-history-card-status '+sc+'">'+po.status+'</span></div><div class="recv-po-card-vendor">'+po.vendor+'</div><div class="recv-po-card-row"><span>'+po.items.length+' items | '+new Date(po.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})+'</span><span class="recv-po-card-cost">'+fmt(po.totalCost)+'</span></div></div>';
  }).join('');
}
function recvSelectPO(id){
  selectedPO=purchaseOrders.find(function(po){return po.id===id;})||null;
  if(selectedPO){recvQtys={};selectedPO.items.forEach(function(it){recvQtys[it.productId]=it.qtyReceived||0;});}
  renderRecvList();renderRecvDetail();
}
function renderRecvDetail(){
  var el=document.getElementById('recv-right');
  if(!selectedPO){el.innerHTML='<div class="recv-right-empty">Select a PO to view details</div>';return;}
  var po=selectedPO;
  var hdr='<div class="recv-detail-hdr"><div class="recv-detail-title">'+po.id+' - '+po.vendor+'</div><div class="recv-detail-meta">Created '+new Date(po.date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})+' | Status: '+po.status+(po.receivedDate?' | Received: '+new Date(po.receivedDate).toLocaleDateString():'')+'</div></div>';
  var body='<div class="recv-detail-body">';
  if(po.status==='Pending'){
    body+='<div class="recv-dropzone" id="recv-dropzone" ondragover="event.preventDefault();this.classList.add(\'drag-over\')" ondragleave="this.classList.remove(\'drag-over\')" ondrop="recvHandleSlipDrop(event)"><input type="file" accept="image/*,.pdf" onchange="recvHandleSlip(this.files[0])"/><div style="font-size:12px;font-weight:600;color:var(--gold);">Drop packing slip / invoice</div><div style="font-size:10px;color:var(--gray-2);margin-top:2px;">PDF or image - AI extracts received quantities</div><div class="recv-loading" id="recv-loading">Processing packing slip...</div></div>';
  }
  body+='<div style="overflow:auto;"><table class="recv-table"><thead><tr><th>Model#</th><th>Description</th><th>Ordered</th><th>Received</th><th>Backorder</th><th>Unit Cost</th><th>Total Cost</th><th>Status</th></tr></thead><tbody>';
  po.items.forEach(function(it){
    var recv=recvQtys[it.productId]||0;
    var back=Math.max(0,it.qtyOrdered-recv);
    var icon=recv>=it.qtyOrdered?'&#x2705;':recv>0?'&#x26A0;&#xFE0F;':'&#x274C;';
    var disabled=po.status==='Received'?'disabled':'';
    body+='<tr><td>'+(it.model?'<a class="pc-link" onclick="openProductCardByModel(\''+it.model.replace(/'/g,"\\'")+'\')">'+it.model+'</a>':'')+'</td><td>'+it.name+'</td><td style="text-align:center;">'+it.qtyOrdered+'</td><td><input type="number" class="recv-qty-inp" value="'+recv+'" min="0" max="'+it.qtyOrdered+'" onchange="recvSetQty('+it.productId+',parseInt(this.value)||0)" '+disabled+'/></td><td style="text-align:center;">'+back+'</td><td>'+fmt(it.unitCost)+'</td><td>'+fmt(it.unitCost*it.qtyOrdered)+'</td><td style="text-align:center;">'+icon+'</td></tr>';
  });
  body+='</tbody></table></div>';
  var totalOrdered=po.items.reduce(function(s,i){return s+i.unitCost*i.qtyOrdered;},0);
  body+='<div style="display:flex;justify-content:space-between;margin-top:10px;font-size:13px;font-weight:700;color:var(--gold);padding:8px 0;border-top:1px solid var(--border);"><span>Total</span><span>'+fmt(totalOrdered)+'</span></div>';
  if(po.status==='Pending'){
    body+='<button class="recv-complete-btn" onclick="recvComplete()">Complete Receiving</button>';
  }
  body+='</div>';
  el.innerHTML=hdr+body;
}
function recvSetQty(productId,qty){recvQtys[productId]=Math.max(0,qty);renderRecvDetail();}
function recvHandleSlipDrop(e){e.preventDefault();document.getElementById('recv-dropzone').classList.remove('drag-over');if(e.dataTransfer.files.length)recvHandleSlip(e.dataTransfer.files[0]);}
async function recvHandleSlip(file){
  if(!file||!selectedPO)return;
  document.getElementById('recv-loading').style.display='block';
  try{
    var b64=await toB64(file);
    var itemList=selectedPO.items.map(function(it){return (it.model||'')+': '+it.name+' (ordered: '+it.qtyOrdered+')';}).join(', ');
    var msgs=[{role:'user',content:[{type:file.type==='application/pdf'?'document':'image',source:{type:'base64',media_type:file.type,data:b64}},{type:'text',text:'Extract received quantities from this packing slip/invoice. Match to these PO items: '+itemList+'. Return JSON only: {"received":[{"model":"MODEL#","qty":NUMBER}]}'}]}];
    var data=await claudeApiCall({messages:msgs,max_tokens:600});
    var parsed=JSON.parse(data.content[0].text.match(/\{[\s\S]*\}/)[0]);
    if(parsed.received){
      parsed.received.forEach(function(r){
        var item=selectedPO.items.find(function(it){return it.model===r.model||it.model===r.sku;});
        if(item)recvQtys[item.productId]=Math.min(r.qty,item.qtyOrdered);
      });
      renderRecvDetail();toast('Packing slip processed','success');
    }
  }catch(e){toast('Could not read slip: '+e.message,'error');}
  finally{var rl=document.getElementById('recv-loading');if(rl)rl.style.display='none';}
}
// ═══ AI AUTO-RECEIVE (drag-drop invoice reader) ═══
var _recvAiParsed=null;

function recvAiHandleDrop(e){
  e.preventDefault();
  var dz=document.getElementById('recv-ai-dropzone');
  if(dz){dz.style.borderColor='#bfdbfe';dz.style.background='#eff6ff';}
  if(e.dataTransfer.files.length)recvAiHandleFile(e.dataTransfer.files[0]);
}

async function recvAiHandleFile(file){
  if(!file)return;
  document.getElementById('recv-ai-loading').style.display='block';
  document.getElementById('recv-ai-preview').style.display='none';
  try{
    var b64=await toB64(file);
    var contentType=file.type==='application/pdf'?'document':'image';
    if(file.name.match(/\.(csv|xlsx|xls)$/i))contentType='document';
    var msgs=[{role:'user',content:[
      {type:contentType,source:{type:'base64',media_type:file.type||'application/octet-stream',data:b64}},
      {type:'text',text:'Extract all items from this vendor invoice/packing list. Return JSON only: {"vendor":"Vendor Name","poNumber":"PO#IfReferenced","invoiceDate":"YYYY-MM-DD","items":[{"model":"MODEL#","description":"Product Name","qty":1,"unitCost":0,"serials":["SN1","SN2"]}]}. Include ALL serial numbers found. If a field is missing use empty string. JSON only, no explanation.'}
    ]}];
    var data=await claudeApiCall({messages:msgs,max_tokens:2000});
    var match=data.content[0].text.match(/\{[\s\S]*\}/);
    if(!match)throw new Error('Could not parse AI response');
    var parsed=JSON.parse(match[0]);
    // Try to match PO
    var matchedPO=null;
    if(parsed.poNumber){
      matchedPO=purchaseOrders.find(function(po){return po.id.toLowerCase().indexOf(parsed.poNumber.toLowerCase())>=0||parsed.poNumber.toLowerCase().indexOf(po.id.toLowerCase())>=0;});
    }
    if(!matchedPO&&parsed.vendor){
      var openPOs=purchaseOrders.filter(function(po){return (po.status==='Pending'||po.status==='Partially Received')&&po.vendor&&po.vendor.toLowerCase()===parsed.vendor.toLowerCase();});
      if(openPOs.length===1)matchedPO=openPOs[0];
    }
    _recvAiParsed={data:parsed,matchedPO:matchedPO};
    recvAiShowPreview();
  }catch(e){
    document.getElementById('recv-ai-preview').innerHTML='<div style="padding:12px 16px;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;color:#991b1b;font-size:12px;">Could not read invoice: '+e.message+'</div>';
    document.getElementById('recv-ai-preview').style.display='block';
  }
  document.getElementById('recv-ai-loading').style.display='none';
}

function recvAiShowPreview(){
  var p=_recvAiParsed.data;var linkedPO=_recvAiParsed.matchedPO;
  var vendorOpts=(typeof adminVendors!=='undefined'?adminVendors:[]).sort(function(a,b){return a.name.localeCompare(b.name);}).map(function(v){return '<option value="'+v.name+'"'+(v.name.toLowerCase()===(p.vendor||'').toLowerCase()?' selected':'')+'>'+v.name+'</option>';}).join('');
  var poOpts=purchaseOrders.filter(function(po){return po.status==='Pending'||po.status==='Partially Received';}).map(function(po){return '<option value="'+po.id+'"'+(linkedPO&&linkedPO.id===po.id?' selected':'')+'>'+po.id+' — '+po.vendor+'</option>';}).join('');

  var h='<div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px;">';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;">';
  h+='<div style="font-size:13px;font-weight:700;color:#1f2937;">Review Extracted Invoice</div>';
  if(linkedPO)h+='<span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:100px;background:#dcfce7;color:#16a34a;">&#x2713; Matched to '+linkedPO.id+'</span>';
  h+='<button class="ghost-btn" style="margin-left:auto;font-size:10px;padding:4px 10px;" onclick="recvAiCancel()">Cancel</button>';
  h+='</div>';
  h+='<div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;margin-bottom:10px;">';
  h+='<div><label style="font-size:9px;font-weight:700;text-transform:uppercase;color:#6b7280;">Vendor</label><select id="recv-ai-vendor" class="sel" style="font-size:11px;"><option value="">Select...</option>'+vendorOpts+'</select></div>';
  h+='<div><label style="font-size:9px;font-weight:700;text-transform:uppercase;color:#6b7280;">Link to PO</label><select id="recv-ai-po" class="sel" style="font-size:11px;"><option value="">None</option>'+poOpts+'</select></div>';
  h+='<div><label style="font-size:9px;font-weight:700;text-transform:uppercase;color:#6b7280;">Invoice Date</label><input id="recv-ai-date" class="inp" type="date" value="'+(p.invoiceDate||'')+'" style="font-size:11px;"/></div>';
  h+='</div>';
  // Items table
  h+='<div style="max-height:400px;overflow:auto;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:10px;"><table class="admin-table" style="font-size:10px;margin:0;"><thead><tr><th>Model #</th><th>Description</th><th style="width:60px;">Qty</th><th style="width:80px;">Unit Cost</th><th>Serials</th><th style="width:80px;">Match</th></tr></thead><tbody>';
  (p.items||[]).forEach(function(it,i){
    var prod=PRODUCTS.find(function(x){return (x.model||'').toLowerCase()===(it.model||'').toLowerCase()||(x.sku||'').toLowerCase()===(it.model||'').toLowerCase();});
    var statusBadge=prod?'<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;background:#dcfce7;color:#16a34a;">Matched</span>':'<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;background:#fee2e2;color:#dc2626;">Not Found</span>';
    var serialStr=(it.serials||[]).join(', ');
    h+='<tr'+(!prod?' style="background:#fef2f2;"':'')+'>';
    h+='<td><input class="inp recv-ai-model" data-idx="'+i+'" value="'+(it.model||'')+'" style="font-size:10px;padding:4px 6px;width:100%;" oninput="recvAiRematch('+i+')"/></td>';
    h+='<td><input class="inp recv-ai-desc" data-idx="'+i+'" value="'+(it.description||'').replace(/"/g,'&quot;')+'" style="font-size:10px;padding:4px 6px;width:100%;"/></td>';
    h+='<td><input class="inp recv-ai-qty" data-idx="'+i+'" type="number" min="0" value="'+(it.qty||0)+'" style="font-size:10px;padding:4px 6px;width:50px;text-align:center;"/></td>';
    h+='<td><input class="inp recv-ai-cost" data-idx="'+i+'" type="number" step="0.01" value="'+(it.unitCost||0)+'" style="font-size:10px;padding:4px 6px;width:70px;text-align:right;"/></td>';
    h+='<td><input class="inp recv-ai-serials" data-idx="'+i+'" value="'+serialStr+'" placeholder="SN1, SN2..." style="font-size:10px;padding:4px 6px;width:100%;"/></td>';
    h+='<td id="recv-ai-match-'+i+'">'+statusBadge+'</td>';
    h+='</tr>';
  });
  h+='</tbody></table></div>';
  var total=(p.items||[]).reduce(function(s,it){return s+(it.qty||0)*(it.unitCost||0);},0);
  h+='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">';
  h+='<div style="font-size:14px;font-weight:700;">Total: '+fmt(total)+'</div>';
  h+='<div style="display:flex;gap:6px;"><button class="ghost-btn" onclick="recvAiCancel()">Cancel</button><button class="primary-btn" onclick="recvAiConfirm()">Confirm &amp; Receive</button></div>';
  h+='</div>';
  h+='</div>';
  document.getElementById('recv-ai-preview').innerHTML=h;
  document.getElementById('recv-ai-preview').style.display='block';
}

function recvAiRematch(i){
  var model=document.querySelector('.recv-ai-model[data-idx="'+i+'"]').value;
  var prod=PRODUCTS.find(function(x){return (x.model||'').toLowerCase()===model.toLowerCase()||(x.sku||'').toLowerCase()===model.toLowerCase();});
  var el=document.getElementById('recv-ai-match-'+i);
  if(prod)el.innerHTML='<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;background:#dcfce7;color:#16a34a;">Matched</span>';
  else el.innerHTML='<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;background:#fee2e2;color:#dc2626;">Not Found</span>';
}

function recvAiCancel(){_recvAiParsed=null;document.getElementById('recv-ai-preview').style.display='none';document.getElementById('recv-ai-preview').innerHTML='';}

async function recvAiConfirm(){
  if(!_recvAiParsed)return;
  var poId=(document.getElementById('recv-ai-po')||{}).value||'';
  var vendorName=(document.getElementById('recv-ai-vendor')||{}).value||'';
  var linkedPO=poId?purchaseOrders.find(function(po){return po.id===poId;}):null;
  var updated=0,notFound=0,serialsAdded=0;
  // Read current form values
  var items=[];
  document.querySelectorAll('.recv-ai-model').forEach(function(el){
    var i=parseInt(el.dataset.idx);
    var model=el.value.trim();
    var desc=(document.querySelector('.recv-ai-desc[data-idx="'+i+'"]')||{}).value||'';
    var qty=parseInt((document.querySelector('.recv-ai-qty[data-idx="'+i+'"]')||{}).value)||0;
    var cost=parseFloat((document.querySelector('.recv-ai-cost[data-idx="'+i+'"]')||{}).value)||0;
    var snStr=(document.querySelector('.recv-ai-serials[data-idx="'+i+'"]')||{}).value||'';
    var serials=snStr.split(',').map(function(s){return s.trim();}).filter(Boolean);
    items.push({model:model,desc:desc,qty:qty,cost:cost,serials:serials});
  });
  // Apply to inventory
  items.forEach(function(it){
    if(!it.qty)return;
    var p=PRODUCTS.find(function(x){return (x.model||'').toLowerCase()===it.model.toLowerCase()||(x.sku||'').toLowerCase()===it.model.toLowerCase();});
    if(p){
      p.stock=(p.stock||0)+it.qty;
      if(it.cost)p.cost=it.cost;
      if(!p.serialPool)p.serialPool=[];
      it.serials.forEach(function(sn){p.serialPool.push({sn:sn,status:'Available',receivedAt:new Date().toISOString(),vendor:vendorName});serialsAdded++;});
      updated++;
    }else{
      // Auto-create new product
      PRODUCTS.push({id:PRODUCTS.length+300+notFound,model:it.model,sku:it.model,name:it.desc||it.model,brand:'',cat:'',price:0,cost:it.cost,stock:it.qty,sold:0,reorderPt:2,reorderQty:3,sales30:0,serial:'',warranty:'1 Year',icon:'&#x1F4E6;',serialTracked:true,vendor:vendorName,serialPool:it.serials.map(function(sn){return{sn:sn,status:'Available',receivedAt:new Date().toISOString(),vendor:vendorName};})});
      notFound++;serialsAdded+=it.serials.length;
    }
  });
  // Update linked PO status
  if(linkedPO){
    var allFull=true;
    linkedPO.items.forEach(function(poItem){
      var received=items.find(function(it){return it.model.toLowerCase()===(poItem.model||'').toLowerCase();});
      if(received){var newRecv=(poItem.qtyReceived||0)+received.qty;poItem.qtyReceived=newRecv;if(newRecv<poItem.qtyOrdered)allFull=false;}
      else if((poItem.qtyReceived||0)<poItem.qtyOrdered)allFull=false;
    });
    linkedPO.status=allFull?'Received':'Partially Received';
    if(allFull)linkedPO.receivedDate=new Date().toISOString();
    linkedPO.receivedBy=currentEmployee?currentEmployee.name:'Admin';
    if(!linkedPO.receiveLog)linkedPO.receiveLog=[];
    linkedPO.receiveLog.push({ts:new Date().toISOString(),by:linkedPO.receivedBy,source:'AI auto-receive'});
    await savePOs();
  }
  await saveProducts();
  recvAiCancel();
  renderReceiving();renderInventory();refreshSaleView();
  toast('Received '+updated+' matched'+(notFound?' + '+notFound+' new':'')+' items, '+serialsAdded+' serials added','success');
}

async function recvComplete(){
  if(!selectedPO)return;
  // Calculate if this is partial or full
  var allFull=true;var anyReceived=false;var newlyReceived=0;
  selectedPO.items.forEach(function(it){
    var nowRecv=recvQtys[it.productId]||0;
    var prevRecv=it.qtyReceived||0;
    if(nowRecv<it.qtyOrdered)allFull=false;
    if(nowRecv>0)anyReceived=true;
    if(nowRecv>prevRecv)newlyReceived+=(nowRecv-prevRecv);
  });
  if(!anyReceived){toast('Enter received quantities first','error');return;}
  var msg=allFull?'Complete receiving for '+selectedPO.id+'? All items will be marked received and stock updated.':'Mark '+selectedPO.id+' as Partially Received? Stock will update for received items only. PO stays open.';
  if(!confirm(msg))return;
  selectedPO.items.forEach(function(it){
    var nowRecv=recvQtys[it.productId]||0;
    var prevRecv=it.qtyReceived||0;
    var delta=nowRecv-prevRecv;
    it.qtyReceived=nowRecv;
    if(delta>0){
      var p=PRODUCTS.find(function(x){return x.id===it.productId;});
      if(p)p.stock=(p.stock||0)+delta;
    }
  });
  selectedPO.status=allFull?'Received':'Partially Received';
  if(allFull){selectedPO.receivedDate=new Date().toISOString();}
  selectedPO.receivedBy=currentEmployee?currentEmployee.name:'Admin';
  if(!selectedPO.receiveLog)selectedPO.receiveLog=[];
  selectedPO.receiveLog.push({ts:new Date().toISOString(),by:selectedPO.receivedBy,units:newlyReceived});
  await savePOs();await saveProducts();
  renderRecvDetail();renderRecvList();refreshSaleView();renderInventory();
  toast(selectedPO.id+': '+(allFull?'fully received':'partially received')+' — '+newlyReceived+' units added to stock','success');
}

// ══════════════════════════════════════════════
// TAX RATES TAB
// ══════════════════════════════════════════════
var selectedTaxIdx=-1;
function renderTaxList(){
  var q=(document.getElementById('tax-search')?document.getElementById('tax-search').value:'').toLowerCase();
  var list=document.getElementById('tax-list');if(!list)return;
  var filtered=KS_TAX;
  if(q){filtered=KS_TAX.filter(function(t){return t.n.toLowerCase().indexOf(q)!==-1||t.c.toLowerCase().indexOf(q)!==-1;});}
  if(filtered.length>200){
    list.innerHTML='<div style="padding:12px;font-size:11px;color:var(--gray-2);">Showing first 200 of '+filtered.length+' results. Type to narrow down.</div>'+
      filtered.slice(0,200).map(function(t,i){var idx=KS_TAX.indexOf(t);return taxCardHtml(t,idx);}).join('');
  } else if(filtered.length===0){
    list.innerHTML='<div style="padding:12px;font-size:11px;color:var(--gray-2);">No jurisdictions found.</div>';
  } else {
    list.innerHTML=filtered.map(function(t){var idx=KS_TAX.indexOf(t);return taxCardHtml(t,idx);}).join('');
  }
  if(selectedTaxIdx>=0)renderTaxDetail(selectedTaxIdx);
}
function taxCardHtml(t,idx){
  return '<div class="tax-zone-card'+(idx===selectedTaxIdx?' active':'')+'" onclick="selectedTaxIdx='+idx+';renderTaxDetail('+idx+');document.querySelectorAll(\'#tax-list .tax-zone-card\').forEach(function(c){c.classList.remove(\'active\');});this.classList.add(\'active\');">'
    +'<div class="tax-zone-name">'+t.n+'<span class="tax-zone-code">'+t.c+'</span></div>'
    +'<div class="tax-zone-rate">'+t.r.toFixed(2)+'%</div></div>';
}
function renderTaxDetail(idx){
  var t=KS_TAX[idx];if(!t)return;
  selectedTaxIdx=idx;
  var h='<div class="tax-detail-title">'+t.n+'</div>'
    +'<div style="font-size:11px;color:var(--gray-2);margin-top:-10px;margin-bottom:14px;">Code: '+t.c+'</div>'
    +'<div class="tax-combined"><div class="tax-combined-val">'+t.r.toFixed(3)+'%</div><div class="tax-combined-label">Combined Sales Tax Rate</div></div>'
    +'<div class="tax-rate-row"><span class="tax-rate-label">State Rate</span><span class="tax-rate-val">'+t.s.toFixed(3)+'%</span></div>'
    +'<div class="tax-rate-row"><span class="tax-rate-label">County Rate</span><span class="tax-rate-val">'+t.co.toFixed(3)+'%</span></div>'
    +'<div class="tax-rate-row"><span class="tax-rate-label">City Rate</span><span class="tax-rate-val">'+t.ci.toFixed(3)+'%</span></div>';
  if(t.sp>0) h+='<div class="tax-rate-row"><span class="tax-rate-label">Special Rate</span><span class="tax-rate-val">'+t.sp.toFixed(3)+'%</span></div>';
  h+='<div style="margin-top:18px;padding:14px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;">'
    +'<div style="font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--gray-2);margin-bottom:8px;">Tax Calculation Example</div>'
    +'<table class="tax-coverage"><thead><tr><th>Sale Amount</th><th>Tax</th><th>Total</th></tr></thead><tbody>'
    +'<tr><td>$100.00</td><td>$'+(100*t.r/100).toFixed(2)+'</td><td style="font-weight:700;color:var(--gold);">$'+(100+100*t.r/100).toFixed(2)+'</td></tr>'
    +'<tr><td>$500.00</td><td>$'+(500*t.r/100).toFixed(2)+'</td><td style="font-weight:700;color:var(--gold);">$'+(500+500*t.r/100).toFixed(2)+'</td></tr>'
    +'<tr><td>$1,000.00</td><td>$'+(1000*t.r/100).toFixed(2)+'</td><td style="font-weight:700;color:var(--gold);">$'+(1000+1000*t.r/100).toFixed(2)+'</td></tr>'
    +'</tbody></table></div>'
    +'<button class="primary-btn" style="margin-top:14px;width:100%;" onclick="taxUseForZone('+idx+')">Use as Tax Zone</button>';
  document.getElementById('tax-detail').innerHTML=h;
}
function taxUseForZone(idx){
  var t=KS_TAX[idx];
  var exists=adminTaxZones.find(function(z){return z.name===t.n;});
  if(exists){toast(t.n+' already exists as a tax zone','info');return;}
  adminTaxZones.push({name:t.n,counties:[t.n],stateRate:t.s,countyRate:t.co,cityRate:t.ci});
  adminSave('admin-tax-zones',adminTaxZones);
  toast(t.n+' added as tax zone ('+t.r.toFixed(2)+'%)','success');
}

// ── Tax Rate Import ──
var _taxImportParsed=[];
function taxImportDrop(e){e.preventDefault();var f=e.dataTransfer.files[0];if(f)taxImportFile(f);}
function taxImportFile(file){
  if(!file)return;
  _taxImportParsed=[];
  document.getElementById('tax-import-result').style.display='none';
  var ext=file.name.split('.').pop().toLowerCase();
  if(ext==='csv'){
    var reader=new FileReader();reader.onload=function(e){taxParseCSV(e.target.result);};reader.readAsText(file);
  } else if(ext==='xlsx'||ext==='xls'){
    var reader=new FileReader();reader.onload=function(e){taxParseExcel(e.target.result);};reader.readAsArrayBuffer(file);
  } else {toast('Unsupported file type — use CSV or Excel','error');}
}
function taxParseCSV(text){
  var lines=text.split(/\r?\n/).filter(function(l){return l.trim();});
  if(lines.length<2){toast('File has no data rows','error');return;}
  var hdr=lines[0].split(',').map(function(h){return h.trim().replace(/^"|"$/g,'').toLowerCase();});
  var colMap={city:-1,county:-1,code:-1,state:-1,countyRate:-1,cityRate:-1,special:-1,total:-1};
  hdr.forEach(function(h,i){
    if(h.match(/^city$|jurisdiction.*name|city.*name/i))colMap.city=i;
    else if(h.match(/county.*name|county$/i))colMap.county=i;
    else if(h.match(/code|jurisdiction.*code/i))colMap.code=i;
    else if(h.match(/state.*rate/i))colMap.state=i;
    else if(h.match(/county.*rate/i))colMap.countyRate=i;
    else if(h.match(/city.*rate|local.*rate|municipal/i))colMap.cityRate=i;
    else if(h.match(/special|spe.*rate/i))colMap.special=i;
    else if(h.match(/total.*rate|combined/i))colMap.total=i;
  });
  // KS DOR Pub 1700 format detection - columns may be positional
  if(colMap.city<0&&hdr.length>=5){colMap.city=0;colMap.code=1;colMap.state=2;colMap.countyRate=3;colMap.cityRate=4;if(hdr.length>=6)colMap.special=5;if(hdr.length>=7)colMap.total=6;}
  var parsed=[];
  for(var i=1;i<lines.length;i++){
    var cols=lines[i].split(',').map(function(c){return c.trim().replace(/^"|"$/g,'');});
    var city=cols[colMap.city]||'';if(!city)continue;
    var code=colMap.code>=0?cols[colMap.code]||'':'';
    var sr=colMap.state>=0?parseFloat(cols[colMap.state])||6.5:6.5;
    var cor=colMap.countyRate>=0?parseFloat(cols[colMap.countyRate])||0:0;
    var cir=colMap.cityRate>=0?parseFloat(cols[colMap.cityRate])||0:0;
    var sp=colMap.special>=0?parseFloat(cols[colMap.special])||0:0;
    var total=colMap.total>=0?parseFloat(cols[colMap.total])||0:sr+cor+cir+sp;
    if(!total)total=sr+cor+cir+sp;
    parsed.push({n:city,c:code,s:6.5,co:cor,ci:cir,sp:sp,r:Math.round(total*1000)/1000});
  }
  _taxImportParsed=parsed;
  taxImportShowPreview();
}
function taxParseExcel(buffer){
  // Use simple XLSX parsing via SheetJS-like approach — read as CSV-like from binary
  // For Pub 1700: try to find the data sheet and extract rows
  toast('Reading Excel file...','info');
  // Since we don't have SheetJS loaded, convert via a textarea trick - actually we need to handle this differently
  // Let's load SheetJS from CDN dynamically
  if(typeof XLSX==='undefined'){
    var s=document.createElement('script');
    s.src='https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
    s.onload=function(){taxParseExcelData(buffer);};
    s.onerror=function(){toast('Could not load Excel parser. Try saving as CSV first.','error');};
    document.head.appendChild(s);
  } else {taxParseExcelData(buffer);}
}
function taxParseExcelData(buffer){
  try{
    var wb=XLSX.read(buffer,{type:'array'});
    var ws=wb.Sheets[wb.SheetNames[0]];
    var rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
    if(rows.length<2){toast('No data found in spreadsheet','error');return;}
    // Find header row (may not be row 0 in Pub 1700)
    var hdrIdx=0;
    for(var i=0;i<Math.min(10,rows.length);i++){
      var row=rows[i].map(function(c){return String(c).toLowerCase();});
      if(row.some(function(c){return c.match(/city|jurisdiction|county|rate/);})){hdrIdx=i;break;}
    }
    var hdr=rows[hdrIdx].map(function(c){return String(c).toLowerCase().trim();});
    var colMap={city:-1,code:-1,state:-1,countyRate:-1,cityRate:-1,special:-1,total:-1};
    hdr.forEach(function(h,i){
      if(h.match(/^city$|jurisdiction.*name|city.*name/))colMap.city=i;
      else if(h.match(/code|jurisdiction.*code/))colMap.code=i;
      else if(h.match(/state.*rate/))colMap.state=i;
      else if(h.match(/county.*rate/))colMap.countyRate=i;
      else if(h.match(/city.*rate|local.*rate|municipal/))colMap.cityRate=i;
      else if(h.match(/special|spe.*rate/))colMap.special=i;
      else if(h.match(/total.*rate|combined/))colMap.total=i;
    });
    if(colMap.city<0){
      // Positional fallback for Pub 1700
      for(var j=0;j<hdr.length;j++){
        if(hdr[j]&&!hdr[j].match(/^[0-9.]+$/)){colMap.city=j;break;}
      }
    }
    var parsed=[];
    for(var i=hdrIdx+1;i<rows.length;i++){
      var r=rows[i];
      var city=String(r[colMap.city]||'').trim();if(!city||city.match(/^total|^grand/i))continue;
      var code=colMap.code>=0?String(r[colMap.code]||'').trim():'';
      var sr=6.5;
      var cor=colMap.countyRate>=0?parseFloat(r[colMap.countyRate])||0:0;
      var cir=colMap.cityRate>=0?parseFloat(r[colMap.cityRate])||0:0;
      var sp=colMap.special>=0?parseFloat(r[colMap.special])||0:0;
      var total=colMap.total>=0?parseFloat(r[colMap.total])||0:sr+cor+cir+sp;
      if(!total)total=sr+cor+cir+sp;
      parsed.push({n:city,c:code,s:6.5,co:cor,ci:cir,sp:sp,r:Math.round(total*1000)/1000});
    }
    _taxImportParsed=parsed;
    taxImportShowPreview();
  }catch(e){toast('Error reading Excel: '+e.message,'error');}
}
function taxImportShowPreview(){
  if(!_taxImportParsed.length){toast('No tax rates found in file','error');return;}
  var newCount=0,changedCount=0,unchangedCount=0;
  _taxImportParsed.forEach(function(t){
    var existing=KS_TAX.find(function(x){return x.n.toLowerCase()===t.n.toLowerCase();});
    if(!existing){t._status='new';newCount++;}
    else if(Math.abs(existing.r-t.r)>0.001||Math.abs(existing.co-t.co)>0.001||Math.abs(existing.ci-t.ci)>0.001||Math.abs(existing.sp-t.sp)>0.001){t._status='changed';changedCount++;}
    else{t._status='unchanged';unchangedCount++;}
  });
  document.getElementById('tax-import-summary').textContent=_taxImportParsed.length+' jurisdictions: '+newCount+' new, '+changedCount+' changed, '+unchangedCount+' unchanged';
  var h='';
  _taxImportParsed.forEach(function(t){
    var bg=t._status==='new'?'background:#dbeafe;':t._status==='changed'?'background:#fef9c3;':'';
    var badge=t._status==='new'?'<span style="font-size:9px;padding:1px 6px;border-radius:100px;background:#2563eb;color:#fff;">NEW</span>':t._status==='changed'?'<span style="font-size:9px;padding:1px 6px;border-radius:100px;background:#f59e0b;color:#fff;">CHANGED</span>':'';
    h+='<tr style="'+bg+'"><td>'+t.n+'</td><td>'+t.c+'</td><td>'+t.s.toFixed(3)+'%</td><td>'+t.co.toFixed(3)+'%</td><td>'+t.ci.toFixed(3)+'%</td><td>'+t.sp.toFixed(3)+'%</td><td style="font-weight:700;">'+t.r.toFixed(3)+'%</td><td>'+badge+'</td></tr>';
  });
  document.getElementById('tax-import-tbody').innerHTML=h;
  document.getElementById('tax-import-preview').style.display='';
}
function taxImportConfirm(){
  if(!_taxImportParsed.length)return;
  var updated=0,added=0,unchanged=0;
  _taxImportParsed.forEach(function(t){
    var idx=KS_TAX.findIndex(function(x){return x.n.toLowerCase()===t.n.toLowerCase();});
    if(idx>=0){
      if(t._status==='changed'){KS_TAX[idx].r=t.r;KS_TAX[idx].s=6.5;KS_TAX[idx].co=t.co;KS_TAX[idx].ci=t.ci;KS_TAX[idx].sp=t.sp;if(t.c)KS_TAX[idx].c=t.c;updated++;}
      else unchanged++;
    } else {
      KS_TAX.push({n:t.n,c:t.c||t.n.substring(0,5).toUpperCase(),r:t.r,s:6.5,co:t.co,ci:t.ci,sp:t.sp});added++;
    }
  });
  adminSave('ks-tax-rates',KS_TAX);
  document.getElementById('tax-import-preview').style.display='none';
  document.getElementById('tax-import-result').style.display='';
  document.getElementById('tax-import-result').innerHTML='Import complete: <strong>'+updated+'</strong> rates updated, <strong>'+added+'</strong> new cities added, <strong>'+unchanged+'</strong> unchanged.';
  document.getElementById('tax-count').textContent=KS_TAX.length;
  renderTaxList();
  _taxImportParsed=[];
  toast('Tax rates imported successfully','success');
}
function taxImportCancel(){
  _taxImportParsed=[];
  document.getElementById('tax-import-preview').style.display='none';
  document.getElementById('tax-import-input').value='';
}

// ══════════════════════════════════════════════
// ORDER POLLING — real-time sync for serial updates from delivery
// ══════════════════════════════════════════════
var _orderPollTimer=null,_lastOrderHash='';
function startOrderPolling(){
  if(_orderPollTimer)clearInterval(_orderPollTimer);
  _lastOrderHash=JSON.stringify(orders.map(function(o){return{id:o.id,s:o.status,items:o.items.map(function(i){return{sn:i.serial||'',d:!!i.delivered};})}}));
  _orderPollTimer=setInterval(pollOrders,10000);
}
async function pollOrders(){
  try{
    var r=await fetch('/api/admin-get?key=orders&t='+Date.now());var d=await r.json();
    if(!d||!d.data)return;
    var fresh=d.data.orders||[];
    var hash=JSON.stringify(fresh.map(function(o){return{id:o.id,s:o.status,items:(o.items||[]).map(function(i){return{sn:i.serial||'',d:!!i.delivered};})}}));
    if(hash===_lastOrderHash)return;
    _lastOrderHash=hash;
    console.log('[Order Sync] Data changed — refreshing orders (serial/delivery update detected)');
    orders=fresh;
    if(d.data.nextOrderId)nextOrderId=d.data.nextOrderId;
    if(d.data.nextQuoteId)nextQuoteId=d.data.nextQuoteId;
    renderOrders();
    if(selectedOrder){
      var updated=orders.find(function(o){return o.id===selectedOrder.id;});
      if(updated){selectedOrder=updated;renderOrderDetail();}
    }
  }catch(e){}
}
// Auto-start polling when page loads
setTimeout(startOrderPolling,3000);

// ══════════════════════════════════════════════
// PRODUCT INVENTORY CARD
// ══════════════════════════════════════════════
var _pcProduct=null,_pcTab='info',_pcReadOnly=false,_pcCartIdx=-1;

function openProductCard(productId,opts){
  opts=opts||{};
  var p=PRODUCTS.find(function(x){return x.id===productId;});
  if(!p){toast('Product not found','error');return;}
  _pcProduct=p;
  _pcTab='info';
  _pcReadOnly=!!opts.readOnly;
  _pcCartIdx=opts.cartIdx!=null?opts.cartIdx:-1;
  document.getElementById('pc-title').textContent=p.name||'Product';
  document.getElementById('pc-subtitle').textContent=(p.model||p.sku||'')+(p.brand?' — '+p.brand:'');
  document.getElementById('pc-icon').innerHTML=p.icon||'&#x1F4E6;';
  document.getElementById('pc-readonly-badge').style.display=_pcReadOnly?'inline-block':'none';
  // Set active tab
  document.querySelectorAll('.pc-tab').forEach(function(t){t.classList.toggle('active',t.dataset.tab==='info');});
  pcRenderTab();
  openModal('product-card-modal');
}
function openProductCardByModel(model,opts){
  var p=PRODUCTS.find(function(x){return x.model===model||x.sku===model;});
  if(!p){toast('Product "'+model+'" not found in inventory','error');return;}
  openProductCard(p.id,opts);
}
function closeProductCard(){closeModal('product-card-modal');_pcProduct=null;}
function pcSwitchTab(tab){
  _pcTab=tab;
  document.querySelectorAll('.pc-tab').forEach(function(t){t.classList.toggle('active',t.dataset.tab===tab);});
  pcRenderTab();
}
function pcRenderTab(){
  var el=document.getElementById('pc-body');
  if(!_pcProduct){el.innerHTML='';return;}
  if(_pcTab==='info')el.innerHTML=pcTabInfo();
  else if(_pcTab==='pricing')el.innerHTML=pcTabPricing();
  else if(_pcTab==='serials')el.innerHTML=pcTabSerials();
  else if(_pcTab==='received')el.innerHTML=pcTabReceived();
  else if(_pcTab==='sales')el.innerHTML=pcTabSales();
  else if(_pcTab==='stock')el.innerHTML=pcTabStock();
}

// ── TAB 1: PRODUCT INFO ──
function pcTabInfo(){
  var p=_pcProduct,ro=_pcReadOnly;
  var v=(typeof adminVendors!=='undefined')?adminVendors.find(function(x){return x.name===p.vendor;}):null;
  var vendorOpts=(typeof adminVendors!=='undefined')?adminVendors.map(function(x){return '<option'+(x.name===p.vendor?' selected':'')+'>'+x.name+'</option>';}).join(''):'';
  var brandSet={};PRODUCTS.forEach(function(x){if(x.brand)brandSet[x.brand]=true;});
  var brands=Object.keys(brandSet).sort();
  var brandOpts=brands.map(function(b){return '<option'+(b===p.brand?' selected':'')+'>'+b+'</option>';}).join('');
  var catOpts='';
  if(typeof DEPARTMENTS!=='undefined')DEPARTMENTS.forEach(function(d){d.cats.forEach(function(c){catOpts+='<option'+(c===p.cat?' selected':'')+'>'+c+'</option>';});});
  var deptOpts='';
  if(typeof DEPARTMENTS!=='undefined')DEPARTMENTS.forEach(function(d){deptOpts+='<option'+(d.name===(p.dept||getProductDept(p))?' selected':'')+'>'+d.name+'</option>';});
  var rd=ro?' readonly':'';
  var dis=ro?' disabled':'';
  var h='<div class="pc-section">';
  h+='<div class="pc-grid">';
  h+='<div class="pc-field"><label>Model Number</label><input id="pc-model" value="'+(p.model||'')+'"'+rd+'/></div>';
  h+='<div class="pc-field"><label>PLU / SKU</label><input id="pc-sku" value="'+(p.sku||'')+'"'+rd+'/></div>';
  h+='</div>';
  h+='<div class="pc-field"><label>Description</label><input id="pc-name" value="'+((p.name||'').replace(/"/g,'&quot;'))+'"'+rd+'/></div>';
  h+='<div class="pc-grid">';
  h+='<div class="pc-field"><label>Brand</label>'+(ro?'<input value="'+(p.brand||'')+'" readonly/>':'<select id="pc-brand"><option value="">—</option>'+brandOpts+'</select>')+'</div>';
  h+='<div class="pc-field"><label>Vendor</label>'+(ro?'<input value="'+(p.vendor||'')+'" readonly/>':'<select id="pc-vendor" onchange="pcVendorChanged()"><option value="">—</option>'+vendorOpts+'</select>')+'</div>';
  h+='</div>';
  h+='<div class="pc-grid3">';
  h+='<div class="pc-field"><label>Vendor Rep</label><input value="'+(v?v.repName||'':'—')+'" readonly/></div>';
  h+='<div class="pc-field"><label>Rep Phone</label><input value="'+(v?v.phone||'':'—')+'" readonly/></div>';
  h+='<div class="pc-field"><label>Account #</label><input value="'+(v?v.accountNum||'':'—')+'" readonly/></div>';
  h+='</div>';
  h+='<div class="pc-grid">';
  h+='<div class="pc-field"><label>Category</label>'+(ro?'<input value="'+(p.cat||'')+'" readonly/>':'<select id="pc-cat">'+catOpts+'</select>')+'</div>';
  h+='<div class="pc-field"><label>Department</label>'+(ro?'<input value="'+(p.dept||getProductDept(p)||'')+'" readonly/>':'<select id="pc-dept">'+deptOpts+'</select>')+'</div>';
  h+='</div>';
  h+='<div class="pc-grid3">';
  h+='<div class="pc-field"><label>UPC</label><input id="pc-upc" value="'+(p.upc||'')+'"'+rd+'/></div>';
  h+='<div class="pc-field"><label>Warranty</label><input id="pc-warranty" value="'+(p.warranty||'')+'"'+rd+'/></div>';
  h+='<div class="pc-field"><label>Icon</label><input id="pc-icon-field" value="'+(p.icon||'')+'"'+rd+'/></div>';
  h+='</div>';
  h+='<div class="pc-grid3">';
  h+='<div class="pc-field"><label>Serial Tracked</label><label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#1f2937;cursor:pointer;margin-top:4px;"><input type="checkbox" id="pc-serial-tracked"'+(p.serialTracked!==false&&isSerialTracked(p)?' checked':'')+(ro?' disabled':'')+' style="accent-color:#2563eb;"/> Yes</label></div>';
  h+='<div class="pc-field"><label>Price Locked</label><label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#1f2937;cursor:pointer;margin-top:4px;"><input type="checkbox" id="pc-price-locked"'+(p.priceLocked?' checked':'')+(ro?' disabled':'')+' style="accent-color:#dc2626;"/> &#x1F512; Locked</label></div>';
  h+='<div></div>';
  h+='</div>';
  h+='<div class="pc-grid3">';
  h+='<div class="pc-field"><label>Min Qty (Reorder Pt)</label><input id="pc-reorder" type="number" value="'+(p.reorderPt||0)+'"'+rd+'/></div>';
  h+='<div class="pc-field"><label>Reorder Qty</label><input id="pc-reorderqty" type="number" value="'+(p.reorderQty||0)+'"'+rd+'/></div>';
  h+='<div class="pc-field"><label>Stock</label><input value="'+(p.stock||0)+'" readonly/></div>';
  h+='</div>';
  if(!ro)h+='<div style="margin-top:14px;text-align:right;"><button class="primary-btn" onclick="pcSaveInfo()">Save Changes</button></div>';
  h+='</div>';
  return h;
}
function pcVendorChanged(){
  var sel=document.getElementById('pc-vendor');
  if(!sel)return;
  var v=(typeof adminVendors!=='undefined')?adminVendors.find(function(x){return x.name===sel.value;}):null;
  // Re-render to update vendor rep fields
  pcRenderTab();
  if(v)setTimeout(function(){var s=document.getElementById('pc-vendor');if(s)s.value=v.name;},0);
}
function pcSaveInfo(){
  var p=_pcProduct;if(!p||_pcReadOnly)return;
  p.model=(document.getElementById('pc-model').value||'').trim();
  p.sku=(document.getElementById('pc-sku').value||'').trim();
  p.name=(document.getElementById('pc-name').value||'').trim();
  var brandSel=document.getElementById('pc-brand');if(brandSel)p.brand=brandSel.value;
  var vendorSel=document.getElementById('pc-vendor');if(vendorSel)p.vendor=vendorSel.value;
  var catSel=document.getElementById('pc-cat');if(catSel)p.cat=catSel.value;
  var deptSel=document.getElementById('pc-dept');if(deptSel)p.dept=deptSel.value;
  p.upc=(document.getElementById('pc-upc').value||'').trim();
  p.warranty=(document.getElementById('pc-warranty').value||'').trim();
  p.icon=(document.getElementById('pc-icon-field').value||'').trim();
  p.serialTracked=document.getElementById('pc-serial-tracked').checked;
  p.priceLocked=document.getElementById('pc-price-locked').checked;
  p.reorderPt=parseInt(document.getElementById('pc-reorder').value)||0;
  p.reorderQty=parseInt(document.getElementById('pc-reorderqty').value)||0;
  saveProducts();renderInventory();toast('Product saved','success');
  document.getElementById('pc-subtitle').textContent=(p.model||p.sku||'')+(p.brand?' — '+p.brand:'');
  document.getElementById('pc-title').textContent=p.name||'Product';
}

// ── TAB 2: PRICING & COST ──
function pcTabPricing(){
  var p=_pcProduct,ro=_pcReadOnly;
  var margin=p.price>0?((p.price-(p.cost||0))/p.price*100):0;
  var marginDollar=p.price-(p.cost||0);
  var cartPrice=(_pcCartIdx>=0&&cart[_pcCartIdx])?cart[_pcCartIdx].price:null;
  var h='<div class="pc-section">';
  h+='<div class="pc-grid3" style="margin-bottom:14px;">';
  h+='<div class="pc-stat"><div class="pc-stat-val">'+fmt(p.price)+'</div><div class="pc-stat-lbl">Retail Price</div></div>';
  h+='<div class="pc-stat"><div class="pc-stat-val">'+fmt(p.cost||0)+'</div><div class="pc-stat-lbl">Cost</div></div>';
  h+='<div class="pc-stat"><div class="pc-stat-val" style="color:'+(margin>=0?'#16a34a':'#dc2626')+';">'+margin.toFixed(1)+'%</div><div class="pc-stat-lbl">Margin</div></div>';
  h+='</div>';
  if(cartPrice!==null&&cartPrice!==p.price){
    h+='<div style="padding:10px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;margin-bottom:14px;font-size:12px;"><strong style="color:#2563eb;">Cart Price:</strong> '+fmt(cartPrice)+' <span style="color:#6b7280;">(Retail: '+fmt(p.price)+')</span></div>';
  }
  h+='<div class="pc-grid">';
  h+='<div class="pc-field"><label>Cost</label><input id="pc-cost" type="number" step="0.01" value="'+(p.cost||0).toFixed(2)+'"'+(ro?' readonly':'')+'/></div>';
  h+='<div class="pc-field"><label>Retail Price</label><input id="pc-price" type="number" step="0.01" value="'+(p.price||0).toFixed(2)+'"'+(ro?' readonly':'')+'/></div>';
  h+='</div>';
  h+='<div class="pc-grid">';
  h+='<div class="pc-field"><label>Margin %</label><input value="'+margin.toFixed(1)+'%" readonly/></div>';
  h+='<div class="pc-field"><label>Margin $</label><input value="'+fmt(marginDollar)+'" readonly/></div>';
  h+='</div>';
  if(!ro)h+='<div style="margin-top:14px;text-align:right;"><button class="primary-btn" onclick="pcSavePricing()">Save Changes</button></div>';
  h+='</div>';
  // Pricing history
  h+='<div class="pc-section"><div class="pc-section-title">Pricing History</div>';
  var history=p.priceHistory||[];
  if(!history.length){h+='<div style="text-align:center;padding:20px;color:#9ca3af;font-size:11px;">No pricing changes recorded yet</div>';}
  else{
    h+='<table class="pc-tbl"><thead><tr><th>Date</th><th>Field</th><th>Old</th><th>New</th><th>By</th></tr></thead><tbody>';
    history.slice().reverse().forEach(function(e){
      h+='<tr><td>'+new Date(e.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+'</td><td>'+e.field+'</td><td>'+fmt(e.oldVal)+'</td><td>'+fmt(e.newVal)+'</td><td>'+(e.by||'—')+'</td></tr>';
    });
    h+='</tbody></table>';
  }
  h+='</div>';
  return h;
}
function pcSavePricing(){
  var p=_pcProduct;if(!p||_pcReadOnly)return;
  var newCost=parseFloat(document.getElementById('pc-cost').value)||0;
  var newPrice=parseFloat(document.getElementById('pc-price').value)||0;
  var by=currentEmployee?currentEmployee.name:'Admin';
  if(!p.priceHistory)p.priceHistory=[];
  if(newCost!==p.cost)p.priceHistory.push({date:new Date().toISOString(),field:'Cost',oldVal:p.cost||0,newVal:newCost,by:by});
  if(newPrice!==p.price)p.priceHistory.push({date:new Date().toISOString(),field:'Price',oldVal:p.price||0,newVal:newPrice,by:by});
  p.cost=newCost;p.price=newPrice;
  saveProducts();renderInventory();pcRenderTab();toast('Pricing saved','success');
}

// ── TAB 3: SERIAL POOL ──
function pcTabSerials(){
  var p=_pcProduct;
  var pool=p.serialPool||[];
  var avail=pool.filter(function(s){return s.status==='Available';}).length;
  var assigned=pool.filter(function(s){return s.status!=='Available'&&s.status!=='Returned';}).length;
  var returned=pool.filter(function(s){return s.status==='Returned';}).length;
  var h='<div class="pc-section">';
  h+='<div class="pc-grid3" style="margin-bottom:14px;">';
  h+='<div class="pc-stat"><div class="pc-stat-val" style="color:#16a34a;">'+avail+'</div><div class="pc-stat-lbl">Available</div></div>';
  h+='<div class="pc-stat"><div class="pc-stat-val" style="color:#2563eb;">'+assigned+'</div><div class="pc-stat-lbl">Assigned</div></div>';
  h+='<div class="pc-stat"><div class="pc-stat-val" style="color:#d97706;">'+returned+'</div><div class="pc-stat-lbl">Returned</div></div>';
  h+='</div>';
  if(!_pcReadOnly)h+='<button class="ghost-btn" onclick="pcAddSerial()" style="margin-bottom:12px;">+ Add Serial Manually</button>';
  if(!pool.length){h+='<div style="text-align:center;padding:20px;color:#9ca3af;font-size:11px;">No serial numbers in pool</div>';}
  else{
    h+='<table class="pc-tbl"><thead><tr><th>Serial #</th><th>Status</th><th>Received</th><th>Condition</th><th>Assigned To</th></tr></thead><tbody>';
    pool.forEach(function(s){
      var stColor=s.status==='Available'?'#dcfce7;color:#16a34a':s.status==='Returned'?'#fef3c7;color:#92400e':'#dbeafe;color:#1d4ed8';
      // Find assignment
      var assignInfo='—';
      if(s.status!=='Available'&&s.status!=='Returned'){
        var match=orders.find(function(o){return(o.items||[]).some(function(i){return i.serial===s.sn;});});
        if(match)assignInfo='<a class="pc-link" onclick="closeProductCard();printInvoice(\''+match.id+'\')">'+match.id+'</a> — '+match.customer;
      }
      h+='<tr><td style="font-weight:700;font-family:monospace;">'+s.sn+'</td><td><span class="pc-badge" style="background:'+stColor+'">'+s.status+'</span></td><td>'+(s.receivedAt?new Date(s.receivedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'2-digit'}):'—')+'</td><td>'+(s.condition||'New')+'</td><td>'+assignInfo+'</td></tr>';
    });
    h+='</tbody></table>';
  }
  // If opened from cart, allow selecting a serial
  if(_pcCartIdx>=0&&avail>0){
    h+='<div style="margin-top:12px;padding:10px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;font-size:12px;color:#1d4ed8;">Click an available serial above to assign it to the cart item, or use the <strong>Select Serial #</strong> button in the cart.</div>';
  }
  h+='</div>';
  return h;
}
function pcAddSerial(){
  var p=_pcProduct;if(!p)return;
  var sn=prompt('Enter serial number:');if(!sn||!sn.trim())return;
  if(!p.serialPool)p.serialPool=[];
  if(p.serialPool.find(function(s){return s.sn===sn.trim();})){toast('Serial already exists','error');return;}
  p.serialPool.push({sn:sn.trim(),status:'Available',receivedAt:new Date().toISOString(),vendor:p.vendor||''});
  saveProducts();pcRenderTab();toast('Serial added','success');
}

// ── TAB 4: RECEIVED HISTORY ──
function pcTabReceived(){
  var p=_pcProduct;
  var pos=(typeof purchaseOrders!=='undefined')?purchaseOrders:[];
  var entries=[];
  pos.forEach(function(po){
    (po.items||[]).forEach(function(item){
      if(item.productId===p.id||(item.model&&p.model&&item.model===p.model)){
        if(item.qtyReceived>0||po.status==='Received'){
          entries.push({date:po.receivedDate||po.date,poId:po.id,qty:item.qtyReceived||item.qtyOrdered,cost:item.unitCost||0,by:po.receivedBy||'—',vendor:po.vendor||''});
        }
      }
    });
  });
  var totalReceived=entries.reduce(function(s,e){return s+e.qty;},0);
  var h='<div class="pc-section">';
  h+='<div class="pc-stat" style="margin-bottom:14px;"><div class="pc-stat-val">'+totalReceived+'</div><div class="pc-stat-lbl">Total Units Received (All Time)</div></div>';
  if(!entries.length){h+='<div style="text-align:center;padding:20px;color:#9ca3af;font-size:11px;">No receiving records found</div>';}
  else{
    h+='<table class="pc-tbl"><thead><tr><th>Date</th><th>PO #</th><th>Vendor</th><th>Qty</th><th>Unit Cost</th><th>Received By</th></tr></thead><tbody>';
    entries.sort(function(a,b){return new Date(b.date)-new Date(a.date);});
    entries.forEach(function(e){
      h+='<tr><td>'+new Date(e.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+'</td><td><a class="pc-link" onclick="closeProductCard();poReceive(\''+e.poId+'\')">'+e.poId+'</a></td><td>'+e.vendor+'</td><td>'+e.qty+'</td><td>'+fmt(e.cost)+'</td><td>'+e.by+'</td></tr>';
    });
    h+='</tbody></table>';
  }
  h+='</div>';
  return h;
}

// ── TAB 5: SALES HISTORY ──
function pcTabSales(){
  var p=_pcProduct;
  var entries=[];
  orders.forEach(function(o){
    if(o.status==='Quote')return;
    (o.items||[]).forEach(function(i){
      if(i.id===p.id||(i.model&&p.model&&i.model===p.model)){
        entries.push({invoice:o.id,date:o.date,customer:o.customer,clerk:o.clerk||'—',qty:i.qty,price:i.price,serial:i.serial||'',discount:i.discountPct||i.discount||0});
      }
    });
  });
  var totalUnits=entries.reduce(function(s,e){return s+e.qty;},0);
  var totalRev=entries.reduce(function(s,e){return s+e.price*e.qty;},0);
  var avgPrice=entries.length?totalRev/totalUnits:0;
  var avgDisc=entries.length?(entries.reduce(function(s,e){return s+(e.discount||0);},0)/entries.length):0;
  var h='<div class="pc-section">';
  h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">';
  h+='<div class="pc-stat"><div class="pc-stat-val">'+totalUnits+'</div><div class="pc-stat-lbl">Units Sold</div></div>';
  h+='<div class="pc-stat"><div class="pc-stat-val">'+fmt(totalRev)+'</div><div class="pc-stat-lbl">Revenue</div></div>';
  h+='<div class="pc-stat"><div class="pc-stat-val">'+fmt(avgPrice)+'</div><div class="pc-stat-lbl">Avg Price</div></div>';
  h+='<div class="pc-stat"><div class="pc-stat-val">'+(avgDisc>0?avgDisc.toFixed(1)+'%':'—')+'</div><div class="pc-stat-lbl">Avg Discount</div></div>';
  h+='</div>';
  if(!entries.length){h+='<div style="text-align:center;padding:20px;color:#9ca3af;font-size:11px;">No sales found for this product</div>';}
  else{
    h+='<table class="pc-tbl"><thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Salesperson</th><th>Qty</th><th>Price</th><th>Serial</th><th>Disc</th></tr></thead><tbody>';
    entries.sort(function(a,b){return new Date(b.date)-new Date(a.date);});
    entries.forEach(function(e){
      h+='<tr><td><a class="pc-link" onclick="closeProductCard();printInvoice(\''+e.invoice+'\')">'+e.invoice+'</a></td><td>'+new Date(e.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'2-digit'})+'</td><td><a class="pc-link" onclick="closeProductCard();openCustomerProfile(\''+e.customer.replace(/'/g,"\\'")+'\')">'+e.customer+'</a></td><td>'+e.clerk+'</td><td>'+e.qty+'</td><td>'+fmt(e.price)+'</td><td style="font-family:monospace;font-size:10px;">'+(e.serial||'—')+'</td><td>'+(e.discount?e.discount+'%':'—')+'</td></tr>';
    });
    h+='</tbody></table>';
  }
  h+='</div>';
  return h;
}

// ── TAB 6: STOCK LEVELS ──
function pcTabStock(){
  var p=_pcProduct;
  var now=new Date();
  var thisMonth=now.toISOString().slice(0,7);
  // Units sold this month
  var soldThisMonth=0;
  orders.forEach(function(o){
    if(o.status==='Quote'||!o.date)return;
    if(o.date.slice(0,7)!==thisMonth)return;
    (o.items||[]).forEach(function(i){if(i.id===p.id||(i.model&&p.model&&i.model===p.model))soldThisMonth+=i.qty;});
  });
  // Units received this month
  var recvThisMonth=0;
  var pos=(typeof purchaseOrders!=='undefined')?purchaseOrders:[];
  pos.forEach(function(po){
    if(!po.receivedDate||po.receivedDate.slice(0,7)!==thisMonth)return;
    (po.items||[]).forEach(function(item){
      if(item.productId===p.id||(item.model&&p.model&&item.model===p.model))recvThisMonth+=(item.qtyReceived||0);
    });
  });
  // Units on open POs
  var onOrder=0;
  pos.forEach(function(po){
    if(po.status!=='Pending'&&po.status!=='Partially Received')return;
    (po.items||[]).forEach(function(item){
      if(item.productId===p.id||(item.model&&p.model&&item.model===p.model))onOrder+=Math.max(0,(item.qtyOrdered||0)-(item.qtyReceived||0));
    });
  });
  var stock=p.stock||0;
  var statusBadge,statusColor;
  if(stock<=0){statusBadge='Out of Stock';statusColor='background:#fee2e2;color:#dc2626';}
  else if(stock<(p.reorderPt||0)){statusBadge='Low Stock';statusColor='background:#fef3c7;color:#92400e';}
  else{statusBadge='In Stock';statusColor='background:#dcfce7;color:#16a34a';}
  if(stock<0){statusBadge='Oversold';statusColor='background:#fee2e2;color:#dc2626';}

  var h='<div class="pc-section">';
  h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;"><span class="pc-badge" style="font-size:12px;padding:6px 14px;'+statusColor+'">'+statusBadge+'</span></div>';
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">';
  h+='<div class="pc-stat"><div class="pc-stat-val">'+stock+'</div><div class="pc-stat-lbl">On Hand</div></div>';
  h+='<div class="pc-stat"><div class="pc-stat-val">'+soldThisMonth+'</div><div class="pc-stat-lbl">Sold This Month</div></div>';
  h+='<div class="pc-stat"><div class="pc-stat-val">'+recvThisMonth+'</div><div class="pc-stat-lbl">Received This Month</div></div>';
  h+='</div>';
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">';
  h+='<div class="pc-stat"><div class="pc-stat-val" style="color:#2563eb;">'+onOrder+'</div><div class="pc-stat-lbl">On Order (PO)</div></div>';
  h+='<div class="pc-stat"><div class="pc-stat-val">'+(p.reorderPt||0)+'</div><div class="pc-stat-lbl">Min Qty Threshold</div></div>';
  h+='<div class="pc-stat"><div class="pc-stat-val">'+(p.reorderQty||0)+'</div><div class="pc-stat-lbl">Reorder Qty</div></div>';
  h+='</div>';
  // Simple 6-month stock chart
  h+='<div class="pc-section-title">Stock Trend (6 Months)</div>';
  h+='<div style="display:flex;align-items:flex-end;gap:4px;height:100px;padding:10px 0;">';
  var months=[];
  for(var m=5;m>=0;m--){
    var d=new Date(now.getFullYear(),now.getMonth()-m,1);
    var ym=d.toISOString().slice(0,7);
    var label=d.toLocaleDateString('en-US',{month:'short'});
    var sold=0,recv=0;
    orders.forEach(function(o){if(o.date&&o.date.slice(0,7)===ym)(o.items||[]).forEach(function(i){if(i.id===p.id||(i.model&&p.model&&i.model===p.model))sold+=i.qty;});});
    pos.forEach(function(po){if(po.receivedDate&&po.receivedDate.slice(0,7)===ym)(po.items||[]).forEach(function(item){if(item.productId===p.id||(item.model&&p.model&&item.model===p.model))recv+=(item.qtyReceived||0);});});
    months.push({label:label,sold:sold,recv:recv,net:recv-sold});
  }
  var maxVal=Math.max(1,Math.max.apply(null,months.map(function(m){return Math.max(m.sold,m.recv);})));
  months.forEach(function(m){
    var sh=Math.max(2,m.sold/maxVal*70);
    var rh=Math.max(2,m.recv/maxVal*70);
    h+='<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">';
    h+='<div style="display:flex;gap:2px;align-items:flex-end;height:70px;">';
    h+='<div style="width:12px;height:'+rh+'px;background:#93c5fd;border-radius:2px 2px 0 0;" title="Received: '+m.recv+'"></div>';
    h+='<div style="width:12px;height:'+sh+'px;background:#fca5a5;border-radius:2px 2px 0 0;" title="Sold: '+m.sold+'"></div>';
    h+='</div>';
    h+='<div style="font-size:9px;color:#6b7280;">'+m.label+'</div>';
    h+='</div>';
  });
  h+='</div>';
  h+='<div style="display:flex;gap:12px;justify-content:center;font-size:9px;color:#6b7280;margin-top:4px;"><span><span style="display:inline-block;width:8px;height:8px;background:#93c5fd;border-radius:1px;"></span> Received</span><span><span style="display:inline-block;width:8px;height:8px;background:#fca5a5;border-radius:1px;"></span> Sold</span></div>';
  h+='</div>';
  return h;
}
