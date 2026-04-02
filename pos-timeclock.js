// ══════════════════════════════════════════════
// POS TIME CLOCK MODULE
// ══════════════════════════════════════════════

// ══════════════════════════════════════════════
// EMPLOYEE TIME CLOCK (Login Screen)
// ══════════════════════════════════════════════
var _empTcUser=null;
var _empTcTimer=null;

function empTcRenderGrid(){
  var grid=document.getElementById('emp-tc-grid');if(!grid)return;
  if(!adminUsers||!adminUsers.length){grid.innerHTML='';return;}
  var now=new Date();
  grid.innerHTML=adminUsers.filter(function(u){return u.active!==false;}).map(function(u){
    var active=(typeof tcPunches!=='undefined')?tcPunches.find(function(p){return p.employee===u.name&&!p.clockOut;}):null;
    var statusCls='clocked-out', statusTxt='Off', durTxt='';
    if(active){
      if(active.type==='break'){statusCls='on-break';statusTxt='Break';}
      else{statusCls='clocked-in';statusTxt='In';}
      var mins=Math.floor((now-new Date(active.clockIn))/60000);
      var h=Math.floor(mins/60),m=mins%60;
      durTxt=h+'h '+m+'m';
    }
    return '<div class="emp-tc-card" onclick="empTcOpenModal(\''+u.name.replace(/'/g,"\\'")+'\')">'
      +'<div><div class="etc-name">'+u.name+'</div>'+(durTxt?'<div class="etc-dur">'+durTxt+'</div>':'')+'</div>'
      +'<span class="etc-status '+statusCls+'">'+statusTxt+'</span></div>';
  }).join('');
}

function empTcOpenModal(empName){
  _empTcUser=adminUsers.find(function(u){return u.name===empName;});
  if(!_empTcUser)return;
  var active=(typeof tcPunches!=='undefined')?tcPunches.find(function(p){return p.employee===empName&&!p.clockOut;}):null;
  document.getElementById('etcp-name').textContent=empName;
  var statusText=active?(active.type==='break'?'Currently on break':'Currently clocked in — since '+new Date(active.clockIn).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})):'Not clocked in';
  document.getElementById('etcp-status').textContent=statusText;
  document.getElementById('etcp-pin').value='';
  document.getElementById('etcp-err').style.display='none';
  document.getElementById('etcp-msg').innerHTML='&nbsp;';
  // Show/hide appropriate buttons
  var btns=document.querySelectorAll('.etcp-btn');
  btns.forEach(function(b){b.style.display='';});
  if(active){
    document.querySelector('.etcp-btn.in').style.display='none';
  } else {
    document.querySelector('.etcp-btn.out').style.display='none';
  }
  document.getElementById('emp-tc-punch-modal').classList.add('open');
  setTimeout(function(){document.getElementById('etcp-pin').focus();},100);
}

function empTcCloseModal(){
  document.getElementById('emp-tc-punch-modal').classList.remove('open');
  _empTcUser=null;
}

function empTcSubmit(){
  if(!_empTcUser)return;
  var active=(typeof tcPunches!=='undefined')?tcPunches.find(function(p){return p.employee===_empTcUser.name&&!p.clockOut;}):null;
  empTcDoPunch(active?'out':'in');
}

function empTcDoPunch(action){
  if(!_empTcUser)return;
  var pin=document.getElementById('etcp-pin').value;
  var msgEl=document.getElementById('etcp-msg');
  var errEl=document.getElementById('etcp-err');
  // Validate PIN
  if(_empTcUser.pin && pin!==_empTcUser.pin){
    errEl.style.display='block';
    document.getElementById('etcp-pin').value='';
    document.getElementById('etcp-pin').focus();
    return;
  }
  errEl.style.display='none';
  var empName=_empTcUser.name;
  var active=(typeof tcPunches!=='undefined')?tcPunches.find(function(p){return p.employee===empName&&!p.clockOut;}):null;
  var tcNowISO=new Date().toISOString();
  var tcTodayStr=tcNowISO.slice(0,10);
  var fmtTime=function(iso){return new Date(iso).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});};

  if(action==='in'){
    if(active){msgEl.textContent=empName+' is already clocked in';msgEl.style.color='#ea580c';return;}
    tcPunches.push({id:'TC-'+Date.now(),employee:empName,date:tcTodayStr,clockIn:tcNowISO,clockOut:null,type:'regular',hours:0});
    msgEl.textContent=empName+' clocked IN at '+fmtTime(tcNowISO);msgEl.style.color='#16a34a';
  } else {
    if(!active){msgEl.textContent=empName+' is not clocked in';msgEl.style.color='#ea580c';return;}
    active.clockOut=tcNowISO;
    active.hours=Math.round(((new Date(active.clockOut)-new Date(active.clockIn))/3600000)*100)/100;
    msgEl.textContent=empName+' clocked OUT — '+active.hours.toFixed(2)+' hrs';msgEl.style.color='#dc2626';
  }
  if(typeof tcSavePunches==='function')tcSavePunches();
  empTcRenderGrid();
  // Auto close after 2 seconds
  setTimeout(function(){empTcCloseModal();},2000);
}

