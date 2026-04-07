// ══════════════════════════════════════════════
// POS CUSTOMERS MODULE
// ══════════════════════════════════════════════

// ── CUSTOMERS ──
var customers=[];
async function loadCustomers(){
  try{var r=await apiFetch('/api/admin-get?key=customers');var d=await r.json();if(d&&d.data&&Array.isArray(d.data))customers=d.data;}catch(e){}
  custUpdateBadge();
}
async function saveCustomers(){
  try{await apiFetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'customers',data:customers})});}catch(e){}
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
    return '<div class="cust-row'+(c._idx===_custSelectedIdx?' active':'')+'" onclick="openCustomerProfile('+c._idx+')">'
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
  // Email actions
  h+='<div class="cust-history-title">Email Actions</div>';
  h+='<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">';
  if(c.email){
    h+='<button class="ghost-btn" style="border-color:#c4b5fd;color:#6d28d9;" onclick="custSendInvoiceEmail('+idx+')">&#x2709; Email Invoice</button>';
    h+='<button class="ghost-btn" style="border-color:#c4b5fd;color:#6d28d9;" onclick="custSendDeliveryEmail('+idx+')">&#x2709; Email Delivery Confirmation</button>';
  }else{
    h+='<div style="font-size:12px;color:#9ca3af;">No email on file — <a href="#" style="color:#2563eb;" onclick="event.preventDefault();custEditEmail('+idx+')">add email</a></div>';
  }
  if(c.emailOptOut)h+='<button class="ghost-btn" style="border-color:#fca5a5;color:#dc2626;font-size:10px;padding:3px 10px;" onclick="custToggleOptOut('+idx+')">&#x26D4; Opted Out — Click to Re-enable</button>';
  else if(c.email)h+='<button class="ghost-btn" style="font-size:10px;padding:3px 10px;color:#9ca3af;" onclick="custToggleOptOut('+idx+')">Opt Out of Emails</button>';
  h+='</div>';
  // Customer Ledger
  var payments=(c.payments||[]);
  var totalPaid=payments.reduce(function(s,p){return s+(p.amount||0);},0);
  var balance=totalSpend-totalPaid;
  h+='<div class="cust-history-title">Account Ledger</div>';
  if(balance>0){
    h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;padding:10px 14px;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;">';
    h+='<div><div style="font-size:10px;font-weight:700;color:#dc2626;text-transform:uppercase;">Balance Due</div><div style="font-size:20px;font-weight:700;color:#dc2626;">'+fmt(balance)+'</div></div>';
    h+='<button class="primary-btn" style="margin-left:auto;background:#16a34a;" onclick="custRecordPayment('+idx+')">Record Payment</button>';
    h+='</div>';
  }else{
    h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:8px 14px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;font-size:12px;font-weight:600;color:#16a34a;">&#x2713; Paid in Full</div>';
  }
  // Build ledger entries (sales + payments chronologically)
  var ledgerEntries=[];
  custOrders.forEach(function(o){ledgerEntries.push({type:'sale',date:o.date,ref:o.id,desc:(o.items||[]).map(function(i){return i.name;}).join(', '),amount:o.total,balance:0});});
  payments.forEach(function(p){ledgerEntries.push({type:'payment',date:p.date,ref:'Payment',desc:p.method+(p.recordedBy?' ('+p.recordedBy+')':''),amount:-p.amount,balance:0});});
  ledgerEntries.sort(function(a,b){return new Date(a.date)-new Date(b.date);});
  var runBal=0;ledgerEntries.forEach(function(e){runBal+=e.amount;e.balance=runBal;});

  if(ledgerEntries.length){
    h+='<div style="max-height:250px;overflow:auto;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:16px;"><table class="admin-table" style="font-size:11px;margin:0;"><thead><tr><th>Date</th><th>Type</th><th>Ref</th><th style="max-width:180px;">Description</th><th style="text-align:right;">Amount</th><th style="text-align:right;">Balance</th></tr></thead><tbody>';
    ledgerEntries.forEach(function(e){
      var color=e.type==='payment'?'color:#16a34a;':'';
      var desc=e.desc;if(desc.length>40)desc=desc.slice(0,37)+'...';
      h+='<tr><td>'+new Date(e.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'2-digit'})+'</td><td style="'+color+'font-weight:600;">'+(e.type==='payment'?'Payment':'Sale')+'</td><td>'+e.ref+'</td><td style="font-size:10px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+desc+'</td><td style="text-align:right;'+color+'font-weight:600;">'+(e.type==='payment'?'-':'')+fmt(Math.abs(e.amount))+'</td><td style="text-align:right;font-weight:700;'+(e.balance>0?'color:#dc2626;':'color:#16a34a;')+'">'+fmt(e.balance)+'</td></tr>';
    });
    h+='</tbody></table></div>';
  }

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
// ═══ CUSTOMER PROFILE MODAL ═══
var _cpIdx=-1;
var _cpTab='ledger';

