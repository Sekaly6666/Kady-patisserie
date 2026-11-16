/* DOUCEUR DE KATY — commandes préparées et envoyées par WhatsApp. */

const products = [
  {id:1,slug:"cupcake-vanille",name:"Cupcake Vanille",category:"Individuels",price:1000,description:"Un cupcake moelleux à la vanille, tout simplement irrésistible.",tag:"DOUCEUR DU JOUR",image:"https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=800&q=85"},
  {id:2,slug:"gateau-au-chocolat",name:"Gâteau au chocolat",category:"Gâteaux",price:5000,description:"Un gâteau généreux et fondant pour les amoureux du chocolat.",tag:"GOURMAND",image:"https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=85"},
  {id:3,slug:"tarte-aux-fraises",name:"Tarte aux fraises",category:"Gâteaux",price:3000,description:"Une tarte fruitée et délicate, parfaite pour une pause fraîcheur.",tag:"FRUITÉ",image:"https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=85"}
];

let cart = JSON.parse(localStorage.getItem("douceurKatyCart") || "[]");
let activeFilter = "Tous";
let searchTerm = "";

const $ = (selector) => document.querySelector(selector);
const formatPrice = (amount) => `${amount.toLocaleString("fr-FR")} FCFA`;

function renderProducts(){
  const filtered = products.filter(product =>
    (activeFilter === "Tous" || product.category === activeFilter) &&
    `${product.name} ${product.description}`.toLowerCase().includes(searchTerm)
  );
  $("#productGrid").innerHTML = filtered.length ? filtered.map((product,index)=>`
    <article class="product-card" style="animation-delay:${index*80}ms">
      <div class="product-image"><img src="${product.image}" alt="${product.name}" loading="lazy"><span class="product-tag">${product.tag}</span></div>
      <div class="product-info"><h3>${product.name}</h3><p>${product.description}</p>
        <div class="product-bottom"><span class="product-price">${formatPrice(product.price)}</span><button class="add-button" data-add="${product.id}" aria-label="Ajouter ${product.name} au panier"><svg class="icon" aria-hidden="true"><use href="#icon-plus"></use></svg></button></div>
      </div>
    </article>`).join("") : `<p class="no-results">Aucune douceur ne correspond à votre recherche.</p>`;
}

function saveCart(){ localStorage.setItem("douceurKatyCart",JSON.stringify(cart)); renderCart(); }
function addToCart(id){
  const item=cart.find(entry=>entry.id===id);
  if(item)item.quantity++; else cart.push({id,quantity:1});
  saveCart(); showToast("Une douceur a été ajoutée à votre panier.");
}
function changeQuantity(id,delta){
  const item=cart.find(entry=>entry.id===id); if(!item)return;
  item.quantity+=delta; if(item.quantity<=0)cart=cart.filter(entry=>entry.id!==id);
  saveCart();
}
function renderCart(){
  const count=cart.reduce((sum,item)=>sum+item.quantity,0);
  const total=cart.reduce((sum,item)=>{const product=products.find(p=>p.id===item.id);return sum+(product?product.price*item.quantity:0)},0);
  $("#cartCount").textContent=count; $("#drawerCount").textContent=`(${count})`; $("#cartTotal").textContent=formatPrice(total);
  $("#checkoutButton").disabled=count===0;
  $("#cartItems").innerHTML=count===0?`<div class="empty-cart"><svg class="icon icon-heart" aria-hidden="true"><use href="#icon-heart"></use></svg><b>Votre panier est encore vide</b><p>Ajoutez une petite douceur pour commencer.</p></div>`:cart.map(item=>{
    const p=products.find(product=>product.id===item.id); if(!p)return "";
    return `<div class="cart-row"><img src="${p.image}" alt=""><div><h4>${p.name}</h4><small>${formatPrice(p.price)}</small><div class="qty-control"><button data-qty="${p.id}" data-delta="-1" aria-label="Retirer une unité"><svg class="icon" aria-hidden="true"><use href="#icon-minus"></use></svg></button><span>${item.quantity}</span><button data-qty="${p.id}" data-delta="1" aria-label="Ajouter une unité"><svg class="icon" aria-hidden="true"><use href="#icon-plus"></use></svg></button></div></div><button class="remove-item" data-remove="${p.id}" aria-label="Supprimer ${p.name}"><svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg></button></div>`;
  }).join("");
}
function openCart(){ $("#cartDrawer").classList.add("open");$("#cartOverlay").classList.add("show");$("#cartDrawer").setAttribute("aria-hidden","false");document.body.style.overflow="hidden"; }
function closeCart(){ $("#cartDrawer").classList.remove("open");$("#cartOverlay").classList.remove("show");$("#cartDrawer").setAttribute("aria-hidden","true");document.body.style.overflow=""; }
function showToast(message){const toast=$("#toast");toast.textContent=message;toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),2400);}
function openCheckout(){
  if(!cart.length)return;
  closeCart();$("#checkoutModal").classList.add("open");$("#checkoutModal").setAttribute("aria-hidden","false");document.body.style.overflow="hidden";
}
function closeCheckout(){ $("#checkoutModal").classList.remove("open");$("#checkoutModal").setAttribute("aria-hidden","true");document.body.style.overflow=""; }
const WHATSAPP_NUMBER = "2250595509350"; // +225 05 95 50 93 50

