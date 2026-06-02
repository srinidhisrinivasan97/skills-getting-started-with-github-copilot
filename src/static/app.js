document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear activity select options (keep placeholder option)
      Array.from(activitySelect.options)
        .filter((opt) => opt.value !== "")
        .forEach((opt) => opt.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section (bulleted list)
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        if (details.participants && details.participants.length > 0) {
          const label = document.createElement("strong");
          label.textContent = "Participants:";
          participantsDiv.appendChild(label);

          const ul = document.createElement("ul");
          ul.className = "participants-list";

          details.participants.forEach((participant) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = participant;

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "participant-remove";
            btn.title = `Remove ${participant}`;
            btn.innerHTML = "&times;";

            btn.addEventListener("click", async () => {
              if (!confirm(`Unregister ${participant} from ${name}?`)) return;

              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(participant)}`,
                  { method: "POST" }
                );

                const json = await res.json();

                if (res.ok) {
                  // remove participant from UI
                  li.remove();

                  // update availability number
                  const availEl = activityCard.querySelector(".availability");
                  if (availEl) {
                    const m = availEl.textContent.match(/(\d+)/);
                    if (m) {
                      const current = parseInt(m[1], 10);
                      availEl.innerHTML = `<strong>Availability:</strong> ${current + 1} spots left`;
                    }
                  }

                  messageDiv.textContent = json.message || "Participant removed";
                  messageDiv.className = "success";
                } else {
                  messageDiv.textContent = json.detail || "Failed to remove participant";
                  messageDiv.className = "error";
                }
              } catch (err) {
                messageDiv.textContent = "Failed to contact server";
                messageDiv.className = "error";
                console.error(err);
              }

              messageDiv.classList.remove("hidden");
              setTimeout(() => messageDiv.classList.add("hidden"), 5000);
            });

            li.appendChild(span);
            li.appendChild(btn);
            ul.appendChild(li);
          });

          participantsDiv.appendChild(ul);
        } else {
          const pEmpty = document.createElement("p");
          pEmpty.className = "participants-empty";
          pEmpty.textContent = "No participants yet";
          participantsDiv.appendChild(pEmpty);
        }

        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the new participant appears without a full reload
        await fetchActivities();
        activitySelect.value = "";
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
