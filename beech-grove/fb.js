/* Firebase adapter: gives the review page the same small API it uses on Claude (use("db"|"user"|"assets")). */
(function(){
  const q=new URLSearchParams(location.search);
  const board=(q.get("b")||"").replace(/[^A-Za-z0-9_-]/g,"");
  let key=q.get("s");try{if(key)localStorage.setItem("rv-s-"+board,key);else key=localStorage.getItem("rv-s-"+board)}catch{}
  firebase.initializeApp(window.FB_CONFIG);
  const fs=firebase.firestore();
  const ready=firebase.auth().signInAnonymously().then(c=>c.user);
  async function sha(t){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
  const owner=key?sha(key).then(h=>h===window.STUDIO_HASH):Promise.resolve(false);
  const coll=n=>fs.collection("boards").doc(board).collection(n);
  const db={collection(n){const c=coll(n);return{
    doc(id){const r=id?c.doc(id):c.doc();return{set:d=>ready.then(u=>r.set({...d,by:u.uid})),update:d=>ready.then(()=>r.update(d)),delete:()=>ready.then(()=>r.delete())}},
    onSnapshot(ok,err){ready.then(()=>c.onSnapshot(s=>ok({docs:s.docs.map(d=>({id:d.id,data:()=>d.data()}))}),err),err);return()=>{}}}}};
  const user={isOwner:()=>owner,id:()=>ready.then(u=>u.uid),can:async()=>true,canEdit:()=>owner};
  function shrink(file,max,qual){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height));const cv=document.createElement("canvas");cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);URL.revokeObjectURL(im.src);res(cv.toDataURL("image/jpeg",qual))};im.onerror=rej;im.src=URL.createObjectURL(file)})}
  const assets={async upload(f){
    if(!/^image\//.test(f.type)){const e=new Error("only images");e.code="too_large";throw e}
    let d=await shrink(f,1400,.8);if(d.length>300000)d=await shrink(f,1000,.7);if(d.length>300000)d=await shrink(f,800,.6);
    return{id:Math.random().toString(36).slice(2,12),contentType:"image/jpeg",data:d}}};
  window.FBX={use:async n=>{if(!board)return null;if(n==="db")return db;if(n==="user")return user;if(n==="assets")return assets;return null}};
})();
