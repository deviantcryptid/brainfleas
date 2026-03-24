// ---------- State ----------
let systems = [];
let savedSystemRefs = JSON.parse(localStorage.getItem('systems')) || [];
let theme = localStorage.getItem('theme') || 'light';
document.body.dataset.theme = theme;

// ---------- Elements ----------
const container = document.getElementById('systems-container');
const addBtn = document.getElementById('add-system-btn');
const shortcodeInput = document.getElementById('shortcode-input');
const themeToggleBtn = document.getElementById('theme-toggle');

// ---------- Theme Functions ----------
function updateThemeIcon() {
    themeToggleBtn.textContent = theme === 'light' ? '🌞' : '🌜';
}
themeToggleBtn.addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    document.body.dataset.theme = theme;
    localStorage.setItem('theme', theme);
    updateThemeIcon();
});
updateThemeIcon();

// ---------- Fetch PluralKit System ----------
async function fetchSystemWithFronters(systemRef) {
    try {
        // System info
        const systemRes = await fetch(`https://api.pluralkit.me/v2/systems/${systemRef}`);
        if (!systemRes.ok) throw new Error("System not found or not public");
        const system = await systemRes.json();

        // Members
        const membersRes = await fetch(`https://api.pluralkit.me/v2/systems/${systemRef}/members`);
        const members = membersRes.ok ? await membersRes.json() : [];
        const memberMap = {};
        members.forEach(m => memberMap[m.id] = m);

        // Current fronters
        const frontersRes = await fetch(`https://api.pluralkit.me/v2/systems/${systemRef}/fronters`);
        const frontersData = frontersRes.ok ? await frontersRes.json() : [];
        const fronters = frontersData.map(f => {
            const member = memberMap[f.id] || {};
            return {
                id: f.id,
                name: member.name || "Unknown",
                display_name: member.display_name || null,
                avatar_url: member.avatar_url || 'default-avatar.png',
                pronouns: member.pronouns || "",
                color: member.color || "#999"
            };
        });

        return { system, fronters };
    } catch (err) {
        console.error(err);
        alert(`Error fetching system "${systemRef}": ${err.message}`);
        return null;
    }
}

// ---------- Render Functions ----------
function renderAllSystems() {
    container.innerHTML = '';
    systems.forEach(s => renderSystemCard(s));
}

function renderSystemCard(data) {
    const card = document.createElement('div');
    card.className = 'system-card';
    card.style.borderColor = data.system.color || '#999';

    card.innerHTML = `
        <div class="system-header">
            <img src="${data.system.avatar_url || 'default-avatar.png'}" class="system-avatar" style="border-color: ${data.system.color || '#999'}">
            <h2 class="system-name" style="color: ${data.system.color || '#999'}">${data.system.name} (@${data.system.ref})</h2>
            <button class="remove-system" title="Remove system">✖️</button>
        </div>
        <div class="fronters">
            ${data.fronters.map(f => `
                <div class="fronter" style="border-color: ${f.color}">
                    <img src="${f.avatar_url || 'default-avatar.png'}" class="fronter-avatar" style="border-color: ${f.color}">
                    <span class="fronter-name" style="color: ${f.color}">${f.display_name || f.name}</span>
                    <span class="fronter-pronouns">${f.pronouns}</span>
                </div>
            `).join('')}
        </div>
    `;

    container.appendChild(card);

    // Remove system
    card.querySelector('.remove-system').addEventListener('click', () => {
        systems = systems.filter(s => s.system.ref !== data.system.ref);
        savedSystemRefs = savedSystemRefs.filter(ref => ref !== data.system.ref);
        localStorage.setItem('systems', JSON.stringify(savedSystemRefs));
        renderAllSystems();
    });
}

// ---------- Add System ----------
addBtn.addEventListener('click', async () => {
    const shortcode = shortcodeInput.value.trim();
    if (!shortcode) return;
    if (savedSystemRefs.includes(shortcode)) {
        alert('System already added.');
        return;
    }
    const data = await fetchSystemWithFronters(shortcode);
    if (data) {
        systems.push(data);
        savedSystemRefs.push(shortcode);
        localStorage.setItem('systems', JSON.stringify(savedSystemRefs));
        renderAllSystems();
        shortcodeInput.value = '';
    }
});

// ---------- Load Saved Systems on Start ----------
window.addEventListener('DOMContentLoaded', async () => {
    for (const ref of savedSystemRefs) {
        const data = await fetchSystemWithFronters(ref);
        if (data) systems.push(data);
    }
    renderAllSystems();
});
