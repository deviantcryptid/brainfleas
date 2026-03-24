/* ---------- Constants & DOM Elements ---------- */
const input = document.getElementById('shortcode-input');
const addBtn = document.getElementById('add-system-btn');
const systemsContainer = document.getElementById('systems-container');
const themeToggle = document.getElementById('theme-toggle');

let systems = JSON.parse(localStorage.getItem('systems')) || [];
let theme = localStorage.getItem('theme') || 'light';
document.body.setAttribute('data-theme', theme);
themeToggle.textContent = theme === 'light' ? '🌞' : '🌙';

/* ---------- Theme Toggle ---------- */
themeToggle.addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'light' ? '🌞' : '🌙';
    localStorage.setItem('theme', theme);
});

/* ---------- Add System ---------- */
addBtn.addEventListener('click', addSystem);
input.addEventListener('keydown', e => {
    if (e.key === 'Enter') addSystem();
});

function addSystem() {
    const ref = input.value.trim().toLowerCase();
    if (!ref || systems.includes(ref)) return;
    fetchSystem(ref);
    input.value = '';
}

/* ---------- Fetch System ---------- */
async function fetchSystem(systemRef) {
    try {
        // Fetch members
        const membersResp = await fetch(`https://api.pluralkit.me/v2/systems/${systemRef}/members`);
        const membersData = await membersResp.json();

        // Fetch fronters
        const frontersResp = await fetch(`https://api.pluralkit.me/v2/systems/${systemRef}/fronters`);
        const frontersData = await frontersResp.json();

        const frontersIDs = frontersData.members.map(f => f.id);
        const mappedFronters = membersData.filter(m => frontersIDs.includes(m.id));

        createSystemCard(systemRef, membersData, mappedFronters);

        // Save system
        systems.push(systemRef);
        localStorage.setItem('systems', JSON.stringify(systems));
        saveSystemOrder();
    } catch (err) {
        alert(`Error fetching system "${systemRef}"`);
        console.error(err);
    }
}

/* ---------- Create System Card ---------- */
function createSystemCard(systemRef, members, fronters) {
    const card = document.createElement('div');
    card.classList.add('system-card');
    card.dataset.systemRef = systemRef;

    const header = document.createElement('div');
    header.classList.add('system-header');

    const avatar = document.createElement('img');
    avatar.classList.add('system-avatar');
    avatar.src = members[0]?.avatar_url || '';
    avatar.style.borderColor = `#${members[0]?.color || 'ccc'}`;

    const name = document.createElement('h2');
    name.classList.add('system-name');
    name.textContent = members[0]?.display_name || systemRef;
    name.style.color = `#${members[0]?.color || '000'}`;

    const removeBtn = document.createElement('button');
    removeBtn.classList.add('remove-system');
    removeBtn.textContent = '✖';
    removeBtn.addEventListener('click', () => removeSystem(systemRef, card));

    header.append(avatar, name, removeBtn);
    card.appendChild(header);

    // Fronters
    const frontersContainer = document.createElement('div');
    frontersContainer.classList.add('fronters');

    if (fronters.length === 0) {
        const emptyMsg = document.createElement('em');
        emptyMsg.textContent = 'No one is fronting';
        frontersContainer.appendChild(emptyMsg);
    } else {
        fronters.forEach(f => {
            const fCard = document.createElement('div');
            fCard.classList.add('fronter');

            const fAvatar = document.createElement('img');
            fAvatar.classList.add('fronter-avatar');
            fAvatar.src = f.avatar_url || '';
            fAvatar.style.borderColor = `#${f.color || 'ccc'}`;

            const fName = document.createElement('div');
            fName.classList.add('fronter-name');
            fName.textContent = f.display_name;
            fName.style.color = `#${f.color || '000'}`;

            const fPronouns = document.createElement('div');
            fPronouns.classList.add('fronter-pronouns');
            fPronouns.textContent = f.pronouns || '';

            fCard.append(fAvatar, fName, fPronouns);
            frontersContainer.appendChild(fCard);
        });
    }

    card.appendChild(frontersContainer);
    systemsContainer.appendChild(card);

    restoreSystemOrder(); // maintain user order
}

/* ---------- Remove System ---------- */
function removeSystem(systemRef, card) {
    systems = systems.filter(s => s !== systemRef);
    localStorage.setItem('systems', JSON.stringify(systems));
    card.remove();
    saveSystemOrder();
}

/* ---------- Drag-and-Drop (SortableJS) ---------- */
Sortable.create(systemsContainer, {
    animation: 150,
    handle: '.system-header',
    onEnd: saveSystemOrder
});

/* ---------- Save & Restore Order ---------- */
function saveSystemOrder() {
    const order = Array.from(systemsContainer.children).map(card => card.dataset.systemRef);
    localStorage.setItem('systemOrder', JSON.stringify(order));
}

function restoreSystemOrder() {
    const order = JSON.parse(localStorage.getItem('systemOrder') || '[]');
    if (order.length) {
        order.forEach(ref => {
            const card = document.querySelector(`.system-card[data-system-ref="${ref}"]`);
            if (card) systemsContainer.appendChild(card);
        });
    }
}

/* ---------- Load Saved Systems on Start ---------- */
systems.forEach(ref => fetchSystem(ref));
