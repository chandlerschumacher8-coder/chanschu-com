// ══════════════════════════════════════════════
// POS DASHBOARD MODULE
// ══════════════════════════════════════════════

// ══════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════
var _rptType='';
var _rptData=[];
var _rptHeaders=[];
var _rptFooter=[];
var _rptAiData=[];
var _rptAiHeaders=[];

function renderReportsSection(){
  // Set default dates if empty
  var end=document.getElementById('rpt-end');
  var start=document.getElementById('rpt-start');
  if(!end.value){end.value=new Date().toISOString().slice(0,10);}
  if(!start.value){var d=new Date();d.setDate(1);start.value=d.toISOString().slice(0,10);}
}

function rptSelect(type){
  _rptType=type;
  document.getElementById('rpt-controls').style.display='';
  // Inventory valuation doesn't need date range
  if(type==='inv-valuation'){
    document.getElementById('rpt-controls').querySelector('.field').style.display='none';
  } else {
    document.getElementById('rpt-controls').querySelector('.field').style.display='';
  }
  rptRun();
}

function rptFilterOrders(start,end){
  return orders.filter(function(o){
    if(!o.date||o.status==='Quote')return false;
    var d=o.date.slice(0,10);
    return d>=start&&d<=end;
  });
}

function rptRun(){
  var start=document.getElementById('rpt-start').value;
  var end=document.getElementById('rpt-end').value;
  var out=document.getElementById('rpt-output');
  out.style.display='';
  _rptData=[];_rptHeaders=[];_rptFooter=[];

  if(_rptType==='sales-category') rptSalesByCategory(start,end);
  else if(_rptType==='sales-dept') rptSalesByDept(start,end);
  else if(_rptType==='sales-person') rptSalesByPerson(start,end);
  else if(_rptType==='inv-valuation') rptInventoryValuation();
  else if(_rptType==='tax-delivered') rptTaxDelivered(start,end);
  else if(_rptType==='tax-detail') rptTaxDetail(start,end);

  rptRenderTable(out);
}

function rptSalesByCategory(start,end){
  _rptHeaders=['Category','Department','Units Sold','Total Sales'];
  var filtered=rptFilterOrders(start,end);
  var catMap={};
  filtered.forEach(function(o){(o.items||[]).forEach(function(i){
    var p=PRODUCTS.find(function(x){return x.id===i.id;});
    var cat=p?p.category:'Unknown';
    var dept=p?getProductDept(p):'Unknown';
    if(!catMap[cat])catMap[cat]={dept:dept,units:0,dollars:0};
    catMap[cat].units+=i.qty;catMap[cat].dollars+=i.price*i.qty;
  });});
  _rptData=Object.keys(catMap).sort().map(function(c){
    return [c,catMap[c].dept,catMap[c].units,fmt(catMap[c].dollars)];
  });
}

function rptSalesByDept(start,end){
  _rptHeaders=['Department','Units Sold','Invoices','Total Sales'];
  var filtered=rptFilterOrders(start,end);
  var deptMap={};
  DEPARTMENTS.forEach(function(d){deptMap[d.name]={units:0,invoices:new Set(),dollars:0};});
  filtered.forEach(function(o){(o.items||[]).forEach(function(i){
    var p=PRODUCTS.find(function(x){return x.id===i.id;});
    var dept=p?getProductDept(p):'Other';
    if(!deptMap[dept])deptMap[dept]={units:0,invoices:new Set(),dollars:0};
    deptMap[dept].units+=i.qty;deptMap[dept].dollars+=i.price*i.qty;deptMap[dept].invoices.add(o.id);
  });});
  _rptData=Object.keys(deptMap).sort().map(function(d){
    return [d,deptMap[d].units,deptMap[d].invoices.size,fmt(deptMap[d].dollars)];
  });
}

