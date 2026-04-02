// ══════════════════════════════════════════════
// POS CUSTOMERS MODULE
// ══════════════════════════════════════════════

// ── CUSTOMERS ──
var customers=[];
async function loadCustomers(){
  try{var r=await fetch('/api/admin-get?key=customers');var d=await r.json();if(d&&d.data&&Array.isArray(d.data))customers=d.data;}catch(e){}
  custUpdateBadge();
}
async function saveCustomers(){
  try{await fetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'customers',data:customers})});}catch(e){}
}
// ── CUSTOMER TAB ──
var _custSelectedIdx=-1;
function custUpdateBadge(){var b=document.getElementById('cust-tab-badge');if(b)b.textContent=customers.length;}
function custFilterList(){
  var q=(document.getElementById('cust-search')||{}).value.toLowerCase();
  var filtered=customers.map(function(c,i){c._idx=i;return c;}).filter(function(c){
    return !q||c.name.toLowerCase().includes(q)||(c.phone||'').includes(q)||(c.email||'').toLowerCase().includes(q)||(c.city||'').toLowerCase().includes(q)||(c.address||'').toLowerCase().includes(q);
  });
  document.getElementById('cust-count').textContent=filtered.length+' of '+customers.length+' customers';
  var rows=document.getElementById('cust-rows');
  rows.innerHTML=filtered.slice(0,200).map(function(c){
    var lastPurchase=custGetLastPurchase(c.name);
    var totalSpend=custGetTotalSpend(c.name);
    return '<div class="cust-row'+(c._idx===_custSelectedIdx?' active':'')+'" onclick="custSelect('+c._idx+')">'
      +'<div><div class="cust-row-name">'+c.name+'</div><div class="cust-row-meta">'+(c.phone||'—')+' &middot; '+(c.city||'')+'</div></div>'
      +'<div class="cust-row-right"><div class="cust-row-total">'+fmt(totalSpend)+'</div><div class="cust-row-date">'+(lastPurchase||'No purchases')+'</div></div></div>';
  }).join('');
}
function custGetLastPurchase(name){
  var o=orders.find(function(x){return x.customer===name&&x.status!=='Quote';});
  return o?o.date.slice(0,10):'';
}
function custGetTotalSpend(name){
  return orders.filter(function(x){return x.customer===name&&x.status!=='Quote';}).reduce(function(s,o){return s+(o.total||0);},0);
}
function custSelect(idx){
  _custSelectedIdx=idx;
  var c=customers[idx];if(!c)return;
  custFilterList();
  var det=document.getElementById('cust-detail');
  var custOrders=orders.filter(function(o){return o.customer===c.name&&o.status!=='Quote';});
  var totalSpend=custOrders.reduce(function(s,o){return s+(o.total||0);},0);
  var lastDel=custOrders.find(function(o){return o.shipTo&&o.shipTo.addr;});
  var h='<div class="cust-profile-hdr"><div><div class="cust-profile-name">'+c.name+'</div><div class="cust-profile-num">Customer #'+(c.customerNum||'N/A')+'</div></div><button class="primary-btn" onclick="custEdit('+idx+')">Edit</button></div>';
  // Contact info
  h+='<div class="cust-info-grid">';
  h+='<div class="cust-info-item"><div class="cust-info-label">Phone</div><div class="cust-info-val">'+(c.phone||'—')+'</div></div>';
  h+='<div class="cust-info-item"><div class="cust-info-label">Email</div><div class="cust-info-val">'+(c.email||'—')+'</div></div>';
  h+='<div class="cust-info-item"><div class="cust-info-label">Address</div><div class="cust-info-val">'+(c.address||'—')+'</div></div>';
  h+='<div class="cust-info-item"><div class="cust-info-label">City / State / Zip</div><div class="cust-info-val">'+(c.city||'')+', '+(c.state||'')+' '+(c.zip||'')+'</div></div>';
  if(lastDel)h+='<div class="cust-info-item" style="grid-column:1/-1;"><div class="cust-info-label">Last Delivery Address</div><div class="cust-info-val">'+lastDel.shipTo.name+' — '+lastDel.shipTo.addr+', '+lastDel.shipTo.city+'</div></div>';
  h+='</div>';
  // Lifetime stats
  h+='<div class="cust-lifetime">';
  h+='<div class="cust-lifetime-stat"><div class="cust-lifetime-val">'+fmt(totalSpend)+'</div><div class="cust-lifetime-label">Lifetime Spend</div></div>';
  h+='<div class="cust-lifetime-stat"><div class="cust-lifetime-val">'+custOrders.length+'</div><div class="cust-lifetime-label">Total Orders</div></div>';
  h+='<div class="cust-lifetime-stat"><div class="cust-lifetime-val">'+(custOrders.length?fmt(totalSpend/custOrders.length):'$0')+'</div><div class="cust-lifetime-label">Avg Order</div></div>';
  h+='</div>';
  // Notes
  h+='<div class="cust-history-title">Notes</div>';
  h+='<textarea class="cust-notes" id="cust-notes-inp" placeholder="Customer notes...">'+(c.notes||'')+'</textarea>';
  h+='<button class="ghost-btn" onclick="custSaveNotes('+idx+')" style="margin-bottom:16px;">Save Notes</button>';
  // Sales history
  h+='<div class="cust-history-title">Sales History ('+custOrders.length+')</div>';
  if(custOrders.length){
    h+='<table class="admin-table" style="font-size:11px;"><thead><tr><th>Invoice</th><th>Date</th><th>Items</th><th>Clerk</th><th style="text-align:right;">Total</th></tr></thead><tbody>';
    custOrders.forEach(function(o){
      var items=(o.items||[]).map(function(i){return i.name;}).join(', ');
      if(items.length>60)items=items.slice(0,57)+'...';
      h+='<tr><td style="font-weight:600;">'+o.id+'</td><td>'+o.date.slice(0,10)+'</td><td style="font-size:10px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+items+'</td><td>'+(o.clerk||'—')+'</td><td style="text-align:right;font-weight:600;">'+fmt(o.total)+'</td></tr>';
    });
    h+='</tbody></table>';
  } else h+='<div style="color:#9ca3af;font-size:12px;">No purchase history</div>';
  det.innerHTML=h;
}
function custEdit(idx){
  var c=customers[idx];if(!c)return;
  var name=prompt('Name:',c.name);if(!name)return;
  var phone=prompt('Phone:',c.phone||'')||'';
  var email=prompt('Email:',c.email||'')||'';
  var addr=prompt('Address:',c.address||'')||'';
  var city=prompt('City:',c.city||'')||'';
  var state=prompt('State:',c.state||'')||'';
  var zip=prompt('Zip:',c.zip||'')||'';
  c.name=name.trim();c.phone=phone.trim();c.email=email.trim();c.address=addr.trim();c.city=city.trim();c.state=state.trim();c.zip=zip.trim();
  saveCustomers();custSelect(idx);custFilterList();toast('Customer updated','success');
}
function custSaveNotes(idx){
  var c=customers[idx];if(!c)return;
  c.notes=(document.getElementById('cust-notes-inp')||{}).value||'';
  saveCustomers();toast('Notes saved','success');
}
function custAddNew(){
  var name=prompt('New customer name:');if(!name||!name.trim())return;
  var phone=prompt('Phone:','')||'';
  var email=prompt('Email:','')||'';
  var addr=prompt('Address:','')||'';
  var city=prompt('City:','')||'';
  var state=prompt('State:','KS')||'';
  var zip=prompt('Zip:','')||'';
  customers.push({name:name.trim(),phone:phone.trim(),email:email.trim(),address:addr.trim(),city:city.trim(),state:state.trim(),zip:zip.trim(),customerNum:'NEW-'+Date.now(),notes:''});
  saveCustomers();custUpdateBadge();custFilterList();toast('Customer added','success');
}
function custInit(){custUpdateBadge();custFilterList();}

