// Item ID uit URL ophalen
const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('id');

if (!itemId) {
  alert("Geen item ID gevonden!");
  window.location.href = "index.html";
}

// Item laden en weergeven
function laadItem() {
  const data = JSON.parse(localStorage.getItem('bibliotheekItems') || '[]');
  const item = data.find(i => i.id == itemId);

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
function verwijderItem() {
  if (confirm("Weet je zeker dat je dit item wilt verwijderen?")) {
    let items = JSON.parse(localStorage.getItem('bibliotheekItems') || '[]');
    items = items.filter(item => item.id != itemId);
    localStorage.setItem('bibliotheekItems', JSON.stringify(items));
    window.location.href = "index.html";
  }
}

// Item laden bij pagina load
laadItem();