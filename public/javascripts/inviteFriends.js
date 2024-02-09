// JavaScript
document.getElementById("whatsappShare").addEventListener("click", function () {
    const url = window.location.href; // Get the current page URL
    const message = "Check out this awesome website!"; // Your invitation message
    const shareText = encodeURIComponent(`${message}\n${url}`); // Encode message and URL

    // Open WhatsApp with the shareable message
    window.open(`whatsapp://send?text=${shareText}`);
});
