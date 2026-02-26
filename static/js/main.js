// script.js

// Opens CSUF calendar in new tab
function contactUs() {
}

// Placeholder for posting event
function postEvent() {
    alert("Event posting feature coming soon!\n\nYou will be able to submit campus events here.");
}

// Optional: Page loaded confirmation
document.addEventListener("DOMContentLoaded", function() {
    console.log("HHH Web Calendar loaded successfully.");

    // Example future enhancement
    const header = document.querySelector("header");
    
    header.addEventListener("mouseenter", function() {
        header.style.backgroundColor = "#00274C";
    });

    header.addEventListener("mouseleave", function() {
        header.style.backgroundColor = "#111";
    });
});

  <script src="script.js"></script>
</body>
</html>/* This file runs everything associated with navbar actions,
global listeners, shared utilities, and fetching helper functions */
