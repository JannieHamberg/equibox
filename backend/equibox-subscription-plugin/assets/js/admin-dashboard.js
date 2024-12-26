document.addEventListener("DOMContentLoaded", () => {
    console.log("JavaScript loaded");

       // Function to populate categories dropdown
    function populateCategoriesDropdown(selector) {
        fetch("/wp-json/equibox/v1/categories", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-WP-Nonce": wpApiSettings.nonce,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    const dropdown = document.querySelector(selector);
                    if (dropdown) {
                        dropdown.innerHTML = "";
                        const defaultOption = document.createElement("option");
                        defaultOption.value = "";
                        defaultOption.textContent = "Select a Category";
                        dropdown.appendChild(defaultOption);
                        data.categories.forEach((category) => {
                            const option = document.createElement("option");
                            option.value = category.id;
                            option.textContent = category.name;
                            dropdown.appendChild(option);
                        });
                    }
                } else {
                    console.error("Failed to fetch categories:", data.message);
                }
            })
            .catch((error) => {
                console.error("Fetch Categories Request Failed:", error);
            });
    }

    // Add product form logic
    function addProductForm() {
        const addProductForm = document.getElementById("add-product-form");

        addProductForm?.addEventListener("submit", (event) => {
            event.preventDefault();
            const formData = new FormData(addProductForm);

            const categoryId = document.getElementById("product_category").value;
            if (!categoryId) {
                alert("Please select a valid category.");
                return;
            }

            fetch("/wp-json/equibox/v1/products", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-WP-Nonce": wpApiSettings.nonce,
                },
                body: JSON.stringify({
                    name: formData.get("name"),
                    description: formData.get("description"),
                    price: formData.get("price"),
                    category_id: categoryId,
                    nonce: formData.get("add_product_nonce"),
                }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        alert("Product added successfully!");
                        addProductForm.reset();

                        // Dynamically update the checkbox lists in add/edit plan forms
                        const product = data.product;

                        const addPlanContainer = document.querySelector("#add-plan-form [for='products'] + td");
                        const editPlanContainer = document.querySelector("#edit-plan-form [for='edit_products'] + td");

                        if (addPlanContainer) {
                            const newCheckbox = document.createElement("label");
                            newCheckbox.innerHTML = `
                                <input type="checkbox" class="add-product-checkbox" value="${product.id}" data-price="${product.price}">
                                ${product.name} (Price: ${product.price})
                            `;
                            addPlanContainer.appendChild(newCheckbox);
                        }

                        if (editPlanContainer) {
                            const newEditCheckbox = document.createElement("label");
                            newEditCheckbox.innerHTML = `
                                <input type="checkbox" class="edit-product-checkbox" value="${product.id}" data-price="${product.price}">
                                ${product.name} (Price: ${product.price})
                            `;
                            editPlanContainer.appendChild(newEditCheckbox);
                        }
                    } else {
                        alert("Error adding product: " + data.message);
                    }
                })
                .catch((error) => {
                    console.error("Add Product Request Failed:", error);
                    alert("Failed to add product.");
                });
        });
    }

    // Initialize functions
    populateCategoriesDropdown("#product_category");
    addProductForm();

    
    // Utility function to collect selected product IDs
    function getSelectedProductIDs(checkboxSelector) {
        return Array.from(document.querySelectorAll(checkboxSelector + ":checked")).map(
            (checkbox) => checkbox.value
        );
    }

    // Utility function to update calculated price
    function updateCalculatedPrice(checkboxSelector, outputSelector) {
        const selectedCheckboxes = document.querySelectorAll(checkboxSelector + ":checked");
        let totalPrice = 0;

        selectedCheckboxes.forEach((checkbox) => {
            const price = parseFloat(checkbox.dataset.price || 0);
            totalPrice += price;
        });

        const outputElement = document.querySelector(outputSelector);
        if (outputElement) {
            outputElement.textContent = totalPrice.toFixed(2);
        }
    }

    // Utility function to collect selected product IDs
    function getSelectedProductIDs(checkboxSelector) {
        return Array.from(document.querySelectorAll(checkboxSelector + ":checked")).map(
            (checkbox) => checkbox.value
        );
    }

    // Utility function to update calculated price
    function updateCalculatedPrice(checkboxSelector, outputSelector) {
        const selectedCheckboxes = document.querySelectorAll(checkboxSelector + ":checked");
        let totalPrice = 0;

        selectedCheckboxes.forEach((checkbox) => {
            const price = parseFloat(checkbox.dataset.price || 0);
            totalPrice += price;
        });

        const outputElement = document.querySelector(outputSelector);
        if (outputElement) {
            outputElement.textContent = totalPrice.toFixed(2);
        }
    }

    // Handle product selection changes dynamically in add and edit form
    document.querySelector(".add_subscription_plan")?.addEventListener("change", (event) => {
        if (event.target.classList.contains("add-product-checkbox")) {
            updateCalculatedPrice(".add-product-checkbox", "#calculated_price_display");
        }
    });

    document.querySelector(".edit-subscription-plan")?.addEventListener("change", (event) => {
        if (event.target.classList.contains("edit-product-checkbox")) {
            updateCalculatedPrice(".edit-product-checkbox", "#edit-calculated-price-display");
        }
    });

    // Handle Add Plan form submission
    const addPlanForm = document.getElementById("add-plan-form");
    addPlanForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(addPlanForm);
        const selectedProducts = getSelectedProductIDs(".add-product-checkbox");

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
                image_url: formData.get("image_url"),
                product_ids: selectedProducts,
                nonce: document.querySelector('[name="add_plan_nonce"]').value,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    console.log("Plan added successfully:", data.data);
                    location.reload(); 
                } else {
                    alert("Error adding plan: " + data.message);
                }
            })
            .catch((error) => {
                console.error("Add Plan Request Failed:", error);
                alert("Failed to add plan.");
            });
    });

    // Handle edit plan button click
    const subscriptionPlansTable = document.getElementById("subscription-plans-table")?.querySelector("tbody");
    subscriptionPlansTable?.addEventListener("click", (event) => {
        if (event.target.classList.contains("edit-plan-button")) {
            const button = event.target;
            const planId = button.dataset.id;

            // Populate edit plan form
            document.getElementById("edit_plan_id").value = button.dataset.id;
            document.getElementById("edit_plan_name").value = button.dataset.name;
            document.getElementById("edit_plan_price").value = "";
            document.getElementById("edit_plan_interval").value = button.dataset.interval;
            document.getElementById("edit_plan_description").value = button.dataset.description;
            document.getElementById("edit_plan_image_url").value = button.dataset.imageUrl || "";

            // Fetch associated products and preselect checkboxes
            fetch(`/wp-json/equibox/v1/admin/subscription_plans/${planId}/products`, {
                headers: {
                    "X-WP-Nonce": wpApiSettings.nonce,
                },
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        const associatedProducts = data.data.map((product) => product.id.toString());
                        document.querySelectorAll(".edit-product-checkbox").forEach((checkbox) => {
                            checkbox.checked = associatedProducts.includes(checkbox.value);
                        });

                        // Update calculated price dynamically
                        updateCalculatedPrice(".edit-product-checkbox", "#edit-calculated-price-display");
                    } else {
                        console.error("Failed to fetch products:", data.message);
                    }
                })
                .catch((error) => {
                    console.error("Fetch products request failed:", error);
                });
        }
    });

    // Handle edit plan form submission
    const editPlanForm = document.getElementById("edit-plan-form");
    editPlanForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(editPlanForm);
        const selectedProducts = getSelectedProductIDs(".edit-product-checkbox");

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
                image_url: formData.get("image_url"),
                product_ids: selectedProducts,
                nonce: document.querySelector('[name="edit_plan_nonce"]').value,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    console.log("Plan updated successfully:", data.data);
                    location.reload();
                } else {
                    alert("Error updating plan: " + data.message);
                }
            })
            .catch((error) => {
                console.error("Edit Plan Request Failed:", error);
                alert("Failed to update plan.");
            });
    });

    // Handle delete plan button click
    subscriptionPlansTable?.addEventListener("click", (event) => {
        if (event.target.classList.contains("delete-plan-button")) {
            const planId = event.target.dataset.id;
            const nonce = event.target.dataset.nonce;

            if (!confirm("Are you sure you want to delete this plan?")) return;

            fetch("/wp-json/equibox/v1/admin/subscription_plans/delete", {
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
                        location.reload(); 
                    } else {
                        alert("Error deleting plan: " + data.message);
                    }
                })
                .catch((error) => {
                    console.error("Delete Plan Request Failed:", error);
                });
        }
    });
});