function getCustomerId(c){
  if(c.cid)return c.cid;
  // Generate CID if missing
  c.cid='C'+String(Date.now()).slice(-6)+String(Math.floor(Math.random()*100)).padStart(2,'0');
  return c.cid;
}

function openCustomerProfile(idx){
  if(typeof idx==='string'){
    // Look up by name
    var i=customers.findIndex(function(c){return c.name===idx;});
    if(i<0)return;idx=i;
  }
  _cpIdx=idx;_cpTab='ledger';
  var c=customers[idx];if(!c)return;
  getCustomerId(c);
  renderCpLeft();renderCpTabs();renderCpRight();
  document.getElementById('cp-title').textContent=c.name+' — '+c.cid;
  openModal('cust-profile-modal');
}

function renderCpLeft(){
  var c=customers[_cpIdx];if(!c)return;
  var custOrders=orders.filter(function(o){return o.customer===c.name&&o.status!=='Quote';});
  var dates=custOrders.map(function(o){return o.date;}).sort();
  var firstDate=dates[0]?new Date(dates[0]).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—';
  var lastDate=dates[dates.length-1]?new Date(dates[dates.length-1]).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—';

  // Parse name into first/last
  var nameParts=(c.name||'').split(' ');
  var lname=nameParts.length>1?nameParts[nameParts.length-1]:'';
  var fname=nameParts.length>1?nameParts.slice(0,-1).join(' '):c.name||'';

  var h='<div style="background:#1f2937;color:#fff;padding:10px 12px;border-radius:6px;margin-bottom:12px;">';
  h+='<div style="font-size:9px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.7;">Customer ID</div>';
  h+='<div style="font-size:16px;font-weight:700;">'+c.cid+'</div>';
  h+='</div>';

  // Field rows
  function row(lbl,val,editFn){
    return '<div style="padding:6px 0;border-bottom:1px solid #e5e7eb;"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;">'+lbl+'</div><div style="font-size:12px;color:#1f2937;font-weight:500;margin-top:2px;">'+(val||'—')+'</div></div>';
  }
  h+=row('Name',c.name);
  h+=row('F Name',fname);
  h+=row('L Name',lname);
  h+=row('Address',c.address);
  h+='<div style="display:grid;grid-template-columns:1fr 60px 80px;gap:6px;">';
  h+=row('City',c.city);h+=row('State',c.state);h+=row('Zip',c.zip);
  h+='</div>';
  h+=row('Phone',c.phone);
  h+=row('Cell',c.cell);
  h+=row('Fax',c.fax);
  h+=row('Email',c.email);
  h+=row('AR #',c.arNum);
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">';
  h+=row('Class',c.class||'Customer');
  h+=row('Level',c.level||'Sold');
  h+='</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">';
  h+=row('Type',c.type||'Retail');
  h+=row('Flags',c.flags||'—');
  h+='</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">';
  h+=row('First Date',firstDate);
  h+=row('Last Date',lastDate);
  h+='</div>';
  h+='<button class="ghost-btn" onclick="custEdit('+_cpIdx+')" style="width:100%;margin-top:10px;">Edit Customer</button>';

  document.getElementById('cp-left-content').innerHTML=h;
}

function renderCpTabs(){
  var tabs=[
    {k:'ledger',lbl:'LEDGER'},
    {k:'quotes',lbl:'QUOTES'},
    {k:'history',lbl:'HISTORY'},
    {k:'appliances',lbl:'APPLIANCES'},
    {k:'service',lbl:'SERVICE'},
    {k:'contacts',lbl:'CONTACTS'},
    {k:'demographics',lbl:'DEMOGRAPHICS'}
  ];
  var h=tabs.map(function(t){
    var active=_cpTab===t.k?'background:#2563eb;color:#fff;':'background:#fff;color:#374151;border:1px solid #e5e7eb;';
    return '<div onclick="cpSwitchTab(\''+t.k+'\')" style="padding:8px 12px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:700;letter-spacing:0.04em;margin-bottom:4px;'+active+'">'+t.lbl+'</div>';
  }).join('');
  document.getElementById('cp-tab-list').innerHTML=h;
}

