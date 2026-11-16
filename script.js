const $=id=>document.getElementById(id);
// emoji rain
const em=['🤖','⚙️','🔧','⚡','🔩','🦾','🛰️','✨'],rain=$('rain');
function drop(){const e=document.createElement('div');e.className='drop';e.textContent=em[Math.random()*em.length|0];
e.style.left=Math.random()*100+'vw';e.style.fontSize=(18+Math.random()*30)+'px';
const d=5+Math.random()*7;e.style.animationDuration=d+'s';rain.appendChild(e);setTimeout(()=>e.remove(),d*1000)}
setInterval(drop,350);for(let i=0;i<10;i++)setTimeout(drop,i*120);
// login
let inn=false;try{inn=sessionStorage.getItem('isLoggedIn')==='true'}catch(e){}
function view(){$('login').hidden=inn;$('dash').hidden=!inn}
view();
$('form').onsubmit=e=>{e.preventDefault();
if($('u').value==='admin'&&$('p').value==='12345'){inn=true;try{sessionStorage.setItem('isLoggedIn','true')}catch(_){}$('err').textContent='';view()}
else{$('err').textContent='Username atau password salah!';const c=$('form');c.classList.remove('shake');void c.offsetWidth;c.classList.add('shake')}};
$('out').onclick=()=>{inn=false;try{sessionStorage.removeItem('isLoggedIn')}catch(e){}if(dev&&dev.gatt.connected)dev.gatt.disconnect();view()};
// settings
const speed=$('speed'),acc=$('acc'),chip=$('chip'),btn=$('conn'),mid=$('mid');
function upd(){$('sv').textContent='Level '+speed.value;$('av').textContent='Level '+acc.value}
speed.oninput=()=>{upd();send('speed:'+speed.value)};acc.oninput=()=>{upd();send('acc:'+acc.value)};upd();
const dr=$('drawer');$('tab').onclick=chip.onclick=()=>dr.classList.toggle('open');
// connection (Bluetooth BLE UART + USB serial)
const NUS='6e400001-b5a3-f393-e0a9-e50e24dcca9e',NUS_W='6e400002-b5a3-f393-e0a9-e50e24dcca9e',HM='0000ffe0-0000-1000-8000-00805f9b34fb',HM_C='0000ffe1-0000-1000-8000-00805f9b34fb';
let dev=null,chr=null,q=Promise.resolve(),wr=null,port=null;
function setChip(t,ok){chip.textContent=t;chip.classList.toggle('ok',!!ok)}
function send(s){const d=new TextEncoder().encode(s+'\n');
if(wr){wr.write(d).catch(()=>{});return}
if(!chr)return;
q=q.then(()=>chr.properties.writeWithoutResponse?chr.writeValueWithoutResponse(d):chr.writeValue(d)).catch(()=>{})}
function errMsg(e){const m=(e&&e.message)||String(e);
if(/policy|SecurityError|disallowed/i.test(m+(e&&e.name)))return 'Diblokir viewer. Buka link di tab baru Chrome/Edge.';
if(e&&e.name==='NotFoundError')return 'Tidak ada perangkat dipilih / tidak ketemu.';
if(/service|characteristic/i.test(m))return 'Service UART tidak ditemukan di perangkat.';
return 'Gagal: '+m}
btn.onclick=async()=>{
if(dev&&dev.gatt.connected){dev.gatt.disconnect();return}
if(!navigator.bluetooth){setChip('Browser tidak mendukung Bluetooth. Pakai Chrome/Edge.');return}
try{setChip('Mencari perangkat...');
dev=await navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:[NUS,HM]});
dev.addEventListener('gattserverdisconnected',()=>{chr=null;btn.textContent='Hubungkan Bluetooth';btn.classList.remove('live');setChip('Bluetooth terputus')});
const srv=await dev.gatt.connect();
try{const s=await srv.getPrimaryService(NUS);const chars=await s.getCharacteristics();chr=chars.find(c=>c.properties.write||c.properties.writeWithoutResponse)||await s.getCharacteristic(NUS_W)}
catch(_){const s=await srv.getPrimaryService(HM);chr=await s.getCharacteristic(HM_C)}
btn.textContent='Putuskan Bluetooth';btn.classList.add('live');setChip('Terhubung: '+(dev.name||'Robot'),true);
send('speed:'+speed.value);send('acc:'+acc.value)
}catch(e){setChip(errMsg(e))}};
$('usb').onclick=async()=>{const u=$('usb');
if(wr){try{wr.releaseLock();await port.close()}catch(e){}wr=null;u.textContent='Hubungkan via USB';u.classList.remove('live');setChip('USB terputus');return}
if(!navigator.serial){setChip('Browser tidak mendukung USB Serial. Pakai Chrome/Edge di laptop.');return}
try{port=await navigator.serial.requestPort();await port.open({baudRate:115200});
wr=port.writable.getWriter();u.textContent='Putuskan USB';u.classList.add('live');setChip('Terhubung via USB',true);
send('speed:'+speed.value);send('acc:'+acc.value)}catch(e){setChip(errMsg(e))}};
if(window.top!==window.self)setChip('Tip: kalau Connect gagal, buka link di tab baru');
// buttons
function press(b,command=b.dataset.c){b.classList.add('on');send(command)}
document.querySelectorAll('[data-c]').forEach(b=>{
b.addEventListener('pointerdown',e=>{e.preventDefault();press(b)});
['pointerup','pointerleave','pointercancel'].forEach(t=>b.addEventListener(t,()=>b.classList.remove('on')))});
let st;mid.addEventListener('click',()=>{mid.style.setProperty('--spin',(0.9-speed.value*0.07)+'s');mid.classList.add('spin');
clearTimeout(st);st=setTimeout(()=>mid.classList.remove('spin'),2200)});
// keyboard
const keyMap={
ArrowUp:{id:'btnForward',command:'UP'},
KeyW:{id:'btnForward',command:'UP'},
ArrowDown:{id:'btnBackward',command:'DOWN'},
KeyS:{id:'btnBackward',command:'DOWN'},
ArrowLeft:{id:'btnLeft',command:'LEFT'},
KeyA:{id:'btnLeft',command:'LEFT'},
ArrowRight:{id:'btnRight',command:'RIGHT'},
KeyD:{id:'btnRight',command:'RIGHT'},
Space:{id:'btnStop',command:'STOP'},
KeyX:{id:'btnStop',command:'STOP'},
KeyG:{id:'btnGrip',command:'GRIP'},
KeyO:{id:'btnRelease',command:'Release'},
KeyR:{id:'btnRelease',command:'Release'}
};
addEventListener('keydown',e=>{if(!inn||e.target.tagName==='INPUT'||e.repeat)return;const mapping=keyMap[e.code];if(!mapping)return;e.preventDefault();
const b=$(mapping.id);if(b&&!b.classList.contains('on'))press(b,mapping.command)});
addEventListener('keyup',e=>{const mapping=keyMap[e.code];if(!mapping)return;const b=$(mapping.id);if(b)b.classList.remove('on')});