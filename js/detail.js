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

// Item ID uit URL ophalen
const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('id');

if (!itemId) {
  alert("Geen item ID gevonden!");
  window.location.href = "index.html";
}

// Item laden en weergeven
async function laadItem() {
  const item = await getItem(itemId);

  if (!item) {
    alert("Item niet gevonden!");
    window.location.href = "index.html";
    return;
  }

  // Detail weergave vullen
  document.getElementById("detailImage").src = item.afbeelding || "https://via.placeholder.com/250";
  document.getElementById("detailTitel").textContent = item.titel;
  document.getElementById("detailType").textContent = item.type;
  
  // Remove duplicate genres
  const genresArray = item.genres ? item.genres.split(", ").map(g => g.trim()) : [];
  const uniqueGenres = [...new Set(genresArray)];
  document.getElementById("detailGenres").textContent = uniqueGenres.length > 0 ? uniqueGenres.join(", ") : "Geen genres";
  
  document.getElementById("detailBeschrijving").textContent = item.beschrijving;
  document.getElementById("detailRating").textContent = item.rating ? `${item.rating}/10` : "N/A";
  document.getElementById("detailBron").innerHTML = item.bron ? `<a href="${item.bron}" target="_blank" rel="noopener">Link</a>` : "N/A";
  document.getElementById("detailStatus").textContent = item.status ? item.status.replace(/_/g, ' ') : "N/A";
  document.getElementById("detailDatum").textContent = item.datum || "N/A";

  // Set edit button link
  document.getElementById("btnEdit").href = `update.html?id=${item.id}`;
}

// Item verwijderen
async function verwijderItem() {
  if (confirm("Weet je zeker dat je dit item wilt verwijderen?")) {
    await deleteItem(itemId);
    window.location.href = "index.html";
  }
}

// Laad item bij laden pagina
document.addEventListener("DOMContentLoaded", () => {
    laadItem();
});

// Item laden bij pagina load
laadItem();