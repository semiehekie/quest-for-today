
// Leaderboard functionality
document.addEventListener('DOMContentLoaded', () => {
    loadLeaderboard();
});

async function loadLeaderboard() {
    try {
        const response = await fetch('/api/users');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        showError('Fout bij laden van leaderboard. Probeer later opnieuw.');
    }
}

function displayUsers(users) {
    const container = document.getElementById('users-container');

    if (!container) {
        console.error('Users container not found');
        return;
    }

    if (users.length === 0) {
        container.innerHTML = '<p>Geen spelers gevonden.</p>';
        return;
    }

    // Sorteer op punten aflopend
    users.sort((a, b) => b.punten - a.punten);

    const table = document.createElement('table');
    table.className = 'users-table';

    // Create table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Rang</th>
            <th>Naam</th>
            <th>Punten</th>
        </tr>
    `;
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    users.forEach((user, index) => {
        const row = document.createElement('tr');
        
        // Add rank styling for top 3
        if (index === 0) row.classList.add('rank-1');
        else if (index === 1) row.classList.add('rank-2');
        else if (index === 2) row.classList.add('rank-3');

        row.innerHTML = `
            <td>${getRankDisplay(index + 1)}</td>
            <td>${escapeHtml(user.naam)}</td>
            <td>${user.punten.toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    container.innerHTML = '';
    container.appendChild(table);
}

function getRankDisplay(rank) {
    switch(rank) {
        case 1: return '🥇 1';
        case 2: return '🥈 2';
        case 3: return '🥉 3';
        default: return rank;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => errorDiv.style.display = 'none', 5000);
    }
}

// Refresh leaderboard every 30 seconds
setInterval(loadLeaderboard, 30000);
