let tornUsers = [];

/**
 * Generate a list of Torn users.
 */
const getTornUsers = async () => await fetch(`./players.json`).then(data => data.json()).then(data => (tornUsers = data));

/**
 * Update the leaderboard.
 */
const updateLB = () => {
    let lbData = ``;
    for (const player of tornUsers) {
        const playerTeam = player.team === 0
            ? `blue`
            : player.team === 1
                ? `red`
                : `green`;

        const playerEntry = `
        <tr class="team-${playerTeam}">
            <td aria-label="spot">${player.spot}.</td>
            <td aria-label="name">${player.name}</td>
            <td aria-label="xp">${player.xp}</td>
            <td aria-label="elo">${player.elo}</td>
            <td aria-label="rank">${player.rank}</td>
            <td aria-label="kills">${player.kills}</td>
            <td aria-label="money">${player.money}</td>
            <td aria-label="tech">${player.tech}</td>
        </tr>`;

        lbData += playerEntry;
    }

    document.querySelector(`tbody`).innerHTML = lbData;
};

/**
 * Sort the leaderboard.
 */
const sortLB = () => {
    const sortBy = document.querySelector(`#sort-by`)?.value;
    if (!tornUsers || !sortBy || sortBy === `default`) return;

    switch (sortBy) {
        case `experience`:
            tornUsers.sort((a, b) => a.xp - b.xp).reverse();
            break;
        case `elo`:
            tornUsers.sort((a, b) => a.elo - b.elo).reverse();
            break;
        case `kills`:
            tornUsers.sort((a, b) => a.kills - b.kills).reverse();
            break;
        case `tech`:
            tornUsers.sort((a, b) => a.tech - b.tech).reverse();
            break;
        default:
            return;
    }

    updateLB();
};

window.onload = async () => {
    await getTornUsers();
    updateLB();
};
