const status=document.getElementById('social-status');
const socialData=JSON.parse(document.getElementById('social-data').textContent);
const preparedImages=new Map();
async function prepareImage(source){
 const response=await fetch(source);if(!response.ok)throw Error('Imagen no disponible');
 const objectUrl=URL.createObjectURL(await response.blob());
 try{const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=objectUrl;});const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;canvas.getContext('2d').drawImage(image,0,0);const png=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!png)throw Error('Imagen no disponible');return new File([png],'inavarro-'+source.replace('.svg','.png'),{type:'image/png'});}finally{URL.revokeObjectURL(objectUrl);}
}
document.addEventListener('click',async e=>{
 const linkButton=e.target.closest('[data-copy-link]');
 if(linkButton){
  try{await navigator.clipboard.writeText(socialData.url);status.textContent='Enlace copiado. Pégalo en el mensaje, en un estado de texto de WhatsApp o en el sticker Enlace de Instagram.';}
  catch{let area=document.getElementById('share-link-fallback');if(!area){area=document.createElement('textarea');area.id='share-link-fallback';area.setAttribute('aria-label','Enlace de la noticia');status.after(area);}area.value=socialData.url;area.focus();area.select();status.textContent='Selecciona Copiar para copiar el enlace de la noticia.';}return;
 }
 const instagram=e.target.closest('[data-instagram]');const native=e.target.closest('[data-native]');
 if(instagram){const guide=document.getElementById('instagram-guide');guide.hidden=!guide.hidden;if(!guide.hidden)guide.scrollIntoView({block:'nearest',behavior:'smooth'});return;}
 if(native){
  // Share the URL, never an image-only payload: receiving readers need a clickable destination.
  if(!navigator.share){document.querySelector('[data-copy-link]').click();return;}
  try{await navigator.share({title:socialData.title,text:'iNavarro Abogados',url:socialData.url});status.textContent='Enlace enviado al menú de compartir. Comprueba que aparece en el mensaje antes de publicarlo.';}
  catch(error){if(error.name==='AbortError')status.textContent='Compartir cancelado.';else{status.textContent='Usa Copiar enlace para pegar la dirección en tu publicación.';}}return;
 }
 const copy=e.target.closest('[data-copy]');
 if(copy){const area=document.getElementById(copy.dataset.copy);try{await navigator.clipboard.writeText(area.value);status.textContent='Texto copiado. Ya puedes pegarlo en tu red social.';}catch{area.focus();area.select();status.textContent='Seleccionado. Usa Copiar en el menú de tu dispositivo.';}return;}
 const button=e.target.closest('[data-png]');if(!button)return;
 button.disabled=true;status.textContent='Preparando imagen…';
 let objectUrl;
 try{const response=await fetch(button.dataset.png);if(!response.ok)throw Error('Imagen no disponible');const blob=await response.blob();objectUrl=URL.createObjectURL(blob);const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=objectUrl;});const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;canvas.getContext('2d').drawImage(image,0,0);const png=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!png)throw Error('Conversión no disponible');const downloadUrl=URL.createObjectURL(png);const a=document.createElement('a');a.href=downloadUrl;a.download='inavarro-'+location.pathname.split('/').filter(Boolean).at(-1)+'-'+button.dataset.png.replace('.svg','.png');a.click();setTimeout(()=>URL.revokeObjectURL(downloadUrl),60000);status.textContent='Imagen preparada. Guárdala en Fotos o Archivos para subirla a tus redes.';}catch{status.textContent='No se pudo descargar la imagen. Abre la tarjeta y guárdala desde tu navegador.';}finally{if(objectUrl)URL.revokeObjectURL(objectUrl);button.disabled=false;}
});
