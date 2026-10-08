(() => {
  const $ = id => document.getElementById(id);
  const today = () => { const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` };
  const week = () => {const d=new Date(),day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`};
  const storeKey='catOfficeV1';
  let state;
  try { state=JSON.parse(localStorage.getItem(storeKey)||'null') } catch {state=null}
  if(!state || typeof state!=='object') {
    state={coins:0,food:0,fed:0,tasks:[],focusCount:0,focusSeconds:0,coffee:{},luck:{},unlocked:[],sound:true,goal:25,timer:{mode:'work',seconds:0,running:false,startedAt:0}};
    try { const old=JSON.parse(localStorage.getItem('pomodoroTasks')||'null'); if(Array.isArray(old?.tasks)) state.tasks=old.tasks.map(t=>({id:String(t.id),title:String(t.title||'未命名任务'),done:!!t.completed,date:today(),rewarded:!!t.completed})); } catch {}
    state.food=Math.max(0,Number(localStorage.getItem('deskBuddyFood'))||0);
    state.fed=Math.max(0,Number(localStorage.getItem('deskBuddyFed'))||0);
  }
  state.tasks ||= [];state.coffee ||= {};state.luck ||= {};state.unlocked ||= [];state.timer ||= {mode:'work',seconds:0,running:false,startedAt:0};
  const save=()=>{try{localStorage.setItem(storeKey,JSON.stringify(state))}catch{}};
  const date=new Date();$('todayDate').textContent=date.toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'});$('weekday').textContent=`星期${'日一二三四五六'[date.getDay()]}`;
  const showToast=text=>{const n=$('toast');n.textContent=text;n.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>n.classList.remove('show'),2600)};
  const bubble=text=>{$('catBubble').textContent=text};
  const sparkle=text=>{const n=$('sparkle');n.textContent=text;n.classList.remove('on');void n.offsetWidth;n.classList.add('on');window.catOffice3d?.feed()};
  const updateCoins=()=>{$('coinCount').textContent=state.coins};
  const grant=(n,reason)=>{state.coins+=n;updateCoins();sparkle(`✦ +${n} 🪙 ✦`);showToast(`${reason} · +${n} 金币`);save()};
  function renderTasks(){
    const list=$('taskList');list.replaceChildren();const tasks=state.tasks.filter(t=>t.date===today());
    const done=tasks.filter(t=>t.done).length;$('taskProgress').textContent=tasks.length?`已完成 ${done} 项，继续加油`:'今天还没有任务';$('taskRatio').textContent=`${done} / ${tasks.length}`;$('taskFill').style.width=tasks.length?`${done/tasks.length*100}%`:'0%';$('taskEmpty').hidden=tasks.length>0;
    tasks.forEach(task=>{const li=document.createElement('li');li.className=task.done?'done':'';const input=document.createElement('input');input.type='checkbox';input.checked=task.done;input.id=`task-${task.id}`;input.addEventListener('change',()=>{task.done=input.checked;if(task.done&&!task.rewarded){task.rewarded=true;grant(10,'完成小目标');bubble('这一件也做好啦，真棒！')}save();renderTasks();renderCollection()});const label=document.createElement('label');label.htmlFor=input.id;label.textContent=task.title;const del=document.createElement('button');del.className='delete-task';del.type='button';del.setAttribute('aria-label',`删除${task.title}`);del.textContent='×';del.addEventListener('click',()=>{state.tasks=state.tasks.filter(t=>t!==task);save();renderTasks();renderCollection()});li.append(input,label,del);list.append(li)})
  }
  $('taskForm').addEventListener('submit',e=>{e.preventDefault();const title=$('taskInput').value.trim();if(!title)return;state.tasks.unshift({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),title,date:today(),done:false,rewarded:false});$('taskInput').value='';save();renderTasks();bubble('收到！我在工位陪你做完它。')});
  document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(n=>n.classList.toggle('active',n===btn));document.querySelectorAll('.page').forEach(n=>n.classList.toggle('active',n.id===`${btn.dataset.tab}Page`))}));
  const fmt=s=>{s=Math.max(0,Math.floor(s));return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(n=>String(n).padStart(2,'0')).join(':')};
  const secondsNow=()=>state.timer.seconds+(state.timer.running?Math.max(0,Math.floor((Date.now()-state.timer.startedAt)/1000)):0);
  state.catWorkSeconds=Number(state.catWorkSeconds)||0;
  let workSaveAt=Date.now();
  function countCatWork(){
    if(state.timer.mode!=='work'||!state.timer.running)return;
    const now=Date.now(),last=state.catWorkLastAt||now;
    const elapsed=Math.max(0,(now-last)/1000);
    const timeAtLast=state.timer.seconds+Math.max(0,(last-state.timer.startedAt)/1000);
    state.catWorkSeconds+=Math.min(elapsed,Math.max(0,state.goal*60-timeAtLast));
    state.catWorkLastAt=now;
    if(state.catWorkSeconds>=2700){state.catWorkSeconds-=2700;if(window.catOffice3d)window.catOffice3d.toiletTrip();else window.catOfficePendingToilet=true;window.dispatchEvent(new Event('cat-office:toilet'));save()}
    if(now-workSaveAt>5000){save();workSaveAt=now}
  }
  const pause=()=>{if(state.timer.running){countCatWork();state.timer.seconds=secondsNow();state.timer.running=false;state.timer.startedAt=0;state.catWorkLastAt=0;save()}};
  function completeFocus(){
    const spent=secondsNow();pause();state.focusCount++;state.focusSeconds+=spent;state.food++;state.coffee[week()]=(state.coffee[week()]||0)+1;state.coins+=20;state.timer={mode:'rest',seconds:0,running:false,startedAt:0};updateCoins();sparkle('✦ +20 🪙 · 🥣 ✦');bubble('做完一轮啦！来喂喂我？');showToast('专注完成！获得 20 金币、猫粮和咖啡杯');renderPet();renderCollection();save();beep();updateTimer();
  }
  function beep(){if(!state.sound)return;try{const ac=new(window.AudioContext||window.webkitAudioContext)(),o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.frequency.value=660;g.gain.setValueAtTime(.04,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.18);o.start();o.stop(ac.currentTime+.2)}catch{}}
  function updateTimer(){
    const t=state.timer,work=t.mode==='work';countCatWork();const sec=secondsNow();
    if(work&&t.running&&sec>=state.goal*60){completeFocus();return}
    const v=fmt(sec);$('quickTime').textContent=v;$('timerBig').textContent=v;$('quickLabel').textContent=work?'专注计时':'休息计时';$('timerMode').textContent=work?(t.running?'小猫正在认真上班':'准备一起专注'):(t.running?'小猫正在摸鱼休息':'准备好好休息');$('quickCaption').textContent=work?`本轮目标 ${state.goal} 分钟`:'休息一下，回来继续';$('timerHint').textContent=work?`已专注 ${Math.floor(sec/60)} 分钟 · 完成 ${state.goal} 分钟获得奖励`:'放松一下，不需要赶时间。';$('timerStart').textContent=t.running?'暂停计时':(work?'开始专注':'开始休息');$('quickStart').textContent=t.running?'Ⅱ':'▶';$('quickStart').setAttribute('aria-label',t.running?'暂停计时':'开始计时');$('timerRest').textContent=work?'下班休息':'回去上班';if(!$('sceneWrap').dataset.catActivity)$('catStatus').textContent=work?(t.running?'● 努力工作中':'● 正在发呆'):(t.running?'● 悠闲休息中':'● 准备休息');window.catOfficeTimerMode=work&&t.running?'work':'rest';window.catOffice3d?.setMode(window.catOfficeTimerMode);const remaining=Math.max(0,2700-state.catWorkSeconds);$('toiletClock').textContent=`🚽 下一次思考人生 · ${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(Math.floor(remaining%60)).padStart(2,'0')}`;$('topMood').textContent=work?(t.running?'橘猫陪你专注中':'今天也一起慢慢来'):'休息，是认真生活的一部分';
  }
  const toggleTimer=()=>{if(state.timer.running){pause();bubble('暂停一下也没关系。')}else{state.timer.running=true;state.timer.startedAt=Date.now();state.catWorkLastAt=Date.now();save();bubble(state.timer.mode==='work'?'我在敲键盘，你也加油！':'放空五分钟，喝口水吧。')}updateTimer()};
  $('quickStart').addEventListener('click',toggleTimer);$('timerStart').addEventListener('click',toggleTimer);$('timerRest').addEventListener('click',()=>{pause();state.timer={mode:state.timer.mode==='work'?'rest':'work',seconds:0,running:false,startedAt:0};save();updateTimer();bubble(state.timer.mode==='work'?'回来啦，下一轮慢慢开始。':'下班啦，先陪我歇会儿。')});
  $('goalMinutes').value=String([1,5,15,25].includes(Number(state.goal))?state.goal:25);$('goalLabel').textContent=`${$('goalMinutes').value} 分钟`;$('goalMinutes').addEventListener('change',()=>{if(state.timer.running){$('goalMinutes').value=String(state.goal);showToast('请先暂停计时再修改目标');return}state.goal=Number($('goalMinutes').value);$('goalLabel').textContent=`${state.goal} 分钟`;save();updateTimer()});setInterval(updateTimer,500);updateTimer();
  function renderPet(){$('foodCount').textContent=state.food;$('feedBtn').disabled=state.food<1;$('petMood').textContent=state.food?'小猫闻到猫粮香味啦':'陪你摸鱼，也陪你认真';$('petSub').textContent=state.food?'有猫粮啦，快来投喂':'完成一轮专注，猫粮就会送到工位'}
  $('feedBtn').addEventListener('click',()=>{if(!state.food)return;state.food--;state.fed++;save();renderPet();renderCollection();sparkle('♡ 喵呜 ♡');bubble('喵呜！谢谢你，我吃饱啦。');showToast('投喂成功，小猫开心地蹭蹭你');window.catOffice3d?.feed()});
  const lunches=[['🍜','热汤面','暖呼呼的一碗，适合慢下来。'],['🍗','脆皮炸鸡饭','今天努力过，吃点快乐的。'],['🥗','清爽沙拉碗','给下午留一点轻盈。'],['🍛','咖喱饭','香喷喷的幸福感，刚刚好。'],['🥟','饺子','一口一个，把烦恼吃掉。'],['🍣','寿司','换换口味，给午休一点仪式感。'],['🍲','小火锅','今天适合热热闹闹地吃。'],['🥪','三明治','轻松解决午饭，多留一点休息时间。']];
  $('lunchTags').replaceChildren(...lunches.map(x=>{let n=document.createElement('span');n.textContent=`${x[0]} ${x[1]}`;return n}));let lastLunch=-1;$('drawLunch').addEventListener('click',()=>{let i;do{i=Math.floor(Math.random()*lunches.length)}while(i===lastLunch);lastLunch=i;const [emoji,name,desc]=lunches[i];$('lunchEmoji').textContent=emoji;$('lunchResult').textContent=name;$('lunchDesc').textContent=desc;bubble(`午餐就吃${name}，我赞成！`)});
  const fortunes=[['🌟','大吉 · 灵感来敲门','今天的好想法，可能藏在一杯水和一次深呼吸里。'],['🍀','小吉 · 稳稳向前','不必把一整天做好，先把眼前一件事做好。'],['☁️','平 · 慢一点也好','别急着追上谁，你已经在往前走了。'],['🌼','中吉 · 有小惊喜','认真完成的小事，会在某个时候回赠你一点快乐。'],['☕','小吉 · 适合休息','允许自己稍微发会儿呆，再回来也来得及。']];
  function renderFortune(){const f=state.luck[today()];if(f){$('fortuneIcon').textContent=f[0];$('fortuneTitle').textContent=f[1];$('fortuneQuote').textContent=f[2];$('drawFortune').disabled=true;$('drawFortune').textContent='明天再抽一签 ♡';$('fortuneFootnote').textContent='今天的好运已签收，明天见。'}}
  $('drawFortune').addEventListener('click',()=>{if(state.luck[today()])return;state.luck[today()]=fortunes[Math.floor(Math.random()*fortunes.length)];save();renderFortune();bubble('好运签收！今天也要对自己好一点。');sparkle('✦ 好运 ✦')});
  const shop=[{id:'ribbon',name:'蝴蝶结',emoji:'🎀',cost:30},{id:'plant',name:'窗边绿植',emoji:'🪴',cost:50},{id:'star',name:'星星挂饰',emoji:'⭐',cost:80}];
  function renderCollection(){ $('statFocus').textContent=state.focusCount||0;$('statTasks').textContent=state.tasks.filter(t=>t.done).length;$('statFed').textContent=state.fed||0;const n=state.coffee[week()]||0;$('coffeeText').textContent=`${Math.min(n,5)} / 5`;$('cups').innerHTML=Array.from({length:5},(_,i)=>`<span class="${i<n?'':'muted'}" aria-label="${i<n?'已获得':'未获得'}的咖啡杯">☕</span>`).join('');$('shopItems').replaceChildren(...shop.map(item=>{let row=document.createElement('div');row.className='shop-item';let icon=document.createElement('b');icon.textContent=item.emoji;let title=document.createElement('span');title.textContent=item.name;let button=document.createElement('button');let owned=state.unlocked.includes(item.id);button.textContent=owned?'已解锁':`${item.cost} 🪙 解锁`;button.disabled=owned||state.coins<item.cost;button.addEventListener('click',()=>{if(state.coins<item.cost||state.unlocked.includes(item.id))return;state.coins-=item.cost;state.unlocked.push(item.id);save();updateCoins();renderCollection();bubble(`${item.name}到工位啦！`);sparkle(`✦ ${item.emoji} ✦`);showToast(`已解锁${item.name}`)});row.append(icon,title,button);return row}));$('decorations').replaceChildren(...shop.filter(item=>state.unlocked.includes(item.id)).map(item=>{const n=document.createElement('span');n.className=`decor decor-${item.id}`;n.textContent=item.emoji;return n}))}
  $('soundToggle').textContent=state.sound?'🔔':'🔕';$('soundToggle').addEventListener('click',()=>{state.sound=!state.sound;$('soundToggle').textContent=state.sound?'🔔':'🔕';save();showToast(state.sound?'提示音已开启':'提示音已关闭')});
  updateCoins();renderPet();renderTasks();renderFortune();renderCollection();save();
})();