function cpSwitchTab(t){_cpTab=t;renderCpTabs();renderCpRight();}

function getCustomerLedger(c){
  // Build ledger entries: sales + payments + adjustments + notes
  var entries=[];
  var custOrders=orders.filter(function(o){return o.customer===c.name&&o.status!=='Quote';});
  custOrders.forEach(function(o){
    entries.push({date:o.date,type:'sale',desc:'Sale',invoice:o.id,service:'',charge:o.total,credit:0});
  });
  (c.payments||[]).forEach(function(p){
    var d=p.method&&(p.method.toLowerCase().indexOf('finance')>=0||p.method.toLowerCase().indexOf('months')>=0)?p.method:p.method+' Payment';
    entries.push({date:p.date,type:'payment',desc:d,invoice:p.invoice||'',service:'',charge:0,credit:p.amount});
  });
  (c.adjustments||[]).forEach(function(a){
    entries.push({date:a.date,type:'adjustment',desc:'Adjustment: '+a.memo,invoice:'',service:'',charge:a.amount>0?a.amount:0,credit:a.amount<0?Math.abs(a.amount):0});
  });
  (c.refunds||[]).forEach(function(r){
    entries.push({date:r.date,type:'refund',desc:'CC Refund'+(r.reason?' — '+r.reason:''),invoice:r.invoice||'',service:'',charge:0,credit:r.amount});
  });
  (c.ledgerNotes||[]).forEach(function(n){
    entries.push({date:n.date,type:'note',desc:'Note: '+n.memo,invoice:'',service:'',charge:0,credit:0});
  });
  entries.sort(function(a,b){return new Date(a.date)-new Date(b.date);});
  // Calculate running balance
  var running=0;
  entries.forEach(function(e){running+=(e.charge||0)-(e.credit||0);e.balance=running;});
  return entries;
}

function renderCpRight(){
  var c=customers[_cpIdx];if(!c)return;
  var el=document.getElementById('cp-right-panel');
  if(_cpTab==='ledger')el.innerHTML=renderCpLedger(c);
  else if(_cpTab==='quotes')el.innerHTML=renderCpQuotes(c);
  else if(_cpTab==='history')el.innerHTML=renderCpHistory(c);
  else if(_cpTab==='appliances')el.innerHTML=renderCpAppliances(c);
  else if(_cpTab==='service')el.innerHTML=renderCpService(c);
  else if(_cpTab==='contacts')el.innerHTML=renderCpContacts(c);
  else if(_cpTab==='demographics')el.innerHTML=renderCpDemographics(c);
}

