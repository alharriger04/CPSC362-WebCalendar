function toInputDateTime(value) {
    if (!value) {
        return "";
    }

    return value.replace(" ", "T").slice(0, 16);
}

function toApiDateTime(value) {
    if (!value) {
        return "";
    }

    return `${value}:00`;
}

document.addEventListener("DOMContentLoaded", () => {
    const userId = window.currentUserId;
    const viewSelect = document.getElementById("viewSelect");
    const referenceDate = document.getElementById("referenceDate");
    const loadEventsBtn = document.getElementById("loadEventsBtn");
    const eventList = document.getElementById("eventList");
    const eventForm = document.getElementById("eventForm");
    const eventIdInput = document.getElementById("eventId");
    const titleInput = document.getElementById("title");
    const descriptionInput = document.getElementById("description");
    const locationInput = document.getElementById("location");
    const startInput = document.getElementById("startDatetime");
    const endInput = document.getElementById("endDatetime");
    const formTitle = document.getElementById("formTitle");
    const cancelEditBtn = document.getElementById("cancelEditBtn");

    referenceDate.value = new Date().toISOString().slice(0, 10);
    cancelEditBtn.style.display = "none";

    function resetForm() {
        eventIdInput.value = "";
        eventForm.reset();
        formTitle.textContent = "Create Event";
        cancelEditBtn.style.display = "none";
    }

    function fillForm(event) {
        eventIdInput.value = event.id;
        titleInput.value = event.title || "";
        descriptionInput.value = event.description || "";
        locationInput.value = event.location || "";
        startInput.value = toInputDateTime(event.start_datetime);
        endInput.value = toInputDateTime(event.end_datetime);
        formTitle.textContent = "Edit Event";
        cancelEditBtn.style.display = "inline-block";
    }

    async function loadEvents() {
        const params = new URLSearchParams({
            view: viewSelect.value,
            date: referenceDate.value
        });

        const response = await fetch(`/events/user/${userId}?${params.toString()}`);
        const data = await response.json();

        eventList.innerHTML = "";

        if (!response.ok) {
            eventList.innerHTML = `<li class="event-item event-error">${data.error || "Failed to load events."}</li>`;
            return;
        }

        if (data.length === 0) {
            eventList.innerHTML = '<li class="event-item event-empty">No events found for this range.</li>';
            return;
        }

        data.forEach((event) => {
            const li = document.createElement("li");
            li.className = "event-item";
            li.innerHTML = `
                <div>
                    <h3>${event.title}</h3>
                    <p>${event.start_datetime} to ${event.end_datetime}</p>
                    <p>${event.location || "No location"} | ${event.description || "No description"}</p>
                </div>
                <div class="event-actions">
                    <button class="btn btn-small edit-btn" data-id="${event.id}">Edit</button>
                    <button class="btn btn-small btn-danger delete-btn" data-id="${event.id}">Delete</button>
                </div>
            `;

            li.querySelector(".edit-btn").addEventListener("click", () => fillForm(event));
            li.querySelector(".delete-btn").addEventListener("click", async () => {
                if (!window.confirm("Delete this event?")) {
                    return;
                }

                const deleteResponse = await fetch(`/events/${event.id}`, { method: "DELETE" });
                const deleteData = await deleteResponse.json();

                if (!deleteResponse.ok) {
                    window.alert(deleteData.error || "Failed to delete event.");
                    return;
                }

                await loadEvents();
            });

            eventList.appendChild(li);
        });
    }

    eventForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const payload = {
            title: titleInput.value.trim(),
            description: descriptionInput.value.trim(),
            location: locationInput.value.trim(),
            start_datetime: toApiDateTime(startInput.value),
            end_datetime: toApiDateTime(endInput.value)
        };

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
        await loadEvents();
    });

    cancelEditBtn.addEventListener("click", resetForm);
    loadEventsBtn.addEventListener("click", loadEvents);
    viewSelect.addEventListener("change", loadEvents);

    loadEvents();
});
