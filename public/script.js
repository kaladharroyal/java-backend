document.addEventListener('DOMContentLoaded', () => {
    // === NAVIGATION LOGIC ===
    // Select all navigation buttons and content views
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');
    const pageTitle = document.getElementById('page-title');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');

            // 1. Update Active State of Buttons (highlight the clicked one)
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 2. Switch Visibility of Views (show only the target section)
            views.forEach(v => v.classList.remove('active'));
            document.getElementById(target).classList.add('active');

            // 3. Update the Page Header Title
            pageTitle.textContent = btn.textContent;

            // 4. Trigger Data Refresh when moving to Dashboard or Student List
            if (target === 'view-students' || target === 'dashboard') {
                fetchStudents();
            }
        });
    });

    // === API CALL: ADD STUDENT (POST) ===
    const studentForm = document.getElementById('student-form');
    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Stop the page from reloading on submit

        // Collect all data from the form fields
        const student = {
            register_number: document.getElementById('regNum').value,
            name: document.getElementById('name').value,
            department: document.getElementById('dept').value,
            year: document.getElementById('year').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value
        };

        try {
            // API CALL: Send a POST request to '/api/students' with the student data as JSON
            const response = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(student)
            });

            if (response.ok) {
                alert('Student added successfully!');
                studentForm.reset(); // Clear the form
                fetchStudents();     // Refresh the list in the background
            } else {
                const error = await response.text();
                alert('Error: ' + error);
            }
        } catch (err) {
            alert('Failed to connect to server');
        }
    });

    // === API CALL: FETCH ALL STUDENTS (GET) ===
    async function fetchStudents() {
        try {
            // API CALL: Send a GET request to retrieve the full list of students
            const response = await fetch('/api/students');
            const students = await response.json();

            // Send the data to helper functions to update the UI
            updateTable(students);
            updateDashboard(students);
        } catch (err) {
            console.error('Failed to fetch students:', err);
        }
    }

    // Helper: Build the HTML Table from the student data list
    function updateTable(students) {
        const tableBody = document.getElementById('student-table-body');
        tableBody.innerHTML = ''; // Clear old rows

        students.forEach(s => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${s.register_number}</td>
                <td>${s.name}</td>
                <td>${s.department}</td>
                <td>${s.year}</td>
                <td>${s.phone}</td>
                <td>${s.email}</td>
                <td>
                    <button class="edit-btn" onclick="editStudent('${s.register_number}')">Edit</button>
                    <button class="delete-btn" onclick="deleteStudent('${s.register_number}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Helper: Update the number on the dashboard stat cards
    function updateDashboard(students) {
        document.getElementById('total-count').textContent = students.length;
    }

    // Refresh Button Listener
    document.getElementById('refresh-btn').addEventListener('click', fetchStudents);

    // === UPDATE STUDENT LOGIC ===

    // Search button: Find a student by register number and fill the update form
    document.getElementById('search-btn').addEventListener('click', async () => {
        const reg = document.getElementById('searchReg').value.trim();
        if (!reg) {
            alert('Please enter a register number');
            return;
        }

        try {
            const response = await fetch('/api/students');
            const students = await response.json();
            const student = students.find(s => s.register_number === reg);

            if (student) {
                // Fill the update form with the student's current data
                document.getElementById('updateRegNum').value = student.register_number;
                document.getElementById('updateName').value = student.name;
                document.getElementById('updateDept').value = student.department;
                document.getElementById('updateYear').value = student.year;
                document.getElementById('updatePhone').value = student.phone;
                document.getElementById('updateEmail').value = student.email;
                document.getElementById('update-form').style.display = 'block';
            } else {
                alert('Student not found with register number: ' + reg);
                document.getElementById('update-form').style.display = 'none';
            }
        } catch (err) {
            alert('Failed to connect to server');
        }
    });

    // Cancel button: Hide the update form
    document.getElementById('cancel-update-btn').addEventListener('click', () => {
        document.getElementById('update-form').style.display = 'none';
        document.getElementById('searchReg').value = '';
    });

    // Update form submission: Send PUT request
    const updateForm = document.getElementById('update-form');
    updateForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const student = {
            register_number: document.getElementById('updateRegNum').value,
            name: document.getElementById('updateName').value,
            department: document.getElementById('updateDept').value,
            year: document.getElementById('updateYear').value,
            phone: document.getElementById('updatePhone').value,
            email: document.getElementById('updateEmail').value
        };

        try {
            // API CALL: Send a PUT request to '/api/students' with updated data
            const response = await fetch('/api/students', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(student)
            });

            if (response.ok) {
                alert('Student updated successfully!');
                updateForm.style.display = 'none';
                document.getElementById('searchReg').value = '';
                fetchStudents(); // Refresh the list
            } else {
                const error = await response.text();
                alert('Error: ' + error);
            }
        } catch (err) {
            alert('Failed to connect to server');
        }
    });

    // Initial Load: Populates data as soon as the website opens
    fetchStudents();
});

// === API CALL: DELETE STUDENT (DELETE) ===
// This function is global so it can be called from the HTML buttons in the table
async function deleteStudent(regNum) {
    if (!confirm(`Are you sure you want to delete student ${regNum}?`)) return;

    try {
        // API CALL: Send a DELETE request with the student ID as a URL parameter (?id=...)
        const response = await fetch(`/api/students?id=${regNum}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Student deleted successfully');
            location.reload(); // Refresh the page to show the updated list
        } else {
            alert('Failed to delete student');
        }
    } catch (err) {
        alert('Error connecting to server');
    }
}

// === EDIT STUDENT (called from table Edit button) ===
// This function navigates to the Update Student view and pre-fills the form
async function editStudent(regNum) {
    // Switch to the Update Student view
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');
    const pageTitle = document.getElementById('page-title');

    navButtons.forEach(b => b.classList.remove('active'));
    views.forEach(v => v.classList.remove('active'));

    // Activate the update-student nav button and view
    navButtons.forEach(b => {
        if (b.getAttribute('data-target') === 'update-student') {
            b.classList.add('active');
        }
    });
    document.getElementById('update-student').classList.add('active');
    pageTitle.textContent = 'Update Student';

    // Set the register number in the search field
    document.getElementById('searchReg').value = regNum;

    // Fetch the student data and fill the form
    try {
        const response = await fetch('/api/students');
        const students = await response.json();
        const student = students.find(s => s.register_number === regNum);

        if (student) {
            document.getElementById('updateRegNum').value = student.register_number;
            document.getElementById('updateName').value = student.name;
            document.getElementById('updateDept').value = student.department;
            document.getElementById('updateYear').value = student.year;
            document.getElementById('updatePhone').value = student.phone;
            document.getElementById('updateEmail').value = student.email;
            document.getElementById('update-form').style.display = 'block';
        }
    } catch (err) {
        alert('Failed to load student data');
    }
}
