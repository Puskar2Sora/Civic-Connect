// --- 1. Your Unique Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyD_HHHm5JU-SYoxr3pKbQoLS1Fh58wxNRo",
  authDomain: "civic-k.firebaseapp.com",
  projectId: "civic-k",
  storageBucket: "civic-k.firebasestorage.app",
  messagingSenderId: "1025366232937",
  appId: "1:1025366232937:web:adbfc8c908a4b6e2db77f8",
  measurementId: "G-1T8NFL6HRB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
console.log("🔥 Firebase Initialized successfully!");
// --- 2. Map Picker Initialization ---
let map, marker;
const initialPos = [22.5726, 88.3639]; // Kolkata Center

if (document.getElementById('map')) {
    map = L.map('map').setView(initialPos, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // FIX: This solves the "White Box" issue seen in your previous screenshot
    setTimeout(() => {
        map.invalidateSize();
    }, 500);

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

// --- 3. Submit Complaint to Firebase Firestore ---
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
            },
            status: "Pending", // Default status
            createdAt: firebase.firestore.FieldValue.serverTimestamp() // Auto-timestamp
        };

        try {
            // Save directly to 'complaints' collection in Cloud Firestore
            await db.collection("complaints").add(complaintData);

            document.getElementById("complaintMessage").innerHTML = `
                <div style="background: #dcfce7; padding: 15px; border-radius: 12px; border: 1px solid #16a34a; color: #16a34a; text-align: center;">
                    <strong>Success!</strong> Complaint saved to Firebase Cloud.
                </div>`;
            complaintForm.reset();
        } catch (error) {
            console.error("Firebase Error:", error);
            alert("Error saving to cloud. Make sure Firestore rules are set to 'test mode'.");
        }
    });
}

// --- 4. Admin Dashboard (Real-time Sync) ---
const complaintList = document.getElementById("complaintList");
if (complaintList) {
    // onSnapshot ensures the list updates automatically when new data arrives
    db.collection("complaints").orderBy("createdAt", "desc").onSnapshot((querySnapshot) => {
        complaintList.innerHTML = "";
        querySnapshot.forEach((doc) => {
            const c = doc.data();
            const id = doc.id;
            
            const li = document.createElement("li");
            li.innerHTML = `
                <div class="card-info">
                    <strong>${c.type}</strong> by ${c.name}<br>
                    <span>Location: ${c.location.lat.toFixed(4)}, ${c.location.lng.toFixed(4)}</span><br>
                    <small>Status: ${c.status}</small>
                </div>
                ${c.status === 'Pending' ? `<button onclick="resolve('${id}')">Resolve</button>` : '✅'}
            `;
            complaintList.appendChild(li);
        });
    });
}

async function resolve(id) {
    await db.collection("complaints").doc(id).update({ status: "Resolved" });
}