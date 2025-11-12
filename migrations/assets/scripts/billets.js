// billets redirect helper (for /pages/billets.html)
function redirectBillets(target){
  
    if(location.pathname.endsWith('/pages/billets.html') || location.pathname.endsWith('/billets.html')){
    window.location.replace(target);
  }
  
}
// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async ()=>{
  
    // if this is billets page, redirect to the secure site
  redirectBillets('https://secure3.xpayrience.com/arena_regional_lareau');

});