// Refresh emp tc grid every 30s
function empTcStartRefresh(){
  if(_empTcTimer)clearInterval(_empTcTimer);
  _empTcTimer=setInterval(function(){
    var empSel=document.getElementById('emp-select');
    if(empSel&&empSel.classList.contains('show'))empTcRenderGrid();
  },30000);
}

// ══════════════════════════════════════════════
// TIME CLOCK
// ══════════════════════════════════════════════
var tcPunches=[];
var _tcClockTimer=null;
var _tcStatusTimer=null;

async function tcLoadPunches(){
  try{var r=await fetch('/api/admin-get?key=timeclock-punches');var d=await r.json();if(d&&d.data&&Array.isArray(d.data))tcPunches=d.data;}catch(e){tcPunches=[];}
}
async function tcSavePunches(){
  try{await fetch('/api/admin-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'timeclock-punches',data:tcPunches})});}catch(e){}
}
function tcInit(){
  tcLoadPunches().then(function(){tcRenderStatus();tcRenderDaily();});
  tcTickClock();
  if(_tcClockTimer)clearInterval(_tcClockTimer);
  _tcClockTimer=setInterval(tcTickClock,1000);
  if(_tcStatusTimer)clearInterval(_tcStatusTimer);
  _tcStatusTimer=setInterval(tcRenderStatus,30000);
  var pin=document.getElementById('tc-pin');if(pin){pin.value='';pin.focus();}
  document.getElementById('tc-pin-name').innerHTML='&nbsp;';
  document.getElementById('tc-punch-msg').innerHTML='&nbsp;';
}
function tcTickClock(){
  var now=new Date();
  var h=now.getHours(),m=now.getMinutes(),s=now.getSeconds();
  var ap=h>=12?'PM':'AM';var h12=h>12?h-12:(h===0?12:h);
  document.getElementById('tc-clock').textContent=h12+':'+(m<10?'0':'')+m+':'+(s<10?'0':'')+s+' '+ap;
  document.getElementById('tc-date').textContent=now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
}
function tcPinLookup(){
  var pin=document.getElementById('tc-pin').value;
  var el=document.getElementById('tc-pin-name');
  if(pin.length<4){el.innerHTML='&nbsp;';return;}
  var user=adminUsers.find(function(u){return u.pin===pin;});
  el.textContent=user?user.name:'Unknown PIN';
  el.style.color=user?'#2563eb':'#dc2626';
}
function tcFindUser(pin){return adminUsers.find(function(u){return u.pin===pin;})||null;}
function tcToday(){return new Date().toISOString().slice(0,10);}
function tcNow(){return new Date().toISOString();}
function tcFmtTime(iso){if(!iso)return '--';return new Date(iso).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});}
function tcDiffHours(a,b){return((new Date(b)-new Date(a))/3600000);}

function tcGetActivePunch(empName){
  return tcPunches.find(function(p){return p.employee===empName&&!p.clockOut;});
}
function tcQuickPunch(){
  var pin=document.getElementById('tc-pin').value;
  var user=tcFindUser(pin);if(!user)return;
  var active=tcGetActivePunch(user.name);
  tcPunch(active?'out':'in');
}
function tcPunch(action){
  var pin=document.getElementById('tc-pin').value;
  var user=tcFindUser(pin);
  var msgEl=document.getElementById('tc-punch-msg');
  if(!user){msgEl.textContent='Invalid PIN';msgEl.style.color='#dc2626';return;}
  var active=tcGetActivePunch(user.name);
  if(action==='in'){
    if(active){msgEl.textContent=user.name+' is already clocked in';msgEl.style.color='#ea580c';return;}
    tcPunches.push({id:'TC-'+Date.now(),employee:user.name,date:tcToday(),clockIn:tcNow(),clockOut:null,type:'regular',hours:0});
    msgEl.textContent=user.name+' clocked IN at '+tcFmtTime(tcNow());msgEl.style.color='#16a34a';
  } else if(action==='out'){
    if(!active){msgEl.textContent=user.name+' is not clocked in';msgEl.style.color='#ea580c';return;}
    active.clockOut=tcNow();
    active.hours=Math.round(tcDiffHours(active.clockIn,active.clockOut)*100)/100;
    msgEl.textContent=user.name+' clocked OUT — '+active.hours.toFixed(2)+' hrs';msgEl.style.color='#dc2626';
  } else if(action==='break'){
    if(!active){msgEl.textContent=user.name+' is not clocked in';msgEl.style.color='#ea580c';return;}
    active.clockOut=tcNow();
    active.hours=Math.round(tcDiffHours(active.clockIn,active.clockOut)*100)/100;
    active.type='regular';
    // Start a break punch
    tcPunches.push({id:'TC-'+Date.now(),employee:user.name,date:tcToday(),clockIn:tcNow(),clockOut:null,type:'break',hours:0});
    msgEl.textContent=user.name+' on BREAK';msgEl.style.color='#ea580c';
  }
  tcSavePunches();tcRenderStatus();tcRenderDaily();
  document.getElementById('tc-pin').value='';
  document.getElementById('tc-pin-name').innerHTML='&nbsp;';
}

