document.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll(".nav-links a");

    links.forEach((link) => {
        const target = new URL(link.href, window.location.origin);
        if (target.pathname === currentPath) {
            link.style.color = "#122235";
            link.style.fontWeight = "700";
        }
    });
});