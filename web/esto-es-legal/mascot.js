/** Standalone, dependency-free web component. Only first-party generated assets are loaded. */
const NAMES={'don-lex':'Don Lex',trampin:'Trampín',lexi:'Lexi',brinco:'Brinco',lumina:'Lúmina',aura:'Aura',elion:'Elion'};
const EXPRESSIONS={alegria:'alegría',duda:'duda',sorpresa:'sorpresa',celebracion:'celebración',desacuerdo:'desacuerdo',victoria:'victoria'};
const root=new URL('./',import.meta.url);const active=new Set();const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
function visibility(){for(const mascot of active)mascot.updateMotion()}
document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',visibility);
export class LegalMascot extends HTMLElement{
 static observedAttributes=['character','expression','label','size','decorative'];
 constructor(){super();this.attachShadow({mode:'open'});this.visible=true;this.shadowRoot.innerHTML=`<link rel="stylesheet"><div class="frame"><div class="sprite"><img alt="" aria-hidden="true" width="320" height="320" decoding="async" loading="lazy"></div></div>`;this.shadowRoot.querySelector('link').href=new URL('mascot.css',root).href;this.sprite=this.shadowRoot.querySelector('.sprite');this.img=this.shadowRoot.querySelector('img');this.sprite.addEventListener('animationend',()=>this.sprite.classList.remove('moving'));this.observer=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;this.updateMotion()},{threshold:.05});}
 connectedCallback(){active.add(this);this.observer.observe(this);this.render()}
 disconnectedCallback(){active.delete(this);this.observer.disconnect()}
 attributeChangedCallback(){if(this.isConnected)this.render()}
 render(){const character=this.getAttribute('character')||'don-lex',expression=this.getAttribute('expression')||'alegria';if(!NAMES[character]||!EXPRESSIONS[expression]){this.img.removeAttribute('src');this.setAttribute('aria-label','Personaje no disponible');this.setAttribute('role','img');return}const size=Number(this.getAttribute('size')||240);this.style.setProperty('--mascot-size',`${Number.isFinite(size)?Math.max(40,Math.min(640,size)):240}px`);this.img.src=new URL(`svg/${character}/${expression}.svg`,root).href;this.sprite.dataset.expression=expression;this.sprite.classList.remove('moving');if(this.hasAttribute('decorative')){this.setAttribute('aria-hidden','true');this.removeAttribute('role');this.removeAttribute('aria-label')}else{this.removeAttribute('aria-hidden');this.setAttribute('role','img');this.setAttribute('aria-label',this.getAttribute('label')||`${NAMES[character]}, ${EXPRESSIONS[expression]}`)}}
 updateMotion(){if(reduced.matches||document.hidden){this.sprite.classList.remove('moving');return}this.sprite.style.animationPlayState=this.visible?'running':'paused'}
 async play(expression=this.getAttribute('expression')||'alegria'){if(!EXPRESSIONS[expression])return false;const sequence=this.sequence=(this.sequence||0)+1;this.setAttribute('expression',expression);if(reduced.matches||document.hidden||!this.visible)return false;try{await this.img.decode()}catch{return false}if(sequence!==this.sequence||reduced.matches||document.hidden||!this.visible)return false;this.sprite.classList.remove('moving');void this.sprite.offsetWidth;this.sprite.classList.add('moving');this.updateMotion();return true}
}
if(!customElements.get('legal-mascot'))customElements.define('legal-mascot',LegalMascot);
