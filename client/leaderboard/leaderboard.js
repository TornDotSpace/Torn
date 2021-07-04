let tornUsers, xpLB, eloLB, killsLB, techLB;

/**
 * Generate a list of Torn users.
 */
const getTornUsers = async () => await fetch(`./players.json`).then(data => data.json()).then(data => {
    tornUsers = data;
    xpLB = [...data].sort((a, b) => b.xp - a.xp);
});

/**
 * Update the leaderboard.
 */
const updateLB = () => {
    let lbData = ``;
    for (const player of tornUsers) {
        const playerEntry = `
        <tr class="team-${player.team}">
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
    if (!tornUsers || !sortBy) return;

    switch (sortBy) {
        case `elo`:
            if (eloLB == undefined) {
                eloLB = [...tornUsers].sort((a, b) => b.elo - a.elo);
            }
            tornUsers = eloLB;
            break;
        case `kills`:
            if (killsLB == undefined) {
                killsLB = [...tornUsers].sort((a, b) => b.kills - a.kills);
            }
            tornUsers = killsLB;
            break;
        case `tech`:
            if (techLB == undefined) {
                techLB = [...tornUsers].sort((a, b) => b.tech - a.tech);
            }
            tornUsers = techLB;
            break;
        default:
            tornUsers = xpLB;
            break;
    }

    updateLB();
};

/**
 * Update the header to automatically toggle stickiness.
 */
const updateHeader = () => {
    const tableHeader = document.querySelector(`thead > tr`);

    window.pageYOffset === tableHeader.offsetTop
        ? tableHeader.classList.add(`th-sticky`)
        : tableHeader.classList.remove(`th-sticky`);
};

window.onload = async () => {
    await getTornUsers();
    updateLB();
};

window.onscroll = () => updateHeader();
