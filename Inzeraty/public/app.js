const API_URL = '/api/inzeraty';

const form = document.getElementById('inzerat-form');
const editIdInput = document.getElementById('edit-id');
const titleInput = document.getElementById('title');
const descInput = document.getElementById('description');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');

document.addEventListener('DOMContentLoaded', nactiInzeraty);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = editIdInput.value;
  const data = { title: titleInput.value, description: descInput.value };

  try {
    if (id) {
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
    resetFormulare();
    nactiInzeraty();
  } catch (error) {
    console.error('Chyba při odesílání:', error);
  }
});

async function nactiInzeraty() {
  const list = document.getElementById('inzeraty-list');
  list.innerHTML = '<p>Načítám...</p>';

  try {
    const res = await fetch(API_URL);
    const inzeraty = await res.json();
    list.innerHTML = '';

    if (inzeraty.length === 0) {
      list.innerHTML = '<p>Žádné inzeráty k zobrazení.</p>';
      return;
    }

    inzeraty.forEach(inz => {
      const card = document.createElement('div');
      card.className = 'inzerat-card';
      card.innerHTML = `
        <div class="inzerat-content">
          <h3>${inz.title}</h3>
          <p>${inz.description}</p>
        </div>
        <div class="inzerat-actions">
          <button class="btn-warning" onclick="pripravUpravu('${inz.id}', '${escapeHtml(inz.title)}', '${escapeHtml(inz.description)}')">Upravit</button>
          <button class="btn-danger" onclick="smazInzerat('${inz.id}')">Smazat</button>
        </div>
      `;
      list.appendChild(card);
    });
  } catch (error) {
    list.innerHTML = '<p>Chyba při načítání dat ze serveru.</p>';
  }
}

window.pripravUpravu = (id, title, description) => {
  editIdInput.value = id;
  titleInput.value = title;
  descInput.value = description;
  formTitle.innerText = 'Upravit inzerát';
  submitBtn.innerText = 'Uložit změny';
  cancelBtn.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

cancelBtn.addEventListener('click', resetFormulare);

function resetFormulare() {
  form.reset();
  editIdInput.value = '';
  formTitle.innerText = 'Přidat nový inzerát';
  submitBtn.innerText = 'Zveřejnit inzerát';
  cancelBtn.classList.add('hidden');
}

window.smazInzerat = async (id) => {
  if (!confirm('Opravdu smazat?')) return;
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  nactiInzeraty();
};

function escapeHtml(text) {
  return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}