function rptSalesByPerson(start,end){
  _rptHeaders=['Salesperson','Invoices','Total Sales','Avg Sale','Commission'];
  var filtered=rptFilterOrders(start,end);
  var clerkMap={};
  filtered.forEach(function(o){
    var c=o.clerk||'Unknown';
    if(!clerkMap[c])clerkMap[c]={count:0,dollars:0,commission:0};
    clerkMap[c].count++;clerkMap[c].dollars+=o.total||0;
    // Calculate commission from global category rates + brand overrides
    (o.items||[]).forEach(function(i){
      var p=PRODUCTS.find(function(x){return x.id===i.id;});
      var cat=p?p.cat:'';
      var brand=p?p.brand:'';
      var rate=commGetRate(cat,brand);
      clerkMap[c].commission+=i.price*i.qty*rate;
    });
  });
  _rptData=Object.keys(clerkMap).sort().map(function(c){
    var avg=clerkMap[c].count?clerkMap[c].dollars/clerkMap[c].count:0;
    return [c,clerkMap[c].count,fmt(clerkMap[c].dollars),fmt(avg),fmt(clerkMap[c].commission)];
  });
}

function rptInventoryValuation(){
  _rptHeaders=['Model#','Description','Brand','Category','Department','Available','Sold','Avail\u2212Sold','Cost','Sell Price','Total Cost Avail','Total Cost Avail\u2212Sold'];
  var totAvailCost=0,totAmsCost=0,totAvailRetail=0,totAmsRetail=0;
  _rptData=PRODUCTS.filter(function(p){return p.active!==false;}).map(function(p){
    var cost=p.cost||0,sell=p.price||0,avail=p.stock||0,sold=p.sold||0;
    var ams=Math.max(0,avail-sold);
    var acost=cost*avail,amscost=cost*ams;
    totAvailCost+=acost;totAmsCost+=amscost;totAvailRetail+=sell*avail;totAmsRetail+=sell*ams;
    return [p.model||'',p.name,p.brand||'',p.cat||p.category||'',getProductDept(p)||'',avail,sold,ams,fmt(cost),fmt(sell),fmt(acost),fmt(amscost)];
  });
  _rptFooter=[
    ['','','','','','','','','','Total Available Cost:','',fmt(totAvailCost)],
    ['','','','','','','','','','Total Avail\u2212Sold Cost:','',fmt(totAmsCost)],
    ['','','','','','','','','','Total Retail (Available):','',fmt(totAvailRetail)],
    ['','','','','','','','','','Total Retail (Avail\u2212Sold):','',fmt(totAmsRetail)]
  ];
}

function rptTaxDelivered(start,end){
  _rptHeaders=['Tax Jurisdiction','Invoices','Taxable Amount','Tax Rate','Tax Collected'];
  var filtered=rptFilterOrders(start,end).filter(function(o){return o.status==='Delivered'||o.deliveryStatus==='Delivered';});
  var zoneMap={};
  filtered.forEach(function(o){
    var zone=o.taxZone||o.taxName||'Default';
    var rate=o.taxRate||0;
    if(!zoneMap[zone])zoneMap[zone]={count:0,taxable:0,rate:rate,tax:0};
    zoneMap[zone].count++;
    var taxable=(o.total||0)-(o.tax||0);
    zoneMap[zone].taxable+=taxable;
    zoneMap[zone].tax+=o.tax||0;
  });
  _rptData=Object.keys(zoneMap).sort().map(function(z){
    return [z,zoneMap[z].count,fmt(zoneMap[z].taxable),(zoneMap[z].rate*100).toFixed(3)+'%',fmt(zoneMap[z].tax)];
  });
}

function rptTaxDetail(start,end){
  _rptHeaders=['Invoice #','Date','Customer','Taxable Amount','Tax Rate','Tax Collected'];
  var filtered=rptFilterOrders(start,end).filter(function(o){return(o.tax||0)>0;});
  _rptData=filtered.map(function(o){
    var taxable=(o.total||0)-(o.tax||0);
    var rate=o.taxRate||0;
    return [o.id,o.date?o.date.slice(0,10):'',o.customer||'',fmt(taxable),(rate*100).toFixed(3)+'%',fmt(o.tax)];
  });
}

