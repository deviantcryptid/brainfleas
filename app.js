// ---------- Helper ----------
function pkColor(color) {
    if (!color) return '#999';
    return color.startsWith('#') ? color : `#${color}`;
}

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
        console.log(`Fetching system: ${systemRef}`);

        // --- Fetch system info ---
        const systemRes = await fetch(`https://api.pluralkit.me/v2/systems/${systemRef}`);
        if (!systemRes.ok) throw new Error("System not found or not public");
        const system = await systemRes.json();
        const displayRef = system.ref || system.id.slice(0, 5);

        // --- Fetch members ---
        const membersRes = await fetch(`https://api.pluralkit.me/v2/systems/${systemRef}/members`);
        const members = membersRes.ok ? await membersRes.json() : [];
        const memberMap = {};
        members.forEach(m => memberMap[m.id] = m);
        console.log("Members:", members);

        // --- Fetch current fronters ---
        const frontersRes = await fetch(`https://api.pluralkit.me/v2/systems/${systemRef}/fronters`);
        const frontersData = frontersRes.ok ? await frontersRes.json() : { members: [] };
        console.log("Fronters members:", frontersData.members);

        let fronters = [];
        if (Array.isArray(frontersData.members) && frontersData.members.length > 0) {
            fronters = frontersData.members.map(f => {
                const member = memberMap[f.id] || {};
                return {
                    id: f.id,
                    name: member.name || f.name || "Unknown",
                    display_name: member.display_name || f.display_name || null,
                    avatar_url: member.avatar_url || f.avatar_url || "",
                    pronouns: member.pronouns || f.pronouns || "",
                    color: pkColor(member.color || f.color || "#999")
                };
            });
        }

        console.log("Mapped fronters:", fronters);
        return { system, fronters, displayRef };

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
    card.style.borderColor = pkColor(data.system.color);

    const displayRef = data.displayRef;

    card.innerHTML = `
        <div class="system-header">
            <img src="${data.system.avatar_url || ''}" 
                 class="system-avatar" 
                 style="border-color: ${pkColor(data.system.color)}" 
                 onerror="this.style.display='none'">
            <h2 class="system-name" style="color: ${pkColor(data.system.color)}">
                ${data.system.name}
            </h2>
            <button class="remove-system" title="Remove system">✖️</button>
        </div>
        <div class="fronters">
            ${data.fronters.length > 0
                ? data.fronters.map(f => `
                    <div class="fronter" style="border-color: ${f.color}">
                        <img src="${f.avatar_url || ''}" 
                             class="fronter-avatar" 
                             style="border-color: ${f.color}" 
                             onerror="this.style.display='none'">
                        <span class="fronter-name" style="color: ${f.color}">
                            ${f.display_name || f.name}
                        </span>
                        <span class="fronter-pronouns">${f.pronouns}</span>
                    </div>
                  `).join('')
                : `<em style="color:#666;font-size:0.9em;">No one is fronting</em>`
            }
        </div>
    `;

    container.appendChild(card);

    // Remove system
    card.querySelector('.remove-system').addEventListener('click', () => {
        systems = systems.filter(s => s.displayRef !== displayRef);
        savedSystemRefs = savedSystemRefs.filter(ref => ref !== displayRef);
        localStorage.setItem('systems', JSON.stringify(savedSystemRefs));
        renderAllSystems();
    });
}

// ---------- Add System ----------
async function addSystem() {
    const shortcode = shortcodeInput.value.trim();
    if (!shortcode) return;
    if (savedSystemRefs.includes(shortcode) || systems.some(s => s.displayRef === shortcode)) {
        alert('System already added.');
        return;
    }
    const data = await fetchSystemWithFronters(shortcode);
    if (data) {
        systems.push(data);
        savedSystemRefs.push(data.displayRef);
        localStorage.setItem('systems', JSON.stringify(savedSystemRefs));
        renderAllSystems();
        shortcodeInput.value = '';
    }
}

addBtn.addEventListener('click', addSystem);

// ---------- Press Enter to Add System ----------
shortcodeInput.addEventListener('keyup', async (e) => {
    if (e.key === 'Enter') {
        addBtn.click();
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