function tcRenderStatus(){
  var el=document.getElementById('tc-status-list');if(!el)return;
  var active=tcPunches.filter(function(p){return !p.clockOut;});
  if(!active.length){el.innerHTML='<div style="padding:20px;text-align:center;color:#9ca3af;font-size:12px;">No one is currently clocked in</div>';return;}
  var now=new Date();
  el.innerHTML=active.map(function(p){
    var mins=Math.floor((now-new Date(p.clockIn))/60000);
    var h=Math.floor(mins/60),m=mins%60;
    var durStr=h+'h '+m+'m';
    var isOT=h>=8;
    var isBreak=p.type==='break';
    return '<div class="tc-status-card"><div><div class="tc-status-name">'+p.employee+(isBreak?' <span class="tc-status-break">(BREAK)</span>':'')+'</div><div class="tc-status-since">Since '+tcFmtTime(p.clockIn)+'</div></div><div class="tc-status-dur'+(isOT?' overtime':'')+'">'+durStr+(isOT?' OT':'')+'</div></div>';
  }).join('');
}

function tcRenderDaily(){
  var el=document.getElementById('tc-daily');if(!el)return;
  var today=tcToday();
  document.getElementById('tc-daily-date').textContent=new Date(today+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
  var todayPunches=tcPunches.filter(function(p){return p.date===today&&p.type!=='break';});
  var empMap={};
  todayPunches.forEach(function(p){
    if(!empMap[p.employee])empMap[p.employee]=0;
    if(p.clockOut)empMap[p.employee]+=p.hours;
    else empMap[p.employee]+=tcDiffHours(p.clockIn,new Date().toISOString());
  });
  var entries=Object.keys(empMap).map(function(n){return{name:n,hours:empMap[n]};});
  entries.sort(function(a,b){return b.hours-a.hours;});
  if(!entries.length){el.innerHTML='<div style="padding:10px;color:#9ca3af;font-size:12px;">No entries today</div>';return;}
  el.innerHTML=entries.map(function(e){
    var h=Math.round(e.hours*100)/100;
    return '<div class="tc-daily-row"><span>'+e.name+'</span><span class="tc-daily-hrs'+(h>8?' overtime':'')+'">'+h.toFixed(2)+' hrs'+(h>8?' (OT)':'')+'</span></div>';
  }).join('');
}

// ── TIME CLOCK ADMIN ──
function renderTcAdmin(){
  tcLoadPunches().then(function(){
    tcRenderAdminTable();
    // Set default date range to current week
    var now=new Date();var mon=new Date(now);mon.setDate(mon.getDate()-mon.getDay());
    document.getElementById('tc-report-start').value=mon.toISOString().slice(0,10);
    document.getElementById('tc-report-end').value=now.toISOString().slice(0,10);
  });
}
function tcRenderAdminTable(){
  var tbody=document.getElementById('tc-admin-tbody');if(!tbody)return;
  var sorted=tcPunches.slice().reverse();
  tbody.innerHTML=sorted.slice(0,200).map(function(p,i){
    var idx=tcPunches.length-1-i;
    var hrs=p.clockOut?p.hours.toFixed(2):(p.type==='break'?'On break':'Active');
    var typeLabel=p.type==='break'?'<span style="color:#ea580c;">Break</span>':'Regular';
    var isOT=p.hours>8;
    return '<tr'+(isOT?' style="background:#fef2f2;"':'')+'><td>'+p.employee+'</td><td>'+p.date+'</td><td>'+tcFmtTime(p.clockIn)+'</td><td>'+tcFmtTime(p.clockOut)+'</td><td>'+typeLabel+'</td><td'+(isOT?' style="color:#dc2626;font-weight:700;"':'')+'>'+hrs+'</td><td><button class="admin-card-btn edit" onclick="tcEditPunch('+idx+')">Edit</button></td></tr>';
  }).join('')||'<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:20px;">No time entries</td></tr>';
}
function tcEditPunch(idx){
  var p=tcPunches[idx];if(!p)return;
  var newIn=prompt('Clock In (YYYY-MM-DD HH:MM):',p.clockIn?new Date(p.clockIn).toLocaleString():'');
  if(!newIn)return;
  var newOut=prompt('Clock Out (YYYY-MM-DD HH:MM, leave blank if still active):',p.clockOut?new Date(p.clockOut).toLocaleString():'');
  try{
    p.clockIn=new Date(newIn).toISOString();
    if(newOut&&newOut.trim()){p.clockOut=new Date(newOut).toISOString();p.hours=Math.round(tcDiffHours(p.clockIn,p.clockOut)*100)/100;}
    else{p.clockOut=null;p.hours=0;}
  }catch(e){toast('Invalid date format','error');return;}
  tcSavePunches();tcRenderAdminTable();toast('Punch updated','success');
}
function tcAdminManagePins(){
  var msg=adminUsers.map(function(u,i){return u.name+': '+(u.pin||'(none)');}).join('\n');
  var input=prompt('Employee PINs:\n'+msg+'\n\nTo set a PIN, enter: EmployeeName=1234');
  if(!input||!input.trim())return;
  var parts=input.split('=');if(parts.length!==2){toast('Format: Name=1234','error');return;}
  var name=parts[0].trim(),pin=parts[1].trim();
  if(pin.length!==4||isNaN(pin)){toast('PIN must be 4 digits','error');return;}
  var user=adminUsers.find(function(u){return u.name.toLowerCase()===name.toLowerCase();});
  if(!user){toast('Employee not found','error');return;}
  user.pin=pin;
  adminSave('admin-users',adminUsers);
  toast(user.name+' PIN set to '+pin,'success');
}
function tcRunReport(){
  var start=document.getElementById('tc-report-start').value;
  var end=document.getElementById('tc-report-end').value;
  if(!start||!end){toast('Select date range','error');return;}
  var filtered=tcPunches.filter(function(p){return p.date>=start&&p.date<=end&&p.type!=='break';});
  var empMap={};
  filtered.forEach(function(p){
    if(!empMap[p.employee])empMap[p.employee]={regular:0,days:{}};
    var hrs=p.clockOut?p.hours:tcDiffHours(p.clockIn,new Date().toISOString());
    empMap[p.employee].regular+=hrs;
    if(!empMap[p.employee].days[p.date])empMap[p.employee].days[p.date]=0;
    empMap[p.employee].days[p.date]+=hrs;
  });
  // Count break hours
  var breakFiltered=tcPunches.filter(function(p){return p.date>=start&&p.date<=end&&p.type==='break';});
  var breakMap={};
  breakFiltered.forEach(function(p){
    if(!breakMap[p.employee])breakMap[p.employee]=0;
    breakMap[p.employee]+=(p.clockOut?p.hours:0);
  });
  var html='<div style="font-size:13px;font-weight:700;color:#1f2937;margin-bottom:8px;">Pay Period: '+start+' to '+end+'</div>';
  html+='<table class="admin-table"><thead><tr><th>Employee</th><th>Regular Hours</th><th>Break Hours</th><th>Overtime Days</th><th>Weekly OT</th></tr></thead><tbody>';
  Object.keys(empMap).forEach(function(name){
    var e=empMap[name];
    var total=Math.round(e.regular*100)/100;
    var brk=Math.round((breakMap[name]||0)*100)/100;
    var otDays=Object.keys(e.days).filter(function(d){return e.days[d]>8;}).length;
    var weeklyOT=total>40;
    html+='<tr><td style="font-weight:600;">'+name+'</td><td'+(weeklyOT?' style="color:#dc2626;font-weight:700;"':'')+'>'+total.toFixed(2)+(weeklyOT?' (OT)':'')+'</td><td>'+brk.toFixed(2)+'</td><td>'+(otDays>0?'<span style="color:#dc2626;font-weight:700;">'+otDays+' day(s)</span>':'0')+'</td><td>'+(weeklyOT?'<span style="color:#dc2626;font-weight:700;">YES — '+(total-40).toFixed(2)+' hrs</span>':'No')+'</td></tr>';
  });
  html+='</tbody></table>';
  document.getElementById('tc-admin-report').innerHTML=html;
}
function tcExportCSV(){
  var start=document.getElementById('tc-report-start').value;
  var end=document.getElementById('tc-report-end').value;
  var filtered=tcPunches.filter(function(p){return p.date>=start&&p.date<=end;});
  var csv='Employee,Date,Clock In,Clock Out,Type,Hours\n';
  filtered.forEach(function(p){
    csv+='"'+p.employee+'","'+p.date+'","'+tcFmtTime(p.clockIn)+'","'+tcFmtTime(p.clockOut)+'","'+p.type+'","'+(p.clockOut?p.hours.toFixed(2):'active')+'"\n';
  });
  var blob=new Blob([csv],{type:'text/csv'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='timeclock_'+start+'_to_'+end+'.csv';a.click();
  toast('CSV exported','success');
}
