let tornUsers = [];

/**
 * Generate a list of Torn users.
 */
const getTornUsers = async () => await fetch(`./players.json`).then(data => data.json()).then(data => (tornUsers = data));

/**
 * Update the visual leaderboard.
 */
const updateLB = () => {
    const lb = document.querySelector(`tbody`);
    for (const player of tornUsers) {
        const playerEntry = document.createElement(`tr`);
        playerEntry.innerHTML = `
            <td>${player.spot}.</td>
            <td>${player.name}</td>
            <td>${player.xp}</td>
            <td>${player.elo}</td>
            <td>${player.rank}</td>
            <td>${player.kills}</td>
            <td>${player.money}</td>
            <td>${player.tech}</td>
        `;

        const playerTeam = player.team === 0
            ? `blue`
            : player.team === 1
                ? `red`
                : `green`;

        playerEntry.classList.add(`team-${playerTeam}`);
        lb.appendChild(playerEntry);
    }
};

window.onload = async () => {
    await getTornUsers();
    updateLB();
};