function getProductPreviewUrl(product){
  const origin = (typeof window !== "undefined" && window.location.origin && window.location.origin.startsWith("http") && !window.location.origin.includes("localhost") && !window.location.origin.includes("127.0.0.1"))
    ? window.location.origin
    : "https://kady-patisserie.vercel.app";
  return `${origin}/produits/${product.slug}.html`;
}

function buildOrderMessage(formData){
  const selectedItems = cart.map(item => {
    const p = products.find(product => product.id === item.id);
    if (!p) return "";
    const subtotal = p.price * item.quantity;
    return [
      `• ${p.name}`,
      `  Description : ${p.description}`,
      `  Quantité : ${item.quantity}`,
      `  Prix unitaire : ${formatPrice(p.price)}`,
      `  Sous-total : ${formatPrice(subtotal)}`,
      `  Photo du gâteau : ${getProductPreviewUrl(p)}`
    ].join("\n");
  }).filter(Boolean);
  const total = cart.reduce((sum,item)=>{
    const product=products.find(p=>p.id===item.id);
    return sum + (product ? product.price * item.quantity : 0);
  },0);
  const name = (formData.get("name") || "").trim();
  const phone = (formData.get("phone") || "").trim();
  const fulfillment = formData.get("fulfillment") || "Non précisé";
  const details = (formData.get("details") || "").trim();
  return [
    "Bonjour Katy,",
    "Je souhaite passer une commande chez Douceur de Katy.",
    "",
    "MA SÉLECTION",
    ...selectedItems,
    "",
    `TOTAL : ${formatPrice(total)}`,
    "",
    "INFORMATIONS DU CLIENT",
    `Nom et prénom : ${name}`,
    `Téléphone : ${phone}`,
    `Mode de réception : ${fulfillment}`,
    `Adresse / précision : ${details || (fulfillment === "Livraison" ? "À préciser" : "Retrait sur place")}`,
    "",
    "Merci de me confirmer la disponibilité et les modalités."
  ].join("\n");
}

