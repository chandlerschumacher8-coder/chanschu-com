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
    +'<div style="background:#1a2744;padding:24px 32px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:22px;">DC Appliance</h1><p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Delivery Confirmation</p></div>'
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
    +'<div style="background:#1a2744;padding:24px 32px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:22px;">DC Appliance</h1><p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Invoice / Receipt</p></div>'
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
function renderInventory(){
  var s=(document.getElementById('inv-search')||{}).value||'';s=s.toLowerCase();
  var hasSearch=s.length>0;
  var filtered=PRODUCTS.filter(function(p){
    var isActive=p.active!==false;
    var matchesSearch=!s||p.name.toLowerCase().includes(s)||p.brand.toLowerCase().includes(s)||(p.model||'').toLowerCase().includes(s)||(p.upc||'').toLowerCase().includes(s);
    if(hasSearch) return matchesSearch; // search shows both
    return matchesSearch&&(invViewMode==='active'?isActive:!isActive);
  });
  var tb=document.getElementById('inv-tbody');
  tb.innerHTML=filtered.map(function(p){
    var isActive=p.active!==false;
    var sold=p.sold||0;
    var availMinusSold=Math.max(0,p.stock-sold);
    var sc=availMinusSold<=0?'sp-out':availMinusSold<=p.reorderPt?'sp-low':'sp-in';
    var sl=availMinusSold<=0?'Out of Stock':availMinusSold<=p.reorderPt?'Low Stock':'In Stock';
    var dept=getProductDept(p);
    var badge=hasSearch?'<span class="inv-active-badge '+(isActive?'active-badge':'inactive-badge')+'">'+(isActive?'Active':'Inactive')+'</span>':'';
    var actBtn=isActive?
      '<button class="inv-act-btn deactivate" onclick="invDeactivate('+p.id+')">Deactivate</button>':
      '<button class="inv-act-btn activate" onclick="invActivate('+p.id+')">Activate</button>';
    var snBadge=isSerialTracked(p)?'<span style="font-size:8px;font-weight:700;background:#dbeafe;color:#1d4ed8;padding:1px 5px;border-radius:3px;margin-left:4px;">SN</span>':'';
    return '<tr'+(isActive?'':' style="opacity:0.6;"')+'><td>'+(p.model||'')+'</td><td>'+p.name+snBadge+badge+'</td><td>'+p.brand+'</td><td style="font-size:10px;">'+dept+'</td><td style="font-size:10px;">'+(p.cat||'')+'</td><td style="font-size:10px;color:#6b7280;">'+(p.upc||'')+'</td><td>'+p.stock+'</td><td>'+sold+'</td><td style="font-weight:700;">'+availMinusSold+'</td><td><span class="status-pill '+sc+'">'+sl+'</span></td><td>'+fmt(p.price)+'</td><td>'+fmt(p.cost)+'</td><td>'+actBtn+'</td></tr>';
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
// Categories that require serial number tracking by default
var SERIAL_TRACKED_CATS=['BOTTOM MOUNT FRIDGE','BUILT IN','COMBO WASHER DRYER','COOK TOP','DISHWASHERS','DRYERS','FREEZER','FRENCH DOOR FRIDGE','ICEMKR','RANGES','SIDE BY SIDE FRIDGE','TOP MOUNT','TRASH COMPACTOR','WASHERS','BEVERAGE CENTER','Refrigerators','Washers & Dryers','Dishwashers','Ovens & Ranges','Wall Ovens'];

function isSerialTracked(p){
  if(p.serialTracked!==undefined)return !!p.serialTracked;
  // Default: true for major appliance categories
  return SERIAL_TRACKED_CATS.indexOf(p.cat)!==-1;
}

function populateVendorDropdown(selId){
  var sel=document.getElementById(selId);if(!sel)return;
  var val=sel.value;sel.innerHTML='<option value="">— Select —</option>';
  (typeof adminVendors!=='undefined'?adminVendors:[]).forEach(function(v){sel.innerHTML+='<option value="'+v.name+'">'+v.name+'</option>';});
  if(val)sel.value=val;
}

function addProduct(){
  var sku=document.getElementById('ap-sku').value.trim(),name=document.getElementById('ap-name').value.trim(),brand=document.getElementById('ap-brand').value.trim();
  if(!sku||!name||!brand){toast('Fill in required fields','error');return;}
  var stEl=document.getElementById('ap-serial-tracked');
  PRODUCTS.push({id:PRODUCTS.length+100,sku:sku,name:name,brand:brand,cat:document.getElementById('ap-cat').value,price:parseFloat(document.getElementById('ap-price').value)||0,cost:parseFloat(document.getElementById('ap-cost').value)||0,stock:parseInt(document.getElementById('ap-stock').value)||0,reorderPt:parseInt(document.getElementById('ap-reorder').value)||2,reorderQty:parseInt(document.getElementById('ap-reorderqty').value)||3,sales30:0,serial:document.getElementById('ap-serial').value,warranty:document.getElementById('ap-warranty').value,icon:'&#x1F4E6;',serialTracked:stEl?stEl.checked:true,upc:(document.getElementById('ap-upc')||{}).value||'',vendor:(document.getElementById('ap-vendor')||{}).value||'',serialPool:[]});
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
function renderOrders(){
  var filters=['All','Awaiting Delivery','Awaiting Product','Partial','Quote'];
  document.getElementById('oo-toolbar').innerHTML=filters.map(function(f){
    return '<button class="oo-filter'+(f===ooFilter?' active':'')+'" onclick="ooFilter=\''+f+'\';renderOrders();">'+f+'</button>';
  }).join('');
  var filtered=orders.filter(function(o){return ooFilter==='All'||o.status===ooFilter;});
  document.getElementById('oo-list').innerHTML=filtered.length?filtered.map(function(o){
    var isQuote=o.status==='Quote';
    var sc=isQuote?'':o.status==='Awaiting Delivery'?'del-sb-scheduled':o.status==='Awaiting Product'?'del-sb-out':'del-sb-delivered';
    var badge=isQuote?'<span class="oo-quote-badge">Quote</span>':'<span class="del-status-badge '+sc+'">'+o.status+'</span>';
    return '<div class="oo-card'+(selectedOrder&&selectedOrder.id===o.id?' active':'')+'" onclick="selectOrder(\''+o.id+'\')"><div class="oo-card-id">'+o.id+'</div><div class="oo-card-name">'+o.customer+'</div><div class="oo-card-row">'+badge+'<span class="oo-card-total">'+fmt(o.total)+'</span></div></div>';
  }).join(''):'<div style="text-align:center;color:var(--gray-2);padding:30px;font-size:12px;">No orders found</div>';
  if(selectedOrder)renderOrderDetail();
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
    return '<div class="ood-item" style="flex-wrap:wrap;"><div class="ood-item-info"><div class="ood-item-name">'+i.name+'</div><div class="ood-item-meta">'+(i.model||'')+' x '+i.qty+(inStock?' <span style="color:var(--green);">In Stock</span>':' <span style="color:var(--red);">Low/Out</span>')+'</div></div><div class="ood-item-price">'+fmt(i.price*i.qty)+'</div><div style="width:100%;">'+deliveryHtml+'</div></div>';
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
    actionsHtml+='<button class="ood-btn green" onclick="setOrderStatus(\''+o.id+'\',\'Awaiting Delivery\')">Awaiting Delivery</button><button class="ood-btn orange" onclick="setOrderStatus(\''+o.id+'\',\'Awaiting Product\')">Awaiting Product</button><button class="ood-btn blue" onclick="setOrderStatus(\''+o.id+'\',\'Partial\')">Partial</button><button class="ood-btn" style="border-color:#c4b5fd;color:#6d28d9;" onclick="emailOrderReceipt(\''+o.id+'\')">&#x2709; Email Receipt</button><button class="ood-btn" style="border-color:rgba(201,151,58,0.3);color:var(--gold);" onclick="printInvoice(\''+o.id+'\')">Print Invoice</button><button class="ood-btn" style="border-color:rgba(224,144,80,0.3);color:var(--orange);" onclick="printShipperTicket(\''+o.id+'\')">Print Shipper</button><button class="ood-btn red" onclick="deleteOrder(\''+o.id+'\')">Delete</button></div>';
  }
  el.innerHTML='<div class="ood-hdr"><div class="ood-title">'+o.id+(isQuote?' <span class="oo-quote-badge">Quote</span>':'')+'</div><div class="ood-meta">'+o.customer+' &middot; '+new Date(o.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+'</div></div>'+
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
  var html=buildInvoiceEmailHtml(o);
  var res=await sendDcEmail(custEmail,o.customer,'Invoice '+o.id+' — DC Appliance',html);
  if(res.ok){
    if(!o.emailLog)o.emailLog=[];
    o.emailLog.push({ts:new Date().toISOString(),to:custEmail,type:'invoice_receipt',by:currentEmployee?currentEmployee.name:'Admin'});
    saveOrders();renderOrderDetail();
    toast('Receipt sent to '+custEmail,'success');
  }else{toast('Failed: '+(res.error||'Unknown error'),'error');}
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
function setOrderStatus(id,status){var o=orders.find(function(x){return x.id===id;});if(o){o.status=status;saveOrders();renderOrders();toast('Status updated','success');}}
function deleteOrder(id){if(!confirm('Delete this order?'))return;orders=orders.filter(function(o){return o.id!==id;});selectedOrder=null;saveOrders();renderOrders();renderOrderDetail();toast('Order deleted','info');}
function printAddrBlock(label,addr){
  if(!addr||!addr.name)return '';
  return '<div style="margin-bottom:8px;"><div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#888;margin-bottom:2px;">'+label+'</div><div style="font-weight:700;">'+addr.name+'</div>'+(addr.addr?'<div>'+addr.addr+'</div>':'')+(addr.city?'<div>'+addr.city+(addr.state?', '+addr.state:'')+' '+(addr.zip||'')+'</div>':'')+(addr.phone?'<div>'+addr.phone+'</div>':'')+'</div>';
}
function printInvoice(id){
  var o=orders.find(function(x){return x.id===id;});if(!o)return;
  var isQuote=o.status==='Quote';
  var itemRows=o.items.map(function(i){return '<tr><td>'+(i.model||'')+'</td><td>'+i.name+(i.serial?'<div style="font-size:10px;color:#888;">SN: '+i.serial+'</div>':'')+'</td><td style="text-align:center;">'+i.qty+'</td><td style="text-align:right;">'+fmt(Math.abs(i.price))+'</td><td style="text-align:right;">'+fmt(i.price*i.qty)+'</td></tr>';}).join('');
  var html='<!DOCTYPE html><html><head><title>'+(isQuote?'Quote':'Invoice')+' '+o.id+'</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:20px;max-width:800px;margin:0 auto;}h1{font-size:18px;margin-bottom:2px;}table{width:100%;border-collapse:collapse;margin:12px 0;}th{background:#222;color:#fff;font-size:10px;text-transform:uppercase;padding:6px 8px;text-align:left;}td{padding:6px 8px;border-bottom:1px solid #ddd;}.totals{margin-top:12px;text-align:right;}.totals div{margin:3px 0;font-size:13px;}.totals .grand{font-size:16px;font-weight:700;}.notes{margin-top:16px;padding:10px;background:#f5f5f5;border-left:3px solid #999;font-size:11px;}.inv-msg{margin-top:20px;text-align:center;font-size:13px;font-weight:700;color:#555;padding:12px;border-top:1px solid #ddd;}@media print{@page{margin:10mm;}}</style></head><body>';
  html+='<h1>DC Appliance — '+(isQuote?'Quote':'Invoice')+'</h1>';
  html+='<div style="font-size:11px;color:#555;margin-bottom:12px;">(620) 371-6417 &middot; Dodge City, KS</div>';
  // Header info
  var hdrRight='<div style="text-align:right;font-size:11px;color:#555;">'+(o.taxZone?'Tax: '+o.taxZone+'<br/>':'')+(o.clerk?'Clerk: '+o.clerk+'<br/>':'')+(o.po?'PO#: '+o.po+'<br/>':'')+(o.job?'Job#: '+o.job+'<br/>':'')+'</div>';
  html+='<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><div style="font-size:11px;color:#555;">'+o.id+' &middot; '+new Date(o.date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})+'</div>'+hdrRight+'</div>';
  // Addresses
  html+='<div style="display:flex;gap:30px;margin-bottom:12px;">';
  html+=printAddrBlock('Sold To',o.soldTo||{name:o.customer});
  if(o.shipTo&&o.shipTo.name)html+=printAddrBlock('Ship To',o.shipTo);
  html+='</div>';
  html+='<table><thead><tr><th>Model #</th><th>Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th><th style="text-align:right;">Total</th></tr></thead><tbody>'+itemRows+'</tbody></table>';
  html+='<div class="totals"><div>Subtotal: '+fmt(o.subtotal)+'</div><div>Tax: '+fmt(o.tax)+'</div><div class="grand">Total: '+fmt(o.total)+'</div></div>';
  if(o.invoiceNotes)html+='<div class="notes"><strong>Notes:</strong> '+o.invoiceNotes+'</div>';
  if(adminInvoiceMessage)html+='<div class="inv-msg">'+adminInvoiceMessage+'</div>';
  html+='</body></html>';
  var win=window.open('','_blank');win.document.write(html);win.document.close();setTimeout(function(){win.print();},300);
}
function printShipperTicket(id){
  var o=orders.find(function(x){return x.id===id;});if(!o)return;
  var html='<!DOCTYPE html><html><head><title>Shipper Ticket '+o.id+'</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:20px;max-width:800px;margin:0 auto;}h1{font-size:18px;margin-bottom:2px;}table{width:100%;border-collapse:collapse;margin:12px 0;}th{background:#222;color:#fff;font-size:10px;text-transform:uppercase;padding:6px 8px;text-align:left;}td{padding:6px 8px;border-bottom:1px solid #ddd;}.notes{margin-top:16px;padding:10px;background:#fff3e0;border-left:3px solid #e65100;font-size:11px;}.sn-line{border-bottom:1.5px solid #555;min-width:120px;display:inline-block;height:14px;margin-left:6px;}@media print{@page{margin:10mm;}}</style></head><body>';
  html+='<h1>DC Appliance — Shipper Ticket</h1>';
  html+='<div style="font-size:11px;color:#555;margin-bottom:12px;">INTERNAL — DO NOT GIVE TO CUSTOMER</div>';
  // Header
  html+='<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><div style="font-size:11px;color:#555;">'+o.id+' &middot; '+new Date(o.date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})+(o.clerk?' &middot; Clerk: '+o.clerk:'')+'</div></div>';
  html+='<div style="display:flex;gap:30px;margin-bottom:12px;">';
  html+=printAddrBlock('Sold To',o.soldTo||{name:o.customer});
  if(o.shipTo&&o.shipTo.name)html+=printAddrBlock('Ship To',o.shipTo);
  html+='</div>';
  html+='<table><thead><tr><th>Model #</th><th>Description</th><th style="text-align:center;">Qty</th><th>Serial #</th></tr></thead><tbody>';
  o.items.forEach(function(i){html+='<tr><td>'+(i.model||'')+'</td><td>'+i.name+'</td><td style="text-align:center;">'+i.qty+'</td><td>'+(i.serial||'<span class="sn-line"></span>')+'</td></tr>';});
  html+='</tbody></table>';
  if(o.shipperNotes)html+='<div class="notes"><strong>Shipper Notes:</strong> '+o.shipperNotes+'</div>';
  html+='<div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:11px;"><div>Delivered by: <span class="sn-line"></span></div><div>Date: <span class="sn-line"></span></div><div>Customer Signature: <span class="sn-line" style="min-width:180px;"></span></div></div>';
  html+='</body></html>';
  var win=window.open('','_blank');win.document.write(html);win.document.close();setTimeout(function(){win.print();},300);
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

function truckMapInit(){
  var el=document.getElementById('truck-map');if(!el)return;
  if(!_truckMap){
    _truckMap=L.map('truck-map',{zoomControl:true,attributionControl:false}).setView([37.753,-100.017],13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(_truckMap);
  }
  // Ensure map-hidden is removed on init so side panel is visible
  var row=document.getElementById('del-body-row');
  if(row)row.classList.remove('map-hidden');
  _truckMapVisible=true;
  var btn=document.querySelector('.truck-map-toggle');
  if(btn)btn.textContent='Hide Map';
  // invalidateSize after layout settles
  setTimeout(function(){if(_truckMap)_truckMap.invalidateSize();},100);
  truckMapLoad();
  if(_truckTimer)clearInterval(_truckTimer);
  _truckTimer=setInterval(truckMapLoad,60000);
}

async function truckMapLoad(){
  var badge=document.getElementById('truck-map-status');
  try{
    var res=await fetch('/api/trucks?_t='+Date.now(),{cache:'no-store'});var data=await res.json();
    if(!data.ok)throw new Error(data.error||'API error');
    // Clear old markers
    _truckMarkers.forEach(function(m){_truckMap.removeLayer(m);});
    _truckMarkers=[];
    var trucks=data.trucks||[];
    _truckUpdateParkState(trucks);
    var bounds=[];
    trucks.forEach(function(t){
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
    var src=data.source==='live'?'Live':'Mock';
    var now=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    if(badge)badge.textContent=trucks.length+' truck'+(trucks.length!==1?'s':'')+' \u00B7 '+src+' \u00B7 '+now;
  }catch(e){
    if(badge)badge.textContent='Error';
  }
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

// ══════════════════════════════════════════════
// DELIVERY TAB - FULL IMPLEMENTATION
// ══════════════════════════════════════════════
function delInit(){delWeekStart=getWeekStart(new Date());delLoadData();}
async function delLoadData(){
  try{var r=await fetch('/api/deliveries-get');var d=await r.json();delDeliveries=d.deliveries||[];delNextId=d.nextId||1;delNotes=Array.isArray(d.notes)?d.notes:[];delNextNoteId=d.nextNoteId||1;}catch(e){delDeliveries=[];delNotes=[];delNextId=1;delNextNoteId=1;}
  _lastDelHash=JSON.stringify({d:delDeliveries,n:delNotes});delRenderCalendar();delStartPolling();
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
  var res=await fetch('/api/ai-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:msgs,max_tokens:800})});var data=await res.json();if(!data.ok)throw new Error(data.error);
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
  html+='<div class="hdr"><div><h1>DC Appliance - Delivery Manifest</h1><div style="font-size:10px;color:#555;margin-top:2px;">'+(printTeam==='all'?'All Teams':printTeam)+' | '+selDt.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})+'</div></div><div style="font-size:10px;text-align:right;color:#555;">(620) 371-6417 | Dodge City, KS<br/>'+stops.length+' stops</div></div>';
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
  if(tf){var curVal=tf.value;tf.innerHTML='<option value="">All Techs</option>'+svcTechList.filter(function(t){return t!=='Unassigned';}).map(function(t){return '<option value="'+t+'"'+(curVal===t?' selected':'')+'>'+t+'</option>';}).join('');}
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
    '<div class="svc-assign-row" onclick="event.stopPropagation()"><label>Assign:</label><select class="svc-assign-sel" onchange="svcAssignTech(\''+j.id+'\',this.value)">'+svcTechList.map(function(t){return '<option value="'+t+'"'+(j.tech===t?' selected':'')+'>'+t+'</option>';}).join('')+'</select></div>'+
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
  var res=await fetch('/api/ai-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:msgs,max_tokens:1000})});var data=await res.json();if(!data.ok)throw new Error(data.error);
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
  var techSel=document.getElementById('svc-e-tech');techSel.innerHTML=svcTechList.map(function(t){return '<option value="'+t+'"'+(j.tech===t?' selected':'')+'>'+t+'</option>';}).join('');
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
function renderReorder(){
  var needsReorder=PRODUCTS.filter(function(p){return (p.stock-(p.sold||0))<=p.reorderPt;});
  var kpis=document.getElementById('reorder-kpis');
  var onOrder=Object.keys(reorderQtys).filter(function(k){return reorderQtys[k]>0;}).length;
  var suggestedUnits=needsReorder.reduce(function(s,p){return s+p.reorderQty;},0);
  var estCost=Object.keys(reorderQtys).reduce(function(s,k){var p=PRODUCTS.find(function(x){return x.id===parseInt(k);});return s+(p?p.cost*(reorderQtys[k]||0):0);},0);
  var pendingPOs=purchaseOrders.filter(function(po){return po.status==='Pending';}).length;
  kpis.innerHTML='<div class="reorder-kpi"><div class="reorder-kpi-val" style="color:var(--red);">'+needsReorder.length+'</div><div class="reorder-kpi-key">Below Reorder Point</div></div><div class="reorder-kpi"><div class="reorder-kpi-val" style="color:var(--orange);">'+onOrder+'</div><div class="reorder-kpi-key">In Draft</div></div><div class="reorder-kpi"><div class="reorder-kpi-val" style="color:var(--blue);">'+pendingPOs+'</div><div class="reorder-kpi-key">Pending POs</div></div><div class="reorder-kpi"><div class="reorder-kpi-val" style="color:var(--gold);">'+fmt(estCost)+'</div><div class="reorder-kpi-key">Draft Cost</div></div>';
  // Group products by brand
  var brands={};PRODUCTS.forEach(function(p){if(!brands[p.brand])brands[p.brand]=[];brands[p.brand].push(p);});
  var tb=document.getElementById('reorder-tbody');var html='';
  Object.keys(brands).sort().forEach(function(brand){
    var prods=brands[brand];
    var brandLow=prods.filter(function(p){return (p.stock-(p.sold||0))<=p.reorderPt;}).length;
    html+='<tr class="reorder-vendor-hdr"><td colspan="8"><span class="reorder-vendor-name">'+brand+'</span> <span style="font-size:10px;color:var(--gray-2);margin-left:6px;">'+prods.length+' items'+(brandLow?' | '+brandLow+' low':'')+'</span></td><td><button class="reorder-vendor-btn" onclick="createVendorPO(\''+brand.replace(/'/g,"\\'")+'\')">Create PO</button></td></tr>';
    prods.forEach(function(p){
      var ams=p.stock-(p.sold||0);
      var daysLeft=p.sales30>0?Math.round(ams/(p.sales30/30)):999;
      var sc=ams<=0?'sp-out':ams<=p.reorderPt?'sp-low':'sp-in';
      var sl=ams<=0?'Out':'Low';if(ams>p.reorderPt)sl='OK';
      var qty=reorderQtys[p.id]||0;
      html+='<tr><td>'+p.name+'</td><td>'+p.brand+'</td><td>'+ams+'</td><td>'+p.reorderPt+'</td><td>'+p.reorderQty+'</td><td>'+p.sales30+'</td><td>'+(daysLeft>365?'365+':daysLeft)+'</td><td><span class="status-pill '+sc+'">'+sl+'</span></td><td><div class="reorder-qty-ctrl"><button onclick="reorderAdj('+p.id+',-1)">-</button><span>'+qty+'</span><button onclick="reorderAdj('+p.id+',1)">+</button></div></td></tr>';
    });
  });
  tb.innerHTML=html;
  renderPO();renderPOHistory();
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
    body+='<tr><td>'+(it.model||'')+'</td><td>'+it.name+'</td><td style="text-align:center;">'+it.qtyOrdered+'</td><td><input type="number" class="recv-qty-inp" value="'+recv+'" min="0" max="'+it.qtyOrdered+'" onchange="recvSetQty('+it.productId+',parseInt(this.value)||0)" '+disabled+'/></td><td style="text-align:center;">'+back+'</td><td>'+fmt(it.unitCost)+'</td><td>'+fmt(it.unitCost*it.qtyOrdered)+'</td><td style="text-align:center;">'+icon+'</td></tr>';
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
    var res=await fetch('/api/ai-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:msgs,max_tokens:600})});
    var data=await res.json();if(!data.ok)throw new Error(data.error);
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
async function recvComplete(){
  if(!selectedPO)return;
  if(!confirm('Complete receiving for '+selectedPO.id+'? Stock will be updated.'))return;
  selectedPO.items.forEach(function(it){
    var recv=recvQtys[it.productId]||0;
    it.qtyReceived=recv;
    var p=PRODUCTS.find(function(x){return x.id===it.productId;});
    if(p)p.stock+=recv;
  });
  selectedPO.status='Received';selectedPO.receivedDate=new Date().toISOString();selectedPO.receivedBy='Admin';
  await savePOs();
  await saveProducts();
  renderRecvDetail();renderRecvList();refreshSaleView();renderInventory();
  toast(selectedPO.id+' received - stock updated','success');
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