function renderCpLedger(c){
  var entries=getCustomerLedger(c);
  var balance=entries.length?entries[entries.length-1].balance:0;
  var h='<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">';
  h+='<button class="ghost-btn" onclick="openLedgerEntry(\'refund\')">CC Refund</button>';
  h+='<button class="ghost-btn" onclick="openLedgerEntry(\'adjustment\')">Adjustment</button>';
  h+='<button class="ghost-btn" onclick="alert(\'Select a row to change date\')">Change Date</button>';
  h+='<button class="ghost-btn" onclick="openLedgerEntry(\'note\')">Make A Note</button>';
  h+='<button class="primary-btn" style="margin-left:auto;" onclick="printCustomerLedger()">Print Ledger</button>';
  h+='</div>';
  // Ledger table
  h+='<div style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">';
  h+='<table class="admin-table" style="font-size:11px;margin:0;">';
  h+='<thead><tr><th style="width:80px;">Date</th><th>Description</th><th style="width:80px;">Invoice #</th><th style="width:80px;">Service #</th><th style="width:90px;text-align:right;">Charge</th><th style="width:90px;text-align:right;">Credits</th><th style="width:90px;text-align:right;">Balance</th></tr></thead>';
  h+='<tbody>';
  if(!entries.length)h+='<tr><td colspan="7" style="text-align:center;padding:20px;color:#9ca3af;">No ledger activity</td></tr>';
  else{
    entries.forEach(function(e,i){
      var rowBg=i%2===0?'background:#fff;':'background:#f9fafb;';
      var overdue=e.balance>0&&(Date.now()-new Date(e.date))>(30*24*60*60*1000);
      if(overdue&&e.type==='sale'&&i===entries.length-1)rowBg='background:#fef2f2;';
      h+='<tr style="'+rowBg+'">';
      h+='<td>'+new Date(e.date).toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'2-digit'})+'</td>';
      h+='<td style="font-size:11px;">'+e.desc+'</td>';
      h+='<td>'+(e.invoice?'<a href="#" style="color:#2563eb;font-weight:600;" onclick="event.preventDefault();printInvoice(\''+e.invoice+'\')">'+e.invoice+'</a>':'')+'</td>';
      h+='<td>'+(e.service?'<a href="#" style="color:#2563eb;font-weight:600;">'+e.service+'</a>':'')+'</td>';
      h+='<td style="text-align:right;">'+(e.charge?fmt(e.charge):'')+'</td>';
      h+='<td style="text-align:right;color:#16a34a;font-weight:600;">'+(e.credit?fmt(e.credit):'')+'</td>';
      h+='<td style="text-align:right;font-weight:700;'+(e.balance>0?'color:#dc2626;':'color:#16a34a;')+'">'+fmt(e.balance)+'</td>';
      h+='</tr>';
    });
  }
  h+='</tbody></table>';
  h+='</div>';
  // Bottom summary
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding:12px 14px;background:'+(balance>0?'#fef2f2;border:1px solid #fca5a5;':'#f0fdf4;border:1px solid #86efac;')+'border-radius:8px;">';
  h+='<div><label style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-right:8px;">View</label><select class="sel" style="font-size:11px;padding:4px 8px;display:inline-block;width:auto;"><option>STANDARD</option><option>BY DATE</option><option>OPEN ITEMS</option></select></div>';
  h+='<div style="text-align:right;"><div style="font-size:10px;font-weight:700;color:'+(balance>0?'#dc2626':'#16a34a')+';text-transform:uppercase;">Current Balance</div><div style="font-size:22px;font-weight:800;color:'+(balance>0?'#dc2626':'#16a34a')+';">'+fmt(balance)+'</div></div>';
  h+='</div>';
  return h;
}

function renderCpQuotes(c){
  var quotes=orders.filter(function(o){return o.customer===c.name&&o.status==='Quote';});
  if(!quotes.length)return '<div style="text-align:center;padding:40px;color:#9ca3af;">No quotes saved</div>';
  var h='<div style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;"><table class="admin-table" style="font-size:11px;margin:0;"><thead><tr><th>Quote ID</th><th>Date</th><th>Items</th><th style="text-align:right;">Total</th></tr></thead><tbody>';
  quotes.forEach(function(q){
    var items=(q.items||[]).map(function(i){return i.name;}).join(', ');if(items.length>60)items=items.slice(0,57)+'...';
    h+='<tr><td style="font-weight:600;">'+q.id+'</td><td>'+q.date.slice(0,10)+'</td><td style="font-size:10px;">'+items+'</td><td style="text-align:right;font-weight:600;">'+fmt(q.total)+'</td></tr>';
  });
  h+='</tbody></table></div>';return h;
}

