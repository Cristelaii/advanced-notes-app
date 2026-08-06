
const STORAGE_KEY = 'notesApp.v1';
let notes = [];
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function now() { return Date.now(); }

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  // console.log('Saved', notes.length);
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) notes = data;
    else notes = [];
  } catch (e) {
    console.warn('Storage parse failed. Resetting.', e);
    notes = [];
  }
}


function createNote({ title, body }) {
  const trimmedTitle = (title || '').trim();
  const trimmedBody = (body || '').trim();

  if (!trimmedTitle && !trimmedBody) {
    alert('Please enter a title or some details.');
    return null;
  }

  const note = {
    id: now(),          
    title: trimmedTitle || 'Untitled',
    body: trimmedBody,
    createdAt: now(),
  };
  notes.push(note);
  saveToStorage();
  return note;
}

function readNotes() {

  return [...notes];
}

function updateNote(id, updates) {
  const idx = notes.findIndex(n => n.id === id);
  if (idx === -1) return false;

  const next = { ...notes[idx], ...updates };
  
  if ('title' in updates) next.title = (updates.title || '').trim() || 'Untitled';
  if ('body' in updates) next.body = (updates.body || '').trim();

  notes[idx] = next;
  saveToStorage();
  return true;
}

function deleteNote(id) {
  const before = notes.length;
  notes = notes.filter(n => n.id !== id);
  const changed = before !== notes.length;
  if (changed) saveToStorage();
  return changed;
}

function clearAllNotes() {
  notes = [];
  saveToStorage();
}


const notesListEl = $('#notesList');
const emptyStateEl = $('#emptyState');
const searchEl = $('#search');
const sortEl = $('#sort');

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}

function renderList() {
  const query = (searchEl.value || '').toLowerCase();

  
  let data = readNotes().filter(n =>
    n.title.toLowerCase().includes(query) ||
    n.body.toLowerCase().includes(query)
  );

 
  const sortVal = sortEl.value;
  data.sort((a,b) => {
    switch (sortVal) {
      case 'newest': return b.createdAt - a.createdAt;
      case 'oldest': return a.createdAt - b.createdAt;
      case 'title-asc': return a.title.localeCompare(b.title);
      case 'title-desc': return b.title.localeCompare(a.title);
      default: return 0;
    }
  });

  notesListEl.innerHTML = '';
  if (data.length === 0) {
    emptyStateEl.classList.remove('hidden');
    return;
  } else {
    emptyStateEl.classList.add('hidden');
  }

  
  const frag = document.createDocumentFragment();
  data.forEach(note => {
    const card = document.createElement('div');
    card.className = 'note';
    card.dataset.id = String(note.id);

    const header = document.createElement('div');
    header.className = 'note-header';

    const title = document.createElement('h3');
    title.className = 'note-title';
    title.textContent = note.title;

    const meta = document.createElement('div');
    meta.className = 'note-meta';
    meta.textContent = `Created: ${formatDate(note.createdAt)}`;

    header.appendChild(title);
    header.appendChild(meta);

    const body = document.createElement('div');
    body.className = 'note-body';
    body.textContent = note.body || '';

    const actions = document.createElement('div');
    actions.className = 'note-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'secondary';
    editBtn.textContent = '✏️ Edit';
    editBtn.dataset.action = 'edit';

    const delBtn = document.createElement('button');
    delBtn.className = 'danger';
    delBtn.textContent = '🗑️ Delete';
    delBtn.dataset.action = 'delete';

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(actions);

    frag.appendChild(card);
  });

  notesListEl.appendChild(frag);
}


const noteForm = $('#noteForm');
const noteIdEl = $('#noteId');
const titleEl = $('#title');
const bodyEl = $('#body');
const formTitleEl = $('#formTitle');
const cancelEditBtn = $('#cancelEditBtn');

function resetForm() {
  noteIdEl.value = '';
  titleEl.value = '';
  bodyEl.value = '';
  formTitleEl.textContent = 'Add a New Note';
  cancelEditBtn.classList.add('hidden');
}

function populateFormForEdit(note) {
  noteIdEl.value = String(note.id);
  titleEl.value = note.title;
  bodyEl.value = note.body;
  formTitleEl.textContent = 'Edit Note';
  cancelEditBtn.classList.remove('hidden');
}

noteForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const idStr = noteIdEl.value;
  const title = titleEl.value;
  const body = bodyEl.value;

  if (idStr) {
    // UPDATE
    const id = Number(idStr);
    const ok = updateNote(id, { title, body });
    if (!ok) {
      alert('Note not found. It may have been deleted.');
    }
  } else {
   
    const created = createNote({ title, body });
    if (!created) return;
  }

  resetForm();
  renderList();
});

cancelEditBtn.addEventListener('click', () => {
  resetForm();
});


notesListEl.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;

  const action = target.dataset.action;
  if (!action) return;

  const card = target.closest('.note');
  if (!card) return;

  const id = Number(card.dataset.id);
  if (!id) return;

  if (action === 'edit') {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    populateFormForEdit(note);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (action === 'delete') {
    if (confirm('Delete this note?')) {
      deleteNote(id);

  
      if (String(id) === noteIdEl.value) resetForm();
      renderList();
    }
  }
});


searchEl.addEventListener('input', renderList);
sortEl.addEventListener('change', renderList);


$('#clearAllBtn').addEventListener('click', () => {
  if (notes.length === 0) {
    alert('Nothing to clear.');
    return;
  }
  if (confirm('Delete ALL notes? This cannot be undone.')) {
    clearAllNotes();
    resetForm();
    renderList();
  }
});


window.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  renderList();
});
