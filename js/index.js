// IndexedDB helpers
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('bib', 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('items')) {
                db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

async function getAllItems() {
    const db = await openDB();
    const transaction = db.transaction(['items'], 'readonly');
    const store = transaction.objectStore('items');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveItem(item) {
    const db = await openDB();
    const transaction = db.transaction(['items'], 'readwrite');
    const store = transaction.objectStore('items');
    const request = store.put(item);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function deleteItem(id) {
    const db = await openDB();
    const transaction = db.transaction(['items'], 'readwrite');
    const store = transaction.objectStore('items');
    const request = store.delete(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function getItem(id) {
    const db = await openDB();
    const transaction = db.transaction(['items'], 'readonly');
    const store = transaction.objectStore('items');
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Functie om alle items op te halen en tonen
async function laadItems() {
    const data = await getAllItems();

    // Sorteer op ID aflopend (nieuwste eerst)
    data.sort((a, b) => b.id - a.id);

    const lijst = document.getElementById("lijst");
    lijst.innerHTML = "";

    data.forEach(item => {
        lijst.innerHTML += `
            <div class="card">
                <img src="${item.afbeelding || 'https://via.placeholder.com/250'}" alt="">
                <div class="card-content">
                    <h3>${item.titel}</h3>
                    <p><strong>Type:</strong> ${item.type}</p>
                    <p><strong>Genres:</strong> ${item.genres}</p>
                    <p>${item.beschrijving}</p>
                    <p><strong>Rating:</strong> ${item.rating !== null ? item.rating : "N/A"}/10</p>
                    ${item.bron ? `<p><strong>Origineel:</strong> <a href="${item.bron}" target="_blank" rel="noopener">Link</a></p>` : ""}
                    <a href="update.html?id=${item.id}" class="btn-edit">Bewerken</a>
                    <button onclick="verwijderItem(${item.id})">Verwijderen</button>
                </div>
            </div>
        `;
    });
}

function updateGenres() {
    const typeSelect = document.getElementById("type");
    const genreGroups = document.querySelectorAll(".genre-group");
    
    if (!typeSelect) return;
    
    const selectedType = typeSelect.value;

    genreGroups.forEach(group => {
        const types = group.dataset.type.split(" ");

        if (types.includes(selectedType)) {
            //inportant !! //grid anders werkt niet
            group.style.display = "grid";
        } else {
            group.style.display = "none";

            // Uncheck hidden checkboxes
            group.querySelectorAll("input[type='checkbox']").forEach(cb => {
                cb.checked = false;
            });
        }
    });
}

// Item verwijderen
async function verwijderItem(id) {
    if (confirm("Weet je zeker dat je dit wilt verwijderen?")) {
        await deleteItem(id);
        await laadItems();
    }
}

// Item bewerken: vul het formulier
async function bewerkItem(id) {
    const item = await getItem(id);

    document.getElementById("itemForm").style.display = "block";
    document.getElementById("itemId").value = item.id;
    document.getElementById("titel").value = item.titel;
    document.getElementById("type").value = item.type;
    document.getElementById("afbeelding").value = ""; // leeg want we gebruiken file upload
    if (document.getElementById("bron")) document.getElementById("bron").value = item.bron || "";
    document.getElementById("beschrijving").value = item.beschrijving;
    document.getElementById("rating").value = item.rating;
    if (document.getElementById("status")) document.getElementById("status").value = item.status || "";
    if (document.getElementById("datum")) document.getElementById("datum").value = item.datum || "";

    const genresArray = item.genres ? item.genres.split(", ").map(g => g.trim()) : [];
    document.querySelectorAll('#genres input[type="checkbox"]').forEach(cb => cb.checked = genresArray.includes(cb.value));

    document.getElementById("submitBtn").textContent = "Bijwerken";
}

async function handleFormSubmit(e) {
    e.preventDefault();

    // Upload bestand als er een gekozen is
    let afbeeldingUrl = "";
    const bestand = document.getElementById("afbeelding").files[0];

    if (bestand) {
        afbeeldingUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(bestand);
        });
    }

    // Genres verzamelen
    const genresArray = Array.from(document.querySelectorAll('#genres input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    // Remove duplicates
    const uniqueGenres = [...new Set(genresArray)];
    const genres = uniqueGenres.join(", ");

    const nieuwItem = {
        titel: document.getElementById("titel").value.trim(),
        type: document.getElementById("type").value,
        genres,
        beschrijving: document.getElementById("beschrijving").value.trim(),
        afbeelding: afbeeldingUrl || "https://via.placeholder.com/250",
        rating: document.getElementById("rating").value ? parseInt(document.getElementById("rating").value) : null,
        bron: document.getElementById("bron") ? document.getElementById("bron").value.trim() : "",
        status: document.getElementById("status") ? document.getElementById("status").value : null,
        datum: document.getElementById("datum") ? document.getElementById("datum").value : null
    };

    const itemId = document.getElementById("itemId").value;

    if (itemId) {
        // UPDATE item
        nieuwItem.id = parseInt(itemId);
        await saveItem(nieuwItem);
        document.getElementById("submitBtn").textContent = "Opslaan";
    } else {
        // Nieuw item
        await saveItem(nieuwItem);
    }

    // Reset formulier
    e.target.reset();
    document.getElementById("itemId").value = "";
    document.getElementById("submitBtn").textContent = "Opslaan";

    // Herlaad lijst
    await laadItems();
}

function removeDuplicateGenres() {
    document.querySelectorAll(".genre-group").forEach(group => {
        const seen = new Set();

        group.querySelectorAll('#genres input[type="checkbox"]').forEach(checkbox => {
            const value = checkbox.value.trim().toLowerCase();

            if (seen.has(value)) {
                checkbox.parentElement.remove();
            } else {
                seen.add(value);
            }
        });
    });
}

// Run after DOM loads - All initialization happens here
document.addEventListener("DOMContentLoaded", async () => {
    const typeSelect = document.getElementById("type");
    if (typeSelect) {
        typeSelect.addEventListener("change", updateGenres);
        updateGenres();
    }
    
    const itemForm = document.getElementById("itemForm");
    if (itemForm) {
        itemForm.addEventListener("submit", handleFormSubmit);
    }
    
    await laadItems();
    removeDuplicateGenres();
});
