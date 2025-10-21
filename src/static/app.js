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

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participantes:</h5>
            <ul class="participants-list">
              ${details.participants.length > 0 
                ? details.participants.map(email => `
                    <li>
                      <span class="participant-email">${email}</span>
                      <button class="delete-participant" data-activity="${name}" data-email="${email}">
                        <span class="delete-icon">×</span>
                      </button>
                    </li>`).join('')
                : '<li class="no-participants">Nenhum participante ainda</li>'}
            </ul>
          </div>
        `;

        // Adiciona event listeners para os botões de deletar
        activityCard.querySelectorAll('.delete-participant').forEach(button => {
          button.addEventListener('click', async (e) => {
            e.preventDefault();
            const activity = e.target.closest('.delete-participant').dataset.activity;
            const email = e.target.closest('.delete-participant').dataset.email;
            
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
                {
                  method: "POST",
                }
              );

              const result = await response.json();

              if (response.ok) {
                messageDiv.textContent = "Participante removido com sucesso!";
                messageDiv.className = "success";
                // Atualiza a lista de atividades
                fetchActivities();
              } else {
                messageDiv.textContent = result.detail || "Erro ao remover participante";
                messageDiv.className = "error";
              }

              messageDiv.classList.remove("hidden");

              // Esconde a mensagem após 5 segundos
              setTimeout(() => {
                messageDiv.classList.add("hidden");
              }, 5000);
            } catch (error) {
              messageDiv.textContent = "Falha ao remover participante. Tente novamente.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              console.error("Erro ao remover participante:", error);
            }
          });
        });

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
        // Atualiza a lista de atividades para mostrar o novo participante
        fetchActivities();
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