// ── CART CUSTOMER SEARCH DROPDOWN ──
var _cartCustDDOpen=false;
function cartCustSearch(){
  var q=(document.getElementById('cart-sold-name')||{}).value.trim().toLowerCase();
  var dd=document.getElementById('cart-cust-dd');
  if(q.length<2){dd.classList.remove('open');return;}
  var matches=customers.filter(function(c){return c.name.toLowerCase().includes(q)||(c.phone||'').includes(q);}).slice(0,8);
  if(!matches.length){dd.innerHTML='<div class="cart-cust-dd-opt" style="color:#9ca3af;">No matching customers</div>';dd.classList.add('open');return;}
  dd.innerHTML=matches.map(function(c,i){
    return '<div class="cart-cust-dd-opt" onmousedown="cartCustSelect('+customers.indexOf(c)+')"><div class="cco-name">'+c.name+'</div><div class="cco-meta">'+(c.phone||'')+(c.city?' &middot; '+c.city:'')+'</div></div>';
  }).join('');
  dd.classList.add('open');
}
function cartCustSelect(idx){
  var c=customers[idx];if(!c)return;
  document.getElementById('cart-sold-name').value=c.name;
  document.getElementById('cart-sold-addr').value=c.address||'';
  document.getElementById('cart-sold-city').value=c.city||'';
  document.getElementById('cart-sold-state').value=c.state||'';
  document.getElementById('cart-sold-zip').value=c.zip||'';
  document.getElementById('cart-sold-phone').value=c.phone||'';
  document.getElementById('cart-cust-dd').classList.remove('open');
  toast('Customer loaded: '+c.name,'info');
}
// Close dropdown on blur (delayed)
document.addEventListener('click',function(e){
  var dd=document.getElementById('cart-cust-dd');
  if(dd&&!dd.contains(e.target)&&e.target.id!=='cart-sold-name')dd.classList.remove('open');
});

