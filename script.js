// ==========================================
// 1. UTILITY FUNCTIONS
// ==========================================

/**
 * Generates a random ID with a specific prefix
 */
function generateId(prefix) { 
    return prefix + Math.floor(Math.random() * 1000000); 
}

/**
 * Retrieves data from localStorage
 */
function getData(key) { 
    return JSON.parse(localStorage.getItem(key)) || []; 
}

/**
 * Saves data to localStorage
 */
function saveData(key, data) { 
    localStorage.setItem(key, JSON.stringify(data)); 
}


// ==========================================
// 2. COMPLAINT PAGE LOGIC
// ==========================================
const complaintForm = document.getElementById("complaintForm");

if (complaintForm) {
    complaintForm.addEventListener("submit", function (e) {
        e.preventDefault();

        // Creating the complaint object with a "Pending" status
        const complaint = {
            id: generateId("CIV"),
            name: document.getElementById("name").value,
            type: document.getElementById("type").value,
            description: document.getElementById("description").value,
            status: "Pending",
            createdAt: new Date().toLocaleDateString() // Using user's preferred date format
        };

        // Save to the complaints array
        const complaints = getData("complaints");
        complaints.push(complaint);
        saveData("complaints", complaints);

        // Visual Success Feedback with styled alert box
        const messageArea = document.getElementById("complaintMessage");
        if (messageArea) {
            messageArea.innerHTML = `
                <div style="background: #dcfce7; padding: 15px; border-radius: 10px; margin-top: 20px; border: 1px solid #16a34a; text-align: center;">
                    <p style="color: #16a34a; font-weight: bold;">Success! Tracking ID: <strong>${complaint.id}</strong></p>
                    <p style="color: #16a34a; font-size: 0.85rem;">Please keep this ID for your records.</p>
                </div>
            `;
        }

        complaintForm.reset();
    });
}


// ==========================================
// 3. PAYMENT PAGE LOGIC
// ==========================================
const paymentForm = document.getElementById("paymentForm");

if (paymentForm) {
    paymentForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const payment = {
            transactionId: generateId("TXN"),
            consumerNumber: document.getElementById("consumerNumber").value,
            billType: document.getElementById("billType").value,
            amount: document.getElementById("amount").value,
            status: "Success",
            createdAt: new Date().toLocaleDateString()
        };

        const payments = getData("payments");
        payments.push(payment);
        saveData("payments", payments);

        // Visual Success Feedback for payments
        const messageArea = document.getElementById("paymentMessage");
        if (messageArea) {
            messageArea.innerHTML = `
                <div style="background: #e0f2fe; padding: 15px; border-radius: 10px; margin-top: 20px; border: 1px solid #3b82f6; text-align: center;">
                    <p style="color: #2563eb; font-weight: bold;">Payment Successful!</p>
                    <p style="color: #2563eb; font-size: 0.85rem;">Transaction ID: <strong>${payment.transactionId}</strong></p>
                </div>
            `;
        }

        paymentForm.reset();
    });
}


// ==========================================
// 4. ADMIN DASHBOARD LOGIC
// ==========================================
const complaintList = document.getElementById("complaintList");
const paymentList = document.getElementById("paymentList");

if (complaintList || paymentList) {
    const complaints = getData("complaints");
    const payments = getData("payments");

    // Update count badges if they exist in the HTML
    const compCount = document.getElementById("complaintCount");
    const payCount = document.getElementById("paymentCount");
    if (compCount) compCount.innerText = complaints.length;
    if (payCount) payCount.innerText = payments.length;

    // Show Complaints with structured HTML for scannability
    if (complaintList) {
        complaints.forEach(c => {
            const li = document.createElement("li");
            li.innerHTML = `
                <b>ID: ${c.id}</b>
                <span><strong>User:</strong> ${c.name}</span><br>
                <span><strong>Type:</strong> ${c.type}</span><br>
                <span><strong>Issue:</strong> ${c.description}</span><br>
                <span style="display:inline-block; margin-top:5px; color: #f59e0b;">● Status: ${c.status}</span>
            `;
            complaintList.appendChild(li);
        });
    }

    // Show Payments with structured HTML
    if (paymentList) {
        payments.forEach(p => {
            const li = document.createElement("li");
            li.innerHTML = `
                <b>TXN: ${p.transactionId}</b>
                <span><strong>Consumer:</strong> ${p.consumerNumber}</span><br>
                <span><strong>Service:</strong> ${p.billType}</span><br>
                <span><strong>Amount:</strong> ₹${p.amount}</span><br>
                <span style="color: #16a34a;">✓ Status: ${p.status}</span>
            `;
            paymentList.appendChild(li);
        });
    }
}