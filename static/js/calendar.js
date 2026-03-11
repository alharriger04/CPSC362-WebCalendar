/* This file controls calendar behavior, loading events from background,
rendering the grid, changing month/week, and clicking days to open their modal */

// initialize calendar when page loads
document.addEventListener("DOMContentLoaded", function () {
    console.log("Calendar initialized");
});

// store today's date for calendar highlighting
const today = new Date();


// helper function to get current month
function getCurrentMonth() {
    return today.getMonth();
}

// helper function to get current year
function getCurrentYear() {
    return today.getFullYear();
}



// helper function to get today's date
function getTodayDate() {
    return today.getDate();
}
