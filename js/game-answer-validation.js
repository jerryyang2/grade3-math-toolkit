/* 純資料判分：保留小數、正負號、分數、餘數與時刻；不執行使用者輸入。 */
(function(root){
 'use strict';
 const clean=value=>String(value).normalize('NFKC').trim().replace(/[−－]/g,'-').replace(/，/g,',').replace(/\s+/g,'').toLowerCase();
 const unitPattern='平方公分|平方公尺|平方毫米|公分|公尺|毫米|公里|公升|毫升|分鐘|小時|秒鐘|秒|元|個|本|顆|塊|盒|袋|張|條|片|朵|人|杯|套|枝|組|天|mL|cm|mm|km|m|L';
 const units={毫米:['length',1],mm:['length',1],公分:['length',10],cm:['length',10],公尺:['length',1000],m:['length',1000],公里:['length',1e6],km:['length',1e6],毫升:['volume',1],ml:['volume',1],公升:['volume',1000],l:['volume',1000],分鐘:['time',60],小時:['time',3600],秒:['time',1],秒鐘:['time',1]};
 function contextUnit(text){const matches=[...String(text||'').matchAll(new RegExp('(?:多少|幾|[)）])\\s*('+unitPattern+')','gi'))];return matches.at(-1)?.[1].toLowerCase()||'';}
 function quantity(value){
  let s=clean(value);if(!s||s.length>120)return null;
  const remainder=s.match(/^(\d+)(?:餘|余|⋯|\.{3}|remainder|r)(\d+)$/);if(remainder)return {kind:'remainder',q:Number(remainder[1]),r:Number(remainder[2])};
  const clock=s.match(/^(上午|下午)?(\d{1,2})(?:時|:)(\d{1,2})分?$/);if(clock){let h=Number(clock[2]),m=Number(clock[3]);if(m>59||h>23||clock[1]&&h>12)return null;if(clock[1]==='下午'&&h<12)h+=12;if(clock[1]==='上午'&&h===12)h=0;return {kind:'clock',value:h*60+m};}
  const unit=s.match(new RegExp('('+unitPattern+')$','i'));let label=unit?.[1].toLowerCase()||'';if(unit)s=s.slice(0,-unit[0].length);
  let percent=s.endsWith('%');if(percent)s=s.slice(0,-1);
  if(s.includes(',')){if(!/^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(s))return null;s=s.replaceAll(',','');}
  let number;const fraction=s.match(/^([+-]?\d+)\/(\d+)$/);
  if(fraction){if(Number(fraction[2])===0)return null;number=Number(fraction[1])/Number(fraction[2]);}
  else if(/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(s))number=Number(s);else return null;
  if(!Number.isFinite(number))return null;
  return {kind:'number',value:percent?number/100:number,unit:label,percent};
 }
 function equivalent(user,expected,context=''){
  const a=quantity(user),b=quantity(expected);if(!a||!b)return clean(user)!==''&&clean(user)===clean(expected);
  if(a.kind!==b.kind)return false;if(a.kind==='remainder')return a.q===b.q&&a.r===b.r;
  if(a.kind==='clock')return a.value===b.value;
  const hinted=contextUnit(context),ua=a.unit||b.unit||hinted,ub=b.unit||hinted;
  if(ua!==ub){const ca=units[ua],cb=units[ub];return !!(ca&&cb&&ca[0]===cb[0]&&Math.abs(a.value*ca[1]-b.value*cb[1])<1e-8);}
  return Math.abs(a.value-b.value)<1e-8;
 }
 function expression(value){
  let source=clean(value).replace(/[×x✕]/g,'*').replace(/[÷]/g,'/').replace(/(\d{1,2}):(\d{2})/g,(_,h,m)=>`(${Number(h)*60+Number(m)})`).replace(/(\d+)時(\d+)分/g,(_,h,m)=>`(${Number(h)*60+Number(m)})`).replace(/(\d+)(?:公分|毫米|公升|毫升|分鐘|分|元|個)/g,'$1');
  if(!source||source.length>160||/[^\d.+\-*/(),gcdlm]/.test(source))return null;let i=0,nodes=0;
  function primary(){if(++nodes>80)throw Error();if(source[i]==='+'||source[i]==='-'){const sign=source[i++];return (sign==='-'?-1:1)*primary();}const fn=source.slice(i).match(/^(gcd|lcm)\(/);if(fn){i+=fn[0].length;const a=sum();if(source[i++]!==',')throw Error();const b=sum();if(source[i++]!==')'||!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||a<=0||b<=0)throw Error();let x=a,y=b;while(y)[x,y]=[y,x%y];return fn[1]==='gcd'?x:a/x*b;}if(source[i]==='('){i++;const v=sum();if(source[i++]!==')')throw Error();return v;}const match=source.slice(i).match(/^(?:\d+(?:\.\d+)?|\.\d+)/);if(!match)throw Error();i+=match[0].length;return Number(match[0]);}
  function product(){let result=primary();while(source[i]==='*'||source[i]==='/'){const op=source[i++],right=primary();if(op==='/'&&right===0)throw Error();result=op==='*'?result*right:result/right;}return result;}
  function sum(){let result=product();while(source[i]==='+'||source[i]==='-'){const op=source[i++],right=product();result=op==='+'?result+right:result-right;}return result;}
  try{const result=sum();return i===source.length&&Number.isFinite(result)?result:null;}catch{return null;}
 }
 function checkFormula(user,expected,answer){
  const parts=String(user).normalize('NFKC').split(/[=＝]/);if(parts.length>2||!/(?:[+\-−－×x*÷/]|\b(?:gcd|lcm)\()/i.test(parts[0]))return false;
  const actual=expression(parts[0]),reference=expression(expected);if(actual===null)return false;
  if(parts.length===2&&!equivalent(parts[1],answer))return false;
  return reference===null?null:Math.abs(actual-reference)<1e-8;
 }
 const api={quantity,equivalent,expression,checkFormula};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MathGameAnswers=api;
})(typeof window!=='undefined'?window:globalThis);