function renderCpHistory(c){
  var custOrders=orders.filter(function(o){return o.customer===c.name&&o.status!=='Quote';});
  var totalSpend=custOrders.reduce(function(s,o){return s+(o.total||0);},0);
  var h='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;">';
  h+='<div style="padding:12px;background:#f8fafc;border-radius:8px;text-align:center;"><div style="font-size:18px;font-weight:800;color:#1f2937;">'+fmt(totalSpend)+'</div><div style="font-size:10px;color:#6b7280;">Lifetime Spend</div></div>';
  h+='<div style="padding:12px;background:#f8fafc;border-radius:8px;text-align:center;"><div style="font-size:18px;font-weight:800;color:#1f2937;">'+custOrders.length+'</div><div style="font-size:10px;color:#6b7280;">Total Orders</div></div>';
  h+='<div style="padding:12px;background:#f8fafc;border-radius:8px;text-align:center;"><div style="font-size:18px;font-weight:800;color:#1f2937;">'+(custOrders.length?fmt(totalSpend/custOrders.length):'$0')+'</div><div style="font-size:10px;color:#6b7280;">Avg Order</div></div>';
  h+='</div>';
  if(!custOrders.length)return h+'<div style="text-align:center;padding:30px;color:#9ca3af;">No purchase history</div>';
  h+='<div style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;"><table class="admin-table" style="font-size:11px;margin:0;"><thead><tr><th>Invoice</th><th>Date</th><th>Items</th><th>Clerk</th><th style="text-align:right;">Total</th></tr></thead><tbody>';
  custOrders.forEach(function(o){
    var items=(o.items||[]).map(function(i){var ml=i.model?'<a class="pc-link" style="font-size:10px;" onclick="openProductCardByModel(\''+i.model.replace(/'/g,"\\'")+'\')">'+i.model+'</a> ':'';return ml+i.name+(i.serial?' <span style="color:#22c55e;font-weight:600;">(SN:'+i.serial+')</span>':'');}).join(', ');
    h+='<tr><td><a href="#" style="color:#2563eb;font-weight:600;" onclick="event.preventDefault();printInvoice(\''+o.id+'\')">'+o.id+'</a></td><td>'+o.date.slice(0,10)+'</td><td style="font-size:10px;">'+items+'</td><td>'+(o.clerk||'—')+'</td><td style="text-align:right;font-weight:600;">'+fmt(o.total)+'</td></tr>';
  });
  h+='</tbody></table></div>';return h;
}

function renderCpAppliances(c){
  // Combine: applianceHistory from customer record + serials from order items
  var appliances=[];
  // From customer's applianceHistory (set by delivery sync)
  (c.applianceHistory||[]).forEach(function(a){
    appliances.push({appliance:a.appliance,model:a.model,serial:a.serial,deliveredAt:a.deliveredAt,invoice:a.invoice,source:'delivery'});
  });
  // From order items with serials
  var custOrders=orders.filter(function(o){return o.customer===c.name&&o.status!=='Quote';});
  custOrders.forEach(function(o){
    (o.items||[]).forEach(function(i){
      if(!i.serial)return;
      // Avoid duplicates already in applianceHistory
      var dup=appliances.find(function(a){return a.serial===i.serial;});
      if(!dup){
        appliances.push({appliance:i.name,model:i.model||'',serial:i.serial,deliveredAt:i.deliveredAt||o.date,invoice:o.id,source:'order'});
      }
    });
  });
  if(!appliances.length)return '<div style="text-align:center;padding:40px;color:#9ca3af;">No appliances with serial numbers recorded yet.</div>';
  // Sort by date descending
  appliances.sort(function(a,b){return new Date(b.deliveredAt||0)-new Date(a.deliveredAt||0);});
  var h='<div style="font-size:12px;color:#6b7280;margin-bottom:12px;">'+appliances.length+' appliance'+(appliances.length!==1?'s':'')+' on file</div>';
  h+='<div style="display:flex;flex-direction:column;gap:8px;">';
  appliances.forEach(function(a){
    var dateStr=a.deliveredAt?new Date(a.deliveredAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—';
    h+='<div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;border-left:3px solid #22c55e;">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;">';
    h+='<div style="font-size:13px;font-weight:700;color:#1f2937;">'+a.appliance+'</div>';
    h+='<div style="font-size:10px;color:#6b7280;">'+dateStr+'</div>';
    h+='</div>';
    if(a.model)h+='<div style="font-size:11px;color:#6b7280;margin-top:2px;">Model: <a class="pc-link" onclick="openProductCardByModel(\''+a.model.replace(/'/g,"\\'")+'\')">'+a.model+'</a></div>';
    h+='<div style="font-size:12px;color:#22c55e;font-weight:600;margin-top:4px;">Serial: '+a.serial+'</div>';
    if(a.invoice)h+='<div style="font-size:10px;color:#6b7280;margin-top:2px;">Invoice: '+a.invoice+'</div>';
    h+='</div>';
  });
  h+='</div>';
  return h;
}

function renderCpService(c){
  return '<div style="text-align:center;padding:40px;color:#9ca3af;">Service jobs for this customer will appear here.<br/><span style="font-size:11px;">(Jobs matched by customer name from service portal)</span></div>';
}

function renderCpContacts(c){
  var contacts=c.contacts||[];
  var h='<div style="margin-bottom:12px;"><button class="ghost-btn" onclick="cpAddContact()">+ Add Contact Note</button></div>';
  if(!contacts.length)h+='<div style="text-align:center;padding:30px;color:#9ca3af;">No contact notes yet</div>';
  else{
    h+='<div>';
    contacts.forEach(function(n){
      h+='<div style="padding:10px 12px;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:8px;"><div style="font-size:10px;color:#6b7280;margin-bottom:4px;">'+new Date(n.date).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'})+' — '+(n.author||'Admin')+'</div><div style="font-size:12px;color:#1f2937;">'+n.text+'</div></div>';
    });
    h+='</div>';
  }
  return h;
}

function cpAddContact(){
  var text=prompt('Contact note:','');if(!text)return;
  var c=customers[_cpIdx];if(!c)return;
  if(!c.contacts)c.contacts=[];
  c.contacts.push({date:new Date().toISOString(),text:text.trim(),author:currentEmployee?currentEmployee.name:'Admin'});
  saveCustomers();renderCpRight();
}

function renderCpDemographics(c){
  var h='<div style="max-width:500px;">';
  var d=c.demographics||{};
  function field(lbl,key){return '<div style="margin-bottom:10px;"><div style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">'+lbl+'</div><div style="font-size:12px;">'+(d[key]||'—')+'</div></div>';}
  h+=field('Birthday','birthday');
  h+=field('Anniversary','anniversary');
  h+=field('Occupation','occupation');
  h+=field('Referral Source','referralSource');
  h+=field('Preferred Contact','preferredContact');
  h+=field('Household Size','householdSize');
  h+='<button class="ghost-btn" style="margin-top:8px;" onclick="cpEditDemographics()">Edit Demographics</button>';
  h+='</div>';
  return h;
}

function cpEditDemographics(){
  var c=customers[_cpIdx];if(!c)return;
  if(!c.demographics)c.demographics={};
  var d=c.demographics;
  d.birthday=prompt('Birthday:',d.birthday||'')||'';
  d.anniversary=prompt('Anniversary:',d.anniversary||'')||'';
  d.occupation=prompt('Occupation:',d.occupation||'')||'';
  d.referralSource=prompt('Referral Source:',d.referralSource||'')||'';
  d.preferredContact=prompt('Preferred Contact (phone/email/text):',d.preferredContact||'')||'';
  d.householdSize=prompt('Household Size:',d.householdSize||'')||'';
  saveCustomers();renderCpRight();
}

// ═══ LEDGER ENTRY MODAL ═══
var _ledgerEntryType='';
function openLedgerEntry(type){
  _ledgerEntryType=type;
  var titles={refund:'CC Refund',adjustment:'Adjustment',note:'Make A Note'};
  document.getElementById('le-title').textContent=titles[type]||'Entry';
  document.getElementById('le-date').value=new Date().toISOString().slice(0,10);
  document.getElementById('le-amount').value='';
  document.getElementById('le-invoice').value='';
  document.getElementById('le-memo').value='';
  // Show/hide fields based on type
  document.getElementById('le-amount-wrap').style.display=type==='note'?'none':'block';
  document.getElementById('le-invoice-wrap').style.display=type==='note'?'none':'block';
  document.getElementById('le-memo-label').textContent=type==='note'?'Note':(type==='refund'?'Reason':'Memo');
  openModal('ledger-entry-modal');
}

function saveLedgerEntry(){
  var c=customers[_cpIdx];if(!c)return;
  var date=document.getElementById('le-date').value||new Date().toISOString().slice(0,10);
  var amount=parseFloat(document.getElementById('le-amount').value)||0;
  var invoice=document.getElementById('le-invoice').value.trim();
  var memo=document.getElementById('le-memo').value.trim();
  if(_ledgerEntryType==='refund'){
    if(amount<=0){toast('Enter refund amount','error');return;}
    if(!c.refunds)c.refunds=[];
    c.refunds.push({date:new Date(date).toISOString(),amount:amount,invoice:invoice,reason:memo,by:currentEmployee?currentEmployee.name:'Admin'});
  }else if(_ledgerEntryType==='adjustment'){
    if(amount===0){toast('Enter amount','error');return;}
    if(!c.adjustments)c.adjustments=[];
    c.adjustments.push({date:new Date(date).toISOString(),amount:amount,memo:memo,by:currentEmployee?currentEmployee.name:'Admin'});
  }else if(_ledgerEntryType==='note'){
    if(!memo){toast('Enter note','error');return;}
    if(!c.ledgerNotes)c.ledgerNotes=[];
    c.ledgerNotes.push({date:new Date(date).toISOString(),memo:memo,by:currentEmployee?currentEmployee.name:'Admin'});
  }
  saveCustomers();closeModal('ledger-entry-modal');renderCpRight();toast('Entry saved','success');
}

// ═══ PRINT LEDGER ═══
function printCustomerLedger(){
  var c=customers[_cpIdx];if(!c)return;
  var entries=getCustomerLedger(c);
  var balance=entries.length?entries[entries.length-1].balance:0;
  var win=window.open('','_blank');
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Ledger — '+c.name+'</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;font-size:11px;padding:16px;}.hdr{display:flex;align-items:center;gap:16px;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:12px;}.hdr img{max-width:180px;}.hdr h1{font-size:16px;margin-bottom:2px;}table{width:100%;border-collapse:collapse;}th{background:#222;color:#fff;font-size:9px;padding:5px 8px;text-align:left;text-transform:uppercase;}td{padding:6px 8px;border-bottom:1px solid #eee;font-size:10px;}tr:nth-child(even) td{background:#f9f9f9;}.balance{text-align:right;font-size:14px;font-weight:700;margin-top:12px;}@media print{@page{margin:10mm;}}</style></head><body>';
  var _logoPath=(typeof currentStore!=='undefined'&&currentStore&&currentStore.logo_url)||'/images/logos/dc-appliance-logo-transparent.png';
  html+='<div class="hdr"><img src="'+_logoPath+'" onerror="this.onerror=null;this.src=\'/images/logos/placeholder-logo.png\';this.onerror=function(){this.style.display=\'none\'};" alt="DC Appliance"/><div><h1>DC Appliance — Customer Ledger</h1><div style="font-size:11px;font-weight:700;">'+c.name+' &middot; '+c.cid+'</div><div style="font-size:10px;color:#666;">'+(c.phone||'')+(c.phone&&c.email?' &middot; ':'')+(c.email||'')+'</div></div></div>';
  html+='<table><thead><tr><th style="width:70px;">Date</th><th>Description</th><th style="width:80px;">Invoice</th><th style="width:80px;text-align:right;">Charge</th><th style="width:80px;text-align:right;">Credit</th><th style="width:80px;text-align:right;">Balance</th></tr></thead><tbody>';
  if(!entries.length)html+='<tr><td colspan="6" style="text-align:center;color:#999;padding:20px;">No activity</td></tr>';
  else entries.forEach(function(e){html+='<tr><td>'+new Date(e.date).toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'2-digit'})+'</td><td>'+e.desc+'</td><td>'+(e.invoice||'')+'</td><td style="text-align:right;">'+(e.charge?'$'+e.charge.toFixed(2):'')+'</td><td style="text-align:right;">'+(e.credit?'$'+e.credit.toFixed(2):'')+'</td><td style="text-align:right;font-weight:700;">$'+e.balance.toFixed(2)+'</td></tr>';});
  html+='</tbody></table>';
  html+='<div class="balance">Current Balance: $'+balance.toFixed(2)+'</div>';
  html+='</body></html>';
  win.document.write(html);win.document.close();setTimeout(function(){win.print();},400);
}

// ═══ ORIGINAL custSelect REDIRECTS TO MODAL ═══
function custSelectOpen(idx){openCustomerProfile(idx);}

function custEdit(idx){
  var c=customers[idx];if(!c)return;
  var name=prompt('Name:',c.name);if(!name)return;
  var phone=prompt('Phone:',c.phone||'')||'';
  var cell=prompt('Cell:',c.cell||'')||'';
  var fax=prompt('Fax:',c.fax||'')||'';
  var email=prompt('Email:',c.email||'')||'';
  var addr=prompt('Address:',c.address||'')||'';
  var city=prompt('City:',c.city||'')||'';
  var state=prompt('State:',c.state||'')||'';
  var zip=prompt('Zip:',c.zip||'')||'';
  var arNum=prompt('AR #:',c.arNum||'')||'';
  var cclass=prompt('Class (Customer, Commercial):',c.class||'Customer')||'Customer';
  var level=prompt('Level (Sold, Prospect):',c.level||'Sold')||'Sold';
  var type=prompt('Type (Retail, Wholesale):',c.type||'Retail')||'Retail';
  var flags=prompt('Flags:',c.flags||'')||'';
  c.name=name.trim();c.phone=phone.trim();c.cell=cell.trim();c.fax=fax.trim();c.email=email.trim();
  c.address=addr.trim();c.city=city.trim();c.state=state.trim();c.zip=zip.trim();
  c.arNum=arNum.trim();c.class=cclass.trim();c.level=level.trim();c.type=type.trim();c.flags=flags.trim();
  saveCustomers();
  if(_cpIdx===idx){renderCpLeft();}
  custFilterList();toast('Customer updated','success');
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

// ═══ CUSTOMER EMAIL ACTIONS ═══
function custRecordPayment(idx){
  var c=customers[idx];if(!c)return;
  var amount=prompt('Payment amount for '+c.name+':','');
  if(!amount)return;amount=parseFloat(amount);if(isNaN(amount)||amount<=0)return;
  var method=prompt('Payment method (Cash, Check, Card, Financing):','Check')||'Check';
  if(!c.payments)c.payments=[];
  c.payments.push({date:new Date().toISOString(),amount:amount,method:method.trim(),recordedBy:currentEmployee?currentEmployee.name:'Admin'});
  saveCustomers();custSelect(idx);toast('Payment of '+fmt(amount)+' recorded','success');
}

function custToggleOptOut(idx){
  var c=customers[idx];if(!c)return;
  c.emailOptOut=!c.emailOptOut;
  saveCustomers();custSelect(idx);
  toast(c.emailOptOut?c.name+' opted out of emails':c.name+' re-enabled for emails','info');
}
function custEditEmail(idx){
  var c=customers[idx];if(!c)return;
  var email=prompt('Email address:',c.email||'');
  if(email===null)return;
  c.email=email.trim();saveCustomers();custSelect(idx);
}

async function custSendInvoiceEmail(idx){
  var c=customers[idx];if(!c||!c.email)return;
  if(c.emailOptOut){toast('Customer has opted out of emails','error');return;}
  var custOrders=orders.filter(function(o){return o.customer===c.name&&o.status!=='Quote';});
  if(!custOrders.length){toast('No invoices found','error');return;}
  // Show selection
  var list=custOrders.slice(0,20).map(function(o,i){return (i+1)+'. '+o.id+' — '+o.date.slice(0,10)+' — $'+o.total.toFixed(2);}).join('\n');
  var pick=prompt('Select invoice to email (enter number):\n\n'+list,'1');
  if(!pick)return;
  var idx2=parseInt(pick)-1;if(isNaN(idx2)||idx2<0||idx2>=custOrders.length)return;
  var order=custOrders[idx2];
  toast('Sending invoice...','info');
  var res=await sendInvoiceEmail(order,c.email);
  if(res.ok){
    if(!order.emailLog)order.emailLog=[];
    order.emailLog.push({ts:new Date().toISOString(),to:c.email,type:'invoice_receipt',by:currentEmployee?currentEmployee.name:'Admin'});
    saveOrders();
    toast('Invoice emailed to '+c.email,'success');
  }else{toast('Failed: '+(res.error||'Unknown error'),'error');}
}

async function custSendDeliveryEmail(idx){
  var c=customers[idx];if(!c||!c.email)return;
  if(c.emailOptOut){toast('Customer has opted out of emails','error');return;}
  // Get deliveries for this customer
  try{
    var r=await apiFetch('/api/deliveries-get');var data=await r.json();
    if(!data.ok){toast('Could not load deliveries','error');return;}
    var custDels=data.deliveries.filter(function(d){return d.name===c.name&&d.status!=='Delivered';});
    if(!custDels.length){toast('No scheduled deliveries found','error');return;}
    var list=custDels.map(function(d,i){return (i+1)+'. '+d.id+' — '+d.date+' — '+d.address;}).join('\n');
    var pick=prompt('Select delivery to email (enter number):\n\n'+list,'1');
    if(!pick)return;
    var idx2=parseInt(pick)-1;if(isNaN(idx2)||idx2<0||idx2>=custDels.length)return;
    var del=custDels[idx2];
    if(!del.email)del.email=c.email;
    toast('Sending confirmation...','info');
    var html=buildDeliveryEmailHtml(del);
    var dateStr=new Date(del.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
    var res=await sendDcEmail(c.email,c.name,'Delivery Confirmation — '+dateStr+' — DC Appliance',html);
    if(res.ok){
      if(!del.emailLog)del.emailLog=[];
      del.emailLog.push({ts:new Date().toISOString(),to:c.email,type:'delivery_confirmation',by:currentEmployee?currentEmployee.name:'Admin'});
      // Save back the deliveries with the email log
      await apiFetch('/api/deliveries-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({deliveries:data.deliveries,nextId:data.nextId,notes:data.notes||[],nextNoteId:data.nextNoteId||1})});
      toast('Confirmation emailed to '+c.email,'success');
    }else{toast('Failed: '+(res.error||'Unknown error'),'error');}
  }catch(e){toast('Error loading deliveries','error');}
}
