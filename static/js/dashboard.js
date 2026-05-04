function dateKeyFromValue(value) {
    return value.slice(0, 10);
}

function splitDateTime(value) {
    if (!value) {
        return { date: "", time: "" };
    }
    const normalized = value.replace("T", " ");
    return {
        date: normalized.slice(0, 10),
        time: normalized.slice(11, 16)
    };
}

function toApiDateTime(dateValue, timeValue) {
    if (!dateValue || !timeValue) {
        return null;
    }

    const rawTime = timeValue.trim();
    const timeOnlyPattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (timeOnlyPattern.test(rawTime)) {
        return `${dateValue} ${rawTime}:00`;
    }

    return null;
}

function prettyDateTime(value) {
    const dt = new Date(value.replace(" ", "T"));
    return dt.toLocaleString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const userId = window.currentUserId;
    const upcomingList = document.getElementById("upcomingEventsList");
    const eventForm = document.getElementById("eventForm");
    const eventIdInput = document.getElementById("eventId");
    const titleInput = document.getElementById("title");
    const descriptionInput = document.getElementById("description");
    const locationInput = document.getElementById("location");
    const startDateInput = document.getElementById("startDate");
    const startTimeInput = document.getElementById("startTime");
    const endDateInput = document.getElementById("endDate");
    const endTimeInput = document.getElementById("endTime");
    const formTitle = document.getElementById("formTitle");
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    const deleteEventBtn = document.getElementById("deleteEventBtn");
    const miniTitleEl = document.getElementById("miniCalendarTitle");
    const miniGridEl = document.getElementById("miniCalendarGrid");
    const selectedDateLabel = document.getElementById("selectedDateLabel");
    const selectedDateEvents = document.getElementById("selectedDateEvents");
    const prevMonthBtn = document.getElementById("prevMonthBtn");
    const nextMonthBtn = document.getElementById("nextMonthBtn");

    const state = {
        currentMonthDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        monthEvents: [],
        selectedDate: null
    };

    state.selectedDate = new Date().toISOString().slice(0, 10);
    cancelEditBtn.style.display = "none";
    deleteEventBtn.style.display = "none";

    function resetForm() {
        eventIdInput.value = "";
        eventForm.reset();
        startDateInput.value = state.selectedDate;
        endDateInput.value = state.selectedDate;
        formTitle.textContent = "Create Event";
        cancelEditBtn.style.display = "none";
        deleteEventBtn.style.display = "none";
    }

    function fillForm(event) {
        eventIdInput.value = event.id;
        titleInput.value = event.title || "";
        descriptionInput.value = event.description || "";
        locationInput.value = event.location || "";
        const startParts = splitDateTime(event.start_datetime);
        const endParts = splitDateTime(event.end_datetime);
        startDateInput.value = startParts.date;
        startTimeInput.value = startParts.time;
        endDateInput.value = endParts.date;
        endTimeInput.value = endParts.time;
        formTitle.textContent = "Edit Event";
        cancelEditBtn.style.display = "inline-block";
        deleteEventBtn.style.display = "inline-block";
    }

    async function loadUpcoming() {
        const response = await fetch("/events/upcoming?limit=6");
        const data = await response.json();
        upcomingList.innerHTML = "";

        if (!response.ok) {
            upcomingList.innerHTML = `<li class="upcoming-item error">${data.error || "Could not load upcoming events."}</li>`;
            return;
        }

        if (data.length === 0) {
            upcomingList.innerHTML = '<li class="upcoming-item empty">No upcoming events.</li>';
            return;
        }

        data.forEach((event) => {
            const li = document.createElement("li");
            li.className = "upcoming-item";
            li.innerHTML = `
                <h3>${event.title}</h3>
                <p>${prettyDateTime(event.start_datetime)} - ${prettyDateTime(event.end_datetime)}</p>
                <p>${event.location || "No location"}</p>
            `;
            upcomingList.appendChild(li);
        });
    }

    async function loadMonthEvents() {
        const dateStr = state.currentMonthDate.toISOString().slice(0, 10);
        const params = new URLSearchParams({ view: "month", date: dateStr });
        const response = await fetch(`/events/user/${userId}?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
            state.monthEvents = [];
            miniGridEl.innerHTML = `<div class="mini-day error">${data.error || "Failed to load month events."}</div>`;
            return;
        }

        state.monthEvents = data;
        renderMiniCalendar();
        renderSelectedDaySummary();
    }

    function renderMiniCalendar() {
        const year = state.currentMonthDate.getFullYear();
        const month = state.currentMonthDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const firstVisibleDay = new Date(firstDayOfMonth);
        firstVisibleDay.setDate(firstVisibleDay.getDate() - firstVisibleDay.getDay());
        const todayStr = new Date().toISOString().slice(0, 10);
        const eventsByDay = {};

        state.monthEvents.forEach((event) => {
            const key = dateKeyFromValue(event.start_datetime);
            if (!eventsByDay[key]) {
                eventsByDay[key] = [];
            }
            eventsByDay[key].push(event);
        });

        miniTitleEl.textContent = state.currentMonthDate.toLocaleString([], { month: "long", year: "numeric" });
        miniGridEl.innerHTML = "";

        for (let i = 0; i < 42; i += 1) {
            const date = new Date(firstVisibleDay);
            date.setDate(firstVisibleDay.getDate() + i);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            const dayEvents = eventsByDay[dateStr] || [];
            const count = dayEvents.length;
            const cell = document.createElement("button");
            const classes = ["mini-day", "mini-day-button"];
            if (date.getMonth() !== month) {
                classes.push("outside-month");
            }
            if (dateStr === todayStr) {
                classes.push("today");
            }
            if (count > 0) {
                classes.push("has-events");
            }
            if (state.selectedDate === dateStr) {
                classes.push("selected");
            }

            cell.className = classes.join(" ");
            cell.type = "button";
            const eventPreview = dayEvents
                .slice(0, 2)
                .map((event) => `<span class="day-event-chip">${event.title}</span>`)
                .join("");
            const overflowText = count > 2 ? `<span class="event-overflow">+${count - 2} more</span>` : "";

            cell.innerHTML = `
                <span class="day-number">${date.getDate()}</span>
                <span class="event-count">${count > 0 ? `${count} event${count > 1 ? "s" : ""}` : ""}</span>
                <span class="day-event-preview">${eventPreview}${overflowText}</span>
            `;

            cell.addEventListener("click", async () => {
                state.selectedDate = dateStr;
                renderMiniCalendar();
                renderSelectedDaySummary();
            });

            miniGridEl.appendChild(cell);
        }
    }

    function renderSelectedDaySummary() {
        const selected = state.selectedDate;
        const selectedDate = new Date(`${selected}T00:00:00`);
        selectedDateLabel.textContent = selectedDate.toLocaleDateString([], {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });

        const dayEvents = state.monthEvents
            .filter((event) => dateKeyFromValue(event.start_datetime) === selected)
            .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));

        selectedDateEvents.innerHTML = "";

        if (dayEvents.length === 0) {
            selectedDateEvents.innerHTML = '<li class="selected-day-empty">No events on this date.</li>';
            return;
        }

        dayEvents.forEach((event) => {
            const li = document.createElement("li");
            li.className = "selected-day-item";
            li.innerHTML = `
                <button class="selected-day-edit" type="button">
                    <strong>${event.title}</strong>
                    <span>${prettyDateTime(event.start_datetime)}</span>
                </button>
            `;
            li.querySelector(".selected-day-edit").addEventListener("click", () => fillForm(event));
            selectedDateEvents.appendChild(li);
        });
    }

    async function refreshAll() {
        await Promise.all([loadUpcoming(), loadMonthEvents()]);
    }

    eventForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const payload = {
            title: titleInput.value.trim(),
            description: descriptionInput.value.trim(),
            location: locationInput.value.trim(),
            start_datetime: toApiDateTime(startDateInput.value, startTimeInput.value),
            end_datetime: toApiDateTime(endDateInput.value, endTimeInput.value)
        };

        if (!payload.start_datetime || !payload.end_datetime) {
            window.alert("Enter times in HH:MM format.");
            return;
        }

        const eventId = eventIdInput.value;
        const endpoint = eventId ? `/events/${eventId}` : "/events/create";
        const method = eventId ? "PUT" : "POST";
        const response = await fetch(endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (!response.ok) {
            window.alert(data.error || "Failed to save event.");
            return;
        }

        resetForm();
        await refreshAll();
    });

    cancelEditBtn.addEventListener("click", resetForm);
    deleteEventBtn.addEventListener("click", async () => {
        const eventId = eventIdInput.value;
        if (!eventId) {
            return;
        }
        if (!window.confirm("Delete this event?")) {
            return;
        }

        const response = await fetch(`/events/${eventId}`, { method: "DELETE" });
        const data = await response.json();
        if (!response.ok) {
            window.alert(data.error || "Failed to delete event.");
            return;
        }

        resetForm();
        await refreshAll();
    });

    prevMonthBtn.addEventListener("click", async () => {
        state.currentMonthDate = new Date(
            state.currentMonthDate.getFullYear(),
            state.currentMonthDate.getMonth() - 1,
            1
        );
        await loadMonthEvents();
    });

    nextMonthBtn.addEventListener("click", async () => {
        state.currentMonthDate = new Date(
            state.currentMonthDate.getFullYear(),
            state.currentMonthDate.getMonth() + 1,
            1
        );
        await loadMonthEvents();
    });

    resetForm();
    refreshAll();
});
