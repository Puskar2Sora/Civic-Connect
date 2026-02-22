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
// Add this to the bottom of your existing script.js

const adminMapElement = document.getElementById('adminMap');
const adminList = document.getElementById('adminComplaintList');

if (adminMapElement) {
    // 1. Initialize Admin Master Map
    const adminMap = L.map('adminMap').setView([22.5726, 88.3639], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(adminMap);

    // 2. Real-time Listener for Firestore
    db.collection("complaints").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        adminList.innerHTML = "";
        let pendingCount = 0;

        // Clear existing markers before redraw if necessary
        // (For simplicity in this version, markers are added once per snapshot)
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const id = doc.id;

            if (data.status === "Pending") pendingCount++;

            // A. Add Marker to Map
            const markerColor = data.status === "Pending" ? "red" : "green";
            L.marker([data.location.lat, data.location.lng]).addTo(adminMap)
                .bindPopup(`<b>${data.type}</b><br>${data.description}`);

            // B. Add Card to List
            const li = document.createElement("li");
            li.className = "admin-card";
            li.innerHTML = `
                <span class="status-badge status-${data.status.toLowerCase()}">${data.status}</span>
                <h3>${data.type}</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin: 10px 0;">
                    ${data.description}
                </p>
                <div style="font-size: 0.8rem; font-weight: 600;">
                     ${data.location.lat.toFixed(4)}, ${data.location.lng.toFixed(4)}
                </div>
                ${data.status === "Pending" ? `<button class="resolve-btn" onclick="resolveIssue('${id}')">Mark as Fixed</button>` : ""}
            `;
            adminList.appendChild(li);
        });

        document.getElementById('activeCount').innerText = pendingCount;
    });
}

// Global function to update Firestore status
window.resolveIssue = async function(id) {
    try {
        await db.collection("complaints").doc(id).update({
            status: "Resolved"
        });
        console.log("Issue resolved in Cloud!");
    } catch (error) {
        console.error("Error updating status:", error);
    }
}

// --- script.js: Public Transparency Feed ---
const publicHistoryFeed = document.getElementById('publicHistoryFeed');

if (publicHistoryFeed) {
    // 1. Fetch only RESOLVED issues to show the public
    db.collection("complaints")
      .where("status", "==", "Resolved")
      .orderBy("createdAt", "desc")
      .limit(5) // Show the 5 most recent achievements
      .onSnapshot((snapshot) => {
        publicHistoryFeed.innerHTML = "";
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const dateStr = data.createdAt ? data.createdAt.toDate().toLocaleDateString() : "Today";

            // Create the "Success" Card
            const card = document.createElement("div");
            card.className = "success-slide"; // New class for the animation
            card.innerHTML = `
                <div class="success-header">
                    <span class="confetti">🎉</span>
                    <span class="status-tag">GOVERNMENT AT WORK</span>
                </div>
                <h4>${data.type} Resolved</h4>
                <p>${data.description}</p>
                <div class="success-footer">
                    <span>📍 ${data.location.lat.toFixed(2)}, ${data.location.lng.toFixed(2)}</span>
                    <span class="success-date">Completed on ${dateStr}</span>
                </div>
            `;
            publicHistoryFeed.appendChild(card);
        });
    });
}

// --- script.js: Public History Feed Fix ---
const historyFeed = document.getElementById('publicHistoryFeed');

if (historyFeed) {
    // 1. Fetch RESOLVED items
    db.collection("complaints")
      .where("status", "==", "Resolved")
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot) => {
        historyFeed.innerHTML = "";
        
        let docs = [];
        snapshot.forEach(doc => docs.push(doc.data()));
        
        // Loop twice for seamless marquee
        const loopData = [...docs, ...docs];

        loopData.forEach((data) => {
            const dateStr = data.createdAt ? data.createdAt.toDate().toLocaleDateString() : "Just Now";
            const card = document.createElement("div");
            card.className = "history-card";
            card.innerHTML = `
                <div style="font-size: 0.7rem; color: #16a34a; font-weight: 800; margin-bottom: 5px;">
                    ✅ FIXED ON ${dateStr}
                </div>
                <h4 style="margin-bottom: 5px;">${data.type}</h4>
                <p style="font-size: 0.8rem; color: #64748b;">${data.description}</p>
            `;
            historyFeed.appendChild(card);
        });
    }, (error) => {
        console.error("Firestore Index needed! Click the link in the console error.");
    });
}