function rptRenderTable(container){
  if(!_rptHeaders.length){container.innerHTML='<div style="padding:20px;text-align:center;color:#9ca3af;">Select a report type above.</div>';return;}
  var h='<table class="admin-table"><thead><tr>';
  _rptHeaders.forEach(function(hdr){h+='<th>'+hdr+'</th>';});
  h+='</tr></thead><tbody>';
  if(!_rptData.length){h+='<tr><td colspan="'+_rptHeaders.length+'" style="text-align:center;color:#9ca3af;padding:20px;">No data found for this date range.</td></tr>';}
  else{_rptData.forEach(function(row){h+='<tr>';row.forEach(function(cell){h+='<td>'+cell+'</td>';});h+='</tr>';});}
  if(_rptFooter&&_rptFooter.length){h+='</tbody><tfoot>';_rptFooter.forEach(function(row){h+='<tr style="background:#f9fafb;font-weight:700;border-top:2px solid #d1d5db;">';row.forEach(function(cell){h+='<td>'+cell+'</td>';});h+='</tr>';});h+='</tfoot>';}
  h+='</tbody></table>';
  container.innerHTML=h;
}

function rptExportCSV(){
  if(!_rptData.length){toast('No data to export','error');return;}
  var csv=_rptHeaders.join(',')+'\n';
  _rptData.forEach(function(row){csv+=row.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',')+'\n';});
  if(_rptFooter&&_rptFooter.length){csv+='\n';_rptFooter.forEach(function(row){csv+=row.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',')+'\n';});}
  var blob=new Blob([csv],{type:'text/csv'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='report_'+_rptType+'_'+new Date().toISOString().slice(0,10)+'.csv';a.click();
  toast('CSV exported','success');
}

function rptExportPDF(){
  if(!_rptData.length){toast('No data to export','error');return;}
  // Create a printable HTML document
  var win=window.open('','_blank');
  var h='<html><head><title>Report</title><style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left;}th{background:#f0f0f0;font-weight:bold;}h2{margin-bottom:10px;}</style></head><body>';
  var titles={'sales-category':'Sales by Category','sales-dept':'Sales by Department','sales-person':'Sales by Salesperson','inv-valuation':'Inventory Valuation','tax-delivered':'Sales Tax by Delivered Product','tax-detail':'Sales Tax Detail'};
  h+='<h2>'+(titles[_rptType]||'Report')+'</h2>';
  h+='<p>'+document.getElementById('rpt-start').value+' to '+document.getElementById('rpt-end').value+'</p>';
  h+='<table><thead><tr>';
  _rptHeaders.forEach(function(hdr){h+='<th>'+hdr+'</th>';});
  h+='</tr></thead><tbody>';
  _rptData.forEach(function(row){h+='<tr>';row.forEach(function(c){h+='<td>'+c+'</td>';});h+='</tr>';});
  if(_rptFooter&&_rptFooter.length){h+='</tbody><tfoot>';_rptFooter.forEach(function(row){h+='<tr style="background:#f0f0f0;font-weight:bold;">';row.forEach(function(c){h+='<td>'+c+'</td>';});h+='</tr>';});h+='</tfoot>';}
  h+='</tbody></table></body></html>';
  win.document.write(h);win.document.close();
  setTimeout(function(){win.print();},500);
}

// AI Custom Reports
async function rptAiGenerate(){
  var prompt=document.getElementById('rpt-ai-prompt').value.trim();
  if(!prompt){toast('Please describe the report you want','error');return;}
  var loading=document.getElementById('rpt-ai-loading');
  var output=document.getElementById('rpt-ai-output');
  var exportWrap=document.getElementById('rpt-ai-export-wrap');
  loading.style.display='';output.style.display='none';exportWrap.style.display='none';
  _rptAiData=[];_rptAiHeaders=[];

  // Build context about available data
  var sampleProducts=PRODUCTS.slice(0,5).map(function(p){return{id:p.id,name:p.name,model:p.model||'',category:p.cat,price:p.price,cost:p.cost,stock:p.stock};});
  var sampleOrders=orders.slice(0,3).map(function(o){return{id:o.id,date:o.date,customer:o.customer,clerk:o.clerk,total:o.total,tax:o.tax,status:o.status,items:(o.items||[]).slice(0,2)};});
  var deptNames=DEPARTMENTS.map(function(d){return d.name;});

  var sys='You are a report generator for a POS system. You have access to sales orders and inventory data. '
    +'Departments: '+deptNames.join(', ')+'. '
    +'Sample product fields: '+JSON.stringify(sampleProducts[0]||{})+'. '
    +'Sample order fields: '+JSON.stringify(sampleOrders[0]||{})+'. '
    +'Total products: '+PRODUCTS.length+'. Total orders: '+orders.length+'. '
    +'Respond ONLY with valid JSON in this format: {"headers":["Col1","Col2"],"rows":[["val1","val2"]]}. '
    +'Analyze the full dataset provided and generate the report the user asks for. No explanations, just JSON.';

  var dataPayload={
    products:PRODUCTS.map(function(p){return{id:p.id,name:p.name,model:p.model||'',category:p.cat,price:p.price,cost:p.cost,stock:p.stock};}),
    orders:orders.map(function(o){return{id:o.id,date:o.date,customer:o.customer,clerk:o.clerk,total:o.total,tax:o.tax,taxRate:o.taxRate,status:o.status,items:o.items};})
  };

  var msgs=[
    {role:'user',content:'Here is the full dataset:\n'+JSON.stringify(dataPayload)+'\n\nGenerate this report: '+prompt}
  ];

  try{
    var res=await fetch('/api/ai-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:sys,messages:msgs,max_tokens:4000})});
    var data=await res.json();
    if(!data.ok)throw new Error(data.error||'API error');
    var text=(data.content&&data.content[0]&&data.content[0].text)||'';
    // Extract JSON from response
    var jsonMatch=text.match(/\{[\s\S]*\}/);
    if(!jsonMatch)throw new Error('Could not parse AI response');
    var parsed=JSON.parse(jsonMatch[0]);
    _rptAiHeaders=parsed.headers||[];
    _rptAiData=parsed.rows||[];

    var h='<table class="admin-table"><thead><tr>';
    _rptAiHeaders.forEach(function(hdr){h+='<th>'+hdr+'</th>';});
    h+='</tr></thead><tbody>';
    if(!_rptAiData.length){h+='<tr><td colspan="'+_rptAiHeaders.length+'" style="text-align:center;color:#9ca3af;padding:20px;">No results found.</td></tr>';}
    else{_rptAiData.forEach(function(row){h+='<tr>';(Array.isArray(row)?row:[row]).forEach(function(c){h+='<td>'+c+'</td>';});h+='</tr>';});}
    h+='</tbody></table>';
    output.innerHTML=h;output.style.display='';
    if(_rptAiData.length)exportWrap.style.display='';
  }catch(e){
    output.innerHTML='<div style="padding:16px;color:#dc2626;font-size:12px;">Error generating report: '+e.message+'</div>';
    output.style.display='';
  }
  loading.style.display='none';
}

function rptAiExportCSV(){
  if(!_rptAiData.length){toast('No data to export','error');return;}
  var csv=_rptAiHeaders.join(',')+'\n';
  _rptAiData.forEach(function(row){csv+=(Array.isArray(row)?row:[row]).map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',')+'\n';});
  var blob=new Blob([csv],{type:'text/csv'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='ai_report_'+new Date().toISOString().slice(0,10)+'.csv';a.click();
  toast('CSV exported','success');
}

// ══════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════
var _dashTimer=null;
function renderDashboard(){
  if(_dashTimer)clearInterval(_dashTimer);
  _dashTimer=setInterval(function(){if(currentTab==='dashboard')renderDashboard();},60000);
  var today=new Date().toISOString().slice(0,10);
  var now=new Date();

  // Today's orders (not quotes)
  var todayOrders=orders.filter(function(o){return o.date&&o.date.slice(0,10)===today&&o.status!=='Quote';});
  var totalSales=todayOrders.reduce(function(s,o){return s+(o.total||0);},0);

  // Sales by department
  var deptSales={};DEPARTMENTS.forEach(function(d){deptSales[d.name]={dollars:0,units:0};});
  todayOrders.forEach(function(o){(o.items||[]).forEach(function(i){
    var p=PRODUCTS.find(function(x){return x.id===i.id;});if(!p)return;
    var dept=getProductDept(p)||'Other';
    if(!deptSales[dept])deptSales[dept]={dollars:0,units:0};
    deptSales[dept].dollars+=i.price*i.qty;deptSales[dept].units+=i.qty;
  });});
  var maxDept=Math.max.apply(null,Object.values(deptSales).map(function(d){return d.dollars;}))||1;

  // Sales by clerk with commission
  var clerkSales={};
  todayOrders.forEach(function(o){
    var c=o.clerk||'Unknown';
    if(!clerkSales[c])clerkSales[c]={dollars:0,count:0,commission:0};
    clerkSales[c].count++;clerkSales[c].dollars+=o.total||0;
    (o.items||[]).forEach(function(i){
      var p=PRODUCTS.find(function(x){return x.id===i.id;});
      var cat=p?p.cat:'';var brand=p?p.brand:'';
      clerkSales[c].commission+=i.price*i.qty*commGetRate(cat,brand);
    });
  });

  // Today's deliveries
  var todayDel=(typeof delDeliveries!=='undefined'?delDeliveries:[]).filter(function(d){return d.date===today;});
  todayDel.sort(function(a,b){return(a.time||'').localeCompare(b.time||'');});

  // Service alerts
  var svcAlerts=(typeof svcJobs!=='undefined'?svcJobs:[]).filter(function(j){return j.status==='In Progress'||j.status==='Needs Claimed'||j.status==='Service Complete';});
  var partsWaiting=(typeof svcJobs!=='undefined'?svcJobs:[]).filter(function(j){
    if(!j.partOnOrder||!j.partOrderedAt)return false;
    return(Date.now()-new Date(j.partOrderedAt).getTime())>7*86400000;
  });

  // Monthly sales summary
  var curMonth=now.getMonth(), curYear=now.getFullYear();
  var monthOrders=orders.filter(function(o){if(!o.date||o.status==='Quote')return false;var d=new Date(o.date);return d.getMonth()===curMonth&&d.getFullYear()===curYear;});
  var monthSales=monthOrders.reduce(function(s,o){return s+(o.total||0);},0);
  var lastYearOrders=orders.filter(function(o){if(!o.date||o.status==='Quote')return false;var d=new Date(o.date);return d.getMonth()===curMonth&&d.getFullYear()===curYear-1;});
  var lastYearSales=lastYearOrders.reduce(function(s,o){return s+(o.total||0);},0);
  var monthDiff=monthSales-lastYearSales;
  var monthPctChange=lastYearSales?Math.round(monthDiff/lastYearSales*100):0;
  var monthName=now.toLocaleDateString('en-US',{month:'long'});

  // Time clock
  var clockedIn=(typeof tcPunches!=='undefined'?tcPunches:[]).filter(function(p){return!p.clockOut;});
  var todayPunches=(typeof tcPunches!=='undefined'?tcPunches:[]).filter(function(p){return p.date===today;});
  var todayHours={};todayPunches.filter(function(p){return p.type!=='break';}).forEach(function(p){
    if(!todayHours[p.employee])todayHours[p.employee]=0;
    todayHours[p.employee]+=(p.clockOut?p.hours:tcDiffHours(p.clockIn,new Date().toISOString()));
  });

  var h='<div class="dash-hdr"><div><div class="dash-title">Dashboard</div><div class="dash-date">'+now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})+'</div></div><div class="dash-refresh">Auto-refreshes every 60s</div></div>';

  // ═══ ROW 1: Today's Invoices + Time Clock ═══
  h+='<div class="dash-row">';

  // Left: Today's Invoices
  h+='<div class="dash-card"><div class="dash-card-title">Today\'s Invoices ('+todayOrders.length+')</div>';
  if(todayOrders.length){
    h+='<div style="max-height:300px;overflow-y:auto;">';
    todayOrders.forEach(function(o){
      h+='<div class="dash-card-row"><div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:11px;">'+o.id+'</div><div style="font-size:10px;color:#6b7280;">'+o.customer+' &middot; '+(o.clerk||'—')+' &middot; '+(o.payment||'')+'</div></div><span class="dash-card-val">'+fmt(o.total)+'</span></div>';
    });
    h+='</div>';
    h+='<div style="margin-top:8px;padding:8px 0;border-top:2px solid #e5e7eb;display:flex;justify-content:space-between;font-weight:700;font-size:13px;color:#1f2937;"><span>'+todayOrders.length+' invoices</span><span>'+fmt(totalSales)+'</span></div>';
  } else h+='<div style="color:#9ca3af;font-size:12px;padding:8px 0;">No invoices yet today</div>';
  h+='</div>';

  // Right: Time Clock
  h+='<div class="dash-card"><div class="dash-card-title">Time Clock</div>';
  if(clockedIn.length){
    h+='<div style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Currently Clocked In</div>';
    clockedIn.forEach(function(p){var mins=Math.floor((Date.now()-new Date(p.clockIn).getTime())/60000);var hr=Math.floor(mins/60),mn=mins%60;h+='<div class="dash-card-row"><span>'+p.employee+(p.type==='break'?' <span style="color:#ea580c;font-size:9px;">(BREAK)</span>':'')+'</span><span class="dash-card-val'+(hr>=8?' style="color:#dc2626;"':'')+'>'+hr+'h '+mn+'m</span></div>';});
  } else h+='<div style="color:#9ca3af;font-size:12px;padding:8px 0;">No one clocked in</div>';
  if(todayPunches.length){
    h+='<div style="margin-top:10px;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Today\'s Punches</div>';
    h+='<div style="max-height:180px;overflow-y:auto;">';
    todayPunches.forEach(function(p){
      var inT=new Date(p.clockIn).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
      var outT=p.clockOut?new Date(p.clockOut).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):'—';
      var hrs=p.clockOut?p.hours.toFixed(2)+'h':'active';
      var typ=p.type==='break'?' (break)':'';
      h+='<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #f3f4f6;font-size:11px;color:#374151;"><span>'+p.employee+typ+'</span><span style="color:#6b7280;">'+inT+' — '+outT+'</span><span style="font-weight:600;">'+hrs+'</span></div>';
    });
    h+='</div>';
  }
  var hrKeys=Object.keys(todayHours);
  if(hrKeys.length){h+='<div style="margin-top:8px;padding-top:6px;border-top:1px solid #e5e7eb;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Hours Today</div>';hrKeys.forEach(function(e){var hr=Math.round(todayHours[e]*100)/100;h+='<div class="dash-card-row"><span>'+e+'</span><span class="dash-card-val'+(hr>8?' style="color:#dc2626;"':'')+'>'+hr.toFixed(1)+'h</span></div>';});}
  h+='</div></div>';

  // ═══ ROW 2: Today's Deliveries + Service Alerts ═══
  h+='<div class="dash-row">';

  // Left: Today's Deliveries
  h+='<div class="dash-card"><div class="dash-card-title">Today\'s Deliveries ('+todayDel.length+')</div>';
  if(todayDel.length){
    h+='<div style="max-height:300px;overflow-y:auto;">';
    todayDel.forEach(function(d){
      var sc=d.status==='Delivered'?'dash-sb-del':d.status==='Out for Delivery'?'dash-sb-out':'dash-sb-sched';
      var apps=(d.appliances&&d.appliances.length)?d.appliances.map(function(a){return a.a;}).join(', '):(d.appliance||'');
      h+='<div class="dash-card-row"><div style="flex:1;min-width:0;"><div style="font-weight:600;">'+d.name+'</div><div style="font-size:10px;color:#6b7280;">'+(d.address||'')+', '+(d.city||'')+'</div><div style="font-size:10px;color:#6b7280;">'+d.time+' &middot; '+apps+' &middot; '+(d.team||'')+'</div></div><span class="dash-card-badge '+sc+'">'+d.status+'</span></div>';
    });
    h+='</div>';
  } else h+='<div style="color:#9ca3af;font-size:12px;padding:8px 0;">No deliveries scheduled</div>';
  h+='</div>';

  // Right: Service Alerts
  h+='<div class="dash-card"><div class="dash-card-title">Service Alerts ('+svcAlerts.length+')</div>';
  if(svcAlerts.length){
    h+='<div style="max-height:260px;overflow-y:auto;">';
    svcAlerts.forEach(function(j){
      var dotColor=j.status==='Needs Claimed'?'#eab308':j.status==='Service Complete'?'#16a34a':'#ea580c';
      h+='<div class="dash-alert-item"><div class="dash-alert-dot" style="background:'+dotColor+';"></div><div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:11px;">'+j.name+'</div><div style="font-size:10px;color:#6b7280;">'+j.status+' &middot; '+(j.appliance||'')+'</div></div></div>';
    });
    h+='</div>';
  } else h+='<div style="color:#9ca3af;font-size:12px;padding:8px 0;">No alerts</div>';
  if(partsWaiting.length)h+='<div style="margin-top:8px;padding:6px 8px;background:#fef2f2;border-radius:6px;font-size:11px;color:#dc2626;font-weight:600;">&#9888; '+partsWaiting.length+' part(s) on order waiting 7+ days</div>';
  h+='</div></div>';

  // ═══ ROW 3: Sales by Department + Sales by Salesperson ═══
  h+='<div class="dash-row">';

  // Left: Sales by Department
  h+='<div class="dash-card"><div class="dash-card-title">Sales by Department</div>';
  DEPARTMENTS.forEach(function(d){
    var ds=deptSales[d.name]||{dollars:0,units:0};
    var pct=maxDept?Math.round(ds.dollars/maxDept*100):0;
    h+='<div style="margin-bottom:8px;"><div class="dash-card-row" style="border:none;padding:0;"><span>'+d.name+'</span><span class="dash-card-val">'+fmt(ds.dollars)+' <span style="font-weight:400;color:#6b7280;font-size:10px;">'+ds.units+' units</span></span></div><div class="dash-dept-bar"><div class="dash-dept-fill" style="width:'+pct+'%;"></div></div></div>';
  });
  h+='</div>';

  // Right: Sales by Salesperson
  h+='<div class="dash-card"><div class="dash-card-title">Sales by Salesperson</div>';
  var clerks=Object.keys(clerkSales);
  if(clerks.length){
    clerks.sort(function(a,b){return clerkSales[b].dollars-clerkSales[a].dollars;});
    h+='<table style="width:100%;font-size:12px;border-collapse:collapse;">';
    h+='<thead><tr style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;"><td>Name</td><td style="text-align:right;">Sales</td><td style="text-align:right;">Inv</td><td style="text-align:right;">Commission</td></tr></thead><tbody>';
    clerks.forEach(function(c){var cs=clerkSales[c];h+='<tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:4px 0;font-weight:600;">'+c+'</td><td style="padding:4px 0;text-align:right;">'+fmt(cs.dollars)+'</td><td style="padding:4px 0;text-align:right;">'+cs.count+'</td><td style="padding:4px 0;text-align:right;color:#16a34a;">'+fmt(cs.commission)+'</td></tr>';});
    h+='</tbody></table>';
  } else h+='<div style="color:#9ca3af;font-size:12px;padding:8px 0;">No sales yet today</div>';
  h+='</div></div>';

  // ═══ ROW 4: Monthly Sales Summary (full width) ═══
  h+='<div class="dash-card" style="margin-bottom:12px;"><div class="dash-card-title">Monthly Sales Summary — '+monthName+' '+curYear+'</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:8px;">';
  h+='<div style="text-align:center;padding:14px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">';
  h+='<div style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">This Month To Date</div>';
  h+='<div style="font-family:\'Playfair Display\',serif;font-size:26px;color:#1f2937;">'+fmt(monthSales)+'</div>';
  h+='<div style="font-size:11px;color:#6b7280;margin-top:2px;">'+monthOrders.length+' invoices</div>';
  h+='</div>';
  h+='<div style="text-align:center;padding:14px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">';
  h+='<div style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">'+monthName+' '+(curYear-1)+'</div>';
  h+='<div style="font-family:\'Playfair Display\',serif;font-size:26px;color:#1f2937;">'+fmt(lastYearSales)+'</div>';
  h+='<div style="font-size:11px;color:#6b7280;margin-top:2px;">'+lastYearOrders.length+' invoices</div>';
  h+='</div></div>';
  h+='<div style="margin-top:12px;text-align:center;padding:10px;background:'+(monthDiff>=0?'#f0fdf4':'#fef2f2')+';border-radius:8px;border:1px solid '+(monthDiff>=0?'#bbf7d0':'#fecaca')+';">';
  h+='<span style="font-size:14px;font-weight:700;color:'+(monthDiff>=0?'#16a34a':'#dc2626')+';">'+(monthDiff>=0?'&#9650; +':'&#9660; ')+fmt(Math.abs(monthDiff))+'</span>';
  h+=' <span style="font-size:12px;color:'+(monthDiff>=0?'#16a34a':'#dc2626')+';">('+( monthDiff>=0?'+':'')+monthPctChange+'% vs last year)</span>';
  h+='</div></div>';

  document.getElementById('dash-wrap').innerHTML=h;
}