// ── CUSTOMER SAVE/UPDATE ON CHECKOUT ──
function custCheckAndSave(order){
  var name=order.customer;if(!name||name==='Walk-In Customer')return;
  var existing=customers.find(function(c){return c.name===name;});
  var f=order.soldTo||{};
  if(existing){
    // Check if info changed
    var changed=false;
    if(f.phone&&f.phone!==existing.phone)changed=true;
    if(f.addr&&f.addr!==existing.address)changed=true;
    if(f.city&&f.city!==existing.city)changed=true;
    if(f.state&&f.state!==existing.state)changed=true;
    if(f.zip&&f.zip!==existing.zip)changed=true;
    if(changed){
      if(confirm('Customer info for "'+name+'" has changed. Update their record?\n\nNew: '+(f.addr||'')+', '+(f.city||'')+' '+(f.state||'')+' '+(f.zip||'')+'\nPhone: '+(f.phone||''))){
        if(f.phone)existing.phone=f.phone;
        if(f.addr)existing.address=f.addr;
        if(f.city)existing.city=f.city;
        if(f.state)existing.state=f.state;
        if(f.zip)existing.zip=f.zip;
        saveCustomers();toast('Customer record updated','success');
      }
    }
  } else {
    // New customer — auto-save
    customers.push({name:name,phone:f.phone||'',email:'',address:f.addr||'',city:f.city||'',state:f.state||'',zip:f.zip||'',customerNum:'NEW-'+Date.now(),notes:''});
    saveCustomers();custUpdateBadge();
  }
}

// ── CUSTOMER CSV UPLOAD ──
var custCsvParsed=[];
function custCsvReset(){custCsvParsed=[];document.getElementById('cust-csv-preview').style.display='none';document.getElementById('cust-csv-import-btn').style.display='none';document.getElementById('cust-csv-error').style.display='none';var fi=document.getElementById('cust-csv-input');if(fi)fi.value='';}
function custCsvHandleFile(file){
  if(!file)return;custCsvReset();
  var reader=new FileReader();
  reader.onload=function(e){
    var lines=e.target.result.split(/\r?\n/).filter(function(l){return l.trim();});
    if(lines.length<2){document.getElementById('cust-csv-error').style.display='block';document.getElementById('cust-csv-error').textContent='CSV must have a header row and at least one data row.';return;}
    var hdr=lines[0].split(',').map(function(h){return h.trim().replace(/^"|"$/g,'').toLowerCase();});
    var colMap={name:-1,phone:-1,email:-1,address:-1,history:-1};
    hdr.forEach(function(h,i){
      if(h.match(/name|customer/i))colMap.name=i;
      else if(h.match(/phone|tel/i))colMap.phone=i;
      else if(h.match(/email|e-mail/i))colMap.email=i;
      else if(h.match(/address|addr/i))colMap.address=i;
      else if(h.match(/history|purchase|notes/i))colMap.history=i;
    });
    custCsvParsed=[];
    for(var i=1;i<lines.length;i++){
      var cols=csvParseLine(lines[i]);
      var row={name:cols[colMap.name]||'',phone:cols[colMap.phone]||'',email:cols[colMap.email]||'',address:cols[colMap.address]||'',history:cols[colMap.history]||'',status:'new'};
      if(!row.name){row.status='error';}
      else{var dup=customers.find(function(c){return c.name===row.name&&c.phone===row.phone;});if(dup)row.status='update';}
      custCsvParsed.push(row);
    }
    document.getElementById('cust-csv-count').textContent=custCsvParsed.length;
    document.getElementById('cust-csv-tbody').innerHTML=custCsvParsed.map(function(r){
      var sc=r.status==='error'?'color:var(--red)':r.status==='update'?'color:var(--orange)':'color:var(--green)';
      var sl=r.status==='error'?'Error':r.status==='update'?'Exists':'New';
      return '<tr><td>'+r.name+'</td><td>'+r.phone+'</td><td>'+r.email+'</td><td>'+r.address+'</td><td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;">'+r.history+'</td><td style="'+sc+';font-weight:700;font-size:10px;">'+sl+'</td></tr>';
    }).join('');
    document.getElementById('cust-csv-preview').style.display='block';
    document.getElementById('cust-csv-import-btn').style.display='inline-block';
  };
  reader.readAsText(file);
}
function custCsvImport(){
  var added=0;
  custCsvParsed.forEach(function(r){
    if(r.status==='error'||r.status==='update')return;
    customers.push({id:customers.length+1,name:r.name,phone:r.phone,email:r.email,address:r.address,history:r.history});added++;
  });
  saveCustomers();custUpdateBadge();custFilterList();
  closeModal('cust-csv-modal');custCsvReset();
  toast(added+' customers imported','success');
}
