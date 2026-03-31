import{g as ot,c as at,w as ge,a as it,q as ct}from"./firebase-firestore-vendor-CANWFFbV.js";import{getAuth as lt}from"./firebase-core-vendor-FqT57UQ5.js";const dt=()=>{};var _e={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ue=function(e){const t=[];let r=0;for(let s=0;s<e.length;s++){let n=e.charCodeAt(s);n<128?t[r++]=n:n<2048?(t[r++]=n>>6|192,t[r++]=n&63|128):(n&64512)===55296&&s+1<e.length&&(e.charCodeAt(s+1)&64512)===56320?(n=65536+((n&1023)<<10)+(e.charCodeAt(++s)&1023),t[r++]=n>>18|240,t[r++]=n>>12&63|128,t[r++]=n>>6&63|128,t[r++]=n&63|128):(t[r++]=n>>12|224,t[r++]=n>>6&63|128,t[r++]=n&63|128)}return t},ut=function(e){const t=[];let r=0,s=0;for(;r<e.length;){const n=e[r++];if(n<128)t[s++]=String.fromCharCode(n);else if(n>191&&n<224){const o=e[r++];t[s++]=String.fromCharCode((n&31)<<6|o&63)}else if(n>239&&n<365){const o=e[r++],a=e[r++],i=e[r++],c=((n&7)<<18|(o&63)<<12|(a&63)<<6|i&63)-65536;t[s++]=String.fromCharCode(55296+(c>>10)),t[s++]=String.fromCharCode(56320+(c&1023))}else{const o=e[r++],a=e[r++];t[s++]=String.fromCharCode((n&15)<<12|(o&63)<<6|a&63)}}return t.join("")},He={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(e,t){if(!Array.isArray(e))throw Error("encodeByteArray takes an array as a parameter");this.init_();const r=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,s=[];for(let n=0;n<e.length;n+=3){const o=e[n],a=n+1<e.length,i=a?e[n+1]:0,c=n+2<e.length,u=c?e[n+2]:0,h=o>>2,m=(o&3)<<4|i>>4;let l=(i&15)<<2|u>>6,p=u&63;c||(p=64,a||(l=64)),s.push(r[h],r[m],r[l],r[p])}return s.join("")},encodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(Ue(e),t)},decodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):ut(this.decodeStringToByteArray(e,t))},decodeStringToByteArray(e,t){this.init_();const r=t?this.charToByteMapWebSafe_:this.charToByteMap_,s=[];for(let n=0;n<e.length;){const o=r[e.charAt(n++)],i=n<e.length?r[e.charAt(n)]:0;++n;const u=n<e.length?r[e.charAt(n)]:64;++n;const m=n<e.length?r[e.charAt(n)]:64;if(++n,o==null||i==null||u==null||m==null)throw new ht;const l=o<<2|i>>4;if(s.push(l),u!==64){const p=i<<4&240|u>>2;if(s.push(p),m!==64){const g=u<<6&192|m;s.push(g)}}}return s},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}};class ht extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const ft=function(e){const t=Ue(e);return He.encodeByteArray(t,!0)},G=function(e){return ft(e).replace(/\./g,"")},mt=function(e){try{return He.decodeString(e,!0)}catch(t){console.error("base64Decode failed: ",t)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function pt(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gt=()=>pt().__FIREBASE_DEFAULTS__,_t=()=>{if(typeof process>"u"||typeof _e>"u")return;const e=_e.__FIREBASE_DEFAULTS__;if(e)return JSON.parse(e)},bt=()=>{if(typeof document>"u")return;let e;try{e=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const t=e&&mt(e[1]);return t&&JSON.parse(t)},J=()=>{try{return dt()||gt()||_t()||bt()}catch(e){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);return}},Et=e=>{var t,r;return(r=(t=J())===null||t===void 0?void 0:t.emulatorHosts)===null||r===void 0?void 0:r[e]},yt=e=>{const t=Et(e);if(!t)return;const r=t.lastIndexOf(":");if(r<=0||r+1===t.length)throw new Error(`Invalid host ${t} with no separate hostname and port!`);const s=parseInt(t.substring(r+1),10);return t[0]==="["?[t.substring(1,r-1),s]:[t.substring(0,r),s]},$e=()=>{var e;return(e=J())===null||e===void 0?void 0:e.config},zs=e=>{var t;return(t=J())===null||t===void 0?void 0:t[`_${e}`]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class It{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((t,r)=>{this.resolve=t,this.reject=r})}wrapCallback(t){return(r,s)=>{r?this.reject(r):this.resolve(s),typeof t=="function"&&(this.promise.catch(()=>{}),t.length===1?t(r):t(r,s))}}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Fe(e){try{return(e.startsWith("http://")||e.startsWith("https://")?new URL(e).hostname:e).endsWith(".cloudworkstations.dev")}catch{return!1}}async function vt(e){return(await fetch(e,{credentials:"include"})).ok}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function At(e,t){if(e.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const r={alg:"none",type:"JWT"},s=t||"demo-project",n=e.iat||0,o=e.sub||e.user_id;if(!o)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const a=Object.assign({iss:`https://securetoken.google.com/${s}`,aud:s,iat:n,exp:n+3600,auth_time:n,sub:o,user_id:o,firebase:{sign_in_provider:"custom",identities:{}}},e);return[G(JSON.stringify(r)),G(JSON.stringify(a)),""].join(".")}const U={};function wt(){const e={prod:[],emulator:[]};for(const t of Object.keys(U))U[t]?e.emulator.push(t):e.prod.push(t);return e}function Ct(e){let t=document.getElementById(e),r=!1;return t||(t=document.createElement("div"),t.setAttribute("id",e),r=!0),{created:r,element:t}}let be=!1;function Tt(e,t){if(typeof window>"u"||typeof document>"u"||!Fe(window.location.host)||U[e]===t||U[e]||be)return;U[e]=t;function r(l){return`__firebase__banner__${l}`}const s="__firebase__banner",o=wt().prod.length>0;function a(){const l=document.getElementById(s);l&&l.remove()}function i(l){l.style.display="flex",l.style.background="#7faaf0",l.style.position="fixed",l.style.bottom="5px",l.style.left="5px",l.style.padding=".5em",l.style.borderRadius="5px",l.style.alignItems="center"}function c(l,p){l.setAttribute("width","24"),l.setAttribute("id",p),l.setAttribute("height","24"),l.setAttribute("viewBox","0 0 24 24"),l.setAttribute("fill","none"),l.style.marginLeft="-6px"}function u(){const l=document.createElement("span");return l.style.cursor="pointer",l.style.marginLeft="16px",l.style.fontSize="24px",l.innerHTML=" &times;",l.onclick=()=>{be=!0,a()},l}function h(l,p){l.setAttribute("id",p),l.innerText="Learn more",l.href="https://firebase.google.com/docs/studio/preview-apps#preview-backend",l.setAttribute("target","__blank"),l.style.paddingLeft="5px",l.style.textDecoration="underline"}function m(){const l=Ct(s),p=r("text"),g=document.getElementById(p)||document.createElement("span"),w=r("learnmore"),_=document.getElementById(w)||document.createElement("a"),O=r("preprendIcon"),N=document.getElementById(O)||document.createElementNS("http://www.w3.org/2000/svg","svg");if(l.created){const y=l.element;i(y),h(_,w);const b=u();c(N,O),y.append(N,g,_,b),document.body.appendChild(y)}o?(g.innerText="Preview backend disconnected.",N.innerHTML=`<g clip-path="url(#clip0_6013_33858)">
<path d="M4.8 17.6L12 5.6L19.2 17.6H4.8ZM6.91667 16.4H17.0833L12 7.93333L6.91667 16.4ZM12 15.6C12.1667 15.6 12.3056 15.5444 12.4167 15.4333C12.5389 15.3111 12.6 15.1667 12.6 15C12.6 14.8333 12.5389 14.6944 12.4167 14.5833C12.3056 14.4611 12.1667 14.4 12 14.4C11.8333 14.4 11.6889 14.4611 11.5667 14.5833C11.4556 14.6944 11.4 14.8333 11.4 15C11.4 15.1667 11.4556 15.3111 11.5667 15.4333C11.6889 15.5444 11.8333 15.6 12 15.6ZM11.4 13.6H12.6V10.4H11.4V13.6Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6013_33858">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`):(N.innerHTML=`<g clip-path="url(#clip0_6083_34804)">
<path d="M11.4 15.2H12.6V11.2H11.4V15.2ZM12 10C12.1667 10 12.3056 9.94444 12.4167 9.83333C12.5389 9.71111 12.6 9.56667 12.6 9.4C12.6 9.23333 12.5389 9.09444 12.4167 8.98333C12.3056 8.86111 12.1667 8.8 12 8.8C11.8333 8.8 11.6889 8.86111 11.5667 8.98333C11.4556 9.09444 11.4 9.23333 11.4 9.4C11.4 9.56667 11.4556 9.71111 11.5667 9.83333C11.6889 9.94444 11.8333 10 12 10ZM12 18.4C11.1222 18.4 10.2944 18.2333 9.51667 17.9C8.73889 17.5667 8.05556 17.1111 7.46667 16.5333C6.88889 15.9444 6.43333 15.2611 6.1 14.4833C5.76667 13.7056 5.6 12.8778 5.6 12C5.6 11.1111 5.76667 10.2833 6.1 9.51667C6.43333 8.73889 6.88889 8.06111 7.46667 7.48333C8.05556 6.89444 8.73889 6.43333 9.51667 6.1C10.2944 5.76667 11.1222 5.6 12 5.6C12.8889 5.6 13.7167 5.76667 14.4833 6.1C15.2611 6.43333 15.9389 6.89444 16.5167 7.48333C17.1056 8.06111 17.5667 8.73889 17.9 9.51667C18.2333 10.2833 18.4 11.1111 18.4 12C18.4 12.8778 18.2333 13.7056 17.9 14.4833C17.5667 15.2611 17.1056 15.9444 16.5167 16.5333C15.9389 17.1111 15.2611 17.5667 14.4833 17.9C13.7167 18.2333 12.8889 18.4 12 18.4ZM12 17.2C13.4444 17.2 14.6722 16.6944 15.6833 15.6833C16.6944 14.6722 17.2 13.4444 17.2 12C17.2 10.5556 16.6944 9.32778 15.6833 8.31667C14.6722 7.30555 13.4444 6.8 12 6.8C10.5556 6.8 9.32778 7.30555 8.31667 8.31667C7.30556 9.32778 6.8 10.5556 6.8 12C6.8 13.4444 7.30556 14.6722 8.31667 15.6833C9.32778 16.6944 10.5556 17.2 12 17.2Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6083_34804">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`,g.innerText="Preview backend running in this workspace."),g.setAttribute("id",p)}document.readyState==="loading"?window.addEventListener("DOMContentLoaded",m):m()}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ze(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function Vs(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(ze())}function St(){var e;const t=(e=J())===null||e===void 0?void 0:e.forceEnvironment;if(t==="node")return!0;if(t==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function js(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function Ws(){const e=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof e=="object"&&e.id!==void 0}function Gs(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function qs(){const e=ze();return e.indexOf("MSIE ")>=0||e.indexOf("Trident/")>=0}function Ys(){return!St()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function Dt(){try{return typeof indexedDB=="object"}catch{return!1}}function Rt(){return new Promise((e,t)=>{try{let r=!0;const s="validate-browser-context-for-indexeddb-analytics-module",n=self.indexedDB.open(s);n.onsuccess=()=>{n.result.close(),r||self.indexedDB.deleteDatabase(s),e(!0)},n.onupgradeneeded=()=>{r=!1},n.onerror=()=>{var o;t(((o=n.error)===null||o===void 0?void 0:o.message)||"")}}catch(r){t(r)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ot="FirebaseError";class P extends Error{constructor(t,r,s){super(r),this.code=t,this.customData=s,this.name=Ot,Object.setPrototypeOf(this,P.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,Ve.prototype.create)}}class Ve{constructor(t,r,s){this.service=t,this.serviceName=r,this.errors=s}create(t,...r){const s=r[0]||{},n=`${this.service}/${t}`,o=this.errors[t],a=o?kt(o,s):"Error",i=`${this.serviceName}: ${a} (${n}).`;return new P(n,i,s)}}function kt(e,t){return e.replace(Nt,(r,s)=>{const n=t[s];return n!=null?String(n):`<${s}?>`})}const Nt=/\{\$([^}]+)}/g;function Ks(e){for(const t in e)if(Object.prototype.hasOwnProperty.call(e,t))return!1;return!0}function ie(e,t){if(e===t)return!0;const r=Object.keys(e),s=Object.keys(t);for(const n of r){if(!s.includes(n))return!1;const o=e[n],a=t[n];if(Ee(o)&&Ee(a)){if(!ie(o,a))return!1}else if(o!==a)return!1}for(const n of s)if(!r.includes(n))return!1;return!0}function Ee(e){return e!==null&&typeof e=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Js(e){const t=[];for(const[r,s]of Object.entries(e))Array.isArray(s)?s.forEach(n=>{t.push(encodeURIComponent(r)+"="+encodeURIComponent(n))}):t.push(encodeURIComponent(r)+"="+encodeURIComponent(s));return t.length?"&"+t.join("&"):""}function Zs(e){const t={};return e.replace(/^\?/,"").split("&").forEach(s=>{if(s){const[n,o]=s.split("=");t[decodeURIComponent(n)]=decodeURIComponent(o)}}),t}function Xs(e){const t=e.indexOf("?");if(!t)return"";const r=e.indexOf("#",t);return e.substring(t,r>0?r:void 0)}function Qs(e,t){const r=new Pt(e,t);return r.subscribe.bind(r)}class Pt{constructor(t,r){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=r,this.task.then(()=>{t(this)}).catch(s=>{this.error(s)})}next(t){this.forEachObserver(r=>{r.next(t)})}error(t){this.forEachObserver(r=>{r.error(t)}),this.close(t)}complete(){this.forEachObserver(t=>{t.complete()}),this.close()}subscribe(t,r,s){let n;if(t===void 0&&r===void 0&&s===void 0)throw new Error("Missing Observer.");Bt(t,["next","error","complete"])?n=t:n={next:t,error:r,complete:s},n.next===void 0&&(n.next=ee),n.error===void 0&&(n.error=ee),n.complete===void 0&&(n.complete=ee);const o=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?n.error(this.finalError):n.complete()}catch{}}),this.observers.push(n),o}unsubscribeOne(t){this.observers===void 0||this.observers[t]===void 0||(delete this.observers[t],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(t){if(!this.finalized)for(let r=0;r<this.observers.length;r++)this.sendOne(r,t)}sendOne(t,r){this.task.then(()=>{if(this.observers!==void 0&&this.observers[t]!==void 0)try{r(this.observers[t])}catch(s){typeof console<"u"&&console.error&&console.error(s)}})}close(t){this.finalized||(this.finalized=!0,t!==void 0&&(this.finalError=t),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function Bt(e,t){if(typeof e!="object"||e===null)return!1;for(const r of t)if(r in e&&typeof e[r]=="function")return!0;return!1}function ee(){}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xt(e){return e&&e._delegate?e._delegate:e}class F{constructor(t,r,s){this.name=t,this.instanceFactory=r,this.type=s,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const k="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mt{constructor(t,r){this.name=t,this.container=r,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(t){const r=this.normalizeInstanceIdentifier(t);if(!this.instancesDeferred.has(r)){const s=new It;if(this.instancesDeferred.set(r,s),this.isInitialized(r)||this.shouldAutoInitialize())try{const n=this.getOrInitializeService({instanceIdentifier:r});n&&s.resolve(n)}catch{}}return this.instancesDeferred.get(r).promise}getImmediate(t){var r;const s=this.normalizeInstanceIdentifier(t==null?void 0:t.identifier),n=(r=t==null?void 0:t.optional)!==null&&r!==void 0?r:!1;if(this.isInitialized(s)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:s})}catch(o){if(n)return null;throw o}else{if(n)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(t){if(t.name!==this.name)throw Error(`Mismatching Component ${t.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=t,!!this.shouldAutoInitialize()){if(Ut(t))try{this.getOrInitializeService({instanceIdentifier:k})}catch{}for(const[r,s]of this.instancesDeferred.entries()){const n=this.normalizeInstanceIdentifier(r);try{const o=this.getOrInitializeService({instanceIdentifier:n});s.resolve(o)}catch{}}}}clearInstance(t=k){this.instancesDeferred.delete(t),this.instancesOptions.delete(t),this.instances.delete(t)}async delete(){const t=Array.from(this.instances.values());await Promise.all([...t.filter(r=>"INTERNAL"in r).map(r=>r.INTERNAL.delete()),...t.filter(r=>"_delete"in r).map(r=>r._delete())])}isComponentSet(){return this.component!=null}isInitialized(t=k){return this.instances.has(t)}getOptions(t=k){return this.instancesOptions.get(t)||{}}initialize(t={}){const{options:r={}}=t,s=this.normalizeInstanceIdentifier(t.instanceIdentifier);if(this.isInitialized(s))throw Error(`${this.name}(${s}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const n=this.getOrInitializeService({instanceIdentifier:s,options:r});for(const[o,a]of this.instancesDeferred.entries()){const i=this.normalizeInstanceIdentifier(o);s===i&&a.resolve(n)}return n}onInit(t,r){var s;const n=this.normalizeInstanceIdentifier(r),o=(s=this.onInitCallbacks.get(n))!==null&&s!==void 0?s:new Set;o.add(t),this.onInitCallbacks.set(n,o);const a=this.instances.get(n);return a&&t(a,n),()=>{o.delete(t)}}invokeOnInitCallbacks(t,r){const s=this.onInitCallbacks.get(r);if(s)for(const n of s)try{n(t,r)}catch{}}getOrInitializeService({instanceIdentifier:t,options:r={}}){let s=this.instances.get(t);if(!s&&this.component&&(s=this.component.instanceFactory(this.container,{instanceIdentifier:Lt(t),options:r}),this.instances.set(t,s),this.instancesOptions.set(t,r),this.invokeOnInitCallbacks(s,t),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,t,s)}catch{}return s||null}normalizeInstanceIdentifier(t=k){return this.component?this.component.multipleInstances?t:k:t}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Lt(e){return e===k?void 0:e}function Ut(e){return e.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ht{constructor(t){this.name=t,this.providers=new Map}addComponent(t){const r=this.getProvider(t.name);if(r.isComponentSet())throw new Error(`Component ${t.name} has already been registered with ${this.name}`);r.setComponent(t)}addOrOverwriteComponent(t){this.getProvider(t.name).isComponentSet()&&this.providers.delete(t.name),this.addComponent(t)}getProvider(t){if(this.providers.has(t))return this.providers.get(t);const r=new Mt(t,this);return this.providers.set(t,r),r}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var f;(function(e){e[e.DEBUG=0]="DEBUG",e[e.VERBOSE=1]="VERBOSE",e[e.INFO=2]="INFO",e[e.WARN=3]="WARN",e[e.ERROR=4]="ERROR",e[e.SILENT=5]="SILENT"})(f||(f={}));const $t={debug:f.DEBUG,verbose:f.VERBOSE,info:f.INFO,warn:f.WARN,error:f.ERROR,silent:f.SILENT},Ft=f.INFO,zt={[f.DEBUG]:"log",[f.VERBOSE]:"log",[f.INFO]:"info",[f.WARN]:"warn",[f.ERROR]:"error"},Vt=(e,t,...r)=>{if(t<e.logLevel)return;const s=new Date().toISOString(),n=zt[t];if(n)console[n](`[${s}]  ${e.name}:`,...r);else throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`)};class jt{constructor(t){this.name=t,this._logLevel=Ft,this._logHandler=Vt,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in f))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t}setLogLevel(t){this._logLevel=typeof t=="string"?$t[t]:t}get logHandler(){return this._logHandler}set logHandler(t){if(typeof t!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=t}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t}debug(...t){this._userLogHandler&&this._userLogHandler(this,f.DEBUG,...t),this._logHandler(this,f.DEBUG,...t)}log(...t){this._userLogHandler&&this._userLogHandler(this,f.VERBOSE,...t),this._logHandler(this,f.VERBOSE,...t)}info(...t){this._userLogHandler&&this._userLogHandler(this,f.INFO,...t),this._logHandler(this,f.INFO,...t)}warn(...t){this._userLogHandler&&this._userLogHandler(this,f.WARN,...t),this._logHandler(this,f.WARN,...t)}error(...t){this._userLogHandler&&this._userLogHandler(this,f.ERROR,...t),this._logHandler(this,f.ERROR,...t)}}const Wt=(e,t)=>t.some(r=>e instanceof r);let ye,Ie;function Gt(){return ye||(ye=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function qt(){return Ie||(Ie=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const je=new WeakMap,ce=new WeakMap,We=new WeakMap,te=new WeakMap,pe=new WeakMap;function Yt(e){const t=new Promise((r,s)=>{const n=()=>{e.removeEventListener("success",o),e.removeEventListener("error",a)},o=()=>{r(D(e.result)),n()},a=()=>{s(e.error),n()};e.addEventListener("success",o),e.addEventListener("error",a)});return t.then(r=>{r instanceof IDBCursor&&je.set(r,e)}).catch(()=>{}),pe.set(t,e),t}function Kt(e){if(ce.has(e))return;const t=new Promise((r,s)=>{const n=()=>{e.removeEventListener("complete",o),e.removeEventListener("error",a),e.removeEventListener("abort",a)},o=()=>{r(),n()},a=()=>{s(e.error||new DOMException("AbortError","AbortError")),n()};e.addEventListener("complete",o),e.addEventListener("error",a),e.addEventListener("abort",a)});ce.set(e,t)}let le={get(e,t,r){if(e instanceof IDBTransaction){if(t==="done")return ce.get(e);if(t==="objectStoreNames")return e.objectStoreNames||We.get(e);if(t==="store")return r.objectStoreNames[1]?void 0:r.objectStore(r.objectStoreNames[0])}return D(e[t])},set(e,t,r){return e[t]=r,!0},has(e,t){return e instanceof IDBTransaction&&(t==="done"||t==="store")?!0:t in e}};function Jt(e){le=e(le)}function Zt(e){return e===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(t,...r){const s=e.call(re(this),t,...r);return We.set(s,t.sort?t.sort():[t]),D(s)}:qt().includes(e)?function(...t){return e.apply(re(this),t),D(je.get(this))}:function(...t){return D(e.apply(re(this),t))}}function Xt(e){return typeof e=="function"?Zt(e):(e instanceof IDBTransaction&&Kt(e),Wt(e,Gt())?new Proxy(e,le):e)}function D(e){if(e instanceof IDBRequest)return Yt(e);if(te.has(e))return te.get(e);const t=Xt(e);return t!==e&&(te.set(e,t),pe.set(t,e)),t}const re=e=>pe.get(e);function Qt(e,t,{blocked:r,upgrade:s,blocking:n,terminated:o}={}){const a=indexedDB.open(e,t),i=D(a);return s&&a.addEventListener("upgradeneeded",c=>{s(D(a.result),c.oldVersion,c.newVersion,D(a.transaction),c)}),r&&a.addEventListener("blocked",c=>r(c.oldVersion,c.newVersion,c)),i.then(c=>{o&&c.addEventListener("close",()=>o()),n&&c.addEventListener("versionchange",u=>n(u.oldVersion,u.newVersion,u))}).catch(()=>{}),i}const er=["get","getKey","getAll","getAllKeys","count"],tr=["put","add","delete","clear"],se=new Map;function ve(e,t){if(!(e instanceof IDBDatabase&&!(t in e)&&typeof t=="string"))return;if(se.get(t))return se.get(t);const r=t.replace(/FromIndex$/,""),s=t!==r,n=tr.includes(r);if(!(r in(s?IDBIndex:IDBObjectStore).prototype)||!(n||er.includes(r)))return;const o=async function(a,...i){const c=this.transaction(a,n?"readwrite":"readonly");let u=c.store;return s&&(u=u.index(i.shift())),(await Promise.all([u[r](...i),n&&c.done]))[0]};return se.set(t,o),o}Jt(e=>({...e,get:(t,r,s)=>ve(t,r)||e.get(t,r,s),has:(t,r)=>!!ve(t,r)||e.has(t,r)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rr{constructor(t){this.container=t}getPlatformInfoString(){return this.container.getProviders().map(r=>{if(sr(r)){const s=r.getImmediate();return`${s.library}/${s.version}`}else return null}).filter(r=>r).join(" ")}}function sr(e){const t=e.getComponent();return(t==null?void 0:t.type)==="VERSION"}const de="@firebase/app",Ae="0.13.2";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const T=new jt("@firebase/app"),nr="@firebase/app-compat",or="@firebase/analytics-compat",ar="@firebase/analytics",ir="@firebase/app-check-compat",cr="@firebase/app-check",lr="@firebase/auth",dr="@firebase/auth-compat",ur="@firebase/database",hr="@firebase/data-connect",fr="@firebase/database-compat",mr="@firebase/functions",pr="@firebase/functions-compat",gr="@firebase/installations",_r="@firebase/installations-compat",br="@firebase/messaging",Er="@firebase/messaging-compat",yr="@firebase/performance",Ir="@firebase/performance-compat",vr="@firebase/remote-config",Ar="@firebase/remote-config-compat",wr="@firebase/storage",Cr="@firebase/storage-compat",Tr="@firebase/firestore",Sr="@firebase/ai",Dr="@firebase/firestore-compat",Rr="firebase",Or="11.10.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ue="[DEFAULT]",kr={[de]:"fire-core",[nr]:"fire-core-compat",[ar]:"fire-analytics",[or]:"fire-analytics-compat",[cr]:"fire-app-check",[ir]:"fire-app-check-compat",[lr]:"fire-auth",[dr]:"fire-auth-compat",[ur]:"fire-rtdb",[hr]:"fire-data-connect",[fr]:"fire-rtdb-compat",[mr]:"fire-fn",[pr]:"fire-fn-compat",[gr]:"fire-iid",[_r]:"fire-iid-compat",[br]:"fire-fcm",[Er]:"fire-fcm-compat",[yr]:"fire-perf",[Ir]:"fire-perf-compat",[vr]:"fire-rc",[Ar]:"fire-rc-compat",[wr]:"fire-gcs",[Cr]:"fire-gcs-compat",[Tr]:"fire-fst",[Dr]:"fire-fst-compat",[Sr]:"fire-vertex","fire-js":"fire-js",[Rr]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const z=new Map,Nr=new Map,he=new Map;function we(e,t){try{e.container.addComponent(t)}catch(r){T.debug(`Component ${t.name} failed to register with FirebaseApp ${e.name}`,r)}}function q(e){const t=e.name;if(he.has(t))return T.debug(`There were multiple attempts to register component ${t}.`),!1;he.set(t,e);for(const r of z.values())we(r,e);for(const r of Nr.values())we(r,e);return!0}function Pr(e,t){const r=e.container.getProvider("heartbeat").getImmediate({optional:!0});return r&&r.triggerHeartbeat(),e.container.getProvider(t)}function Br(e){return e==null?!1:e.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xr={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},R=new Ve("app","Firebase",xr);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mr{constructor(t,r,s){this._isDeleted=!1,this._options=Object.assign({},t),this._config=Object.assign({},r),this._name=r.name,this._automaticDataCollectionEnabled=r.automaticDataCollectionEnabled,this._container=s,this.container.addComponent(new F("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(t){this.checkDestroyed(),this._automaticDataCollectionEnabled=t}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(t){this._isDeleted=t}checkDestroyed(){if(this.isDeleted)throw R.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Lr=Or;function Ge(e,t={}){let r=e;typeof t!="object"&&(t={name:t});const s=Object.assign({name:ue,automaticDataCollectionEnabled:!0},t),n=s.name;if(typeof n!="string"||!n)throw R.create("bad-app-name",{appName:String(n)});if(r||(r=$e()),!r)throw R.create("no-options");const o=z.get(n);if(o){if(ie(r,o.options)&&ie(s,o.config))return o;throw R.create("duplicate-app",{appName:n})}const a=new Ht(n);for(const c of he.values())a.addComponent(c);const i=new Mr(r,s,a);return z.set(n,i),i}function qe(e=ue){const t=z.get(e);if(!t&&e===ue&&$e())return Ge();if(!t)throw R.create("no-app",{appName:e});return t}function Ur(){return Array.from(z.values())}function H(e,t,r){var s;let n=(s=kr[e])!==null&&s!==void 0?s:e;r&&(n+=`-${r}`);const o=n.match(/\s|\//),a=t.match(/\s|\//);if(o||a){const i=[`Unable to register library "${n}" with version "${t}":`];o&&i.push(`library name "${n}" contains illegal characters (whitespace or "/")`),o&&a&&i.push("and"),a&&i.push(`version name "${t}" contains illegal characters (whitespace or "/")`),T.warn(i.join(" "));return}q(new F(`${n}-version`,()=>({library:n,version:t}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Hr="firebase-heartbeat-database",$r=1,V="firebase-heartbeat-store";let ne=null;function Ye(){return ne||(ne=Qt(Hr,$r,{upgrade:(e,t)=>{switch(t){case 0:try{e.createObjectStore(V)}catch(r){console.warn(r)}}}}).catch(e=>{throw R.create("idb-open",{originalErrorMessage:e.message})})),ne}async function Fr(e){try{const r=(await Ye()).transaction(V),s=await r.objectStore(V).get(Ke(e));return await r.done,s}catch(t){if(t instanceof P)T.warn(t.message);else{const r=R.create("idb-get",{originalErrorMessage:t==null?void 0:t.message});T.warn(r.message)}}}async function Ce(e,t){try{const s=(await Ye()).transaction(V,"readwrite");await s.objectStore(V).put(t,Ke(e)),await s.done}catch(r){if(r instanceof P)T.warn(r.message);else{const s=R.create("idb-set",{originalErrorMessage:r==null?void 0:r.message});T.warn(s.message)}}}function Ke(e){return`${e.name}!${e.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zr=1024,Vr=30;class jr{constructor(t){this.container=t,this._heartbeatsCache=null;const r=this.container.getProvider("app").getImmediate();this._storage=new Gr(r),this._heartbeatsCachePromise=this._storage.read().then(s=>(this._heartbeatsCache=s,s))}async triggerHeartbeat(){var t,r;try{const n=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),o=Te();if(((t=this._heartbeatsCache)===null||t===void 0?void 0:t.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((r=this._heartbeatsCache)===null||r===void 0?void 0:r.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===o||this._heartbeatsCache.heartbeats.some(a=>a.date===o))return;if(this._heartbeatsCache.heartbeats.push({date:o,agent:n}),this._heartbeatsCache.heartbeats.length>Vr){const a=qr(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(a,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(s){T.warn(s)}}async getHeartbeatsHeader(){var t;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((t=this._heartbeatsCache)===null||t===void 0?void 0:t.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const r=Te(),{heartbeatsToSend:s,unsentEntries:n}=Wr(this._heartbeatsCache.heartbeats),o=G(JSON.stringify({version:2,heartbeats:s}));return this._heartbeatsCache.lastSentHeartbeatDate=r,n.length>0?(this._heartbeatsCache.heartbeats=n,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),o}catch(r){return T.warn(r),""}}}function Te(){return new Date().toISOString().substring(0,10)}function Wr(e,t=zr){const r=[];let s=e.slice();for(const n of e){const o=r.find(a=>a.agent===n.agent);if(o){if(o.dates.push(n.date),Se(r)>t){o.dates.pop();break}}else if(r.push({agent:n.agent,dates:[n.date]}),Se(r)>t){r.pop();break}s=s.slice(1)}return{heartbeatsToSend:r,unsentEntries:s}}class Gr{constructor(t){this.app=t,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Dt()?Rt().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const r=await Fr(this.app);return r!=null&&r.heartbeats?r:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(t){var r;if(await this._canUseIndexedDBPromise){const n=await this.read();return Ce(this.app,{lastSentHeartbeatDate:(r=t.lastSentHeartbeatDate)!==null&&r!==void 0?r:n.lastSentHeartbeatDate,heartbeats:t.heartbeats})}else return}async add(t){var r;if(await this._canUseIndexedDBPromise){const n=await this.read();return Ce(this.app,{lastSentHeartbeatDate:(r=t.lastSentHeartbeatDate)!==null&&r!==void 0?r:n.lastSentHeartbeatDate,heartbeats:[...n.heartbeats,...t.heartbeats]})}else return}}function Se(e){return G(JSON.stringify({version:2,heartbeats:e})).length}function qr(e){if(e.length===0)return-1;let t=0,r=e[0].date;for(let s=1;s<e.length;s++)e[s].date<r&&(r=e[s].date,t=s);return t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Yr(e){q(new F("platform-logger",t=>new rr(t),"PRIVATE")),q(new F("heartbeat",t=>new jr(t),"PRIVATE")),H(de,Ae,e),H(de,Ae,"esm2017"),H("fire-js","")}Yr("");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Je="firebasestorage.googleapis.com",Kr="storageBucket",Jr=2*60*1e3,Zr=10*60*1e3;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class A extends P{constructor(t,r,s=0){super(oe(t),`Firebase Storage: ${r} (${oe(t)})`),this.status_=s,this.customData={serverResponse:null},this._baseMessage=this.message,Object.setPrototypeOf(this,A.prototype)}get status(){return this.status_}set status(t){this.status_=t}_codeEquals(t){return oe(t)===this.code}get serverResponse(){return this.customData.serverResponse}set serverResponse(t){this.customData.serverResponse=t,this.customData.serverResponse?this.message=`${this._baseMessage}
${this.customData.serverResponse}`:this.message=this._baseMessage}}var v;(function(e){e.UNKNOWN="unknown",e.OBJECT_NOT_FOUND="object-not-found",e.BUCKET_NOT_FOUND="bucket-not-found",e.PROJECT_NOT_FOUND="project-not-found",e.QUOTA_EXCEEDED="quota-exceeded",e.UNAUTHENTICATED="unauthenticated",e.UNAUTHORIZED="unauthorized",e.UNAUTHORIZED_APP="unauthorized-app",e.RETRY_LIMIT_EXCEEDED="retry-limit-exceeded",e.INVALID_CHECKSUM="invalid-checksum",e.CANCELED="canceled",e.INVALID_EVENT_NAME="invalid-event-name",e.INVALID_URL="invalid-url",e.INVALID_DEFAULT_BUCKET="invalid-default-bucket",e.NO_DEFAULT_BUCKET="no-default-bucket",e.CANNOT_SLICE_BLOB="cannot-slice-blob",e.SERVER_FILE_WRONG_SIZE="server-file-wrong-size",e.NO_DOWNLOAD_URL="no-download-url",e.INVALID_ARGUMENT="invalid-argument",e.INVALID_ARGUMENT_COUNT="invalid-argument-count",e.APP_DELETED="app-deleted",e.INVALID_ROOT_OPERATION="invalid-root-operation",e.INVALID_FORMAT="invalid-format",e.INTERNAL_ERROR="internal-error",e.UNSUPPORTED_ENVIRONMENT="unsupported-environment"})(v||(v={}));function oe(e){return"storage/"+e}function Xr(){const e="An unknown error occurred, please check the error payload for server response.";return new A(v.UNKNOWN,e)}function Qr(){return new A(v.RETRY_LIMIT_EXCEEDED,"Max retry time for operation exceeded, please try again.")}function es(){return new A(v.CANCELED,"User canceled the upload/download.")}function ts(e){return new A(v.INVALID_URL,"Invalid URL '"+e+"'.")}function rs(e){return new A(v.INVALID_DEFAULT_BUCKET,"Invalid default bucket '"+e+"'.")}function De(e){return new A(v.INVALID_ARGUMENT,e)}function Ze(){return new A(v.APP_DELETED,"The Firebase app was deleted.")}function ss(e){return new A(v.INVALID_ROOT_OPERATION,"The operation '"+e+"' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class E{constructor(t,r){this.bucket=t,this.path_=r}get path(){return this.path_}get isRoot(){return this.path.length===0}fullServerUrl(){const t=encodeURIComponent;return"/b/"+t(this.bucket)+"/o/"+t(this.path)}bucketOnlyServerUrl(){return"/b/"+encodeURIComponent(this.bucket)+"/o"}static makeFromBucketSpec(t,r){let s;try{s=E.makeFromUrl(t,r)}catch{return new E(t,"")}if(s.path==="")return s;throw rs(t)}static makeFromUrl(t,r){let s=null;const n="([A-Za-z0-9.\\-_]+)";function o(b){b.path.charAt(b.path.length-1)==="/"&&(b.path_=b.path_.slice(0,-1))}const a="(/(.*))?$",i=new RegExp("^gs://"+n+a,"i"),c={bucket:1,path:3};function u(b){b.path_=decodeURIComponent(b.path)}const h="v[A-Za-z0-9_]+",m=r.replace(/[.]/g,"\\."),l="(/([^?#]*).*)?$",p=new RegExp(`^https?://${m}/${h}/b/${n}/o${l}`,"i"),g={bucket:1,path:3},w=r===Je?"(?:storage.googleapis.com|storage.cloud.google.com)":r,_="([^?#]*)",O=new RegExp(`^https?://${w}/${n}/${_}`,"i"),y=[{regex:i,indices:c,postModify:o},{regex:p,indices:g,postModify:u},{regex:O,indices:{bucket:1,path:2},postModify:u}];for(let b=0;b<y.length;b++){const j=y[b],X=j.regex.exec(t);if(X){const nt=X[j.indices.bucket];let Q=X[j.indices.path];Q||(Q=""),s=new E(nt,Q),j.postModify(s);break}}if(s==null)throw ts(t);return s}}class ns{constructor(t){this.promise_=Promise.reject(t)}getPromise(){return this.promise_}cancel(t=!1){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function os(e,t,r){let s=1,n=null,o=null,a=!1,i=0;function c(){return i===2}let u=!1;function h(..._){u||(u=!0,t.apply(null,_))}function m(_){n=setTimeout(()=>{n=null,e(p,c())},_)}function l(){o&&clearTimeout(o)}function p(_,...O){if(u){l();return}if(_){l(),h.call(null,_,...O);return}if(c()||a){l(),h.call(null,_,...O);return}s<64&&(s*=2);let y;i===1?(i=2,y=0):y=(s+Math.random())*1e3,m(y)}let g=!1;function w(_){g||(g=!0,l(),!u&&(n!==null?(_||(i=2),clearTimeout(n),m(0)):_||(i=1)))}return m(0),o=setTimeout(()=>{a=!0,w(!0)},r),w}function as(e){e(!1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function is(e){return e!==void 0}function Re(e,t,r,s){if(s<t)throw De(`Invalid value for '${e}'. Expected ${t} or greater.`);if(s>r)throw De(`Invalid value for '${e}'. Expected ${r} or less.`)}function cs(e){const t=encodeURIComponent;let r="?";for(const s in e)if(e.hasOwnProperty(s)){const n=t(s)+"="+t(e[s]);r=r+n+"&"}return r=r.slice(0,-1),r}var Y;(function(e){e[e.NO_ERROR=0]="NO_ERROR",e[e.NETWORK_ERROR=1]="NETWORK_ERROR",e[e.ABORT=2]="ABORT"})(Y||(Y={}));/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ls(e,t){const r=e>=500&&e<600,n=[408,429].indexOf(e)!==-1,o=t.indexOf(e)!==-1;return r||n||o}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ds{constructor(t,r,s,n,o,a,i,c,u,h,m,l=!0,p=!1){this.url_=t,this.method_=r,this.headers_=s,this.body_=n,this.successCodes_=o,this.additionalRetryCodes_=a,this.callback_=i,this.errorCallback_=c,this.timeout_=u,this.progressCallback_=h,this.connectionFactory_=m,this.retry=l,this.isUsingEmulator=p,this.pendingConnection_=null,this.backoffId_=null,this.canceled_=!1,this.appDelete_=!1,this.promise_=new Promise((g,w)=>{this.resolve_=g,this.reject_=w,this.start_()})}start_(){const t=(s,n)=>{if(n){s(!1,new W(!1,null,!0));return}const o=this.connectionFactory_();this.pendingConnection_=o;const a=i=>{const c=i.loaded,u=i.lengthComputable?i.total:-1;this.progressCallback_!==null&&this.progressCallback_(c,u)};this.progressCallback_!==null&&o.addUploadProgressListener(a),o.send(this.url_,this.method_,this.isUsingEmulator,this.body_,this.headers_).then(()=>{this.progressCallback_!==null&&o.removeUploadProgressListener(a),this.pendingConnection_=null;const i=o.getErrorCode()===Y.NO_ERROR,c=o.getStatus();if(!i||ls(c,this.additionalRetryCodes_)&&this.retry){const h=o.getErrorCode()===Y.ABORT;s(!1,new W(!1,null,h));return}const u=this.successCodes_.indexOf(c)!==-1;s(!0,new W(u,o))})},r=(s,n)=>{const o=this.resolve_,a=this.reject_,i=n.connection;if(n.wasSuccessCode)try{const c=this.callback_(i,i.getResponse());is(c)?o(c):o()}catch(c){a(c)}else if(i!==null){const c=Xr();c.serverResponse=i.getErrorText(),this.errorCallback_?a(this.errorCallback_(i,c)):a(c)}else if(n.canceled){const c=this.appDelete_?Ze():es();a(c)}else{const c=Qr();a(c)}};this.canceled_?r(!1,new W(!1,null,!0)):this.backoffId_=os(t,r,this.timeout_)}getPromise(){return this.promise_}cancel(t){this.canceled_=!0,this.appDelete_=t||!1,this.backoffId_!==null&&as(this.backoffId_),this.pendingConnection_!==null&&this.pendingConnection_.abort()}}class W{constructor(t,r,s){this.wasSuccessCode=t,this.connection=r,this.canceled=!!s}}function us(e,t){t!==null&&t.length>0&&(e.Authorization="Firebase "+t)}function hs(e,t){e["X-Firebase-Storage-Version"]="webjs/"+(t??"AppManager")}function fs(e,t){t&&(e["X-Firebase-GMPID"]=t)}function ms(e,t){t!==null&&(e["X-Firebase-AppCheck"]=t)}function ps(e,t,r,s,n,o,a=!0,i=!1){const c=cs(e.urlParams),u=e.url+c,h=Object.assign({},e.headers);return fs(h,t),us(h,r),hs(h,o),ms(h,s),new ds(u,e.method,h,e.body,e.successCodes,e.additionalRetryCodes,e.handler,e.errorHandler,e.timeout,e.progressCallback,n,a,i)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gs(e){if(e.length===0)return null;const t=e.lastIndexOf("/");return t===-1?"":e.slice(0,t)}function _s(e){const t=e.lastIndexOf("/",e.length-2);return t===-1?e:e.slice(t+1)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class K{constructor(t,r){this._service=t,r instanceof E?this._location=r:this._location=E.makeFromUrl(r,t.host)}toString(){return"gs://"+this._location.bucket+"/"+this._location.path}_newRef(t,r){return new K(t,r)}get root(){const t=new E(this._location.bucket,"");return this._newRef(this._service,t)}get bucket(){return this._location.bucket}get fullPath(){return this._location.path}get name(){return _s(this._location.path)}get storage(){return this._service}get parent(){const t=gs(this._location.path);if(t===null)return null;const r=new E(this._location.bucket,t);return new K(this._service,r)}_throwIfRoot(t){if(this._location.path==="")throw ss(t)}}function Oe(e,t){const r=t==null?void 0:t[Kr];return r==null?null:E.makeFromBucketSpec(r,e)}function bs(e,t,r,s={}){e.host=`${t}:${r}`;const n=Fe(t);n&&(vt(`https://${e.host}/b`),Tt("Storage",!0)),e._isUsingEmulator=!0,e._protocol=n?"https":"http";const{mockUserToken:o}=s;o&&(e._overrideAuthToken=typeof o=="string"?o:At(o,e.app.options.projectId))}class Es{constructor(t,r,s,n,o,a=!1){this.app=t,this._authProvider=r,this._appCheckProvider=s,this._url=n,this._firebaseVersion=o,this._isUsingEmulator=a,this._bucket=null,this._host=Je,this._protocol="https",this._appId=null,this._deleted=!1,this._maxOperationRetryTime=Jr,this._maxUploadRetryTime=Zr,this._requests=new Set,n!=null?this._bucket=E.makeFromBucketSpec(n,this._host):this._bucket=Oe(this._host,this.app.options)}get host(){return this._host}set host(t){this._host=t,this._url!=null?this._bucket=E.makeFromBucketSpec(this._url,t):this._bucket=Oe(t,this.app.options)}get maxUploadRetryTime(){return this._maxUploadRetryTime}set maxUploadRetryTime(t){Re("time",0,Number.POSITIVE_INFINITY,t),this._maxUploadRetryTime=t}get maxOperationRetryTime(){return this._maxOperationRetryTime}set maxOperationRetryTime(t){Re("time",0,Number.POSITIVE_INFINITY,t),this._maxOperationRetryTime=t}async _getAuthToken(){if(this._overrideAuthToken)return this._overrideAuthToken;const t=this._authProvider.getImmediate({optional:!0});if(t){const r=await t.getToken();if(r!==null)return r.accessToken}return null}async _getAppCheckToken(){if(Br(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const t=this._appCheckProvider.getImmediate({optional:!0});return t?(await t.getToken()).token:null}_delete(){return this._deleted||(this._deleted=!0,this._requests.forEach(t=>t.cancel()),this._requests.clear()),Promise.resolve()}_makeStorageReference(t){return new K(this,t)}_makeRequest(t,r,s,n,o=!0){if(this._deleted)return new ns(Ze());{const a=ps(t,this._appId,s,n,r,this._firebaseVersion,o,this._isUsingEmulator);return this._requests.add(a),a.getPromise().then(()=>this._requests.delete(a),()=>this._requests.delete(a)),a}}async makeRequestWithTokens(t,r){const[s,n]=await Promise.all([this._getAuthToken(),this._getAppCheckToken()]);return this._makeRequest(t,r,s,n).getPromise()}}const ke="@firebase/storage",Ne="0.13.14";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xe="storage";function ys(e=qe(),t){e=xt(e);const s=Pr(e,Xe).getImmediate({identifier:t}),n=yt("storage");return n&&Is(s,...n),s}function Is(e,t,r,s={}){bs(e,t,r,s)}function vs(e,{instanceIdentifier:t}){const r=e.getProvider("app").getImmediate(),s=e.getProvider("auth-internal"),n=e.getProvider("app-check-internal");return new Es(r,s,n,t,Lr)}function As(){q(new F(Xe,vs,"PUBLIC").setMultipleInstances(!0)),H(ke,Ne,""),H(ke,Ne,"esm2017")}As();const fe={apiKey:"AIzaSyDgA76WHz1JzwEc1YeazhKTUxqxHzhcP2c",authDomain:"session-logger-3619e.firebaseapp.com",projectId:"session-logger-3619e",storageBucket:"session-logger-3619e.firebasestorage.app",messagingSenderId:"936476651752",appId:"1:936476651752:web:7048bd9fcc902dc816595d"};var Le;console.log("[Firebase Debug] API key prefix:",(Le=fe.apiKey)==null?void 0:Le.substring(0,10),"| authDomain:",fe.authDomain);const Z=Ur().length?qe():Ge(fe),Qe=ot(Z),ws=lt(Z);ys(Z);const en=Object.freeze(Object.defineProperty({__proto__:null,app:Z,auth:ws,db:Qe},Symbol.toStringTag,{value:"Module"}));var d=(e=>(e.RESISTANCE="resistance",e.SPORT="sport",e.STRETCHING="stretching",e.ENDURANCE="endurance",e.SPEED_AGILITY="speedAgility",e.OTHER="other",e))(d||{});const Cs="modulepreload",Ts=function(e){return"/Traininglog/"+e},Pe={},S=function(t,r,s){let n=Promise.resolve();if(r&&r.length>0){let a=function(u){return Promise.all(u.map(h=>Promise.resolve(h).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),c=(i==null?void 0:i.nonce)||(i==null?void 0:i.getAttribute("nonce"));n=a(r.map(u=>{if(u=Ts(u),u in Pe)return;Pe[u]=!0;const h=u.endsWith(".css"),m=h?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${u}"]${m}`))return;const l=document.createElement("link");if(l.rel=h?"stylesheet":Cs,h||(l.as="script"),l.crossOrigin="",l.href=u,c&&l.setAttribute("nonce",c),document.head.appendChild(l),h)return new Promise((p,g)=>{l.addEventListener("load",p),l.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${u}`)))})}))}function o(a){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=a,window.dispatchEvent(i),!i.defaultPrevented)throw a}return n.then(a=>{for(const i of a||[])i.status==="rejected"&&o(i.reason);return t().catch(o)})},Ss={[d.RESISTANCE]:"kg",[d.ENDURANCE]:"distance",[d.SPORT]:"time",[d.STRETCHING]:"time",[d.SPEED_AGILITY]:"time",[d.OTHER]:"time"},Ds=[d.RESISTANCE,d.ENDURANCE,d.SPORT,d.STRETCHING,d.SPEED_AGILITY,d.OTHER],Rs={pectorals:"chest",deltoids:"shoulders",abs:"core",abdominals:"core",lats:"lats",latissimus:"lats",traps:"traps",trapezius:"traps",gluteus:"glutes",quadricep:"quadriceps",quadriceps:"quadriceps",hamstring:"hamstrings",calf:"calves",forearm:"forearms",bicep:"biceps",tricep:"triceps","lower back":"lower_back",lower_back:"lower_back","hip flexors":"hip_flexors",hip_flexors:"hip_flexors",fullbody:"full_body","full body":"full_body"},ae={},B={},x={},M=e=>{const t=e;return{categories:t.categories,metadata:t.metadata}};function me(e){switch(e.trim().replace(/^['"]+|['"]+$/g,"").toLowerCase()){case d.RESISTANCE:case"strength":case"bodyweight":case"plyometric":case"plyometrics":return d.RESISTANCE;case d.ENDURANCE:case"cardio":return d.ENDURANCE;case d.SPORT:case"team_sports":case"teamsports":return d.SPORT;case d.STRETCHING:case"flexibility":return d.STRETCHING;case d.SPEED_AGILITY:case"speed_agility":case"speedagility":return d.SPEED_AGILITY;case d.OTHER:case"outdoor":return d.OTHER;default:return}}const et=e=>e.trim().replace(/\s+/g," ").toLowerCase(),Be=e=>e.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"exercise",I=e=>{if(Array.isArray(e))return e.map(t=>String(t||"").trim()).filter(Boolean);if(typeof e=="string"){const t=e.trim();return t?[t]:[]}return[]},Os=(e,t)=>String(e||"").trim().toLowerCase()||t,ks=e=>I(e).map(t=>t.toLowerCase()),xe=e=>I(e).map(t=>{const r=t.toLowerCase().replace(/\s+/g," ").trim();return Rs[r]||r.replace(/\s+/g,"_")}),Ns=(e,t)=>{const r=String(e||"").trim().toLowerCase();switch(r){case"strength":case"bodyweight":case"plyometric":case"plyometrics":return t===d.RESISTANCE?r:"strength";case"cardio":return t===d.ENDURANCE?"endurance":"cardio";case"endurance":return"endurance";case"flexibility":return"flexibility";case"teamsports":case"team_sports":case"team-sports":return"teamSports";case"speedagility":case"speed_agility":case"speed-agility":return"speedAgility";case"other":return"other";default:switch(t){case d.RESISTANCE:return"strength";case d.ENDURANCE:return"endurance";case d.SPORT:return"teamSports";case d.STRETCHING:return"flexibility";case d.SPEED_AGILITY:return"speedAgility";case d.OTHER:default:return"other"}}},Ps=e=>{switch(e){case d.RESISTANCE:return{trackWeight:!0,trackReps:!0,trackSets:!0,trackTime:!1,trackDistance:!1,trackRPE:!0,trackDuration:!1,trackHeight:!1,trackPower:!1,trackIntensity:!1,trackIncline:!1,trackElevation:!1,trackFloors:!1};case d.ENDURANCE:return{trackWeight:!1,trackReps:!1,trackSets:!1,trackTime:!0,trackDistance:!0,trackRPE:!0,trackDuration:!0,trackHeight:!1,trackPower:!1,trackIntensity:!1,trackIncline:!1,trackElevation:!0,trackFloors:!1};case d.SPORT:case d.STRETCHING:case d.SPEED_AGILITY:case d.OTHER:default:return{trackWeight:!1,trackReps:!0,trackSets:!0,trackTime:!0,trackDistance:!1,trackRPE:!0,trackDuration:!0,trackHeight:!1,trackPower:!1,trackIntensity:!1,trackIncline:!1,trackElevation:!1,trackFloors:!1}}},Bs=(e,t,r,s,n=!1)=>{const o=String(s||"").trim();return o&&n?o:o?`${e}-${Be(o)}`:`${t}-${Be(r)}`},$=(e,t,r,s=!1)=>{const n=String((e==null?void 0:e.name)||"").trim(),o=me(String((e==null?void 0:e.activityType)||""))||me(String((e==null?void 0:e.type)||""))||t,a=Ns(e==null?void 0:e.type,o),i=Ps(o),c=(e==null?void 0:e.metrics)||{},u=n||"Unnamed Exercise";return{id:Bs(r,o,u,e==null?void 0:e.id,s),name:u,nameLower:et(u),description:String((e==null?void 0:e.description)||"").trim(),type:a,activityType:o,category:Os(e==null?void 0:e.category,o===d.RESISTANCE?"compound":"general"),difficulty:String((e==null?void 0:e.difficulty)||"").toLowerCase()||"intermediate",equipment:ks(e==null?void 0:e.equipment),instructions:I(e==null?void 0:e.instructions),tips:I(e==null?void 0:e.tips),tags:I(e==null?void 0:e.tags),isDefault:(e==null?void 0:e.isDefault)!==void 0?!!(e!=null&&e.isDefault):!0,createdBy:String((e==null?void 0:e.createdBy)||"system"),primaryMuscles:xe(e==null?void 0:e.primaryMuscles),secondaryMuscles:xe(e==null?void 0:e.secondaryMuscles),targetAreas:I(e==null?void 0:e.targetAreas),primaryMetrics:I(e==null?void 0:e.primaryMetrics),optionalMetrics:I(e==null?void 0:e.optionalMetrics),skills:I(e==null?void 0:e.skills),defaultUnit:(e==null?void 0:e.defaultUnit)||Ss[o],metrics:{...i,...c},teamBased:!!(e!=null&&e.teamBased),sportType:e==null?void 0:e.sportType,drillType:e==null?void 0:e.drillType,space:e==null?void 0:e.space,environment:e==null?void 0:e.environment,setup:I(e==null?void 0:e.setup),userId:e==null?void 0:e.userId}};function L(e,t){return $(e,t||d.OTHER,"builtin",!0)}const xs=e=>({...e,nameLower:e.nameLower||et(e.name)}),C=e=>{const t=[],r=new Set,s=new Set;return e.forEach(n=>{if(!(n!=null&&n.name))return;const o=xs(n),a=`${o.activityType}::${o.nameLower}`;o.id&&r.has(o.id)||s.has(a)||(o.id&&r.add(o.id),s.add(a),t.push(o))}),t},Ms=(e,t)=>$({...t,id:e,createdBy:t.createdBy||"system",isDefault:t.isDefault??!1},me(String(t.activityType||""))||d.OTHER,"firestore",!0),Me=async(e,t,r)=>{const s=at(Qe,e),n=[ge("activityType","==",t)];return e==="exercises"&&r&&n.push(ge("userId","==",r)),(await it(ct(s,...n))).docs.map(a=>Ms(a.id,a.data()))},Ls=async e=>{if(e===d.RESISTANCE){const[s,n,o]=await Promise.all([S(()=>import("./exercise-data-legacy-oA9WJ8TQ.js").then(u=>u.e),[]),S(()=>import("./exercise-data-legacy-oA9WJ8TQ.js").then(u=>u.i),[]),S(()=>import("./exercise-data-resistance-BbJmAQJH.js"),[])]),a=Array.isArray(s.allExercises)?s.allExercises.map(u=>$(u,d.RESISTANCE,"resistance-curated")):[],i=Array.isArray(o.default)?o.default.map(u=>$(u,d.RESISTANCE,"resistance-json",!0)):[],c=Array.isArray(n.importedExercises)?n.importedExercises.map(u=>$(u,d.RESISTANCE,"resistance-legacy")):[];return C([...a,...i,...c])}if(e===d.ENDURANCE){const s=await S(()=>import("./exercise-data-activities-DOXMy4jB.js").then(o=>o.a),[]),n=Array.isArray(s.default)?s.default:[];return x[d.ENDURANCE]=M(s),C(n.map(o=>L(o,d.ENDURANCE)))}if(e===d.SPORT){const s=await S(()=>import("./exercise-data-activities-DOXMy4jB.js").then(o=>o.b),[]),n=Array.isArray(s.default)?s.default:[];return x[d.SPORT]=M(s),C(n.map(o=>L(o,d.SPORT)))}if(e===d.STRETCHING){const s=await S(()=>import("./exercise-data-activities-DOXMy4jB.js").then(o=>o.f),[]),n=Array.isArray(s.default)?s.default:[];return x[d.STRETCHING]=M(s),C(n.map(o=>L(o,d.STRETCHING)))}if(e===d.SPEED_AGILITY){const s=await S(()=>import("./exercise-data-activities-DOXMy4jB.js").then(o=>o.s),[]),n=Array.isArray(s.default)?s.default:[];return x[d.SPEED_AGILITY]=M(s),C(n.map(o=>L(o,d.SPEED_AGILITY)))}const t=await S(()=>import("./exercise-data-activities-DOXMy4jB.js").then(s=>s.o),[]),r=Array.isArray(t.default)?t.default:[];return x[d.OTHER]=M(t),C(r.map(s=>L(s,d.OTHER)))},Us=async e=>ae[e]?ae[e]||[]:(B[e]||(B[e]=Ls(e).then(t=>(ae[e]=t,t)).catch(t=>(console.error(`Error loading exercise database for ${e}:`,t),[])).finally(()=>{delete B[e]})),B[e]);async function tt(e){return Us(e)}async function rt(e,t){const r=await tt(e);try{const[s,n]=await Promise.all([Me("globalExercises",e),t?Me("exercises",e,t):Promise.resolve([])]);return C([...r,...s,...n])}catch(s){return console.error("Failed to load merged exercises, falling back to built-ins only:",s),C(r)}}async function st(e,t){const r=await Promise.all(e.map(s=>rt(s,t)));return C(r.flat())}async function Hs(e){return st(Ds,e)}const tn=Object.freeze(Object.defineProperty({__proto__:null,getExercisesByActivityTypeAsync:tt,getMergedExercisesByActivityType:rt,getMergedExercisesByActivityTypes:st,getMergedExercisesByAllActivityTypes:Hs},Symbol.toStringTag,{value:"Module"}));export{Ys as A,d as B,F as C,Qe as D,Ve as E,P as F,ws as G,S as H,rt as I,Hs as J,en as K,jt as L,tn as M,Lr as S,q as _,Gs as a,Ws as b,Br as c,xt as d,ze as e,Qs as f,zs as g,f as h,Vs as i,mt as j,Fe as k,qe as l,Pr as m,Et as n,ie as o,vt as p,Js as q,H as r,qs as s,Ks as t,Tt as u,Zs as v,Xs as w,js as x,yt as y,At as z};
//# sourceMappingURL=exercise-db-core-B-rbTYAq.js.map
