
const servers = [
    { name: "mc-ilias", address: "live.lerncraft.xyz:25565" },
    { name: "mc-niilo", address: "live.lerncraft.xyz:25566" },
    { name: "mc-bgstpoelten", address: "live.lerncraft.xyz:25567" },
    { name: "mc-htlstp", address: "live.lerncraft.xyz:25568" },
    { name: "mc-borgstpoelten", address: "live.lerncraft.xyz:25569" },
    { name: "mc-hakstpoelten", address: "live.lerncraft.xyz:25570" },
    { name: "mc-basop-bafep-stp", address: "live.lerncraft.xyz:25571" },
    { name: "mc-play", address: "live.lerncraft.xyz:25572" }
];

async function checkServerStatus() {
    const serverList = document.getElementById('server-list');
    serverList.innerHTML = ''; // Clear existing list

    for (const server of servers) {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';

        try {
            const response = await fetch(`https://api.mcsrvstat.us/2/${server.address}`);
            const data = await response.json();

            if (data.online) {
                listItem.innerHTML = `
                    ${server.name}
                    <span class="badge bg-success">Online</span>
                    <span>Players: ${data.players.online}/${data.players.max}</span>
                `;
            } else {
                listItem.innerHTML = `
                    ${server.name}
                    <span class="badge bg-danger">Offline</span>
                `;
            }
        } catch (error) {
            listItem.innerHTML = `
                ${server.name}
                <span class="badge bg-warning">Error</span>
            `;
        }
        serverList.appendChild(listItem);
    }
}

// Run on page load
checkServerStatus();

// Update every 15 minutes
setInterval(checkServerStatus, 15 * 60 * 1000);