$("#productGrid").addEventListener("click",e=>{const button=e.target.closest("[data-add]");if(button)addToCart(Number(button.dataset.add));});
$("#filters").addEventListener("click",e=>{const button=e.target.closest("[data-filter]");if(!button)return;activeFilter=button.dataset.filter;document.querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",b===button));renderProducts();});
$("#productSearch").addEventListener("input",e=>{searchTerm=e.target.value.trim().toLowerCase();renderProducts();});
$("#cartItems").addEventListener("click",e=>{
  const qty=e.target.closest("[data-qty]");const remove=e.target.closest("[data-remove]");
  if(qty)changeQuantity(Number(qty.dataset.qty),Number(qty.dataset.delta));
  if(remove){cart=cart.filter(item=>item.id!==Number(remove.dataset.remove));saveCart();}
});
$("#openCart").addEventListener("click",openCart);$("#closeCart").addEventListener("click",closeCart);$("#cartOverlay").addEventListener("click",closeCart);
$("#checkoutButton").addEventListener("click",openCheckout);$("#closeModal").addEventListener("click",closeCheckout);$("#modalBackdrop").addEventListener("click",closeCheckout);
$("#checkoutForm").addEventListener("submit",e=>{
  e.preventDefault();
  if(!cart.length){showToast("Votre panier est vide.");return;}
  const form=e.currentTarget;
  const message=buildOrderMessage(new FormData(form));
  const whatsappUrl=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  const whatsappWindow=window.open(whatsappUrl,"_blank");
  if(!whatsappWindow){window.location.href=whatsappUrl;return;}
  closeCheckout();
  showToast("Ouverture de WhatsApp avec votre commande...");
});

function updateAddressRequirement(){
  const delivery=$("#fulfillment").value === "Livraison";
  const details=$("#customerDetails");
  details.required=delivery;
  details.placeholder=delivery ? "Commune, quartier, rue et repère" : "Une précision utile (facultatif)";
  $("#detailsLabel").firstChild.textContent=delivery ? "Adresse de livraison " : "Précision pour le retrait ";
  $("#detailsLabel .field-note").textContent=delivery ? "(obligatoire pour la livraison)" : "(facultatif)";
}
$("#fulfillment").addEventListener("change",updateAddressRequirement);
updateAddressRequirement();
$("#menuToggle").addEventListener("click",()=>{const open=$("#mainNav").classList.toggle("open");$("#menuToggle").setAttribute("aria-expanded",String(open));});
document.querySelectorAll("#mainNav a").forEach(a=>a.addEventListener("click",()=>{$("#mainNav").classList.remove("open");$("#menuToggle").setAttribute("aria-expanded","false");}));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeCart();closeCheckout();}});
$("#year").textContent=new Date().getFullYear();

if("IntersectionObserver" in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target);}}),{threshold:.12});
  document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));
}else{document.querySelectorAll(".reveal").forEach(el=>el.classList.add("visible"));}
renderProducts();renderCart();

// Tenter de lancer la musique dès l'ouverture de la page.
const siteMusic=$("#siteMusic");
const musicToggle=$("#musicToggle");
if(siteMusic && musicToggle){
  siteMusic.volume=0.22;
  const syncMusicButton=()=>{
    const playing=!siteMusic.paused;
    musicToggle.setAttribute("aria-pressed",String(playing));
    musicToggle.setAttribute("aria-label",playing?"Mettre la musique en pause":"Activer la musique du site");
    $("#musicLabel").textContent=playing?"Mettre en pause":"Écouter la musique";
  };
  siteMusic.addEventListener("play",syncMusicButton);
  siteMusic.addEventListener("pause",syncMusicButton);
  const startMusic=()=>siteMusic.play().catch(()=>{
    // Si le navigateur bloque la lecture automatique, réessayer après une interaction.
    const resumeMusic=()=>siteMusic.play().catch(()=>{});
    document.addEventListener("pointerdown",resumeMusic,{once:true});
    document.addEventListener("keydown",resumeMusic,{once:true});
  });
  startMusic();
  musicToggle.addEventListener("click",async()=>{
    if(siteMusic.paused){
      try{await siteMusic.play();}
      catch(error){showToast("La musique n’a pas pu démarrer. Réessayez.");}
    }else{
      siteMusic.pause();
    }
  });
}
