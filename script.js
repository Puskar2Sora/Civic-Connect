// --- script.js ---
const API_URL = "http://localhost:5000/api";

// --- 1. Map Picker Initialization ---
let map, marker;
const initialPos = [22.5726, 88.3639]; // Kolkata Center

if (document.getElementById('map')) {
    map = L.map('map').setView(initialPos, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Create the draggable picker
    marker = L.marker(initialPos, { draggable: true }).addTo(map);

    // Sync coordinates when dragging stops
    marker.on('dragend', () => {
        const pos = marker.getLatLng();
        document.getElementById('lat').value = pos.lat;
        document.getElementById('lng').value = pos.lng;
    });

    // Move pin on map click
    map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        document.getElementById('lat').value = e.latlng.lat;
        document.getElementById('lng').value = e.latlng.lng;
    });
}

// --- 2. Complaint Submission (To Backend) ---
const complaintForm = document.getElementById("complaintForm");
if (complaintForm) {
    complaintForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const complaintData = {
            name: document.getElementById("name").value,
            type: document.getElementById("type").value,
            description: document.getElementById("description").value,
            location: {
                lat: parseFloat(document.getElementById('lat').value) || marker.getLatLng().lat,
                lng: parseFloat(document.getElementById('lng').value) || marker.getLatLng().lng
            }
        };

        try {
            const response = await fetch(`${API_URL}/complaints`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(complaintData)
            });

            if (response.ok) {
                const result = await response.json();
                document.getElementById("complaintMessage").innerHTML = `
                    <div style="background: #dcfce7; padding: 15px; border-radius: 12px; border: 1px solid #16a34a; color: #16a34a; text-align: center;">
                        <strong>Success!</strong> Filed at Location: ${complaintData.location.lat.toFixed(4)}, ${complaintData.location.lng.toFixed(4)}
                    </div>`;
                complaintForm.reset();
            }
        } catch (error) {
            console.error("Connection lost to Express server.");
        }
    });
}

// --- 3. Admin Dashboard (Load from Backend) ---
const complaintList = document.getElementById("complaintList");
if (complaintList) {
    window.addEventListener('load', loadAdminData);
}

async function loadAdminData() {
    try {
        const response = await fetch(`${API_URL}/admin/complaints`);
        const data = await response.json();

        complaintList.innerHTML = data.map(c => `
            <li>
                <div class="card-info">
                    <strong>${c.type}</strong> by ${c.name}<br>
                    <span>Coordinates: ${c.location.lat.toFixed(4)}, ${c.location.lng.toFixed(4)}</span><br>
                    <small>Status: ${c.status}</small>
                </div>
                ${c.status === 'Pending' ? `<button onclick="resolve('${c._id}')">Resolve</button>` : '✅'}
            </li>
        `).join('');
    } catch (err) {
        console.log("Error loading dashboard data.");
    }
}

async function resolve(id) {
    await fetch(`${API_URL}/admin/resolve/${id}`, { method: 'PATCH' });
    loadAdminData(); // Refresh list
}