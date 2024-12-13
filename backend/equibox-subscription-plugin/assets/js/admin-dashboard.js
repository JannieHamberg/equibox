document.addEventListener("DOMContentLoaded", () => {
    console.log("JavaScript loaded");
    const addPlanForm = document.getElementById("add-plan-form");
    const editPlanForm = document.getElementById("edit-plan-form");
    const subscriptionPlansTable = document.getElementById("subscription-plans-table").querySelector("tbody");

    // Add Plan
    addPlanForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(addPlanForm);

        console.log("FormData:", Object.fromEntries(formData.entries()));

        fetch("/wp-json/equibox/v1/admin/subscription_plans/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-WP-Nonce": wpApiSettings.nonce,
            },
            body: JSON.stringify({
                name: formData.get("name"),
                price: formData.get("price"),
                interval: formData.get("interval"),
                description: formData.get("description"),
                nonce: document.querySelector('[name="add_plan_nonce"]').value,
            }),
            
        })
            .then((response) => response.json())
            .then((data) => {
                console.log("Server Response Data:", data.data); 
                if (data.success) {
                    console.log("Plan added successfully:", data.data);
                    const plan = data.data;
                    const newRow = `
                        <tr data-id="${plan.id}">
                            <td>${plan.id}</td>
                            <td>${plan.name}</td>
                            <td>${plan.price}</td>
                            <td>${plan.interval}</td>
                            <td>${plan.description}</td>
                            <td>
                                <button class="button edit-plan-button" 
                                    data-id="${plan.id}" 
                                    data-name="${plan.name}" 
                                    data-price="${plan.price}" 
                                    data-interval="${plan.interval}" 
                                    data-description="${plan.description}">Edit</button>
                                <button class="button button-danger delete-plan-button" data-id="${plan.id}">Delete</button>
                            </td>
                        </tr>`;
                    subscriptionPlansTable.insertAdjacentHTML("beforeend", newRow);
                    addPlanForm.reset();
                } else {
                    console.error("Error adding plan:", data.message);
                    alert("Error adding plan: " + data.message);
                }
            })
            .catch((error) => {
                console.error("Add Plan Request Failed:", error);
                alert("Failed to add plan.");
            });
    });

    // Edit Plan
    subscriptionPlansTable.addEventListener("click", (event) => {
        if (event.target.classList.contains("edit-plan-button")) {
            const button = event.target;

            // Populate form fields
            document.getElementById("edit_plan_id").value = button.dataset.id;
            document.getElementById("edit_plan_name").value = button.dataset.name;
            document.getElementById("edit_plan_price").value = button.dataset.price;
            document.getElementById("edit_plan_interval").value = button.dataset.interval;
            document.getElementById("edit_plan_description").value = button.dataset.description;

            console.log("Populating edit form with plan data:", button.dataset);
            editPlanForm.scrollIntoView({ behavior: "smooth" });
        }
    });

        // Submit the Edit Form
        editPlanForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const formData = new FormData(editPlanForm);

        // Log the FormData content to the console
        console.log("FormData:", Object.fromEntries(formData.entries()));

        // Convert FormData to a JSON object
        fetch("/wp-json/equibox/v1/admin/subscription_plans/edit", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-WP-Nonce": wpApiSettings.nonce,
            },
            body: JSON.stringify({
                id: formData.get("id"),
                name: formData.get("name"),
                price: formData.get("price"),
                interval: formData.get("interval"),
                description: formData.get("description"),
                nonce: document.querySelector('[name="edit_plan_nonce"]').value,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log("Server Response Data:", data.data); 
                if (data.success) {
                    console.log("Plan updated successfully:", data.data);
                    const plan = data.data;
                    const row = subscriptionPlansTable.querySelector(`tr[data-id="${plan.id}"]`);
                    if (row) {
                        row.innerHTML = `
                            <td>${plan.id}</td>
                            <td>${plan.name}</td>
                            <td>${plan.price}</td>
                            <td>${plan.interval}</td>
                            <td>${plan.description}</td>
                            <td>
                                <button class="button edit-plan-button" 
                                    data-id="${plan.id}" 
                                    data-name="${plan.name}" 
                                    data-price="${plan.price}" 
                                    data-interval="${plan.interval}" 
                                    data-description="${plan.description}">Edit</button>
                                <button class="button button-danger delete-plan-button" data-id="${plan.id}">Delete</button>
                            </td>`;
                    }
                    alert("Plan updated successfully.");
                } else {
                    console.error("Error updating plan:", data.message);
                    alert("Error updating plan: " + data.message);
                }
            })
            .catch((error) => {
                console.error("Update Plan Request Failed:", error);
                alert("Failed to update plan.");
            });
    });



    subscriptionPlansTable.addEventListener("click", (event) => {
        if (event.target.classList.contains("delete-plan-button")) {
            const planId = event.target.dataset.id;
            const nonce = event.target.dataset.nonce;
    
            if (!confirm("Are you sure you want to delete this plan?")) return;
    
            fetch(`/wp-json/equibox/v1/admin/subscription_plans/delete`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "X-WP-Nonce": wpApiSettings.nonce,
                },
                body: JSON.stringify({
                    id: planId,
                    nonce: nonce, 
                }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        console.log("Plan deleted successfully:", data.message);
                        const row = subscriptionPlansTable.querySelector(`tr[data-id="${planId}"]`);
                        if (row) row.remove();
                    } else {
                        console.error("Error deleting plan:", data.message);
                        alert("Error deleting plan: " + data.message);
                    }
                })
                .catch((error) => {
                    console.error("Delete Plan Request Failed:", error);
                    alert("Failed to delete plan.");
                });
        }
    });
    
    
});
