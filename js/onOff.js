/**
 * Courtesy of https://ponyfoo.com/articles/backgroundsync
 */
function isOnline() {
    var connectionStatus = document.getElementById('connectionStatus');
    if (navigator.onLine) {
        connectionStatus.innerHTML = 'Online';
        connectionStatus.style = "color:green; font-weight:bolder;"; 
    } else {
        connectionStatus.innerHTML = 'Offline';
        connectionStatus.style = "color:red; font-weight:bolder;";
    }
}
window.addEventListener('online', isOnline);
window.addEventListener('offline', isOnline);
isOnline();