const Jf=()=>{};var $c={};/**
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
 */const Tl=function(n){const e=[];let t=0;for(let r=0;r<n.length;r++){let i=n.charCodeAt(r);i<128?e[t++]=i:i<2048?(e[t++]=i>>6|192,e[t++]=i&63|128):(i&64512)===55296&&r+1<n.length&&(n.charCodeAt(r+1)&64512)===56320?(i=65536+((i&1023)<<10)+(n.charCodeAt(++r)&1023),e[t++]=i>>18|240,e[t++]=i>>12&63|128,e[t++]=i>>6&63|128,e[t++]=i&63|128):(e[t++]=i>>12|224,e[t++]=i>>6&63|128,e[t++]=i&63|128)}return e},Xf=function(n){const e=[];let t=0,r=0;for(;t<n.length;){const i=n[t++];if(i<128)e[r++]=String.fromCharCode(i);else if(i>191&&i<224){const s=n[t++];e[r++]=String.fromCharCode((i&31)<<6|s&63)}else if(i>239&&i<365){const s=n[t++],a=n[t++],c=n[t++],l=((i&7)<<18|(s&63)<<12|(a&63)<<6|c&63)-65536;e[r++]=String.fromCharCode(55296+(l>>10)),e[r++]=String.fromCharCode(56320+(l&1023))}else{const s=n[t++],a=n[t++];e[r++]=String.fromCharCode((i&15)<<12|(s&63)<<6|a&63)}}return e.join("")},wl={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,e){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let i=0;i<n.length;i+=3){const s=n[i],a=i+1<n.length,c=a?n[i+1]:0,l=i+2<n.length,d=l?n[i+2]:0,p=s>>2,g=(s&3)<<4|c>>4;let v=(c&15)<<2|d>>6,P=d&63;l||(P=64,a||(v=64)),r.push(t[p],t[g],t[v],t[P])}return r.join("")},encodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(n):this.encodeByteArray(Tl(n),e)},decodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(n):Xf(this.decodeStringToByteArray(n,e))},decodeStringToByteArray(n,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let i=0;i<n.length;){const s=t[n.charAt(i++)],c=i<n.length?t[n.charAt(i)]:0;++i;const d=i<n.length?t[n.charAt(i)]:64;++i;const g=i<n.length?t[n.charAt(i)]:64;if(++i,s==null||c==null||d==null||g==null)throw new Zf;const v=s<<2|c>>4;if(r.push(v),d!==64){const P=c<<4&240|d>>2;if(r.push(P),g!==64){const k=d<<6&192|g;r.push(k)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class Zf extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const ep=function(n){const e=Tl(n);return wl.encodeByteArray(e,!0)},Si=function(n){return ep(n).replace(/\./g,"")},Al=function(n){try{return wl.decodeString(n,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
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
 */function tp(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
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
 */const np=()=>tp().__FIREBASE_DEFAULTS__,rp=()=>{if(typeof process>"u"||typeof $c>"u")return;const n=$c.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},ip=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=n&&Al(n[1]);return e&&JSON.parse(e)},Hi=()=>{try{return Jf()||np()||rp()||ip()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},Rl=n=>{var e,t;return(t=(e=Hi())===null||e===void 0?void 0:e.emulatorHosts)===null||t===void 0?void 0:t[n]},sp=n=>{const e=Rl(n);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const r=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),r]:[e.substring(0,t),r]},Sl=()=>{var n;return(n=Hi())===null||n===void 0?void 0:n.config},Pl=n=>{var e;return(e=Hi())===null||e===void 0?void 0:e[`_${n}`]};/**
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
 */class op{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,r)=>{t?this.reject(t):this.resolve(r),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,r))}}}/**
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
 */function Sn(n){try{return(n.startsWith("http://")||n.startsWith("https://")?new URL(n).hostname:n).endsWith(".cloudworkstations.dev")}catch{return!1}}async function bl(n){return(await fetch(n,{credentials:"include"})).ok}/**
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
 */function ap(n,e){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},r=e||"demo-project",i=n.iat||0,s=n.sub||n.user_id;if(!s)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const a=Object.assign({iss:`https://securetoken.google.com/${r}`,aud:r,iat:i,exp:i+3600,auth_time:i,sub:s,user_id:s,firebase:{sign_in_provider:"custom",identities:{}}},n);return[Si(JSON.stringify(t)),Si(JSON.stringify(a)),""].join(".")}const ur={};function cp(){const n={prod:[],emulator:[]};for(const e of Object.keys(ur))ur[e]?n.emulator.push(e):n.prod.push(e);return n}function up(n){let e=document.getElementById(n),t=!1;return e||(e=document.createElement("div"),e.setAttribute("id",n),t=!0),{created:t,element:e}}let Hc=!1;function Cl(n,e){if(typeof window>"u"||typeof document>"u"||!Sn(window.location.host)||ur[n]===e||ur[n]||Hc)return;ur[n]=e;function t(v){return`__firebase__banner__${v}`}const r="__firebase__banner",s=cp().prod.length>0;function a(){const v=document.getElementById(r);v&&v.remove()}function c(v){v.style.display="flex",v.style.background="#7faaf0",v.style.position="fixed",v.style.bottom="5px",v.style.left="5px",v.style.padding=".5em",v.style.borderRadius="5px",v.style.alignItems="center"}function l(v,P){v.setAttribute("width","24"),v.setAttribute("id",P),v.setAttribute("height","24"),v.setAttribute("viewBox","0 0 24 24"),v.setAttribute("fill","none"),v.style.marginLeft="-6px"}function d(){const v=document.createElement("span");return v.style.cursor="pointer",v.style.marginLeft="16px",v.style.fontSize="24px",v.innerHTML=" &times;",v.onclick=()=>{Hc=!0,a()},v}function p(v,P){v.setAttribute("id",P),v.innerText="Learn more",v.href="https://firebase.google.com/docs/studio/preview-apps#preview-backend",v.setAttribute("target","__blank"),v.style.paddingLeft="5px",v.style.textDecoration="underline"}function g(){const v=up(r),P=t("text"),k=document.getElementById(P)||document.createElement("span"),L=t("learnmore"),D=document.getElementById(L)||document.createElement("a"),$=t("preprendIcon"),q=document.getElementById($)||document.createElementNS("http://www.w3.org/2000/svg","svg");if(v.created){const H=v.element;c(H),p(D,L);const ne=d();l(q,$),H.append(q,k,D,ne),document.body.appendChild(H)}s?(k.innerText="Preview backend disconnected.",q.innerHTML=`<g clip-path="url(#clip0_6013_33858)">
<path d="M4.8 17.6L12 5.6L19.2 17.6H4.8ZM6.91667 16.4H17.0833L12 7.93333L6.91667 16.4ZM12 15.6C12.1667 15.6 12.3056 15.5444 12.4167 15.4333C12.5389 15.3111 12.6 15.1667 12.6 15C12.6 14.8333 12.5389 14.6944 12.4167 14.5833C12.3056 14.4611 12.1667 14.4 12 14.4C11.8333 14.4 11.6889 14.4611 11.5667 14.5833C11.4556 14.6944 11.4 14.8333 11.4 15C11.4 15.1667 11.4556 15.3111 11.5667 15.4333C11.6889 15.5444 11.8333 15.6 12 15.6ZM11.4 13.6H12.6V10.4H11.4V13.6Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6013_33858">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`):(q.innerHTML=`<g clip-path="url(#clip0_6083_34804)">
<path d="M11.4 15.2H12.6V11.2H11.4V15.2ZM12 10C12.1667 10 12.3056 9.94444 12.4167 9.83333C12.5389 9.71111 12.6 9.56667 12.6 9.4C12.6 9.23333 12.5389 9.09444 12.4167 8.98333C12.3056 8.86111 12.1667 8.8 12 8.8C11.8333 8.8 11.6889 8.86111 11.5667 8.98333C11.4556 9.09444 11.4 9.23333 11.4 9.4C11.4 9.56667 11.4556 9.71111 11.5667 9.83333C11.6889 9.94444 11.8333 10 12 10ZM12 18.4C11.1222 18.4 10.2944 18.2333 9.51667 17.9C8.73889 17.5667 8.05556 17.1111 7.46667 16.5333C6.88889 15.9444 6.43333 15.2611 6.1 14.4833C5.76667 13.7056 5.6 12.8778 5.6 12C5.6 11.1111 5.76667 10.2833 6.1 9.51667C6.43333 8.73889 6.88889 8.06111 7.46667 7.48333C8.05556 6.89444 8.73889 6.43333 9.51667 6.1C10.2944 5.76667 11.1222 5.6 12 5.6C12.8889 5.6 13.7167 5.76667 14.4833 6.1C15.2611 6.43333 15.9389 6.89444 16.5167 7.48333C17.1056 8.06111 17.5667 8.73889 17.9 9.51667C18.2333 10.2833 18.4 11.1111 18.4 12C18.4 12.8778 18.2333 13.7056 17.9 14.4833C17.5667 15.2611 17.1056 15.9444 16.5167 16.5333C15.9389 17.1111 15.2611 17.5667 14.4833 17.9C13.7167 18.2333 12.8889 18.4 12 18.4ZM12 17.2C13.4444 17.2 14.6722 16.6944 15.6833 15.6833C16.6944 14.6722 17.2 13.4444 17.2 12C17.2 10.5556 16.6944 9.32778 15.6833 8.31667C14.6722 7.30555 13.4444 6.8 12 6.8C10.5556 6.8 9.32778 7.30555 8.31667 8.31667C7.30556 9.32778 6.8 10.5556 6.8 12C6.8 13.4444 7.30556 14.6722 8.31667 15.6833C9.32778 16.6944 10.5556 17.2 12 17.2Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6083_34804">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`,k.innerText="Preview backend running in this workspace."),k.setAttribute("id",P)}document.readyState==="loading"?window.addEventListener("DOMContentLoaded",g):g()}/**
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
 */function be(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function lp(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(be())}function hp(){var n;const e=(n=Hi())===null||n===void 0?void 0:n.forceEnvironment;if(e==="node")return!0;if(e==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function dp(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function fp(){const n=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof n=="object"&&n.id!==void 0}function pp(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function mp(){const n=be();return n.indexOf("MSIE ")>=0||n.indexOf("Trident/")>=0}function gp(){return!hp()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function _p(){try{return typeof indexedDB=="object"}catch{return!1}}function yp(){return new Promise((n,e)=>{try{let t=!0;const r="validate-browser-context-for-indexeddb-analytics-module",i=self.indexedDB.open(r);i.onsuccess=()=>{i.result.close(),t||self.indexedDB.deleteDatabase(r),n(!0)},i.onupgradeneeded=()=>{t=!1},i.onerror=()=>{var s;e(((s=i.error)===null||s===void 0?void 0:s.message)||"")}}catch(t){e(t)}})}/**
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
 */const vp="FirebaseError";class gt extends Error{constructor(e,t,r){super(t),this.code=e,this.customData=r,this.name=vp,Object.setPrototypeOf(this,gt.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,Dr.prototype.create)}}class Dr{constructor(e,t,r){this.service=e,this.serviceName=t,this.errors=r}create(e,...t){const r=t[0]||{},i=`${this.service}/${e}`,s=this.errors[e],a=s?Ip(s,r):"Error",c=`${this.serviceName}: ${a} (${i}).`;return new gt(i,c,r)}}function Ip(n,e){return n.replace(Ep,(t,r)=>{const i=e[r];return i!=null?String(i):`<${r}?>`})}const Ep=/\{\$([^}]+)}/g;function Tp(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}function Zt(n,e){if(n===e)return!0;const t=Object.keys(n),r=Object.keys(e);for(const i of t){if(!r.includes(i))return!1;const s=n[i],a=e[i];if(zc(s)&&zc(a)){if(!Zt(s,a))return!1}else if(s!==a)return!1}for(const i of r)if(!t.includes(i))return!1;return!0}function zc(n){return n!==null&&typeof n=="object"}/**
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
 */function Pn(n){const e=[];for(const[t,r]of Object.entries(n))Array.isArray(r)?r.forEach(i=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(i))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(r));return e.length?"&"+e.join("&"):""}function nr(n){const e={};return n.replace(/^\?/,"").split("&").forEach(r=>{if(r){const[i,s]=r.split("=");e[decodeURIComponent(i)]=decodeURIComponent(s)}}),e}function rr(n){const e=n.indexOf("?");if(!e)return"";const t=n.indexOf("#",e);return n.substring(e,t>0?t:void 0)}function wp(n,e){const t=new Ap(n,e);return t.subscribe.bind(t)}class Ap{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(r=>{this.error(r)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,r){let i;if(e===void 0&&t===void 0&&r===void 0)throw new Error("Missing Observer.");Rp(e,["next","error","complete"])?i=e:i={next:e,error:t,complete:r},i.next===void 0&&(i.next=Gs),i.error===void 0&&(i.error=Gs),i.complete===void 0&&(i.complete=Gs);const s=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?i.error(this.finalError):i.complete()}catch{}}),this.observers.push(i),s}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(r){typeof console<"u"&&console.error&&console.error(r)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function Rp(n,e){if(typeof n!="object"||n===null)return!1;for(const t of e)if(t in n&&typeof n[t]=="function")return!0;return!1}function Gs(){}/**
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
 */function x(n){return n&&n._delegate?n._delegate:n}class en{constructor(e,t,r){this.name=e,this.instanceFactory=t,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
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
 */const Gt="[DEFAULT]";/**
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
 */class Sp{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const r=new op;if(this.instancesDeferred.set(t,r),this.isInitialized(t)||this.shouldAutoInitialize())try{const i=this.getOrInitializeService({instanceIdentifier:t});i&&r.resolve(i)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){var t;const r=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),i=(t=e==null?void 0:e.optional)!==null&&t!==void 0?t:!1;if(this.isInitialized(r)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:r})}catch(s){if(i)return null;throw s}else{if(i)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(bp(e))try{this.getOrInitializeService({instanceIdentifier:Gt})}catch{}for(const[t,r]of this.instancesDeferred.entries()){const i=this.normalizeInstanceIdentifier(t);try{const s=this.getOrInitializeService({instanceIdentifier:i});r.resolve(s)}catch{}}}}clearInstance(e=Gt){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=Gt){return this.instances.has(e)}getOptions(e=Gt){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,r=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const i=this.getOrInitializeService({instanceIdentifier:r,options:t});for(const[s,a]of this.instancesDeferred.entries()){const c=this.normalizeInstanceIdentifier(s);r===c&&a.resolve(i)}return i}onInit(e,t){var r;const i=this.normalizeInstanceIdentifier(t),s=(r=this.onInitCallbacks.get(i))!==null&&r!==void 0?r:new Set;s.add(e),this.onInitCallbacks.set(i,s);const a=this.instances.get(i);return a&&e(a,i),()=>{s.delete(e)}}invokeOnInitCallbacks(e,t){const r=this.onInitCallbacks.get(t);if(r)for(const i of r)try{i(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let r=this.instances.get(e);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:Pp(e),options:t}),this.instances.set(e,r),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(r,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,r)}catch{}return r||null}normalizeInstanceIdentifier(e=Gt){return this.component?this.component.multipleInstances?e:Gt:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Pp(n){return n===Gt?void 0:n}function bp(n){return n.instantiationMode==="EAGER"}/**
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
 */class Cp{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new Sp(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
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
 */var z;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(z||(z={}));const kp={debug:z.DEBUG,verbose:z.VERBOSE,info:z.INFO,warn:z.WARN,error:z.ERROR,silent:z.SILENT},Np=z.INFO,Dp={[z.DEBUG]:"log",[z.VERBOSE]:"log",[z.INFO]:"info",[z.WARN]:"warn",[z.ERROR]:"error"},Op=(n,e,...t)=>{if(e<n.logLevel)return;const r=new Date().toISOString(),i=Dp[e];if(i)console[i](`[${r}]  ${n.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class xo{constructor(e){this.name=e,this._logLevel=Np,this._logHandler=Op,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in z))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?kp[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,z.DEBUG,...e),this._logHandler(this,z.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,z.VERBOSE,...e),this._logHandler(this,z.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,z.INFO,...e),this._logHandler(this,z.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,z.WARN,...e),this._logHandler(this,z.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,z.ERROR,...e),this._logHandler(this,z.ERROR,...e)}}const Vp=(n,e)=>e.some(t=>n instanceof t);let Wc,Gc;function Lp(){return Wc||(Wc=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Mp(){return Gc||(Gc=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const kl=new WeakMap,lo=new WeakMap,Nl=new WeakMap,Ks=new WeakMap,Fo=new WeakMap;function xp(n){const e=new Promise((t,r)=>{const i=()=>{n.removeEventListener("success",s),n.removeEventListener("error",a)},s=()=>{t(Rt(n.result)),i()},a=()=>{r(n.error),i()};n.addEventListener("success",s),n.addEventListener("error",a)});return e.then(t=>{t instanceof IDBCursor&&kl.set(t,n)}).catch(()=>{}),Fo.set(e,n),e}function Fp(n){if(lo.has(n))return;const e=new Promise((t,r)=>{const i=()=>{n.removeEventListener("complete",s),n.removeEventListener("error",a),n.removeEventListener("abort",a)},s=()=>{t(),i()},a=()=>{r(n.error||new DOMException("AbortError","AbortError")),i()};n.addEventListener("complete",s),n.addEventListener("error",a),n.addEventListener("abort",a)});lo.set(n,e)}let ho={get(n,e,t){if(n instanceof IDBTransaction){if(e==="done")return lo.get(n);if(e==="objectStoreNames")return n.objectStoreNames||Nl.get(n);if(e==="store")return t.objectStoreNames[1]?void 0:t.objectStore(t.objectStoreNames[0])}return Rt(n[e])},set(n,e,t){return n[e]=t,!0},has(n,e){return n instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in n}};function Up(n){ho=n(ho)}function Bp(n){return n===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...t){const r=n.call(Qs(this),e,...t);return Nl.set(r,e.sort?e.sort():[e]),Rt(r)}:Mp().includes(n)?function(...e){return n.apply(Qs(this),e),Rt(kl.get(this))}:function(...e){return Rt(n.apply(Qs(this),e))}}function qp(n){return typeof n=="function"?Bp(n):(n instanceof IDBTransaction&&Fp(n),Vp(n,Lp())?new Proxy(n,ho):n)}function Rt(n){if(n instanceof IDBRequest)return xp(n);if(Ks.has(n))return Ks.get(n);const e=qp(n);return e!==n&&(Ks.set(n,e),Fo.set(e,n)),e}const Qs=n=>Fo.get(n);function jp(n,e,{blocked:t,upgrade:r,blocking:i,terminated:s}={}){const a=indexedDB.open(n,e),c=Rt(a);return r&&a.addEventListener("upgradeneeded",l=>{r(Rt(a.result),l.oldVersion,l.newVersion,Rt(a.transaction),l)}),t&&a.addEventListener("blocked",l=>t(l.oldVersion,l.newVersion,l)),c.then(l=>{s&&l.addEventListener("close",()=>s()),i&&l.addEventListener("versionchange",d=>i(d.oldVersion,d.newVersion,d))}).catch(()=>{}),c}const $p=["get","getKey","getAll","getAllKeys","count"],Hp=["put","add","delete","clear"],Ys=new Map;function Kc(n,e){if(!(n instanceof IDBDatabase&&!(e in n)&&typeof e=="string"))return;if(Ys.get(e))return Ys.get(e);const t=e.replace(/FromIndex$/,""),r=e!==t,i=Hp.includes(t);if(!(t in(r?IDBIndex:IDBObjectStore).prototype)||!(i||$p.includes(t)))return;const s=async function(a,...c){const l=this.transaction(a,i?"readwrite":"readonly");let d=l.store;return r&&(d=d.index(c.shift())),(await Promise.all([d[t](...c),i&&l.done]))[0]};return Ys.set(e,s),s}Up(n=>({...n,get:(e,t,r)=>Kc(e,t)||n.get(e,t,r),has:(e,t)=>!!Kc(e,t)||n.has(e,t)}));/**
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
 */class zp{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(Wp(t)){const r=t.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(t=>t).join(" ")}}function Wp(n){const e=n.getComponent();return(e==null?void 0:e.type)==="VERSION"}const fo="@firebase/app",Qc="0.13.2";/**
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
 */const lt=new xo("@firebase/app"),Gp="@firebase/app-compat",Kp="@firebase/analytics-compat",Qp="@firebase/analytics",Yp="@firebase/app-check-compat",Jp="@firebase/app-check",Xp="@firebase/auth",Zp="@firebase/auth-compat",em="@firebase/database",tm="@firebase/data-connect",nm="@firebase/database-compat",rm="@firebase/functions",im="@firebase/functions-compat",sm="@firebase/installations",om="@firebase/installations-compat",am="@firebase/messaging",cm="@firebase/messaging-compat",um="@firebase/performance",lm="@firebase/performance-compat",hm="@firebase/remote-config",dm="@firebase/remote-config-compat",fm="@firebase/storage",pm="@firebase/storage-compat",mm="@firebase/firestore",gm="@firebase/ai",_m="@firebase/firestore-compat",ym="firebase",vm="11.10.0";/**
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
 */const po="[DEFAULT]",Im={[fo]:"fire-core",[Gp]:"fire-core-compat",[Qp]:"fire-analytics",[Kp]:"fire-analytics-compat",[Jp]:"fire-app-check",[Yp]:"fire-app-check-compat",[Xp]:"fire-auth",[Zp]:"fire-auth-compat",[em]:"fire-rtdb",[tm]:"fire-data-connect",[nm]:"fire-rtdb-compat",[rm]:"fire-fn",[im]:"fire-fn-compat",[sm]:"fire-iid",[om]:"fire-iid-compat",[am]:"fire-fcm",[cm]:"fire-fcm-compat",[um]:"fire-perf",[lm]:"fire-perf-compat",[hm]:"fire-rc",[dm]:"fire-rc-compat",[fm]:"fire-gcs",[pm]:"fire-gcs-compat",[mm]:"fire-fst",[_m]:"fire-fst-compat",[gm]:"fire-vertex","fire-js":"fire-js",[ym]:"fire-js-all"};/**
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
 */const yr=new Map,Em=new Map,mo=new Map;function Yc(n,e){try{n.container.addComponent(e)}catch(t){lt.debug(`Component ${e.name} failed to register with FirebaseApp ${n.name}`,t)}}function vn(n){const e=n.name;if(mo.has(e))return lt.debug(`There were multiple attempts to register component ${e}.`),!1;mo.set(e,n);for(const t of yr.values())Yc(t,n);for(const t of Em.values())Yc(t,n);return!0}function Uo(n,e){const t=n.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),n.container.getProvider(e)}function re(n){return n==null?!1:n.settings!==void 0}/**
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
 */const Tm={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},St=new Dr("app","Firebase",Tm);/**
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
 */class wm{constructor(e,t,r){this._isDeleted=!1,this._options=Object.assign({},e),this._config=Object.assign({},t),this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new en("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw St.create("app-deleted",{appName:this._name})}}/**
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
 */const bn=vm;function Am(n,e={}){let t=n;typeof e!="object"&&(e={name:e});const r=Object.assign({name:po,automaticDataCollectionEnabled:!0},e),i=r.name;if(typeof i!="string"||!i)throw St.create("bad-app-name",{appName:String(i)});if(t||(t=Sl()),!t)throw St.create("no-options");const s=yr.get(i);if(s){if(Zt(t,s.options)&&Zt(r,s.config))return s;throw St.create("duplicate-app",{appName:i})}const a=new Cp(i);for(const l of mo.values())a.addComponent(l);const c=new wm(t,r,a);return yr.set(i,c),c}function Dl(n=po){const e=yr.get(n);if(!e&&n===po&&Sl())return Am();if(!e)throw St.create("no-app",{appName:n});return e}function TT(){return Array.from(yr.values())}function Pt(n,e,t){var r;let i=(r=Im[n])!==null&&r!==void 0?r:n;t&&(i+=`-${t}`);const s=i.match(/\s|\//),a=e.match(/\s|\//);if(s||a){const c=[`Unable to register library "${i}" with version "${e}":`];s&&c.push(`library name "${i}" contains illegal characters (whitespace or "/")`),s&&a&&c.push("and"),a&&c.push(`version name "${e}" contains illegal characters (whitespace or "/")`),lt.warn(c.join(" "));return}vn(new en(`${i}-version`,()=>({library:i,version:e}),"VERSION"))}/**
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
 */const Rm="firebase-heartbeat-database",Sm=1,vr="firebase-heartbeat-store";let Js=null;function Ol(){return Js||(Js=jp(Rm,Sm,{upgrade:(n,e)=>{switch(e){case 0:try{n.createObjectStore(vr)}catch(t){console.warn(t)}}}}).catch(n=>{throw St.create("idb-open",{originalErrorMessage:n.message})})),Js}async function Pm(n){try{const t=(await Ol()).transaction(vr),r=await t.objectStore(vr).get(Vl(n));return await t.done,r}catch(e){if(e instanceof gt)lt.warn(e.message);else{const t=St.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});lt.warn(t.message)}}}async function Jc(n,e){try{const r=(await Ol()).transaction(vr,"readwrite");await r.objectStore(vr).put(e,Vl(n)),await r.done}catch(t){if(t instanceof gt)lt.warn(t.message);else{const r=St.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});lt.warn(r.message)}}}function Vl(n){return`${n.name}!${n.options.appId}`}/**
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
 */const bm=1024,Cm=30;class km{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new Dm(t),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var e,t;try{const i=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),s=Xc();if(((e=this._heartbeatsCache)===null||e===void 0?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)===null||t===void 0?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===s||this._heartbeatsCache.heartbeats.some(a=>a.date===s))return;if(this._heartbeatsCache.heartbeats.push({date:s,agent:i}),this._heartbeatsCache.heartbeats.length>Cm){const a=Om(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(a,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){lt.warn(r)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)===null||e===void 0?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=Xc(),{heartbeatsToSend:r,unsentEntries:i}=Nm(this._heartbeatsCache.heartbeats),s=Si(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=t,i.length>0?(this._heartbeatsCache.heartbeats=i,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),s}catch(t){return lt.warn(t),""}}}function Xc(){return new Date().toISOString().substring(0,10)}function Nm(n,e=bm){const t=[];let r=n.slice();for(const i of n){const s=t.find(a=>a.agent===i.agent);if(s){if(s.dates.push(i.date),Zc(t)>e){s.dates.pop();break}}else if(t.push({agent:i.agent,dates:[i.date]}),Zc(t)>e){t.pop();break}r=r.slice(1)}return{heartbeatsToSend:t,unsentEntries:r}}class Dm{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return _p()?yp().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await Pm(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){var t;if(await this._canUseIndexedDBPromise){const i=await this.read();return Jc(this.app,{lastSentHeartbeatDate:(t=e.lastSentHeartbeatDate)!==null&&t!==void 0?t:i.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){var t;if(await this._canUseIndexedDBPromise){const i=await this.read();return Jc(this.app,{lastSentHeartbeatDate:(t=e.lastSentHeartbeatDate)!==null&&t!==void 0?t:i.lastSentHeartbeatDate,heartbeats:[...i.heartbeats,...e.heartbeats]})}else return}}function Zc(n){return Si(JSON.stringify({version:2,heartbeats:n})).length}function Om(n){if(n.length===0)return-1;let e=0,t=n[0].date;for(let r=1;r<n.length;r++)n[r].date<t&&(t=n[r].date,e=r);return e}/**
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
 */function Vm(n){vn(new en("platform-logger",e=>new zp(e),"PRIVATE")),vn(new en("heartbeat",e=>new km(e),"PRIVATE")),Pt(fo,Qc,n),Pt(fo,Qc,"esm2017"),Pt("fire-js","")}Vm("");function Bo(n,e){var t={};for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&e.indexOf(r)<0&&(t[r]=n[r]);if(n!=null&&typeof Object.getOwnPropertySymbols=="function")for(var i=0,r=Object.getOwnPropertySymbols(n);i<r.length;i++)e.indexOf(r[i])<0&&Object.prototype.propertyIsEnumerable.call(n,r[i])&&(t[r[i]]=n[r[i]]);return t}/**
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
 */const Lm={PHONE:"phone",TOTP:"totp"},Mm={FACEBOOK:"facebook.com",GITHUB:"github.com",GOOGLE:"google.com",PASSWORD:"password",PHONE:"phone",TWITTER:"twitter.com"},xm={EMAIL_LINK:"emailLink",EMAIL_PASSWORD:"password",FACEBOOK:"facebook.com",GITHUB:"github.com",GOOGLE:"google.com",PHONE:"phone",TWITTER:"twitter.com"},Fm={LINK:"link",REAUTHENTICATE:"reauthenticate",SIGN_IN:"signIn"},Um={EMAIL_SIGNIN:"EMAIL_SIGNIN",PASSWORD_RESET:"PASSWORD_RESET",RECOVER_EMAIL:"RECOVER_EMAIL",REVERT_SECOND_FACTOR_ADDITION:"REVERT_SECOND_FACTOR_ADDITION",VERIFY_AND_CHANGE_EMAIL:"VERIFY_AND_CHANGE_EMAIL",VERIFY_EMAIL:"VERIFY_EMAIL"};/**
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
 */function Bm(){return{"admin-restricted-operation":"This operation is restricted to administrators only.","argument-error":"","app-not-authorized":"This app, identified by the domain where it's hosted, is not authorized to use Firebase Authentication with the provided API key. Review your key configuration in the Google API console.","app-not-installed":"The requested mobile application corresponding to the identifier (Android package name or iOS bundle ID) provided is not installed on this device.","captcha-check-failed":"The reCAPTCHA response token provided is either invalid, expired, already used or the domain associated with it does not match the list of whitelisted domains.","code-expired":"The SMS code has expired. Please re-send the verification code to try again.","cordova-not-ready":"Cordova framework is not ready.","cors-unsupported":"This browser is not supported.","credential-already-in-use":"This credential is already associated with a different user account.","custom-token-mismatch":"The custom token corresponds to a different audience.","requires-recent-login":"This operation is sensitive and requires recent authentication. Log in again before retrying this request.","dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK.","dynamic-link-not-activated":"Please activate Dynamic Links in the Firebase Console and agree to the terms and conditions.","email-change-needs-verification":"Multi-factor users must always have a verified email.","email-already-in-use":"The email address is already in use by another account.","emulator-config-failed":'Auth instance has already been used to make a network call. Auth can no longer be configured to use the emulator. Try calling "connectAuthEmulator()" sooner.',"expired-action-code":"The action code has expired.","cancelled-popup-request":"This operation has been cancelled due to another conflicting popup being opened.","internal-error":"An internal AuthError has occurred.","invalid-app-credential":"The phone verification request contains an invalid application verifier. The reCAPTCHA token response is either invalid or expired.","invalid-app-id":"The mobile app identifier is not registered for the current project.","invalid-user-token":"This user's credential isn't valid for this project. This can happen if the user's token has been tampered with, or if the user isn't for the project associated with this API key.","invalid-auth-event":"An internal AuthError has occurred.","invalid-verification-code":"The SMS verification code used to create the phone auth credential is invalid. Please resend the verification code sms and be sure to use the verification code provided by the user.","invalid-continue-uri":"The continue URL provided in the request is invalid.","invalid-cordova-configuration":"The following Cordova plugins must be installed to enable OAuth sign-in: cordova-plugin-buildinfo, cordova-universal-links-plugin, cordova-plugin-browsertab, cordova-plugin-inappbrowser and cordova-plugin-customurlscheme.","invalid-custom-token":"The custom token format is incorrect. Please check the documentation.","invalid-dynamic-link-domain":"The provided dynamic link domain is not configured or authorized for the current project.","invalid-email":"The email address is badly formatted.","invalid-emulator-scheme":"Emulator URL must start with a valid scheme (http:// or https://).","invalid-api-key":"Your API key is invalid, please check you have copied it correctly.","invalid-cert-hash":"The SHA-1 certificate hash provided is invalid.","invalid-credential":"The supplied auth credential is incorrect, malformed or has expired.","invalid-message-payload":"The email template corresponding to this action contains invalid characters in its message. Please fix by going to the Auth email templates section in the Firebase Console.","invalid-multi-factor-session":"The request does not contain a valid proof of first factor successful sign-in.","invalid-oauth-provider":"EmailAuthProvider is not supported for this operation. This operation only supports OAuth providers.","invalid-oauth-client-id":"The OAuth client ID provided is either invalid or does not match the specified API key.","unauthorized-domain":"This domain is not authorized for OAuth operations for your Firebase project. Edit the list of authorized domains from the Firebase console.","invalid-action-code":"The action code is invalid. This can happen if the code is malformed, expired, or has already been used.","wrong-password":"The password is invalid or the user does not have a password.","invalid-persistence-type":"The specified persistence type is invalid. It can only be local, session or none.","invalid-phone-number":"The format of the phone number provided is incorrect. Please enter the phone number in a format that can be parsed into E.164 format. E.164 phone numbers are written in the format [+][country code][subscriber number including area code].","invalid-provider-id":"The specified provider ID is invalid.","invalid-recipient-email":"The email corresponding to this action failed to send as the provided recipient email address is invalid.","invalid-sender":"The email template corresponding to this action contains an invalid sender email or name. Please fix by going to the Auth email templates section in the Firebase Console.","invalid-verification-id":"The verification ID used to create the phone auth credential is invalid.","invalid-tenant-id":"The Auth instance's tenant ID is invalid.","login-blocked":"Login blocked by user-provided method: {$originalMessage}","missing-android-pkg-name":"An Android Package Name must be provided if the Android App is required to be installed.","auth-domain-config-required":"Be sure to include authDomain when calling firebase.initializeApp(), by following the instructions in the Firebase console.","missing-app-credential":"The phone verification request is missing an application verifier assertion. A reCAPTCHA response token needs to be provided.","missing-verification-code":"The phone auth credential was created with an empty SMS verification code.","missing-continue-uri":"A continue URL must be provided in the request.","missing-iframe-start":"An internal AuthError has occurred.","missing-ios-bundle-id":"An iOS Bundle ID must be provided if an App Store ID is provided.","missing-or-invalid-nonce":"The request does not contain a valid nonce. This can occur if the SHA-256 hash of the provided raw nonce does not match the hashed nonce in the ID token payload.","missing-password":"A non-empty password must be provided","missing-multi-factor-info":"No second factor identifier is provided.","missing-multi-factor-session":"The request is missing proof of first factor successful sign-in.","missing-phone-number":"To send verification codes, provide a phone number for the recipient.","missing-verification-id":"The phone auth credential was created with an empty verification ID.","app-deleted":"This instance of FirebaseApp has been deleted.","multi-factor-info-not-found":"The user does not have a second factor matching the identifier provided.","multi-factor-auth-required":"Proof of ownership of a second factor is required to complete sign-in.","account-exists-with-different-credential":"An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.","network-request-failed":"A network AuthError (such as timeout, interrupted connection or unreachable host) has occurred.","no-auth-event":"An internal AuthError has occurred.","no-such-provider":"User was not linked to an account with the given provider.","null-user":"A null user object was provided as the argument for an operation which requires a non-null user object.","operation-not-allowed":"The given sign-in provider is disabled for this Firebase project. Enable it in the Firebase console, under the sign-in method tab of the Auth section.","operation-not-supported-in-this-environment":'This operation is not supported in the environment this application is running on. "location.protocol" must be http, https or chrome-extension and web storage must be enabled.',"popup-blocked":"Unable to establish a connection with the popup. It may have been blocked by the browser.","popup-closed-by-user":"The popup has been closed by the user before finalizing the operation.","provider-already-linked":"User can only be linked to one identity for the given provider.","quota-exceeded":"The project's quota for this operation has been exceeded.","redirect-cancelled-by-user":"The redirect operation has been cancelled by the user before finalizing.","redirect-operation-pending":"A redirect sign-in operation is already pending.","rejected-credential":"The request contains malformed or mismatching credentials.","second-factor-already-in-use":"The second factor is already enrolled on this account.","maximum-second-factor-count-exceeded":"The maximum allowed number of second factors on a user has been exceeded.","tenant-id-mismatch":"The provided tenant ID does not match the Auth instance's tenant ID",timeout:"The operation has timed out.","user-token-expired":"The user's credential is no longer valid. The user must sign in again.","too-many-requests":"We have blocked all requests from this device due to unusual activity. Try again later.","unauthorized-continue-uri":"The domain of the continue URL is not whitelisted.  Please whitelist the domain in the Firebase console.","unsupported-first-factor":"Enrolling a second factor or signing in with a multi-factor account requires sign-in with a supported first factor.","unsupported-persistence-type":"The current environment does not support the specified persistence type.","unsupported-tenant-operation":"This operation is not supported in a multi-tenant context.","unverified-email":"The operation requires a verified email.","user-cancelled":"The user did not grant your application the permissions it requested.","user-not-found":"There is no user record corresponding to this identifier. The user may have been deleted.","user-disabled":"The user account has been disabled by an administrator.","user-mismatch":"The supplied credentials do not correspond to the previously signed in user.","user-signed-out":"","weak-password":"The password must be 6 characters long or more.","web-storage-unsupported":"This browser is not supported or 3rd party cookies and data may be disabled.","already-initialized":"initializeAuth() has already been called with different options. To avoid this error, call initializeAuth() with the same options as when it was originally called, or call getAuth() to return the already initialized instance.","missing-recaptcha-token":"The reCAPTCHA token is missing when sending request to the backend.","invalid-recaptcha-token":"The reCAPTCHA token is invalid when sending request to the backend.","invalid-recaptcha-action":"The reCAPTCHA action is invalid when sending request to the backend.","recaptcha-not-enabled":"reCAPTCHA Enterprise integration is not enabled for this project.","missing-client-type":"The reCAPTCHA client type is missing when sending request to the backend.","missing-recaptcha-version":"The reCAPTCHA version is missing when sending request to the backend.","invalid-req-type":"Invalid request parameters.","invalid-recaptcha-version":"The reCAPTCHA version is invalid when sending request to the backend.","unsupported-password-policy-schema-version":"The password policy received from the backend uses a schema version that is not supported by this version of the Firebase SDK.","password-does-not-meet-requirements":"The password does not meet the requirements.","invalid-hosting-link-domain":"The provided Hosting link domain is not configured in Firebase Hosting or is not owned by the current project. This cannot be a default Hosting domain (`web.app` or `firebaseapp.com`)."}}function Ll(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const qm=Bm,Ml=Ll,xl=new Dr("auth","Firebase",Ll()),jm={ADMIN_ONLY_OPERATION:"auth/admin-restricted-operation",ARGUMENT_ERROR:"auth/argument-error",APP_NOT_AUTHORIZED:"auth/app-not-authorized",APP_NOT_INSTALLED:"auth/app-not-installed",CAPTCHA_CHECK_FAILED:"auth/captcha-check-failed",CODE_EXPIRED:"auth/code-expired",CORDOVA_NOT_READY:"auth/cordova-not-ready",CORS_UNSUPPORTED:"auth/cors-unsupported",CREDENTIAL_ALREADY_IN_USE:"auth/credential-already-in-use",CREDENTIAL_MISMATCH:"auth/custom-token-mismatch",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"auth/requires-recent-login",DEPENDENT_SDK_INIT_BEFORE_AUTH:"auth/dependent-sdk-initialized-before-auth",DYNAMIC_LINK_NOT_ACTIVATED:"auth/dynamic-link-not-activated",EMAIL_CHANGE_NEEDS_VERIFICATION:"auth/email-change-needs-verification",EMAIL_EXISTS:"auth/email-already-in-use",EMULATOR_CONFIG_FAILED:"auth/emulator-config-failed",EXPIRED_OOB_CODE:"auth/expired-action-code",EXPIRED_POPUP_REQUEST:"auth/cancelled-popup-request",INTERNAL_ERROR:"auth/internal-error",INVALID_API_KEY:"auth/invalid-api-key",INVALID_APP_CREDENTIAL:"auth/invalid-app-credential",INVALID_APP_ID:"auth/invalid-app-id",INVALID_AUTH:"auth/invalid-user-token",INVALID_AUTH_EVENT:"auth/invalid-auth-event",INVALID_CERT_HASH:"auth/invalid-cert-hash",INVALID_CODE:"auth/invalid-verification-code",INVALID_CONTINUE_URI:"auth/invalid-continue-uri",INVALID_CORDOVA_CONFIGURATION:"auth/invalid-cordova-configuration",INVALID_CUSTOM_TOKEN:"auth/invalid-custom-token",INVALID_DYNAMIC_LINK_DOMAIN:"auth/invalid-dynamic-link-domain",INVALID_EMAIL:"auth/invalid-email",INVALID_EMULATOR_SCHEME:"auth/invalid-emulator-scheme",INVALID_IDP_RESPONSE:"auth/invalid-credential",INVALID_LOGIN_CREDENTIALS:"auth/invalid-credential",INVALID_MESSAGE_PAYLOAD:"auth/invalid-message-payload",INVALID_MFA_SESSION:"auth/invalid-multi-factor-session",INVALID_OAUTH_CLIENT_ID:"auth/invalid-oauth-client-id",INVALID_OAUTH_PROVIDER:"auth/invalid-oauth-provider",INVALID_OOB_CODE:"auth/invalid-action-code",INVALID_ORIGIN:"auth/unauthorized-domain",INVALID_PASSWORD:"auth/wrong-password",INVALID_PERSISTENCE:"auth/invalid-persistence-type",INVALID_PHONE_NUMBER:"auth/invalid-phone-number",INVALID_PROVIDER_ID:"auth/invalid-provider-id",INVALID_RECIPIENT_EMAIL:"auth/invalid-recipient-email",INVALID_SENDER:"auth/invalid-sender",INVALID_SESSION_INFO:"auth/invalid-verification-id",INVALID_TENANT_ID:"auth/invalid-tenant-id",MFA_INFO_NOT_FOUND:"auth/multi-factor-info-not-found",MFA_REQUIRED:"auth/multi-factor-auth-required",MISSING_ANDROID_PACKAGE_NAME:"auth/missing-android-pkg-name",MISSING_APP_CREDENTIAL:"auth/missing-app-credential",MISSING_AUTH_DOMAIN:"auth/auth-domain-config-required",MISSING_CODE:"auth/missing-verification-code",MISSING_CONTINUE_URI:"auth/missing-continue-uri",MISSING_IFRAME_START:"auth/missing-iframe-start",MISSING_IOS_BUNDLE_ID:"auth/missing-ios-bundle-id",MISSING_OR_INVALID_NONCE:"auth/missing-or-invalid-nonce",MISSING_MFA_INFO:"auth/missing-multi-factor-info",MISSING_MFA_SESSION:"auth/missing-multi-factor-session",MISSING_PHONE_NUMBER:"auth/missing-phone-number",MISSING_SESSION_INFO:"auth/missing-verification-id",MODULE_DESTROYED:"auth/app-deleted",NEED_CONFIRMATION:"auth/account-exists-with-different-credential",NETWORK_REQUEST_FAILED:"auth/network-request-failed",NULL_USER:"auth/null-user",NO_AUTH_EVENT:"auth/no-auth-event",NO_SUCH_PROVIDER:"auth/no-such-provider",OPERATION_NOT_ALLOWED:"auth/operation-not-allowed",OPERATION_NOT_SUPPORTED:"auth/operation-not-supported-in-this-environment",POPUP_BLOCKED:"auth/popup-blocked",POPUP_CLOSED_BY_USER:"auth/popup-closed-by-user",PROVIDER_ALREADY_LINKED:"auth/provider-already-linked",QUOTA_EXCEEDED:"auth/quota-exceeded",REDIRECT_CANCELLED_BY_USER:"auth/redirect-cancelled-by-user",REDIRECT_OPERATION_PENDING:"auth/redirect-operation-pending",REJECTED_CREDENTIAL:"auth/rejected-credential",SECOND_FACTOR_ALREADY_ENROLLED:"auth/second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"auth/maximum-second-factor-count-exceeded",TENANT_ID_MISMATCH:"auth/tenant-id-mismatch",TIMEOUT:"auth/timeout",TOKEN_EXPIRED:"auth/user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"auth/too-many-requests",UNAUTHORIZED_DOMAIN:"auth/unauthorized-continue-uri",UNSUPPORTED_FIRST_FACTOR:"auth/unsupported-first-factor",UNSUPPORTED_PERSISTENCE:"auth/unsupported-persistence-type",UNSUPPORTED_TENANT_OPERATION:"auth/unsupported-tenant-operation",UNVERIFIED_EMAIL:"auth/unverified-email",USER_CANCELLED:"auth/user-cancelled",USER_DELETED:"auth/user-not-found",USER_DISABLED:"auth/user-disabled",USER_MISMATCH:"auth/user-mismatch",USER_SIGNED_OUT:"auth/user-signed-out",WEAK_PASSWORD:"auth/weak-password",WEB_STORAGE_UNSUPPORTED:"auth/web-storage-unsupported",ALREADY_INITIALIZED:"auth/already-initialized",RECAPTCHA_NOT_ENABLED:"auth/recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"auth/missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"auth/invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"auth/invalid-recaptcha-action",MISSING_CLIENT_TYPE:"auth/missing-client-type",MISSING_RECAPTCHA_VERSION:"auth/missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"auth/invalid-recaptcha-version",INVALID_REQ_TYPE:"auth/invalid-req-type",INVALID_HOSTING_LINK_DOMAIN:"auth/invalid-hosting-link-domain"};/**
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
 */const Pi=new xo("@firebase/auth");function $m(n,...e){Pi.logLevel<=z.WARN&&Pi.warn(`Auth (${bn}): ${n}`,...e)}function gi(n,...e){Pi.logLevel<=z.ERROR&&Pi.error(`Auth (${bn}): ${n}`,...e)}/**
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
 */function Le(n,...e){throw jo(n,...e)}function Ne(n,...e){return jo(n,...e)}function qo(n,e,t){const r=Object.assign(Object.assign({},Ml()),{[e]:t});return new Dr("auth","Firebase",r).create(e,{appName:n.name})}function ge(n){return qo(n,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function Cn(n,e,t){const r=t;if(!(e instanceof r))throw r.name!==e.constructor.name&&Le(n,"argument-error"),qo(n,"argument-error",`Type of ${e.constructor.name} does not match expected instance.Did you pass a reference from a different Auth SDK?`)}function jo(n,...e){if(typeof n!="string"){const t=e[0],r=[...e.slice(1)];return r[0]&&(r[0].appName=n.name),n._errorFactory.create(t,...r)}return xl.create(n,...e)}function C(n,e,...t){if(!n)throw jo(e,...t)}function We(n){const e="INTERNAL ASSERTION FAILED: "+n;throw gi(e),new Error(e)}function ht(n,e){n||We(e)}/**
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
 */function Ir(){var n;return typeof self<"u"&&((n=self.location)===null||n===void 0?void 0:n.href)||""}function $o(){return eu()==="http:"||eu()==="https:"}function eu(){var n;return typeof self<"u"&&((n=self.location)===null||n===void 0?void 0:n.protocol)||null}/**
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
 */function Hm(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&($o()||fp()||"connection"in navigator)?navigator.onLine:!0}function zm(){if(typeof navigator>"u")return null;const n=navigator;return n.languages&&n.languages[0]||n.language||null}/**
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
 */class Or{constructor(e,t){this.shortDelay=e,this.longDelay=t,ht(t>e,"Short delay should be less than long delay!"),this.isMobile=lp()||pp()}get(){return Hm()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
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
 */function Ho(n,e){ht(n.emulator,"Emulator should always be set here");const{url:t}=n.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
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
 */class Fl{static initialize(e,t,r){this.fetchImpl=e,t&&(this.headersImpl=t),r&&(this.responseImpl=r)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;We("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;We("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;We("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
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
 */const Wm={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
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
 */const Gm=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],Km=new Or(3e4,6e4);function ee(n,e){return n.tenantId&&!e.tenantId?Object.assign(Object.assign({},e),{tenantId:n.tenantId}):e}async function te(n,e,t,r,i={}){return Ul(n,i,async()=>{let s={},a={};r&&(e==="GET"?a=r:s={body:JSON.stringify(r)});const c=Pn(Object.assign({key:n.config.apiKey},a)).slice(1),l=await n._getAdditionalHeaders();l["Content-Type"]="application/json",n.languageCode&&(l["X-Firebase-Locale"]=n.languageCode);const d=Object.assign({method:e,headers:l},s);return dp()||(d.referrerPolicy="no-referrer"),n.emulatorConfig&&Sn(n.emulatorConfig.host)&&(d.credentials="include"),Fl.fetch()(await Bl(n,n.config.apiHost,t,c),d)})}async function Ul(n,e,t){n._canInitEmulator=!1;const r=Object.assign(Object.assign({},Wm),e);try{const i=new Ym(n),s=await Promise.race([t(),i.promise]);i.clearNetworkTimeout();const a=await s.json();if("needConfirmation"in a)throw ir(n,"account-exists-with-different-credential",a);if(s.ok&&!("errorMessage"in a))return a;{const c=s.ok?a.errorMessage:a.error.message,[l,d]=c.split(" : ");if(l==="FEDERATED_USER_ID_ALREADY_LINKED")throw ir(n,"credential-already-in-use",a);if(l==="EMAIL_EXISTS")throw ir(n,"email-already-in-use",a);if(l==="USER_DISABLED")throw ir(n,"user-disabled",a);const p=r[l]||l.toLowerCase().replace(/[_\s]+/g,"-");if(d)throw qo(n,p,d);Le(n,p)}}catch(i){if(i instanceof gt)throw i;Le(n,"network-request-failed",{message:String(i)})}}async function _t(n,e,t,r,i={}){const s=await te(n,e,t,r,i);return"mfaPendingCredential"in s&&Le(n,"multi-factor-auth-required",{_serverResponse:s}),s}async function Bl(n,e,t,r){const i=`${e}${t}?${r}`,s=n,a=s.config.emulator?Ho(n.config,i):`${n.config.apiScheme}://${i}`;return Gm.includes(t)&&(await s._persistenceManagerAvailable,s._getPersistenceType()==="COOKIE")?s._getPersistence()._getFinalTarget(a).toString():a}function Qm(n){switch(n){case"ENFORCE":return"ENFORCE";case"AUDIT":return"AUDIT";case"OFF":return"OFF";default:return"ENFORCEMENT_STATE_UNSPECIFIED"}}class Ym{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,r)=>{this.timer=setTimeout(()=>r(Ne(this.auth,"network-request-failed")),Km.get())})}}function ir(n,e,t){const r={appName:n.name};t.email&&(r.email=t.email),t.phoneNumber&&(r.phoneNumber=t.phoneNumber);const i=Ne(n,e,r);return i.customData._tokenResponse=t,i}/**
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
 */function tu(n){return n!==void 0&&n.getResponse!==void 0}function nu(n){return n!==void 0&&n.enterprise!==void 0}class ql{constructor(e){if(this.siteKey="",this.recaptchaEnforcementState=[],e.recaptchaKey===void 0)throw new Error("recaptchaKey undefined");this.siteKey=e.recaptchaKey.split("/")[3],this.recaptchaEnforcementState=e.recaptchaEnforcementState}getProviderEnforcementState(e){if(!this.recaptchaEnforcementState||this.recaptchaEnforcementState.length===0)return null;for(const t of this.recaptchaEnforcementState)if(t.provider&&t.provider===e)return Qm(t.enforcementState);return null}isProviderEnabled(e){return this.getProviderEnforcementState(e)==="ENFORCE"||this.getProviderEnforcementState(e)==="AUDIT"}isAnyProviderEnabled(){return this.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")||this.isProviderEnabled("PHONE_PROVIDER")}}/**
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
 */async function Jm(n){return(await te(n,"GET","/v1/recaptchaParams")).recaptchaSiteKey||""}async function jl(n,e){return te(n,"GET","/v2/recaptchaConfig",ee(n,e))}/**
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
 */async function Xm(n,e){return te(n,"POST","/v1/accounts:delete",e)}async function Zm(n,e){return te(n,"POST","/v1/accounts:update",e)}async function bi(n,e){return te(n,"POST","/v1/accounts:lookup",e)}/**
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
 */function lr(n){if(n)try{const e=new Date(Number(n));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}/**
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
 */function eg(n,e=!1){return x(n).getIdToken(e)}async function $l(n,e=!1){const t=x(n),r=await t.getIdToken(e),i=zi(r);C(i&&i.exp&&i.auth_time&&i.iat,t.auth,"internal-error");const s=typeof i.firebase=="object"?i.firebase:void 0,a=s==null?void 0:s.sign_in_provider;return{claims:i,token:r,authTime:lr(Xs(i.auth_time)),issuedAtTime:lr(Xs(i.iat)),expirationTime:lr(Xs(i.exp)),signInProvider:a||null,signInSecondFactor:(s==null?void 0:s.sign_in_second_factor)||null}}function Xs(n){return Number(n)*1e3}function zi(n){const[e,t,r]=n.split(".");if(e===void 0||t===void 0||r===void 0)return gi("JWT malformed, contained fewer than 3 sections"),null;try{const i=Al(t);return i?JSON.parse(i):(gi("Failed to decode base64 JWT payload"),null)}catch(i){return gi("Caught error parsing JWT payload as JSON",i==null?void 0:i.toString()),null}}function ru(n){const e=zi(n);return C(e,"internal-error"),C(typeof e.exp<"u","internal-error"),C(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
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
 */async function dt(n,e,t=!1){if(t)return e;try{return await e}catch(r){throw r instanceof gt&&tg(r)&&n.auth.currentUser===n&&await n.auth.signOut(),r}}function tg({code:n}){return n==="auth/user-disabled"||n==="auth/user-token-expired"}/**
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
 */class ng{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){var t;if(e){const r=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),r}else{this.errorBackoff=3e4;const i=((t=this.user.stsTokenManager.expirationTime)!==null&&t!==void 0?t:0)-Date.now()-3e5;return Math.max(0,i)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
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
 */class go{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=lr(this.lastLoginAt),this.creationTime=lr(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
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
 */async function Er(n){var e;const t=n.auth,r=await n.getIdToken(),i=await dt(n,bi(t,{idToken:r}));C(i==null?void 0:i.users.length,t,"internal-error");const s=i.users[0];n._notifyReloadListener(s);const a=!((e=s.providerUserInfo)===null||e===void 0)&&e.length?zl(s.providerUserInfo):[],c=rg(n.providerData,a),l=n.isAnonymous,d=!(n.email&&s.passwordHash)&&!(c!=null&&c.length),p=l?d:!1,g={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:c,metadata:new go(s.createdAt,s.lastLoginAt),isAnonymous:p};Object.assign(n,g)}async function Hl(n){const e=x(n);await Er(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function rg(n,e){return[...n.filter(r=>!e.some(i=>i.providerId===r.providerId)),...e]}function zl(n){return n.map(e=>{var{providerId:t}=e,r=Bo(e,["providerId"]);return{providerId:t,uid:r.rawId||"",displayName:r.displayName||null,email:r.email||null,phoneNumber:r.phoneNumber||null,photoURL:r.photoUrl||null}})}/**
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
 */async function ig(n,e){const t=await Ul(n,{},async()=>{const r=Pn({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:i,apiKey:s}=n.config,a=await Bl(n,i,"/v1/token",`key=${s}`),c=await n._getAdditionalHeaders();c["Content-Type"]="application/x-www-form-urlencoded";const l={method:"POST",headers:c,body:r};return n.emulatorConfig&&Sn(n.emulatorConfig.host)&&(l.credentials="include"),Fl.fetch()(a,l)});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function sg(n,e){return te(n,"POST","/v2/accounts:revokeToken",ee(n,e))}/**
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
 */class mn{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){C(e.idToken,"internal-error"),C(typeof e.idToken<"u","internal-error"),C(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):ru(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){C(e.length!==0,"internal-error");const t=ru(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(C(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:r,refreshToken:i,expiresIn:s}=await ig(e,t);this.updateTokensAndExpiration(r,i,Number(s))}updateTokensAndExpiration(e,t,r){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+r*1e3}static fromJSON(e,t){const{refreshToken:r,accessToken:i,expirationTime:s}=t,a=new mn;return r&&(C(typeof r=="string","internal-error",{appName:e}),a.refreshToken=r),i&&(C(typeof i=="string","internal-error",{appName:e}),a.accessToken=i),s&&(C(typeof s=="number","internal-error",{appName:e}),a.expirationTime=s),a}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new mn,this.toJSON())}_performRefresh(){return We("not implemented")}}/**
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
 */function wt(n,e){C(typeof n=="string"||typeof n>"u","internal-error",{appName:e})}class $e{constructor(e){var{uid:t,auth:r,stsTokenManager:i}=e,s=Bo(e,["uid","auth","stsTokenManager"]);this.providerId="firebase",this.proactiveRefresh=new ng(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=t,this.auth=r,this.stsTokenManager=i,this.accessToken=i.accessToken,this.displayName=s.displayName||null,this.email=s.email||null,this.emailVerified=s.emailVerified||!1,this.phoneNumber=s.phoneNumber||null,this.photoURL=s.photoURL||null,this.isAnonymous=s.isAnonymous||!1,this.tenantId=s.tenantId||null,this.providerData=s.providerData?[...s.providerData]:[],this.metadata=new go(s.createdAt||void 0,s.lastLoginAt||void 0)}async getIdToken(e){const t=await dt(this,this.stsTokenManager.getToken(this.auth,e));return C(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return $l(this,e)}reload(){return Hl(this)}_assign(e){this!==e&&(C(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>Object.assign({},t)),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new $e(Object.assign(Object.assign({},this),{auth:e,stsTokenManager:this.stsTokenManager._clone()}));return t.metadata._copy(this.metadata),t}_onReload(e){C(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let r=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),r=!0),t&&await Er(this),await this.auth._persistUserIfCurrent(this),r&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(re(this.auth.app))return Promise.reject(ge(this.auth));const e=await this.getIdToken();return await dt(this,Xm(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return Object.assign(Object.assign({uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>Object.assign({},e)),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId},this.metadata.toJSON()),{apiKey:this.auth.config.apiKey,appName:this.auth.name})}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){var r,i,s,a,c,l,d,p;const g=(r=t.displayName)!==null&&r!==void 0?r:void 0,v=(i=t.email)!==null&&i!==void 0?i:void 0,P=(s=t.phoneNumber)!==null&&s!==void 0?s:void 0,k=(a=t.photoURL)!==null&&a!==void 0?a:void 0,L=(c=t.tenantId)!==null&&c!==void 0?c:void 0,D=(l=t._redirectEventId)!==null&&l!==void 0?l:void 0,$=(d=t.createdAt)!==null&&d!==void 0?d:void 0,q=(p=t.lastLoginAt)!==null&&p!==void 0?p:void 0,{uid:H,emailVerified:ne,isAnonymous:Ue,providerData:ae,stsTokenManager:E}=t;C(H&&E,e,"internal-error");const m=mn.fromJSON(this.name,E);C(typeof H=="string",e,"internal-error"),wt(g,e.name),wt(v,e.name),C(typeof ne=="boolean",e,"internal-error"),C(typeof Ue=="boolean",e,"internal-error"),wt(P,e.name),wt(k,e.name),wt(L,e.name),wt(D,e.name),wt($,e.name),wt(q,e.name);const y=new $e({uid:H,auth:e,email:v,emailVerified:ne,displayName:g,isAnonymous:Ue,photoURL:k,phoneNumber:P,tenantId:L,stsTokenManager:m,createdAt:$,lastLoginAt:q});return ae&&Array.isArray(ae)&&(y.providerData=ae.map(I=>Object.assign({},I))),D&&(y._redirectEventId=D),y}static async _fromIdTokenResponse(e,t,r=!1){const i=new mn;i.updateFromServerResponse(t);const s=new $e({uid:t.localId,auth:e,stsTokenManager:i,isAnonymous:r});return await Er(s),s}static async _fromGetAccountInfoResponse(e,t,r){const i=t.users[0];C(i.localId!==void 0,"internal-error");const s=i.providerUserInfo!==void 0?zl(i.providerUserInfo):[],a=!(i.email&&i.passwordHash)&&!(s!=null&&s.length),c=new mn;c.updateFromIdToken(r);const l=new $e({uid:i.localId,auth:e,stsTokenManager:c,isAnonymous:a}),d={uid:i.localId,displayName:i.displayName||null,photoURL:i.photoUrl||null,email:i.email||null,emailVerified:i.emailVerified||!1,phoneNumber:i.phoneNumber||null,tenantId:i.tenantId||null,providerData:s,metadata:new go(i.createdAt,i.lastLoginAt),isAnonymous:!(i.email&&i.passwordHash)&&!(s!=null&&s.length)};return Object.assign(l,d),l}}/**
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
 */const iu=new Map;function ot(n){ht(n instanceof Function,"Expected a class definition");let e=iu.get(n);return e?(ht(e instanceof n,"Instance stored in cache mismatched with class"),e):(e=new n,iu.set(n,e),e)}/**
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
 */class Wl{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}Wl.type="NONE";const _o=Wl;/**
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
 */function _i(n,e,t){return`firebase:${n}:${e}:${t}`}class gn{constructor(e,t,r){this.persistence=e,this.auth=t,this.userKey=r;const{config:i,name:s}=this.auth;this.fullUserKey=_i(this.userKey,i.apiKey,s),this.fullPersistenceKey=_i("persistence",i.apiKey,s),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e=="string"){const t=await bi(this.auth,{idToken:e}).catch(()=>{});return t?$e._fromGetAccountInfoResponse(this.auth,t,e):null}return $e._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,r="authUser"){if(!t.length)return new gn(ot(_o),e,r);const i=(await Promise.all(t.map(async d=>{if(await d._isAvailable())return d}))).filter(d=>d);let s=i[0]||ot(_o);const a=_i(r,e.config.apiKey,e.name);let c=null;for(const d of t)try{const p=await d._get(a);if(p){let g;if(typeof p=="string"){const v=await bi(e,{idToken:p}).catch(()=>{});if(!v)break;g=await $e._fromGetAccountInfoResponse(e,v,p)}else g=$e._fromJSON(e,p);d!==s&&(c=g),s=d;break}}catch{}const l=i.filter(d=>d._shouldAllowMigration);return!s._shouldAllowMigration||!l.length?new gn(s,e,r):(s=l[0],c&&await s._set(a,c.toJSON()),await Promise.all(t.map(async d=>{if(d!==s)try{await d._remove(a)}catch{}})),new gn(s,e,r))}}/**
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
 */function su(n){const e=n.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(Yl(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(Gl(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(Xl(e))return"Blackberry";if(Zl(e))return"Webos";if(Kl(e))return"Safari";if((e.includes("chrome/")||Ql(e))&&!e.includes("edge/"))return"Chrome";if(Jl(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,r=n.match(t);if((r==null?void 0:r.length)===2)return r[1]}return"Other"}function Gl(n=be()){return/firefox\//i.test(n)}function Kl(n=be()){const e=n.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function Ql(n=be()){return/crios\//i.test(n)}function Yl(n=be()){return/iemobile/i.test(n)}function Jl(n=be()){return/android/i.test(n)}function Xl(n=be()){return/blackberry/i.test(n)}function Zl(n=be()){return/webos/i.test(n)}function zo(n=be()){return/iphone|ipad|ipod/i.test(n)||/macintosh/i.test(n)&&/mobile/i.test(n)}function og(n=be()){var e;return zo(n)&&!!(!((e=window.navigator)===null||e===void 0)&&e.standalone)}function ag(){return mp()&&document.documentMode===10}function eh(n=be()){return zo(n)||Jl(n)||Zl(n)||Xl(n)||/windows phone/i.test(n)||Yl(n)}/**
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
 */function th(n,e=[]){let t;switch(n){case"Browser":t=su(be());break;case"Worker":t=`${su(be())}-${n}`;break;default:t=n}const r=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${bn}/${r}`}/**
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
 */class cg{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const r=s=>new Promise((a,c)=>{try{const l=e(s);a(l)}catch(l){c(l)}});r.onAbort=t,this.queue.push(r);const i=this.queue.length-1;return()=>{this.queue[i]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const r of this.queue)await r(e),r.onAbort&&t.push(r.onAbort)}catch(r){t.reverse();for(const i of t)try{i()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:r==null?void 0:r.message})}}}/**
 * @license
 * Copyright 2023 Google LLC
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
 */async function ug(n,e={}){return te(n,"GET","/v2/passwordPolicy",ee(n,e))}/**
 * @license
 * Copyright 2023 Google LLC
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
 */const lg=6;class hg{constructor(e){var t,r,i,s;const a=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=(t=a.minPasswordLength)!==null&&t!==void 0?t:lg,a.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=a.maxPasswordLength),a.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=a.containsLowercaseCharacter),a.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=a.containsUppercaseCharacter),a.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=a.containsNumericCharacter),a.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=a.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=(i=(r=e.allowedNonAlphanumericCharacters)===null||r===void 0?void 0:r.join(""))!==null&&i!==void 0?i:"",this.forceUpgradeOnSignin=(s=e.forceUpgradeOnSignin)!==null&&s!==void 0?s:!1,this.schemaVersion=e.schemaVersion}validatePassword(e){var t,r,i,s,a,c;const l={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,l),this.validatePasswordCharacterOptions(e,l),l.isValid&&(l.isValid=(t=l.meetsMinPasswordLength)!==null&&t!==void 0?t:!0),l.isValid&&(l.isValid=(r=l.meetsMaxPasswordLength)!==null&&r!==void 0?r:!0),l.isValid&&(l.isValid=(i=l.containsLowercaseLetter)!==null&&i!==void 0?i:!0),l.isValid&&(l.isValid=(s=l.containsUppercaseLetter)!==null&&s!==void 0?s:!0),l.isValid&&(l.isValid=(a=l.containsNumericCharacter)!==null&&a!==void 0?a:!0),l.isValid&&(l.isValid=(c=l.containsNonAlphanumericCharacter)!==null&&c!==void 0?c:!0),l}validatePasswordLengthOptions(e,t){const r=this.customStrengthOptions.minPasswordLength,i=this.customStrengthOptions.maxPasswordLength;r&&(t.meetsMinPasswordLength=e.length>=r),i&&(t.meetsMaxPasswordLength=e.length<=i)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let r;for(let i=0;i<e.length;i++)r=e.charAt(i),this.updatePasswordCharacterOptionsStatuses(t,r>="a"&&r<="z",r>="A"&&r<="Z",r>="0"&&r<="9",this.allowedNonAlphanumericCharacters.includes(r))}updatePasswordCharacterOptionsStatuses(e,t,r,i,s){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=r)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=i)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=s))}}/**
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
 */class dg{constructor(e,t,r,i){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=r,this.config=i,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new ou(this),this.idTokenSubscription=new ou(this),this.beforeStateQueue=new cg(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=xl,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=i.sdkClientVersion,this._persistenceManagerAvailable=new Promise(s=>this._resolvePersistenceManagerAvailable=s)}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=ot(t)),this._initializationPromise=this.queue(async()=>{var r,i,s;if(!this._deleted&&(this.persistenceManager=await gn.create(this,e),(r=this._resolvePersistenceManagerAvailable)===null||r===void 0||r.call(this),!this._deleted)){if(!((i=this._popupRedirectResolver)===null||i===void 0)&&i._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=((s=this.currentUser)===null||s===void 0?void 0:s.uid)||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await bi(this,{idToken:e}),r=await $e._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(r)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var t;if(re(this.app)){const a=this.app.settings.authIdToken;return a?new Promise(c=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(a).then(c,c))}):this.directlySetCurrentUser(null)}const r=await this.assertedPersistence.getCurrentUser();let i=r,s=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const a=(t=this.redirectUser)===null||t===void 0?void 0:t._redirectEventId,c=i==null?void 0:i._redirectEventId,l=await this.tryRedirectSignIn(e);(!a||a===c)&&(l!=null&&l.user)&&(i=l.user,s=!0)}if(!i)return this.directlySetCurrentUser(null);if(!i._redirectEventId){if(s)try{await this.beforeStateQueue.runMiddleware(i)}catch(a){i=r,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(a))}return i?this.reloadAndSetCurrentUserOrClear(i):this.directlySetCurrentUser(null)}return C(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===i._redirectEventId?this.directlySetCurrentUser(i):this.reloadAndSetCurrentUserOrClear(i)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await Er(e)}catch(t){if((t==null?void 0:t.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=zm()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(re(this.app))return Promise.reject(ge(this));const t=e?x(e):null;return t&&C(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&C(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return re(this.app)?Promise.reject(ge(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return re(this.app)?Promise.reject(ge(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(ot(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await ug(this),t=new hg(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new Dr("auth","Firebase",e())}onAuthStateChanged(e,t,r){return this.registerStateListener(this.authStateSubscription,e,t,r)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,r){return this.registerStateListener(this.idTokenSubscription,e,t,r)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const r=this.onAuthStateChanged(()=>{r(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),r={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(r.tenantId=this.tenantId),await sg(this,r)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)===null||e===void 0?void 0:e.toJSON()}}async _setRedirectUser(e,t){const r=await this.getOrInitRedirectPersistenceManager(t);return e===null?r.removeCurrentUser():r.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&ot(e)||this._popupRedirectResolver;C(t,this,"argument-error"),this.redirectPersistenceManager=await gn.create(this,[ot(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,r;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)===null||t===void 0?void 0:t._redirectEventId)===e?this._currentUser:((r=this.redirectUser)===null||r===void 0?void 0:r._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var e,t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const r=(t=(e=this.currentUser)===null||e===void 0?void 0:e.uid)!==null&&t!==void 0?t:null;this.lastNotifiedUid!==r&&(this.lastNotifiedUid=r,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,r,i){if(this._deleted)return()=>{};const s=typeof t=="function"?t:t.next.bind(t);let a=!1;const c=this._isInitialized?Promise.resolve():this._initializationPromise;if(C(c,this,"internal-error"),c.then(()=>{a||s(this.currentUser)}),typeof t=="function"){const l=e.addObserver(t,r,i);return()=>{a=!0,l()}}else{const l=e.addObserver(t);return()=>{a=!0,l()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return C(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=th(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var e;const t={"X-Client-Version":this.clientVersion};this.app.options.appId&&(t["X-Firebase-gmpid"]=this.app.options.appId);const r=await((e=this.heartbeatServiceProvider.getImmediate({optional:!0}))===null||e===void 0?void 0:e.getHeartbeatsHeader());r&&(t["X-Firebase-Client"]=r);const i=await this._getAppCheckToken();return i&&(t["X-Firebase-AppCheck"]=i),t}async _getAppCheckToken(){var e;if(re(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const t=await((e=this.appCheckServiceProvider.getImmediate({optional:!0}))===null||e===void 0?void 0:e.getToken());return t!=null&&t.error&&$m(`Error while retrieving App Check token: ${t.error}`),t==null?void 0:t.token}}function oe(n){return x(n)}class ou{constructor(e){this.auth=e,this.observer=null,this.addObserver=wp(t=>this.observer=t)}get next(){return C(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
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
 */let Vr={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function fg(n){Vr=n}function Wo(n){return Vr.loadJS(n)}function pg(){return Vr.recaptchaV2Script}function mg(){return Vr.recaptchaEnterpriseScript}function gg(){return Vr.gapiScript}function nh(n){return`__${n}${Math.floor(Math.random()*1e6)}`}/**
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
 */const _g=500,yg=6e4,ui=1e12;class vg{constructor(e){this.auth=e,this.counter=ui,this._widgets=new Map}render(e,t){const r=this.counter;return this._widgets.set(r,new Tg(e,this.auth.name,t||{})),this.counter++,r}reset(e){var t;const r=e||ui;(t=this._widgets.get(r))===null||t===void 0||t.delete(),this._widgets.delete(r)}getResponse(e){var t;const r=e||ui;return((t=this._widgets.get(r))===null||t===void 0?void 0:t.getResponse())||""}async execute(e){var t;const r=e||ui;return(t=this._widgets.get(r))===null||t===void 0||t.execute(),""}}class Ig{constructor(){this.enterprise=new Eg}ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}}class Eg{ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}}class Tg{constructor(e,t,r){this.params=r,this.timerId=null,this.deleted=!1,this.responseToken=null,this.clickHandler=()=>{this.execute()};const i=typeof e=="string"?document.getElementById(e):e;C(i,"argument-error",{appName:t}),this.container=i,this.isVisible=this.params.size!=="invisible",this.isVisible?this.execute():this.container.addEventListener("click",this.clickHandler)}getResponse(){return this.checkIfDeleted(),this.responseToken}delete(){this.checkIfDeleted(),this.deleted=!0,this.timerId&&(clearTimeout(this.timerId),this.timerId=null),this.container.removeEventListener("click",this.clickHandler)}execute(){this.checkIfDeleted(),!this.timerId&&(this.timerId=window.setTimeout(()=>{this.responseToken=wg(50);const{callback:e,"expired-callback":t}=this.params;if(e)try{e(this.responseToken)}catch{}this.timerId=window.setTimeout(()=>{if(this.timerId=null,this.responseToken=null,t)try{t()}catch{}this.isVisible&&this.execute()},yg)},_g))}checkIfDeleted(){if(this.deleted)throw new Error("reCAPTCHA mock was already deleted!")}}function wg(n){const e=[],t="1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";for(let r=0;r<n;r++)e.push(t.charAt(Math.floor(Math.random()*t.length)));return e.join("")}const Ag="recaptcha-enterprise",hr="NO_RECAPTCHA";class rh{constructor(e){this.type=Ag,this.auth=oe(e)}async verify(e="verify",t=!1){async function r(s){if(!t){if(s.tenantId==null&&s._agentRecaptchaConfig!=null)return s._agentRecaptchaConfig.siteKey;if(s.tenantId!=null&&s._tenantRecaptchaConfigs[s.tenantId]!==void 0)return s._tenantRecaptchaConfigs[s.tenantId].siteKey}return new Promise(async(a,c)=>{jl(s,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}).then(l=>{if(l.recaptchaKey===void 0)c(new Error("recaptcha Enterprise site key undefined"));else{const d=new ql(l);return s.tenantId==null?s._agentRecaptchaConfig=d:s._tenantRecaptchaConfigs[s.tenantId]=d,a(d.siteKey)}}).catch(l=>{c(l)})})}function i(s,a,c){const l=window.grecaptcha;nu(l)?l.enterprise.ready(()=>{l.enterprise.execute(s,{action:e}).then(d=>{a(d)}).catch(()=>{a(hr)})}):c(Error("No reCAPTCHA enterprise script loaded."))}return this.auth.settings.appVerificationDisabledForTesting?new Ig().execute("siteKey",{action:"verify"}):new Promise((s,a)=>{r(this.auth).then(c=>{if(!t&&nu(window.grecaptcha))i(c,s,a);else{if(typeof window>"u"){a(new Error("RecaptchaVerifier is only supported in browser"));return}let l=mg();l.length!==0&&(l+=c),Wo(l).then(()=>{i(c,s,a)}).catch(d=>{a(d)})}}).catch(c=>{a(c)})})}}async function tr(n,e,t,r=!1,i=!1){const s=new rh(n);let a;if(i)a=hr;else try{a=await s.verify(t)}catch{a=await s.verify(t,!0)}const c=Object.assign({},e);if(t==="mfaSmsEnrollment"||t==="mfaSmsSignIn"){if("phoneEnrollmentInfo"in c){const l=c.phoneEnrollmentInfo.phoneNumber,d=c.phoneEnrollmentInfo.recaptchaToken;Object.assign(c,{phoneEnrollmentInfo:{phoneNumber:l,recaptchaToken:d,captchaResponse:a,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}else if("phoneSignInInfo"in c){const l=c.phoneSignInInfo.recaptchaToken;Object.assign(c,{phoneSignInInfo:{recaptchaToken:l,captchaResponse:a,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}return c}return r?Object.assign(c,{captchaResp:a}):Object.assign(c,{captchaResponse:a}),Object.assign(c,{clientType:"CLIENT_TYPE_WEB"}),Object.assign(c,{recaptchaVersion:"RECAPTCHA_ENTERPRISE"}),c}async function bt(n,e,t,r,i){var s,a;if(i==="EMAIL_PASSWORD_PROVIDER")if(!((s=n._getRecaptchaConfig())===null||s===void 0)&&s.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")){const c=await tr(n,e,t,t==="getOobCode");return r(n,c)}else return r(n,e).catch(async c=>{if(c.code==="auth/missing-recaptcha-token"){console.log(`${t} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`);const l=await tr(n,e,t,t==="getOobCode");return r(n,l)}else return Promise.reject(c)});else if(i==="PHONE_PROVIDER")if(!((a=n._getRecaptchaConfig())===null||a===void 0)&&a.isProviderEnabled("PHONE_PROVIDER")){const c=await tr(n,e,t);return r(n,c).catch(async l=>{var d;if(((d=n._getRecaptchaConfig())===null||d===void 0?void 0:d.getProviderEnforcementState("PHONE_PROVIDER"))==="AUDIT"&&(l.code==="auth/missing-recaptcha-token"||l.code==="auth/invalid-app-credential")){console.log(`Failed to verify with reCAPTCHA Enterprise. Automatically triggering the reCAPTCHA v2 flow to complete the ${t} flow.`);const p=await tr(n,e,t,!1,!0);return r(n,p)}return Promise.reject(l)})}else{const c=await tr(n,e,t,!1,!0);return r(n,c)}else return Promise.reject(i+" provider is not supported.")}async function ih(n){const e=oe(n),t=await jl(e,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}),r=new ql(t);e.tenantId==null?e._agentRecaptchaConfig=r:e._tenantRecaptchaConfigs[e.tenantId]=r,r.isAnyProviderEnabled()&&new rh(e).verify()}/**
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
 */function sh(n,e){const t=Uo(n,"auth");if(t.isInitialized()){const i=t.getImmediate(),s=t.getOptions();if(Zt(s,e??{}))return i;Le(i,"already-initialized")}return t.initialize({options:e})}function Rg(n,e){const t=(e==null?void 0:e.persistence)||[],r=(Array.isArray(t)?t:[t]).map(ot);e!=null&&e.errorMap&&n._updateErrorMap(e.errorMap),n._initializeWithPersistence(r,e==null?void 0:e.popupRedirectResolver)}function oh(n,e,t){const r=oe(n);C(/^https?:\/\//.test(e),r,"invalid-emulator-scheme");const i=!!(t!=null&&t.disableWarnings),s=ah(e),{host:a,port:c}=Sg(e),l=c===null?"":`:${c}`,d={url:`${s}//${a}${l}/`},p=Object.freeze({host:a,port:c,protocol:s.replace(":",""),options:Object.freeze({disableWarnings:i})});if(!r._canInitEmulator){C(r.config.emulator&&r.emulatorConfig,r,"emulator-config-failed"),C(Zt(d,r.config.emulator)&&Zt(p,r.emulatorConfig),r,"emulator-config-failed");return}r.config.emulator=d,r.emulatorConfig=p,r.settings.appVerificationDisabledForTesting=!0,Sn(a)?(bl(`${s}//${a}${l}`),Cl("Auth",!0)):i||Pg()}function ah(n){const e=n.indexOf(":");return e<0?"":n.substr(0,e+1)}function Sg(n){const e=ah(n),t=/(\/\/)?([^?#/]+)/.exec(n.substr(e.length));if(!t)return{host:"",port:null};const r=t[2].split("@").pop()||"",i=/^(\[[^\]]+\])(:|$)/.exec(r);if(i){const s=i[1];return{host:s,port:au(r.substr(s.length+1))}}else{const[s,a]=r.split(":");return{host:s,port:au(a)}}}function au(n){if(!n)return null;const e=Number(n);return isNaN(e)?null:e}function Pg(){function n(){const e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console<"u"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",n):n())}/**
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
 */class kn{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return We("not implemented")}_getIdTokenResponse(e){return We("not implemented")}_linkToIdToken(e,t){return We("not implemented")}_getReauthenticationResolver(e){return We("not implemented")}}/**
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
 */async function ch(n,e){return te(n,"POST","/v1/accounts:resetPassword",ee(n,e))}async function bg(n,e){return te(n,"POST","/v1/accounts:update",e)}async function Cg(n,e){return te(n,"POST","/v1/accounts:signUp",e)}async function kg(n,e){return te(n,"POST","/v1/accounts:update",ee(n,e))}/**
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
 */async function Ng(n,e){return _t(n,"POST","/v1/accounts:signInWithPassword",ee(n,e))}async function Wi(n,e){return te(n,"POST","/v1/accounts:sendOobCode",ee(n,e))}async function Dg(n,e){return Wi(n,e)}async function Og(n,e){return Wi(n,e)}async function Vg(n,e){return Wi(n,e)}async function Lg(n,e){return Wi(n,e)}/**
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
 */async function Mg(n,e){return _t(n,"POST","/v1/accounts:signInWithEmailLink",ee(n,e))}async function xg(n,e){return _t(n,"POST","/v1/accounts:signInWithEmailLink",ee(n,e))}/**
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
 */class In extends kn{constructor(e,t,r,i=null){super("password",r),this._email=e,this._password=t,this._tenantId=i}static _fromEmailAndPassword(e,t){return new In(e,t,"password")}static _fromEmailAndCode(e,t,r=null){return new In(e,t,"emailLink",r)}toJSON(){return{email:this._email,password:this._password,signInMethod:this.signInMethod,tenantId:this._tenantId}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e;if(t!=null&&t.email&&(t!=null&&t.password)){if(t.signInMethod==="password")return this._fromEmailAndPassword(t.email,t.password);if(t.signInMethod==="emailLink")return this._fromEmailAndCode(t.email,t.password,t.tenantId)}return null}async _getIdTokenResponse(e){switch(this.signInMethod){case"password":const t={returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return bt(e,t,"signInWithPassword",Ng,"EMAIL_PASSWORD_PROVIDER");case"emailLink":return Mg(e,{email:this._email,oobCode:this._password});default:Le(e,"internal-error")}}async _linkToIdToken(e,t){switch(this.signInMethod){case"password":const r={idToken:t,returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return bt(e,r,"signUpPassword",Cg,"EMAIL_PASSWORD_PROVIDER");case"emailLink":return xg(e,{idToken:t,email:this._email,oobCode:this._password});default:Le(e,"internal-error")}}_getReauthenticationResolver(e){return this._getIdTokenResponse(e)}}/**
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
 */async function ct(n,e){return _t(n,"POST","/v1/accounts:signInWithIdp",ee(n,e))}/**
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
 */const Fg="http://localhost";class Je extends kn{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const t=new Je(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):Le("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:r,signInMethod:i}=t,s=Bo(t,["providerId","signInMethod"]);if(!r||!i)return null;const a=new Je(r,i);return a.idToken=s.idToken||void 0,a.accessToken=s.accessToken||void 0,a.secret=s.secret,a.nonce=s.nonce,a.pendingToken=s.pendingToken||null,a}_getIdTokenResponse(e){const t=this.buildRequest();return ct(e,t)}_linkToIdToken(e,t){const r=this.buildRequest();return r.idToken=t,ct(e,r)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,ct(e,t)}buildRequest(){const e={requestUri:Fg,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=Pn(t)}return e}}/**
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
 */async function cu(n,e){return te(n,"POST","/v1/accounts:sendVerificationCode",ee(n,e))}async function Ug(n,e){return _t(n,"POST","/v1/accounts:signInWithPhoneNumber",ee(n,e))}async function Bg(n,e){const t=await _t(n,"POST","/v1/accounts:signInWithPhoneNumber",ee(n,e));if(t.temporaryProof)throw ir(n,"account-exists-with-different-credential",t);return t}const qg={USER_NOT_FOUND:"user-not-found"};async function jg(n,e){const t=Object.assign(Object.assign({},e),{operation:"REAUTH"});return _t(n,"POST","/v1/accounts:signInWithPhoneNumber",ee(n,t),qg)}/**
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
 */class Ct extends kn{constructor(e){super("phone","phone"),this.params=e}static _fromVerification(e,t){return new Ct({verificationId:e,verificationCode:t})}static _fromTokenResponse(e,t){return new Ct({phoneNumber:e,temporaryProof:t})}_getIdTokenResponse(e){return Ug(e,this._makeVerificationRequest())}_linkToIdToken(e,t){return Bg(e,Object.assign({idToken:t},this._makeVerificationRequest()))}_getReauthenticationResolver(e){return jg(e,this._makeVerificationRequest())}_makeVerificationRequest(){const{temporaryProof:e,phoneNumber:t,verificationId:r,verificationCode:i}=this.params;return e&&t?{temporaryProof:e,phoneNumber:t}:{sessionInfo:r,code:i}}toJSON(){const e={providerId:this.providerId};return this.params.phoneNumber&&(e.phoneNumber=this.params.phoneNumber),this.params.temporaryProof&&(e.temporaryProof=this.params.temporaryProof),this.params.verificationCode&&(e.verificationCode=this.params.verificationCode),this.params.verificationId&&(e.verificationId=this.params.verificationId),e}static fromJSON(e){typeof e=="string"&&(e=JSON.parse(e));const{verificationId:t,verificationCode:r,phoneNumber:i,temporaryProof:s}=e;return!r&&!t&&!i&&!s?null:new Ct({verificationId:t,verificationCode:r,phoneNumber:i,temporaryProof:s})}}/**
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
 */function $g(n){switch(n){case"recoverEmail":return"RECOVER_EMAIL";case"resetPassword":return"PASSWORD_RESET";case"signIn":return"EMAIL_SIGNIN";case"verifyEmail":return"VERIFY_EMAIL";case"verifyAndChangeEmail":return"VERIFY_AND_CHANGE_EMAIL";case"revertSecondFactorAddition":return"REVERT_SECOND_FACTOR_ADDITION";default:return null}}function Hg(n){const e=nr(rr(n)).link,t=e?nr(rr(e)).deep_link_id:null,r=nr(rr(n)).deep_link_id;return(r?nr(rr(r)).link:null)||r||t||e||n}class Nn{constructor(e){var t,r,i,s,a,c;const l=nr(rr(e)),d=(t=l.apiKey)!==null&&t!==void 0?t:null,p=(r=l.oobCode)!==null&&r!==void 0?r:null,g=$g((i=l.mode)!==null&&i!==void 0?i:null);C(d&&p&&g,"argument-error"),this.apiKey=d,this.operation=g,this.code=p,this.continueUrl=(s=l.continueUrl)!==null&&s!==void 0?s:null,this.languageCode=(a=l.lang)!==null&&a!==void 0?a:null,this.tenantId=(c=l.tenantId)!==null&&c!==void 0?c:null}static parseLink(e){const t=Hg(e);try{return new Nn(t)}catch{return null}}}function zg(n){return Nn.parseLink(n)}/**
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
 */class Ut{constructor(){this.providerId=Ut.PROVIDER_ID}static credential(e,t){return In._fromEmailAndPassword(e,t)}static credentialWithLink(e,t){const r=Nn.parseLink(t);return C(r,"argument-error"),In._fromEmailAndCode(e,r.code,r.tenantId)}}Ut.PROVIDER_ID="password";Ut.EMAIL_PASSWORD_SIGN_IN_METHOD="password";Ut.EMAIL_LINK_SIGN_IN_METHOD="emailLink";/**
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
 */class yt{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
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
 */class Dn extends yt{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}class dr extends Dn{static credentialFromJSON(e){const t=typeof e=="string"?JSON.parse(e):e;return C("providerId"in t&&"signInMethod"in t,"argument-error"),Je._fromParams(t)}credential(e){return this._credential(Object.assign(Object.assign({},e),{nonce:e.rawNonce}))}_credential(e){return C(e.idToken||e.accessToken,"argument-error"),Je._fromParams(Object.assign(Object.assign({},e),{providerId:this.providerId,signInMethod:this.providerId}))}static credentialFromResult(e){return dr.oauthCredentialFromTaggedObject(e)}static credentialFromError(e){return dr.oauthCredentialFromTaggedObject(e.customData||{})}static oauthCredentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:r,oauthTokenSecret:i,pendingToken:s,nonce:a,providerId:c}=e;if(!r&&!i&&!t&&!s||!c)return null;try{return new dr(c)._credential({idToken:t,accessToken:r,nonce:a,pendingToken:s})}catch{return null}}}/**
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
 */class nt extends Dn{constructor(){super("facebook.com")}static credential(e){return Je._fromParams({providerId:nt.PROVIDER_ID,signInMethod:nt.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return nt.credentialFromTaggedObject(e)}static credentialFromError(e){return nt.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return nt.credential(e.oauthAccessToken)}catch{return null}}}nt.FACEBOOK_SIGN_IN_METHOD="facebook.com";nt.PROVIDER_ID="facebook.com";/**
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
 */class rt extends Dn{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return Je._fromParams({providerId:rt.PROVIDER_ID,signInMethod:rt.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return rt.credentialFromTaggedObject(e)}static credentialFromError(e){return rt.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:r}=e;if(!t&&!r)return null;try{return rt.credential(t,r)}catch{return null}}}rt.GOOGLE_SIGN_IN_METHOD="google.com";rt.PROVIDER_ID="google.com";/**
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
 */class it extends Dn{constructor(){super("github.com")}static credential(e){return Je._fromParams({providerId:it.PROVIDER_ID,signInMethod:it.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return it.credentialFromTaggedObject(e)}static credentialFromError(e){return it.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return it.credential(e.oauthAccessToken)}catch{return null}}}it.GITHUB_SIGN_IN_METHOD="github.com";it.PROVIDER_ID="github.com";/**
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
 */const Wg="http://localhost";class Tr extends kn{constructor(e,t){super(e,e),this.pendingToken=t}_getIdTokenResponse(e){const t=this.buildRequest();return ct(e,t)}_linkToIdToken(e,t){const r=this.buildRequest();return r.idToken=t,ct(e,r)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,ct(e,t)}toJSON(){return{signInMethod:this.signInMethod,providerId:this.providerId,pendingToken:this.pendingToken}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:r,signInMethod:i,pendingToken:s}=t;return!r||!i||!s||r!==i?null:new Tr(r,s)}static _create(e,t){return new Tr(e,t)}buildRequest(){return{requestUri:Wg,returnSecureToken:!0,pendingToken:this.pendingToken}}}/**
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
 */const Gg="saml.";class Ci extends yt{constructor(e){C(e.startsWith(Gg),"argument-error"),super(e)}static credentialFromResult(e){return Ci.samlCredentialFromTaggedObject(e)}static credentialFromError(e){return Ci.samlCredentialFromTaggedObject(e.customData||{})}static credentialFromJSON(e){const t=Tr.fromJSON(e);return C(t,"argument-error"),t}static samlCredentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{pendingToken:t,providerId:r}=e;if(!t||!r)return null;try{return Tr._create(r,t)}catch{return null}}}/**
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
 */class st extends Dn{constructor(){super("twitter.com")}static credential(e,t){return Je._fromParams({providerId:st.PROVIDER_ID,signInMethod:st.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return st.credentialFromTaggedObject(e)}static credentialFromError(e){return st.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthAccessToken:t,oauthTokenSecret:r}=e;if(!t||!r)return null;try{return st.credential(t,r)}catch{return null}}}st.TWITTER_SIGN_IN_METHOD="twitter.com";st.PROVIDER_ID="twitter.com";/**
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
 */async function uh(n,e){return _t(n,"POST","/v1/accounts:signUp",ee(n,e))}/**
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
 */class qe{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,r,i=!1){const s=await $e._fromIdTokenResponse(e,r,i),a=uu(r);return new qe({user:s,providerId:a,_tokenResponse:r,operationType:t})}static async _forOperation(e,t,r){await e._updateTokensIfNecessary(r,!0);const i=uu(r);return new qe({user:e,providerId:i,_tokenResponse:r,operationType:t})}}function uu(n){return n.providerId?n.providerId:"phoneNumber"in n?"phone":null}/**
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
 */async function Kg(n){var e;if(re(n.app))return Promise.reject(ge(n));const t=oe(n);if(await t._initializationPromise,!((e=t.currentUser)===null||e===void 0)&&e.isAnonymous)return new qe({user:t.currentUser,providerId:null,operationType:"signIn"});const r=await uh(t,{returnSecureToken:!0}),i=await qe._fromIdTokenResponse(t,"signIn",r,!0);return await t._updateCurrentUser(i.user),i}/**
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
 */class ki extends gt{constructor(e,t,r,i){var s;super(t.code,t.message),this.operationType=r,this.user=i,Object.setPrototypeOf(this,ki.prototype),this.customData={appName:e.name,tenantId:(s=e.tenantId)!==null&&s!==void 0?s:void 0,_serverResponse:t.customData._serverResponse,operationType:r}}static _fromErrorAndOperation(e,t,r,i){return new ki(e,t,r,i)}}function lh(n,e,t,r){return(e==="reauthenticate"?t._getReauthenticationResolver(n):t._getIdTokenResponse(n)).catch(s=>{throw s.code==="auth/multi-factor-auth-required"?ki._fromErrorAndOperation(n,s,e,r):s})}/**
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
 */function hh(n){return new Set(n.map(({providerId:e})=>e).filter(e=>!!e))}/**
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
 */async function Qg(n,e){const t=x(n);await Gi(!0,t,e);const{providerUserInfo:r}=await Zm(t.auth,{idToken:await t.getIdToken(),deleteProvider:[e]}),i=hh(r||[]);return t.providerData=t.providerData.filter(s=>i.has(s.providerId)),i.has("phone")||(t.phoneNumber=null),await t.auth._persistUserIfCurrent(t),t}async function Go(n,e,t=!1){const r=await dt(n,e._linkToIdToken(n.auth,await n.getIdToken()),t);return qe._forOperation(n,"link",r)}async function Gi(n,e,t){await Er(e);const r=hh(e.providerData),i=n===!1?"provider-already-linked":"no-such-provider";C(r.has(t)===n,e.auth,i)}/**
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
 */async function dh(n,e,t=!1){const{auth:r}=n;if(re(r.app))return Promise.reject(ge(r));const i="reauthenticate";try{const s=await dt(n,lh(r,i,e,n),t);C(s.idToken,r,"internal-error");const a=zi(s.idToken);C(a,r,"internal-error");const{sub:c}=a;return C(n.uid===c,r,"user-mismatch"),qe._forOperation(n,i,s)}catch(s){throw(s==null?void 0:s.code)==="auth/user-not-found"&&Le(r,"user-mismatch"),s}}/**
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
 */async function fh(n,e,t=!1){if(re(n.app))return Promise.reject(ge(n));const r="signIn",i=await lh(n,r,e),s=await qe._fromIdTokenResponse(n,r,i);return t||await n._updateCurrentUser(s.user),s}async function Ki(n,e){return fh(oe(n),e)}async function ph(n,e){const t=x(n);return await Gi(!1,t,e.providerId),Go(t,e)}async function mh(n,e){return dh(x(n),e)}/**
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
 */async function Yg(n,e){return _t(n,"POST","/v1/accounts:signInWithCustomToken",ee(n,e))}/**
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
 */async function Jg(n,e){if(re(n.app))return Promise.reject(ge(n));const t=oe(n),r=await Yg(t,{token:e,returnSecureToken:!0}),i=await qe._fromIdTokenResponse(t,"signIn",r);return await t._updateCurrentUser(i.user),i}/**
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
 */class Lr{constructor(e,t){this.factorId=e,this.uid=t.mfaEnrollmentId,this.enrollmentTime=new Date(t.enrolledAt).toUTCString(),this.displayName=t.displayName}static _fromServerResponse(e,t){return"phoneInfo"in t?Ko._fromServerResponse(e,t):"totpInfo"in t?Qo._fromServerResponse(e,t):Le(e,"internal-error")}}class Ko extends Lr{constructor(e){super("phone",e),this.phoneNumber=e.phoneInfo}static _fromServerResponse(e,t){return new Ko(t)}}class Qo extends Lr{constructor(e){super("totp",e)}static _fromServerResponse(e,t){return new Qo(t)}}/**
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
 */function Qi(n,e,t){var r;C(((r=t.url)===null||r===void 0?void 0:r.length)>0,n,"invalid-continue-uri"),C(typeof t.dynamicLinkDomain>"u"||t.dynamicLinkDomain.length>0,n,"invalid-dynamic-link-domain"),C(typeof t.linkDomain>"u"||t.linkDomain.length>0,n,"invalid-hosting-link-domain"),e.continueUrl=t.url,e.dynamicLinkDomain=t.dynamicLinkDomain,e.linkDomain=t.linkDomain,e.canHandleCodeInApp=t.handleCodeInApp,t.iOS&&(C(t.iOS.bundleId.length>0,n,"missing-ios-bundle-id"),e.iOSBundleId=t.iOS.bundleId),t.android&&(C(t.android.packageName.length>0,n,"missing-android-pkg-name"),e.androidInstallApp=t.android.installApp,e.androidMinimumVersionCode=t.android.minimumVersion,e.androidPackageName=t.android.packageName)}/**
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
 */async function Yo(n){const e=oe(n);e._getPasswordPolicyInternal()&&await e._updatePasswordPolicy()}async function Xg(n,e,t){const r=oe(n),i={requestType:"PASSWORD_RESET",email:e,clientType:"CLIENT_TYPE_WEB"};t&&Qi(r,i,t),await bt(r,i,"getOobCode",Og,"EMAIL_PASSWORD_PROVIDER")}async function Zg(n,e,t){await ch(x(n),{oobCode:e,newPassword:t}).catch(async r=>{throw r.code==="auth/password-does-not-meet-requirements"&&Yo(n),r})}async function e_(n,e){await kg(x(n),{oobCode:e})}async function gh(n,e){const t=x(n),r=await ch(t,{oobCode:e}),i=r.requestType;switch(C(i,t,"internal-error"),i){case"EMAIL_SIGNIN":break;case"VERIFY_AND_CHANGE_EMAIL":C(r.newEmail,t,"internal-error");break;case"REVERT_SECOND_FACTOR_ADDITION":C(r.mfaInfo,t,"internal-error");default:C(r.email,t,"internal-error")}let s=null;return r.mfaInfo&&(s=Lr._fromServerResponse(oe(t),r.mfaInfo)),{data:{email:(r.requestType==="VERIFY_AND_CHANGE_EMAIL"?r.newEmail:r.email)||null,previousEmail:(r.requestType==="VERIFY_AND_CHANGE_EMAIL"?r.email:r.newEmail)||null,multiFactorInfo:s},operation:i}}async function t_(n,e){const{data:t}=await gh(x(n),e);return t.email}async function n_(n,e,t){if(re(n.app))return Promise.reject(ge(n));const r=oe(n),a=await bt(r,{returnSecureToken:!0,email:e,password:t,clientType:"CLIENT_TYPE_WEB"},"signUpPassword",uh,"EMAIL_PASSWORD_PROVIDER").catch(l=>{throw l.code==="auth/password-does-not-meet-requirements"&&Yo(n),l}),c=await qe._fromIdTokenResponse(r,"signIn",a);return await r._updateCurrentUser(c.user),c}function r_(n,e,t){return re(n.app)?Promise.reject(ge(n)):Ki(x(n),Ut.credential(e,t)).catch(async r=>{throw r.code==="auth/password-does-not-meet-requirements"&&Yo(n),r})}/**
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
 */async function i_(n,e,t){const r=oe(n),i={requestType:"EMAIL_SIGNIN",email:e,clientType:"CLIENT_TYPE_WEB"};function s(a,c){C(c.handleCodeInApp,r,"argument-error"),c&&Qi(r,a,c)}s(i,t),await bt(r,i,"getOobCode",Vg,"EMAIL_PASSWORD_PROVIDER")}function s_(n,e){const t=Nn.parseLink(e);return(t==null?void 0:t.operation)==="EMAIL_SIGNIN"}async function o_(n,e,t){if(re(n.app))return Promise.reject(ge(n));const r=x(n),i=Ut.credentialWithLink(e,t||Ir());return C(i._tenantId===(r.tenantId||null),r,"tenant-id-mismatch"),Ki(r,i)}/**
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
 */async function a_(n,e){return te(n,"POST","/v1/accounts:createAuthUri",ee(n,e))}/**
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
 */async function c_(n,e){const t=$o()?Ir():"http://localhost",r={identifier:e,continueUri:t},{signinMethods:i}=await a_(x(n),r);return i||[]}async function u_(n,e){const t=x(n),i={requestType:"VERIFY_EMAIL",idToken:await n.getIdToken()};e&&Qi(t.auth,i,e);const{email:s}=await Dg(t.auth,i);s!==n.email&&await n.reload()}async function l_(n,e,t){const r=x(n),s={requestType:"VERIFY_AND_CHANGE_EMAIL",idToken:await n.getIdToken(),newEmail:e};t&&Qi(r.auth,s,t);const{email:a}=await Lg(r.auth,s);a!==n.email&&await n.reload()}/**
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
 */async function h_(n,e){return te(n,"POST","/v1/accounts:update",e)}/**
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
 */async function d_(n,{displayName:e,photoURL:t}){if(e===void 0&&t===void 0)return;const r=x(n),s={idToken:await r.getIdToken(),displayName:e,photoUrl:t,returnSecureToken:!0},a=await dt(r,h_(r.auth,s));r.displayName=a.displayName||null,r.photoURL=a.photoUrl||null;const c=r.providerData.find(({providerId:l})=>l==="password");c&&(c.displayName=r.displayName,c.photoURL=r.photoURL),await r._updateTokensIfNecessary(a)}function f_(n,e){const t=x(n);return re(t.auth.app)?Promise.reject(ge(t.auth)):_h(t,e,null)}function p_(n,e){return _h(x(n),null,e)}async function _h(n,e,t){const{auth:r}=n,s={idToken:await n.getIdToken(),returnSecureToken:!0};e&&(s.email=e),t&&(s.password=t);const a=await dt(n,bg(r,s));await n._updateTokensIfNecessary(a,!0)}/**
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
 */function m_(n){var e,t;if(!n)return null;const{providerId:r}=n,i=n.rawUserInfo?JSON.parse(n.rawUserInfo):{},s=n.isNewUser||n.kind==="identitytoolkit#SignupNewUserResponse";if(!r&&(n!=null&&n.idToken)){const a=(t=(e=zi(n.idToken))===null||e===void 0?void 0:e.firebase)===null||t===void 0?void 0:t.sign_in_provider;if(a){const c=a!=="anonymous"&&a!=="custom"?a:null;return new _n(s,c)}}if(!r)return null;switch(r){case"facebook.com":return new g_(s,i);case"github.com":return new __(s,i);case"google.com":return new y_(s,i);case"twitter.com":return new v_(s,i,n.screenName||null);case"custom":case"anonymous":return new _n(s,null);default:return new _n(s,r,i)}}class _n{constructor(e,t,r={}){this.isNewUser=e,this.providerId=t,this.profile=r}}class yh extends _n{constructor(e,t,r,i){super(e,t,r),this.username=i}}class g_ extends _n{constructor(e,t){super(e,"facebook.com",t)}}class __ extends yh{constructor(e,t){super(e,"github.com",t,typeof(t==null?void 0:t.login)=="string"?t==null?void 0:t.login:null)}}class y_ extends _n{constructor(e,t){super(e,"google.com",t)}}class v_ extends yh{constructor(e,t,r){super(e,"twitter.com",t,r)}}function I_(n){const{user:e,_tokenResponse:t}=n;return e.isAnonymous&&!t?{providerId:null,isNewUser:!1,profile:null}:m_(t)}/**
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
 */function E_(n,e){return x(n).setPersistence(e)}function T_(n){return ih(n)}async function w_(n,e){return oe(n).validatePassword(e)}function vh(n,e,t,r){return x(n).onIdTokenChanged(e,t,r)}function Ih(n,e,t){return x(n).beforeAuthStateChanged(e,t)}function A_(n,e,t,r){return x(n).onAuthStateChanged(e,t,r)}function R_(n){x(n).useDeviceLanguage()}function S_(n,e){return x(n).updateCurrentUser(e)}function P_(n){return x(n).signOut()}function b_(n,e){return oe(n).revokeAccessToken(e)}async function C_(n){return x(n).delete()}/**
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
 */class Kt{constructor(e,t,r){this.type=e,this.credential=t,this.user=r}static _fromIdtoken(e,t){return new Kt("enroll",e,t)}static _fromMfaPendingCredential(e){return new Kt("signin",e)}toJSON(){return{multiFactorSession:{[this.type==="enroll"?"idToken":"pendingCredential"]:this.credential}}}static fromJSON(e){var t,r;if(e!=null&&e.multiFactorSession){if(!((t=e.multiFactorSession)===null||t===void 0)&&t.pendingCredential)return Kt._fromMfaPendingCredential(e.multiFactorSession.pendingCredential);if(!((r=e.multiFactorSession)===null||r===void 0)&&r.idToken)return Kt._fromIdtoken(e.multiFactorSession.idToken)}return null}}/**
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
 */class Jo{constructor(e,t,r){this.session=e,this.hints=t,this.signInResolver=r}static _fromError(e,t){const r=oe(e),i=t.customData._serverResponse,s=(i.mfaInfo||[]).map(c=>Lr._fromServerResponse(r,c));C(i.mfaPendingCredential,r,"internal-error");const a=Kt._fromMfaPendingCredential(i.mfaPendingCredential);return new Jo(a,s,async c=>{const l=await c._process(r,a);delete i.mfaInfo,delete i.mfaPendingCredential;const d=Object.assign(Object.assign({},i),{idToken:l.idToken,refreshToken:l.refreshToken});switch(t.operationType){case"signIn":const p=await qe._fromIdTokenResponse(r,t.operationType,d);return await r._updateCurrentUser(p.user),p;case"reauthenticate":return C(t.user,r,"internal-error"),qe._forOperation(t.user,t.operationType,d);default:Le(r,"internal-error")}})}async resolveSignIn(e){const t=e;return this.signInResolver(t)}}function k_(n,e){var t;const r=x(n),i=e;return C(e.customData.operationType,r,"argument-error"),C((t=i.customData._serverResponse)===null||t===void 0?void 0:t.mfaPendingCredential,r,"argument-error"),Jo._fromError(r,i)}/**
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
 */function lu(n,e){return te(n,"POST","/v2/accounts/mfaEnrollment:start",ee(n,e))}function N_(n,e){return te(n,"POST","/v2/accounts/mfaEnrollment:finalize",ee(n,e))}function D_(n,e){return te(n,"POST","/v2/accounts/mfaEnrollment:start",ee(n,e))}function O_(n,e){return te(n,"POST","/v2/accounts/mfaEnrollment:finalize",ee(n,e))}function V_(n,e){return te(n,"POST","/v2/accounts/mfaEnrollment:withdraw",ee(n,e))}class Xo{constructor(e){this.user=e,this.enrolledFactors=[],e._onReload(t=>{t.mfaInfo&&(this.enrolledFactors=t.mfaInfo.map(r=>Lr._fromServerResponse(e.auth,r)))})}static _fromUser(e){return new Xo(e)}async getSession(){return Kt._fromIdtoken(await this.user.getIdToken(),this.user)}async enroll(e,t){const r=e,i=await this.getSession(),s=await dt(this.user,r._process(this.user.auth,i,t));return await this.user._updateTokensIfNecessary(s),this.user.reload()}async unenroll(e){const t=typeof e=="string"?e:e.uid,r=await this.user.getIdToken();try{const i=await dt(this.user,V_(this.user.auth,{idToken:r,mfaEnrollmentId:t}));this.enrolledFactors=this.enrolledFactors.filter(({uid:s})=>s!==t),await this.user._updateTokensIfNecessary(i),await this.user.reload()}catch(i){throw i}}}const Zs=new WeakMap;function L_(n){const e=x(n);return Zs.has(e)||Zs.set(e,Xo._fromUser(e)),Zs.get(e)}const Ni="__sak";/**
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
 */class Eh{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(Ni,"1"),this.storage.removeItem(Ni),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){const t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}/**
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
 */const M_=1e3,x_=10;class Th extends Eh{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=eh(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const t of Object.keys(this.listeners)){const r=this.storage.getItem(t),i=this.localCache[t];r!==i&&e(t,i,r)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((a,c,l)=>{this.notifyListeners(a,l)});return}const r=e.key;t?this.detachListener():this.stopPolling();const i=()=>{const a=this.storage.getItem(r);!t&&this.localCache[r]===a||this.notifyListeners(r,a)},s=this.storage.getItem(r);ag()&&s!==e.newValue&&e.newValue!==e.oldValue?setTimeout(i,x_):i()}notifyListeners(e,t){this.localCache[e]=t;const r=this.listeners[e];if(r)for(const i of Array.from(r))i(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,r)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:r}),!0)})},M_)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){const t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}}Th.type="LOCAL";const wh=Th;/**
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
 */const F_=1e3;function eo(n){var e,t;const r=n.replace(/[\\^$.*+?()[\]{}|]/g,"\\$&"),i=RegExp(`${r}=([^;]+)`);return(t=(e=document.cookie.match(i))===null||e===void 0?void 0:e[1])!==null&&t!==void 0?t:null}function to(n){return`${window.location.protocol==="http:"?"__dev_":"__HOST-"}FIREBASE_${n.split(":")[3]}`}class Ah{constructor(){this.type="COOKIE",this.listenerUnsubscribes=new Map}_getFinalTarget(e){if(typeof window===void 0)return e;const t=new URL(`${window.location.origin}/__cookies__`);return t.searchParams.set("finalTarget",e),t}async _isAvailable(){var e;return typeof isSecureContext=="boolean"&&!isSecureContext||typeof navigator>"u"||typeof document>"u"?!1:(e=navigator.cookieEnabled)!==null&&e!==void 0?e:!0}async _set(e,t){}async _get(e){if(!this._isAvailable())return null;const t=to(e);if(window.cookieStore){const r=await window.cookieStore.get(t);return r==null?void 0:r.value}return eo(t)}async _remove(e){if(!this._isAvailable()||!await this._get(e))return;const r=to(e);document.cookie=`${r}=;Max-Age=34560000;Partitioned;Secure;SameSite=Strict;Path=/;Priority=High`,await fetch("/__cookies__",{method:"DELETE"}).catch(()=>{})}_addListener(e,t){if(!this._isAvailable())return;const r=to(e);if(window.cookieStore){const c=d=>{const p=d.changed.find(v=>v.name===r);p&&t(p.value),d.deleted.find(v=>v.name===r)&&t(null)},l=()=>window.cookieStore.removeEventListener("change",c);return this.listenerUnsubscribes.set(t,l),window.cookieStore.addEventListener("change",c)}let i=eo(r);const s=setInterval(()=>{const c=eo(r);c!==i&&(t(c),i=c)},F_),a=()=>clearInterval(s);this.listenerUnsubscribes.set(t,a)}_removeListener(e,t){const r=this.listenerUnsubscribes.get(t);r&&(r(),this.listenerUnsubscribes.delete(t))}}Ah.type="COOKIE";const U_=Ah;/**
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
 */class Rh extends Eh{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}}Rh.type="SESSION";const Zo=Rh;/**
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
 */function B_(n){return Promise.all(n.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}/**
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
 */class Yi{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const t=this.receivers.find(i=>i.isListeningto(e));if(t)return t;const r=new Yi(e);return this.receivers.push(r),r}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const t=e,{eventId:r,eventType:i,data:s}=t.data,a=this.handlersMap[i];if(!(a!=null&&a.size))return;t.ports[0].postMessage({status:"ack",eventId:r,eventType:i});const c=Array.from(a).map(async d=>d(t.origin,s)),l=await B_(c);t.ports[0].postMessage({status:"done",eventId:r,eventType:i,response:l})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}Yi.receivers=[];/**
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
 */function Ji(n="",e=10){let t="";for(let r=0;r<e;r++)t+=Math.floor(Math.random()*10);return n+t}/**
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
 */class q_{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,r=50){const i=typeof MessageChannel<"u"?new MessageChannel:null;if(!i)throw new Error("connection_unavailable");let s,a;return new Promise((c,l)=>{const d=Ji("",20);i.port1.start();const p=setTimeout(()=>{l(new Error("unsupported_event"))},r);a={messageChannel:i,onMessage(g){const v=g;if(v.data.eventId===d)switch(v.data.status){case"ack":clearTimeout(p),s=setTimeout(()=>{l(new Error("timeout"))},3e3);break;case"done":clearTimeout(s),c(v.data.response);break;default:clearTimeout(p),clearTimeout(s),l(new Error("invalid_response"));break}}},this.handlers.add(a),i.port1.addEventListener("message",a.onMessage),this.target.postMessage({eventType:e,eventId:d,data:t},[i.port2])}).finally(()=>{a&&this.removeMessageHandler(a)})}}/**
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
 */function he(){return window}function j_(n){he().location.href=n}/**
 * @license
 * Copyright 2020 Google LLC.
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
 */function ea(){return typeof he().WorkerGlobalScope<"u"&&typeof he().importScripts=="function"}async function $_(){if(!(navigator!=null&&navigator.serviceWorker))return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function H_(){var n;return((n=navigator==null?void 0:navigator.serviceWorker)===null||n===void 0?void 0:n.controller)||null}function z_(){return ea()?self:null}/**
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
 */const Sh="firebaseLocalStorageDb",W_=1,Di="firebaseLocalStorage",Ph="fbase_key";class Mr{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{t(this.request.error)})})}}function Xi(n,e){return n.transaction([Di],e?"readwrite":"readonly").objectStore(Di)}function G_(){const n=indexedDB.deleteDatabase(Sh);return new Mr(n).toPromise()}function yo(){const n=indexedDB.open(Sh,W_);return new Promise((e,t)=>{n.addEventListener("error",()=>{t(n.error)}),n.addEventListener("upgradeneeded",()=>{const r=n.result;try{r.createObjectStore(Di,{keyPath:Ph})}catch(i){t(i)}}),n.addEventListener("success",async()=>{const r=n.result;r.objectStoreNames.contains(Di)?e(r):(r.close(),await G_(),e(await yo()))})})}async function hu(n,e,t){const r=Xi(n,!0).put({[Ph]:e,value:t});return new Mr(r).toPromise()}async function K_(n,e){const t=Xi(n,!1).get(e),r=await new Mr(t).toPromise();return r===void 0?null:r.value}function du(n,e){const t=Xi(n,!0).delete(e);return new Mr(t).toPromise()}const Q_=800,Y_=3;class bh{constructor(){this.type="LOCAL",this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){return this.db?this.db:(this.db=await yo(),this.db)}async _withRetries(e){let t=0;for(;;)try{const r=await this._openDb();return await e(r)}catch(r){if(t++>Y_)throw r;this.db&&(this.db.close(),this.db=void 0)}}async initializeServiceWorkerMessaging(){return ea()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=Yi._getInstance(z_()),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){var e,t;if(this.activeServiceWorker=await $_(),!this.activeServiceWorker)return;this.sender=new q_(this.activeServiceWorker);const r=await this.sender._send("ping",{},800);r&&!((e=r[0])===null||e===void 0)&&e.fulfilled&&!((t=r[0])===null||t===void 0)&&t.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||H_()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{if(!indexedDB)return!1;const e=await yo();return await hu(e,Ni,"1"),await du(e,Ni),!0}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(r=>hu(r,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){const t=await this._withRetries(r=>K_(r,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>du(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){const e=await this._withRetries(i=>{const s=Xi(i,!1).getAll();return new Mr(s).toPromise()});if(!e)return[];if(this.pendingWrites!==0)return[];const t=[],r=new Set;if(e.length!==0)for(const{fbase_key:i,value:s}of e)r.add(i),JSON.stringify(this.localCache[i])!==JSON.stringify(s)&&(this.notifyListeners(i,s),t.push(i));for(const i of Object.keys(this.localCache))this.localCache[i]&&!r.has(i)&&(this.notifyListeners(i,null),t.push(i));return t}notifyListeners(e,t){this.localCache[e]=t;const r=this.listeners[e];if(r)for(const i of Array.from(r))i(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),Q_)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){Object.keys(this.listeners).length===0&&this.startPolling(),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&this.stopPolling()}}bh.type="LOCAL";const Ch=bh;/**
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
 */function fu(n,e){return te(n,"POST","/v2/accounts/mfaSignIn:start",ee(n,e))}function J_(n,e){return te(n,"POST","/v2/accounts/mfaSignIn:finalize",ee(n,e))}function X_(n,e){return te(n,"POST","/v2/accounts/mfaSignIn:finalize",ee(n,e))}/**
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
 */const no=nh("rcb"),Z_=new Or(3e4,6e4);class ey{constructor(){var e;this.hostLanguage="",this.counter=0,this.librarySeparatelyLoaded=!!(!((e=he().grecaptcha)===null||e===void 0)&&e.render)}load(e,t=""){return C(ty(t),e,"argument-error"),this.shouldResolveImmediately(t)&&tu(he().grecaptcha)?Promise.resolve(he().grecaptcha):new Promise((r,i)=>{const s=he().setTimeout(()=>{i(Ne(e,"network-request-failed"))},Z_.get());he()[no]=()=>{he().clearTimeout(s),delete he()[no];const c=he().grecaptcha;if(!c||!tu(c)){i(Ne(e,"internal-error"));return}const l=c.render;c.render=(d,p)=>{const g=l(d,p);return this.counter++,g},this.hostLanguage=t,r(c)};const a=`${pg()}?${Pn({onload:no,render:"explicit",hl:t})}`;Wo(a).catch(()=>{clearTimeout(s),i(Ne(e,"internal-error"))})})}clearedOneInstance(){this.counter--}shouldResolveImmediately(e){var t;return!!(!((t=he().grecaptcha)===null||t===void 0)&&t.render)&&(e===this.hostLanguage||this.counter>0||this.librarySeparatelyLoaded)}}function ty(n){return n.length<=6&&/^\s*[a-zA-Z0-9\-]*\s*$/.test(n)}class ny{async load(e){return new vg(e)}clearedOneInstance(){}}/**
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
 */const fr="recaptcha",ry={theme:"light",type:"image"};class iy{constructor(e,t,r=Object.assign({},ry)){this.parameters=r,this.type=fr,this.destroyed=!1,this.widgetId=null,this.tokenChangeListeners=new Set,this.renderPromise=null,this.recaptcha=null,this.auth=oe(e),this.isInvisible=this.parameters.size==="invisible",C(typeof document<"u",this.auth,"operation-not-supported-in-this-environment");const i=typeof t=="string"?document.getElementById(t):t;C(i,this.auth,"argument-error"),this.container=i,this.parameters.callback=this.makeTokenCallback(this.parameters.callback),this._recaptchaLoader=this.auth.settings.appVerificationDisabledForTesting?new ny:new ey,this.validateStartingState()}async verify(){this.assertNotDestroyed();const e=await this.render(),t=this.getAssertedRecaptcha(),r=t.getResponse(e);return r||new Promise(i=>{const s=a=>{a&&(this.tokenChangeListeners.delete(s),i(a))};this.tokenChangeListeners.add(s),this.isInvisible&&t.execute(e)})}render(){try{this.assertNotDestroyed()}catch(e){return Promise.reject(e)}return this.renderPromise?this.renderPromise:(this.renderPromise=this.makeRenderPromise().catch(e=>{throw this.renderPromise=null,e}),this.renderPromise)}_reset(){this.assertNotDestroyed(),this.widgetId!==null&&this.getAssertedRecaptcha().reset(this.widgetId)}clear(){this.assertNotDestroyed(),this.destroyed=!0,this._recaptchaLoader.clearedOneInstance(),this.isInvisible||this.container.childNodes.forEach(e=>{this.container.removeChild(e)})}validateStartingState(){C(!this.parameters.sitekey,this.auth,"argument-error"),C(this.isInvisible||!this.container.hasChildNodes(),this.auth,"argument-error"),C(typeof document<"u",this.auth,"operation-not-supported-in-this-environment")}makeTokenCallback(e){return t=>{if(this.tokenChangeListeners.forEach(r=>r(t)),typeof e=="function")e(t);else if(typeof e=="string"){const r=he()[e];typeof r=="function"&&r(t)}}}assertNotDestroyed(){C(!this.destroyed,this.auth,"internal-error")}async makeRenderPromise(){if(await this.init(),!this.widgetId){let e=this.container;if(!this.isInvisible){const t=document.createElement("div");e.appendChild(t),e=t}this.widgetId=this.getAssertedRecaptcha().render(e,this.parameters)}return this.widgetId}async init(){C($o()&&!ea(),this.auth,"internal-error"),await sy(),this.recaptcha=await this._recaptchaLoader.load(this.auth,this.auth.languageCode||void 0);const e=await Jm(this.auth);C(e,this.auth,"internal-error"),this.parameters.sitekey=e}getAssertedRecaptcha(){return C(this.recaptcha,this.auth,"internal-error"),this.recaptcha}}function sy(){let n=null;return new Promise(e=>{if(document.readyState==="complete"){e();return}n=()=>e(),window.addEventListener("load",n)}).catch(e=>{throw n&&window.removeEventListener("load",n),e})}/**
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
 */class ta{constructor(e,t){this.verificationId=e,this.onConfirmation=t}confirm(e){const t=Ct._fromVerification(this.verificationId,e);return this.onConfirmation(t)}}async function oy(n,e,t){if(re(n.app))return Promise.reject(ge(n));const r=oe(n),i=await Zi(r,e,x(t));return new ta(i,s=>Ki(r,s))}async function ay(n,e,t){const r=x(n);await Gi(!1,r,"phone");const i=await Zi(r.auth,e,x(t));return new ta(i,s=>ph(r,s))}async function cy(n,e,t){const r=x(n);if(re(r.auth.app))return Promise.reject(ge(r.auth));const i=await Zi(r.auth,e,x(t));return new ta(i,s=>mh(r,s))}async function Zi(n,e,t){var r;if(!n._getRecaptchaConfig())try{await ih(n)}catch{console.log("Failed to initialize reCAPTCHA Enterprise config. Triggering the reCAPTCHA v2 verification.")}try{let i;if(typeof e=="string"?i={phoneNumber:e}:i=e,"session"in i){const s=i.session;if("phoneNumber"in i){C(s.type==="enroll",n,"internal-error");const a={idToken:s.credential,phoneEnrollmentInfo:{phoneNumber:i.phoneNumber,clientType:"CLIENT_TYPE_WEB"}};return(await bt(n,a,"mfaSmsEnrollment",async(p,g)=>{if(g.phoneEnrollmentInfo.captchaResponse===hr){C((t==null?void 0:t.type)===fr,p,"argument-error");const v=await ro(p,g,t);return lu(p,v)}return lu(p,g)},"PHONE_PROVIDER").catch(p=>Promise.reject(p))).phoneSessionInfo.sessionInfo}else{C(s.type==="signin",n,"internal-error");const a=((r=i.multiFactorHint)===null||r===void 0?void 0:r.uid)||i.multiFactorUid;C(a,n,"missing-multi-factor-info");const c={mfaPendingCredential:s.credential,mfaEnrollmentId:a,phoneSignInInfo:{clientType:"CLIENT_TYPE_WEB"}};return(await bt(n,c,"mfaSmsSignIn",async(g,v)=>{if(v.phoneSignInInfo.captchaResponse===hr){C((t==null?void 0:t.type)===fr,g,"argument-error");const P=await ro(g,v,t);return fu(g,P)}return fu(g,v)},"PHONE_PROVIDER").catch(g=>Promise.reject(g))).phoneResponseInfo.sessionInfo}}else{const s={phoneNumber:i.phoneNumber,clientType:"CLIENT_TYPE_WEB"};return(await bt(n,s,"sendVerificationCode",async(d,p)=>{if(p.captchaResponse===hr){C((t==null?void 0:t.type)===fr,d,"argument-error");const g=await ro(d,p,t);return cu(d,g)}return cu(d,p)},"PHONE_PROVIDER").catch(d=>Promise.reject(d))).sessionInfo}}finally{t==null||t._reset()}}async function uy(n,e){const t=x(n);if(re(t.auth.app))return Promise.reject(ge(t.auth));await Go(t,e)}async function ro(n,e,t){C(t.type===fr,n,"argument-error");const r=await t.verify();C(typeof r=="string",n,"argument-error");const i=Object.assign({},e);if("phoneEnrollmentInfo"in i){const s=i.phoneEnrollmentInfo.phoneNumber,a=i.phoneEnrollmentInfo.captchaResponse,c=i.phoneEnrollmentInfo.clientType,l=i.phoneEnrollmentInfo.recaptchaVersion;return Object.assign(i,{phoneEnrollmentInfo:{phoneNumber:s,recaptchaToken:r,captchaResponse:a,clientType:c,recaptchaVersion:l}}),i}else if("phoneSignInInfo"in i){const s=i.phoneSignInInfo.captchaResponse,a=i.phoneSignInInfo.clientType,c=i.phoneSignInInfo.recaptchaVersion;return Object.assign(i,{phoneSignInInfo:{recaptchaToken:r,captchaResponse:s,clientType:a,recaptchaVersion:c}}),i}else return Object.assign(i,{recaptchaToken:r}),i}/**
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
 */class Yt{constructor(e){this.providerId=Yt.PROVIDER_ID,this.auth=oe(e)}verifyPhoneNumber(e,t){return Zi(this.auth,e,x(t))}static credential(e,t){return Ct._fromVerification(e,t)}static credentialFromResult(e){const t=e;return Yt.credentialFromTaggedObject(t)}static credentialFromError(e){return Yt.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{phoneNumber:t,temporaryProof:r}=e;return t&&r?Ct._fromTokenResponse(t,r):null}}Yt.PROVIDER_ID="phone";Yt.PHONE_SIGN_IN_METHOD="phone";/**
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
 */function rn(n,e){return e?ot(e):(C(n._popupRedirectResolver,n,"argument-error"),n._popupRedirectResolver)}/**
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
 */class na extends kn{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return ct(e,this._buildIdpRequest())}_linkToIdToken(e,t){return ct(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return ct(e,this._buildIdpRequest())}_buildIdpRequest(e){const t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}}function ly(n){return fh(n.auth,new na(n),n.bypassAuthState)}function hy(n){const{auth:e,user:t}=n;return C(t,e,"internal-error"),dh(t,new na(n),n.bypassAuthState)}async function dy(n){const{auth:e,user:t}=n;return C(t,e,"internal-error"),Go(t,new na(n),n.bypassAuthState)}/**
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
 */class kh{constructor(e,t,r,i,s=!1){this.auth=e,this.resolver=r,this.user=i,this.bypassAuthState=s,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(r){this.reject(r)}})}async onAuthEvent(e){const{urlResponse:t,sessionId:r,postBody:i,tenantId:s,error:a,type:c}=e;if(a){this.reject(a);return}const l={auth:this.auth,requestUri:t,sessionId:r,tenantId:s||void 0,postBody:i||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(c)(l))}catch(d){this.reject(d)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return ly;case"linkViaPopup":case"linkViaRedirect":return dy;case"reauthViaPopup":case"reauthViaRedirect":return hy;default:Le(this.auth,"internal-error")}}resolve(e){ht(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){ht(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}/**
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
 */const fy=new Or(2e3,1e4);async function py(n,e,t){if(re(n.app))return Promise.reject(Ne(n,"operation-not-supported-in-this-environment"));const r=oe(n);Cn(n,e,yt);const i=rn(r,t);return new at(r,"signInViaPopup",e,i).executeNotNull()}async function my(n,e,t){const r=x(n);if(re(r.auth.app))return Promise.reject(Ne(r.auth,"operation-not-supported-in-this-environment"));Cn(r.auth,e,yt);const i=rn(r.auth,t);return new at(r.auth,"reauthViaPopup",e,i,r).executeNotNull()}async function gy(n,e,t){const r=x(n);Cn(r.auth,e,yt);const i=rn(r.auth,t);return new at(r.auth,"linkViaPopup",e,i,r).executeNotNull()}class at extends kh{constructor(e,t,r,i,s){super(e,t,i,s),this.provider=r,this.authWindow=null,this.pollId=null,at.currentPopupAction&&at.currentPopupAction.cancel(),at.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return C(e,this.auth,"internal-error"),e}async onExecution(){ht(this.filter.length===1,"Popup operations only handle one event");const e=Ji();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(t=>{this.reject(t)}),this.resolver._isIframeWebStorageSupported(this.auth,t=>{t||this.reject(Ne(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){var e;return((e=this.authWindow)===null||e===void 0?void 0:e.associatedEvent)||null}cancel(){this.reject(Ne(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,at.currentPopupAction=null}pollUserCancellation(){const e=()=>{var t,r;if(!((r=(t=this.authWindow)===null||t===void 0?void 0:t.window)===null||r===void 0)&&r.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(Ne(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,fy.get())};e()}}at.currentPopupAction=null;/**
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
 */const _y="pendingRedirect",yi=new Map;class yy extends kh{constructor(e,t,r=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,r),this.eventId=null}async execute(){let e=yi.get(this.auth._key());if(!e){try{const r=await vy(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(r)}catch(t){e=()=>Promise.reject(t)}yi.set(this.auth._key(),e)}return this.bypassAuthState||yi.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){const t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}}async function vy(n,e){const t=Dh(e),r=Nh(n);if(!await r._isAvailable())return!1;const i=await r._get(t)==="true";return await r._remove(t),i}async function ra(n,e){return Nh(n)._set(Dh(e),"true")}function Iy(n,e){yi.set(n._key(),e)}function Nh(n){return ot(n._redirectPersistence)}function Dh(n){return _i(_y,n.config.apiKey,n.name)}/**
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
 */function Ey(n,e,t){return Ty(n,e,t)}async function Ty(n,e,t){if(re(n.app))return Promise.reject(ge(n));const r=oe(n);Cn(n,e,yt),await r._initializationPromise;const i=rn(r,t);return await ra(i,r),i._openRedirect(r,e,"signInViaRedirect")}function wy(n,e,t){return Ay(n,e,t)}async function Ay(n,e,t){const r=x(n);if(Cn(r.auth,e,yt),re(r.auth.app))return Promise.reject(ge(r.auth));await r.auth._initializationPromise;const i=rn(r.auth,t);await ra(i,r.auth);const s=await Vh(r);return i._openRedirect(r.auth,e,"reauthViaRedirect",s)}function Ry(n,e,t){return Sy(n,e,t)}async function Sy(n,e,t){const r=x(n);Cn(r.auth,e,yt),await r.auth._initializationPromise;const i=rn(r.auth,t);await Gi(!1,r,e.providerId),await ra(i,r.auth);const s=await Vh(r);return i._openRedirect(r.auth,e,"linkViaRedirect",s)}async function Py(n,e){return await oe(n)._initializationPromise,Oh(n,e,!1)}async function Oh(n,e,t=!1){if(re(n.app))return Promise.reject(ge(n));const r=oe(n),i=rn(r,e),a=await new yy(r,i,t).execute();return a&&!t&&(delete a.user._redirectEventId,await r._persistUserIfCurrent(a.user),await r._setRedirectUser(null,e)),a}async function Vh(n){const e=Ji(`${n.uid}:::`);return n._redirectEventId=e,await n.auth._setRedirectUser(n),await n.auth._persistUserIfCurrent(n),e}/**
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
 */const by=10*60*1e3;class Cy{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(r=>{this.isEventForConsumer(e,r)&&(t=!0,this.sendToConsumer(e,r),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!ky(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){var r;if(e.error&&!Lh(e)){const i=((r=e.error.code)===null||r===void 0?void 0:r.split("auth/")[1])||"internal-error";t.onError(Ne(this.auth,i))}else t.onAuthEvent(e)}isEventForConsumer(e,t){const r=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&r}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=by&&this.cachedEventUids.clear(),this.cachedEventUids.has(pu(e))}saveEventToCache(e){this.cachedEventUids.add(pu(e)),this.lastProcessedEventTime=Date.now()}}function pu(n){return[n.type,n.eventId,n.sessionId,n.tenantId].filter(e=>e).join("-")}function Lh({type:n,error:e}){return n==="unknown"&&(e==null?void 0:e.code)==="auth/no-auth-event"}function ky(n){switch(n.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return Lh(n);default:return!1}}/**
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
 */async function Ny(n,e={}){return te(n,"GET","/v1/projects",e)}/**
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
 */const Dy=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,Oy=/^https?/;async function Vy(n){if(n.config.emulator)return;const{authorizedDomains:e}=await Ny(n);for(const t of e)try{if(Ly(t))return}catch{}Le(n,"unauthorized-domain")}function Ly(n){const e=Ir(),{protocol:t,hostname:r}=new URL(e);if(n.startsWith("chrome-extension://")){const a=new URL(n);return a.hostname===""&&r===""?t==="chrome-extension:"&&n.replace("chrome-extension://","")===e.replace("chrome-extension://",""):t==="chrome-extension:"&&a.hostname===r}if(!Oy.test(t))return!1;if(Dy.test(n))return r===n;const i=n.replace(/\./g,"\\.");return new RegExp("^(.+\\."+i+"|"+i+")$","i").test(r)}/**
 * @license
 * Copyright 2020 Google LLC.
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
 */const My=new Or(3e4,6e4);function mu(){const n=he().___jsl;if(n!=null&&n.H){for(const e of Object.keys(n.H))if(n.H[e].r=n.H[e].r||[],n.H[e].L=n.H[e].L||[],n.H[e].r=[...n.H[e].L],n.CP)for(let t=0;t<n.CP.length;t++)n.CP[t]=null}}function xy(n){return new Promise((e,t)=>{var r,i,s;function a(){mu(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{mu(),t(Ne(n,"network-request-failed"))},timeout:My.get()})}if(!((i=(r=he().gapi)===null||r===void 0?void 0:r.iframes)===null||i===void 0)&&i.Iframe)e(gapi.iframes.getContext());else if(!((s=he().gapi)===null||s===void 0)&&s.load)a();else{const c=nh("iframefcb");return he()[c]=()=>{gapi.load?a():t(Ne(n,"network-request-failed"))},Wo(`${gg()}?onload=${c}`).catch(l=>t(l))}}).catch(e=>{throw vi=null,e})}let vi=null;function Fy(n){return vi=vi||xy(n),vi}/**
 * @license
 * Copyright 2020 Google LLC.
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
 */const Uy=new Or(5e3,15e3),By="__/auth/iframe",qy="emulator/auth/iframe",jy={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},$y=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function Hy(n){const e=n.config;C(e.authDomain,n,"auth-domain-config-required");const t=e.emulator?Ho(e,qy):`https://${n.config.authDomain}/${By}`,r={apiKey:e.apiKey,appName:n.name,v:bn},i=$y.get(n.config.apiHost);i&&(r.eid=i);const s=n._getFrameworks();return s.length&&(r.fw=s.join(",")),`${t}?${Pn(r).slice(1)}`}async function zy(n){const e=await Fy(n),t=he().gapi;return C(t,n,"internal-error"),e.open({where:document.body,url:Hy(n),messageHandlersFilter:t.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:jy,dontclear:!0},r=>new Promise(async(i,s)=>{await r.restyle({setHideOnLeave:!1});const a=Ne(n,"network-request-failed"),c=he().setTimeout(()=>{s(a)},Uy.get());function l(){he().clearTimeout(c),i(r)}r.ping(l).then(l,()=>{s(a)})}))}/**
 * @license
 * Copyright 2020 Google LLC.
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
 */const Wy={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},Gy=500,Ky=600,Qy="_blank",Yy="http://localhost";class gu{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}}function Jy(n,e,t,r=Gy,i=Ky){const s=Math.max((window.screen.availHeight-i)/2,0).toString(),a=Math.max((window.screen.availWidth-r)/2,0).toString();let c="";const l=Object.assign(Object.assign({},Wy),{width:r.toString(),height:i.toString(),top:s,left:a}),d=be().toLowerCase();t&&(c=Ql(d)?Qy:t),Gl(d)&&(e=e||Yy,l.scrollbars="yes");const p=Object.entries(l).reduce((v,[P,k])=>`${v}${P}=${k},`,"");if(og(d)&&c!=="_self")return Xy(e||"",c),new gu(null);const g=window.open(e||"",c,p);C(g,n,"popup-blocked");try{g.focus()}catch{}return new gu(g)}function Xy(n,e){const t=document.createElement("a");t.href=n,t.target=e;const r=document.createEvent("MouseEvent");r.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),t.dispatchEvent(r)}/**
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
 */const Zy="__/auth/handler",ev="emulator/auth/handler",tv=encodeURIComponent("fac");async function _u(n,e,t,r,i,s){C(n.config.authDomain,n,"auth-domain-config-required"),C(n.config.apiKey,n,"invalid-api-key");const a={apiKey:n.config.apiKey,appName:n.name,authType:t,redirectUrl:r,v:bn,eventId:i};if(e instanceof yt){e.setDefaultLanguage(n.languageCode),a.providerId=e.providerId||"",Tp(e.getCustomParameters())||(a.customParameters=JSON.stringify(e.getCustomParameters()));for(const[p,g]of Object.entries({}))a[p]=g}if(e instanceof Dn){const p=e.getScopes().filter(g=>g!=="");p.length>0&&(a.scopes=p.join(","))}n.tenantId&&(a.tid=n.tenantId);const c=a;for(const p of Object.keys(c))c[p]===void 0&&delete c[p];const l=await n._getAppCheckToken(),d=l?`#${tv}=${encodeURIComponent(l)}`:"";return`${nv(n)}?${Pn(c).slice(1)}${d}`}function nv({config:n}){return n.emulator?Ho(n,ev):`https://${n.authDomain}/${Zy}`}/**
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
 */const io="webStorageSupport";class rv{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=Zo,this._completeRedirectFn=Oh,this._overrideRedirectResult=Iy}async _openPopup(e,t,r,i){var s;ht((s=this.eventManagers[e._key()])===null||s===void 0?void 0:s.manager,"_initialize() not called before _openPopup()");const a=await _u(e,t,r,Ir(),i);return Jy(e,a,Ji())}async _openRedirect(e,t,r,i){await this._originValidation(e);const s=await _u(e,t,r,Ir(),i);return j_(s),new Promise(()=>{})}_initialize(e){const t=e._key();if(this.eventManagers[t]){const{manager:i,promise:s}=this.eventManagers[t];return i?Promise.resolve(i):(ht(s,"If manager is not set, promise should be"),s)}const r=this.initAndGetManager(e);return this.eventManagers[t]={promise:r},r.catch(()=>{delete this.eventManagers[t]}),r}async initAndGetManager(e){const t=await zy(e),r=new Cy(e);return t.register("authEvent",i=>(C(i==null?void 0:i.authEvent,e,"invalid-auth-event"),{status:r.onEvent(i.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:r},this.iframes[e._key()]=t,r}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(io,{type:io},i=>{var s;const a=(s=i==null?void 0:i[0])===null||s===void 0?void 0:s[io];a!==void 0&&t(!!a),Le(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){const t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=Vy(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return eh()||Kl()||zo()}}const Mh=rv;class xh{constructor(e){this.factorId=e}_process(e,t,r){switch(t.type){case"enroll":return this._finalizeEnroll(e,t.credential,r);case"signin":return this._finalizeSignIn(e,t.credential);default:return We("unexpected MultiFactorSessionType")}}}class ia extends xh{constructor(e){super("phone"),this.credential=e}static _fromCredential(e){return new ia(e)}_finalizeEnroll(e,t,r){return N_(e,{idToken:t,displayName:r,phoneVerificationInfo:this.credential._makeVerificationRequest()})}_finalizeSignIn(e,t){return J_(e,{mfaPendingCredential:t,phoneVerificationInfo:this.credential._makeVerificationRequest()})}}class Fh{constructor(){}static assertion(e){return ia._fromCredential(e)}}Fh.FACTOR_ID="phone";class Uh{static assertionForEnrollment(e,t){return wr._fromSecret(e,t)}static assertionForSignIn(e,t){return wr._fromEnrollmentId(e,t)}static async generateSecret(e){var t;const r=e;C(typeof((t=r.user)===null||t===void 0?void 0:t.auth)<"u","internal-error");const i=await D_(r.user.auth,{idToken:r.credential,totpEnrollmentInfo:{}});return es._fromStartTotpMfaEnrollmentResponse(i,r.user.auth)}}Uh.FACTOR_ID="totp";class wr extends xh{constructor(e,t,r){super("totp"),this.otp=e,this.enrollmentId=t,this.secret=r}static _fromSecret(e,t){return new wr(t,void 0,e)}static _fromEnrollmentId(e,t){return new wr(t,e)}async _finalizeEnroll(e,t,r){return C(typeof this.secret<"u",e,"argument-error"),O_(e,{idToken:t,displayName:r,totpVerificationInfo:this.secret._makeTotpVerificationInfo(this.otp)})}async _finalizeSignIn(e,t){C(this.enrollmentId!==void 0&&this.otp!==void 0,e,"argument-error");const r={verificationCode:this.otp};return X_(e,{mfaPendingCredential:t,mfaEnrollmentId:this.enrollmentId,totpVerificationInfo:r})}}class es{constructor(e,t,r,i,s,a,c){this.sessionInfo=a,this.auth=c,this.secretKey=e,this.hashingAlgorithm=t,this.codeLength=r,this.codeIntervalSeconds=i,this.enrollmentCompletionDeadline=s}static _fromStartTotpMfaEnrollmentResponse(e,t){return new es(e.totpSessionInfo.sharedSecretKey,e.totpSessionInfo.hashingAlgorithm,e.totpSessionInfo.verificationCodeLength,e.totpSessionInfo.periodSec,new Date(e.totpSessionInfo.finalizeEnrollmentTime).toUTCString(),e.totpSessionInfo.sessionInfo,t)}_makeTotpVerificationInfo(e){return{sessionInfo:this.sessionInfo,verificationCode:e}}generateQrCodeUrl(e,t){var r;let i=!1;return(li(e)||li(t))&&(i=!0),i&&(li(e)&&(e=((r=this.auth.currentUser)===null||r===void 0?void 0:r.email)||"unknownuser"),li(t)&&(t=this.auth.name)),`otpauth://totp/${t}:${e}?secret=${this.secretKey}&issuer=${t}&algorithm=${this.hashingAlgorithm}&digits=${this.codeLength}`}}function li(n){return typeof n>"u"||(n==null?void 0:n.length)===0}var yu="@firebase/auth",vu="1.10.8";/**
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
 */class iv{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)===null||e===void 0?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(r=>{e((r==null?void 0:r.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){C(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
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
 */function sv(n){switch(n){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function ov(n){vn(new en("auth",(e,{options:t})=>{const r=e.getProvider("app").getImmediate(),i=e.getProvider("heartbeat"),s=e.getProvider("app-check-internal"),{apiKey:a,authDomain:c}=r.options;C(a&&!a.includes(":"),"invalid-api-key",{appName:r.name});const l={apiKey:a,authDomain:c,clientPlatform:n,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:th(n)},d=new dg(r,i,s,l);return Rg(d,t),d},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,r)=>{e.getProvider("auth-internal").initialize()})),vn(new en("auth-internal",e=>{const t=oe(e.getProvider("auth").getImmediate());return(r=>new iv(r))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),Pt(yu,vu,sv(n)),Pt(yu,vu,"esm2017")}/**
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
 */const av=5*60,cv=Pl("authIdTokenMaxAge")||av;let Iu=null;const uv=n=>async e=>{const t=e&&await e.getIdTokenResult(),r=t&&(new Date().getTime()-Date.parse(t.issuedAtTime))/1e3;if(r&&r>cv)return;const i=t==null?void 0:t.token;Iu!==i&&(Iu=i,await fetch(n,{method:i?"POST":"DELETE",headers:i?{Authorization:`Bearer ${i}`}:{}}))};function lv(n=Dl()){const e=Uo(n,"auth");if(e.isInitialized())return e.getImmediate();const t=sh(n,{popupRedirectResolver:Mh,persistence:[Ch,wh,Zo]}),r=Pl("authTokenSyncURL");if(r&&typeof isSecureContext=="boolean"&&isSecureContext){const s=new URL(r,location.origin);if(location.origin===s.origin){const a=uv(s.toString());Ih(t,a,()=>a(t.currentUser)),vh(t,c=>a(c))}}const i=Rl("auth");return i&&oh(t,`http://${i}`),t}function hv(){var n,e;return(e=(n=document.getElementsByTagName("head"))===null||n===void 0?void 0:n[0])!==null&&e!==void 0?e:document}fg({loadJS(n){return new Promise((e,t)=>{const r=document.createElement("script");r.setAttribute("src",n),r.onload=e,r.onerror=i=>{const s=Ne("internal-error");s.customData=i,t(s)},r.type="text/javascript",r.charset="UTF-8",hv().appendChild(r)})},gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});ov("Browser");const wT=Object.freeze(Object.defineProperty({__proto__:null,ActionCodeOperation:Um,ActionCodeURL:Nn,AuthCredential:kn,AuthErrorCodes:jm,EmailAuthCredential:In,EmailAuthProvider:Ut,FacebookAuthProvider:nt,FactorId:Lm,GithubAuthProvider:it,GoogleAuthProvider:rt,OAuthCredential:Je,OAuthProvider:dr,OperationType:Fm,PhoneAuthCredential:Ct,PhoneAuthProvider:Yt,PhoneMultiFactorGenerator:Fh,ProviderId:Mm,RecaptchaVerifier:iy,SAMLAuthProvider:Ci,SignInMethod:xm,TotpMultiFactorGenerator:Uh,TotpSecret:es,TwitterAuthProvider:st,applyActionCode:e_,beforeAuthStateChanged:Ih,browserCookiePersistence:U_,browserLocalPersistence:wh,browserPopupRedirectResolver:Mh,browserSessionPersistence:Zo,checkActionCode:gh,confirmPasswordReset:Zg,connectAuthEmulator:oh,createUserWithEmailAndPassword:n_,debugErrorMap:qm,deleteUser:C_,fetchSignInMethodsForEmail:c_,getAdditionalUserInfo:I_,getAuth:lv,getIdToken:eg,getIdTokenResult:$l,getMultiFactorResolver:k_,getRedirectResult:Py,inMemoryPersistence:_o,indexedDBLocalPersistence:Ch,initializeAuth:sh,initializeRecaptchaConfig:T_,isSignInWithEmailLink:s_,linkWithCredential:ph,linkWithPhoneNumber:ay,linkWithPopup:gy,linkWithRedirect:Ry,multiFactor:L_,onAuthStateChanged:A_,onIdTokenChanged:vh,parseActionCodeURL:zg,prodErrorMap:Ml,reauthenticateWithCredential:mh,reauthenticateWithPhoneNumber:cy,reauthenticateWithPopup:my,reauthenticateWithRedirect:wy,reload:Hl,revokeAccessToken:b_,sendEmailVerification:u_,sendPasswordResetEmail:Xg,sendSignInLinkToEmail:i_,setPersistence:E_,signInAnonymously:Kg,signInWithCredential:Ki,signInWithCustomToken:Jg,signInWithEmailAndPassword:r_,signInWithEmailLink:o_,signInWithPhoneNumber:oy,signInWithPopup:py,signInWithRedirect:Ey,signOut:P_,unlink:Qg,updateCurrentUser:S_,updateEmail:f_,updatePassword:p_,updatePhoneNumber:uy,updateProfile:d_,useDeviceLanguage:R_,validatePassword:w_,verifyBeforeUpdateEmail:l_,verifyPasswordResetCode:t_},Symbol.toStringTag,{value:"Module"}));var dv="firebase",fv="11.10.0";/**
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
 */Pt(dv,fv,"app");var Eu=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var kt,Bh;(function(){var n;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(E,m){function y(){}y.prototype=m.prototype,E.D=m.prototype,E.prototype=new y,E.prototype.constructor=E,E.C=function(I,T,A){for(var _=Array(arguments.length-2),Ze=2;Ze<arguments.length;Ze++)_[Ze-2]=arguments[Ze];return m.prototype[T].apply(I,_)}}function t(){this.blockSize=-1}function r(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.B=Array(this.blockSize),this.o=this.h=0,this.s()}e(r,t),r.prototype.s=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function i(E,m,y){y||(y=0);var I=Array(16);if(typeof m=="string")for(var T=0;16>T;++T)I[T]=m.charCodeAt(y++)|m.charCodeAt(y++)<<8|m.charCodeAt(y++)<<16|m.charCodeAt(y++)<<24;else for(T=0;16>T;++T)I[T]=m[y++]|m[y++]<<8|m[y++]<<16|m[y++]<<24;m=E.g[0],y=E.g[1],T=E.g[2];var A=E.g[3],_=m+(A^y&(T^A))+I[0]+3614090360&4294967295;m=y+(_<<7&4294967295|_>>>25),_=A+(T^m&(y^T))+I[1]+3905402710&4294967295,A=m+(_<<12&4294967295|_>>>20),_=T+(y^A&(m^y))+I[2]+606105819&4294967295,T=A+(_<<17&4294967295|_>>>15),_=y+(m^T&(A^m))+I[3]+3250441966&4294967295,y=T+(_<<22&4294967295|_>>>10),_=m+(A^y&(T^A))+I[4]+4118548399&4294967295,m=y+(_<<7&4294967295|_>>>25),_=A+(T^m&(y^T))+I[5]+1200080426&4294967295,A=m+(_<<12&4294967295|_>>>20),_=T+(y^A&(m^y))+I[6]+2821735955&4294967295,T=A+(_<<17&4294967295|_>>>15),_=y+(m^T&(A^m))+I[7]+4249261313&4294967295,y=T+(_<<22&4294967295|_>>>10),_=m+(A^y&(T^A))+I[8]+1770035416&4294967295,m=y+(_<<7&4294967295|_>>>25),_=A+(T^m&(y^T))+I[9]+2336552879&4294967295,A=m+(_<<12&4294967295|_>>>20),_=T+(y^A&(m^y))+I[10]+4294925233&4294967295,T=A+(_<<17&4294967295|_>>>15),_=y+(m^T&(A^m))+I[11]+2304563134&4294967295,y=T+(_<<22&4294967295|_>>>10),_=m+(A^y&(T^A))+I[12]+1804603682&4294967295,m=y+(_<<7&4294967295|_>>>25),_=A+(T^m&(y^T))+I[13]+4254626195&4294967295,A=m+(_<<12&4294967295|_>>>20),_=T+(y^A&(m^y))+I[14]+2792965006&4294967295,T=A+(_<<17&4294967295|_>>>15),_=y+(m^T&(A^m))+I[15]+1236535329&4294967295,y=T+(_<<22&4294967295|_>>>10),_=m+(T^A&(y^T))+I[1]+4129170786&4294967295,m=y+(_<<5&4294967295|_>>>27),_=A+(y^T&(m^y))+I[6]+3225465664&4294967295,A=m+(_<<9&4294967295|_>>>23),_=T+(m^y&(A^m))+I[11]+643717713&4294967295,T=A+(_<<14&4294967295|_>>>18),_=y+(A^m&(T^A))+I[0]+3921069994&4294967295,y=T+(_<<20&4294967295|_>>>12),_=m+(T^A&(y^T))+I[5]+3593408605&4294967295,m=y+(_<<5&4294967295|_>>>27),_=A+(y^T&(m^y))+I[10]+38016083&4294967295,A=m+(_<<9&4294967295|_>>>23),_=T+(m^y&(A^m))+I[15]+3634488961&4294967295,T=A+(_<<14&4294967295|_>>>18),_=y+(A^m&(T^A))+I[4]+3889429448&4294967295,y=T+(_<<20&4294967295|_>>>12),_=m+(T^A&(y^T))+I[9]+568446438&4294967295,m=y+(_<<5&4294967295|_>>>27),_=A+(y^T&(m^y))+I[14]+3275163606&4294967295,A=m+(_<<9&4294967295|_>>>23),_=T+(m^y&(A^m))+I[3]+4107603335&4294967295,T=A+(_<<14&4294967295|_>>>18),_=y+(A^m&(T^A))+I[8]+1163531501&4294967295,y=T+(_<<20&4294967295|_>>>12),_=m+(T^A&(y^T))+I[13]+2850285829&4294967295,m=y+(_<<5&4294967295|_>>>27),_=A+(y^T&(m^y))+I[2]+4243563512&4294967295,A=m+(_<<9&4294967295|_>>>23),_=T+(m^y&(A^m))+I[7]+1735328473&4294967295,T=A+(_<<14&4294967295|_>>>18),_=y+(A^m&(T^A))+I[12]+2368359562&4294967295,y=T+(_<<20&4294967295|_>>>12),_=m+(y^T^A)+I[5]+4294588738&4294967295,m=y+(_<<4&4294967295|_>>>28),_=A+(m^y^T)+I[8]+2272392833&4294967295,A=m+(_<<11&4294967295|_>>>21),_=T+(A^m^y)+I[11]+1839030562&4294967295,T=A+(_<<16&4294967295|_>>>16),_=y+(T^A^m)+I[14]+4259657740&4294967295,y=T+(_<<23&4294967295|_>>>9),_=m+(y^T^A)+I[1]+2763975236&4294967295,m=y+(_<<4&4294967295|_>>>28),_=A+(m^y^T)+I[4]+1272893353&4294967295,A=m+(_<<11&4294967295|_>>>21),_=T+(A^m^y)+I[7]+4139469664&4294967295,T=A+(_<<16&4294967295|_>>>16),_=y+(T^A^m)+I[10]+3200236656&4294967295,y=T+(_<<23&4294967295|_>>>9),_=m+(y^T^A)+I[13]+681279174&4294967295,m=y+(_<<4&4294967295|_>>>28),_=A+(m^y^T)+I[0]+3936430074&4294967295,A=m+(_<<11&4294967295|_>>>21),_=T+(A^m^y)+I[3]+3572445317&4294967295,T=A+(_<<16&4294967295|_>>>16),_=y+(T^A^m)+I[6]+76029189&4294967295,y=T+(_<<23&4294967295|_>>>9),_=m+(y^T^A)+I[9]+3654602809&4294967295,m=y+(_<<4&4294967295|_>>>28),_=A+(m^y^T)+I[12]+3873151461&4294967295,A=m+(_<<11&4294967295|_>>>21),_=T+(A^m^y)+I[15]+530742520&4294967295,T=A+(_<<16&4294967295|_>>>16),_=y+(T^A^m)+I[2]+3299628645&4294967295,y=T+(_<<23&4294967295|_>>>9),_=m+(T^(y|~A))+I[0]+4096336452&4294967295,m=y+(_<<6&4294967295|_>>>26),_=A+(y^(m|~T))+I[7]+1126891415&4294967295,A=m+(_<<10&4294967295|_>>>22),_=T+(m^(A|~y))+I[14]+2878612391&4294967295,T=A+(_<<15&4294967295|_>>>17),_=y+(A^(T|~m))+I[5]+4237533241&4294967295,y=T+(_<<21&4294967295|_>>>11),_=m+(T^(y|~A))+I[12]+1700485571&4294967295,m=y+(_<<6&4294967295|_>>>26),_=A+(y^(m|~T))+I[3]+2399980690&4294967295,A=m+(_<<10&4294967295|_>>>22),_=T+(m^(A|~y))+I[10]+4293915773&4294967295,T=A+(_<<15&4294967295|_>>>17),_=y+(A^(T|~m))+I[1]+2240044497&4294967295,y=T+(_<<21&4294967295|_>>>11),_=m+(T^(y|~A))+I[8]+1873313359&4294967295,m=y+(_<<6&4294967295|_>>>26),_=A+(y^(m|~T))+I[15]+4264355552&4294967295,A=m+(_<<10&4294967295|_>>>22),_=T+(m^(A|~y))+I[6]+2734768916&4294967295,T=A+(_<<15&4294967295|_>>>17),_=y+(A^(T|~m))+I[13]+1309151649&4294967295,y=T+(_<<21&4294967295|_>>>11),_=m+(T^(y|~A))+I[4]+4149444226&4294967295,m=y+(_<<6&4294967295|_>>>26),_=A+(y^(m|~T))+I[11]+3174756917&4294967295,A=m+(_<<10&4294967295|_>>>22),_=T+(m^(A|~y))+I[2]+718787259&4294967295,T=A+(_<<15&4294967295|_>>>17),_=y+(A^(T|~m))+I[9]+3951481745&4294967295,E.g[0]=E.g[0]+m&4294967295,E.g[1]=E.g[1]+(T+(_<<21&4294967295|_>>>11))&4294967295,E.g[2]=E.g[2]+T&4294967295,E.g[3]=E.g[3]+A&4294967295}r.prototype.u=function(E,m){m===void 0&&(m=E.length);for(var y=m-this.blockSize,I=this.B,T=this.h,A=0;A<m;){if(T==0)for(;A<=y;)i(this,E,A),A+=this.blockSize;if(typeof E=="string"){for(;A<m;)if(I[T++]=E.charCodeAt(A++),T==this.blockSize){i(this,I),T=0;break}}else for(;A<m;)if(I[T++]=E[A++],T==this.blockSize){i(this,I),T=0;break}}this.h=T,this.o+=m},r.prototype.v=function(){var E=Array((56>this.h?this.blockSize:2*this.blockSize)-this.h);E[0]=128;for(var m=1;m<E.length-8;++m)E[m]=0;var y=8*this.o;for(m=E.length-8;m<E.length;++m)E[m]=y&255,y/=256;for(this.u(E),E=Array(16),m=y=0;4>m;++m)for(var I=0;32>I;I+=8)E[y++]=this.g[m]>>>I&255;return E};function s(E,m){var y=c;return Object.prototype.hasOwnProperty.call(y,E)?y[E]:y[E]=m(E)}function a(E,m){this.h=m;for(var y=[],I=!0,T=E.length-1;0<=T;T--){var A=E[T]|0;I&&A==m||(y[T]=A,I=!1)}this.g=y}var c={};function l(E){return-128<=E&&128>E?s(E,function(m){return new a([m|0],0>m?-1:0)}):new a([E|0],0>E?-1:0)}function d(E){if(isNaN(E)||!isFinite(E))return g;if(0>E)return D(d(-E));for(var m=[],y=1,I=0;E>=y;I++)m[I]=E/y|0,y*=4294967296;return new a(m,0)}function p(E,m){if(E.length==0)throw Error("number format error: empty string");if(m=m||10,2>m||36<m)throw Error("radix out of range: "+m);if(E.charAt(0)=="-")return D(p(E.substring(1),m));if(0<=E.indexOf("-"))throw Error('number format error: interior "-" character');for(var y=d(Math.pow(m,8)),I=g,T=0;T<E.length;T+=8){var A=Math.min(8,E.length-T),_=parseInt(E.substring(T,T+A),m);8>A?(A=d(Math.pow(m,A)),I=I.j(A).add(d(_))):(I=I.j(y),I=I.add(d(_)))}return I}var g=l(0),v=l(1),P=l(16777216);n=a.prototype,n.m=function(){if(L(this))return-D(this).m();for(var E=0,m=1,y=0;y<this.g.length;y++){var I=this.i(y);E+=(0<=I?I:4294967296+I)*m,m*=4294967296}return E},n.toString=function(E){if(E=E||10,2>E||36<E)throw Error("radix out of range: "+E);if(k(this))return"0";if(L(this))return"-"+D(this).toString(E);for(var m=d(Math.pow(E,6)),y=this,I="";;){var T=ne(y,m).g;y=$(y,T.j(m));var A=((0<y.g.length?y.g[0]:y.h)>>>0).toString(E);if(y=T,k(y))return A+I;for(;6>A.length;)A="0"+A;I=A+I}},n.i=function(E){return 0>E?0:E<this.g.length?this.g[E]:this.h};function k(E){if(E.h!=0)return!1;for(var m=0;m<E.g.length;m++)if(E.g[m]!=0)return!1;return!0}function L(E){return E.h==-1}n.l=function(E){return E=$(this,E),L(E)?-1:k(E)?0:1};function D(E){for(var m=E.g.length,y=[],I=0;I<m;I++)y[I]=~E.g[I];return new a(y,~E.h).add(v)}n.abs=function(){return L(this)?D(this):this},n.add=function(E){for(var m=Math.max(this.g.length,E.g.length),y=[],I=0,T=0;T<=m;T++){var A=I+(this.i(T)&65535)+(E.i(T)&65535),_=(A>>>16)+(this.i(T)>>>16)+(E.i(T)>>>16);I=_>>>16,A&=65535,_&=65535,y[T]=_<<16|A}return new a(y,y[y.length-1]&-2147483648?-1:0)};function $(E,m){return E.add(D(m))}n.j=function(E){if(k(this)||k(E))return g;if(L(this))return L(E)?D(this).j(D(E)):D(D(this).j(E));if(L(E))return D(this.j(D(E)));if(0>this.l(P)&&0>E.l(P))return d(this.m()*E.m());for(var m=this.g.length+E.g.length,y=[],I=0;I<2*m;I++)y[I]=0;for(I=0;I<this.g.length;I++)for(var T=0;T<E.g.length;T++){var A=this.i(I)>>>16,_=this.i(I)&65535,Ze=E.i(T)>>>16,Fn=E.i(T)&65535;y[2*I+2*T]+=_*Fn,q(y,2*I+2*T),y[2*I+2*T+1]+=A*Fn,q(y,2*I+2*T+1),y[2*I+2*T+1]+=_*Ze,q(y,2*I+2*T+1),y[2*I+2*T+2]+=A*Ze,q(y,2*I+2*T+2)}for(I=0;I<m;I++)y[I]=y[2*I+1]<<16|y[2*I];for(I=m;I<2*m;I++)y[I]=0;return new a(y,0)};function q(E,m){for(;(E[m]&65535)!=E[m];)E[m+1]+=E[m]>>>16,E[m]&=65535,m++}function H(E,m){this.g=E,this.h=m}function ne(E,m){if(k(m))throw Error("division by zero");if(k(E))return new H(g,g);if(L(E))return m=ne(D(E),m),new H(D(m.g),D(m.h));if(L(m))return m=ne(E,D(m)),new H(D(m.g),m.h);if(30<E.g.length){if(L(E)||L(m))throw Error("slowDivide_ only works with positive integers.");for(var y=v,I=m;0>=I.l(E);)y=Ue(y),I=Ue(I);var T=ae(y,1),A=ae(I,1);for(I=ae(I,2),y=ae(y,2);!k(I);){var _=A.add(I);0>=_.l(E)&&(T=T.add(y),A=_),I=ae(I,1),y=ae(y,1)}return m=$(E,T.j(m)),new H(T,m)}for(T=g;0<=E.l(m);){for(y=Math.max(1,Math.floor(E.m()/m.m())),I=Math.ceil(Math.log(y)/Math.LN2),I=48>=I?1:Math.pow(2,I-48),A=d(y),_=A.j(m);L(_)||0<_.l(E);)y-=I,A=d(y),_=A.j(m);k(A)&&(A=v),T=T.add(A),E=$(E,_)}return new H(T,E)}n.A=function(E){return ne(this,E).h},n.and=function(E){for(var m=Math.max(this.g.length,E.g.length),y=[],I=0;I<m;I++)y[I]=this.i(I)&E.i(I);return new a(y,this.h&E.h)},n.or=function(E){for(var m=Math.max(this.g.length,E.g.length),y=[],I=0;I<m;I++)y[I]=this.i(I)|E.i(I);return new a(y,this.h|E.h)},n.xor=function(E){for(var m=Math.max(this.g.length,E.g.length),y=[],I=0;I<m;I++)y[I]=this.i(I)^E.i(I);return new a(y,this.h^E.h)};function Ue(E){for(var m=E.g.length+1,y=[],I=0;I<m;I++)y[I]=E.i(I)<<1|E.i(I-1)>>>31;return new a(y,E.h)}function ae(E,m){var y=m>>5;m%=32;for(var I=E.g.length-y,T=[],A=0;A<I;A++)T[A]=0<m?E.i(A+y)>>>m|E.i(A+y+1)<<32-m:E.i(A+y);return new a(T,E.h)}r.prototype.digest=r.prototype.v,r.prototype.reset=r.prototype.s,r.prototype.update=r.prototype.u,Bh=r,a.prototype.add=a.prototype.add,a.prototype.multiply=a.prototype.j,a.prototype.modulo=a.prototype.A,a.prototype.compare=a.prototype.l,a.prototype.toNumber=a.prototype.m,a.prototype.toString=a.prototype.toString,a.prototype.getBits=a.prototype.i,a.fromNumber=d,a.fromString=p,kt=a}).apply(typeof Eu<"u"?Eu:typeof self<"u"?self:typeof window<"u"?window:{});var hi=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var qh,sr,jh,Ii,vo,$h,Hh,zh;(function(){var n,e=typeof Object.defineProperties=="function"?Object.defineProperty:function(o,u,h){return o==Array.prototype||o==Object.prototype||(o[u]=h.value),o};function t(o){o=[typeof globalThis=="object"&&globalThis,o,typeof window=="object"&&window,typeof self=="object"&&self,typeof hi=="object"&&hi];for(var u=0;u<o.length;++u){var h=o[u];if(h&&h.Math==Math)return h}throw Error("Cannot find global object")}var r=t(this);function i(o,u){if(u)e:{var h=r;o=o.split(".");for(var f=0;f<o.length-1;f++){var w=o[f];if(!(w in h))break e;h=h[w]}o=o[o.length-1],f=h[o],u=u(f),u!=f&&u!=null&&e(h,o,{configurable:!0,writable:!0,value:u})}}function s(o,u){o instanceof String&&(o+="");var h=0,f=!1,w={next:function(){if(!f&&h<o.length){var R=h++;return{value:u(R,o[R]),done:!1}}return f=!0,{done:!0,value:void 0}}};return w[Symbol.iterator]=function(){return w},w}i("Array.prototype.values",function(o){return o||function(){return s(this,function(u,h){return h})}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var a=a||{},c=this||self;function l(o){var u=typeof o;return u=u!="object"?u:o?Array.isArray(o)?"array":u:"null",u=="array"||u=="object"&&typeof o.length=="number"}function d(o){var u=typeof o;return u=="object"&&o!=null||u=="function"}function p(o,u,h){return o.call.apply(o.bind,arguments)}function g(o,u,h){if(!o)throw Error();if(2<arguments.length){var f=Array.prototype.slice.call(arguments,2);return function(){var w=Array.prototype.slice.call(arguments);return Array.prototype.unshift.apply(w,f),o.apply(u,w)}}return function(){return o.apply(u,arguments)}}function v(o,u,h){return v=Function.prototype.bind&&Function.prototype.bind.toString().indexOf("native code")!=-1?p:g,v.apply(null,arguments)}function P(o,u){var h=Array.prototype.slice.call(arguments,1);return function(){var f=h.slice();return f.push.apply(f,arguments),o.apply(this,f)}}function k(o,u){function h(){}h.prototype=u.prototype,o.aa=u.prototype,o.prototype=new h,o.prototype.constructor=o,o.Qb=function(f,w,R){for(var N=Array(arguments.length-2),Y=2;Y<arguments.length;Y++)N[Y-2]=arguments[Y];return u.prototype[w].apply(f,N)}}function L(o){const u=o.length;if(0<u){const h=Array(u);for(let f=0;f<u;f++)h[f]=o[f];return h}return[]}function D(o,u){for(let h=1;h<arguments.length;h++){const f=arguments[h];if(l(f)){const w=o.length||0,R=f.length||0;o.length=w+R;for(let N=0;N<R;N++)o[w+N]=f[N]}else o.push(f)}}class ${constructor(u,h){this.i=u,this.j=h,this.h=0,this.g=null}get(){let u;return 0<this.h?(this.h--,u=this.g,this.g=u.next,u.next=null):u=this.i(),u}}function q(o){return/^[\s\xa0]*$/.test(o)}function H(){var o=c.navigator;return o&&(o=o.userAgent)?o:""}function ne(o){return ne[" "](o),o}ne[" "]=function(){};var Ue=H().indexOf("Gecko")!=-1&&!(H().toLowerCase().indexOf("webkit")!=-1&&H().indexOf("Edge")==-1)&&!(H().indexOf("Trident")!=-1||H().indexOf("MSIE")!=-1)&&H().indexOf("Edge")==-1;function ae(o,u,h){for(const f in o)u.call(h,o[f],f,o)}function E(o,u){for(const h in o)u.call(void 0,o[h],h,o)}function m(o){const u={};for(const h in o)u[h]=o[h];return u}const y="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function I(o,u){let h,f;for(let w=1;w<arguments.length;w++){f=arguments[w];for(h in f)o[h]=f[h];for(let R=0;R<y.length;R++)h=y[R],Object.prototype.hasOwnProperty.call(f,h)&&(o[h]=f[h])}}function T(o){var u=1;o=o.split(":");const h=[];for(;0<u&&o.length;)h.push(o.shift()),u--;return o.length&&h.push(o.join(":")),h}function A(o){c.setTimeout(()=>{throw o},0)}function _(){var o=ws;let u=null;return o.g&&(u=o.g,o.g=o.g.next,o.g||(o.h=null),u.next=null),u}class Ze{constructor(){this.h=this.g=null}add(u,h){const f=Fn.get();f.set(u,h),this.h?this.h.next=f:this.g=f,this.h=f}}var Fn=new $(()=>new gf,o=>o.reset());class gf{constructor(){this.next=this.g=this.h=null}set(u,h){this.h=u,this.g=h,this.next=null}reset(){this.next=this.g=this.h=null}}let Un,Bn=!1,ws=new Ze,$a=()=>{const o=c.Promise.resolve(void 0);Un=()=>{o.then(_f)}};var _f=()=>{for(var o;o=_();){try{o.h.call(o.g)}catch(h){A(h)}var u=Fn;u.j(o),100>u.h&&(u.h++,o.next=u.g,u.g=o)}Bn=!1};function vt(){this.s=this.s,this.C=this.C}vt.prototype.s=!1,vt.prototype.ma=function(){this.s||(this.s=!0,this.N())},vt.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function Ee(o,u){this.type=o,this.g=this.target=u,this.defaultPrevented=!1}Ee.prototype.h=function(){this.defaultPrevented=!0};var yf=function(){if(!c.addEventListener||!Object.defineProperty)return!1;var o=!1,u=Object.defineProperty({},"passive",{get:function(){o=!0}});try{const h=()=>{};c.addEventListener("test",h,u),c.removeEventListener("test",h,u)}catch{}return o}();function qn(o,u){if(Ee.call(this,o?o.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,o){var h=this.type=o.type,f=o.changedTouches&&o.changedTouches.length?o.changedTouches[0]:null;if(this.target=o.target||o.srcElement,this.g=u,u=o.relatedTarget){if(Ue){e:{try{ne(u.nodeName);var w=!0;break e}catch{}w=!1}w||(u=null)}}else h=="mouseover"?u=o.fromElement:h=="mouseout"&&(u=o.toElement);this.relatedTarget=u,f?(this.clientX=f.clientX!==void 0?f.clientX:f.pageX,this.clientY=f.clientY!==void 0?f.clientY:f.pageY,this.screenX=f.screenX||0,this.screenY=f.screenY||0):(this.clientX=o.clientX!==void 0?o.clientX:o.pageX,this.clientY=o.clientY!==void 0?o.clientY:o.pageY,this.screenX=o.screenX||0,this.screenY=o.screenY||0),this.button=o.button,this.key=o.key||"",this.ctrlKey=o.ctrlKey,this.altKey=o.altKey,this.shiftKey=o.shiftKey,this.metaKey=o.metaKey,this.pointerId=o.pointerId||0,this.pointerType=typeof o.pointerType=="string"?o.pointerType:vf[o.pointerType]||"",this.state=o.state,this.i=o,o.defaultPrevented&&qn.aa.h.call(this)}}k(qn,Ee);var vf={2:"touch",3:"pen",4:"mouse"};qn.prototype.h=function(){qn.aa.h.call(this);var o=this.i;o.preventDefault?o.preventDefault():o.returnValue=!1};var Hr="closure_listenable_"+(1e6*Math.random()|0),If=0;function Ef(o,u,h,f,w){this.listener=o,this.proxy=null,this.src=u,this.type=h,this.capture=!!f,this.ha=w,this.key=++If,this.da=this.fa=!1}function zr(o){o.da=!0,o.listener=null,o.proxy=null,o.src=null,o.ha=null}function Wr(o){this.src=o,this.g={},this.h=0}Wr.prototype.add=function(o,u,h,f,w){var R=o.toString();o=this.g[R],o||(o=this.g[R]=[],this.h++);var N=Rs(o,u,f,w);return-1<N?(u=o[N],h||(u.fa=!1)):(u=new Ef(u,this.src,R,!!f,w),u.fa=h,o.push(u)),u};function As(o,u){var h=u.type;if(h in o.g){var f=o.g[h],w=Array.prototype.indexOf.call(f,u,void 0),R;(R=0<=w)&&Array.prototype.splice.call(f,w,1),R&&(zr(u),o.g[h].length==0&&(delete o.g[h],o.h--))}}function Rs(o,u,h,f){for(var w=0;w<o.length;++w){var R=o[w];if(!R.da&&R.listener==u&&R.capture==!!h&&R.ha==f)return w}return-1}var Ss="closure_lm_"+(1e6*Math.random()|0),Ps={};function Ha(o,u,h,f,w){if(Array.isArray(u)){for(var R=0;R<u.length;R++)Ha(o,u[R],h,f,w);return null}return h=Ga(h),o&&o[Hr]?o.K(u,h,d(f)?!!f.capture:!1,w):Tf(o,u,h,!1,f,w)}function Tf(o,u,h,f,w,R){if(!u)throw Error("Invalid event type");var N=d(w)?!!w.capture:!!w,Y=Cs(o);if(Y||(o[Ss]=Y=new Wr(o)),h=Y.add(u,h,f,N,R),h.proxy)return h;if(f=wf(),h.proxy=f,f.src=o,f.listener=h,o.addEventListener)yf||(w=N),w===void 0&&(w=!1),o.addEventListener(u.toString(),f,w);else if(o.attachEvent)o.attachEvent(Wa(u.toString()),f);else if(o.addListener&&o.removeListener)o.addListener(f);else throw Error("addEventListener and attachEvent are unavailable.");return h}function wf(){function o(h){return u.call(o.src,o.listener,h)}const u=Af;return o}function za(o,u,h,f,w){if(Array.isArray(u))for(var R=0;R<u.length;R++)za(o,u[R],h,f,w);else f=d(f)?!!f.capture:!!f,h=Ga(h),o&&o[Hr]?(o=o.i,u=String(u).toString(),u in o.g&&(R=o.g[u],h=Rs(R,h,f,w),-1<h&&(zr(R[h]),Array.prototype.splice.call(R,h,1),R.length==0&&(delete o.g[u],o.h--)))):o&&(o=Cs(o))&&(u=o.g[u.toString()],o=-1,u&&(o=Rs(u,h,f,w)),(h=-1<o?u[o]:null)&&bs(h))}function bs(o){if(typeof o!="number"&&o&&!o.da){var u=o.src;if(u&&u[Hr])As(u.i,o);else{var h=o.type,f=o.proxy;u.removeEventListener?u.removeEventListener(h,f,o.capture):u.detachEvent?u.detachEvent(Wa(h),f):u.addListener&&u.removeListener&&u.removeListener(f),(h=Cs(u))?(As(h,o),h.h==0&&(h.src=null,u[Ss]=null)):zr(o)}}}function Wa(o){return o in Ps?Ps[o]:Ps[o]="on"+o}function Af(o,u){if(o.da)o=!0;else{u=new qn(u,this);var h=o.listener,f=o.ha||o.src;o.fa&&bs(o),o=h.call(f,u)}return o}function Cs(o){return o=o[Ss],o instanceof Wr?o:null}var ks="__closure_events_fn_"+(1e9*Math.random()>>>0);function Ga(o){return typeof o=="function"?o:(o[ks]||(o[ks]=function(u){return o.handleEvent(u)}),o[ks])}function Te(){vt.call(this),this.i=new Wr(this),this.M=this,this.F=null}k(Te,vt),Te.prototype[Hr]=!0,Te.prototype.removeEventListener=function(o,u,h,f){za(this,o,u,h,f)};function Ce(o,u){var h,f=o.F;if(f)for(h=[];f;f=f.F)h.push(f);if(o=o.M,f=u.type||u,typeof u=="string")u=new Ee(u,o);else if(u instanceof Ee)u.target=u.target||o;else{var w=u;u=new Ee(f,o),I(u,w)}if(w=!0,h)for(var R=h.length-1;0<=R;R--){var N=u.g=h[R];w=Gr(N,f,!0,u)&&w}if(N=u.g=o,w=Gr(N,f,!0,u)&&w,w=Gr(N,f,!1,u)&&w,h)for(R=0;R<h.length;R++)N=u.g=h[R],w=Gr(N,f,!1,u)&&w}Te.prototype.N=function(){if(Te.aa.N.call(this),this.i){var o=this.i,u;for(u in o.g){for(var h=o.g[u],f=0;f<h.length;f++)zr(h[f]);delete o.g[u],o.h--}}this.F=null},Te.prototype.K=function(o,u,h,f){return this.i.add(String(o),u,!1,h,f)},Te.prototype.L=function(o,u,h,f){return this.i.add(String(o),u,!0,h,f)};function Gr(o,u,h,f){if(u=o.i.g[String(u)],!u)return!0;u=u.concat();for(var w=!0,R=0;R<u.length;++R){var N=u[R];if(N&&!N.da&&N.capture==h){var Y=N.listener,_e=N.ha||N.src;N.fa&&As(o.i,N),w=Y.call(_e,f)!==!1&&w}}return w&&!f.defaultPrevented}function Ka(o,u,h){if(typeof o=="function")h&&(o=v(o,h));else if(o&&typeof o.handleEvent=="function")o=v(o.handleEvent,o);else throw Error("Invalid listener argument");return 2147483647<Number(u)?-1:c.setTimeout(o,u||0)}function Qa(o){o.g=Ka(()=>{o.g=null,o.i&&(o.i=!1,Qa(o))},o.l);const u=o.h;o.h=null,o.m.apply(null,u)}class Rf extends vt{constructor(u,h){super(),this.m=u,this.l=h,this.h=null,this.i=!1,this.g=null}j(u){this.h=arguments,this.g?this.i=!0:Qa(this)}N(){super.N(),this.g&&(c.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function jn(o){vt.call(this),this.h=o,this.g={}}k(jn,vt);var Ya=[];function Ja(o){ae(o.g,function(u,h){this.g.hasOwnProperty(h)&&bs(u)},o),o.g={}}jn.prototype.N=function(){jn.aa.N.call(this),Ja(this)},jn.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Ns=c.JSON.stringify,Sf=c.JSON.parse,Pf=class{stringify(o){return c.JSON.stringify(o,void 0)}parse(o){return c.JSON.parse(o,void 0)}};function Ds(){}Ds.prototype.h=null;function Xa(o){return o.h||(o.h=o.i())}function Za(){}var $n={OPEN:"a",kb:"b",Ja:"c",wb:"d"};function Os(){Ee.call(this,"d")}k(Os,Ee);function Vs(){Ee.call(this,"c")}k(Vs,Ee);var $t={},ec=null;function Kr(){return ec=ec||new Te}$t.La="serverreachability";function tc(o){Ee.call(this,$t.La,o)}k(tc,Ee);function Hn(o){const u=Kr();Ce(u,new tc(u))}$t.STAT_EVENT="statevent";function nc(o,u){Ee.call(this,$t.STAT_EVENT,o),this.stat=u}k(nc,Ee);function ke(o){const u=Kr();Ce(u,new nc(u,o))}$t.Ma="timingevent";function rc(o,u){Ee.call(this,$t.Ma,o),this.size=u}k(rc,Ee);function zn(o,u){if(typeof o!="function")throw Error("Fn must not be null and must be a function");return c.setTimeout(function(){o()},u)}function Wn(){this.g=!0}Wn.prototype.xa=function(){this.g=!1};function bf(o,u,h,f,w,R){o.info(function(){if(o.g)if(R)for(var N="",Y=R.split("&"),_e=0;_e<Y.length;_e++){var K=Y[_e].split("=");if(1<K.length){var we=K[0];K=K[1];var Ae=we.split("_");N=2<=Ae.length&&Ae[1]=="type"?N+(we+"="+K+"&"):N+(we+"=redacted&")}}else N=null;else N=R;return"XMLHTTP REQ ("+f+") [attempt "+w+"]: "+u+`
`+h+`
`+N})}function Cf(o,u,h,f,w,R,N){o.info(function(){return"XMLHTTP RESP ("+f+") [ attempt "+w+"]: "+u+`
`+h+`
`+R+" "+N})}function an(o,u,h,f){o.info(function(){return"XMLHTTP TEXT ("+u+"): "+Nf(o,h)+(f?" "+f:"")})}function kf(o,u){o.info(function(){return"TIMEOUT: "+u})}Wn.prototype.info=function(){};function Nf(o,u){if(!o.g)return u;if(!u)return null;try{var h=JSON.parse(u);if(h){for(o=0;o<h.length;o++)if(Array.isArray(h[o])){var f=h[o];if(!(2>f.length)){var w=f[1];if(Array.isArray(w)&&!(1>w.length)){var R=w[0];if(R!="noop"&&R!="stop"&&R!="close")for(var N=1;N<w.length;N++)w[N]=""}}}}return Ns(h)}catch{return u}}var Qr={NO_ERROR:0,gb:1,tb:2,sb:3,nb:4,rb:5,ub:6,Ia:7,TIMEOUT:8,xb:9},ic={lb:"complete",Hb:"success",Ja:"error",Ia:"abort",zb:"ready",Ab:"readystatechange",TIMEOUT:"timeout",vb:"incrementaldata",yb:"progress",ob:"downloadprogress",Pb:"uploadprogress"},Ls;function Yr(){}k(Yr,Ds),Yr.prototype.g=function(){return new XMLHttpRequest},Yr.prototype.i=function(){return{}},Ls=new Yr;function It(o,u,h,f){this.j=o,this.i=u,this.l=h,this.R=f||1,this.U=new jn(this),this.I=45e3,this.H=null,this.o=!1,this.m=this.A=this.v=this.L=this.F=this.S=this.B=null,this.D=[],this.g=null,this.C=0,this.s=this.u=null,this.X=-1,this.J=!1,this.O=0,this.M=null,this.W=this.K=this.T=this.P=!1,this.h=new sc}function sc(){this.i=null,this.g="",this.h=!1}var oc={},Ms={};function xs(o,u,h){o.L=1,o.v=ei(et(u)),o.m=h,o.P=!0,ac(o,null)}function ac(o,u){o.F=Date.now(),Jr(o),o.A=et(o.v);var h=o.A,f=o.R;Array.isArray(f)||(f=[String(f)]),Ec(h.i,"t",f),o.C=0,h=o.j.J,o.h=new sc,o.g=Uc(o.j,h?u:null,!o.m),0<o.O&&(o.M=new Rf(v(o.Y,o,o.g),o.O)),u=o.U,h=o.g,f=o.ca;var w="readystatechange";Array.isArray(w)||(w&&(Ya[0]=w.toString()),w=Ya);for(var R=0;R<w.length;R++){var N=Ha(h,w[R],f||u.handleEvent,!1,u.h||u);if(!N)break;u.g[N.key]=N}u=o.H?m(o.H):{},o.m?(o.u||(o.u="POST"),u["Content-Type"]="application/x-www-form-urlencoded",o.g.ea(o.A,o.u,o.m,u)):(o.u="GET",o.g.ea(o.A,o.u,null,u)),Hn(),bf(o.i,o.u,o.A,o.l,o.R,o.m)}It.prototype.ca=function(o){o=o.target;const u=this.M;u&&tt(o)==3?u.j():this.Y(o)},It.prototype.Y=function(o){try{if(o==this.g)e:{const Ae=tt(this.g);var u=this.g.Ba();const ln=this.g.Z();if(!(3>Ae)&&(Ae!=3||this.g&&(this.h.h||this.g.oa()||bc(this.g)))){this.J||Ae!=4||u==7||(u==8||0>=ln?Hn(3):Hn(2)),Fs(this);var h=this.g.Z();this.X=h;t:if(cc(this)){var f=bc(this.g);o="";var w=f.length,R=tt(this.g)==4;if(!this.h.i){if(typeof TextDecoder>"u"){Ht(this),Gn(this);var N="";break t}this.h.i=new c.TextDecoder}for(u=0;u<w;u++)this.h.h=!0,o+=this.h.i.decode(f[u],{stream:!(R&&u==w-1)});f.length=0,this.h.g+=o,this.C=0,N=this.h.g}else N=this.g.oa();if(this.o=h==200,Cf(this.i,this.u,this.A,this.l,this.R,Ae,h),this.o){if(this.T&&!this.K){t:{if(this.g){var Y,_e=this.g;if((Y=_e.g?_e.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!q(Y)){var K=Y;break t}}K=null}if(h=K)an(this.i,this.l,h,"Initial handshake response via X-HTTP-Initial-Response"),this.K=!0,Us(this,h);else{this.o=!1,this.s=3,ke(12),Ht(this),Gn(this);break e}}if(this.P){h=!0;let je;for(;!this.J&&this.C<N.length;)if(je=Df(this,N),je==Ms){Ae==4&&(this.s=4,ke(14),h=!1),an(this.i,this.l,null,"[Incomplete Response]");break}else if(je==oc){this.s=4,ke(15),an(this.i,this.l,N,"[Invalid Chunk]"),h=!1;break}else an(this.i,this.l,je,null),Us(this,je);if(cc(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),Ae!=4||N.length!=0||this.h.h||(this.s=1,ke(16),h=!1),this.o=this.o&&h,!h)an(this.i,this.l,N,"[Invalid Chunked Response]"),Ht(this),Gn(this);else if(0<N.length&&!this.W){this.W=!0;var we=this.j;we.g==this&&we.ba&&!we.M&&(we.j.info("Great, no buffering proxy detected. Bytes received: "+N.length),zs(we),we.M=!0,ke(11))}}else an(this.i,this.l,N,null),Us(this,N);Ae==4&&Ht(this),this.o&&!this.J&&(Ae==4?Lc(this.j,this):(this.o=!1,Jr(this)))}else Qf(this.g),h==400&&0<N.indexOf("Unknown SID")?(this.s=3,ke(12)):(this.s=0,ke(13)),Ht(this),Gn(this)}}}catch{}finally{}};function cc(o){return o.g?o.u=="GET"&&o.L!=2&&o.j.Ca:!1}function Df(o,u){var h=o.C,f=u.indexOf(`
`,h);return f==-1?Ms:(h=Number(u.substring(h,f)),isNaN(h)?oc:(f+=1,f+h>u.length?Ms:(u=u.slice(f,f+h),o.C=f+h,u)))}It.prototype.cancel=function(){this.J=!0,Ht(this)};function Jr(o){o.S=Date.now()+o.I,uc(o,o.I)}function uc(o,u){if(o.B!=null)throw Error("WatchDog timer not null");o.B=zn(v(o.ba,o),u)}function Fs(o){o.B&&(c.clearTimeout(o.B),o.B=null)}It.prototype.ba=function(){this.B=null;const o=Date.now();0<=o-this.S?(kf(this.i,this.A),this.L!=2&&(Hn(),ke(17)),Ht(this),this.s=2,Gn(this)):uc(this,this.S-o)};function Gn(o){o.j.G==0||o.J||Lc(o.j,o)}function Ht(o){Fs(o);var u=o.M;u&&typeof u.ma=="function"&&u.ma(),o.M=null,Ja(o.U),o.g&&(u=o.g,o.g=null,u.abort(),u.ma())}function Us(o,u){try{var h=o.j;if(h.G!=0&&(h.g==o||Bs(h.h,o))){if(!o.K&&Bs(h.h,o)&&h.G==3){try{var f=h.Da.g.parse(u)}catch{f=null}if(Array.isArray(f)&&f.length==3){var w=f;if(w[0]==0){e:if(!h.u){if(h.g)if(h.g.F+3e3<o.F)oi(h),ii(h);else break e;Hs(h),ke(18)}}else h.za=w[1],0<h.za-h.T&&37500>w[2]&&h.F&&h.v==0&&!h.C&&(h.C=zn(v(h.Za,h),6e3));if(1>=dc(h.h)&&h.ca){try{h.ca()}catch{}h.ca=void 0}}else Wt(h,11)}else if((o.K||h.g==o)&&oi(h),!q(u))for(w=h.Da.g.parse(u),u=0;u<w.length;u++){let K=w[u];if(h.T=K[0],K=K[1],h.G==2)if(K[0]=="c"){h.K=K[1],h.ia=K[2];const we=K[3];we!=null&&(h.la=we,h.j.info("VER="+h.la));const Ae=K[4];Ae!=null&&(h.Aa=Ae,h.j.info("SVER="+h.Aa));const ln=K[5];ln!=null&&typeof ln=="number"&&0<ln&&(f=1.5*ln,h.L=f,h.j.info("backChannelRequestTimeoutMs_="+f)),f=h;const je=o.g;if(je){const ci=je.g?je.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(ci){var R=f.h;R.g||ci.indexOf("spdy")==-1&&ci.indexOf("quic")==-1&&ci.indexOf("h2")==-1||(R.j=R.l,R.g=new Set,R.h&&(qs(R,R.h),R.h=null))}if(f.D){const Ws=je.g?je.g.getResponseHeader("X-HTTP-Session-Id"):null;Ws&&(f.ya=Ws,X(f.I,f.D,Ws))}}h.G=3,h.l&&h.l.ua(),h.ba&&(h.R=Date.now()-o.F,h.j.info("Handshake RTT: "+h.R+"ms")),f=h;var N=o;if(f.qa=Fc(f,f.J?f.ia:null,f.W),N.K){fc(f.h,N);var Y=N,_e=f.L;_e&&(Y.I=_e),Y.B&&(Fs(Y),Jr(Y)),f.g=N}else Oc(f);0<h.i.length&&si(h)}else K[0]!="stop"&&K[0]!="close"||Wt(h,7);else h.G==3&&(K[0]=="stop"||K[0]=="close"?K[0]=="stop"?Wt(h,7):$s(h):K[0]!="noop"&&h.l&&h.l.ta(K),h.v=0)}}Hn(4)}catch{}}var Of=class{constructor(o,u){this.g=o,this.map=u}};function lc(o){this.l=o||10,c.PerformanceNavigationTiming?(o=c.performance.getEntriesByType("navigation"),o=0<o.length&&(o[0].nextHopProtocol=="hq"||o[0].nextHopProtocol=="h2")):o=!!(c.chrome&&c.chrome.loadTimes&&c.chrome.loadTimes()&&c.chrome.loadTimes().wasFetchedViaSpdy),this.j=o?this.l:1,this.g=null,1<this.j&&(this.g=new Set),this.h=null,this.i=[]}function hc(o){return o.h?!0:o.g?o.g.size>=o.j:!1}function dc(o){return o.h?1:o.g?o.g.size:0}function Bs(o,u){return o.h?o.h==u:o.g?o.g.has(u):!1}function qs(o,u){o.g?o.g.add(u):o.h=u}function fc(o,u){o.h&&o.h==u?o.h=null:o.g&&o.g.has(u)&&o.g.delete(u)}lc.prototype.cancel=function(){if(this.i=pc(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const o of this.g.values())o.cancel();this.g.clear()}};function pc(o){if(o.h!=null)return o.i.concat(o.h.D);if(o.g!=null&&o.g.size!==0){let u=o.i;for(const h of o.g.values())u=u.concat(h.D);return u}return L(o.i)}function Vf(o){if(o.V&&typeof o.V=="function")return o.V();if(typeof Map<"u"&&o instanceof Map||typeof Set<"u"&&o instanceof Set)return Array.from(o.values());if(typeof o=="string")return o.split("");if(l(o)){for(var u=[],h=o.length,f=0;f<h;f++)u.push(o[f]);return u}u=[],h=0;for(f in o)u[h++]=o[f];return u}function Lf(o){if(o.na&&typeof o.na=="function")return o.na();if(!o.V||typeof o.V!="function"){if(typeof Map<"u"&&o instanceof Map)return Array.from(o.keys());if(!(typeof Set<"u"&&o instanceof Set)){if(l(o)||typeof o=="string"){var u=[];o=o.length;for(var h=0;h<o;h++)u.push(h);return u}u=[],h=0;for(const f in o)u[h++]=f;return u}}}function mc(o,u){if(o.forEach&&typeof o.forEach=="function")o.forEach(u,void 0);else if(l(o)||typeof o=="string")Array.prototype.forEach.call(o,u,void 0);else for(var h=Lf(o),f=Vf(o),w=f.length,R=0;R<w;R++)u.call(void 0,f[R],h&&h[R],o)}var gc=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function Mf(o,u){if(o){o=o.split("&");for(var h=0;h<o.length;h++){var f=o[h].indexOf("="),w=null;if(0<=f){var R=o[h].substring(0,f);w=o[h].substring(f+1)}else R=o[h];u(R,w?decodeURIComponent(w.replace(/\+/g," ")):"")}}}function zt(o){if(this.g=this.o=this.j="",this.s=null,this.m=this.l="",this.h=!1,o instanceof zt){this.h=o.h,Xr(this,o.j),this.o=o.o,this.g=o.g,Zr(this,o.s),this.l=o.l;var u=o.i,h=new Yn;h.i=u.i,u.g&&(h.g=new Map(u.g),h.h=u.h),_c(this,h),this.m=o.m}else o&&(u=String(o).match(gc))?(this.h=!1,Xr(this,u[1]||"",!0),this.o=Kn(u[2]||""),this.g=Kn(u[3]||"",!0),Zr(this,u[4]),this.l=Kn(u[5]||"",!0),_c(this,u[6]||"",!0),this.m=Kn(u[7]||"")):(this.h=!1,this.i=new Yn(null,this.h))}zt.prototype.toString=function(){var o=[],u=this.j;u&&o.push(Qn(u,yc,!0),":");var h=this.g;return(h||u=="file")&&(o.push("//"),(u=this.o)&&o.push(Qn(u,yc,!0),"@"),o.push(encodeURIComponent(String(h)).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),h=this.s,h!=null&&o.push(":",String(h))),(h=this.l)&&(this.g&&h.charAt(0)!="/"&&o.push("/"),o.push(Qn(h,h.charAt(0)=="/"?Uf:Ff,!0))),(h=this.i.toString())&&o.push("?",h),(h=this.m)&&o.push("#",Qn(h,qf)),o.join("")};function et(o){return new zt(o)}function Xr(o,u,h){o.j=h?Kn(u,!0):u,o.j&&(o.j=o.j.replace(/:$/,""))}function Zr(o,u){if(u){if(u=Number(u),isNaN(u)||0>u)throw Error("Bad port number "+u);o.s=u}else o.s=null}function _c(o,u,h){u instanceof Yn?(o.i=u,jf(o.i,o.h)):(h||(u=Qn(u,Bf)),o.i=new Yn(u,o.h))}function X(o,u,h){o.i.set(u,h)}function ei(o){return X(o,"zx",Math.floor(2147483648*Math.random()).toString(36)+Math.abs(Math.floor(2147483648*Math.random())^Date.now()).toString(36)),o}function Kn(o,u){return o?u?decodeURI(o.replace(/%25/g,"%2525")):decodeURIComponent(o):""}function Qn(o,u,h){return typeof o=="string"?(o=encodeURI(o).replace(u,xf),h&&(o=o.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),o):null}function xf(o){return o=o.charCodeAt(0),"%"+(o>>4&15).toString(16)+(o&15).toString(16)}var yc=/[#\/\?@]/g,Ff=/[#\?:]/g,Uf=/[#\?]/g,Bf=/[#\?@]/g,qf=/#/g;function Yn(o,u){this.h=this.g=null,this.i=o||null,this.j=!!u}function Et(o){o.g||(o.g=new Map,o.h=0,o.i&&Mf(o.i,function(u,h){o.add(decodeURIComponent(u.replace(/\+/g," ")),h)}))}n=Yn.prototype,n.add=function(o,u){Et(this),this.i=null,o=cn(this,o);var h=this.g.get(o);return h||this.g.set(o,h=[]),h.push(u),this.h+=1,this};function vc(o,u){Et(o),u=cn(o,u),o.g.has(u)&&(o.i=null,o.h-=o.g.get(u).length,o.g.delete(u))}function Ic(o,u){return Et(o),u=cn(o,u),o.g.has(u)}n.forEach=function(o,u){Et(this),this.g.forEach(function(h,f){h.forEach(function(w){o.call(u,w,f,this)},this)},this)},n.na=function(){Et(this);const o=Array.from(this.g.values()),u=Array.from(this.g.keys()),h=[];for(let f=0;f<u.length;f++){const w=o[f];for(let R=0;R<w.length;R++)h.push(u[f])}return h},n.V=function(o){Et(this);let u=[];if(typeof o=="string")Ic(this,o)&&(u=u.concat(this.g.get(cn(this,o))));else{o=Array.from(this.g.values());for(let h=0;h<o.length;h++)u=u.concat(o[h])}return u},n.set=function(o,u){return Et(this),this.i=null,o=cn(this,o),Ic(this,o)&&(this.h-=this.g.get(o).length),this.g.set(o,[u]),this.h+=1,this},n.get=function(o,u){return o?(o=this.V(o),0<o.length?String(o[0]):u):u};function Ec(o,u,h){vc(o,u),0<h.length&&(o.i=null,o.g.set(cn(o,u),L(h)),o.h+=h.length)}n.toString=function(){if(this.i)return this.i;if(!this.g)return"";const o=[],u=Array.from(this.g.keys());for(var h=0;h<u.length;h++){var f=u[h];const R=encodeURIComponent(String(f)),N=this.V(f);for(f=0;f<N.length;f++){var w=R;N[f]!==""&&(w+="="+encodeURIComponent(String(N[f]))),o.push(w)}}return this.i=o.join("&")};function cn(o,u){return u=String(u),o.j&&(u=u.toLowerCase()),u}function jf(o,u){u&&!o.j&&(Et(o),o.i=null,o.g.forEach(function(h,f){var w=f.toLowerCase();f!=w&&(vc(this,f),Ec(this,w,h))},o)),o.j=u}function $f(o,u){const h=new Wn;if(c.Image){const f=new Image;f.onload=P(Tt,h,"TestLoadImage: loaded",!0,u,f),f.onerror=P(Tt,h,"TestLoadImage: error",!1,u,f),f.onabort=P(Tt,h,"TestLoadImage: abort",!1,u,f),f.ontimeout=P(Tt,h,"TestLoadImage: timeout",!1,u,f),c.setTimeout(function(){f.ontimeout&&f.ontimeout()},1e4),f.src=o}else u(!1)}function Hf(o,u){const h=new Wn,f=new AbortController,w=setTimeout(()=>{f.abort(),Tt(h,"TestPingServer: timeout",!1,u)},1e4);fetch(o,{signal:f.signal}).then(R=>{clearTimeout(w),R.ok?Tt(h,"TestPingServer: ok",!0,u):Tt(h,"TestPingServer: server error",!1,u)}).catch(()=>{clearTimeout(w),Tt(h,"TestPingServer: error",!1,u)})}function Tt(o,u,h,f,w){try{w&&(w.onload=null,w.onerror=null,w.onabort=null,w.ontimeout=null),f(h)}catch{}}function zf(){this.g=new Pf}function Wf(o,u,h){const f=h||"";try{mc(o,function(w,R){let N=w;d(w)&&(N=Ns(w)),u.push(f+R+"="+encodeURIComponent(N))})}catch(w){throw u.push(f+"type="+encodeURIComponent("_badmap")),w}}function ti(o){this.l=o.Ub||null,this.j=o.eb||!1}k(ti,Ds),ti.prototype.g=function(){return new ni(this.l,this.j)},ti.prototype.i=function(o){return function(){return o}}({});function ni(o,u){Te.call(this),this.D=o,this.o=u,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.u=new Headers,this.h=null,this.B="GET",this.A="",this.g=!1,this.v=this.j=this.l=null}k(ni,Te),n=ni.prototype,n.open=function(o,u){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.B=o,this.A=u,this.readyState=1,Xn(this)},n.send=function(o){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");this.g=!0;const u={headers:this.u,method:this.B,credentials:this.m,cache:void 0};o&&(u.body=o),(this.D||c).fetch(new Request(this.A,u)).then(this.Sa.bind(this),this.ga.bind(this))},n.abort=function(){this.response=this.responseText="",this.u=new Headers,this.status=0,this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),1<=this.readyState&&this.g&&this.readyState!=4&&(this.g=!1,Jn(this)),this.readyState=0},n.Sa=function(o){if(this.g&&(this.l=o,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=o.headers,this.readyState=2,Xn(this)),this.g&&(this.readyState=3,Xn(this),this.g)))if(this.responseType==="arraybuffer")o.arrayBuffer().then(this.Qa.bind(this),this.ga.bind(this));else if(typeof c.ReadableStream<"u"&&"body"in o){if(this.j=o.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.v=new TextDecoder;Tc(this)}else o.text().then(this.Ra.bind(this),this.ga.bind(this))};function Tc(o){o.j.read().then(o.Pa.bind(o)).catch(o.ga.bind(o))}n.Pa=function(o){if(this.g){if(this.o&&o.value)this.response.push(o.value);else if(!this.o){var u=o.value?o.value:new Uint8Array(0);(u=this.v.decode(u,{stream:!o.done}))&&(this.response=this.responseText+=u)}o.done?Jn(this):Xn(this),this.readyState==3&&Tc(this)}},n.Ra=function(o){this.g&&(this.response=this.responseText=o,Jn(this))},n.Qa=function(o){this.g&&(this.response=o,Jn(this))},n.ga=function(){this.g&&Jn(this)};function Jn(o){o.readyState=4,o.l=null,o.j=null,o.v=null,Xn(o)}n.setRequestHeader=function(o,u){this.u.append(o,u)},n.getResponseHeader=function(o){return this.h&&this.h.get(o.toLowerCase())||""},n.getAllResponseHeaders=function(){if(!this.h)return"";const o=[],u=this.h.entries();for(var h=u.next();!h.done;)h=h.value,o.push(h[0]+": "+h[1]),h=u.next();return o.join(`\r
`)};function Xn(o){o.onreadystatechange&&o.onreadystatechange.call(o)}Object.defineProperty(ni.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(o){this.m=o?"include":"same-origin"}});function wc(o){let u="";return ae(o,function(h,f){u+=f,u+=":",u+=h,u+=`\r
`}),u}function js(o,u,h){e:{for(f in h){var f=!1;break e}f=!0}f||(h=wc(h),typeof o=="string"?h!=null&&encodeURIComponent(String(h)):X(o,u,h))}function se(o){Te.call(this),this.headers=new Map,this.o=o||null,this.h=!1,this.v=this.g=null,this.D="",this.m=0,this.l="",this.j=this.B=this.u=this.A=!1,this.I=null,this.H="",this.J=!1}k(se,Te);var Gf=/^https?$/i,Kf=["POST","PUT"];n=se.prototype,n.Ha=function(o){this.J=o},n.ea=function(o,u,h,f){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+o);u=u?u.toUpperCase():"GET",this.D=o,this.l="",this.m=0,this.A=!1,this.h=!0,this.g=this.o?this.o.g():Ls.g(),this.v=this.o?Xa(this.o):Xa(Ls),this.g.onreadystatechange=v(this.Ea,this);try{this.B=!0,this.g.open(u,String(o),!0),this.B=!1}catch(R){Ac(this,R);return}if(o=h||"",h=new Map(this.headers),f)if(Object.getPrototypeOf(f)===Object.prototype)for(var w in f)h.set(w,f[w]);else if(typeof f.keys=="function"&&typeof f.get=="function")for(const R of f.keys())h.set(R,f.get(R));else throw Error("Unknown input type for opt_headers: "+String(f));f=Array.from(h.keys()).find(R=>R.toLowerCase()=="content-type"),w=c.FormData&&o instanceof c.FormData,!(0<=Array.prototype.indexOf.call(Kf,u,void 0))||f||w||h.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[R,N]of h)this.g.setRequestHeader(R,N);this.H&&(this.g.responseType=this.H),"withCredentials"in this.g&&this.g.withCredentials!==this.J&&(this.g.withCredentials=this.J);try{Pc(this),this.u=!0,this.g.send(o),this.u=!1}catch(R){Ac(this,R)}};function Ac(o,u){o.h=!1,o.g&&(o.j=!0,o.g.abort(),o.j=!1),o.l=u,o.m=5,Rc(o),ri(o)}function Rc(o){o.A||(o.A=!0,Ce(o,"complete"),Ce(o,"error"))}n.abort=function(o){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.m=o||7,Ce(this,"complete"),Ce(this,"abort"),ri(this))},n.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),ri(this,!0)),se.aa.N.call(this)},n.Ea=function(){this.s||(this.B||this.u||this.j?Sc(this):this.bb())},n.bb=function(){Sc(this)};function Sc(o){if(o.h&&typeof a<"u"&&(!o.v[1]||tt(o)!=4||o.Z()!=2)){if(o.u&&tt(o)==4)Ka(o.Ea,0,o);else if(Ce(o,"readystatechange"),tt(o)==4){o.h=!1;try{const N=o.Z();e:switch(N){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var u=!0;break e;default:u=!1}var h;if(!(h=u)){var f;if(f=N===0){var w=String(o.D).match(gc)[1]||null;!w&&c.self&&c.self.location&&(w=c.self.location.protocol.slice(0,-1)),f=!Gf.test(w?w.toLowerCase():"")}h=f}if(h)Ce(o,"complete"),Ce(o,"success");else{o.m=6;try{var R=2<tt(o)?o.g.statusText:""}catch{R=""}o.l=R+" ["+o.Z()+"]",Rc(o)}}finally{ri(o)}}}}function ri(o,u){if(o.g){Pc(o);const h=o.g,f=o.v[0]?()=>{}:null;o.g=null,o.v=null,u||Ce(o,"ready");try{h.onreadystatechange=f}catch{}}}function Pc(o){o.I&&(c.clearTimeout(o.I),o.I=null)}n.isActive=function(){return!!this.g};function tt(o){return o.g?o.g.readyState:0}n.Z=function(){try{return 2<tt(this)?this.g.status:-1}catch{return-1}},n.oa=function(){try{return this.g?this.g.responseText:""}catch{return""}},n.Oa=function(o){if(this.g){var u=this.g.responseText;return o&&u.indexOf(o)==0&&(u=u.substring(o.length)),Sf(u)}};function bc(o){try{if(!o.g)return null;if("response"in o.g)return o.g.response;switch(o.H){case"":case"text":return o.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in o.g)return o.g.mozResponseArrayBuffer}return null}catch{return null}}function Qf(o){const u={};o=(o.g&&2<=tt(o)&&o.g.getAllResponseHeaders()||"").split(`\r
`);for(let f=0;f<o.length;f++){if(q(o[f]))continue;var h=T(o[f]);const w=h[0];if(h=h[1],typeof h!="string")continue;h=h.trim();const R=u[w]||[];u[w]=R,R.push(h)}E(u,function(f){return f.join(", ")})}n.Ba=function(){return this.m},n.Ka=function(){return typeof this.l=="string"?this.l:String(this.l)};function Zn(o,u,h){return h&&h.internalChannelParams&&h.internalChannelParams[o]||u}function Cc(o){this.Aa=0,this.i=[],this.j=new Wn,this.ia=this.qa=this.I=this.W=this.g=this.ya=this.D=this.H=this.m=this.S=this.o=null,this.Ya=this.U=0,this.Va=Zn("failFast",!1,o),this.F=this.C=this.u=this.s=this.l=null,this.X=!0,this.za=this.T=-1,this.Y=this.v=this.B=0,this.Ta=Zn("baseRetryDelayMs",5e3,o),this.cb=Zn("retryDelaySeedMs",1e4,o),this.Wa=Zn("forwardChannelMaxRetries",2,o),this.wa=Zn("forwardChannelRequestTimeoutMs",2e4,o),this.pa=o&&o.xmlHttpFactory||void 0,this.Xa=o&&o.Tb||void 0,this.Ca=o&&o.useFetchStreams||!1,this.L=void 0,this.J=o&&o.supportsCrossDomainXhr||!1,this.K="",this.h=new lc(o&&o.concurrentRequestLimit),this.Da=new zf,this.P=o&&o.fastHandshake||!1,this.O=o&&o.encodeInitMessageHeaders||!1,this.P&&this.O&&(this.O=!1),this.Ua=o&&o.Rb||!1,o&&o.xa&&this.j.xa(),o&&o.forceLongPolling&&(this.X=!1),this.ba=!this.P&&this.X&&o&&o.detectBufferingProxy||!1,this.ja=void 0,o&&o.longPollingTimeout&&0<o.longPollingTimeout&&(this.ja=o.longPollingTimeout),this.ca=void 0,this.R=0,this.M=!1,this.ka=this.A=null}n=Cc.prototype,n.la=8,n.G=1,n.connect=function(o,u,h,f){ke(0),this.W=o,this.H=u||{},h&&f!==void 0&&(this.H.OSID=h,this.H.OAID=f),this.F=this.X,this.I=Fc(this,null,this.W),si(this)};function $s(o){if(kc(o),o.G==3){var u=o.U++,h=et(o.I);if(X(h,"SID",o.K),X(h,"RID",u),X(h,"TYPE","terminate"),er(o,h),u=new It(o,o.j,u),u.L=2,u.v=ei(et(h)),h=!1,c.navigator&&c.navigator.sendBeacon)try{h=c.navigator.sendBeacon(u.v.toString(),"")}catch{}!h&&c.Image&&(new Image().src=u.v,h=!0),h||(u.g=Uc(u.j,null),u.g.ea(u.v)),u.F=Date.now(),Jr(u)}xc(o)}function ii(o){o.g&&(zs(o),o.g.cancel(),o.g=null)}function kc(o){ii(o),o.u&&(c.clearTimeout(o.u),o.u=null),oi(o),o.h.cancel(),o.s&&(typeof o.s=="number"&&c.clearTimeout(o.s),o.s=null)}function si(o){if(!hc(o.h)&&!o.s){o.s=!0;var u=o.Ga;Un||$a(),Bn||(Un(),Bn=!0),ws.add(u,o),o.B=0}}function Yf(o,u){return dc(o.h)>=o.h.j-(o.s?1:0)?!1:o.s?(o.i=u.D.concat(o.i),!0):o.G==1||o.G==2||o.B>=(o.Va?0:o.Wa)?!1:(o.s=zn(v(o.Ga,o,u),Mc(o,o.B)),o.B++,!0)}n.Ga=function(o){if(this.s)if(this.s=null,this.G==1){if(!o){this.U=Math.floor(1e5*Math.random()),o=this.U++;const w=new It(this,this.j,o);let R=this.o;if(this.S&&(R?(R=m(R),I(R,this.S)):R=this.S),this.m!==null||this.O||(w.H=R,R=null),this.P)e:{for(var u=0,h=0;h<this.i.length;h++){t:{var f=this.i[h];if("__data__"in f.map&&(f=f.map.__data__,typeof f=="string")){f=f.length;break t}f=void 0}if(f===void 0)break;if(u+=f,4096<u){u=h;break e}if(u===4096||h===this.i.length-1){u=h+1;break e}}u=1e3}else u=1e3;u=Dc(this,w,u),h=et(this.I),X(h,"RID",o),X(h,"CVER",22),this.D&&X(h,"X-HTTP-Session-Id",this.D),er(this,h),R&&(this.O?u="headers="+encodeURIComponent(String(wc(R)))+"&"+u:this.m&&js(h,this.m,R)),qs(this.h,w),this.Ua&&X(h,"TYPE","init"),this.P?(X(h,"$req",u),X(h,"SID","null"),w.T=!0,xs(w,h,null)):xs(w,h,u),this.G=2}}else this.G==3&&(o?Nc(this,o):this.i.length==0||hc(this.h)||Nc(this))};function Nc(o,u){var h;u?h=u.l:h=o.U++;const f=et(o.I);X(f,"SID",o.K),X(f,"RID",h),X(f,"AID",o.T),er(o,f),o.m&&o.o&&js(f,o.m,o.o),h=new It(o,o.j,h,o.B+1),o.m===null&&(h.H=o.o),u&&(o.i=u.D.concat(o.i)),u=Dc(o,h,1e3),h.I=Math.round(.5*o.wa)+Math.round(.5*o.wa*Math.random()),qs(o.h,h),xs(h,f,u)}function er(o,u){o.H&&ae(o.H,function(h,f){X(u,f,h)}),o.l&&mc({},function(h,f){X(u,f,h)})}function Dc(o,u,h){h=Math.min(o.i.length,h);var f=o.l?v(o.l.Na,o.l,o):null;e:{var w=o.i;let R=-1;for(;;){const N=["count="+h];R==-1?0<h?(R=w[0].g,N.push("ofs="+R)):R=0:N.push("ofs="+R);let Y=!0;for(let _e=0;_e<h;_e++){let K=w[_e].g;const we=w[_e].map;if(K-=R,0>K)R=Math.max(0,w[_e].g-100),Y=!1;else try{Wf(we,N,"req"+K+"_")}catch{f&&f(we)}}if(Y){f=N.join("&");break e}}}return o=o.i.splice(0,h),u.D=o,f}function Oc(o){if(!o.g&&!o.u){o.Y=1;var u=o.Fa;Un||$a(),Bn||(Un(),Bn=!0),ws.add(u,o),o.v=0}}function Hs(o){return o.g||o.u||3<=o.v?!1:(o.Y++,o.u=zn(v(o.Fa,o),Mc(o,o.v)),o.v++,!0)}n.Fa=function(){if(this.u=null,Vc(this),this.ba&&!(this.M||this.g==null||0>=this.R)){var o=2*this.R;this.j.info("BP detection timer enabled: "+o),this.A=zn(v(this.ab,this),o)}},n.ab=function(){this.A&&(this.A=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.M=!0,ke(10),ii(this),Vc(this))};function zs(o){o.A!=null&&(c.clearTimeout(o.A),o.A=null)}function Vc(o){o.g=new It(o,o.j,"rpc",o.Y),o.m===null&&(o.g.H=o.o),o.g.O=0;var u=et(o.qa);X(u,"RID","rpc"),X(u,"SID",o.K),X(u,"AID",o.T),X(u,"CI",o.F?"0":"1"),!o.F&&o.ja&&X(u,"TO",o.ja),X(u,"TYPE","xmlhttp"),er(o,u),o.m&&o.o&&js(u,o.m,o.o),o.L&&(o.g.I=o.L);var h=o.g;o=o.ia,h.L=1,h.v=ei(et(u)),h.m=null,h.P=!0,ac(h,o)}n.Za=function(){this.C!=null&&(this.C=null,ii(this),Hs(this),ke(19))};function oi(o){o.C!=null&&(c.clearTimeout(o.C),o.C=null)}function Lc(o,u){var h=null;if(o.g==u){oi(o),zs(o),o.g=null;var f=2}else if(Bs(o.h,u))h=u.D,fc(o.h,u),f=1;else return;if(o.G!=0){if(u.o)if(f==1){h=u.m?u.m.length:0,u=Date.now()-u.F;var w=o.B;f=Kr(),Ce(f,new rc(f,h)),si(o)}else Oc(o);else if(w=u.s,w==3||w==0&&0<u.X||!(f==1&&Yf(o,u)||f==2&&Hs(o)))switch(h&&0<h.length&&(u=o.h,u.i=u.i.concat(h)),w){case 1:Wt(o,5);break;case 4:Wt(o,10);break;case 3:Wt(o,6);break;default:Wt(o,2)}}}function Mc(o,u){let h=o.Ta+Math.floor(Math.random()*o.cb);return o.isActive()||(h*=2),h*u}function Wt(o,u){if(o.j.info("Error code "+u),u==2){var h=v(o.fb,o),f=o.Xa;const w=!f;f=new zt(f||"//www.google.com/images/cleardot.gif"),c.location&&c.location.protocol=="http"||Xr(f,"https"),ei(f),w?$f(f.toString(),h):Hf(f.toString(),h)}else ke(2);o.G=0,o.l&&o.l.sa(u),xc(o),kc(o)}n.fb=function(o){o?(this.j.info("Successfully pinged google.com"),ke(2)):(this.j.info("Failed to ping google.com"),ke(1))};function xc(o){if(o.G=0,o.ka=[],o.l){const u=pc(o.h);(u.length!=0||o.i.length!=0)&&(D(o.ka,u),D(o.ka,o.i),o.h.i.length=0,L(o.i),o.i.length=0),o.l.ra()}}function Fc(o,u,h){var f=h instanceof zt?et(h):new zt(h);if(f.g!="")u&&(f.g=u+"."+f.g),Zr(f,f.s);else{var w=c.location;f=w.protocol,u=u?u+"."+w.hostname:w.hostname,w=+w.port;var R=new zt(null);f&&Xr(R,f),u&&(R.g=u),w&&Zr(R,w),h&&(R.l=h),f=R}return h=o.D,u=o.ya,h&&u&&X(f,h,u),X(f,"VER",o.la),er(o,f),f}function Uc(o,u,h){if(u&&!o.J)throw Error("Can't create secondary domain capable XhrIo object.");return u=o.Ca&&!o.pa?new se(new ti({eb:h})):new se(o.pa),u.Ha(o.J),u}n.isActive=function(){return!!this.l&&this.l.isActive(this)};function Bc(){}n=Bc.prototype,n.ua=function(){},n.ta=function(){},n.sa=function(){},n.ra=function(){},n.isActive=function(){return!0},n.Na=function(){};function ai(){}ai.prototype.g=function(o,u){return new Me(o,u)};function Me(o,u){Te.call(this),this.g=new Cc(u),this.l=o,this.h=u&&u.messageUrlParams||null,o=u&&u.messageHeaders||null,u&&u.clientProtocolHeaderRequired&&(o?o["X-Client-Protocol"]="webchannel":o={"X-Client-Protocol":"webchannel"}),this.g.o=o,o=u&&u.initMessageHeaders||null,u&&u.messageContentType&&(o?o["X-WebChannel-Content-Type"]=u.messageContentType:o={"X-WebChannel-Content-Type":u.messageContentType}),u&&u.va&&(o?o["X-WebChannel-Client-Profile"]=u.va:o={"X-WebChannel-Client-Profile":u.va}),this.g.S=o,(o=u&&u.Sb)&&!q(o)&&(this.g.m=o),this.v=u&&u.supportsCrossDomainXhr||!1,this.u=u&&u.sendRawJson||!1,(u=u&&u.httpSessionIdParam)&&!q(u)&&(this.g.D=u,o=this.h,o!==null&&u in o&&(o=this.h,u in o&&delete o[u])),this.j=new un(this)}k(Me,Te),Me.prototype.m=function(){this.g.l=this.j,this.v&&(this.g.J=!0),this.g.connect(this.l,this.h||void 0)},Me.prototype.close=function(){$s(this.g)},Me.prototype.o=function(o){var u=this.g;if(typeof o=="string"){var h={};h.__data__=o,o=h}else this.u&&(h={},h.__data__=Ns(o),o=h);u.i.push(new Of(u.Ya++,o)),u.G==3&&si(u)},Me.prototype.N=function(){this.g.l=null,delete this.j,$s(this.g),delete this.g,Me.aa.N.call(this)};function qc(o){Os.call(this),o.__headers__&&(this.headers=o.__headers__,this.statusCode=o.__status__,delete o.__headers__,delete o.__status__);var u=o.__sm__;if(u){e:{for(const h in u){o=h;break e}o=void 0}(this.i=o)&&(o=this.i,u=u!==null&&o in u?u[o]:void 0),this.data=u}else this.data=o}k(qc,Os);function jc(){Vs.call(this),this.status=1}k(jc,Vs);function un(o){this.g=o}k(un,Bc),un.prototype.ua=function(){Ce(this.g,"a")},un.prototype.ta=function(o){Ce(this.g,new qc(o))},un.prototype.sa=function(o){Ce(this.g,new jc)},un.prototype.ra=function(){Ce(this.g,"b")},ai.prototype.createWebChannel=ai.prototype.g,Me.prototype.send=Me.prototype.o,Me.prototype.open=Me.prototype.m,Me.prototype.close=Me.prototype.close,zh=function(){return new ai},Hh=function(){return Kr()},$h=$t,vo={mb:0,pb:1,qb:2,Jb:3,Ob:4,Lb:5,Mb:6,Kb:7,Ib:8,Nb:9,PROXY:10,NOPROXY:11,Gb:12,Cb:13,Db:14,Bb:15,Eb:16,Fb:17,ib:18,hb:19,jb:20},Qr.NO_ERROR=0,Qr.TIMEOUT=8,Qr.HTTP_ERROR=6,Ii=Qr,ic.COMPLETE="complete",jh=ic,Za.EventType=$n,$n.OPEN="a",$n.CLOSE="b",$n.ERROR="c",$n.MESSAGE="d",Te.prototype.listen=Te.prototype.K,sr=Za,se.prototype.listenOnce=se.prototype.L,se.prototype.getLastError=se.prototype.Ka,se.prototype.getLastErrorCode=se.prototype.Ba,se.prototype.getStatus=se.prototype.Z,se.prototype.getResponseJson=se.prototype.Oa,se.prototype.getResponseText=se.prototype.oa,se.prototype.send=se.prototype.ea,se.prototype.setWithCredentials=se.prototype.Ha,qh=se}).apply(typeof hi<"u"?hi:typeof self<"u"?self:typeof window<"u"?window:{});const Tu="@firebase/firestore",wu="4.8.0";/**
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
 */class Se{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}Se.UNAUTHENTICATED=new Se(null),Se.GOOGLE_CREDENTIALS=new Se("google-credentials-uid"),Se.FIRST_PARTY=new Se("first-party-uid"),Se.MOCK_USER=new Se("mock-user");/**
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
 */let On="11.10.0";/**
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
 */const tn=new xo("@firebase/firestore");function hn(){return tn.logLevel}function V(n,...e){if(tn.logLevel<=z.DEBUG){const t=e.map(sa);tn.debug(`Firestore (${On}): ${n}`,...t)}}function ft(n,...e){if(tn.logLevel<=z.ERROR){const t=e.map(sa);tn.error(`Firestore (${On}): ${n}`,...t)}}function Dt(n,...e){if(tn.logLevel<=z.WARN){const t=e.map(sa);tn.warn(`Firestore (${On}): ${n}`,...t)}}function sa(n){if(typeof n=="string")return n;try{/**
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
*/return function(t){return JSON.stringify(t)}(n)}catch{return n}}/**
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
 */function F(n,e,t){let r="Unexpected state";typeof e=="string"?r=e:t=e,Wh(n,r,t)}function Wh(n,e,t){let r=`FIRESTORE (${On}) INTERNAL ASSERTION FAILED: ${e} (ID: ${n.toString(16)})`;if(t!==void 0)try{r+=" CONTEXT: "+JSON.stringify(t)}catch{r+=" CONTEXT: "+t}throw ft(r),new Error(r)}function Q(n,e,t,r){let i="Unexpected state";typeof t=="string"?i=t:r=t,n||Wh(e,i,r)}function B(n,e){return n}/**
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
 */const S={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class O extends gt{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
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
 */class ut{constructor(){this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}}/**
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
 */class Gh{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class pv{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable(()=>t(Se.UNAUTHENTICATED))}shutdown(){}}class mv{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,t){this.changeListener=t,e.enqueueRetryable(()=>t(this.token.user))}shutdown(){this.changeListener=null}}class gv{constructor(e){this.t=e,this.currentUser=Se.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(e,t){Q(this.o===void 0,42304);let r=this.i;const i=l=>this.i!==r?(r=this.i,t(l)):Promise.resolve();let s=new ut;this.o=()=>{this.i++,this.currentUser=this.u(),s.resolve(),s=new ut,e.enqueueRetryable(()=>i(this.currentUser))};const a=()=>{const l=s;e.enqueueRetryable(async()=>{await l.promise,await i(this.currentUser)})},c=l=>{V("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=l,this.o&&(this.auth.addAuthTokenListener(this.o),a())};this.t.onInit(l=>c(l)),setTimeout(()=>{if(!this.auth){const l=this.t.getImmediate({optional:!0});l?c(l):(V("FirebaseAuthCredentialsProvider","Auth not yet detected"),s.resolve(),s=new ut)}},0),a()}getToken(){const e=this.i,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then(r=>this.i!==e?(V("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):r?(Q(typeof r.accessToken=="string",31837,{l:r}),new Gh(r.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const e=this.auth&&this.auth.getUid();return Q(e===null||typeof e=="string",2055,{h:e}),new Se(e)}}class _v{constructor(e,t,r){this.P=e,this.T=t,this.I=r,this.type="FirstParty",this.user=Se.FIRST_PARTY,this.A=new Map}R(){return this.I?this.I():null}get headers(){this.A.set("X-Goog-AuthUser",this.P);const e=this.R();return e&&this.A.set("Authorization",e),this.T&&this.A.set("X-Goog-Iam-Authorization-Token",this.T),this.A}}class yv{constructor(e,t,r){this.P=e,this.T=t,this.I=r}getToken(){return Promise.resolve(new _v(this.P,this.T,this.I))}start(e,t){e.enqueueRetryable(()=>t(Se.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class Au{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class vv{constructor(e,t){this.V=t,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,re(e)&&e.settings.appCheckToken&&(this.p=e.settings.appCheckToken)}start(e,t){Q(this.o===void 0,3512);const r=s=>{s.error!=null&&V("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${s.error.message}`);const a=s.token!==this.m;return this.m=s.token,V("FirebaseAppCheckTokenProvider",`Received ${a?"new":"existing"} token.`),a?t(s.token):Promise.resolve()};this.o=s=>{e.enqueueRetryable(()=>r(s))};const i=s=>{V("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=s,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit(s=>i(s)),setTimeout(()=>{if(!this.appCheck){const s=this.V.getImmediate({optional:!0});s?i(s):V("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){if(this.p)return Promise.resolve(new Au(this.p));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then(t=>t?(Q(typeof t.token=="string",44558,{tokenResult:t}),this.m=t.token,new Au(t.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}/**
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
 */function Iv(n){const e=typeof self<"u"&&(self.crypto||self.msCrypto),t=new Uint8Array(n);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(t);else for(let r=0;r<n;r++)t[r]=Math.floor(256*Math.random());return t}/**
 * @license
 * Copyright 2023 Google LLC
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
 */function Kh(){return new TextEncoder}/**
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
 */class oa{static newId(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=62*Math.floor(4.129032258064516);let r="";for(;r.length<20;){const i=Iv(40);for(let s=0;s<i.length;++s)r.length<20&&i[s]<t&&(r+=e.charAt(i[s]%62))}return r}}function j(n,e){return n<e?-1:n>e?1:0}function Io(n,e){let t=0;for(;t<n.length&&t<e.length;){const r=n.codePointAt(t),i=e.codePointAt(t);if(r!==i){if(r<128&&i<128)return j(r,i);{const s=Kh(),a=Ev(s.encode(Ru(n,t)),s.encode(Ru(e,t)));return a!==0?a:j(r,i)}}t+=r>65535?2:1}return j(n.length,e.length)}function Ru(n,e){return n.codePointAt(e)>65535?n.substring(e,e+2):n.substring(e,e+1)}function Ev(n,e){for(let t=0;t<n.length&&t<e.length;++t)if(n[t]!==e[t])return j(n[t],e[t]);return j(n.length,e.length)}function En(n,e,t){return n.length===e.length&&n.every((r,i)=>t(r,e[i]))}/**
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
 */const Su="__name__";class ze{constructor(e,t,r){t===void 0?t=0:t>e.length&&F(637,{offset:t,range:e.length}),r===void 0?r=e.length-t:r>e.length-t&&F(1746,{length:r,range:e.length-t}),this.segments=e,this.offset=t,this.len=r}get length(){return this.len}isEqual(e){return ze.comparator(this,e)===0}child(e){const t=this.segments.slice(this.offset,this.limit());return e instanceof ze?e.forEach(r=>{t.push(r)}):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,r=this.limit();t<r;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){const r=Math.min(e.length,t.length);for(let i=0;i<r;i++){const s=ze.compareSegments(e.get(i),t.get(i));if(s!==0)return s}return j(e.length,t.length)}static compareSegments(e,t){const r=ze.isNumericId(e),i=ze.isNumericId(t);return r&&!i?-1:!r&&i?1:r&&i?ze.extractNumericId(e).compare(ze.extractNumericId(t)):Io(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return kt.fromString(e.substring(4,e.length-2))}}class J extends ze{construct(e,t,r){return new J(e,t,r)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const t=[];for(const r of e){if(r.indexOf("//")>=0)throw new O(S.INVALID_ARGUMENT,`Invalid segment (${r}). Paths must not contain // in them.`);t.push(...r.split("/").filter(i=>i.length>0))}return new J(t)}static emptyPath(){return new J([])}}const Tv=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class ve extends ze{construct(e,t,r){return new ve(e,t,r)}static isValidIdentifier(e){return Tv.test(e)}canonicalString(){return this.toArray().map(e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),ve.isValidIdentifier(e)||(e="`"+e+"`"),e)).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===Su}static keyField(){return new ve([Su])}static fromServerFormat(e){const t=[];let r="",i=0;const s=()=>{if(r.length===0)throw new O(S.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(r),r=""};let a=!1;for(;i<e.length;){const c=e[i];if(c==="\\"){if(i+1===e.length)throw new O(S.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const l=e[i+1];if(l!=="\\"&&l!=="."&&l!=="`")throw new O(S.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);r+=l,i+=2}else c==="`"?(a=!a,i++):c!=="."||a?(r+=c,i++):(s(),i++)}if(s(),a)throw new O(S.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new ve(t)}static emptyPath(){return new ve([])}}/**
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
 */class M{constructor(e){this.path=e}static fromPath(e){return new M(J.fromString(e))}static fromName(e){return new M(J.fromString(e).popFirst(5))}static empty(){return new M(J.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&J.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,t){return J.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new M(new J(e.slice()))}}/**
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
 */function Qh(n,e,t){if(!t)throw new O(S.INVALID_ARGUMENT,`Function ${n}() cannot be called with an empty ${e}.`)}function wv(n,e,t,r){if(e===!0&&r===!0)throw new O(S.INVALID_ARGUMENT,`${n} and ${t} cannot be used together.`)}function Pu(n){if(!M.isDocumentKey(n))throw new O(S.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${n} has ${n.length}.`)}function bu(n){if(M.isDocumentKey(n))throw new O(S.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${n} has ${n.length}.`)}function Yh(n){return typeof n=="object"&&n!==null&&(Object.getPrototypeOf(n)===Object.prototype||Object.getPrototypeOf(n)===null)}function ts(n){if(n===void 0)return"undefined";if(n===null)return"null";if(typeof n=="string")return n.length>20&&(n=`${n.substring(0,20)}...`),JSON.stringify(n);if(typeof n=="number"||typeof n=="boolean")return""+n;if(typeof n=="object"){if(n instanceof Array)return"an array";{const e=function(r){return r.constructor?r.constructor.name:null}(n);return e?`a custom ${e} object`:"an object"}}return typeof n=="function"?"a function":F(12329,{type:typeof n})}function Fe(n,e){if("_delegate"in n&&(n=n._delegate),!(n instanceof e)){if(e.name===n.constructor.name)throw new O(S.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const t=ts(n);throw new O(S.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${t}`)}}return n}/**
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
 */function fe(n,e){const t={typeString:n};return e&&(t.value=e),t}function xr(n,e){if(!Yh(n))throw new O(S.INVALID_ARGUMENT,"JSON must be an object");let t;for(const r in e)if(e[r]){const i=e[r].typeString,s="value"in e[r]?{value:e[r].value}:void 0;if(!(r in n)){t=`JSON missing required field: '${r}'`;break}const a=n[r];if(i&&typeof a!==i){t=`JSON field '${r}' must be a ${i}.`;break}if(s!==void 0&&a!==s.value){t=`Expected '${r}' field to equal '${s.value}'`;break}}if(t)throw new O(S.INVALID_ARGUMENT,t);return!0}/**
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
 */const Cu=-62135596800,ku=1e6;class Z{static now(){return Z.fromMillis(Date.now())}static fromDate(e){return Z.fromMillis(e.getTime())}static fromMillis(e){const t=Math.floor(e/1e3),r=Math.floor((e-1e3*t)*ku);return new Z(t,r)}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new O(S.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new O(S.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<Cu)throw new O(S.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new O(S.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/ku}_compareTo(e){return this.seconds===e.seconds?j(this.nanoseconds,e.nanoseconds):j(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:Z._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(xr(e,Z._jsonSchema))return new Z(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-Cu;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}Z._jsonSchemaVersion="firestore/timestamp/1.0",Z._jsonSchema={type:fe("string",Z._jsonSchemaVersion),seconds:fe("number"),nanoseconds:fe("number")};/**
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
 */class U{static fromTimestamp(e){return new U(e)}static min(){return new U(new Z(0,0))}static max(){return new U(new Z(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
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
 */const Ar=-1;function Av(n,e){const t=n.toTimestamp().seconds,r=n.toTimestamp().nanoseconds+1,i=U.fromTimestamp(r===1e9?new Z(t+1,0):new Z(t,r));return new Ot(i,M.empty(),e)}function Rv(n){return new Ot(n.readTime,n.key,Ar)}class Ot{constructor(e,t,r){this.readTime=e,this.documentKey=t,this.largestBatchId=r}static min(){return new Ot(U.min(),M.empty(),Ar)}static max(){return new Ot(U.max(),M.empty(),Ar)}}function Sv(n,e){let t=n.readTime.compareTo(e.readTime);return t!==0?t:(t=M.comparator(n.documentKey,e.documentKey),t!==0?t:j(n.largestBatchId,e.largestBatchId))}/**
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
 */const Pv="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class bv{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach(e=>e())}}/**
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
 */async function Vn(n){if(n.code!==S.FAILED_PRECONDITION||n.message!==Pv)throw n;V("LocalStore","Unexpectedly lost primary lease")}/**
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
 */class b{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e(t=>{this.isDone=!0,this.result=t,this.nextCallback&&this.nextCallback(t)},t=>{this.isDone=!0,this.error=t,this.catchCallback&&this.catchCallback(t)})}catch(e){return this.next(void 0,e)}next(e,t){return this.callbackAttached&&F(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(t,this.error):this.wrapSuccess(e,this.result):new b((r,i)=>{this.nextCallback=s=>{this.wrapSuccess(e,s).next(r,i)},this.catchCallback=s=>{this.wrapFailure(t,s).next(r,i)}})}toPromise(){return new Promise((e,t)=>{this.next(e,t)})}wrapUserFunction(e){try{const t=e();return t instanceof b?t:b.resolve(t)}catch(t){return b.reject(t)}}wrapSuccess(e,t){return e?this.wrapUserFunction(()=>e(t)):b.resolve(t)}wrapFailure(e,t){return e?this.wrapUserFunction(()=>e(t)):b.reject(t)}static resolve(e){return new b((t,r)=>{t(e)})}static reject(e){return new b((t,r)=>{r(e)})}static waitFor(e){return new b((t,r)=>{let i=0,s=0,a=!1;e.forEach(c=>{++i,c.next(()=>{++s,a&&s===i&&t()},l=>r(l))}),a=!0,s===i&&t()})}static or(e){let t=b.resolve(!1);for(const r of e)t=t.next(i=>i?b.resolve(i):r());return t}static forEach(e,t){const r=[];return e.forEach((i,s)=>{r.push(t.call(this,i,s))}),this.waitFor(r)}static mapArray(e,t){return new b((r,i)=>{const s=e.length,a=new Array(s);let c=0;for(let l=0;l<s;l++){const d=l;t(e[d]).next(p=>{a[d]=p,++c,c===s&&r(a)},p=>i(p))}})}static doWhile(e,t){return new b((r,i)=>{const s=()=>{e()===!0?t().next(()=>{s()},i):r()};s()})}}function Cv(n){const e=n.match(/Android ([\d.]+)/i),t=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(t)}function Ln(n){return n.name==="IndexedDbTransactionError"}/**
 * @license
 * Copyright 2018 Google LLC
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
 */class ns{constructor(e,t){this.previousValue=e,t&&(t.sequenceNumberHandler=r=>this._e(r),this.ae=r=>t.writeSequenceNumber(r))}_e(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){const e=++this.previousValue;return this.ae&&this.ae(e),e}}ns.ue=-1;/**
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
 */const aa=-1;function rs(n){return n==null}function Oi(n){return n===0&&1/n==-1/0}function kv(n){return typeof n=="number"&&Number.isInteger(n)&&!Oi(n)&&n<=Number.MAX_SAFE_INTEGER&&n>=Number.MIN_SAFE_INTEGER}/**
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
 */const Jh="";function Nv(n){let e="";for(let t=0;t<n.length;t++)e.length>0&&(e=Nu(e)),e=Dv(n.get(t),e);return Nu(e)}function Dv(n,e){let t=e;const r=n.length;for(let i=0;i<r;i++){const s=n.charAt(i);switch(s){case"\0":t+="";break;case Jh:t+="";break;default:t+=s}}return t}function Nu(n){return n+Jh+""}/**
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
 */function Du(n){let e=0;for(const t in n)Object.prototype.hasOwnProperty.call(n,t)&&e++;return e}function Bt(n,e){for(const t in n)Object.prototype.hasOwnProperty.call(n,t)&&e(t,n[t])}function Xh(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}/**
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
 */class ie{constructor(e,t){this.comparator=e,this.root=t||ye.EMPTY}insert(e,t){return new ie(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,ye.BLACK,null,null))}remove(e){return new ie(this.comparator,this.root.remove(e,this.comparator).copy(null,null,ye.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){const r=this.comparator(e,t.key);if(r===0)return t.value;r<0?t=t.left:r>0&&(t=t.right)}return null}indexOf(e){let t=0,r=this.root;for(;!r.isEmpty();){const i=this.comparator(e,r.key);if(i===0)return t+r.left.size;i<0?r=r.left:(t+=r.left.size+1,r=r.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal((t,r)=>(e(t,r),!1))}toString(){const e=[];return this.inorderTraversal((t,r)=>(e.push(`${t}:${r}`),!1)),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new di(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new di(this.root,e,this.comparator,!1)}getReverseIterator(){return new di(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new di(this.root,e,this.comparator,!0)}}class di{constructor(e,t,r,i){this.isReverse=i,this.nodeStack=[];let s=1;for(;!e.isEmpty();)if(s=t?r(e.key,t):1,t&&i&&(s*=-1),s<0)e=this.isReverse?e.left:e.right;else{if(s===0){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop();const t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}}class ye{constructor(e,t,r,i,s){this.key=e,this.value=t,this.color=r??ye.RED,this.left=i??ye.EMPTY,this.right=s??ye.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,r,i,s){return new ye(e??this.key,t??this.value,r??this.color,i??this.left,s??this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,r){let i=this;const s=r(e,i.key);return i=s<0?i.copy(null,null,null,i.left.insert(e,t,r),null):s===0?i.copy(null,t,null,null,null):i.copy(null,null,null,null,i.right.insert(e,t,r)),i.fixUp()}removeMin(){if(this.left.isEmpty())return ye.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,t){let r,i=this;if(t(e,i.key)<0)i.left.isEmpty()||i.left.isRed()||i.left.left.isRed()||(i=i.moveRedLeft()),i=i.copy(null,null,null,i.left.remove(e,t),null);else{if(i.left.isRed()&&(i=i.rotateRight()),i.right.isEmpty()||i.right.isRed()||i.right.left.isRed()||(i=i.moveRedRight()),t(e,i.key)===0){if(i.right.isEmpty())return ye.EMPTY;r=i.right.min(),i=i.copy(r.key,r.value,null,null,i.right.removeMin())}i=i.copy(null,null,null,null,i.right.remove(e,t))}return i.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){const e=this.copy(null,null,ye.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){const e=this.copy(null,null,ye.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){const e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw F(43730,{key:this.key,value:this.value});if(this.right.isRed())throw F(14113,{key:this.key,value:this.value});const e=this.left.check();if(e!==this.right.check())throw F(27949);return e+(this.isRed()?0:1)}}ye.EMPTY=null,ye.RED=!0,ye.BLACK=!1;ye.EMPTY=new class{constructor(){this.size=0}get key(){throw F(57766)}get value(){throw F(16141)}get color(){throw F(16727)}get left(){throw F(29726)}get right(){throw F(36894)}copy(e,t,r,i,s){return this}insert(e,t,r){return new ye(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
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
 */class pe{constructor(e){this.comparator=e,this.data=new ie(this.comparator)}has(e){return this.data.get(e)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal((t,r)=>(e(t),!1))}forEachInRange(e,t){const r=this.data.getIteratorFrom(e[0]);for(;r.hasNext();){const i=r.getNext();if(this.comparator(i.key,e[1])>=0)return;t(i.key)}}forEachWhile(e,t){let r;for(r=t!==void 0?this.data.getIteratorFrom(t):this.data.getIterator();r.hasNext();)if(!e(r.getNext().key))return}firstAfterOrEqual(e){const t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new Ou(this.data.getIterator())}getIteratorFrom(e){return new Ou(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach(r=>{t=t.add(r)}),t}isEqual(e){if(!(e instanceof pe)||this.size!==e.size)return!1;const t=this.data.getIterator(),r=e.data.getIterator();for(;t.hasNext();){const i=t.getNext().key,s=r.getNext().key;if(this.comparator(i,s)!==0)return!1}return!0}toArray(){const e=[];return this.forEach(t=>{e.push(t)}),e}toString(){const e=[];return this.forEach(t=>e.push(t)),"SortedSet("+e.toString()+")"}copy(e){const t=new pe(this.comparator);return t.data=e,t}}class Ou{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}/**
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
 */class xe{constructor(e){this.fields=e,e.sort(ve.comparator)}static empty(){return new xe([])}unionWith(e){let t=new pe(ve.comparator);for(const r of this.fields)t=t.add(r);for(const r of e)t=t.add(r);return new xe(t.toArray())}covers(e){for(const t of this.fields)if(t.isPrefixOf(e))return!0;return!1}isEqual(e){return En(this.fields,e.fields,(t,r)=>t.isEqual(r))}}/**
 * @license
 * Copyright 2023 Google LLC
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
 */class Zh extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
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
 */class Ie{constructor(e){this.binaryString=e}static fromBase64String(e){const t=function(i){try{return atob(i)}catch(s){throw typeof DOMException<"u"&&s instanceof DOMException?new Zh("Invalid base64 string: "+s):s}}(e);return new Ie(t)}static fromUint8Array(e){const t=function(i){let s="";for(let a=0;a<i.length;++a)s+=String.fromCharCode(i[a]);return s}(e);return new Ie(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return function(t){return btoa(t)}(this.binaryString)}toUint8Array(){return function(t){const r=new Uint8Array(t.length);for(let i=0;i<t.length;i++)r[i]=t.charCodeAt(i);return r}(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return j(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}Ie.EMPTY_BYTE_STRING=new Ie("");const Ov=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function Vt(n){if(Q(!!n,39018),typeof n=="string"){let e=0;const t=Ov.exec(n);if(Q(!!t,46558,{timestamp:n}),t[1]){let i=t[1];i=(i+"000000000").substr(0,9),e=Number(i)}const r=new Date(n);return{seconds:Math.floor(r.getTime()/1e3),nanos:e}}return{seconds:ce(n.seconds),nanos:ce(n.nanos)}}function ce(n){return typeof n=="number"?n:typeof n=="string"?Number(n):0}function Lt(n){return typeof n=="string"?Ie.fromBase64String(n):Ie.fromUint8Array(n)}/**
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
 */const ed="server_timestamp",td="__type__",nd="__previous_value__",rd="__local_write_time__";function ca(n){var e,t;return((t=(((e=n==null?void 0:n.mapValue)===null||e===void 0?void 0:e.fields)||{})[td])===null||t===void 0?void 0:t.stringValue)===ed}function is(n){const e=n.mapValue.fields[nd];return ca(e)?is(e):e}function Rr(n){const e=Vt(n.mapValue.fields[rd].timestampValue);return new Z(e.seconds,e.nanos)}/**
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
 */class Vv{constructor(e,t,r,i,s,a,c,l,d,p){this.databaseId=e,this.appId=t,this.persistenceKey=r,this.host=i,this.ssl=s,this.forceLongPolling=a,this.autoDetectLongPolling=c,this.longPollingOptions=l,this.useFetchStreams=d,this.isUsingEmulator=p}}const Vi="(default)";class Sr{constructor(e,t){this.projectId=e,this.database=t||Vi}static empty(){return new Sr("","")}get isDefaultDatabase(){return this.database===Vi}isEqual(e){return e instanceof Sr&&e.projectId===this.projectId&&e.database===this.database}}/**
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
 */const id="__type__",Lv="__max__",fi={mapValue:{}},sd="__vector__",Li="value";function Mt(n){return"nullValue"in n?0:"booleanValue"in n?1:"integerValue"in n||"doubleValue"in n?2:"timestampValue"in n?3:"stringValue"in n?5:"bytesValue"in n?6:"referenceValue"in n?7:"geoPointValue"in n?8:"arrayValue"in n?9:"mapValue"in n?ca(n)?4:xv(n)?9007199254740991:Mv(n)?10:11:F(28295,{value:n})}function Xe(n,e){if(n===e)return!0;const t=Mt(n);if(t!==Mt(e))return!1;switch(t){case 0:case 9007199254740991:return!0;case 1:return n.booleanValue===e.booleanValue;case 4:return Rr(n).isEqual(Rr(e));case 3:return function(i,s){if(typeof i.timestampValue=="string"&&typeof s.timestampValue=="string"&&i.timestampValue.length===s.timestampValue.length)return i.timestampValue===s.timestampValue;const a=Vt(i.timestampValue),c=Vt(s.timestampValue);return a.seconds===c.seconds&&a.nanos===c.nanos}(n,e);case 5:return n.stringValue===e.stringValue;case 6:return function(i,s){return Lt(i.bytesValue).isEqual(Lt(s.bytesValue))}(n,e);case 7:return n.referenceValue===e.referenceValue;case 8:return function(i,s){return ce(i.geoPointValue.latitude)===ce(s.geoPointValue.latitude)&&ce(i.geoPointValue.longitude)===ce(s.geoPointValue.longitude)}(n,e);case 2:return function(i,s){if("integerValue"in i&&"integerValue"in s)return ce(i.integerValue)===ce(s.integerValue);if("doubleValue"in i&&"doubleValue"in s){const a=ce(i.doubleValue),c=ce(s.doubleValue);return a===c?Oi(a)===Oi(c):isNaN(a)&&isNaN(c)}return!1}(n,e);case 9:return En(n.arrayValue.values||[],e.arrayValue.values||[],Xe);case 10:case 11:return function(i,s){const a=i.mapValue.fields||{},c=s.mapValue.fields||{};if(Du(a)!==Du(c))return!1;for(const l in a)if(a.hasOwnProperty(l)&&(c[l]===void 0||!Xe(a[l],c[l])))return!1;return!0}(n,e);default:return F(52216,{left:n})}}function Pr(n,e){return(n.values||[]).find(t=>Xe(t,e))!==void 0}function Tn(n,e){if(n===e)return 0;const t=Mt(n),r=Mt(e);if(t!==r)return j(t,r);switch(t){case 0:case 9007199254740991:return 0;case 1:return j(n.booleanValue,e.booleanValue);case 2:return function(s,a){const c=ce(s.integerValue||s.doubleValue),l=ce(a.integerValue||a.doubleValue);return c<l?-1:c>l?1:c===l?0:isNaN(c)?isNaN(l)?0:-1:1}(n,e);case 3:return Vu(n.timestampValue,e.timestampValue);case 4:return Vu(Rr(n),Rr(e));case 5:return Io(n.stringValue,e.stringValue);case 6:return function(s,a){const c=Lt(s),l=Lt(a);return c.compareTo(l)}(n.bytesValue,e.bytesValue);case 7:return function(s,a){const c=s.split("/"),l=a.split("/");for(let d=0;d<c.length&&d<l.length;d++){const p=j(c[d],l[d]);if(p!==0)return p}return j(c.length,l.length)}(n.referenceValue,e.referenceValue);case 8:return function(s,a){const c=j(ce(s.latitude),ce(a.latitude));return c!==0?c:j(ce(s.longitude),ce(a.longitude))}(n.geoPointValue,e.geoPointValue);case 9:return Lu(n.arrayValue,e.arrayValue);case 10:return function(s,a){var c,l,d,p;const g=s.fields||{},v=a.fields||{},P=(c=g[Li])===null||c===void 0?void 0:c.arrayValue,k=(l=v[Li])===null||l===void 0?void 0:l.arrayValue,L=j(((d=P==null?void 0:P.values)===null||d===void 0?void 0:d.length)||0,((p=k==null?void 0:k.values)===null||p===void 0?void 0:p.length)||0);return L!==0?L:Lu(P,k)}(n.mapValue,e.mapValue);case 11:return function(s,a){if(s===fi.mapValue&&a===fi.mapValue)return 0;if(s===fi.mapValue)return 1;if(a===fi.mapValue)return-1;const c=s.fields||{},l=Object.keys(c),d=a.fields||{},p=Object.keys(d);l.sort(),p.sort();for(let g=0;g<l.length&&g<p.length;++g){const v=Io(l[g],p[g]);if(v!==0)return v;const P=Tn(c[l[g]],d[p[g]]);if(P!==0)return P}return j(l.length,p.length)}(n.mapValue,e.mapValue);default:throw F(23264,{le:t})}}function Vu(n,e){if(typeof n=="string"&&typeof e=="string"&&n.length===e.length)return j(n,e);const t=Vt(n),r=Vt(e),i=j(t.seconds,r.seconds);return i!==0?i:j(t.nanos,r.nanos)}function Lu(n,e){const t=n.values||[],r=e.values||[];for(let i=0;i<t.length&&i<r.length;++i){const s=Tn(t[i],r[i]);if(s)return s}return j(t.length,r.length)}function wn(n){return Eo(n)}function Eo(n){return"nullValue"in n?"null":"booleanValue"in n?""+n.booleanValue:"integerValue"in n?""+n.integerValue:"doubleValue"in n?""+n.doubleValue:"timestampValue"in n?function(t){const r=Vt(t);return`time(${r.seconds},${r.nanos})`}(n.timestampValue):"stringValue"in n?n.stringValue:"bytesValue"in n?function(t){return Lt(t).toBase64()}(n.bytesValue):"referenceValue"in n?function(t){return M.fromName(t).toString()}(n.referenceValue):"geoPointValue"in n?function(t){return`geo(${t.latitude},${t.longitude})`}(n.geoPointValue):"arrayValue"in n?function(t){let r="[",i=!0;for(const s of t.values||[])i?i=!1:r+=",",r+=Eo(s);return r+"]"}(n.arrayValue):"mapValue"in n?function(t){const r=Object.keys(t.fields||{}).sort();let i="{",s=!0;for(const a of r)s?s=!1:i+=",",i+=`${a}:${Eo(t.fields[a])}`;return i+"}"}(n.mapValue):F(61005,{value:n})}function Ei(n){switch(Mt(n)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const e=is(n);return e?16+Ei(e):16;case 5:return 2*n.stringValue.length;case 6:return Lt(n.bytesValue).approximateByteSize();case 7:return n.referenceValue.length;case 9:return function(r){return(r.values||[]).reduce((i,s)=>i+Ei(s),0)}(n.arrayValue);case 10:case 11:return function(r){let i=0;return Bt(r.fields,(s,a)=>{i+=s.length+Ei(a)}),i}(n.mapValue);default:throw F(13486,{value:n})}}function Mu(n,e){return{referenceValue:`projects/${n.projectId}/databases/${n.database}/documents/${e.path.canonicalString()}`}}function To(n){return!!n&&"integerValue"in n}function ua(n){return!!n&&"arrayValue"in n}function xu(n){return!!n&&"nullValue"in n}function Fu(n){return!!n&&"doubleValue"in n&&isNaN(Number(n.doubleValue))}function Ti(n){return!!n&&"mapValue"in n}function Mv(n){var e,t;return((t=(((e=n==null?void 0:n.mapValue)===null||e===void 0?void 0:e.fields)||{})[id])===null||t===void 0?void 0:t.stringValue)===sd}function pr(n){if(n.geoPointValue)return{geoPointValue:Object.assign({},n.geoPointValue)};if(n.timestampValue&&typeof n.timestampValue=="object")return{timestampValue:Object.assign({},n.timestampValue)};if(n.mapValue){const e={mapValue:{fields:{}}};return Bt(n.mapValue.fields,(t,r)=>e.mapValue.fields[t]=pr(r)),e}if(n.arrayValue){const e={arrayValue:{values:[]}};for(let t=0;t<(n.arrayValue.values||[]).length;++t)e.arrayValue.values[t]=pr(n.arrayValue.values[t]);return e}return Object.assign({},n)}function xv(n){return(((n.mapValue||{}).fields||{}).__type__||{}).stringValue===Lv}/**
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
 */class Oe{constructor(e){this.value=e}static empty(){return new Oe({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let r=0;r<e.length-1;++r)if(t=(t.mapValue.fields||{})[e.get(r)],!Ti(t))return null;return t=(t.mapValue.fields||{})[e.lastSegment()],t||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=pr(t)}setAll(e){let t=ve.emptyPath(),r={},i=[];e.forEach((a,c)=>{if(!t.isImmediateParentOf(c)){const l=this.getFieldsMap(t);this.applyChanges(l,r,i),r={},i=[],t=c.popLast()}a?r[c.lastSegment()]=pr(a):i.push(c.lastSegment())});const s=this.getFieldsMap(t);this.applyChanges(s,r,i)}delete(e){const t=this.field(e.popLast());Ti(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return Xe(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let r=0;r<e.length;++r){let i=t.mapValue.fields[e.get(r)];Ti(i)&&i.mapValue.fields||(i={mapValue:{fields:{}}},t.mapValue.fields[e.get(r)]=i),t=i}return t.mapValue.fields}applyChanges(e,t,r){Bt(t,(i,s)=>e[i]=s);for(const i of r)delete e[i]}clone(){return new Oe(pr(this.value))}}function od(n){const e=[];return Bt(n.fields,(t,r)=>{const i=new ve([t]);if(Ti(r)){const s=od(r.mapValue).fields;if(s.length===0)e.push(i);else for(const a of s)e.push(i.child(a))}else e.push(i)}),new xe(e)}/**
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
 */class Pe{constructor(e,t,r,i,s,a,c){this.key=e,this.documentType=t,this.version=r,this.readTime=i,this.createTime=s,this.data=a,this.documentState=c}static newInvalidDocument(e){return new Pe(e,0,U.min(),U.min(),U.min(),Oe.empty(),0)}static newFoundDocument(e,t,r,i){return new Pe(e,1,t,U.min(),r,i,0)}static newNoDocument(e,t){return new Pe(e,2,t,U.min(),U.min(),Oe.empty(),0)}static newUnknownDocument(e,t){return new Pe(e,3,t,U.min(),U.min(),Oe.empty(),2)}convertToFoundDocument(e,t){return!this.createTime.isEqual(U.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=e),this.version=e,this.documentType=1,this.data=t,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=Oe.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=Oe.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=U.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(e){return e instanceof Pe&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new Pe(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
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
 */class Mi{constructor(e,t){this.position=e,this.inclusive=t}}function Uu(n,e,t){let r=0;for(let i=0;i<n.position.length;i++){const s=e[i],a=n.position[i];if(s.field.isKeyField()?r=M.comparator(M.fromName(a.referenceValue),t.key):r=Tn(a,t.data.field(s.field)),s.dir==="desc"&&(r*=-1),r!==0)break}return r}function Bu(n,e){if(n===null)return e===null;if(e===null||n.inclusive!==e.inclusive||n.position.length!==e.position.length)return!1;for(let t=0;t<n.position.length;t++)if(!Xe(n.position[t],e.position[t]))return!1;return!0}/**
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
 */class br{constructor(e,t="asc"){this.field=e,this.dir=t}}function Fv(n,e){return n.dir===e.dir&&n.field.isEqual(e.field)}/**
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
 */class ad{}class de extends ad{constructor(e,t,r){super(),this.field=e,this.op=t,this.value=r}static create(e,t,r){return e.isKeyField()?t==="in"||t==="not-in"?this.createKeyFieldInFilter(e,t,r):new Bv(e,t,r):t==="array-contains"?new $v(e,r):t==="in"?new Hv(e,r):t==="not-in"?new zv(e,r):t==="array-contains-any"?new Wv(e,r):new de(e,t,r)}static createKeyFieldInFilter(e,t,r){return t==="in"?new qv(e,r):new jv(e,r)}matches(e){const t=e.data.field(this.field);return this.op==="!="?t!==null&&t.nullValue===void 0&&this.matchesComparison(Tn(t,this.value)):t!==null&&Mt(this.value)===Mt(t)&&this.matchesComparison(Tn(t,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return e===0;case"!=":return e!==0;case">":return e>0;case">=":return e>=0;default:return F(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class He extends ad{constructor(e,t){super(),this.filters=e,this.op=t,this.he=null}static create(e,t){return new He(e,t)}matches(e){return cd(this)?this.filters.find(t=>!t.matches(e))===void 0:this.filters.find(t=>t.matches(e))!==void 0}getFlattenedFilters(){return this.he!==null||(this.he=this.filters.reduce((e,t)=>e.concat(t.getFlattenedFilters()),[])),this.he}getFilters(){return Object.assign([],this.filters)}}function cd(n){return n.op==="and"}function ud(n){return Uv(n)&&cd(n)}function Uv(n){for(const e of n.filters)if(e instanceof He)return!1;return!0}function wo(n){if(n instanceof de)return n.field.canonicalString()+n.op.toString()+wn(n.value);if(ud(n))return n.filters.map(e=>wo(e)).join(",");{const e=n.filters.map(t=>wo(t)).join(",");return`${n.op}(${e})`}}function ld(n,e){return n instanceof de?function(r,i){return i instanceof de&&r.op===i.op&&r.field.isEqual(i.field)&&Xe(r.value,i.value)}(n,e):n instanceof He?function(r,i){return i instanceof He&&r.op===i.op&&r.filters.length===i.filters.length?r.filters.reduce((s,a,c)=>s&&ld(a,i.filters[c]),!0):!1}(n,e):void F(19439)}function hd(n){return n instanceof de?function(t){return`${t.field.canonicalString()} ${t.op} ${wn(t.value)}`}(n):n instanceof He?function(t){return t.op.toString()+" {"+t.getFilters().map(hd).join(" ,")+"}"}(n):"Filter"}class Bv extends de{constructor(e,t,r){super(e,t,r),this.key=M.fromName(r.referenceValue)}matches(e){const t=M.comparator(e.key,this.key);return this.matchesComparison(t)}}class qv extends de{constructor(e,t){super(e,"in",t),this.keys=dd("in",t)}matches(e){return this.keys.some(t=>t.isEqual(e.key))}}class jv extends de{constructor(e,t){super(e,"not-in",t),this.keys=dd("not-in",t)}matches(e){return!this.keys.some(t=>t.isEqual(e.key))}}function dd(n,e){var t;return(((t=e.arrayValue)===null||t===void 0?void 0:t.values)||[]).map(r=>M.fromName(r.referenceValue))}class $v extends de{constructor(e,t){super(e,"array-contains",t)}matches(e){const t=e.data.field(this.field);return ua(t)&&Pr(t.arrayValue,this.value)}}class Hv extends de{constructor(e,t){super(e,"in",t)}matches(e){const t=e.data.field(this.field);return t!==null&&Pr(this.value.arrayValue,t)}}class zv extends de{constructor(e,t){super(e,"not-in",t)}matches(e){if(Pr(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const t=e.data.field(this.field);return t!==null&&t.nullValue===void 0&&!Pr(this.value.arrayValue,t)}}class Wv extends de{constructor(e,t){super(e,"array-contains-any",t)}matches(e){const t=e.data.field(this.field);return!(!ua(t)||!t.arrayValue.values)&&t.arrayValue.values.some(r=>Pr(this.value.arrayValue,r))}}/**
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
 */class Gv{constructor(e,t=null,r=[],i=[],s=null,a=null,c=null){this.path=e,this.collectionGroup=t,this.orderBy=r,this.filters=i,this.limit=s,this.startAt=a,this.endAt=c,this.Pe=null}}function qu(n,e=null,t=[],r=[],i=null,s=null,a=null){return new Gv(n,e,t,r,i,s,a)}function la(n){const e=B(n);if(e.Pe===null){let t=e.path.canonicalString();e.collectionGroup!==null&&(t+="|cg:"+e.collectionGroup),t+="|f:",t+=e.filters.map(r=>wo(r)).join(","),t+="|ob:",t+=e.orderBy.map(r=>function(s){return s.field.canonicalString()+s.dir}(r)).join(","),rs(e.limit)||(t+="|l:",t+=e.limit),e.startAt&&(t+="|lb:",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map(r=>wn(r)).join(",")),e.endAt&&(t+="|ub:",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map(r=>wn(r)).join(",")),e.Pe=t}return e.Pe}function ha(n,e){if(n.limit!==e.limit||n.orderBy.length!==e.orderBy.length)return!1;for(let t=0;t<n.orderBy.length;t++)if(!Fv(n.orderBy[t],e.orderBy[t]))return!1;if(n.filters.length!==e.filters.length)return!1;for(let t=0;t<n.filters.length;t++)if(!ld(n.filters[t],e.filters[t]))return!1;return n.collectionGroup===e.collectionGroup&&!!n.path.isEqual(e.path)&&!!Bu(n.startAt,e.startAt)&&Bu(n.endAt,e.endAt)}function Ao(n){return M.isDocumentKey(n.path)&&n.collectionGroup===null&&n.filters.length===0}/**
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
 */class Mn{constructor(e,t=null,r=[],i=[],s=null,a="F",c=null,l=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=r,this.filters=i,this.limit=s,this.limitType=a,this.startAt=c,this.endAt=l,this.Te=null,this.Ie=null,this.de=null,this.startAt,this.endAt}}function Kv(n,e,t,r,i,s,a,c){return new Mn(n,e,t,r,i,s,a,c)}function ss(n){return new Mn(n)}function ju(n){return n.filters.length===0&&n.limit===null&&n.startAt==null&&n.endAt==null&&(n.explicitOrderBy.length===0||n.explicitOrderBy.length===1&&n.explicitOrderBy[0].field.isKeyField())}function fd(n){return n.collectionGroup!==null}function mr(n){const e=B(n);if(e.Te===null){e.Te=[];const t=new Set;for(const s of e.explicitOrderBy)e.Te.push(s),t.add(s.field.canonicalString());const r=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(a){let c=new pe(ve.comparator);return a.filters.forEach(l=>{l.getFlattenedFilters().forEach(d=>{d.isInequality()&&(c=c.add(d.field))})}),c})(e).forEach(s=>{t.has(s.canonicalString())||s.isKeyField()||e.Te.push(new br(s,r))}),t.has(ve.keyField().canonicalString())||e.Te.push(new br(ve.keyField(),r))}return e.Te}function Ge(n){const e=B(n);return e.Ie||(e.Ie=Qv(e,mr(n))),e.Ie}function Qv(n,e){if(n.limitType==="F")return qu(n.path,n.collectionGroup,e,n.filters,n.limit,n.startAt,n.endAt);{e=e.map(i=>{const s=i.dir==="desc"?"asc":"desc";return new br(i.field,s)});const t=n.endAt?new Mi(n.endAt.position,n.endAt.inclusive):null,r=n.startAt?new Mi(n.startAt.position,n.startAt.inclusive):null;return qu(n.path,n.collectionGroup,e,n.filters,n.limit,t,r)}}function Ro(n,e){const t=n.filters.concat([e]);return new Mn(n.path,n.collectionGroup,n.explicitOrderBy.slice(),t,n.limit,n.limitType,n.startAt,n.endAt)}function So(n,e,t){return new Mn(n.path,n.collectionGroup,n.explicitOrderBy.slice(),n.filters.slice(),e,t,n.startAt,n.endAt)}function os(n,e){return ha(Ge(n),Ge(e))&&n.limitType===e.limitType}function pd(n){return`${la(Ge(n))}|lt:${n.limitType}`}function dn(n){return`Query(target=${function(t){let r=t.path.canonicalString();return t.collectionGroup!==null&&(r+=" collectionGroup="+t.collectionGroup),t.filters.length>0&&(r+=`, filters: [${t.filters.map(i=>hd(i)).join(", ")}]`),rs(t.limit)||(r+=", limit: "+t.limit),t.orderBy.length>0&&(r+=`, orderBy: [${t.orderBy.map(i=>function(a){return`${a.field.canonicalString()} (${a.dir})`}(i)).join(", ")}]`),t.startAt&&(r+=", startAt: ",r+=t.startAt.inclusive?"b:":"a:",r+=t.startAt.position.map(i=>wn(i)).join(",")),t.endAt&&(r+=", endAt: ",r+=t.endAt.inclusive?"a:":"b:",r+=t.endAt.position.map(i=>wn(i)).join(",")),`Target(${r})`}(Ge(n))}; limitType=${n.limitType})`}function as(n,e){return e.isFoundDocument()&&function(r,i){const s=i.key.path;return r.collectionGroup!==null?i.key.hasCollectionId(r.collectionGroup)&&r.path.isPrefixOf(s):M.isDocumentKey(r.path)?r.path.isEqual(s):r.path.isImmediateParentOf(s)}(n,e)&&function(r,i){for(const s of mr(r))if(!s.field.isKeyField()&&i.data.field(s.field)===null)return!1;return!0}(n,e)&&function(r,i){for(const s of r.filters)if(!s.matches(i))return!1;return!0}(n,e)&&function(r,i){return!(r.startAt&&!function(a,c,l){const d=Uu(a,c,l);return a.inclusive?d<=0:d<0}(r.startAt,mr(r),i)||r.endAt&&!function(a,c,l){const d=Uu(a,c,l);return a.inclusive?d>=0:d>0}(r.endAt,mr(r),i))}(n,e)}function Yv(n){return n.collectionGroup||(n.path.length%2==1?n.path.lastSegment():n.path.get(n.path.length-2))}function md(n){return(e,t)=>{let r=!1;for(const i of mr(n)){const s=Jv(i,e,t);if(s!==0)return s;r=r||i.field.isKeyField()}return 0}}function Jv(n,e,t){const r=n.field.isKeyField()?M.comparator(e.key,t.key):function(s,a,c){const l=a.data.field(s),d=c.data.field(s);return l!==null&&d!==null?Tn(l,d):F(42886)}(n.field,e,t);switch(n.dir){case"asc":return r;case"desc":return-1*r;default:return F(19790,{direction:n.dir})}}/**
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
 */class sn{constructor(e,t){this.mapKeyFn=e,this.equalsFn=t,this.inner={},this.innerSize=0}get(e){const t=this.mapKeyFn(e),r=this.inner[t];if(r!==void 0){for(const[i,s]of r)if(this.equalsFn(i,e))return s}}has(e){return this.get(e)!==void 0}set(e,t){const r=this.mapKeyFn(e),i=this.inner[r];if(i===void 0)return this.inner[r]=[[e,t]],void this.innerSize++;for(let s=0;s<i.length;s++)if(this.equalsFn(i[s][0],e))return void(i[s]=[e,t]);i.push([e,t]),this.innerSize++}delete(e){const t=this.mapKeyFn(e),r=this.inner[t];if(r===void 0)return!1;for(let i=0;i<r.length;i++)if(this.equalsFn(r[i][0],e))return r.length===1?delete this.inner[t]:r.splice(i,1),this.innerSize--,!0;return!1}forEach(e){Bt(this.inner,(t,r)=>{for(const[i,s]of r)e(i,s)})}isEmpty(){return Xh(this.inner)}size(){return this.innerSize}}/**
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
 */const Xv=new ie(M.comparator);function pt(){return Xv}const gd=new ie(M.comparator);function or(...n){let e=gd;for(const t of n)e=e.insert(t.key,t);return e}function _d(n){let e=gd;return n.forEach((t,r)=>e=e.insert(t,r.overlayedDocument)),e}function Qt(){return gr()}function yd(){return gr()}function gr(){return new sn(n=>n.toString(),(n,e)=>n.isEqual(e))}const Zv=new ie(M.comparator),eI=new pe(M.comparator);function W(...n){let e=eI;for(const t of n)e=e.add(t);return e}const tI=new pe(j);function nI(){return tI}/**
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
 */function da(n,e){if(n.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:Oi(e)?"-0":e}}function vd(n){return{integerValue:""+n}}function rI(n,e){return kv(e)?vd(e):da(n,e)}/**
 * @license
 * Copyright 2018 Google LLC
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
 */class cs{constructor(){this._=void 0}}function iI(n,e,t){return n instanceof Cr?function(i,s){const a={fields:{[td]:{stringValue:ed},[rd]:{timestampValue:{seconds:i.seconds,nanos:i.nanoseconds}}}};return s&&ca(s)&&(s=is(s)),s&&(a.fields[nd]=s),{mapValue:a}}(t,e):n instanceof kr?Ed(n,e):n instanceof Nr?Td(n,e):function(i,s){const a=Id(i,s),c=$u(a)+$u(i.Ee);return To(a)&&To(i.Ee)?vd(c):da(i.serializer,c)}(n,e)}function sI(n,e,t){return n instanceof kr?Ed(n,e):n instanceof Nr?Td(n,e):t}function Id(n,e){return n instanceof xi?function(r){return To(r)||function(s){return!!s&&"doubleValue"in s}(r)}(e)?e:{integerValue:0}:null}class Cr extends cs{}class kr extends cs{constructor(e){super(),this.elements=e}}function Ed(n,e){const t=wd(e);for(const r of n.elements)t.some(i=>Xe(i,r))||t.push(r);return{arrayValue:{values:t}}}class Nr extends cs{constructor(e){super(),this.elements=e}}function Td(n,e){let t=wd(e);for(const r of n.elements)t=t.filter(i=>!Xe(i,r));return{arrayValue:{values:t}}}class xi extends cs{constructor(e,t){super(),this.serializer=e,this.Ee=t}}function $u(n){return ce(n.integerValue||n.doubleValue)}function wd(n){return ua(n)&&n.arrayValue.values?n.arrayValue.values.slice():[]}/**
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
 */class oI{constructor(e,t){this.field=e,this.transform=t}}function aI(n,e){return n.field.isEqual(e.field)&&function(r,i){return r instanceof kr&&i instanceof kr||r instanceof Nr&&i instanceof Nr?En(r.elements,i.elements,Xe):r instanceof xi&&i instanceof xi?Xe(r.Ee,i.Ee):r instanceof Cr&&i instanceof Cr}(n.transform,e.transform)}class cI{constructor(e,t){this.version=e,this.transformResults=t}}class Ve{constructor(e,t){this.updateTime=e,this.exists=t}static none(){return new Ve}static exists(e){return new Ve(void 0,e)}static updateTime(e){return new Ve(e)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}}function wi(n,e){return n.updateTime!==void 0?e.isFoundDocument()&&e.version.isEqual(n.updateTime):n.exists===void 0||n.exists===e.isFoundDocument()}class us{}function Ad(n,e){if(!n.hasLocalMutations||e&&e.fields.length===0)return null;if(e===null)return n.isNoDocument()?new ls(n.key,Ve.none()):new Fr(n.key,n.data,Ve.none());{const t=n.data,r=Oe.empty();let i=new pe(ve.comparator);for(let s of e.fields)if(!i.has(s)){let a=t.field(s);a===null&&s.length>1&&(s=s.popLast(),a=t.field(s)),a===null?r.delete(s):r.set(s,a),i=i.add(s)}return new qt(n.key,r,new xe(i.toArray()),Ve.none())}}function uI(n,e,t){n instanceof Fr?function(i,s,a){const c=i.value.clone(),l=zu(i.fieldTransforms,s,a.transformResults);c.setAll(l),s.convertToFoundDocument(a.version,c).setHasCommittedMutations()}(n,e,t):n instanceof qt?function(i,s,a){if(!wi(i.precondition,s))return void s.convertToUnknownDocument(a.version);const c=zu(i.fieldTransforms,s,a.transformResults),l=s.data;l.setAll(Rd(i)),l.setAll(c),s.convertToFoundDocument(a.version,l).setHasCommittedMutations()}(n,e,t):function(i,s,a){s.convertToNoDocument(a.version).setHasCommittedMutations()}(0,e,t)}function _r(n,e,t,r){return n instanceof Fr?function(s,a,c,l){if(!wi(s.precondition,a))return c;const d=s.value.clone(),p=Wu(s.fieldTransforms,l,a);return d.setAll(p),a.convertToFoundDocument(a.version,d).setHasLocalMutations(),null}(n,e,t,r):n instanceof qt?function(s,a,c,l){if(!wi(s.precondition,a))return c;const d=Wu(s.fieldTransforms,l,a),p=a.data;return p.setAll(Rd(s)),p.setAll(d),a.convertToFoundDocument(a.version,p).setHasLocalMutations(),c===null?null:c.unionWith(s.fieldMask.fields).unionWith(s.fieldTransforms.map(g=>g.field))}(n,e,t,r):function(s,a,c){return wi(s.precondition,a)?(a.convertToNoDocument(a.version).setHasLocalMutations(),null):c}(n,e,t)}function lI(n,e){let t=null;for(const r of n.fieldTransforms){const i=e.data.field(r.field),s=Id(r.transform,i||null);s!=null&&(t===null&&(t=Oe.empty()),t.set(r.field,s))}return t||null}function Hu(n,e){return n.type===e.type&&!!n.key.isEqual(e.key)&&!!n.precondition.isEqual(e.precondition)&&!!function(r,i){return r===void 0&&i===void 0||!(!r||!i)&&En(r,i,(s,a)=>aI(s,a))}(n.fieldTransforms,e.fieldTransforms)&&(n.type===0?n.value.isEqual(e.value):n.type!==1||n.data.isEqual(e.data)&&n.fieldMask.isEqual(e.fieldMask))}class Fr extends us{constructor(e,t,r,i=[]){super(),this.key=e,this.value=t,this.precondition=r,this.fieldTransforms=i,this.type=0}getFieldMask(){return null}}class qt extends us{constructor(e,t,r,i,s=[]){super(),this.key=e,this.data=t,this.fieldMask=r,this.precondition=i,this.fieldTransforms=s,this.type=1}getFieldMask(){return this.fieldMask}}function Rd(n){const e=new Map;return n.fieldMask.fields.forEach(t=>{if(!t.isEmpty()){const r=n.data.field(t);e.set(t,r)}}),e}function zu(n,e,t){const r=new Map;Q(n.length===t.length,32656,{Ae:t.length,Re:n.length});for(let i=0;i<t.length;i++){const s=n[i],a=s.transform,c=e.data.field(s.field);r.set(s.field,sI(a,c,t[i]))}return r}function Wu(n,e,t){const r=new Map;for(const i of n){const s=i.transform,a=t.data.field(i.field);r.set(i.field,iI(s,a,e))}return r}class ls extends us{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class hI extends us{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
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
 */class dI{constructor(e,t,r,i){this.batchId=e,this.localWriteTime=t,this.baseMutations=r,this.mutations=i}applyToRemoteDocument(e,t){const r=t.mutationResults;for(let i=0;i<this.mutations.length;i++){const s=this.mutations[i];s.key.isEqual(e.key)&&uI(s,e,r[i])}}applyToLocalView(e,t){for(const r of this.baseMutations)r.key.isEqual(e.key)&&(t=_r(r,e,t,this.localWriteTime));for(const r of this.mutations)r.key.isEqual(e.key)&&(t=_r(r,e,t,this.localWriteTime));return t}applyToLocalDocumentSet(e,t){const r=yd();return this.mutations.forEach(i=>{const s=e.get(i.key),a=s.overlayedDocument;let c=this.applyToLocalView(a,s.mutatedFields);c=t.has(i.key)?null:c;const l=Ad(a,c);l!==null&&r.set(i.key,l),a.isValidDocument()||a.convertToNoDocument(U.min())}),r}keys(){return this.mutations.reduce((e,t)=>e.add(t.key),W())}isEqual(e){return this.batchId===e.batchId&&En(this.mutations,e.mutations,(t,r)=>Hu(t,r))&&En(this.baseMutations,e.baseMutations,(t,r)=>Hu(t,r))}}class fa{constructor(e,t,r,i){this.batch=e,this.commitVersion=t,this.mutationResults=r,this.docVersions=i}static from(e,t,r){Q(e.mutations.length===r.length,58842,{Ve:e.mutations.length,me:r.length});let i=function(){return Zv}();const s=e.mutations;for(let a=0;a<s.length;a++)i=i.insert(s[a].key,r[a].version);return new fa(e,t,r,i)}}/**
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
 */class fI{constructor(e,t){this.largestBatchId=e,this.mutation=t}getKey(){return this.mutation.key}isEqual(e){return e!==null&&this.mutation===e.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}}/**
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
 */class pI{constructor(e,t){this.count=e,this.unchangedNames=t}}/**
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
 */var le,G;function mI(n){switch(n){case S.OK:return F(64938);case S.CANCELLED:case S.UNKNOWN:case S.DEADLINE_EXCEEDED:case S.RESOURCE_EXHAUSTED:case S.INTERNAL:case S.UNAVAILABLE:case S.UNAUTHENTICATED:return!1;case S.INVALID_ARGUMENT:case S.NOT_FOUND:case S.ALREADY_EXISTS:case S.PERMISSION_DENIED:case S.FAILED_PRECONDITION:case S.ABORTED:case S.OUT_OF_RANGE:case S.UNIMPLEMENTED:case S.DATA_LOSS:return!0;default:return F(15467,{code:n})}}function Sd(n){if(n===void 0)return ft("GRPC error has no .code"),S.UNKNOWN;switch(n){case le.OK:return S.OK;case le.CANCELLED:return S.CANCELLED;case le.UNKNOWN:return S.UNKNOWN;case le.DEADLINE_EXCEEDED:return S.DEADLINE_EXCEEDED;case le.RESOURCE_EXHAUSTED:return S.RESOURCE_EXHAUSTED;case le.INTERNAL:return S.INTERNAL;case le.UNAVAILABLE:return S.UNAVAILABLE;case le.UNAUTHENTICATED:return S.UNAUTHENTICATED;case le.INVALID_ARGUMENT:return S.INVALID_ARGUMENT;case le.NOT_FOUND:return S.NOT_FOUND;case le.ALREADY_EXISTS:return S.ALREADY_EXISTS;case le.PERMISSION_DENIED:return S.PERMISSION_DENIED;case le.FAILED_PRECONDITION:return S.FAILED_PRECONDITION;case le.ABORTED:return S.ABORTED;case le.OUT_OF_RANGE:return S.OUT_OF_RANGE;case le.UNIMPLEMENTED:return S.UNIMPLEMENTED;case le.DATA_LOSS:return S.DATA_LOSS;default:return F(39323,{code:n})}}(G=le||(le={}))[G.OK=0]="OK",G[G.CANCELLED=1]="CANCELLED",G[G.UNKNOWN=2]="UNKNOWN",G[G.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",G[G.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",G[G.NOT_FOUND=5]="NOT_FOUND",G[G.ALREADY_EXISTS=6]="ALREADY_EXISTS",G[G.PERMISSION_DENIED=7]="PERMISSION_DENIED",G[G.UNAUTHENTICATED=16]="UNAUTHENTICATED",G[G.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",G[G.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",G[G.ABORTED=10]="ABORTED",G[G.OUT_OF_RANGE=11]="OUT_OF_RANGE",G[G.UNIMPLEMENTED=12]="UNIMPLEMENTED",G[G.INTERNAL=13]="INTERNAL",G[G.UNAVAILABLE=14]="UNAVAILABLE",G[G.DATA_LOSS=15]="DATA_LOSS";/**
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
 */const gI=new kt([4294967295,4294967295],0);function Gu(n){const e=Kh().encode(n),t=new Bh;return t.update(e),new Uint8Array(t.digest())}function Ku(n){const e=new DataView(n.buffer),t=e.getUint32(0,!0),r=e.getUint32(4,!0),i=e.getUint32(8,!0),s=e.getUint32(12,!0);return[new kt([t,r],0),new kt([i,s],0)]}class pa{constructor(e,t,r){if(this.bitmap=e,this.padding=t,this.hashCount=r,t<0||t>=8)throw new ar(`Invalid padding: ${t}`);if(r<0)throw new ar(`Invalid hash count: ${r}`);if(e.length>0&&this.hashCount===0)throw new ar(`Invalid hash count: ${r}`);if(e.length===0&&t!==0)throw new ar(`Invalid padding when bitmap length is 0: ${t}`);this.fe=8*e.length-t,this.ge=kt.fromNumber(this.fe)}pe(e,t,r){let i=e.add(t.multiply(kt.fromNumber(r)));return i.compare(gI)===1&&(i=new kt([i.getBits(0),i.getBits(1)],0)),i.modulo(this.ge).toNumber()}ye(e){return!!(this.bitmap[Math.floor(e/8)]&1<<e%8)}mightContain(e){if(this.fe===0)return!1;const t=Gu(e),[r,i]=Ku(t);for(let s=0;s<this.hashCount;s++){const a=this.pe(r,i,s);if(!this.ye(a))return!1}return!0}static create(e,t,r){const i=e%8==0?0:8-e%8,s=new Uint8Array(Math.ceil(e/8)),a=new pa(s,i,t);return r.forEach(c=>a.insert(c)),a}insert(e){if(this.fe===0)return;const t=Gu(e),[r,i]=Ku(t);for(let s=0;s<this.hashCount;s++){const a=this.pe(r,i,s);this.we(a)}}we(e){const t=Math.floor(e/8),r=e%8;this.bitmap[t]|=1<<r}}class ar extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
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
 */class hs{constructor(e,t,r,i,s){this.snapshotVersion=e,this.targetChanges=t,this.targetMismatches=r,this.documentUpdates=i,this.resolvedLimboDocuments=s}static createSynthesizedRemoteEventForCurrentChange(e,t,r){const i=new Map;return i.set(e,Ur.createSynthesizedTargetChangeForCurrentChange(e,t,r)),new hs(U.min(),i,new ie(j),pt(),W())}}class Ur{constructor(e,t,r,i,s){this.resumeToken=e,this.current=t,this.addedDocuments=r,this.modifiedDocuments=i,this.removedDocuments=s}static createSynthesizedTargetChangeForCurrentChange(e,t,r){return new Ur(r,t,W(),W(),W())}}/**
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
 */class Ai{constructor(e,t,r,i){this.Se=e,this.removedTargetIds=t,this.key=r,this.be=i}}class Pd{constructor(e,t){this.targetId=e,this.De=t}}class bd{constructor(e,t,r=Ie.EMPTY_BYTE_STRING,i=null){this.state=e,this.targetIds=t,this.resumeToken=r,this.cause=i}}class Qu{constructor(){this.ve=0,this.Ce=Yu(),this.Fe=Ie.EMPTY_BYTE_STRING,this.Me=!1,this.xe=!0}get current(){return this.Me}get resumeToken(){return this.Fe}get Oe(){return this.ve!==0}get Ne(){return this.xe}Be(e){e.approximateByteSize()>0&&(this.xe=!0,this.Fe=e)}Le(){let e=W(),t=W(),r=W();return this.Ce.forEach((i,s)=>{switch(s){case 0:e=e.add(i);break;case 2:t=t.add(i);break;case 1:r=r.add(i);break;default:F(38017,{changeType:s})}}),new Ur(this.Fe,this.Me,e,t,r)}ke(){this.xe=!1,this.Ce=Yu()}qe(e,t){this.xe=!0,this.Ce=this.Ce.insert(e,t)}Qe(e){this.xe=!0,this.Ce=this.Ce.remove(e)}$e(){this.ve+=1}Ue(){this.ve-=1,Q(this.ve>=0,3241,{ve:this.ve})}Ke(){this.xe=!0,this.Me=!0}}class _I{constructor(e){this.We=e,this.Ge=new Map,this.ze=pt(),this.je=pi(),this.Je=pi(),this.He=new ie(j)}Ye(e){for(const t of e.Se)e.be&&e.be.isFoundDocument()?this.Ze(t,e.be):this.Xe(t,e.key,e.be);for(const t of e.removedTargetIds)this.Xe(t,e.key,e.be)}et(e){this.forEachTarget(e,t=>{const r=this.tt(t);switch(e.state){case 0:this.nt(t)&&r.Be(e.resumeToken);break;case 1:r.Ue(),r.Oe||r.ke(),r.Be(e.resumeToken);break;case 2:r.Ue(),r.Oe||this.removeTarget(t);break;case 3:this.nt(t)&&(r.Ke(),r.Be(e.resumeToken));break;case 4:this.nt(t)&&(this.rt(t),r.Be(e.resumeToken));break;default:F(56790,{state:e.state})}})}forEachTarget(e,t){e.targetIds.length>0?e.targetIds.forEach(t):this.Ge.forEach((r,i)=>{this.nt(i)&&t(i)})}it(e){const t=e.targetId,r=e.De.count,i=this.st(t);if(i){const s=i.target;if(Ao(s))if(r===0){const a=new M(s.path);this.Xe(t,a,Pe.newNoDocument(a,U.min()))}else Q(r===1,20013,{expectedCount:r});else{const a=this.ot(t);if(a!==r){const c=this._t(e),l=c?this.ut(c,e,a):1;if(l!==0){this.rt(t);const d=l===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.He=this.He.insert(t,d)}}}}}_t(e){const t=e.De.unchangedNames;if(!t||!t.bits)return null;const{bits:{bitmap:r="",padding:i=0},hashCount:s=0}=t;let a,c;try{a=Lt(r).toUint8Array()}catch(l){if(l instanceof Zh)return Dt("Decoding the base64 bloom filter in existence filter failed ("+l.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw l}try{c=new pa(a,i,s)}catch(l){return Dt(l instanceof ar?"BloomFilter error: ":"Applying bloom filter failed: ",l),null}return c.fe===0?null:c}ut(e,t,r){return t.De.count===r-this.ht(e,t.targetId)?0:2}ht(e,t){const r=this.We.getRemoteKeysForTarget(t);let i=0;return r.forEach(s=>{const a=this.We.lt(),c=`projects/${a.projectId}/databases/${a.database}/documents/${s.path.canonicalString()}`;e.mightContain(c)||(this.Xe(t,s,null),i++)}),i}Pt(e){const t=new Map;this.Ge.forEach((s,a)=>{const c=this.st(a);if(c){if(s.current&&Ao(c.target)){const l=new M(c.target.path);this.Tt(l).has(a)||this.It(a,l)||this.Xe(a,l,Pe.newNoDocument(l,e))}s.Ne&&(t.set(a,s.Le()),s.ke())}});let r=W();this.Je.forEach((s,a)=>{let c=!0;a.forEachWhile(l=>{const d=this.st(l);return!d||d.purpose==="TargetPurposeLimboResolution"||(c=!1,!1)}),c&&(r=r.add(s))}),this.ze.forEach((s,a)=>a.setReadTime(e));const i=new hs(e,t,this.He,this.ze,r);return this.ze=pt(),this.je=pi(),this.Je=pi(),this.He=new ie(j),i}Ze(e,t){if(!this.nt(e))return;const r=this.It(e,t.key)?2:0;this.tt(e).qe(t.key,r),this.ze=this.ze.insert(t.key,t),this.je=this.je.insert(t.key,this.Tt(t.key).add(e)),this.Je=this.Je.insert(t.key,this.dt(t.key).add(e))}Xe(e,t,r){if(!this.nt(e))return;const i=this.tt(e);this.It(e,t)?i.qe(t,1):i.Qe(t),this.Je=this.Je.insert(t,this.dt(t).delete(e)),this.Je=this.Je.insert(t,this.dt(t).add(e)),r&&(this.ze=this.ze.insert(t,r))}removeTarget(e){this.Ge.delete(e)}ot(e){const t=this.tt(e).Le();return this.We.getRemoteKeysForTarget(e).size+t.addedDocuments.size-t.removedDocuments.size}$e(e){this.tt(e).$e()}tt(e){let t=this.Ge.get(e);return t||(t=new Qu,this.Ge.set(e,t)),t}dt(e){let t=this.Je.get(e);return t||(t=new pe(j),this.Je=this.Je.insert(e,t)),t}Tt(e){let t=this.je.get(e);return t||(t=new pe(j),this.je=this.je.insert(e,t)),t}nt(e){const t=this.st(e)!==null;return t||V("WatchChangeAggregator","Detected inactive target",e),t}st(e){const t=this.Ge.get(e);return t&&t.Oe?null:this.We.Et(e)}rt(e){this.Ge.set(e,new Qu),this.We.getRemoteKeysForTarget(e).forEach(t=>{this.Xe(e,t,null)})}It(e,t){return this.We.getRemoteKeysForTarget(e).has(t)}}function pi(){return new ie(M.comparator)}function Yu(){return new ie(M.comparator)}const yI={asc:"ASCENDING",desc:"DESCENDING"},vI={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},II={and:"AND",or:"OR"};class EI{constructor(e,t){this.databaseId=e,this.useProto3Json=t}}function Po(n,e){return n.useProto3Json||rs(e)?e:{value:e}}function Fi(n,e){return n.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function Cd(n,e){return n.useProto3Json?e.toBase64():e.toUint8Array()}function TI(n,e){return Fi(n,e.toTimestamp())}function Ke(n){return Q(!!n,49232),U.fromTimestamp(function(t){const r=Vt(t);return new Z(r.seconds,r.nanos)}(n))}function ma(n,e){return bo(n,e).canonicalString()}function bo(n,e){const t=function(i){return new J(["projects",i.projectId,"databases",i.database])}(n).child("documents");return e===void 0?t:t.child(e)}function kd(n){const e=J.fromString(n);return Q(Ld(e),10190,{key:e.toString()}),e}function Co(n,e){return ma(n.databaseId,e.path)}function so(n,e){const t=kd(e);if(t.get(1)!==n.databaseId.projectId)throw new O(S.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+t.get(1)+" vs "+n.databaseId.projectId);if(t.get(3)!==n.databaseId.database)throw new O(S.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+t.get(3)+" vs "+n.databaseId.database);return new M(Dd(t))}function Nd(n,e){return ma(n.databaseId,e)}function wI(n){const e=kd(n);return e.length===4?J.emptyPath():Dd(e)}function ko(n){return new J(["projects",n.databaseId.projectId,"databases",n.databaseId.database]).canonicalString()}function Dd(n){return Q(n.length>4&&n.get(4)==="documents",29091,{key:n.toString()}),n.popFirst(5)}function Ju(n,e,t){return{name:Co(n,e),fields:t.value.mapValue.fields}}function AI(n,e){let t;if("targetChange"in e){e.targetChange;const r=function(d){return d==="NO_CHANGE"?0:d==="ADD"?1:d==="REMOVE"?2:d==="CURRENT"?3:d==="RESET"?4:F(39313,{state:d})}(e.targetChange.targetChangeType||"NO_CHANGE"),i=e.targetChange.targetIds||[],s=function(d,p){return d.useProto3Json?(Q(p===void 0||typeof p=="string",58123),Ie.fromBase64String(p||"")):(Q(p===void 0||p instanceof Buffer||p instanceof Uint8Array,16193),Ie.fromUint8Array(p||new Uint8Array))}(n,e.targetChange.resumeToken),a=e.targetChange.cause,c=a&&function(d){const p=d.code===void 0?S.UNKNOWN:Sd(d.code);return new O(p,d.message||"")}(a);t=new bd(r,i,s,c||null)}else if("documentChange"in e){e.documentChange;const r=e.documentChange;r.document,r.document.name,r.document.updateTime;const i=so(n,r.document.name),s=Ke(r.document.updateTime),a=r.document.createTime?Ke(r.document.createTime):U.min(),c=new Oe({mapValue:{fields:r.document.fields}}),l=Pe.newFoundDocument(i,s,a,c),d=r.targetIds||[],p=r.removedTargetIds||[];t=new Ai(d,p,l.key,l)}else if("documentDelete"in e){e.documentDelete;const r=e.documentDelete;r.document;const i=so(n,r.document),s=r.readTime?Ke(r.readTime):U.min(),a=Pe.newNoDocument(i,s),c=r.removedTargetIds||[];t=new Ai([],c,a.key,a)}else if("documentRemove"in e){e.documentRemove;const r=e.documentRemove;r.document;const i=so(n,r.document),s=r.removedTargetIds||[];t=new Ai([],s,i,null)}else{if(!("filter"in e))return F(11601,{At:e});{e.filter;const r=e.filter;r.targetId;const{count:i=0,unchangedNames:s}=r,a=new pI(i,s),c=r.targetId;t=new Pd(c,a)}}return t}function RI(n,e){let t;if(e instanceof Fr)t={update:Ju(n,e.key,e.value)};else if(e instanceof ls)t={delete:Co(n,e.key)};else if(e instanceof qt)t={update:Ju(n,e.key,e.data),updateMask:VI(e.fieldMask)};else{if(!(e instanceof hI))return F(16599,{Rt:e.type});t={verify:Co(n,e.key)}}return e.fieldTransforms.length>0&&(t.updateTransforms=e.fieldTransforms.map(r=>function(s,a){const c=a.transform;if(c instanceof Cr)return{fieldPath:a.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(c instanceof kr)return{fieldPath:a.field.canonicalString(),appendMissingElements:{values:c.elements}};if(c instanceof Nr)return{fieldPath:a.field.canonicalString(),removeAllFromArray:{values:c.elements}};if(c instanceof xi)return{fieldPath:a.field.canonicalString(),increment:c.Ee};throw F(20930,{transform:a.transform})}(0,r))),e.precondition.isNone||(t.currentDocument=function(i,s){return s.updateTime!==void 0?{updateTime:TI(i,s.updateTime)}:s.exists!==void 0?{exists:s.exists}:F(27497)}(n,e.precondition)),t}function SI(n,e){return n&&n.length>0?(Q(e!==void 0,14353),n.map(t=>function(i,s){let a=i.updateTime?Ke(i.updateTime):Ke(s);return a.isEqual(U.min())&&(a=Ke(s)),new cI(a,i.transformResults||[])}(t,e))):[]}function PI(n,e){return{documents:[Nd(n,e.path)]}}function bI(n,e){const t={structuredQuery:{}},r=e.path;let i;e.collectionGroup!==null?(i=r,t.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(i=r.popLast(),t.structuredQuery.from=[{collectionId:r.lastSegment()}]),t.parent=Nd(n,i);const s=function(d){if(d.length!==0)return Vd(He.create(d,"and"))}(e.filters);s&&(t.structuredQuery.where=s);const a=function(d){if(d.length!==0)return d.map(p=>function(v){return{field:fn(v.field),direction:NI(v.dir)}}(p))}(e.orderBy);a&&(t.structuredQuery.orderBy=a);const c=Po(n,e.limit);return c!==null&&(t.structuredQuery.limit=c),e.startAt&&(t.structuredQuery.startAt=function(d){return{before:d.inclusive,values:d.position}}(e.startAt)),e.endAt&&(t.structuredQuery.endAt=function(d){return{before:!d.inclusive,values:d.position}}(e.endAt)),{Vt:t,parent:i}}function CI(n){let e=wI(n.parent);const t=n.structuredQuery,r=t.from?t.from.length:0;let i=null;if(r>0){Q(r===1,65062);const p=t.from[0];p.allDescendants?i=p.collectionId:e=e.child(p.collectionId)}let s=[];t.where&&(s=function(g){const v=Od(g);return v instanceof He&&ud(v)?v.getFilters():[v]}(t.where));let a=[];t.orderBy&&(a=function(g){return g.map(v=>function(k){return new br(pn(k.field),function(D){switch(D){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}}(k.direction))}(v))}(t.orderBy));let c=null;t.limit&&(c=function(g){let v;return v=typeof g=="object"?g.value:g,rs(v)?null:v}(t.limit));let l=null;t.startAt&&(l=function(g){const v=!!g.before,P=g.values||[];return new Mi(P,v)}(t.startAt));let d=null;return t.endAt&&(d=function(g){const v=!g.before,P=g.values||[];return new Mi(P,v)}(t.endAt)),Kv(e,i,a,s,c,"F",l,d)}function kI(n,e){const t=function(i){switch(i){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return F(28987,{purpose:i})}}(e.purpose);return t==null?null:{"goog-listen-tags":t}}function Od(n){return n.unaryFilter!==void 0?function(t){switch(t.unaryFilter.op){case"IS_NAN":const r=pn(t.unaryFilter.field);return de.create(r,"==",{doubleValue:NaN});case"IS_NULL":const i=pn(t.unaryFilter.field);return de.create(i,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const s=pn(t.unaryFilter.field);return de.create(s,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const a=pn(t.unaryFilter.field);return de.create(a,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return F(61313);default:return F(60726)}}(n):n.fieldFilter!==void 0?function(t){return de.create(pn(t.fieldFilter.field),function(i){switch(i){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return F(58110);default:return F(50506)}}(t.fieldFilter.op),t.fieldFilter.value)}(n):n.compositeFilter!==void 0?function(t){return He.create(t.compositeFilter.filters.map(r=>Od(r)),function(i){switch(i){case"AND":return"and";case"OR":return"or";default:return F(1026)}}(t.compositeFilter.op))}(n):F(30097,{filter:n})}function NI(n){return yI[n]}function DI(n){return vI[n]}function OI(n){return II[n]}function fn(n){return{fieldPath:n.canonicalString()}}function pn(n){return ve.fromServerFormat(n.fieldPath)}function Vd(n){return n instanceof de?function(t){if(t.op==="=="){if(Fu(t.value))return{unaryFilter:{field:fn(t.field),op:"IS_NAN"}};if(xu(t.value))return{unaryFilter:{field:fn(t.field),op:"IS_NULL"}}}else if(t.op==="!="){if(Fu(t.value))return{unaryFilter:{field:fn(t.field),op:"IS_NOT_NAN"}};if(xu(t.value))return{unaryFilter:{field:fn(t.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:fn(t.field),op:DI(t.op),value:t.value}}}(n):n instanceof He?function(t){const r=t.getFilters().map(i=>Vd(i));return r.length===1?r[0]:{compositeFilter:{op:OI(t.op),filters:r}}}(n):F(54877,{filter:n})}function VI(n){const e=[];return n.fields.forEach(t=>e.push(t.canonicalString())),{fieldPaths:e}}function Ld(n){return n.length>=4&&n.get(0)==="projects"&&n.get(2)==="databases"}/**
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
 */class At{constructor(e,t,r,i,s=U.min(),a=U.min(),c=Ie.EMPTY_BYTE_STRING,l=null){this.target=e,this.targetId=t,this.purpose=r,this.sequenceNumber=i,this.snapshotVersion=s,this.lastLimboFreeSnapshotVersion=a,this.resumeToken=c,this.expectedCount=l}withSequenceNumber(e){return new At(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,t){return new At(this.target,this.targetId,this.purpose,this.sequenceNumber,t,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new At(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new At(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}}/**
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
 */class LI{constructor(e){this.gt=e}}function MI(n){const e=CI({parent:n.parent,structuredQuery:n.structuredQuery});return n.limitType==="LAST"?So(e,e.limit,"L"):e}/**
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
 */class xI{constructor(){this.Dn=new FI}addToCollectionParentIndex(e,t){return this.Dn.add(t),b.resolve()}getCollectionParents(e,t){return b.resolve(this.Dn.getEntries(t))}addFieldIndex(e,t){return b.resolve()}deleteFieldIndex(e,t){return b.resolve()}deleteAllFieldIndexes(e){return b.resolve()}createTargetIndexes(e,t){return b.resolve()}getDocumentsMatchingTarget(e,t){return b.resolve(null)}getIndexType(e,t){return b.resolve(0)}getFieldIndexes(e,t){return b.resolve([])}getNextCollectionGroupToUpdate(e){return b.resolve(null)}getMinOffset(e,t){return b.resolve(Ot.min())}getMinOffsetFromCollectionGroup(e,t){return b.resolve(Ot.min())}updateCollectionGroup(e,t,r){return b.resolve()}updateIndexEntries(e,t){return b.resolve()}}class FI{constructor(){this.index={}}add(e){const t=e.lastSegment(),r=e.popLast(),i=this.index[t]||new pe(J.comparator),s=!i.has(r);return this.index[t]=i.add(r),s}has(e){const t=e.lastSegment(),r=e.popLast(),i=this.index[t];return i&&i.has(r)}getEntries(e){return(this.index[e]||new pe(J.comparator)).toArray()}}/**
 * @license
 * Copyright 2018 Google LLC
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
 */const Xu={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},Md=41943040;class De{static withCacheSize(e){return new De(e,De.DEFAULT_COLLECTION_PERCENTILE,De.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(e,t,r){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=t,this.maximumSequenceNumbersToCollect=r}}/**
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
 */De.DEFAULT_COLLECTION_PERCENTILE=10,De.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,De.DEFAULT=new De(Md,De.DEFAULT_COLLECTION_PERCENTILE,De.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),De.DISABLED=new De(-1,0,0);/**
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
 */class An{constructor(e){this._r=e}next(){return this._r+=2,this._r}static ar(){return new An(0)}static ur(){return new An(-1)}}/**
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
 */const Zu="LruGarbageCollector",UI=1048576;function el([n,e],[t,r]){const i=j(n,t);return i===0?j(e,r):i}class BI{constructor(e){this.Tr=e,this.buffer=new pe(el),this.Ir=0}dr(){return++this.Ir}Er(e){const t=[e,this.dr()];if(this.buffer.size<this.Tr)this.buffer=this.buffer.add(t);else{const r=this.buffer.last();el(t,r)<0&&(this.buffer=this.buffer.delete(r).add(t))}}get maxValue(){return this.buffer.last()[0]}}class qI{constructor(e,t,r){this.garbageCollector=e,this.asyncQueue=t,this.localStore=r,this.Ar=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.Rr(6e4)}stop(){this.Ar&&(this.Ar.cancel(),this.Ar=null)}get started(){return this.Ar!==null}Rr(e){V(Zu,`Garbage collection scheduled in ${e}ms`),this.Ar=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",e,async()=>{this.Ar=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(t){Ln(t)?V(Zu,"Ignoring IndexedDB error during garbage collection: ",t):await Vn(t)}await this.Rr(3e5)})}}class jI{constructor(e,t){this.Vr=e,this.params=t}calculateTargetCount(e,t){return this.Vr.mr(e).next(r=>Math.floor(t/100*r))}nthSequenceNumber(e,t){if(t===0)return b.resolve(ns.ue);const r=new BI(t);return this.Vr.forEachTarget(e,i=>r.Er(i.sequenceNumber)).next(()=>this.Vr.gr(e,i=>r.Er(i))).next(()=>r.maxValue)}removeTargets(e,t,r){return this.Vr.removeTargets(e,t,r)}removeOrphanedDocuments(e,t){return this.Vr.removeOrphanedDocuments(e,t)}collect(e,t){return this.params.cacheSizeCollectionThreshold===-1?(V("LruGarbageCollector","Garbage collection skipped; disabled"),b.resolve(Xu)):this.getCacheSize(e).next(r=>r<this.params.cacheSizeCollectionThreshold?(V("LruGarbageCollector",`Garbage collection skipped; Cache size ${r} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),Xu):this.pr(e,t))}getCacheSize(e){return this.Vr.getCacheSize(e)}pr(e,t){let r,i,s,a,c,l,d;const p=Date.now();return this.calculateTargetCount(e,this.params.percentileToCollect).next(g=>(g>this.params.maximumSequenceNumbersToCollect?(V("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${g}`),i=this.params.maximumSequenceNumbersToCollect):i=g,a=Date.now(),this.nthSequenceNumber(e,i))).next(g=>(r=g,c=Date.now(),this.removeTargets(e,r,t))).next(g=>(s=g,l=Date.now(),this.removeOrphanedDocuments(e,r))).next(g=>(d=Date.now(),hn()<=z.DEBUG&&V("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${a-p}ms
	Determined least recently used ${i} in `+(c-a)+`ms
	Removed ${s} targets in `+(l-c)+`ms
	Removed ${g} documents in `+(d-l)+`ms
Total Duration: ${d-p}ms`),b.resolve({didRun:!0,sequenceNumbersCollected:i,targetsRemoved:s,documentsRemoved:g})))}}function $I(n,e){return new jI(n,e)}/**
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
 */class HI{constructor(){this.changes=new sn(e=>e.toString(),(e,t)=>e.isEqual(t)),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,t){this.assertNotApplied(),this.changes.set(e,Pe.newInvalidDocument(e).setReadTime(t))}getEntry(e,t){this.assertNotApplied();const r=this.changes.get(t);return r!==void 0?b.resolve(r):this.getFromCache(e,t)}getEntries(e,t){return this.getAllFromCache(e,t)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}}/**
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
 *//**
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
 */class zI{constructor(e,t){this.overlayedDocument=e,this.mutatedFields=t}}/**
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
 */class WI{constructor(e,t,r,i){this.remoteDocumentCache=e,this.mutationQueue=t,this.documentOverlayCache=r,this.indexManager=i}getDocument(e,t){let r=null;return this.documentOverlayCache.getOverlay(e,t).next(i=>(r=i,this.remoteDocumentCache.getEntry(e,t))).next(i=>(r!==null&&_r(r.mutation,i,xe.empty(),Z.now()),i))}getDocuments(e,t){return this.remoteDocumentCache.getEntries(e,t).next(r=>this.getLocalViewOfDocuments(e,r,W()).next(()=>r))}getLocalViewOfDocuments(e,t,r=W()){const i=Qt();return this.populateOverlays(e,i,t).next(()=>this.computeViews(e,t,i,r).next(s=>{let a=or();return s.forEach((c,l)=>{a=a.insert(c,l.overlayedDocument)}),a}))}getOverlayedDocuments(e,t){const r=Qt();return this.populateOverlays(e,r,t).next(()=>this.computeViews(e,t,r,W()))}populateOverlays(e,t,r){const i=[];return r.forEach(s=>{t.has(s)||i.push(s)}),this.documentOverlayCache.getOverlays(e,i).next(s=>{s.forEach((a,c)=>{t.set(a,c)})})}computeViews(e,t,r,i){let s=pt();const a=gr(),c=function(){return gr()}();return t.forEach((l,d)=>{const p=r.get(d.key);i.has(d.key)&&(p===void 0||p.mutation instanceof qt)?s=s.insert(d.key,d):p!==void 0?(a.set(d.key,p.mutation.getFieldMask()),_r(p.mutation,d,p.mutation.getFieldMask(),Z.now())):a.set(d.key,xe.empty())}),this.recalculateAndSaveOverlays(e,s).next(l=>(l.forEach((d,p)=>a.set(d,p)),t.forEach((d,p)=>{var g;return c.set(d,new zI(p,(g=a.get(d))!==null&&g!==void 0?g:null))}),c))}recalculateAndSaveOverlays(e,t){const r=gr();let i=new ie((a,c)=>a-c),s=W();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,t).next(a=>{for(const c of a)c.keys().forEach(l=>{const d=t.get(l);if(d===null)return;let p=r.get(l)||xe.empty();p=c.applyToLocalView(d,p),r.set(l,p);const g=(i.get(c.batchId)||W()).add(l);i=i.insert(c.batchId,g)})}).next(()=>{const a=[],c=i.getReverseIterator();for(;c.hasNext();){const l=c.getNext(),d=l.key,p=l.value,g=yd();p.forEach(v=>{if(!s.has(v)){const P=Ad(t.get(v),r.get(v));P!==null&&g.set(v,P),s=s.add(v)}}),a.push(this.documentOverlayCache.saveOverlays(e,d,g))}return b.waitFor(a)}).next(()=>r)}recalculateAndSaveOverlaysForDocumentKeys(e,t){return this.remoteDocumentCache.getEntries(e,t).next(r=>this.recalculateAndSaveOverlays(e,r))}getDocumentsMatchingQuery(e,t,r,i){return function(a){return M.isDocumentKey(a.path)&&a.collectionGroup===null&&a.filters.length===0}(t)?this.getDocumentsMatchingDocumentQuery(e,t.path):fd(t)?this.getDocumentsMatchingCollectionGroupQuery(e,t,r,i):this.getDocumentsMatchingCollectionQuery(e,t,r,i)}getNextDocuments(e,t,r,i){return this.remoteDocumentCache.getAllFromCollectionGroup(e,t,r,i).next(s=>{const a=i-s.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,t,r.largestBatchId,i-s.size):b.resolve(Qt());let c=Ar,l=s;return a.next(d=>b.forEach(d,(p,g)=>(c<g.largestBatchId&&(c=g.largestBatchId),s.get(p)?b.resolve():this.remoteDocumentCache.getEntry(e,p).next(v=>{l=l.insert(p,v)}))).next(()=>this.populateOverlays(e,d,s)).next(()=>this.computeViews(e,l,d,W())).next(p=>({batchId:c,changes:_d(p)})))})}getDocumentsMatchingDocumentQuery(e,t){return this.getDocument(e,new M(t)).next(r=>{let i=or();return r.isFoundDocument()&&(i=i.insert(r.key,r)),i})}getDocumentsMatchingCollectionGroupQuery(e,t,r,i){const s=t.collectionGroup;let a=or();return this.indexManager.getCollectionParents(e,s).next(c=>b.forEach(c,l=>{const d=function(g,v){return new Mn(v,null,g.explicitOrderBy.slice(),g.filters.slice(),g.limit,g.limitType,g.startAt,g.endAt)}(t,l.child(s));return this.getDocumentsMatchingCollectionQuery(e,d,r,i).next(p=>{p.forEach((g,v)=>{a=a.insert(g,v)})})}).next(()=>a))}getDocumentsMatchingCollectionQuery(e,t,r,i){let s;return this.documentOverlayCache.getOverlaysForCollection(e,t.path,r.largestBatchId).next(a=>(s=a,this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,r,s,i))).next(a=>{s.forEach((l,d)=>{const p=d.getKey();a.get(p)===null&&(a=a.insert(p,Pe.newInvalidDocument(p)))});let c=or();return a.forEach((l,d)=>{const p=s.get(l);p!==void 0&&_r(p.mutation,d,xe.empty(),Z.now()),as(t,d)&&(c=c.insert(l,d))}),c})}}/**
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
 */class GI{constructor(e){this.serializer=e,this.Br=new Map,this.Lr=new Map}getBundleMetadata(e,t){return b.resolve(this.Br.get(t))}saveBundleMetadata(e,t){return this.Br.set(t.id,function(i){return{id:i.id,version:i.version,createTime:Ke(i.createTime)}}(t)),b.resolve()}getNamedQuery(e,t){return b.resolve(this.Lr.get(t))}saveNamedQuery(e,t){return this.Lr.set(t.name,function(i){return{name:i.name,query:MI(i.bundledQuery),readTime:Ke(i.readTime)}}(t)),b.resolve()}}/**
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
 */class KI{constructor(){this.overlays=new ie(M.comparator),this.kr=new Map}getOverlay(e,t){return b.resolve(this.overlays.get(t))}getOverlays(e,t){const r=Qt();return b.forEach(t,i=>this.getOverlay(e,i).next(s=>{s!==null&&r.set(i,s)})).next(()=>r)}saveOverlays(e,t,r){return r.forEach((i,s)=>{this.wt(e,t,s)}),b.resolve()}removeOverlaysForBatchId(e,t,r){const i=this.kr.get(r);return i!==void 0&&(i.forEach(s=>this.overlays=this.overlays.remove(s)),this.kr.delete(r)),b.resolve()}getOverlaysForCollection(e,t,r){const i=Qt(),s=t.length+1,a=new M(t.child("")),c=this.overlays.getIteratorFrom(a);for(;c.hasNext();){const l=c.getNext().value,d=l.getKey();if(!t.isPrefixOf(d.path))break;d.path.length===s&&l.largestBatchId>r&&i.set(l.getKey(),l)}return b.resolve(i)}getOverlaysForCollectionGroup(e,t,r,i){let s=new ie((d,p)=>d-p);const a=this.overlays.getIterator();for(;a.hasNext();){const d=a.getNext().value;if(d.getKey().getCollectionGroup()===t&&d.largestBatchId>r){let p=s.get(d.largestBatchId);p===null&&(p=Qt(),s=s.insert(d.largestBatchId,p)),p.set(d.getKey(),d)}}const c=Qt(),l=s.getIterator();for(;l.hasNext()&&(l.getNext().value.forEach((d,p)=>c.set(d,p)),!(c.size()>=i)););return b.resolve(c)}wt(e,t,r){const i=this.overlays.get(r.key);if(i!==null){const a=this.kr.get(i.largestBatchId).delete(r.key);this.kr.set(i.largestBatchId,a)}this.overlays=this.overlays.insert(r.key,new fI(t,r));let s=this.kr.get(t);s===void 0&&(s=W(),this.kr.set(t,s)),this.kr.set(t,s.add(r.key))}}/**
 * @license
 * Copyright 2024 Google LLC
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
 */class QI{constructor(){this.sessionToken=Ie.EMPTY_BYTE_STRING}getSessionToken(e){return b.resolve(this.sessionToken)}setSessionToken(e,t){return this.sessionToken=t,b.resolve()}}/**
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
 */class ga{constructor(){this.qr=new pe(me.Qr),this.$r=new pe(me.Ur)}isEmpty(){return this.qr.isEmpty()}addReference(e,t){const r=new me(e,t);this.qr=this.qr.add(r),this.$r=this.$r.add(r)}Kr(e,t){e.forEach(r=>this.addReference(r,t))}removeReference(e,t){this.Wr(new me(e,t))}Gr(e,t){e.forEach(r=>this.removeReference(r,t))}zr(e){const t=new M(new J([])),r=new me(t,e),i=new me(t,e+1),s=[];return this.$r.forEachInRange([r,i],a=>{this.Wr(a),s.push(a.key)}),s}jr(){this.qr.forEach(e=>this.Wr(e))}Wr(e){this.qr=this.qr.delete(e),this.$r=this.$r.delete(e)}Jr(e){const t=new M(new J([])),r=new me(t,e),i=new me(t,e+1);let s=W();return this.$r.forEachInRange([r,i],a=>{s=s.add(a.key)}),s}containsKey(e){const t=new me(e,0),r=this.qr.firstAfterOrEqual(t);return r!==null&&e.isEqual(r.key)}}class me{constructor(e,t){this.key=e,this.Hr=t}static Qr(e,t){return M.comparator(e.key,t.key)||j(e.Hr,t.Hr)}static Ur(e,t){return j(e.Hr,t.Hr)||M.comparator(e.key,t.key)}}/**
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
 */class YI{constructor(e,t){this.indexManager=e,this.referenceDelegate=t,this.mutationQueue=[],this.er=1,this.Yr=new pe(me.Qr)}checkEmpty(e){return b.resolve(this.mutationQueue.length===0)}addMutationBatch(e,t,r,i){const s=this.er;this.er++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const a=new dI(s,t,r,i);this.mutationQueue.push(a);for(const c of i)this.Yr=this.Yr.add(new me(c.key,s)),this.indexManager.addToCollectionParentIndex(e,c.key.path.popLast());return b.resolve(a)}lookupMutationBatch(e,t){return b.resolve(this.Zr(t))}getNextMutationBatchAfterBatchId(e,t){const r=t+1,i=this.Xr(r),s=i<0?0:i;return b.resolve(this.mutationQueue.length>s?this.mutationQueue[s]:null)}getHighestUnacknowledgedBatchId(){return b.resolve(this.mutationQueue.length===0?aa:this.er-1)}getAllMutationBatches(e){return b.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,t){const r=new me(t,0),i=new me(t,Number.POSITIVE_INFINITY),s=[];return this.Yr.forEachInRange([r,i],a=>{const c=this.Zr(a.Hr);s.push(c)}),b.resolve(s)}getAllMutationBatchesAffectingDocumentKeys(e,t){let r=new pe(j);return t.forEach(i=>{const s=new me(i,0),a=new me(i,Number.POSITIVE_INFINITY);this.Yr.forEachInRange([s,a],c=>{r=r.add(c.Hr)})}),b.resolve(this.ei(r))}getAllMutationBatchesAffectingQuery(e,t){const r=t.path,i=r.length+1;let s=r;M.isDocumentKey(s)||(s=s.child(""));const a=new me(new M(s),0);let c=new pe(j);return this.Yr.forEachWhile(l=>{const d=l.key.path;return!!r.isPrefixOf(d)&&(d.length===i&&(c=c.add(l.Hr)),!0)},a),b.resolve(this.ei(c))}ei(e){const t=[];return e.forEach(r=>{const i=this.Zr(r);i!==null&&t.push(i)}),t}removeMutationBatch(e,t){Q(this.ti(t.batchId,"removed")===0,55003),this.mutationQueue.shift();let r=this.Yr;return b.forEach(t.mutations,i=>{const s=new me(i.key,t.batchId);return r=r.delete(s),this.referenceDelegate.markPotentiallyOrphaned(e,i.key)}).next(()=>{this.Yr=r})}rr(e){}containsKey(e,t){const r=new me(t,0),i=this.Yr.firstAfterOrEqual(r);return b.resolve(t.isEqual(i&&i.key))}performConsistencyCheck(e){return this.mutationQueue.length,b.resolve()}ti(e,t){return this.Xr(e)}Xr(e){return this.mutationQueue.length===0?0:e-this.mutationQueue[0].batchId}Zr(e){const t=this.Xr(e);return t<0||t>=this.mutationQueue.length?null:this.mutationQueue[t]}}/**
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
 */class JI{constructor(e){this.ni=e,this.docs=function(){return new ie(M.comparator)}(),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,t){const r=t.key,i=this.docs.get(r),s=i?i.size:0,a=this.ni(t);return this.docs=this.docs.insert(r,{document:t.mutableCopy(),size:a}),this.size+=a-s,this.indexManager.addToCollectionParentIndex(e,r.path.popLast())}removeEntry(e){const t=this.docs.get(e);t&&(this.docs=this.docs.remove(e),this.size-=t.size)}getEntry(e,t){const r=this.docs.get(t);return b.resolve(r?r.document.mutableCopy():Pe.newInvalidDocument(t))}getEntries(e,t){let r=pt();return t.forEach(i=>{const s=this.docs.get(i);r=r.insert(i,s?s.document.mutableCopy():Pe.newInvalidDocument(i))}),b.resolve(r)}getDocumentsMatchingQuery(e,t,r,i){let s=pt();const a=t.path,c=new M(a.child("__id-9223372036854775808__")),l=this.docs.getIteratorFrom(c);for(;l.hasNext();){const{key:d,value:{document:p}}=l.getNext();if(!a.isPrefixOf(d.path))break;d.path.length>a.length+1||Sv(Rv(p),r)<=0||(i.has(p.key)||as(t,p))&&(s=s.insert(p.key,p.mutableCopy()))}return b.resolve(s)}getAllFromCollectionGroup(e,t,r,i){F(9500)}ri(e,t){return b.forEach(this.docs,r=>t(r))}newChangeBuffer(e){return new XI(this)}getSize(e){return b.resolve(this.size)}}class XI extends HI{constructor(e){super(),this.Or=e}applyChanges(e){const t=[];return this.changes.forEach((r,i)=>{i.isValidDocument()?t.push(this.Or.addEntry(e,i)):this.Or.removeEntry(r)}),b.waitFor(t)}getFromCache(e,t){return this.Or.getEntry(e,t)}getAllFromCache(e,t){return this.Or.getEntries(e,t)}}/**
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
 */class ZI{constructor(e){this.persistence=e,this.ii=new sn(t=>la(t),ha),this.lastRemoteSnapshotVersion=U.min(),this.highestTargetId=0,this.si=0,this.oi=new ga,this.targetCount=0,this._i=An.ar()}forEachTarget(e,t){return this.ii.forEach((r,i)=>t(i)),b.resolve()}getLastRemoteSnapshotVersion(e){return b.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return b.resolve(this.si)}allocateTargetId(e){return this.highestTargetId=this._i.next(),b.resolve(this.highestTargetId)}setTargetsMetadata(e,t,r){return r&&(this.lastRemoteSnapshotVersion=r),t>this.si&&(this.si=t),b.resolve()}hr(e){this.ii.set(e.target,e);const t=e.targetId;t>this.highestTargetId&&(this._i=new An(t),this.highestTargetId=t),e.sequenceNumber>this.si&&(this.si=e.sequenceNumber)}addTargetData(e,t){return this.hr(t),this.targetCount+=1,b.resolve()}updateTargetData(e,t){return this.hr(t),b.resolve()}removeTargetData(e,t){return this.ii.delete(t.target),this.oi.zr(t.targetId),this.targetCount-=1,b.resolve()}removeTargets(e,t,r){let i=0;const s=[];return this.ii.forEach((a,c)=>{c.sequenceNumber<=t&&r.get(c.targetId)===null&&(this.ii.delete(a),s.push(this.removeMatchingKeysForTargetId(e,c.targetId)),i++)}),b.waitFor(s).next(()=>i)}getTargetCount(e){return b.resolve(this.targetCount)}getTargetData(e,t){const r=this.ii.get(t)||null;return b.resolve(r)}addMatchingKeys(e,t,r){return this.oi.Kr(t,r),b.resolve()}removeMatchingKeys(e,t,r){this.oi.Gr(t,r);const i=this.persistence.referenceDelegate,s=[];return i&&t.forEach(a=>{s.push(i.markPotentiallyOrphaned(e,a))}),b.waitFor(s)}removeMatchingKeysForTargetId(e,t){return this.oi.zr(t),b.resolve()}getMatchingKeysForTargetId(e,t){const r=this.oi.Jr(t);return b.resolve(r)}containsKey(e,t){return b.resolve(this.oi.containsKey(t))}}/**
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
 */class xd{constructor(e,t){this.ai={},this.overlays={},this.ui=new ns(0),this.ci=!1,this.ci=!0,this.li=new QI,this.referenceDelegate=e(this),this.hi=new ZI(this),this.indexManager=new xI,this.remoteDocumentCache=function(i){return new JI(i)}(r=>this.referenceDelegate.Pi(r)),this.serializer=new LI(t),this.Ti=new GI(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.ci=!1,Promise.resolve()}get started(){return this.ci}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let t=this.overlays[e.toKey()];return t||(t=new KI,this.overlays[e.toKey()]=t),t}getMutationQueue(e,t){let r=this.ai[e.toKey()];return r||(r=new YI(t,this.referenceDelegate),this.ai[e.toKey()]=r),r}getGlobalsCache(){return this.li}getTargetCache(){return this.hi}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Ti}runTransaction(e,t,r){V("MemoryPersistence","Starting transaction:",e);const i=new eE(this.ui.next());return this.referenceDelegate.Ii(),r(i).next(s=>this.referenceDelegate.di(i).next(()=>s)).toPromise().then(s=>(i.raiseOnCommittedEvent(),s))}Ei(e,t){return b.or(Object.values(this.ai).map(r=>()=>r.containsKey(e,t)))}}class eE extends bv{constructor(e){super(),this.currentSequenceNumber=e}}class _a{constructor(e){this.persistence=e,this.Ai=new ga,this.Ri=null}static Vi(e){return new _a(e)}get mi(){if(this.Ri)return this.Ri;throw F(60996)}addReference(e,t,r){return this.Ai.addReference(r,t),this.mi.delete(r.toString()),b.resolve()}removeReference(e,t,r){return this.Ai.removeReference(r,t),this.mi.add(r.toString()),b.resolve()}markPotentiallyOrphaned(e,t){return this.mi.add(t.toString()),b.resolve()}removeTarget(e,t){this.Ai.zr(t.targetId).forEach(i=>this.mi.add(i.toString()));const r=this.persistence.getTargetCache();return r.getMatchingKeysForTargetId(e,t.targetId).next(i=>{i.forEach(s=>this.mi.add(s.toString()))}).next(()=>r.removeTargetData(e,t))}Ii(){this.Ri=new Set}di(e){const t=this.persistence.getRemoteDocumentCache().newChangeBuffer();return b.forEach(this.mi,r=>{const i=M.fromPath(r);return this.fi(e,i).next(s=>{s||t.removeEntry(i,U.min())})}).next(()=>(this.Ri=null,t.apply(e)))}updateLimboDocument(e,t){return this.fi(e,t).next(r=>{r?this.mi.delete(t.toString()):this.mi.add(t.toString())})}Pi(e){return 0}fi(e,t){return b.or([()=>b.resolve(this.Ai.containsKey(t)),()=>this.persistence.getTargetCache().containsKey(e,t),()=>this.persistence.Ei(e,t)])}}class Ui{constructor(e,t){this.persistence=e,this.gi=new sn(r=>Nv(r.path),(r,i)=>r.isEqual(i)),this.garbageCollector=$I(this,t)}static Vi(e,t){return new Ui(e,t)}Ii(){}di(e){return b.resolve()}forEachTarget(e,t){return this.persistence.getTargetCache().forEachTarget(e,t)}mr(e){const t=this.yr(e);return this.persistence.getTargetCache().getTargetCount(e).next(r=>t.next(i=>r+i))}yr(e){let t=0;return this.gr(e,r=>{t++}).next(()=>t)}gr(e,t){return b.forEach(this.gi,(r,i)=>this.Sr(e,r,i).next(s=>s?b.resolve():t(i)))}removeTargets(e,t,r){return this.persistence.getTargetCache().removeTargets(e,t,r)}removeOrphanedDocuments(e,t){let r=0;const i=this.persistence.getRemoteDocumentCache(),s=i.newChangeBuffer();return i.ri(e,a=>this.Sr(e,a,t).next(c=>{c||(r++,s.removeEntry(a,U.min()))})).next(()=>s.apply(e)).next(()=>r)}markPotentiallyOrphaned(e,t){return this.gi.set(t,e.currentSequenceNumber),b.resolve()}removeTarget(e,t){const r=t.withSequenceNumber(e.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(e,r)}addReference(e,t,r){return this.gi.set(r,e.currentSequenceNumber),b.resolve()}removeReference(e,t,r){return this.gi.set(r,e.currentSequenceNumber),b.resolve()}updateLimboDocument(e,t){return this.gi.set(t,e.currentSequenceNumber),b.resolve()}Pi(e){let t=e.key.toString().length;return e.isFoundDocument()&&(t+=Ei(e.data.value)),t}Sr(e,t,r){return b.or([()=>this.persistence.Ei(e,t),()=>this.persistence.getTargetCache().containsKey(e,t),()=>{const i=this.gi.get(t);return b.resolve(i!==void 0&&i>r)}])}getCacheSize(e){return this.persistence.getRemoteDocumentCache().getSize(e)}}/**
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
 */class ya{constructor(e,t,r,i){this.targetId=e,this.fromCache=t,this.Is=r,this.ds=i}static Es(e,t){let r=W(),i=W();for(const s of t.docChanges)switch(s.type){case 0:r=r.add(s.doc.key);break;case 1:i=i.add(s.doc.key)}return new ya(e,t.fromCache,r,i)}}/**
 * @license
 * Copyright 2023 Google LLC
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
 */class tE{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}}/**
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
 */class nE{constructor(){this.As=!1,this.Rs=!1,this.Vs=100,this.fs=function(){return gp()?8:Cv(be())>0?6:4}()}initialize(e,t){this.gs=e,this.indexManager=t,this.As=!0}getDocumentsMatchingQuery(e,t,r,i){const s={result:null};return this.ps(e,t).next(a=>{s.result=a}).next(()=>{if(!s.result)return this.ys(e,t,i,r).next(a=>{s.result=a})}).next(()=>{if(s.result)return;const a=new tE;return this.ws(e,t,a).next(c=>{if(s.result=c,this.Rs)return this.Ss(e,t,a,c.size)})}).next(()=>s.result)}Ss(e,t,r,i){return r.documentReadCount<this.Vs?(hn()<=z.DEBUG&&V("QueryEngine","SDK will not create cache indexes for query:",dn(t),"since it only creates cache indexes for collection contains","more than or equal to",this.Vs,"documents"),b.resolve()):(hn()<=z.DEBUG&&V("QueryEngine","Query:",dn(t),"scans",r.documentReadCount,"local documents and returns",i,"documents as results."),r.documentReadCount>this.fs*i?(hn()<=z.DEBUG&&V("QueryEngine","The SDK decides to create cache indexes for query:",dn(t),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,Ge(t))):b.resolve())}ps(e,t){if(ju(t))return b.resolve(null);let r=Ge(t);return this.indexManager.getIndexType(e,r).next(i=>i===0?null:(t.limit!==null&&i===1&&(t=So(t,null,"F"),r=Ge(t)),this.indexManager.getDocumentsMatchingTarget(e,r).next(s=>{const a=W(...s);return this.gs.getDocuments(e,a).next(c=>this.indexManager.getMinOffset(e,r).next(l=>{const d=this.bs(t,c);return this.Ds(t,d,a,l.readTime)?this.ps(e,So(t,null,"F")):this.vs(e,d,t,l)}))})))}ys(e,t,r,i){return ju(t)||i.isEqual(U.min())?b.resolve(null):this.gs.getDocuments(e,r).next(s=>{const a=this.bs(t,s);return this.Ds(t,a,r,i)?b.resolve(null):(hn()<=z.DEBUG&&V("QueryEngine","Re-using previous result from %s to execute query: %s",i.toString(),dn(t)),this.vs(e,a,t,Av(i,Ar)).next(c=>c))})}bs(e,t){let r=new pe(md(e));return t.forEach((i,s)=>{as(e,s)&&(r=r.add(s))}),r}Ds(e,t,r,i){if(e.limit===null)return!1;if(r.size!==t.size)return!0;const s=e.limitType==="F"?t.last():t.first();return!!s&&(s.hasPendingWrites||s.version.compareTo(i)>0)}ws(e,t,r){return hn()<=z.DEBUG&&V("QueryEngine","Using full collection scan to execute query:",dn(t)),this.gs.getDocumentsMatchingQuery(e,t,Ot.min(),r)}vs(e,t,r,i){return this.gs.getDocumentsMatchingQuery(e,r,i).next(s=>(t.forEach(a=>{s=s.insert(a.key,a)}),s))}}/**
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
 */const va="LocalStore",rE=3e8;class iE{constructor(e,t,r,i){this.persistence=e,this.Cs=t,this.serializer=i,this.Fs=new ie(j),this.Ms=new sn(s=>la(s),ha),this.xs=new Map,this.Os=e.getRemoteDocumentCache(),this.hi=e.getTargetCache(),this.Ti=e.getBundleCache(),this.Ns(r)}Ns(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new WI(this.Os,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.Os.setIndexManager(this.indexManager),this.Cs.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",t=>e.collect(t,this.Fs))}}function sE(n,e,t,r){return new iE(n,e,t,r)}async function Fd(n,e){const t=B(n);return await t.persistence.runTransaction("Handle user change","readonly",r=>{let i;return t.mutationQueue.getAllMutationBatches(r).next(s=>(i=s,t.Ns(e),t.mutationQueue.getAllMutationBatches(r))).next(s=>{const a=[],c=[];let l=W();for(const d of i){a.push(d.batchId);for(const p of d.mutations)l=l.add(p.key)}for(const d of s){c.push(d.batchId);for(const p of d.mutations)l=l.add(p.key)}return t.localDocuments.getDocuments(r,l).next(d=>({Bs:d,removedBatchIds:a,addedBatchIds:c}))})})}function oE(n,e){const t=B(n);return t.persistence.runTransaction("Acknowledge batch","readwrite-primary",r=>{const i=e.batch.keys(),s=t.Os.newChangeBuffer({trackRemovals:!0});return function(c,l,d,p){const g=d.batch,v=g.keys();let P=b.resolve();return v.forEach(k=>{P=P.next(()=>p.getEntry(l,k)).next(L=>{const D=d.docVersions.get(k);Q(D!==null,48541),L.version.compareTo(D)<0&&(g.applyToRemoteDocument(L,d),L.isValidDocument()&&(L.setReadTime(d.commitVersion),p.addEntry(L)))})}),P.next(()=>c.mutationQueue.removeMutationBatch(l,g))}(t,r,e,s).next(()=>s.apply(r)).next(()=>t.mutationQueue.performConsistencyCheck(r)).next(()=>t.documentOverlayCache.removeOverlaysForBatchId(r,i,e.batch.batchId)).next(()=>t.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(r,function(c){let l=W();for(let d=0;d<c.mutationResults.length;++d)c.mutationResults[d].transformResults.length>0&&(l=l.add(c.batch.mutations[d].key));return l}(e))).next(()=>t.localDocuments.getDocuments(r,i))})}function Ud(n){const e=B(n);return e.persistence.runTransaction("Get last remote snapshot version","readonly",t=>e.hi.getLastRemoteSnapshotVersion(t))}function aE(n,e){const t=B(n),r=e.snapshotVersion;let i=t.Fs;return t.persistence.runTransaction("Apply remote event","readwrite-primary",s=>{const a=t.Os.newChangeBuffer({trackRemovals:!0});i=t.Fs;const c=[];e.targetChanges.forEach((p,g)=>{const v=i.get(g);if(!v)return;c.push(t.hi.removeMatchingKeys(s,p.removedDocuments,g).next(()=>t.hi.addMatchingKeys(s,p.addedDocuments,g)));let P=v.withSequenceNumber(s.currentSequenceNumber);e.targetMismatches.get(g)!==null?P=P.withResumeToken(Ie.EMPTY_BYTE_STRING,U.min()).withLastLimboFreeSnapshotVersion(U.min()):p.resumeToken.approximateByteSize()>0&&(P=P.withResumeToken(p.resumeToken,r)),i=i.insert(g,P),function(L,D,$){return L.resumeToken.approximateByteSize()===0||D.snapshotVersion.toMicroseconds()-L.snapshotVersion.toMicroseconds()>=rE?!0:$.addedDocuments.size+$.modifiedDocuments.size+$.removedDocuments.size>0}(v,P,p)&&c.push(t.hi.updateTargetData(s,P))});let l=pt(),d=W();if(e.documentUpdates.forEach(p=>{e.resolvedLimboDocuments.has(p)&&c.push(t.persistence.referenceDelegate.updateLimboDocument(s,p))}),c.push(cE(s,a,e.documentUpdates).next(p=>{l=p.Ls,d=p.ks})),!r.isEqual(U.min())){const p=t.hi.getLastRemoteSnapshotVersion(s).next(g=>t.hi.setTargetsMetadata(s,s.currentSequenceNumber,r));c.push(p)}return b.waitFor(c).next(()=>a.apply(s)).next(()=>t.localDocuments.getLocalViewOfDocuments(s,l,d)).next(()=>l)}).then(s=>(t.Fs=i,s))}function cE(n,e,t){let r=W(),i=W();return t.forEach(s=>r=r.add(s)),e.getEntries(n,r).next(s=>{let a=pt();return t.forEach((c,l)=>{const d=s.get(c);l.isFoundDocument()!==d.isFoundDocument()&&(i=i.add(c)),l.isNoDocument()&&l.version.isEqual(U.min())?(e.removeEntry(c,l.readTime),a=a.insert(c,l)):!d.isValidDocument()||l.version.compareTo(d.version)>0||l.version.compareTo(d.version)===0&&d.hasPendingWrites?(e.addEntry(l),a=a.insert(c,l)):V(va,"Ignoring outdated watch update for ",c,". Current version:",d.version," Watch version:",l.version)}),{Ls:a,ks:i}})}function uE(n,e){const t=B(n);return t.persistence.runTransaction("Get next mutation batch","readonly",r=>(e===void 0&&(e=aa),t.mutationQueue.getNextMutationBatchAfterBatchId(r,e)))}function lE(n,e){const t=B(n);return t.persistence.runTransaction("Allocate target","readwrite",r=>{let i;return t.hi.getTargetData(r,e).next(s=>s?(i=s,b.resolve(i)):t.hi.allocateTargetId(r).next(a=>(i=new At(e,a,"TargetPurposeListen",r.currentSequenceNumber),t.hi.addTargetData(r,i).next(()=>i))))}).then(r=>{const i=t.Fs.get(r.targetId);return(i===null||r.snapshotVersion.compareTo(i.snapshotVersion)>0)&&(t.Fs=t.Fs.insert(r.targetId,r),t.Ms.set(e,r.targetId)),r})}async function No(n,e,t){const r=B(n),i=r.Fs.get(e),s=t?"readwrite":"readwrite-primary";try{t||await r.persistence.runTransaction("Release target",s,a=>r.persistence.referenceDelegate.removeTarget(a,i))}catch(a){if(!Ln(a))throw a;V(va,`Failed to update sequence numbers for target ${e}: ${a}`)}r.Fs=r.Fs.remove(e),r.Ms.delete(i.target)}function tl(n,e,t){const r=B(n);let i=U.min(),s=W();return r.persistence.runTransaction("Execute query","readwrite",a=>function(l,d,p){const g=B(l),v=g.Ms.get(p);return v!==void 0?b.resolve(g.Fs.get(v)):g.hi.getTargetData(d,p)}(r,a,Ge(e)).next(c=>{if(c)return i=c.lastLimboFreeSnapshotVersion,r.hi.getMatchingKeysForTargetId(a,c.targetId).next(l=>{s=l})}).next(()=>r.Cs.getDocumentsMatchingQuery(a,e,t?i:U.min(),t?s:W())).next(c=>(hE(r,Yv(e),c),{documents:c,qs:s})))}function hE(n,e,t){let r=n.xs.get(e)||U.min();t.forEach((i,s)=>{s.readTime.compareTo(r)>0&&(r=s.readTime)}),n.xs.set(e,r)}class nl{constructor(){this.activeTargetIds=nI()}Gs(e){this.activeTargetIds=this.activeTargetIds.add(e)}zs(e){this.activeTargetIds=this.activeTargetIds.delete(e)}Ws(){const e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}}class dE{constructor(){this.Fo=new nl,this.Mo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,t,r){}addLocalQueryTarget(e,t=!0){return t&&this.Fo.Gs(e),this.Mo[e]||"not-current"}updateQueryState(e,t,r){this.Mo[e]=t}removeLocalQueryTarget(e){this.Fo.zs(e)}isLocalQueryTarget(e){return this.Fo.activeTargetIds.has(e)}clearQueryState(e){delete this.Mo[e]}getAllActiveQueryTargets(){return this.Fo.activeTargetIds}isActiveQueryTarget(e){return this.Fo.activeTargetIds.has(e)}start(){return this.Fo=new nl,Promise.resolve()}handleUserChange(e,t,r){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}}/**
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
 */class fE{xo(e){}shutdown(){}}/**
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
 */const rl="ConnectivityMonitor";class il{constructor(){this.Oo=()=>this.No(),this.Bo=()=>this.Lo(),this.ko=[],this.qo()}xo(e){this.ko.push(e)}shutdown(){window.removeEventListener("online",this.Oo),window.removeEventListener("offline",this.Bo)}qo(){window.addEventListener("online",this.Oo),window.addEventListener("offline",this.Bo)}No(){V(rl,"Network connectivity changed: AVAILABLE");for(const e of this.ko)e(0)}Lo(){V(rl,"Network connectivity changed: UNAVAILABLE");for(const e of this.ko)e(1)}static C(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
 * @license
 * Copyright 2023 Google LLC
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
 */let mi=null;function Do(){return mi===null?mi=function(){return 268435456+Math.round(2147483648*Math.random())}():mi++,"0x"+mi.toString(16)}/**
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
 */const oo="RestConnection",pE={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery"};class mE{get Qo(){return!1}constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;const t=e.ssl?"https":"http",r=encodeURIComponent(this.databaseId.projectId),i=encodeURIComponent(this.databaseId.database);this.$o=t+"://"+e.host,this.Uo=`projects/${r}/databases/${i}`,this.Ko=this.databaseId.database===Vi?`project_id=${r}`:`project_id=${r}&database_id=${i}`}Wo(e,t,r,i,s){const a=Do(),c=this.Go(e,t.toUriEncodedString());V(oo,`Sending RPC '${e}' ${a}:`,c,r);const l={"google-cloud-resource-prefix":this.Uo,"x-goog-request-params":this.Ko};this.zo(l,i,s);const{host:d}=new URL(c),p=Sn(d);return this.jo(e,c,l,r,p).then(g=>(V(oo,`Received RPC '${e}' ${a}: `,g),g),g=>{throw Dt(oo,`RPC '${e}' ${a} failed with error: `,g,"url: ",c,"request:",r),g})}Jo(e,t,r,i,s,a){return this.Wo(e,t,r,i,s)}zo(e,t,r){e["X-Goog-Api-Client"]=function(){return"gl-js/ fire/"+On}(),e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),t&&t.headers.forEach((i,s)=>e[s]=i),r&&r.headers.forEach((i,s)=>e[s]=i)}Go(e,t){const r=pE[e];return`${this.$o}/v1/${t}:${r}`}terminate(){}}/**
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
 */class gE{constructor(e){this.Ho=e.Ho,this.Yo=e.Yo}Zo(e){this.Xo=e}e_(e){this.t_=e}n_(e){this.r_=e}onMessage(e){this.i_=e}close(){this.Yo()}send(e){this.Ho(e)}s_(){this.Xo()}o_(){this.t_()}__(e){this.r_(e)}a_(e){this.i_(e)}}/**
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
 */const Re="WebChannelConnection";class _E extends mE{constructor(e){super(e),this.u_=[],this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}jo(e,t,r,i,s){const a=Do();return new Promise((c,l)=>{const d=new qh;d.setWithCredentials(!0),d.listenOnce(jh.COMPLETE,()=>{try{switch(d.getLastErrorCode()){case Ii.NO_ERROR:const g=d.getResponseJson();V(Re,`XHR for RPC '${e}' ${a} received:`,JSON.stringify(g)),c(g);break;case Ii.TIMEOUT:V(Re,`RPC '${e}' ${a} timed out`),l(new O(S.DEADLINE_EXCEEDED,"Request time out"));break;case Ii.HTTP_ERROR:const v=d.getStatus();if(V(Re,`RPC '${e}' ${a} failed with status:`,v,"response text:",d.getResponseText()),v>0){let P=d.getResponseJson();Array.isArray(P)&&(P=P[0]);const k=P==null?void 0:P.error;if(k&&k.status&&k.message){const L=function($){const q=$.toLowerCase().replace(/_/g,"-");return Object.values(S).indexOf(q)>=0?q:S.UNKNOWN}(k.status);l(new O(L,k.message))}else l(new O(S.UNKNOWN,"Server responded with status "+d.getStatus()))}else l(new O(S.UNAVAILABLE,"Connection failed."));break;default:F(9055,{c_:e,streamId:a,l_:d.getLastErrorCode(),h_:d.getLastError()})}}finally{V(Re,`RPC '${e}' ${a} completed.`)}});const p=JSON.stringify(i);V(Re,`RPC '${e}' ${a} sending request:`,i),d.send(t,"POST",p,r,15)})}P_(e,t,r){const i=Do(),s=[this.$o,"/","google.firestore.v1.Firestore","/",e,"/channel"],a=zh(),c=Hh(),l={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},d=this.longPollingOptions.timeoutSeconds;d!==void 0&&(l.longPollingTimeout=Math.round(1e3*d)),this.useFetchStreams&&(l.useFetchStreams=!0),this.zo(l.initMessageHeaders,t,r),l.encodeInitMessageHeaders=!0;const p=s.join("");V(Re,`Creating RPC '${e}' stream ${i}: ${p}`,l);const g=a.createWebChannel(p,l);this.T_(g);let v=!1,P=!1;const k=new gE({Ho:D=>{P?V(Re,`Not sending because RPC '${e}' stream ${i} is closed:`,D):(v||(V(Re,`Opening RPC '${e}' stream ${i} transport.`),g.open(),v=!0),V(Re,`RPC '${e}' stream ${i} sending:`,D),g.send(D))},Yo:()=>g.close()}),L=(D,$,q)=>{D.listen($,H=>{try{q(H)}catch(ne){setTimeout(()=>{throw ne},0)}})};return L(g,sr.EventType.OPEN,()=>{P||(V(Re,`RPC '${e}' stream ${i} transport opened.`),k.s_())}),L(g,sr.EventType.CLOSE,()=>{P||(P=!0,V(Re,`RPC '${e}' stream ${i} transport closed`),k.__(),this.I_(g))}),L(g,sr.EventType.ERROR,D=>{P||(P=!0,Dt(Re,`RPC '${e}' stream ${i} transport errored. Name:`,D.name,"Message:",D.message),k.__(new O(S.UNAVAILABLE,"The operation could not be completed")))}),L(g,sr.EventType.MESSAGE,D=>{var $;if(!P){const q=D.data[0];Q(!!q,16349);const H=q,ne=(H==null?void 0:H.error)||(($=H[0])===null||$===void 0?void 0:$.error);if(ne){V(Re,`RPC '${e}' stream ${i} received error:`,ne);const Ue=ne.status;let ae=function(y){const I=le[y];if(I!==void 0)return Sd(I)}(Ue),E=ne.message;ae===void 0&&(ae=S.INTERNAL,E="Unknown error status: "+Ue+" with message "+ne.message),P=!0,k.__(new O(ae,E)),g.close()}else V(Re,`RPC '${e}' stream ${i} received:`,q),k.a_(q)}}),L(c,$h.STAT_EVENT,D=>{D.stat===vo.PROXY?V(Re,`RPC '${e}' stream ${i} detected buffering proxy`):D.stat===vo.NOPROXY&&V(Re,`RPC '${e}' stream ${i} detected no buffering proxy`)}),setTimeout(()=>{k.o_()},0),k}terminate(){this.u_.forEach(e=>e.close()),this.u_=[]}T_(e){this.u_.push(e)}I_(e){this.u_=this.u_.filter(t=>t===e)}}function ao(){return typeof document<"u"?document:null}/**
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
 */function ds(n){return new EI(n,!0)}/**
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
 */class Bd{constructor(e,t,r=1e3,i=1.5,s=6e4){this.Fi=e,this.timerId=t,this.d_=r,this.E_=i,this.A_=s,this.R_=0,this.V_=null,this.m_=Date.now(),this.reset()}reset(){this.R_=0}f_(){this.R_=this.A_}g_(e){this.cancel();const t=Math.floor(this.R_+this.p_()),r=Math.max(0,Date.now()-this.m_),i=Math.max(0,t-r);i>0&&V("ExponentialBackoff",`Backing off for ${i} ms (base delay: ${this.R_} ms, delay with jitter: ${t} ms, last attempt: ${r} ms ago)`),this.V_=this.Fi.enqueueAfterDelay(this.timerId,i,()=>(this.m_=Date.now(),e())),this.R_*=this.E_,this.R_<this.d_&&(this.R_=this.d_),this.R_>this.A_&&(this.R_=this.A_)}y_(){this.V_!==null&&(this.V_.skipDelay(),this.V_=null)}cancel(){this.V_!==null&&(this.V_.cancel(),this.V_=null)}p_(){return(Math.random()-.5)*this.R_}}/**
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
 */const sl="PersistentStream";class qd{constructor(e,t,r,i,s,a,c,l){this.Fi=e,this.w_=r,this.S_=i,this.connection=s,this.authCredentialsProvider=a,this.appCheckCredentialsProvider=c,this.listener=l,this.state=0,this.b_=0,this.D_=null,this.v_=null,this.stream=null,this.C_=0,this.F_=new Bd(e,t)}M_(){return this.state===1||this.state===5||this.x_()}x_(){return this.state===2||this.state===3}start(){this.C_=0,this.state!==4?this.auth():this.O_()}async stop(){this.M_()&&await this.close(0)}N_(){this.state=0,this.F_.reset()}B_(){this.x_()&&this.D_===null&&(this.D_=this.Fi.enqueueAfterDelay(this.w_,6e4,()=>this.L_()))}k_(e){this.q_(),this.stream.send(e)}async L_(){if(this.x_())return this.close(0)}q_(){this.D_&&(this.D_.cancel(),this.D_=null)}Q_(){this.v_&&(this.v_.cancel(),this.v_=null)}async close(e,t){this.q_(),this.Q_(),this.F_.cancel(),this.b_++,e!==4?this.F_.reset():t&&t.code===S.RESOURCE_EXHAUSTED?(ft(t.toString()),ft("Using maximum backoff delay to prevent overloading the backend."),this.F_.f_()):t&&t.code===S.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.U_(),this.stream.close(),this.stream=null),this.state=e,await this.listener.n_(t)}U_(){}auth(){this.state=1;const e=this.K_(this.b_),t=this.b_;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then(([r,i])=>{this.b_===t&&this.W_(r,i)},r=>{e(()=>{const i=new O(S.UNKNOWN,"Fetching auth token failed: "+r.message);return this.G_(i)})})}W_(e,t){const r=this.K_(this.b_);this.stream=this.z_(e,t),this.stream.Zo(()=>{r(()=>this.listener.Zo())}),this.stream.e_(()=>{r(()=>(this.state=2,this.v_=this.Fi.enqueueAfterDelay(this.S_,1e4,()=>(this.x_()&&(this.state=3),Promise.resolve())),this.listener.e_()))}),this.stream.n_(i=>{r(()=>this.G_(i))}),this.stream.onMessage(i=>{r(()=>++this.C_==1?this.j_(i):this.onNext(i))})}O_(){this.state=5,this.F_.g_(async()=>{this.state=0,this.start()})}G_(e){return V(sl,`close with error: ${e}`),this.stream=null,this.close(4,e)}K_(e){return t=>{this.Fi.enqueueAndForget(()=>this.b_===e?t():(V(sl,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve()))}}}class yE extends qd{constructor(e,t,r,i,s,a){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",t,r,i,a),this.serializer=s}z_(e,t){return this.connection.P_("Listen",e,t)}j_(e){return this.onNext(e)}onNext(e){this.F_.reset();const t=AI(this.serializer,e),r=function(s){if(!("targetChange"in s))return U.min();const a=s.targetChange;return a.targetIds&&a.targetIds.length?U.min():a.readTime?Ke(a.readTime):U.min()}(e);return this.listener.J_(t,r)}H_(e){const t={};t.database=ko(this.serializer),t.addTarget=function(s,a){let c;const l=a.target;if(c=Ao(l)?{documents:PI(s,l)}:{query:bI(s,l).Vt},c.targetId=a.targetId,a.resumeToken.approximateByteSize()>0){c.resumeToken=Cd(s,a.resumeToken);const d=Po(s,a.expectedCount);d!==null&&(c.expectedCount=d)}else if(a.snapshotVersion.compareTo(U.min())>0){c.readTime=Fi(s,a.snapshotVersion.toTimestamp());const d=Po(s,a.expectedCount);d!==null&&(c.expectedCount=d)}return c}(this.serializer,e);const r=kI(this.serializer,e);r&&(t.labels=r),this.k_(t)}Y_(e){const t={};t.database=ko(this.serializer),t.removeTarget=e,this.k_(t)}}class vE extends qd{constructor(e,t,r,i,s,a){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",t,r,i,a),this.serializer=s}get Z_(){return this.C_>0}start(){this.lastStreamToken=void 0,super.start()}U_(){this.Z_&&this.X_([])}z_(e,t){return this.connection.P_("Write",e,t)}j_(e){return Q(!!e.streamToken,31322),this.lastStreamToken=e.streamToken,Q(!e.writeResults||e.writeResults.length===0,55816),this.listener.ea()}onNext(e){Q(!!e.streamToken,12678),this.lastStreamToken=e.streamToken,this.F_.reset();const t=SI(e.writeResults,e.commitTime),r=Ke(e.commitTime);return this.listener.ta(r,t)}na(){const e={};e.database=ko(this.serializer),this.k_(e)}X_(e){const t={streamToken:this.lastStreamToken,writes:e.map(r=>RI(this.serializer,r))};this.k_(t)}}/**
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
 */class IE{}class EE extends IE{constructor(e,t,r,i){super(),this.authCredentials=e,this.appCheckCredentials=t,this.connection=r,this.serializer=i,this.ra=!1}ia(){if(this.ra)throw new O(S.FAILED_PRECONDITION,"The client has already been terminated.")}Wo(e,t,r,i){return this.ia(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([s,a])=>this.connection.Wo(e,bo(t,r),i,s,a)).catch(s=>{throw s.name==="FirebaseError"?(s.code===S.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),s):new O(S.UNKNOWN,s.toString())})}Jo(e,t,r,i,s){return this.ia(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([a,c])=>this.connection.Jo(e,bo(t,r),i,a,c,s)).catch(a=>{throw a.name==="FirebaseError"?(a.code===S.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),a):new O(S.UNKNOWN,a.toString())})}terminate(){this.ra=!0,this.connection.terminate()}}class TE{constructor(e,t){this.asyncQueue=e,this.onlineStateHandler=t,this.state="Unknown",this.sa=0,this.oa=null,this._a=!0}aa(){this.sa===0&&(this.ua("Unknown"),this.oa=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,()=>(this.oa=null,this.ca("Backend didn't respond within 10 seconds."),this.ua("Offline"),Promise.resolve())))}la(e){this.state==="Online"?this.ua("Unknown"):(this.sa++,this.sa>=1&&(this.ha(),this.ca(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.ua("Offline")))}set(e){this.ha(),this.sa=0,e==="Online"&&(this._a=!1),this.ua(e)}ua(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}ca(e){const t=`Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this._a?(ft(t),this._a=!1):V("OnlineStateTracker",t)}ha(){this.oa!==null&&(this.oa.cancel(),this.oa=null)}}/**
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
 */const nn="RemoteStore";class wE{constructor(e,t,r,i,s){this.localStore=e,this.datastore=t,this.asyncQueue=r,this.remoteSyncer={},this.Pa=[],this.Ta=new Map,this.Ia=new Set,this.da=[],this.Ea=s,this.Ea.xo(a=>{r.enqueueAndForget(async()=>{on(this)&&(V(nn,"Restarting streams for network reachability change."),await async function(l){const d=B(l);d.Ia.add(4),await Br(d),d.Aa.set("Unknown"),d.Ia.delete(4),await fs(d)}(this))})}),this.Aa=new TE(r,i)}}async function fs(n){if(on(n))for(const e of n.da)await e(!0)}async function Br(n){for(const e of n.da)await e(!1)}function jd(n,e){const t=B(n);t.Ta.has(e.targetId)||(t.Ta.set(e.targetId,e),wa(t)?Ta(t):xn(t).x_()&&Ea(t,e))}function Ia(n,e){const t=B(n),r=xn(t);t.Ta.delete(e),r.x_()&&$d(t,e),t.Ta.size===0&&(r.x_()?r.B_():on(t)&&t.Aa.set("Unknown"))}function Ea(n,e){if(n.Ra.$e(e.targetId),e.resumeToken.approximateByteSize()>0||e.snapshotVersion.compareTo(U.min())>0){const t=n.remoteSyncer.getRemoteKeysForTarget(e.targetId).size;e=e.withExpectedCount(t)}xn(n).H_(e)}function $d(n,e){n.Ra.$e(e),xn(n).Y_(e)}function Ta(n){n.Ra=new _I({getRemoteKeysForTarget:e=>n.remoteSyncer.getRemoteKeysForTarget(e),Et:e=>n.Ta.get(e)||null,lt:()=>n.datastore.serializer.databaseId}),xn(n).start(),n.Aa.aa()}function wa(n){return on(n)&&!xn(n).M_()&&n.Ta.size>0}function on(n){return B(n).Ia.size===0}function Hd(n){n.Ra=void 0}async function AE(n){n.Aa.set("Online")}async function RE(n){n.Ta.forEach((e,t)=>{Ea(n,e)})}async function SE(n,e){Hd(n),wa(n)?(n.Aa.la(e),Ta(n)):n.Aa.set("Unknown")}async function PE(n,e,t){if(n.Aa.set("Online"),e instanceof bd&&e.state===2&&e.cause)try{await async function(i,s){const a=s.cause;for(const c of s.targetIds)i.Ta.has(c)&&(await i.remoteSyncer.rejectListen(c,a),i.Ta.delete(c),i.Ra.removeTarget(c))}(n,e)}catch(r){V(nn,"Failed to remove targets %s: %s ",e.targetIds.join(","),r),await Bi(n,r)}else if(e instanceof Ai?n.Ra.Ye(e):e instanceof Pd?n.Ra.it(e):n.Ra.et(e),!t.isEqual(U.min()))try{const r=await Ud(n.localStore);t.compareTo(r)>=0&&await function(s,a){const c=s.Ra.Pt(a);return c.targetChanges.forEach((l,d)=>{if(l.resumeToken.approximateByteSize()>0){const p=s.Ta.get(d);p&&s.Ta.set(d,p.withResumeToken(l.resumeToken,a))}}),c.targetMismatches.forEach((l,d)=>{const p=s.Ta.get(l);if(!p)return;s.Ta.set(l,p.withResumeToken(Ie.EMPTY_BYTE_STRING,p.snapshotVersion)),$d(s,l);const g=new At(p.target,l,d,p.sequenceNumber);Ea(s,g)}),s.remoteSyncer.applyRemoteEvent(c)}(n,t)}catch(r){V(nn,"Failed to raise snapshot:",r),await Bi(n,r)}}async function Bi(n,e,t){if(!Ln(e))throw e;n.Ia.add(1),await Br(n),n.Aa.set("Offline"),t||(t=()=>Ud(n.localStore)),n.asyncQueue.enqueueRetryable(async()=>{V(nn,"Retrying IndexedDB access"),await t(),n.Ia.delete(1),await fs(n)})}function zd(n,e){return e().catch(t=>Bi(n,t,e))}async function ps(n){const e=B(n),t=xt(e);let r=e.Pa.length>0?e.Pa[e.Pa.length-1].batchId:aa;for(;bE(e);)try{const i=await uE(e.localStore,r);if(i===null){e.Pa.length===0&&t.B_();break}r=i.batchId,CE(e,i)}catch(i){await Bi(e,i)}Wd(e)&&Gd(e)}function bE(n){return on(n)&&n.Pa.length<10}function CE(n,e){n.Pa.push(e);const t=xt(n);t.x_()&&t.Z_&&t.X_(e.mutations)}function Wd(n){return on(n)&&!xt(n).M_()&&n.Pa.length>0}function Gd(n){xt(n).start()}async function kE(n){xt(n).na()}async function NE(n){const e=xt(n);for(const t of n.Pa)e.X_(t.mutations)}async function DE(n,e,t){const r=n.Pa.shift(),i=fa.from(r,e,t);await zd(n,()=>n.remoteSyncer.applySuccessfulWrite(i)),await ps(n)}async function OE(n,e){e&&xt(n).Z_&&await async function(r,i){if(function(a){return mI(a)&&a!==S.ABORTED}(i.code)){const s=r.Pa.shift();xt(r).N_(),await zd(r,()=>r.remoteSyncer.rejectFailedWrite(s.batchId,i)),await ps(r)}}(n,e),Wd(n)&&Gd(n)}async function ol(n,e){const t=B(n);t.asyncQueue.verifyOperationInProgress(),V(nn,"RemoteStore received new credentials");const r=on(t);t.Ia.add(3),await Br(t),r&&t.Aa.set("Unknown"),await t.remoteSyncer.handleCredentialChange(e),t.Ia.delete(3),await fs(t)}async function VE(n,e){const t=B(n);e?(t.Ia.delete(2),await fs(t)):e||(t.Ia.add(2),await Br(t),t.Aa.set("Unknown"))}function xn(n){return n.Va||(n.Va=function(t,r,i){const s=B(t);return s.ia(),new yE(r,s.connection,s.authCredentials,s.appCheckCredentials,s.serializer,i)}(n.datastore,n.asyncQueue,{Zo:AE.bind(null,n),e_:RE.bind(null,n),n_:SE.bind(null,n),J_:PE.bind(null,n)}),n.da.push(async e=>{e?(n.Va.N_(),wa(n)?Ta(n):n.Aa.set("Unknown")):(await n.Va.stop(),Hd(n))})),n.Va}function xt(n){return n.ma||(n.ma=function(t,r,i){const s=B(t);return s.ia(),new vE(r,s.connection,s.authCredentials,s.appCheckCredentials,s.serializer,i)}(n.datastore,n.asyncQueue,{Zo:()=>Promise.resolve(),e_:kE.bind(null,n),n_:OE.bind(null,n),ea:NE.bind(null,n),ta:DE.bind(null,n)}),n.da.push(async e=>{e?(n.ma.N_(),await ps(n)):(await n.ma.stop(),n.Pa.length>0&&(V(nn,`Stopping write stream with ${n.Pa.length} pending writes`),n.Pa=[]))})),n.ma}/**
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
 */class Aa{constructor(e,t,r,i,s){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=r,this.op=i,this.removalCallback=s,this.deferred=new ut,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(a=>{})}get promise(){return this.deferred.promise}static createAndSchedule(e,t,r,i,s){const a=Date.now()+r,c=new Aa(e,t,a,i,s);return c.start(r),c}start(e){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new O(S.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then(e=>this.deferred.resolve(e))):Promise.resolve())}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function Ra(n,e){if(ft("AsyncQueue",`${e}: ${n}`),Ln(n))return new O(S.UNAVAILABLE,`${e}: ${n}`);throw n}/**
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
 */class yn{static emptySet(e){return new yn(e.comparator)}constructor(e){this.comparator=e?(t,r)=>e(t,r)||M.comparator(t.key,r.key):(t,r)=>M.comparator(t.key,r.key),this.keyedMap=or(),this.sortedSet=new ie(this.comparator)}has(e){return this.keyedMap.get(e)!=null}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){const t=this.keyedMap.get(e);return t?this.sortedSet.indexOf(t):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal((t,r)=>(e(t),!1))}add(e){const t=this.delete(e.key);return t.copy(t.keyedMap.insert(e.key,e),t.sortedSet.insert(e,null))}delete(e){const t=this.get(e);return t?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(t)):this}isEqual(e){if(!(e instanceof yn)||this.size!==e.size)return!1;const t=this.sortedSet.getIterator(),r=e.sortedSet.getIterator();for(;t.hasNext();){const i=t.getNext().key,s=r.getNext().key;if(!i.isEqual(s))return!1}return!0}toString(){const e=[];return this.forEach(t=>{e.push(t.toString())}),e.length===0?"DocumentSet ()":`DocumentSet (
  `+e.join(`  
`)+`
)`}copy(e,t){const r=new yn;return r.comparator=this.comparator,r.keyedMap=e,r.sortedSet=t,r}}/**
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
 */class al{constructor(){this.fa=new ie(M.comparator)}track(e){const t=e.doc.key,r=this.fa.get(t);r?e.type!==0&&r.type===3?this.fa=this.fa.insert(t,e):e.type===3&&r.type!==1?this.fa=this.fa.insert(t,{type:r.type,doc:e.doc}):e.type===2&&r.type===2?this.fa=this.fa.insert(t,{type:2,doc:e.doc}):e.type===2&&r.type===0?this.fa=this.fa.insert(t,{type:0,doc:e.doc}):e.type===1&&r.type===0?this.fa=this.fa.remove(t):e.type===1&&r.type===2?this.fa=this.fa.insert(t,{type:1,doc:r.doc}):e.type===0&&r.type===1?this.fa=this.fa.insert(t,{type:2,doc:e.doc}):F(63341,{At:e,ga:r}):this.fa=this.fa.insert(t,e)}pa(){const e=[];return this.fa.inorderTraversal((t,r)=>{e.push(r)}),e}}class Rn{constructor(e,t,r,i,s,a,c,l,d){this.query=e,this.docs=t,this.oldDocs=r,this.docChanges=i,this.mutatedKeys=s,this.fromCache=a,this.syncStateChanged=c,this.excludesMetadataChanges=l,this.hasCachedResults=d}static fromInitialDocuments(e,t,r,i,s){const a=[];return t.forEach(c=>{a.push({type:0,doc:c})}),new Rn(e,t,yn.emptySet(t),a,r,i,!0,!1,s)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&os(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;const t=this.docChanges,r=e.docChanges;if(t.length!==r.length)return!1;for(let i=0;i<t.length;i++)if(t[i].type!==r[i].type||!t[i].doc.isEqual(r[i].doc))return!1;return!0}}/**
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
 */class LE{constructor(){this.ya=void 0,this.wa=[]}Sa(){return this.wa.some(e=>e.ba())}}class ME{constructor(){this.queries=cl(),this.onlineState="Unknown",this.Da=new Set}terminate(){(function(t,r){const i=B(t),s=i.queries;i.queries=cl(),s.forEach((a,c)=>{for(const l of c.wa)l.onError(r)})})(this,new O(S.ABORTED,"Firestore shutting down"))}}function cl(){return new sn(n=>pd(n),os)}async function Sa(n,e){const t=B(n);let r=3;const i=e.query;let s=t.queries.get(i);s?!s.Sa()&&e.ba()&&(r=2):(s=new LE,r=e.ba()?0:1);try{switch(r){case 0:s.ya=await t.onListen(i,!0);break;case 1:s.ya=await t.onListen(i,!1);break;case 2:await t.onFirstRemoteStoreListen(i)}}catch(a){const c=Ra(a,`Initialization of query '${dn(e.query)}' failed`);return void e.onError(c)}t.queries.set(i,s),s.wa.push(e),e.va(t.onlineState),s.ya&&e.Ca(s.ya)&&ba(t)}async function Pa(n,e){const t=B(n),r=e.query;let i=3;const s=t.queries.get(r);if(s){const a=s.wa.indexOf(e);a>=0&&(s.wa.splice(a,1),s.wa.length===0?i=e.ba()?0:1:!s.Sa()&&e.ba()&&(i=2))}switch(i){case 0:return t.queries.delete(r),t.onUnlisten(r,!0);case 1:return t.queries.delete(r),t.onUnlisten(r,!1);case 2:return t.onLastRemoteStoreUnlisten(r);default:return}}function xE(n,e){const t=B(n);let r=!1;for(const i of e){const s=i.query,a=t.queries.get(s);if(a){for(const c of a.wa)c.Ca(i)&&(r=!0);a.ya=i}}r&&ba(t)}function FE(n,e,t){const r=B(n),i=r.queries.get(e);if(i)for(const s of i.wa)s.onError(t);r.queries.delete(e)}function ba(n){n.Da.forEach(e=>{e.next()})}var Oo,ul;(ul=Oo||(Oo={})).Fa="default",ul.Cache="cache";class Ca{constructor(e,t,r){this.query=e,this.Ma=t,this.xa=!1,this.Oa=null,this.onlineState="Unknown",this.options=r||{}}Ca(e){if(!this.options.includeMetadataChanges){const r=[];for(const i of e.docChanges)i.type!==3&&r.push(i);e=new Rn(e.query,e.docs,e.oldDocs,r,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let t=!1;return this.xa?this.Na(e)&&(this.Ma.next(e),t=!0):this.Ba(e,this.onlineState)&&(this.La(e),t=!0),this.Oa=e,t}onError(e){this.Ma.error(e)}va(e){this.onlineState=e;let t=!1;return this.Oa&&!this.xa&&this.Ba(this.Oa,e)&&(this.La(this.Oa),t=!0),t}Ba(e,t){if(!e.fromCache||!this.ba())return!0;const r=t!=="Offline";return(!this.options.ka||!r)&&(!e.docs.isEmpty()||e.hasCachedResults||t==="Offline")}Na(e){if(e.docChanges.length>0)return!0;const t=this.Oa&&this.Oa.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!t)&&this.options.includeMetadataChanges===!0}La(e){e=Rn.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.xa=!0,this.Ma.next(e)}ba(){return this.options.source!==Oo.Cache}}/**
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
 */class Kd{constructor(e){this.key=e}}class Qd{constructor(e){this.key=e}}class UE{constructor(e,t){this.query=e,this.Ha=t,this.Ya=null,this.hasCachedResults=!1,this.current=!1,this.Za=W(),this.mutatedKeys=W(),this.Xa=md(e),this.eu=new yn(this.Xa)}get tu(){return this.Ha}nu(e,t){const r=t?t.ru:new al,i=t?t.eu:this.eu;let s=t?t.mutatedKeys:this.mutatedKeys,a=i,c=!1;const l=this.query.limitType==="F"&&i.size===this.query.limit?i.last():null,d=this.query.limitType==="L"&&i.size===this.query.limit?i.first():null;if(e.inorderTraversal((p,g)=>{const v=i.get(p),P=as(this.query,g)?g:null,k=!!v&&this.mutatedKeys.has(v.key),L=!!P&&(P.hasLocalMutations||this.mutatedKeys.has(P.key)&&P.hasCommittedMutations);let D=!1;v&&P?v.data.isEqual(P.data)?k!==L&&(r.track({type:3,doc:P}),D=!0):this.iu(v,P)||(r.track({type:2,doc:P}),D=!0,(l&&this.Xa(P,l)>0||d&&this.Xa(P,d)<0)&&(c=!0)):!v&&P?(r.track({type:0,doc:P}),D=!0):v&&!P&&(r.track({type:1,doc:v}),D=!0,(l||d)&&(c=!0)),D&&(P?(a=a.add(P),s=L?s.add(p):s.delete(p)):(a=a.delete(p),s=s.delete(p)))}),this.query.limit!==null)for(;a.size>this.query.limit;){const p=this.query.limitType==="F"?a.last():a.first();a=a.delete(p.key),s=s.delete(p.key),r.track({type:1,doc:p})}return{eu:a,ru:r,Ds:c,mutatedKeys:s}}iu(e,t){return e.hasLocalMutations&&t.hasCommittedMutations&&!t.hasLocalMutations}applyChanges(e,t,r,i){const s=this.eu;this.eu=e.eu,this.mutatedKeys=e.mutatedKeys;const a=e.ru.pa();a.sort((p,g)=>function(P,k){const L=D=>{switch(D){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return F(20277,{At:D})}};return L(P)-L(k)}(p.type,g.type)||this.Xa(p.doc,g.doc)),this.su(r),i=i!=null&&i;const c=t&&!i?this.ou():[],l=this.Za.size===0&&this.current&&!i?1:0,d=l!==this.Ya;return this.Ya=l,a.length!==0||d?{snapshot:new Rn(this.query,e.eu,s,a,e.mutatedKeys,l===0,d,!1,!!r&&r.resumeToken.approximateByteSize()>0),_u:c}:{_u:c}}va(e){return this.current&&e==="Offline"?(this.current=!1,this.applyChanges({eu:this.eu,ru:new al,mutatedKeys:this.mutatedKeys,Ds:!1},!1)):{_u:[]}}au(e){return!this.Ha.has(e)&&!!this.eu.has(e)&&!this.eu.get(e).hasLocalMutations}su(e){e&&(e.addedDocuments.forEach(t=>this.Ha=this.Ha.add(t)),e.modifiedDocuments.forEach(t=>{}),e.removedDocuments.forEach(t=>this.Ha=this.Ha.delete(t)),this.current=e.current)}ou(){if(!this.current)return[];const e=this.Za;this.Za=W(),this.eu.forEach(r=>{this.au(r.key)&&(this.Za=this.Za.add(r.key))});const t=[];return e.forEach(r=>{this.Za.has(r)||t.push(new Qd(r))}),this.Za.forEach(r=>{e.has(r)||t.push(new Kd(r))}),t}uu(e){this.Ha=e.qs,this.Za=W();const t=this.nu(e.documents);return this.applyChanges(t,!0)}cu(){return Rn.fromInitialDocuments(this.query,this.eu,this.mutatedKeys,this.Ya===0,this.hasCachedResults)}}const ka="SyncEngine";class BE{constructor(e,t,r){this.query=e,this.targetId=t,this.view=r}}class qE{constructor(e){this.key=e,this.lu=!1}}class jE{constructor(e,t,r,i,s,a){this.localStore=e,this.remoteStore=t,this.eventManager=r,this.sharedClientState=i,this.currentUser=s,this.maxConcurrentLimboResolutions=a,this.hu={},this.Pu=new sn(c=>pd(c),os),this.Tu=new Map,this.Iu=new Set,this.du=new ie(M.comparator),this.Eu=new Map,this.Au=new ga,this.Ru={},this.Vu=new Map,this.mu=An.ur(),this.onlineState="Unknown",this.fu=void 0}get isPrimaryClient(){return this.fu===!0}}async function $E(n,e,t=!0){const r=tf(n);let i;const s=r.Pu.get(e);return s?(r.sharedClientState.addLocalQueryTarget(s.targetId),i=s.view.cu()):i=await Yd(r,e,t,!0),i}async function HE(n,e){const t=tf(n);await Yd(t,e,!0,!1)}async function Yd(n,e,t,r){const i=await lE(n.localStore,Ge(e)),s=i.targetId,a=n.sharedClientState.addLocalQueryTarget(s,t);let c;return r&&(c=await zE(n,e,s,a==="current",i.resumeToken)),n.isPrimaryClient&&t&&jd(n.remoteStore,i),c}async function zE(n,e,t,r,i){n.gu=(g,v,P)=>async function(L,D,$,q){let H=D.view.nu($);H.Ds&&(H=await tl(L.localStore,D.query,!1).then(({documents:E})=>D.view.nu(E,H)));const ne=q&&q.targetChanges.get(D.targetId),Ue=q&&q.targetMismatches.get(D.targetId)!=null,ae=D.view.applyChanges(H,L.isPrimaryClient,ne,Ue);return hl(L,D.targetId,ae._u),ae.snapshot}(n,g,v,P);const s=await tl(n.localStore,e,!0),a=new UE(e,s.qs),c=a.nu(s.documents),l=Ur.createSynthesizedTargetChangeForCurrentChange(t,r&&n.onlineState!=="Offline",i),d=a.applyChanges(c,n.isPrimaryClient,l);hl(n,t,d._u);const p=new BE(e,t,a);return n.Pu.set(e,p),n.Tu.has(t)?n.Tu.get(t).push(e):n.Tu.set(t,[e]),d.snapshot}async function WE(n,e,t){const r=B(n),i=r.Pu.get(e),s=r.Tu.get(i.targetId);if(s.length>1)return r.Tu.set(i.targetId,s.filter(a=>!os(a,e))),void r.Pu.delete(e);r.isPrimaryClient?(r.sharedClientState.removeLocalQueryTarget(i.targetId),r.sharedClientState.isActiveQueryTarget(i.targetId)||await No(r.localStore,i.targetId,!1).then(()=>{r.sharedClientState.clearQueryState(i.targetId),t&&Ia(r.remoteStore,i.targetId),Vo(r,i.targetId)}).catch(Vn)):(Vo(r,i.targetId),await No(r.localStore,i.targetId,!0))}async function GE(n,e){const t=B(n),r=t.Pu.get(e),i=t.Tu.get(r.targetId);t.isPrimaryClient&&i.length===1&&(t.sharedClientState.removeLocalQueryTarget(r.targetId),Ia(t.remoteStore,r.targetId))}async function KE(n,e,t){const r=tT(n);try{const i=await function(a,c){const l=B(a),d=Z.now(),p=c.reduce((P,k)=>P.add(k.key),W());let g,v;return l.persistence.runTransaction("Locally write mutations","readwrite",P=>{let k=pt(),L=W();return l.Os.getEntries(P,p).next(D=>{k=D,k.forEach(($,q)=>{q.isValidDocument()||(L=L.add($))})}).next(()=>l.localDocuments.getOverlayedDocuments(P,k)).next(D=>{g=D;const $=[];for(const q of c){const H=lI(q,g.get(q.key).overlayedDocument);H!=null&&$.push(new qt(q.key,H,od(H.value.mapValue),Ve.exists(!0)))}return l.mutationQueue.addMutationBatch(P,d,$,c)}).next(D=>{v=D;const $=D.applyToLocalDocumentSet(g,L);return l.documentOverlayCache.saveOverlays(P,D.batchId,$)})}).then(()=>({batchId:v.batchId,changes:_d(g)}))}(r.localStore,e);r.sharedClientState.addPendingMutation(i.batchId),function(a,c,l){let d=a.Ru[a.currentUser.toKey()];d||(d=new ie(j)),d=d.insert(c,l),a.Ru[a.currentUser.toKey()]=d}(r,i.batchId,t),await qr(r,i.changes),await ps(r.remoteStore)}catch(i){const s=Ra(i,"Failed to persist write");t.reject(s)}}async function Jd(n,e){const t=B(n);try{const r=await aE(t.localStore,e);e.targetChanges.forEach((i,s)=>{const a=t.Eu.get(s);a&&(Q(i.addedDocuments.size+i.modifiedDocuments.size+i.removedDocuments.size<=1,22616),i.addedDocuments.size>0?a.lu=!0:i.modifiedDocuments.size>0?Q(a.lu,14607):i.removedDocuments.size>0&&(Q(a.lu,42227),a.lu=!1))}),await qr(t,r,e)}catch(r){await Vn(r)}}function ll(n,e,t){const r=B(n);if(r.isPrimaryClient&&t===0||!r.isPrimaryClient&&t===1){const i=[];r.Pu.forEach((s,a)=>{const c=a.view.va(e);c.snapshot&&i.push(c.snapshot)}),function(a,c){const l=B(a);l.onlineState=c;let d=!1;l.queries.forEach((p,g)=>{for(const v of g.wa)v.va(c)&&(d=!0)}),d&&ba(l)}(r.eventManager,e),i.length&&r.hu.J_(i),r.onlineState=e,r.isPrimaryClient&&r.sharedClientState.setOnlineState(e)}}async function QE(n,e,t){const r=B(n);r.sharedClientState.updateQueryState(e,"rejected",t);const i=r.Eu.get(e),s=i&&i.key;if(s){let a=new ie(M.comparator);a=a.insert(s,Pe.newNoDocument(s,U.min()));const c=W().add(s),l=new hs(U.min(),new Map,new ie(j),a,c);await Jd(r,l),r.du=r.du.remove(s),r.Eu.delete(e),Na(r)}else await No(r.localStore,e,!1).then(()=>Vo(r,e,t)).catch(Vn)}async function YE(n,e){const t=B(n),r=e.batch.batchId;try{const i=await oE(t.localStore,e);Zd(t,r,null),Xd(t,r),t.sharedClientState.updateMutationState(r,"acknowledged"),await qr(t,i)}catch(i){await Vn(i)}}async function JE(n,e,t){const r=B(n);try{const i=await function(a,c){const l=B(a);return l.persistence.runTransaction("Reject batch","readwrite-primary",d=>{let p;return l.mutationQueue.lookupMutationBatch(d,c).next(g=>(Q(g!==null,37113),p=g.keys(),l.mutationQueue.removeMutationBatch(d,g))).next(()=>l.mutationQueue.performConsistencyCheck(d)).next(()=>l.documentOverlayCache.removeOverlaysForBatchId(d,p,c)).next(()=>l.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(d,p)).next(()=>l.localDocuments.getDocuments(d,p))})}(r.localStore,e);Zd(r,e,t),Xd(r,e),r.sharedClientState.updateMutationState(e,"rejected",t),await qr(r,i)}catch(i){await Vn(i)}}function Xd(n,e){(n.Vu.get(e)||[]).forEach(t=>{t.resolve()}),n.Vu.delete(e)}function Zd(n,e,t){const r=B(n);let i=r.Ru[r.currentUser.toKey()];if(i){const s=i.get(e);s&&(t?s.reject(t):s.resolve(),i=i.remove(e)),r.Ru[r.currentUser.toKey()]=i}}function Vo(n,e,t=null){n.sharedClientState.removeLocalQueryTarget(e);for(const r of n.Tu.get(e))n.Pu.delete(r),t&&n.hu.pu(r,t);n.Tu.delete(e),n.isPrimaryClient&&n.Au.zr(e).forEach(r=>{n.Au.containsKey(r)||ef(n,r)})}function ef(n,e){n.Iu.delete(e.path.canonicalString());const t=n.du.get(e);t!==null&&(Ia(n.remoteStore,t),n.du=n.du.remove(e),n.Eu.delete(t),Na(n))}function hl(n,e,t){for(const r of t)r instanceof Kd?(n.Au.addReference(r.key,e),XE(n,r)):r instanceof Qd?(V(ka,"Document no longer in limbo: "+r.key),n.Au.removeReference(r.key,e),n.Au.containsKey(r.key)||ef(n,r.key)):F(19791,{yu:r})}function XE(n,e){const t=e.key,r=t.path.canonicalString();n.du.get(t)||n.Iu.has(r)||(V(ka,"New document in limbo: "+t),n.Iu.add(r),Na(n))}function Na(n){for(;n.Iu.size>0&&n.du.size<n.maxConcurrentLimboResolutions;){const e=n.Iu.values().next().value;n.Iu.delete(e);const t=new M(J.fromString(e)),r=n.mu.next();n.Eu.set(r,new qE(t)),n.du=n.du.insert(t,r),jd(n.remoteStore,new At(Ge(ss(t.path)),r,"TargetPurposeLimboResolution",ns.ue))}}async function qr(n,e,t){const r=B(n),i=[],s=[],a=[];r.Pu.isEmpty()||(r.Pu.forEach((c,l)=>{a.push(r.gu(l,e,t).then(d=>{var p;if((d||t)&&r.isPrimaryClient){const g=d?!d.fromCache:(p=t==null?void 0:t.targetChanges.get(l.targetId))===null||p===void 0?void 0:p.current;r.sharedClientState.updateQueryState(l.targetId,g?"current":"not-current")}if(d){i.push(d);const g=ya.Es(l.targetId,d);s.push(g)}}))}),await Promise.all(a),r.hu.J_(i),await async function(l,d){const p=B(l);try{await p.persistence.runTransaction("notifyLocalViewChanges","readwrite",g=>b.forEach(d,v=>b.forEach(v.Is,P=>p.persistence.referenceDelegate.addReference(g,v.targetId,P)).next(()=>b.forEach(v.ds,P=>p.persistence.referenceDelegate.removeReference(g,v.targetId,P)))))}catch(g){if(!Ln(g))throw g;V(va,"Failed to update sequence numbers: "+g)}for(const g of d){const v=g.targetId;if(!g.fromCache){const P=p.Fs.get(v),k=P.snapshotVersion,L=P.withLastLimboFreeSnapshotVersion(k);p.Fs=p.Fs.insert(v,L)}}}(r.localStore,s))}async function ZE(n,e){const t=B(n);if(!t.currentUser.isEqual(e)){V(ka,"User change. New user:",e.toKey());const r=await Fd(t.localStore,e);t.currentUser=e,function(s,a){s.Vu.forEach(c=>{c.forEach(l=>{l.reject(new O(S.CANCELLED,a))})}),s.Vu.clear()}(t,"'waitForPendingWrites' promise is rejected due to a user change."),t.sharedClientState.handleUserChange(e,r.removedBatchIds,r.addedBatchIds),await qr(t,r.Bs)}}function eT(n,e){const t=B(n),r=t.Eu.get(e);if(r&&r.lu)return W().add(r.key);{let i=W();const s=t.Tu.get(e);if(!s)return i;for(const a of s){const c=t.Pu.get(a);i=i.unionWith(c.view.tu)}return i}}function tf(n){const e=B(n);return e.remoteStore.remoteSyncer.applyRemoteEvent=Jd.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=eT.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=QE.bind(null,e),e.hu.J_=xE.bind(null,e.eventManager),e.hu.pu=FE.bind(null,e.eventManager),e}function tT(n){const e=B(n);return e.remoteStore.remoteSyncer.applySuccessfulWrite=YE.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=JE.bind(null,e),e}class qi{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=ds(e.databaseInfo.databaseId),this.sharedClientState=this.bu(e),this.persistence=this.Du(e),await this.persistence.start(),this.localStore=this.vu(e),this.gcScheduler=this.Cu(e,this.localStore),this.indexBackfillerScheduler=this.Fu(e,this.localStore)}Cu(e,t){return null}Fu(e,t){return null}vu(e){return sE(this.persistence,new nE,e.initialUser,this.serializer)}Du(e){return new xd(_a.Vi,this.serializer)}bu(e){return new dE}async terminate(){var e,t;(e=this.gcScheduler)===null||e===void 0||e.stop(),(t=this.indexBackfillerScheduler)===null||t===void 0||t.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}qi.provider={build:()=>new qi};class nT extends qi{constructor(e){super(),this.cacheSizeBytes=e}Cu(e,t){Q(this.persistence.referenceDelegate instanceof Ui,46915);const r=this.persistence.referenceDelegate.garbageCollector;return new qI(r,e.asyncQueue,t)}Du(e){const t=this.cacheSizeBytes!==void 0?De.withCacheSize(this.cacheSizeBytes):De.DEFAULT;return new xd(r=>Ui.Vi(r,t),this.serializer)}}class Lo{async initialize(e,t){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(t),this.remoteStore=this.createRemoteStore(t),this.eventManager=this.createEventManager(t),this.syncEngine=this.createSyncEngine(t,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=r=>ll(this.syncEngine,r,1),this.remoteStore.remoteSyncer.handleCredentialChange=ZE.bind(null,this.syncEngine),await VE(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return function(){return new ME}()}createDatastore(e){const t=ds(e.databaseInfo.databaseId),r=function(s){return new _E(s)}(e.databaseInfo);return function(s,a,c,l){return new EE(s,a,c,l)}(e.authCredentials,e.appCheckCredentials,r,t)}createRemoteStore(e){return function(r,i,s,a,c){return new wE(r,i,s,a,c)}(this.localStore,this.datastore,e.asyncQueue,t=>ll(this.syncEngine,t,0),function(){return il.C()?new il:new fE}())}createSyncEngine(e,t){return function(i,s,a,c,l,d,p){const g=new jE(i,s,a,c,l,d);return p&&(g.fu=!0),g}(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,t)}async terminate(){var e,t;await async function(i){const s=B(i);V(nn,"RemoteStore shutting down."),s.Ia.add(5),await Br(s),s.Ea.shutdown(),s.Aa.set("Unknown")}(this.remoteStore),(e=this.datastore)===null||e===void 0||e.terminate(),(t=this.eventManager)===null||t===void 0||t.terminate()}}Lo.provider={build:()=>new Lo};/**
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
 *//**
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
 */class Da{constructor(e){this.observer=e,this.muted=!1}next(e){this.muted||this.observer.next&&this.xu(this.observer.next,e)}error(e){this.muted||(this.observer.error?this.xu(this.observer.error,e):ft("Uncaught Error in snapshot listener:",e.toString()))}Ou(){this.muted=!0}xu(e,t){setTimeout(()=>{this.muted||e(t)},0)}}/**
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
 */const Ft="FirestoreClient";class rT{constructor(e,t,r,i,s){this.authCredentials=e,this.appCheckCredentials=t,this.asyncQueue=r,this.databaseInfo=i,this.user=Se.UNAUTHENTICATED,this.clientId=oa.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=s,this.authCredentials.start(r,async a=>{V(Ft,"Received user=",a.uid),await this.authCredentialListener(a),this.user=a}),this.appCheckCredentials.start(r,a=>(V(Ft,"Received new app check token=",a),this.appCheckCredentialListener(a,this.user)))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this.databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}terminate(){this.asyncQueue.enterRestrictedMode();const e=new ut;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(t){const r=Ra(t,"Failed to shutdown persistence");e.reject(r)}}),e.promise}}async function co(n,e){n.asyncQueue.verifyOperationInProgress(),V(Ft,"Initializing OfflineComponentProvider");const t=n.configuration;await e.initialize(t);let r=t.initialUser;n.setCredentialChangeListener(async i=>{r.isEqual(i)||(await Fd(e.localStore,i),r=i)}),e.persistence.setDatabaseDeletedListener(()=>{Dt("Terminating Firestore due to IndexedDb database deletion"),n.terminate().then(()=>{V("Terminating Firestore due to IndexedDb database deletion completed successfully")}).catch(i=>{Dt("Terminating Firestore due to IndexedDb database deletion failed",i)})}),n._offlineComponents=e}async function dl(n,e){n.asyncQueue.verifyOperationInProgress();const t=await iT(n);V(Ft,"Initializing OnlineComponentProvider"),await e.initialize(t,n.configuration),n.setCredentialChangeListener(r=>ol(e.remoteStore,r)),n.setAppCheckTokenChangeListener((r,i)=>ol(e.remoteStore,i)),n._onlineComponents=e}async function iT(n){if(!n._offlineComponents)if(n._uninitializedComponentsProvider){V(Ft,"Using user provided OfflineComponentProvider");try{await co(n,n._uninitializedComponentsProvider._offline)}catch(e){const t=e;if(!function(i){return i.name==="FirebaseError"?i.code===S.FAILED_PRECONDITION||i.code===S.UNIMPLEMENTED:!(typeof DOMException<"u"&&i instanceof DOMException)||i.code===22||i.code===20||i.code===11}(t))throw t;Dt("Error using user provided cache. Falling back to memory cache: "+t),await co(n,new qi)}}else V(Ft,"Using default OfflineComponentProvider"),await co(n,new nT(void 0));return n._offlineComponents}async function nf(n){return n._onlineComponents||(n._uninitializedComponentsProvider?(V(Ft,"Using user provided OnlineComponentProvider"),await dl(n,n._uninitializedComponentsProvider._online)):(V(Ft,"Using default OnlineComponentProvider"),await dl(n,new Lo))),n._onlineComponents}function sT(n){return nf(n).then(e=>e.syncEngine)}async function ji(n){const e=await nf(n),t=e.eventManager;return t.onListen=$E.bind(null,e.syncEngine),t.onUnlisten=WE.bind(null,e.syncEngine),t.onFirstRemoteStoreListen=HE.bind(null,e.syncEngine),t.onLastRemoteStoreUnlisten=GE.bind(null,e.syncEngine),t}function oT(n,e,t={}){const r=new ut;return n.asyncQueue.enqueueAndForget(async()=>function(s,a,c,l,d){const p=new Da({next:v=>{p.Ou(),a.enqueueAndForget(()=>Pa(s,g));const P=v.docs.has(c);!P&&v.fromCache?d.reject(new O(S.UNAVAILABLE,"Failed to get document because the client is offline.")):P&&v.fromCache&&l&&l.source==="server"?d.reject(new O(S.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):d.resolve(v)},error:v=>d.reject(v)}),g=new Ca(ss(c.path),p,{includeMetadataChanges:!0,ka:!0});return Sa(s,g)}(await ji(n),n.asyncQueue,e,t,r)),r.promise}function aT(n,e,t={}){const r=new ut;return n.asyncQueue.enqueueAndForget(async()=>function(s,a,c,l,d){const p=new Da({next:v=>{p.Ou(),a.enqueueAndForget(()=>Pa(s,g)),v.fromCache&&l.source==="server"?d.reject(new O(S.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):d.resolve(v)},error:v=>d.reject(v)}),g=new Ca(c,p,{includeMetadataChanges:!0,ka:!0});return Sa(s,g)}(await ji(n),n.asyncQueue,e,t,r)),r.promise}/**
 * @license
 * Copyright 2023 Google LLC
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
 */function rf(n){const e={};return n.timeoutSeconds!==void 0&&(e.timeoutSeconds=n.timeoutSeconds),e}/**
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
 */const fl=new Map;/**
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
 */const sf="firestore.googleapis.com",pl=!0;class ml{constructor(e){var t,r;if(e.host===void 0){if(e.ssl!==void 0)throw new O(S.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=sf,this.ssl=pl}else this.host=e.host,this.ssl=(t=e.ssl)!==null&&t!==void 0?t:pl;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e.cacheSizeBytes===void 0)this.cacheSizeBytes=Md;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<UI)throw new O(S.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}wv("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=rf((r=e.experimentalLongPollingOptions)!==null&&r!==void 0?r:{}),function(s){if(s.timeoutSeconds!==void 0){if(isNaN(s.timeoutSeconds))throw new O(S.INVALID_ARGUMENT,`invalid long polling timeout: ${s.timeoutSeconds} (must not be NaN)`);if(s.timeoutSeconds<5)throw new O(S.INVALID_ARGUMENT,`invalid long polling timeout: ${s.timeoutSeconds} (minimum allowed value is 5)`);if(s.timeoutSeconds>30)throw new O(S.INVALID_ARGUMENT,`invalid long polling timeout: ${s.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&function(r,i){return r.timeoutSeconds===i.timeoutSeconds}(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams}}class ms{constructor(e,t,r,i){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=r,this._app=i,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new ml({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new O(S.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new O(S.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new ml(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=function(r){if(!r)return new pv;switch(r.type){case"firstParty":return new yv(r.sessionIndex||"0",r.iamToken||null,r.authTokenFactory||null);case"provider":return r.client;default:throw new O(S.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(t){const r=fl.get(t);r&&(V("ComponentProvider","Removing Datastore"),fl.delete(t),r.terminate())}(this),Promise.resolve()}}function cT(n,e,t,r={}){var i;n=Fe(n,ms);const s=Sn(e),a=n._getSettings(),c=Object.assign(Object.assign({},a),{emulatorOptions:n._getEmulatorOptions()}),l=`${e}:${t}`;s&&(bl(`https://${l}`),Cl("Firestore",!0)),a.host!==sf&&a.host!==l&&Dt("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const d=Object.assign(Object.assign({},a),{host:l,ssl:s,emulatorOptions:r});if(!Zt(d,c)&&(n._setSettings(d),r.mockUserToken)){let p,g;if(typeof r.mockUserToken=="string")p=r.mockUserToken,g=Se.MOCK_USER;else{p=ap(r.mockUserToken,(i=n._app)===null||i===void 0?void 0:i.options.projectId);const v=r.mockUserToken.sub||r.mockUserToken.user_id;if(!v)throw new O(S.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");g=new Se(v)}n._authCredentials=new mv(new Gh(p,g))}}/**
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
 */class jt{constructor(e,t,r){this.converter=t,this._query=r,this.type="query",this.firestore=e}withConverter(e){return new jt(this.firestore,e,this._query)}}class ue{constructor(e,t,r){this.converter=t,this._key=r,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new Nt(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new ue(this.firestore,e,this._key)}toJSON(){return{type:ue._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,t,r){if(xr(t,ue._jsonSchema))return new ue(e,r||null,new M(J.fromString(t.referencePath)))}}ue._jsonSchemaVersion="firestore/documentReference/1.0",ue._jsonSchema={type:fe("string",ue._jsonSchemaVersion),referencePath:fe("string")};class Nt extends jt{constructor(e,t,r){super(e,t,ss(r)),this._path=r,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new ue(this.firestore,null,new M(e))}withConverter(e){return new Nt(this.firestore,e,this._path)}}function RT(n,e,...t){if(n=x(n),Qh("collection","path",e),n instanceof ms){const r=J.fromString(e,...t);return bu(r),new Nt(n,null,r)}{if(!(n instanceof ue||n instanceof Nt))throw new O(S.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=n._path.child(J.fromString(e,...t));return bu(r),new Nt(n.firestore,null,r)}}function uT(n,e,...t){if(n=x(n),arguments.length===1&&(e=oa.newId()),Qh("doc","path",e),n instanceof ms){const r=J.fromString(e,...t);return Pu(r),new ue(n,null,new M(r))}{if(!(n instanceof ue||n instanceof Nt))throw new O(S.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=n._path.child(J.fromString(e,...t));return Pu(r),new ue(n.firestore,n instanceof Nt?n.converter:null,new M(r))}}/**
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
 */const gl="AsyncQueue";class _l{constructor(e=Promise.resolve()){this.Zu=[],this.Xu=!1,this.ec=[],this.tc=null,this.nc=!1,this.rc=!1,this.sc=[],this.F_=new Bd(this,"async_queue_retry"),this.oc=()=>{const r=ao();r&&V(gl,"Visibility state changed to "+r.visibilityState),this.F_.y_()},this._c=e;const t=ao();t&&typeof t.addEventListener=="function"&&t.addEventListener("visibilitychange",this.oc)}get isShuttingDown(){return this.Xu}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.ac(),this.uc(e)}enterRestrictedMode(e){if(!this.Xu){this.Xu=!0,this.rc=e||!1;const t=ao();t&&typeof t.removeEventListener=="function"&&t.removeEventListener("visibilitychange",this.oc)}}enqueue(e){if(this.ac(),this.Xu)return new Promise(()=>{});const t=new ut;return this.uc(()=>this.Xu&&this.rc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise)).then(()=>t.promise)}enqueueRetryable(e){this.enqueueAndForget(()=>(this.Zu.push(e),this.cc()))}async cc(){if(this.Zu.length!==0){try{await this.Zu[0](),this.Zu.shift(),this.F_.reset()}catch(e){if(!Ln(e))throw e;V(gl,"Operation failed with retryable error: "+e)}this.Zu.length>0&&this.F_.g_(()=>this.cc())}}uc(e){const t=this._c.then(()=>(this.nc=!0,e().catch(r=>{throw this.tc=r,this.nc=!1,ft("INTERNAL UNHANDLED ERROR: ",yl(r)),r}).then(r=>(this.nc=!1,r))));return this._c=t,t}enqueueAfterDelay(e,t,r){this.ac(),this.sc.indexOf(e)>-1&&(t=0);const i=Aa.createAndSchedule(this,e,t,r,s=>this.lc(s));return this.ec.push(i),i}ac(){this.tc&&F(47125,{hc:yl(this.tc)})}verifyOperationInProgress(){}async Pc(){let e;do e=this._c,await e;while(e!==this._c)}Tc(e){for(const t of this.ec)if(t.timerId===e)return!0;return!1}Ic(e){return this.Pc().then(()=>{this.ec.sort((t,r)=>t.targetTimeMs-r.targetTimeMs);for(const t of this.ec)if(t.skipDelay(),e!=="all"&&t.timerId===e)break;return this.Pc()})}dc(e){this.sc.push(e)}lc(e){const t=this.ec.indexOf(e);this.ec.splice(t,1)}}function yl(n){let e=n.message||"";return n.stack&&(e=n.stack.includes(n.message)?n.stack:n.message+`
`+n.stack),e}/**
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
 */function vl(n){return function(t,r){if(typeof t!="object"||t===null)return!1;const i=t;for(const s of r)if(s in i&&typeof i[s]=="function")return!0;return!1}(n,["next","error","complete"])}class mt extends ms{constructor(e,t,r,i){super(e,t,r,i),this.type="firestore",this._queue=new _l,this._persistenceKey=(i==null?void 0:i.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new _l(e),this._firestoreClient=void 0,await e}}}function ST(n,e){const t=typeof n=="object"?n:Dl(),r=typeof n=="string"?n:Vi,i=Uo(t,"firestore").getImmediate({identifier:r});if(!i._initialized){const s=sp("firestore");s&&cT(i,...s)}return i}function jr(n){if(n._terminated)throw new O(S.FAILED_PRECONDITION,"The client has already been terminated.");return n._firestoreClient||lT(n),n._firestoreClient}function lT(n){var e,t,r;const i=n._freezeSettings(),s=function(c,l,d,p){return new Vv(c,l,d,p.host,p.ssl,p.experimentalForceLongPolling,p.experimentalAutoDetectLongPolling,rf(p.experimentalLongPollingOptions),p.useFetchStreams,p.isUsingEmulator)}(n._databaseId,((e=n._app)===null||e===void 0?void 0:e.options.appId)||"",n._persistenceKey,i);n._componentsProvider||!((t=i.localCache)===null||t===void 0)&&t._offlineComponentProvider&&(!((r=i.localCache)===null||r===void 0)&&r._onlineComponentProvider)&&(n._componentsProvider={_offline:i.localCache._offlineComponentProvider,_online:i.localCache._onlineComponentProvider}),n._firestoreClient=new rT(n._authCredentials,n._appCheckCredentials,n._queue,s,n._componentsProvider&&function(c){const l=c==null?void 0:c._online.build();return{_offline:c==null?void 0:c._offline.build(l),_online:l}}(n._componentsProvider))}/**
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
 */class Be{constructor(e){this._byteString=e}static fromBase64String(e){try{return new Be(Ie.fromBase64String(e))}catch(t){throw new O(S.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(e){return new Be(Ie.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:Be._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(xr(e,Be._jsonSchema))return Be.fromBase64String(e.bytes)}}Be._jsonSchemaVersion="firestore/bytes/1.0",Be._jsonSchema={type:fe("string",Be._jsonSchemaVersion),bytes:fe("string")};/**
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
 */class gs{constructor(...e){for(let t=0;t<e.length;++t)if(e[t].length===0)throw new O(S.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new ve(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}/**
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
 */class _s{constructor(e){this._methodName=e}}/**
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
 */class Qe{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new O(S.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new O(S.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return j(this._lat,e._lat)||j(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:Qe._jsonSchemaVersion}}static fromJSON(e){if(xr(e,Qe._jsonSchema))return new Qe(e.latitude,e.longitude)}}Qe._jsonSchemaVersion="firestore/geoPoint/1.0",Qe._jsonSchema={type:fe("string",Qe._jsonSchemaVersion),latitude:fe("number"),longitude:fe("number")};/**
 * @license
 * Copyright 2024 Google LLC
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
 */class Ye{constructor(e){this._values=(e||[]).map(t=>t)}toArray(){return this._values.map(e=>e)}isEqual(e){return function(r,i){if(r.length!==i.length)return!1;for(let s=0;s<r.length;++s)if(r[s]!==i[s])return!1;return!0}(this._values,e._values)}toJSON(){return{type:Ye._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(xr(e,Ye._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every(t=>typeof t=="number"))return new Ye(e.vectorValues);throw new O(S.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}Ye._jsonSchemaVersion="firestore/vectorValue/1.0",Ye._jsonSchema={type:fe("string",Ye._jsonSchemaVersion),vectorValues:fe("object")};/**
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
 */const hT=/^__.*__$/;class dT{constructor(e,t,r){this.data=e,this.fieldMask=t,this.fieldTransforms=r}toMutation(e,t){return this.fieldMask!==null?new qt(e,this.data,this.fieldMask,t,this.fieldTransforms):new Fr(e,this.data,t,this.fieldTransforms)}}class of{constructor(e,t,r){this.data=e,this.fieldMask=t,this.fieldTransforms=r}toMutation(e,t){return new qt(e,this.data,this.fieldMask,t,this.fieldTransforms)}}function af(n){switch(n){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw F(40011,{Ec:n})}}class Oa{constructor(e,t,r,i,s,a){this.settings=e,this.databaseId=t,this.serializer=r,this.ignoreUndefinedProperties=i,s===void 0&&this.Ac(),this.fieldTransforms=s||[],this.fieldMask=a||[]}get path(){return this.settings.path}get Ec(){return this.settings.Ec}Rc(e){return new Oa(Object.assign(Object.assign({},this.settings),e),this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}Vc(e){var t;const r=(t=this.path)===null||t===void 0?void 0:t.child(e),i=this.Rc({path:r,mc:!1});return i.fc(e),i}gc(e){var t;const r=(t=this.path)===null||t===void 0?void 0:t.child(e),i=this.Rc({path:r,mc:!1});return i.Ac(),i}yc(e){return this.Rc({path:void 0,mc:!0})}wc(e){return $i(e,this.settings.methodName,this.settings.Sc||!1,this.path,this.settings.bc)}contains(e){return this.fieldMask.find(t=>e.isPrefixOf(t))!==void 0||this.fieldTransforms.find(t=>e.isPrefixOf(t.field))!==void 0}Ac(){if(this.path)for(let e=0;e<this.path.length;e++)this.fc(this.path.get(e))}fc(e){if(e.length===0)throw this.wc("Document fields must not be empty");if(af(this.Ec)&&hT.test(e))throw this.wc('Document fields cannot begin and end with "__"')}}class fT{constructor(e,t,r){this.databaseId=e,this.ignoreUndefinedProperties=t,this.serializer=r||ds(e)}Dc(e,t,r,i=!1){return new Oa({Ec:e,methodName:t,bc:r,path:ve.emptyPath(),mc:!1,Sc:i},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function ys(n){const e=n._freezeSettings(),t=ds(n._databaseId);return new fT(n._databaseId,!!e.ignoreUndefinedProperties,t)}function Va(n,e,t,r,i,s={}){const a=n.Dc(s.merge||s.mergeFields?2:0,e,t,i);Ma("Data must be an object, but it was:",a,r);const c=cf(r,a);let l,d;if(s.merge)l=new xe(a.fieldMask),d=a.fieldTransforms;else if(s.mergeFields){const p=[];for(const g of s.mergeFields){const v=Mo(e,g,t);if(!a.contains(v))throw new O(S.INVALID_ARGUMENT,`Field '${v}' is specified in your field mask but missing from your input data.`);lf(p,v)||p.push(v)}l=new xe(p),d=a.fieldTransforms.filter(g=>l.covers(g.field))}else l=null,d=a.fieldTransforms;return new dT(new Oe(c),l,d)}class vs extends _s{_toFieldTransform(e){if(e.Ec!==2)throw e.Ec===1?e.wc(`${this._methodName}() can only appear at the top level of your update data`):e.wc(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return e.fieldMask.push(e.path),null}isEqual(e){return e instanceof vs}}class La extends _s{_toFieldTransform(e){return new oI(e.path,new Cr)}isEqual(e){return e instanceof La}}function pT(n,e,t,r){const i=n.Dc(1,e,t);Ma("Data must be an object, but it was:",i,r);const s=[],a=Oe.empty();Bt(r,(l,d)=>{const p=xa(e,l,t);d=x(d);const g=i.gc(p);if(d instanceof vs)s.push(p);else{const v=$r(d,g);v!=null&&(s.push(p),a.set(p,v))}});const c=new xe(s);return new of(a,c,i.fieldTransforms)}function mT(n,e,t,r,i,s){const a=n.Dc(1,e,t),c=[Mo(e,r,t)],l=[i];if(s.length%2!=0)throw new O(S.INVALID_ARGUMENT,`Function ${e}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let v=0;v<s.length;v+=2)c.push(Mo(e,s[v])),l.push(s[v+1]);const d=[],p=Oe.empty();for(let v=c.length-1;v>=0;--v)if(!lf(d,c[v])){const P=c[v];let k=l[v];k=x(k);const L=a.gc(P);if(k instanceof vs)d.push(P);else{const D=$r(k,L);D!=null&&(d.push(P),p.set(P,D))}}const g=new xe(d);return new of(p,g,a.fieldTransforms)}function gT(n,e,t,r=!1){return $r(t,n.Dc(r?4:3,e))}function $r(n,e){if(uf(n=x(n)))return Ma("Unsupported field value:",e,n),cf(n,e);if(n instanceof _s)return function(r,i){if(!af(i.Ec))throw i.wc(`${r._methodName}() can only be used with update() and set()`);if(!i.path)throw i.wc(`${r._methodName}() is not currently supported inside arrays`);const s=r._toFieldTransform(i);s&&i.fieldTransforms.push(s)}(n,e),null;if(n===void 0&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),n instanceof Array){if(e.settings.mc&&e.Ec!==4)throw e.wc("Nested arrays are not supported");return function(r,i){const s=[];let a=0;for(const c of r){let l=$r(c,i.yc(a));l==null&&(l={nullValue:"NULL_VALUE"}),s.push(l),a++}return{arrayValue:{values:s}}}(n,e)}return function(r,i){if((r=x(r))===null)return{nullValue:"NULL_VALUE"};if(typeof r=="number")return rI(i.serializer,r);if(typeof r=="boolean")return{booleanValue:r};if(typeof r=="string")return{stringValue:r};if(r instanceof Date){const s=Z.fromDate(r);return{timestampValue:Fi(i.serializer,s)}}if(r instanceof Z){const s=new Z(r.seconds,1e3*Math.floor(r.nanoseconds/1e3));return{timestampValue:Fi(i.serializer,s)}}if(r instanceof Qe)return{geoPointValue:{latitude:r.latitude,longitude:r.longitude}};if(r instanceof Be)return{bytesValue:Cd(i.serializer,r._byteString)};if(r instanceof ue){const s=i.databaseId,a=r.firestore._databaseId;if(!a.isEqual(s))throw i.wc(`Document reference is for database ${a.projectId}/${a.database} but should be for database ${s.projectId}/${s.database}`);return{referenceValue:ma(r.firestore._databaseId||i.databaseId,r._key.path)}}if(r instanceof Ye)return function(a,c){return{mapValue:{fields:{[id]:{stringValue:sd},[Li]:{arrayValue:{values:a.toArray().map(d=>{if(typeof d!="number")throw c.wc("VectorValues must only contain numeric values.");return da(c.serializer,d)})}}}}}}(r,i);throw i.wc(`Unsupported field value: ${ts(r)}`)}(n,e)}function cf(n,e){const t={};return Xh(n)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):Bt(n,(r,i)=>{const s=$r(i,e.Vc(r));s!=null&&(t[r]=s)}),{mapValue:{fields:t}}}function uf(n){return!(typeof n!="object"||n===null||n instanceof Array||n instanceof Date||n instanceof Z||n instanceof Qe||n instanceof Be||n instanceof ue||n instanceof _s||n instanceof Ye)}function Ma(n,e,t){if(!uf(t)||!Yh(t)){const r=ts(t);throw r==="an object"?e.wc(n+" a custom object"):e.wc(n+" "+r)}}function Mo(n,e,t){if((e=x(e))instanceof gs)return e._internalPath;if(typeof e=="string")return xa(n,e);throw $i("Field path arguments must be of type string or ",n,!1,void 0,t)}const _T=new RegExp("[~\\*/\\[\\]]");function xa(n,e,t){if(e.search(_T)>=0)throw $i(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,n,!1,void 0,t);try{return new gs(...e.split("."))._internalPath}catch{throw $i(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,n,!1,void 0,t)}}function $i(n,e,t,r,i){const s=r&&!r.isEmpty(),a=i!==void 0;let c=`Function ${e}() called with invalid data`;t&&(c+=" (via `toFirestore()`)"),c+=". ";let l="";return(s||a)&&(l+=" (found",s&&(l+=` in field ${r}`),a&&(l+=` in document ${i}`),l+=")"),new O(S.INVALID_ARGUMENT,c+n+l)}function lf(n,e){return n.some(t=>t.isEqual(e))}/**
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
 */class hf{constructor(e,t,r,i,s){this._firestore=e,this._userDataWriter=t,this._key=r,this._document=i,this._converter=s}get id(){return this._key.path.lastSegment()}get ref(){return new ue(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const e=new yT(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}get(e){if(this._document){const t=this._document.data.field(Is("DocumentSnapshot.get",e));if(t!==null)return this._userDataWriter.convertValue(t)}}}class yT extends hf{data(){return super.data()}}function Is(n,e){return typeof e=="string"?xa(n,e):e instanceof gs?e._internalPath:e._delegate._internalPath}/**
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
 */function df(n){if(n.limitType==="L"&&n.explicitOrderBy.length===0)throw new O(S.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class Fa{}class ff extends Fa{}function PT(n,e,...t){let r=[];e instanceof Fa&&r.push(e),r=r.concat(t),function(s){const a=s.filter(l=>l instanceof Ua).length,c=s.filter(l=>l instanceof Es).length;if(a>1||a>0&&c>0)throw new O(S.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")}(r);for(const i of r)n=i._apply(n);return n}class Es extends ff{constructor(e,t,r){super(),this._field=e,this._op=t,this._value=r,this.type="where"}static _create(e,t,r){return new Es(e,t,r)}_apply(e){const t=this._parse(e);return pf(e._query,t),new jt(e.firestore,e.converter,Ro(e._query,t))}_parse(e){const t=ys(e.firestore);return function(s,a,c,l,d,p,g){let v;if(d.isKeyField()){if(p==="array-contains"||p==="array-contains-any")throw new O(S.INVALID_ARGUMENT,`Invalid Query. You can't perform '${p}' queries on documentId().`);if(p==="in"||p==="not-in"){El(g,p);const k=[];for(const L of g)k.push(Il(l,s,L));v={arrayValue:{values:k}}}else v=Il(l,s,g)}else p!=="in"&&p!=="not-in"&&p!=="array-contains-any"||El(g,p),v=gT(c,a,g,p==="in"||p==="not-in");return de.create(d,p,v)}(e._query,"where",t,e.firestore._databaseId,this._field,this._op,this._value)}}function bT(n,e,t){const r=e,i=Is("where",n);return Es._create(i,r,t)}class Ua extends Fa{constructor(e,t){super(),this.type=e,this._queryConstraints=t}static _create(e,t){return new Ua(e,t)}_parse(e){const t=this._queryConstraints.map(r=>r._parse(e)).filter(r=>r.getFilters().length>0);return t.length===1?t[0]:He.create(t,this._getOperator())}_apply(e){const t=this._parse(e);return t.getFilters().length===0?e:(function(i,s){let a=i;const c=s.getFlattenedFilters();for(const l of c)pf(a,l),a=Ro(a,l)}(e._query,t),new jt(e.firestore,e.converter,Ro(e._query,t)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}class Ba extends ff{constructor(e,t){super(),this._field=e,this._direction=t,this.type="orderBy"}static _create(e,t){return new Ba(e,t)}_apply(e){const t=function(i,s,a){if(i.startAt!==null)throw new O(S.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(i.endAt!==null)throw new O(S.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new br(s,a)}(e._query,this._field,this._direction);return new jt(e.firestore,e.converter,function(i,s){const a=i.explicitOrderBy.concat([s]);return new Mn(i.path,i.collectionGroup,a,i.filters.slice(),i.limit,i.limitType,i.startAt,i.endAt)}(e._query,t))}}function CT(n,e="asc"){const t=e,r=Is("orderBy",n);return Ba._create(r,t)}function Il(n,e,t){if(typeof(t=x(t))=="string"){if(t==="")throw new O(S.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!fd(e)&&t.indexOf("/")!==-1)throw new O(S.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${t}' contains a '/' character.`);const r=e.path.child(J.fromString(t));if(!M.isDocumentKey(r))throw new O(S.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${r}' is not because it has an odd number of segments (${r.length}).`);return Mu(n,new M(r))}if(t instanceof ue)return Mu(n,t._key);throw new O(S.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${ts(t)}.`)}function El(n,e){if(!Array.isArray(n)||n.length===0)throw new O(S.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${e.toString()}' filters.`)}function pf(n,e){const t=function(i,s){for(const a of i)for(const c of a.getFlattenedFilters())if(s.indexOf(c.op)>=0)return c.op;return null}(n.filters,function(i){switch(i){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}}(e.op));if(t!==null)throw t===e.op?new O(S.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${e.op.toString()}' filter.`):new O(S.INVALID_ARGUMENT,`Invalid query. You cannot use '${e.op.toString()}' filters with '${t.toString()}' filters.`)}class vT{convertValue(e,t="none"){switch(Mt(e)){case 0:return null;case 1:return e.booleanValue;case 2:return ce(e.integerValue||e.doubleValue);case 3:return this.convertTimestamp(e.timestampValue);case 4:return this.convertServerTimestamp(e,t);case 5:return e.stringValue;case 6:return this.convertBytes(Lt(e.bytesValue));case 7:return this.convertReference(e.referenceValue);case 8:return this.convertGeoPoint(e.geoPointValue);case 9:return this.convertArray(e.arrayValue,t);case 11:return this.convertObject(e.mapValue,t);case 10:return this.convertVectorValue(e.mapValue);default:throw F(62114,{value:e})}}convertObject(e,t){return this.convertObjectMap(e.fields,t)}convertObjectMap(e,t="none"){const r={};return Bt(e,(i,s)=>{r[i]=this.convertValue(s,t)}),r}convertVectorValue(e){var t,r,i;const s=(i=(r=(t=e.fields)===null||t===void 0?void 0:t[Li].arrayValue)===null||r===void 0?void 0:r.values)===null||i===void 0?void 0:i.map(a=>ce(a.doubleValue));return new Ye(s)}convertGeoPoint(e){return new Qe(ce(e.latitude),ce(e.longitude))}convertArray(e,t){return(e.values||[]).map(r=>this.convertValue(r,t))}convertServerTimestamp(e,t){switch(t){case"previous":const r=is(e);return r==null?null:this.convertValue(r,t);case"estimate":return this.convertTimestamp(Rr(e));default:return null}}convertTimestamp(e){const t=Vt(e);return new Z(t.seconds,t.nanos)}convertDocumentKey(e,t){const r=J.fromString(e);Q(Ld(r),9688,{name:e});const i=new Sr(r.get(1),r.get(3)),s=new M(r.popFirst(5));return i.isEqual(t)||ft(`Document ${s} contains a document reference within a different database (${i.projectId}/${i.database}) which is not supported. It will be treated as a reference in the current database (${t.projectId}/${t.database}) instead.`),s}}/**
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
 */function qa(n,e,t){let r;return r=n?t&&(t.merge||t.mergeFields)?n.toFirestore(e,t):n.toFirestore(e):e,r}class cr{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class Jt extends hf{constructor(e,t,r,i,s,a){super(e,t,r,i,a),this._firestore=e,this._firestoreImpl=e,this.metadata=s}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const t=new Ri(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){const r=this._document.data.field(Is("DocumentSnapshot.get",e));if(r!==null)return this._userDataWriter.convertValue(r,t.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new O(S.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,t={};return t.type=Jt._jsonSchemaVersion,t.bundle="",t.bundleSource="DocumentSnapshot",t.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?t:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),t.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),t)}}Jt._jsonSchemaVersion="firestore/documentSnapshot/1.0",Jt._jsonSchema={type:fe("string",Jt._jsonSchemaVersion),bundleSource:fe("string","DocumentSnapshot"),bundleName:fe("string"),bundle:fe("string")};class Ri extends Jt{data(e={}){return super.data(e)}}class Xt{constructor(e,t,r,i){this._firestore=e,this._userDataWriter=t,this._snapshot=i,this.metadata=new cr(i.hasPendingWrites,i.fromCache),this.query=r}get docs(){const e=[];return this.forEach(t=>e.push(t)),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,t){this._snapshot.docs.forEach(r=>{e.call(t,new Ri(this._firestore,this._userDataWriter,r.key,r,new cr(this._snapshot.mutatedKeys.has(r.key),this._snapshot.fromCache),this.query.converter))})}docChanges(e={}){const t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new O(S.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=function(i,s){if(i._snapshot.oldDocs.isEmpty()){let a=0;return i._snapshot.docChanges.map(c=>{const l=new Ri(i._firestore,i._userDataWriter,c.doc.key,c.doc,new cr(i._snapshot.mutatedKeys.has(c.doc.key),i._snapshot.fromCache),i.query.converter);return c.doc,{type:"added",doc:l,oldIndex:-1,newIndex:a++}})}{let a=i._snapshot.oldDocs;return i._snapshot.docChanges.filter(c=>s||c.type!==3).map(c=>{const l=new Ri(i._firestore,i._userDataWriter,c.doc.key,c.doc,new cr(i._snapshot.mutatedKeys.has(c.doc.key),i._snapshot.fromCache),i.query.converter);let d=-1,p=-1;return c.type!==0&&(d=a.indexOf(c.doc.key),a=a.delete(c.doc.key)),c.type!==1&&(a=a.add(c.doc),p=a.indexOf(c.doc.key)),{type:IT(c.type),doc:l,oldIndex:d,newIndex:p}})}}(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new O(S.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=Xt._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=oa.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const t=[],r=[],i=[];return this.docs.forEach(s=>{s._document!==null&&(t.push(s._document),r.push(this._userDataWriter.convertObjectMap(s._document.data.value.mapValue.fields,"previous")),i.push(s.ref.path))}),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}}function IT(n){switch(n){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return F(61501,{type:n})}}/**
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
 */function kT(n){n=Fe(n,ue);const e=Fe(n.firestore,mt);return oT(jr(e),n._key).then(t=>mf(e,n,t))}Xt._jsonSchemaVersion="firestore/querySnapshot/1.0",Xt._jsonSchema={type:fe("string",Xt._jsonSchemaVersion),bundleSource:fe("string","QuerySnapshot"),bundleName:fe("string"),bundle:fe("string")};class ja extends vT{constructor(e){super(),this.firestore=e}convertBytes(e){return new Be(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new ue(this.firestore,null,t)}}function NT(n){n=Fe(n,jt);const e=Fe(n.firestore,mt),t=jr(e),r=new ja(e);return df(n._query),aT(t,n._query).then(i=>new Xt(e,r,n,i))}function DT(n,e,t){n=Fe(n,ue);const r=Fe(n.firestore,mt),i=qa(n.converter,e,t);return Ts(r,[Va(ys(r),"setDoc",n._key,i,n.converter!==null,t).toMutation(n._key,Ve.none())])}function OT(n){return Ts(Fe(n.firestore,mt),[new ls(n._key,Ve.none())])}function VT(n,e){const t=Fe(n.firestore,mt),r=uT(n),i=qa(n.converter,e);return Ts(t,[Va(ys(n.firestore),"addDoc",r._key,i,n.converter!==null,{}).toMutation(r._key,Ve.exists(!1))]).then(()=>r)}function LT(n,...e){var t,r,i;n=x(n);let s={includeMetadataChanges:!1,source:"default"},a=0;typeof e[a]!="object"||vl(e[a])||(s=e[a++]);const c={includeMetadataChanges:s.includeMetadataChanges,source:s.source};if(vl(e[a])){const g=e[a];e[a]=(t=g.next)===null||t===void 0?void 0:t.bind(g),e[a+1]=(r=g.error)===null||r===void 0?void 0:r.bind(g),e[a+2]=(i=g.complete)===null||i===void 0?void 0:i.bind(g)}let l,d,p;if(n instanceof ue)d=Fe(n.firestore,mt),p=ss(n._key.path),l={next:g=>{e[a]&&e[a](mf(d,n,g))},error:e[a+1],complete:e[a+2]};else{const g=Fe(n,jt);d=Fe(g.firestore,mt),p=g._query;const v=new ja(d);l={next:P=>{e[a]&&e[a](new Xt(d,v,g,P))},error:e[a+1],complete:e[a+2]},df(n._query)}return function(v,P,k,L){const D=new Da(L),$=new Ca(P,D,k);return v.asyncQueue.enqueueAndForget(async()=>Sa(await ji(v),$)),()=>{D.Ou(),v.asyncQueue.enqueueAndForget(async()=>Pa(await ji(v),$))}}(jr(d),p,c,l)}function Ts(n,e){return function(r,i){const s=new ut;return r.asyncQueue.enqueueAndForget(async()=>KE(await sT(r),i,s)),s.promise}(jr(n),e)}function mf(n,e,t){const r=t.docs.get(e._key),i=new ja(n);return new Jt(n,i,e._key,r,new cr(t.hasPendingWrites,t.fromCache),e.converter)}/**
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
 */class ET{constructor(e,t){this._firestore=e,this._commitHandler=t,this._mutations=[],this._committed=!1,this._dataReader=ys(e)}set(e,t,r){this._verifyNotCommitted();const i=uo(e,this._firestore),s=qa(i.converter,t,r),a=Va(this._dataReader,"WriteBatch.set",i._key,s,i.converter!==null,r);return this._mutations.push(a.toMutation(i._key,Ve.none())),this}update(e,t,r,...i){this._verifyNotCommitted();const s=uo(e,this._firestore);let a;return a=typeof(t=x(t))=="string"||t instanceof gs?mT(this._dataReader,"WriteBatch.update",s._key,t,r,i):pT(this._dataReader,"WriteBatch.update",s._key,t),this._mutations.push(a.toMutation(s._key,Ve.exists(!0))),this}delete(e){this._verifyNotCommitted();const t=uo(e,this._firestore);return this._mutations=this._mutations.concat(new ls(t._key,Ve.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new O(S.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function uo(n,e){if((n=x(n)).firestore!==e)throw new O(S.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return n}function MT(){return new La("serverTimestamp")}/**
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
 */function xT(n){return jr(n=Fe(n,mt)),new ET(n,e=>Ts(n,e))}(function(e,t=!0){(function(i){On=i})(bn),vn(new en("firestore",(r,{instanceIdentifier:i,options:s})=>{const a=r.getProvider("app").getImmediate(),c=new mt(new gv(r.getProvider("auth-internal")),new vv(a,r.getProvider("app-check-internal")),function(d,p){if(!Object.prototype.hasOwnProperty.apply(d.options,["projectId"]))throw new O(S.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new Sr(d.options.projectId,p)}(a,i),a);return s=Object.assign({useFetchStreams:t},s),c._setSettings(s),c},"PUBLIC").setMultipleInstances(!0)),Pt(Tu,wu,e),Pt(Tu,wu,"esm2017")})();export{LT as A,VT as B,en as C,r_ as D,n_ as E,gt as F,P_ as G,wT as H,bn as S,Z as T,vn as _,re as a,x as b,Uo as c,sp as d,ap as e,TT as f,Dl as g,Am as h,Sn as i,lv as j,ST as k,uT as l,kT as m,RT as n,bT as o,bl as p,PT as q,Pt as r,MT as s,NT as t,Cl as u,A_ as v,xT as w,DT as x,CT as y,OT as z};
//# sourceMappingURL=firebase-vendor-C56ojj1e.js.map
