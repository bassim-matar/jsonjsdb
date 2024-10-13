var t="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};function i(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t}function n(t){if(t.__esModule)return t;var i=t.default;if("function"==typeof i){var n=function t(){return this instanceof t?Reflect.construct(i,arguments,this.constructor):i.apply(this,arguments)};n.prototype=i.prototype}else n={};return Object.defineProperty(n,"__esModule",{value:!0}),Object.keys(t).forEach((function(i){var s=Object.getOwnPropertyDescriptor(t,i);Object.defineProperty(n,i,s.get?s:{enumerable:!0,get:function(){return t[i]}})})),n}var s,e={exports:{}};var r,o,c,h,a,f=i((s||(s=1,r=e,h="undefined"!=typeof window?window:{},a=h.indexedDB||h.mozIndexedDB||h.webkitIndexedDB||h.msIndexedDB,"undefined"==typeof window||a?((a=a.open("ldb",1)).onsuccess=function(t){o=this.result},a.onerror=function(t){console.error("indexedDB request error"),console.log(t)},a={get:(c={ready:!(a.onupgradeneeded=function(t){o=null,t.target.result.createObjectStore("s",{keyPath:"k"}).transaction.oncomplete=function(t){o=t.target.db}}),get:function(t,i){o?o.transaction("s").objectStore("s").get(t).onsuccess=function(t){t=t.target.result&&t.target.result.v||null,i(t)}:setTimeout((function(){c.get(t,i)}),50)},set:function(t,i,n){if(o){let s=o.transaction("s","readwrite");s.oncomplete=function(t){"Function"==={}.toString.call(n).slice(8,-1)&&n()},s.objectStore("s").put({k:t,v:i}),s.commit()}else setTimeout((function(){c.set(t,i,n)}),50)},delete:function(t,i){o?o.transaction("s","readwrite").objectStore("s").delete(t).onsuccess=function(t){i&&i()}:setTimeout((function(){c.delete(t,i)}),50)},list:function(t){o?o.transaction("s").objectStore("s").getAllKeys().onsuccess=function(i){i=i.target.result||null,t(i)}:setTimeout((function(){c.list(t)}),50)},getAll:function(t){o?o.transaction("s").objectStore("s").getAll().onsuccess=function(i){i=i.target.result||null,t(i)}:setTimeout((function(){c.getAll(t)}),50)},clear:function(t){o?o.transaction("s","readwrite").objectStore("s").clear().onsuccess=function(i){t&&t()}:setTimeout((function(){c.clear(t)}),50)}}).get,set:c.set,delete:c.delete,list:c.list,getAll:c.getAll,clear:c.clear},h.ldb=a,r.exports=a):console.error("indexDB not supported")),e.exports)),u={exports:{}};var _,d={exports:{}},l=n(Object.freeze({__proto__:null,default:{}}));d.exports;function v(){return _||(_=1,d.exports=(i=i||function(i,n){var s;if("undefined"!=typeof window&&window.crypto&&(s=window.crypto),"undefined"!=typeof self&&self.crypto&&(s=self.crypto),"undefined"!=typeof globalThis&&globalThis.crypto&&(s=globalThis.crypto),!s&&"undefined"!=typeof window&&window.msCrypto&&(s=window.msCrypto),!s&&void 0!==t&&t.crypto&&(s=t.crypto),!s)try{s=l}catch(t){}var e=function(){if(s){if("function"==typeof s.getRandomValues)try{return s.getRandomValues(new Uint32Array(1))[0]}catch(t){}if("function"==typeof s.randomBytes)try{return s.randomBytes(4).readInt32LE()}catch(t){}}throw new Error("Native crypto module could not be used to get secure random number.")},r=Object.create||function(){function t(){}return function(i){var n;return t.prototype=i,n=new t,t.prototype=null,n}}(),o={},c=o.lib={},h=c.Base={extend:function(t){var i=r(this);return t&&i.mixIn(t),i.hasOwnProperty("init")&&this.init!==i.init||(i.init=function(){i.$super.init.apply(this,arguments)}),i.init.prototype=i,i.$super=this,i},create:function(){var t=this.extend();return t.init.apply(t,arguments),t},init:function(){},mixIn:function(t){for(var i in t)t.hasOwnProperty(i)&&(this[i]=t[i]);t.hasOwnProperty("toString")&&(this.toString=t.toString)},clone:function(){return this.init.prototype.extend(this)}},a=c.WordArray=h.extend({init:function(t,i){t=this.words=t||[],this.sigBytes=i!=n?i:4*t.length},toString:function(t){return(t||u).stringify(this)},concat:function(t){var i=this.words,n=t.words,s=this.sigBytes,e=t.sigBytes;if(this.clamp(),s%4)for(var r=0;r<e;r++){var o=n[r>>>2]>>>24-r%4*8&255;i[s+r>>>2]|=o<<24-(s+r)%4*8}else for(var c=0;c<e;c+=4)i[s+c>>>2]=n[c>>>2];return this.sigBytes+=e,this},clamp:function(){var t=this.words,n=this.sigBytes;t[n>>>2]&=4294967295<<32-n%4*8,t.length=i.ceil(n/4)},clone:function(){var t=h.clone.call(this);return t.words=this.words.slice(0),t},random:function(t){for(var i=[],n=0;n<t;n+=4)i.push(e());return new a.init(i,t)}}),f=o.enc={},u=f.Hex={stringify:function(t){for(var i=t.words,n=t.sigBytes,s=[],e=0;e<n;e++){var r=i[e>>>2]>>>24-e%4*8&255;s.push((r>>>4).toString(16)),s.push((15&r).toString(16))}return s.join("")},parse:function(t){for(var i=t.length,n=[],s=0;s<i;s+=2)n[s>>>3]|=parseInt(t.substr(s,2),16)<<24-s%8*4;return new a.init(n,i/2)}},_=f.Latin1={stringify:function(t){for(var i=t.words,n=t.sigBytes,s=[],e=0;e<n;e++){var r=i[e>>>2]>>>24-e%4*8&255;s.push(String.fromCharCode(r))}return s.join("")},parse:function(t){for(var i=t.length,n=[],s=0;s<i;s++)n[s>>>2]|=(255&t.charCodeAt(s))<<24-s%4*8;return new a.init(n,i)}},d=f.Utf8={stringify:function(t){try{return decodeURIComponent(escape(_.stringify(t)))}catch(t){throw new Error("Malformed UTF-8 data")}},parse:function(t){return _.parse(unescape(encodeURIComponent(t)))}},v=c.BufferedBlockAlgorithm=h.extend({reset:function(){this.t=new a.init,this.i=0},o:function(t){"string"==typeof t&&(t=d.parse(t)),this.t.concat(t),this.i+=t.sigBytes},h:function(t){var n,s=this.t,e=s.words,r=s.sigBytes,o=this.blockSize,c=r/(4*o),h=(c=t?i.ceil(c):i.max((0|c)-this.u,0))*o,f=i.min(4*h,r);if(h){for(var u=0;u<h;u+=o)this._(e,u);n=e.splice(0,h),s.sigBytes-=f}return new a.init(n,f)},clone:function(){var t=h.clone.call(this);return t.t=this.t.clone(),t},u:0});c.Hasher=v.extend({cfg:h.extend(),init:function(t){this.cfg=this.cfg.extend(t),this.reset()},reset:function(){v.reset.call(this),this.l()},update:function(t){return this.o(t),this.h(),this},finalize:function(t){return t&&this.o(t),this.p()},blockSize:16,m:function(t){return function(i,n){return new t.init(n).finalize(i)}},j:function(t){return function(i,n){return new p.HMAC.init(t,n).finalize(i)}}});var p=o.algo={};return o}(Math),i)),d.exports;var i}var p,y={exports:{}};y.exports;function m(){return p||(p=1,y.exports=(t=v(),function(){var i=t,n=i.lib.WordArray;function s(t,i,s){for(var e=[],r=0,o=0;o<i;o++)if(o%4){var c=s[t.charCodeAt(o-1)]<<o%4*2|s[t.charCodeAt(o)]>>>6-o%4*2;e[r>>>2]|=c<<24-r%4*8,r++}return n.create(e,r)}i.enc.Base64={stringify:function(t){var i=t.words,n=t.sigBytes,s=this.O;t.clamp();for(var e=[],r=0;r<n;r+=3)for(var o=(i[r>>>2]>>>24-r%4*8&255)<<16|(i[r+1>>>2]>>>24-(r+1)%4*8&255)<<8|i[r+2>>>2]>>>24-(r+2)%4*8&255,c=0;c<4&&r+.75*c<n;c++)e.push(s.charAt(o>>>6*(3-c)&63));var h=s.charAt(64);if(h)for(;e.length%4;)e.push(h);return e.join("")},parse:function(t){var i=t.length,n=this.O,e=this.S;if(!e){e=this.S=[];for(var r=0;r<n.length;r++)e[n.charCodeAt(r)]=r}var o=n.charAt(64);if(o){var c=t.indexOf(o);-1!==c&&(i=c)}return s(t,i,e)},O:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}}(),t.enc.Base64)),y.exports;var t}var b,w={exports:{}};w.exports;function g(){return b||(b=1,w.exports=(t=v(),function(i){var n=t,s=n.lib,e=s.WordArray,r=s.Hasher,o=n.algo,c=[];!function(){for(var t=0;t<64;t++)c[t]=4294967296*i.abs(i.sin(t+1))|0}();var h=o.MD5=r.extend({l:function(){this.F=new e.init([1732584193,4023233417,2562383102,271733878])},_:function(t,i){for(var n=0;n<16;n++){var s=i+n,e=t[s];t[s]=16711935&(e<<8|e>>>24)|4278255360&(e<<24|e>>>8)}var r=this.F.words,o=t[i+0],h=t[i+1],d=t[i+2],l=t[i+3],v=t[i+4],p=t[i+5],y=t[i+6],m=t[i+7],b=t[i+8],w=t[i+9],g=t[i+10],j=t[i+11],k=t[i+12],x=t[i+13],O=t[i+14],S=t[i+15],z=r[0],F=r[1],B=r[2],D=r[3];z=a(z,F,B,D,o,7,c[0]),D=a(D,z,F,B,h,12,c[1]),B=a(B,D,z,F,d,17,c[2]),F=a(F,B,D,z,l,22,c[3]),z=a(z,F,B,D,v,7,c[4]),D=a(D,z,F,B,p,12,c[5]),B=a(B,D,z,F,y,17,c[6]),F=a(F,B,D,z,m,22,c[7]),z=a(z,F,B,D,b,7,c[8]),D=a(D,z,F,B,w,12,c[9]),B=a(B,D,z,F,g,17,c[10]),F=a(F,B,D,z,j,22,c[11]),z=a(z,F,B,D,k,7,c[12]),D=a(D,z,F,B,x,12,c[13]),B=a(B,D,z,F,O,17,c[14]),z=f(z,F=a(F,B,D,z,S,22,c[15]),B,D,h,5,c[16]),D=f(D,z,F,B,y,9,c[17]),B=f(B,D,z,F,j,14,c[18]),F=f(F,B,D,z,o,20,c[19]),z=f(z,F,B,D,p,5,c[20]),D=f(D,z,F,B,g,9,c[21]),B=f(B,D,z,F,S,14,c[22]),F=f(F,B,D,z,v,20,c[23]),z=f(z,F,B,D,w,5,c[24]),D=f(D,z,F,B,O,9,c[25]),B=f(B,D,z,F,l,14,c[26]),F=f(F,B,D,z,b,20,c[27]),z=f(z,F,B,D,x,5,c[28]),D=f(D,z,F,B,d,9,c[29]),B=f(B,D,z,F,m,14,c[30]),z=u(z,F=f(F,B,D,z,k,20,c[31]),B,D,p,4,c[32]),D=u(D,z,F,B,b,11,c[33]),B=u(B,D,z,F,j,16,c[34]),F=u(F,B,D,z,O,23,c[35]),z=u(z,F,B,D,h,4,c[36]),D=u(D,z,F,B,v,11,c[37]),B=u(B,D,z,F,m,16,c[38]),F=u(F,B,D,z,g,23,c[39]),z=u(z,F,B,D,x,4,c[40]),D=u(D,z,F,B,o,11,c[41]),B=u(B,D,z,F,l,16,c[42]),F=u(F,B,D,z,y,23,c[43]),z=u(z,F,B,D,w,4,c[44]),D=u(D,z,F,B,k,11,c[45]),B=u(B,D,z,F,S,16,c[46]),z=_(z,F=u(F,B,D,z,d,23,c[47]),B,D,o,6,c[48]),D=_(D,z,F,B,m,10,c[49]),B=_(B,D,z,F,O,15,c[50]),F=_(F,B,D,z,p,21,c[51]),z=_(z,F,B,D,k,6,c[52]),D=_(D,z,F,B,l,10,c[53]),B=_(B,D,z,F,g,15,c[54]),F=_(F,B,D,z,h,21,c[55]),z=_(z,F,B,D,b,6,c[56]),D=_(D,z,F,B,S,10,c[57]),B=_(B,D,z,F,y,15,c[58]),F=_(F,B,D,z,x,21,c[59]),z=_(z,F,B,D,v,6,c[60]),D=_(D,z,F,B,j,10,c[61]),B=_(B,D,z,F,d,15,c[62]),F=_(F,B,D,z,w,21,c[63]),r[0]=r[0]+z|0,r[1]=r[1]+F|0,r[2]=r[2]+B|0,r[3]=r[3]+D|0},p:function(){var t=this.t,n=t.words,s=8*this.i,e=8*t.sigBytes;n[e>>>5]|=128<<24-e%32;var r=i.floor(s/4294967296),o=s;n[15+(e+64>>>9<<4)]=16711935&(r<<8|r>>>24)|4278255360&(r<<24|r>>>8),n[14+(e+64>>>9<<4)]=16711935&(o<<8|o>>>24)|4278255360&(o<<24|o>>>8),t.sigBytes=4*(n.length+1),this.h();for(var c=this.F,h=c.words,a=0;a<4;a++){var f=h[a];h[a]=16711935&(f<<8|f>>>24)|4278255360&(f<<24|f>>>8)}return c},clone:function(){var t=r.clone.call(this);return t.F=this.F.clone(),t}});function a(t,i,n,s,e,r,o){var c=t+(i&n|~i&s)+e+o;return(c<<r|c>>>32-r)+i}function f(t,i,n,s,e,r,o){var c=t+(i&s|n&~s)+e+o;return(c<<r|c>>>32-r)+i}function u(t,i,n,s,e,r,o){var c=t+(i^n^s)+e+o;return(c<<r|c>>>32-r)+i}function _(t,i,n,s,e,r,o){var c=t+(n^(i|~s))+e+o;return(c<<r|c>>>32-r)+i}n.MD5=r.m(h),n.HmacMD5=r.j(h)}(Math),t.MD5)),w.exports;var t}var j,k={exports:{}},x={exports:{}};x.exports;function O(){return j||(j=1,x.exports=(c=v(),i=(t=c).lib,n=i.WordArray,s=i.Hasher,e=t.algo,r=[],o=e.SHA1=s.extend({l:function(){this.F=new n.init([1732584193,4023233417,2562383102,271733878,3285377520])},_:function(t,i){for(var n=this.F.words,s=n[0],e=n[1],o=n[2],c=n[3],h=n[4],a=0;a<80;a++){if(a<16)r[a]=0|t[i+a];else{var f=r[a-3]^r[a-8]^r[a-14]^r[a-16];r[a]=f<<1|f>>>31}var u=(s<<5|s>>>27)+h+r[a];u+=a<20?1518500249+(e&o|~e&c):a<40?1859775393+(e^o^c):a<60?(e&o|e&c|o&c)-1894007588:(e^o^c)-899497514,h=c,c=o,o=e<<30|e>>>2,e=s,s=u}n[0]=n[0]+s|0,n[1]=n[1]+e|0,n[2]=n[2]+o|0,n[3]=n[3]+c|0,n[4]=n[4]+h|0},p:function(){var t=this.t,i=t.words,n=8*this.i,s=8*t.sigBytes;return i[s>>>5]|=128<<24-s%32,i[14+(s+64>>>9<<4)]=Math.floor(n/4294967296),i[15+(s+64>>>9<<4)]=n,t.sigBytes=4*i.length,this.h(),this.F},clone:function(){var t=s.clone.call(this);return t.F=this.F.clone(),t}}),t.SHA1=s.m(o),t.HmacSHA1=s.j(o),c.SHA1)),x.exports;var t,i,n,s,e,r,o,c}var S,z={exports:{}};z.exports;var F;k.exports;function B(){return F||(F=1,k.exports=function(t){return function(){var i=t,n=i.lib,s=n.Base,e=n.WordArray,r=i.algo,o=r.MD5,c=r.EvpKDF=s.extend({cfg:s.extend({keySize:4,hasher:o,iterations:1}),init:function(t){this.cfg=this.cfg.extend(t)},compute:function(t,i){for(var n,s=this.cfg,r=s.hasher.create(),o=e.create(),c=o.words,h=s.keySize,a=s.iterations;c.length<h;){n&&r.update(n),n=r.update(t).finalize(i),r.reset();for(var f=1;f<a;f++)n=r.finalize(n),r.reset();o.concat(n)}return o.sigBytes=4*h,o}});i.EvpKDF=function(t,i,n){return c.create(n).compute(t,i)}}(),t.EvpKDF}(v(),O(),(S||(S=1,z.exports=(t=v(),n=(i=t).lib.Base,s=i.enc.Utf8,void(i.algo.HMAC=n.extend({init:function(t,i){t=this.B=new t.init,"string"==typeof i&&(i=s.parse(i));var n=t.blockSize,e=4*n;i.sigBytes>e&&(i=t.finalize(i)),i.clamp();for(var r=this.D=i.clone(),o=this.T=i.clone(),c=r.words,h=o.words,a=0;a<n;a++)c[a]^=1549556828,h[a]^=909522486;r.sigBytes=o.sigBytes=e,this.reset()},reset:function(){var t=this.B;t.reset(),t.update(this.T)},update:function(t){return this.B.update(t),this},finalize:function(t){var i=this.B,n=i.finalize(t);return i.reset(),i.finalize(this.D.clone().concat(n))}})))),z.exports))),k.exports;var t,i,n,s}var D,T={exports:{}};T.exports;var A;var M,E,I=(A||(A=1,u.exports=function(t){return function(){var i=t,n=i.lib.BlockCipher,s=i.algo,e=[],r=[],o=[],c=[],h=[],a=[],f=[],u=[],_=[],d=[];!function(){for(var t=[],i=0;i<256;i++)t[i]=i<128?i<<1:i<<1^283;var n=0,s=0;for(i=0;i<256;i++){var l=s^s<<1^s<<2^s<<3^s<<4;l=l>>>8^255&l^99,e[n]=l,r[l]=n;var v=t[n],p=t[v],y=t[p],m=257*t[l]^16843008*l;o[n]=m<<24|m>>>8,c[n]=m<<16|m>>>16,h[n]=m<<8|m>>>24,a[n]=m,m=16843009*y^65537*p^257*v^16843008*n,f[l]=m<<24|m>>>8,u[l]=m<<16|m>>>16,_[l]=m<<8|m>>>24,d[l]=m,n?(n=v^t[t[t[y^v]]],s^=t[t[s]]):n=s=1}}();var l=[0,1,2,4,8,16,32,64,128,27,54],v=s.AES=n.extend({l:function(){if(!this.A||this.M!==this.I){for(var t=this.M=this.I,i=t.words,n=t.sigBytes/4,s=4*((this.A=n+6)+1),r=this.$=[],o=0;o<s;o++)o<n?r[o]=i[o]:(a=r[o-1],o%n?n>6&&o%n==4&&(a=e[a>>>24]<<24|e[a>>>16&255]<<16|e[a>>>8&255]<<8|e[255&a]):(a=e[(a=a<<8|a>>>24)>>>24]<<24|e[a>>>16&255]<<16|e[a>>>8&255]<<8|e[255&a],a^=l[o/n|0]<<24),r[o]=r[o-n]^a);for(var c=this.R=[],h=0;h<s;h++){if(o=s-h,h%4)var a=r[o];else a=r[o-4];c[h]=h<4||o<=4?a:f[e[a>>>24]]^u[e[a>>>16&255]]^_[e[a>>>8&255]]^d[e[255&a]]}}},encryptBlock:function(t,i){this.N(t,i,this.$,o,c,h,a,e)},decryptBlock:function(t,i){var n=t[i+1];t[i+1]=t[i+3],t[i+3]=n,this.N(t,i,this.R,f,u,_,d,r),n=t[i+1],t[i+1]=t[i+3],t[i+3]=n},N:function(t,i,n,s,e,r,o,c){for(var h=this.A,a=t[i]^n[0],f=t[i+1]^n[1],u=t[i+2]^n[2],_=t[i+3]^n[3],d=4,l=1;l<h;l++){var v=s[a>>>24]^e[f>>>16&255]^r[u>>>8&255]^o[255&_]^n[d++],p=s[f>>>24]^e[u>>>16&255]^r[_>>>8&255]^o[255&a]^n[d++],y=s[u>>>24]^e[_>>>16&255]^r[a>>>8&255]^o[255&f]^n[d++],m=s[_>>>24]^e[a>>>16&255]^r[f>>>8&255]^o[255&u]^n[d++];a=v,f=p,u=y,_=m}v=(c[a>>>24]<<24|c[f>>>16&255]<<16|c[u>>>8&255]<<8|c[255&_])^n[d++],p=(c[f>>>24]<<24|c[u>>>16&255]<<16|c[_>>>8&255]<<8|c[255&a])^n[d++],y=(c[u>>>24]<<24|c[_>>>16&255]<<16|c[a>>>8&255]<<8|c[255&f])^n[d++],m=(c[_>>>24]<<24|c[a>>>16&255]<<16|c[f>>>8&255]<<8|c[255&u])^n[d++],t[i]=v,t[i+1]=p,t[i+2]=y,t[i+3]=m},keySize:8});i.AES=n.m(v)}(),t.AES}(v(),m(),g(),B(),(D||(D=1,T.exports=(M=v(),B(),void(M.lib.Cipher||function(t){var i=M,n=i.lib,s=n.Base,e=n.WordArray,r=n.BufferedBlockAlgorithm,o=i.enc;o.Utf8;var c=o.Base64,h=i.algo.EvpKDF,a=n.Cipher=r.extend({cfg:s.extend(),createEncryptor:function(t,i){return this.create(this.P,t,i)},createDecryptor:function(t,i){return this.create(this.C,t,i)},init:function(t,i,n){this.cfg=this.cfg.extend(n),this.H=t,this.I=i,this.reset()},reset:function(){r.reset.call(this),this.l()},process:function(t){return this.o(t),this.h()},finalize:function(t){return t&&this.o(t),this.p()},keySize:4,ivSize:4,P:1,C:2,m:function(){function t(t){return"string"==typeof t?m:p}return function(i){return{encrypt:function(n,s,e){return t(s).encrypt(i,n,s,e)},decrypt:function(n,s,e){return t(s).decrypt(i,n,s,e)}}}}()});n.StreamCipher=a.extend({p:function(){return this.h(!0)},blockSize:1});var f=i.mode={},u=n.BlockCipherMode=s.extend({createEncryptor:function(t,i){return this.Encryptor.create(t,i)},createDecryptor:function(t,i){return this.Decryptor.create(t,i)},init:function(t,i){this.U=t,this.V=i}}),_=f.CBC=function(){var i=u.extend();function n(i,n,s){var e,r=this.V;r?(e=r,this.V=t):e=this.J;for(var o=0;o<s;o++)i[n+o]^=e[o]}return i.Encryptor=i.extend({processBlock:function(t,i){var s=this.U,e=s.blockSize;n.call(this,t,i,e),s.encryptBlock(t,i),this.J=t.slice(i,i+e)}}),i.Decryptor=i.extend({processBlock:function(t,i){var s=this.U,e=s.blockSize,r=t.slice(i,i+e);s.decryptBlock(t,i),n.call(this,t,i,e),this.J=r}}),i}(),d=(i.pad={}).Pkcs7={pad:function(t,i){for(var n=4*i,s=n-t.sigBytes%n,r=s<<24|s<<16|s<<8|s,o=[],c=0;c<s;c+=4)o.push(r);var h=e.create(o,s);t.concat(h)},unpad:function(t){var i=255&t.words[t.sigBytes-1>>>2];t.sigBytes-=i}};n.BlockCipher=a.extend({cfg:a.cfg.extend({mode:_,padding:d}),reset:function(){var t;a.reset.call(this);var i=this.cfg,n=i.iv,s=i.mode;this.H==this.P?t=s.createEncryptor:(t=s.createDecryptor,this.u=1),this.X&&this.X.__creator==t?this.X.init(this,n&&n.words):(this.X=t.call(s,this,n&&n.words),this.X.__creator=t)},_:function(t,i){this.X.processBlock(t,i)},p:function(){var t,i=this.cfg.padding;return this.H==this.P?(i.pad(this.t,this.blockSize),t=this.h(!0)):(t=this.h(!0),i.unpad(t)),t},blockSize:4});var l=n.CipherParams=s.extend({init:function(t){this.mixIn(t)},toString:function(t){return(t||this.formatter).stringify(this)}}),v=(i.format={}).OpenSSL={stringify:function(t){var i=t.ciphertext,n=t.salt;return(n?e.create([1398893684,1701076831]).concat(n).concat(i):i).toString(c)},parse:function(t){var i,n=c.parse(t),s=n.words;return 1398893684==s[0]&&1701076831==s[1]&&(i=e.create(s.slice(2,4)),s.splice(0,4),n.sigBytes-=16),l.create({ciphertext:n,salt:i})}},p=n.SerializableCipher=s.extend({cfg:s.extend({format:v}),encrypt:function(t,i,n,s){s=this.cfg.extend(s);var e=t.createEncryptor(n,s),r=e.finalize(i),o=e.cfg;return l.create({ciphertext:r,key:n,iv:o.iv,algorithm:t,mode:o.mode,padding:o.padding,blockSize:t.blockSize,formatter:s.format})},decrypt:function(t,i,n,s){return s=this.cfg.extend(s),i=this.q(i,s.format),t.createDecryptor(n,s).finalize(i.ciphertext)},q:function(t,i){return"string"==typeof t?i.parse(t,this):t}}),y=(i.kdf={}).OpenSSL={execute:function(t,i,n,s,r){if(s||(s=e.random(8)),r)o=h.create({keySize:i+n,hasher:r}).compute(t,s);else var o=h.create({keySize:i+n}).compute(t,s);var c=e.create(o.words.slice(i),4*n);return o.sigBytes=4*i,l.create({key:o,iv:c,salt:s})}},m=n.PasswordBasedCipher=p.extend({cfg:p.cfg.extend({kdf:y}),encrypt:function(t,i,n,s){var e=(s=this.cfg.extend(s)).kdf.execute(n,t.keySize,t.ivSize,s.salt,s.hasher);s.iv=e.iv;var r=p.encrypt.call(this,t,i,e.key,s);return r.mixIn(e),r},decrypt:function(t,i,n,s){s=this.cfg.extend(s),i=this.q(i,s.format);var e=s.kdf.execute(n,t.keySize,t.ivSize,i.salt,s.hasher);return s.iv=e.iv,p.decrypt.call(this,t,i,e.key,s)}})}()))),T.exports))),u.exports),$=i(I),R={exports:{}};var N=(E||(E=1,R.exports=function(t){return t.enc.Utf8}(v())),R.exports),P=i(N);class C{constructor(t){this.browser_key=t,this.crypto=$}encrypt(t){return this.crypto.encrypt(t,this.browser_key).toString()}decrypt(t){return this.crypto.decrypt(t,this.browser_key).toString(P)}}class H{constructor(t,i,n){this.encryption=new C(t),this.ldb=f,this.G=t=>i+"/"+t,this.use_encryption=Boolean(t),!1===n&&(this.use_encryption=!1)}K(t){try{return JSON.parse(t)}catch{return t}}L(t){try{return this.encryption.decrypt(t)}catch{return t}}getAll(t,i){const n=this.G(t),s=[];this.ldb.getAll((t=>{for(const i of t){if(!i.k.startsWith(n))continue;let t=i.v;this.use_encryption&&(t=this.K(this.L(t))),s[i.k.split(n)[1]]=t}i(s)}))}get(t){return new Promise((i=>{this.ldb.get(this.G(t),(t=>{this.use_encryption&&(t=this.K(this.L(t))),i(t)}))}))}set(t,i,n=(()=>{})){this.use_encryption&&(i=this.encryption.encrypt(JSON.stringify(i))),this.ldb.set(this.G(t),i,n)}clear(){this.ldb.clear()}}class U{W=["__metaFolder__","__metaDataset__","__metaVariable__"];Y="db_cache/";constructor(t){window.jsonjs={},this.browser=t}async load(t,i=!1,n={}){return await this.load_tables(t,i),this.Z(),n.filter?.values?.length>0&&this.tt(n.filter),this.it(),this.nt(),this.db}async st(t){return this.browser.get(this.Y+t)}async et(t,i){this.browser.set(this.Y+i,t)}async rt(t,i,n){const s=document.createElement("script");let e=t+"/"+i+".json.js?v=";return e+=n.version?n.version:Math.random(),s.src=e,s.async=!1,new Promise(((r,o)=>{s.onload=()=>{if(!(i in jsonjs.data)||void 0===jsonjs.data[i]){const t=`jsonjs.data.${i} not found in table ${i}`;return console.error(t),void o(new Error(t))}let t=jsonjs.data[i];jsonjs.data[i]=void 0,t.length>0&&Array.isArray(t[0])&&(t=this.ot(t)),r(t),document.querySelectorAll(`script[src="${e}"]`)[0].remove(),n.use_cache&&this.et(t,i)},s.onerror=()=>{const n=`table "${i}" not found in path "${t}"`;jsonjs.data[i]=void 0,console.error(n),o(new Error(n))},document.head.appendChild(s)}))}ot(t){return(t=t.map((i=>i.reduce(((i,n,s)=>({...i,[t[0][s]]:n})),{})))).shift(),t}ct(t,i){return!!this.meta_cache&&(t in this.meta_cache&&this.meta_cache[t]===i)}async load_jsonjs(t,i,n={}){return"/"===t.slice(-1)&&(t=t.slice(0,-1)),void 0===jsonjs&&(jsonjs={}),void 0===jsonjs.data&&(jsonjs.data={}),n.use_cache&&this.ct(i,n.version)?this.st(i,n.version):this.rt(t,i,n)}async load_tables(t,i){const n=await this.load_jsonjs(t,"__meta__");if(i){this.meta_cache=await this.browser.get(this.Y+"__meta__");const t=n.reduce(((t,i)=>({...t,[i.name]:i.last_modif})),{});this.et(t,"__meta__")}this.db={__meta__:n,__schema__:{aliases:[],one_to_one:[],one_to_many:[],many_to_many:[]},__user_data__:{}};const s=[],e=[];for(const r of n)e.push({name:r.name}),s.push(this.load_jsonjs(t,r.name,{version:r.last_modif,use_cache:i}));const r=await Promise.all(s);for(const[t,i]of r.entries())this.db[e[t].name]=i}Z(){for(const t of this.db.__meta__)if(0!==this.db[t.name].length)for(const i in this.db[t.name][0]){if(!i.endsWith("_ids"))continue;const n=i.slice(0,-4);if(!(n in this.db))continue;const s=t.name+"_"+n;s in this.db||(this.db.__meta__.push({name:s}),this.db[s]=[]);for(const e of this.db[t.name]){if(!e[i])continue;const r=e[i].split(",");for(const i of r)this.db[s].push({[t.name+"_id"]:e.id,[n+"_id"]:i.trim()})}}}tt(t){if(!("entity"in t))return!1;if(!("variable"in t))return!1;if(!t.entity in this.db)return!1;const i=[];for(const n of this.db[t.entity])t.values.includes(n[t.variable])&&i.push(n.id);this.db[t.entity]=this.db[t.entity].filter((t=>!i.includes(t.id)));for(const n of this.db.__meta__){if(0===this.db[n.name].length)continue;if(!this.db[n.name][0].hasOwnProperty(t.entity+"_id"))continue;const s=[];for(const e of this.db[n.name])i.includes(e[t.entity+"_id"])&&s.push(e.id);this.db[n.name]=this.db[n.name].filter((n=>!i.includes(n[t.entity+"_id"])));for(const t of this.db.__meta__)0!==this.db[t.name].length&&this.db[t.name][0].hasOwnProperty(n.name+"_id")&&(this.db[t.name]=this.db[t.name].filter((t=>!s.includes(t[n.name+"_id"]))))}}ht(t,i){return t in this.db.__index__?void 0===this.db.__index__[t].id[i]?(console.error("id_to_index() table ",t,"id not found",i),!1):this.db.__index__[t].id[i]:(console.error("id_to_index() table not found",t),!1)}it(){if(!("alias"in this.db))return!1;const t=this.db.alias;for(const i of t){const t=[];if(i.table in this.db){for(const n of this.db[i.table]){const s={id:n.id};s[i.table+"_id"]=n.id,t.push(s)}this.db[i.alias]=t,this.db.__meta__.push({name:i.alias,alias:!0}),this.db.__schema__.aliases.push(i.alias)}else console.error("create_alias() table not found:",i.table)}}nt(){this.db.__index__={};for(const t of this.db.__meta__)t.name.includes("_")||(this.db.__index__[t.name]={});for(const t of this.db.__meta__)!t.name.includes("_")&&this.db[t.name][0]&&(this.ft(t),this.ut(t));for(const t of this.db.__meta__)this.W.includes(t.name)||t.name.includes("_")&&this.db[t.name][0]&&(this._t(t,"left"),this._t(t,"right"))}_t(t,i){const n={},s=t.name.split("_");if(!(s[0]in this.db.__index__))return console.error("process_many_to_many() table not found",s[0]),!1;if(!(s[1]in this.db.__index__))return console.error("process_many_to_many() table not found",s[1]),!1;"right"===i&&s.reverse();const e=s[0]+"_id",r=s[1]+"_id";for(const[i,o]of Object.entries(this.db[t.name]))o[r]in n?(Array.isArray(n[o[r]])||(n[o[r]]=[n[o[r]]]),n[o[r]].push(this.ht(s[0],o[e]))):n[o[r]]=this.ht(s[0],o[e]);delete n.null,this.db.__index__[s[0]][r]=n,"left"===i&&this.db.__schema__.many_to_many.push([s[0],r.slice(0,-3)])}ut(t){for(const i in this.db[t.name][0])"parent_id"!==i?i.endsWith("_id")&&i.slice(0,-3)in this.db.__index__&&this.dt(i,t):this.lt(t)}lt(t){const i={};for(const[n,s]of Object.entries(this.db[t.name]))s.parent_id in i?(Array.isArray(i[s.parent_id])||(i[s.parent_id]=[i[s.parent_id]]),i[s.parent_id].push(parseInt(n))):i[s.parent_id]=parseInt(n);this.db.__index__[t.name].parent_id=i,this.db.__schema__.one_to_many.push([t.name,t.name])}ft(t){const i={};if(!(t.name in this.db))return!1;if(0===this.db[t.name].length)return!1;if(!("id"in this.db[t.name][0]))return!1;for(const[n,s]of Object.entries(this.db[t.name]))i[s.id]=parseInt(n);this.db.__index__[t.name].id=i}dt(t,i){const n={};for(const[s,e]of Object.entries(this.db[i.name]))e[t]in n?(Array.isArray(n[e[t]])||(n[e[t]]=[n[e[t]]]),n[e[t]].push(parseInt(s))):n[e[t]]=parseInt(s);delete n.null,this.db.__index__[i.name][t]=n,this.db.__schema__.aliases.includes(i.name)?this.db.__schema__.one_to_one.push([i.name,t.slice(0,-3)]):this.db.__schema__.one_to_many.push([t.slice(0,-3),i.name])}add_meta(t={}){this.db.__user_data__=t;const i={},n={},s=[],e=this.db;for(const t of Object.values(e.__meta__))t.last_modif||s.push(t.name);if("__metaFolder__"in this.db)for(const t of this.db.__metaFolder__)n[t.id]=t;if("__metaDataset__"in this.db)for(const t of this.db.__metaDataset__)i[t.id]=t;if(this.metaVariable={},"__metaVariable__"in this.db)for(const t of this.db.__metaVariable__)this.metaVariable[t.dataset+"---"+t.variable]=t;const r={id:"data",name:"data",description:n.data?.description,nb_dataset:0,nb_variable:0},o={id:"user_data",name:"user_data",description:n.user_data?.description,nb_dataset:0,nb_variable:0};this.db.metaFolder=[r,o],this.db.metaDataset=[],this.db.metaVariable=[];const c=Object.entries(this.db.__user_data__);for(const[t,n]of c){if(0===n.length)continue;const s=Object.keys(n[0]);this.db.metaDataset.push({id:t,metaFolder_id:"user_data",name:t,nb_variable:s.length,nb_row:n.length,description:i[t]?.description}),this.vt(t,n,s),o.nb_dataset+=1,o.nb_variable+=s.length}for(const t of this.db.__meta__){if(t.name.includes("__meta__"))continue;if(this.W.includes(t.name))continue;if(0===this.db[t.name].length)continue;if(s.includes(t.name))continue;const n=Object.keys(this.db[t.name][0]);this.db.metaDataset.push({id:t.name,metaFolder_id:"data",name:t.name,nb_variable:n.length,nb_row:this.db[t.name].length,description:i[t.name]?.description,last_update_timestamp:t.last_modif}),this.vt(t.name,this.db[t.name],n),r.nb_dataset+=1,r.nb_variable+=n.length}this.db.__index__.metaFolder={},this.db.__index__.metaDataset={},this.db.__index__.metaVariable={},this.ft({name:"metaFolder"}),this.ft({name:"metaDataset"}),this.ft({name:"metaVariable"}),this.ut({name:"metaDataset"}),this.ut({name:"metaVariable"})}vt(t,i,n){const s=Math.min(300,parseInt(i.length/5));for(const e of n){let n="other";for(const t of i){const i=t[e];if(null!=i){if("string"==typeof i){n="string";break}if("number"==typeof i&&!isNaN(i)){if(Number.isInteger(i)){n="integer";break}n="float";break}if("boolean"==typeof i){n="boolean";break}}}let r=0;const o=new Set;for(const t of i){const i=t[e];""!==i&&null!=i?o.add(i):r+=1}let c=!1;if(o.size<s&&o.size>0){c=[];for(const t of o)c.push({value:t})}const h=t+"---"+e;this.db.metaVariable.push({id:h,metaDataset_id:t,name:e,description:this.metaVariable[h]?.description,type:n,nb_missing:r,nb_distinct:o.size,nb_duplicate:i.length-o.size-r,values:c,values_preview:!!c&&c.slice(0,10)})}}}class V{constructor(){this.tables=[],this.tables_ids={},this.result={empty_id:[],duplicate_id:{},parent_id_not_found:{},parent_id_same:{},foreign_id_not_found:{}}}check(t){for(const i of t.__meta__)this.tables.push(i.name),this.tables_ids[i.name]=t[i.name].map((t=>t.id));for(const i of this.tables)this.yt(i),this.bt(i),this.wt(t,i),this.gt(t,i),this.jt(t,i);return this.result}yt(t){const i=this.tables_ids[t];(i.includes(null)||i.includes(""))&&this.result.empty_id.push(t)}bt(t){const i=this.tables_ids[t],n=new Set(i);let s=i.filter((t=>{if(!n.has(t))return t;n.delete(t)}));s=Array.from(new Set(s)),s.length>0&&(this.result.duplicate_id[t]=s)}wt(t,i){if(0===t[i].length)return;if(!Object.keys(t[i][0]).includes("parent_id"))return;const n=[];for(const s of t[i])s.id===s.parent_id&&n.push(s.id);n.length>0&&(this.result.parent_id_same[i]=n)}gt(t,i){if(0===t[i].length)return;if(!Object.keys(t[i][0]).includes("parent_id"))return;const n=[];for(const s of t[i])[null,""].includes(s.parent_id)||this.tables_ids[i].includes(s.parent_id)||n.push(s.parent_id);n.length>0&&(this.result.parent_id_not_found[i]=n)}jt(t,i){const n=[];for(const s in t[i][0])"parent_id"!==s&&s.endsWith("_id")&&this.tables.includes(s.slice(0,-3))&&n.push(s.slice(0,-3));const s={};for(const e of n){const n=e+"_id",r=[];for(const s of t[i])[null,""].includes(s[n])||this.tables_ids[e].includes(s[n])||r.push(s[n]);r.length>0&&(s[n]=r)}Object.keys(s).length>0&&(this.result.foreign_id_not_found[i]=s)}}class J{constructor(t){this.default_config={path:"db",db_key:!1,browser_key:!1,app_name:"jsonjsdb",use_cache:!1,use_encryption:!1},"string"==typeof t&&(t=this.kt(t)),t||(t={}),this.xt(t),this.browser=new H(this.config.browser_key,this.config.app_name,t.use_encryption),this.loader=new U(this.browser),this.integrity_checker=new V}kt(t="#jsonjsdb_config"){const i=document.querySelector(t);if(!i)return!1;const n={};return Object.keys(this.default_config).forEach((t=>{i.dataset[t]&&(n[t]=i.dataset[t])})),n}xt(t){this.config=this.default_config,Object.keys(this.config).forEach((i=>{void 0!==t[i]&&(this.config[i]=t[i])})),window?.location.protocol.startsWith("http")&&(this.config.use_cache=!1),this.config.db_key&&(this.config.path+="/"+this.config.db_key)}async init(t={}){return this.tables=await this.loader.load(this.config.path,this.config.use_cache,t),this}async load(t,i){t=this.config.path+"/"+t;return await this.loader.load_jsonjs(t,i)}get(t,i){try{const n=this.tables[t][this.tables.__index__[t].id[i]];return n||console.error(`table ${t}, id not found: ${i}`),n}catch(i){return void(this.tables[t]?this.tables.__index__[t]?"id"in this.tables.__index__[t]?console.error("error not handled"):console.error(`table ${t}, props "id" not found in __index__`):console.error(`table ${t} not found in __index__`):console.error(`table ${t} not found`))}}get_all(t,i,n={}){if(!(t in this.tables))return[];if(!i)return n.limit?this.tables[t].slice(0,n.limit):this.tables[t];let[s,e]=Object.entries(i)[0];"object"==typeof e&&(e=e.id);let r=s+"_id";s===t&&(r="parent_id");const o=this.tables.__index__[t][r];if(!o||!(e in o))return[];const c=o[e];if(!Array.isArray(c))return this.tables[t][c]?[this.tables[t][c]]:(console.error("get_all() table",t,"has an index undefined"),[]);const h=[];for(const i of c){if(n.limit&&h.length>n.limit)break;this.tables[t][i]?h.push(this.tables[t][i]):console.error("get_all() table",t,"has an index undefined")}return h}get_all_childs(t,i){if(!(t in this.tables))return[];let n=[];if(!i)return console.error("get_all_childs()",t,"id",i),n;const s=this.get_all(t,{[t]:i});n=n.concat(s);for(const e of s){if(i===e.id){const s="infinite loop for id";return console.error("get_all_childs()",t,s,i),n}const s=this.get_all_childs(t,e.id);n=n.concat(s)}return n}foreach(t,i){const n=this.get_all(t);for(const t of n)i(t)}table_has_id(t,i){return!!this.tables[t]&&(!!this.tables.__index__[t]&&(!!this.tables.__index__[t].id&&i in this.tables.__index__[t].id))}get_config(t){if(!("config"in this.tables))return;const i=this.tables.__index__.config.id;if(!i)return;if(!(t in i))return;return this.tables.config[i[t]].value}has_nb(t,i,n){if(!(n in this.tables.__index__))return 0;const s=this.tables.__index__[n][t+"_id"];return s&&i in s?Array.isArray(s[i])?s[i].length:1:0}get_parents(t,i){if(!i||null===i)return[];let n=this.get(t,i);const s=[];let e=0;for(;e<30;){if(e+=1,[0,"",null].includes(n.parent_id))return s.reverse();const i=n;if(n=this.get(t,n.parent_id),!n)return console.error("get_parents() type",t,"cannot find id",i.parent_id),[];s.push(n)}return console.error("get_parents()",t,i,"iteration_max reached"),[]}add_meta(t){this.loader.add_meta(t)}async check_integrity(){return await this.loader.load_tables(this.config.path,!1),this.db=this.loader.db,this.integrity_checker.check(this.db)}}export{J as default};
