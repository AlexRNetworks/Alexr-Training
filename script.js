document.addEventListener('DOMContentLoaded', () => {
    // =================================================================================
    // --- STATE MANAGEMENT ---
    // =================================================================================
    let cameras = [
        { id: 1, name: 'Lobby Cam', ip: '192.168.1.100', model: 'IPD-5MP-IR', status: 'Online', username: 'admin', password: 'password' },
        { id: 2, name: 'Parking Lot 1', ip: '192.168.1.102', model: 'IPT-8MP-Z', status: 'Offline', username: 'admin', password: 'password' },
        { id: 3, name: 'Side Entrance', ip: '192.168.1.105', model: 'IPB-2MP-VF', status: 'Auth Error', username: 'admin', password: 'wrongpassword' },
    ];
    let networkConfig = { mode: 'dhcp', ip: '192.168.1.10', subnet: '255.255.255.0', gateway: '192.168.1.1' };
    let eventLog = [];
    let currentTaskIndex = 0;
    let highlightTimer;

    // =================================================================================
    // --- GUIDED TASKS ---
    // =================================================================================
    const tasks = [
        { 
            id: 1, 
            description: "The 'Parking Lot 1' camera is offline. Find it in the Device Management list and use the 'Reboot' action to bring it back online.",
            highlightSelector: "[data-target='devices'] a",
            isComplete: (state) => state.cameras.find(c => c.ip === '192.168.1.102')?.status === 'Online',
        },
        { 
            id: 2, 
            description: "The 'Side Entrance' camera has an authentication error. The correct password is 'Password123!'. Edit the camera and update the password.",
            highlightSelector: `tr[data-ip='192.168.1.105'] .btn-edit`,
            isComplete: (state) => state.cameras.find(c => c.ip === '192.168.1.105')?.status === 'Online',
        },
        {
            id: 3,
            description: "A new 'Warehouse' camera is ready. Its IP is 192.168.1.120, username 'admin', password 'Password123!'. Add it.",
            highlightSelector: "#add-camera-btn",
            isComplete: (state) => state.cameras.some(c => c.ip === '192.168.1.120'),
        },
        { 
            id: 4, 
            description: "To improve network stability, the NVR needs a static IP. Go to Network Settings and configure it with the IP 192.168.1.250.",
            highlightSelector: "[data-target='network'] a",
            isComplete: (state) => state.networkConfig.mode === 'static' && state.networkConfig.ip === '192.168.1.250',
        },
        {
            id: 5,
            description: "All critical tasks are complete! You're doing great. Feel free to explore the system.",
            highlightSelector: null,
            isComplete: () => false,
        }
    ];

    // =================================================================================
    // --- DOM ELEMENT SELECTORS ---
    // =================================================================================
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const deviceListBody = document.getElementById('device-list');
    const cameraGrid = document.getElementById('camera-grid');
    const eventLogList = document.getElementById('event-log-list');
    
    // Modals & Forms
    const addCameraModal = document.getElementById('add-camera-modal');
    const editCameraModal = document.getElementById('edit-camera-modal');
    const addCameraForm = document.getElementById('add-camera-form');
    const editCameraForm = document.getElementById('edit-camera-form');

    // Buttons
    const addCameraButton = document.getElementById('add-camera-btn');
    const cancelAddButton = document.getElementById('cancel-add-btn');
    const cancelEditButton = document.getElementById('cancel-edit-btn');
    const scanNetworkButton = document.getElementById('scan-network-btn');
    
    // Network Settings Form
    const networkForm = document.getElementById('network-form');
    const ipTypeSelect = document.getElementById('ip-type');
    const ipAddressInput = document.getElementById('ip-address');
    const subnetMaskInput = document.getElementById('subnet-mask');
    const gatewayInput = document.getElementById('gateway');

    // Task & Feedback UI
    const taskText = document.getElementById('task-text');
    const taskFeedback = document.getElementById('task-feedback');
    const toastContainer = document.getElementById('toast-container');


    // =================================================================================
    // --- CORE FUNCTIONS ---
    // =================================================================================

    /** Logs an event to the state and re-renders the event log */
    const logEvent = (message, type = 'SYSTEM') => {
        const timestamp = new Date().toLocaleTimeString();
        eventLog.unshift({ timestamp, message, type });
        if (eventLog.length > 100) eventLog.pop(); // Keep log from getting too long
        renderEventLog();
    };
    
    /** Displays a toast notification */
    const showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10); // Trigger transition
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 4000);
    };
    
    /** A single function to render all dynamic components of the UI */
    const renderAll = () => {
        renderDeviceList();
        renderCameraGrid();
        renderNetworkSettings();
        renderEventLog();
        renderTask();
    };

    // =================================================================================
    // --- RENDER FUNCTIONS ---
    // =================================================================================

    const renderDeviceList = () => {
        deviceListBody.innerHTML = '';
        cameras.forEach(cam => {
            const statusClass = cam.status.toLowerCase().replace(' ', '-');
            const row = document.createElement('tr');
            row.dataset.ip = cam.ip; // For targeting in tasks
            row.innerHTML = `
                <td><span class="status-indicator ${statusClass}"></span>${cam.status}</td>
                <td>${cam.name}</td>
                <td>${cam.ip}</td>
                <td>${cam.model}</td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm btn-reboot" data-id="${cam.id}">Reboot</button>
                    <button class="btn btn-secondary btn-sm btn-edit" data-id="${cam.id}">Edit</button>
                </td>
            `;
            deviceListBody.appendChild(row);
        });
    };

    const renderCameraGrid = () => {
        cameraGrid.innerHTML = '';
        cameras.forEach(cam => {
            const feed = document.createElement('div');
            feed.className = `camera-feed ${cam.status !== 'Online' ? 'offline' : ''}`;
            const kittenId = (cam.id % 16) + 1;
            feed.innerHTML = `
                ${cam.status !== 'Online' ? `<div class="offline-overlay">${cam.status}</div>` : ''}
                <img src="https://placekitten.com/400/225?image=${kittenId}" alt="${cam.name}">
                <div class="info">${cam.name}</div>
            `;
            cameraGrid.appendChild(feed);
        });
    };

    const renderNetworkSettings = () => {
        ipTypeSelect.value = networkConfig.mode;
        ipAddressInput.value = networkConfig.ip;
        subnetMaskInput.value = networkConfig.subnet;
        gatewayInput.value = networkConfig.gateway;
        const isStatic = networkConfig.mode === 'static';
        ipAddressInput.disabled = !isStatic;
        subnetMaskInput.disabled = !isStatic;
        gatewayInput.disabled = !isStatic;
    };
    
    const renderEventLog = () => {
        eventLogList.innerHTML = eventLog.map(e => `
            <li>
                <span class="event-time">${e.timestamp}</span>
                <span class="event-type-${e.type}">${e.type}</span>
                <span>${e.message}</span>
            </li>
        `).join('');
    };
    
    const renderTask = () => {
        const currentTask = tasks[currentTaskIndex];
        taskText.textContent = currentTask.description;
        taskFeedback.style.display = 'none';
        applyHelpHighlight();
    };
    
    // =================================================================================
    // --- GUIDED HELP LOGIC ---
    // =================================================================================
    
    const applyHelpHighlight = () => {
        removeHelpHighlight(); // Clear previous highlights
        const selector = tasks[currentTaskIndex].highlightSelector;
        if (selector) {
            highlightTimer = setTimeout(() => {
                const element = document.querySelector(selector);
                if (element) {
                    element.classList.add('highlight-help');
                }
            }, 500); // Small delay to make it feel more natural
        }
    };

    const removeHelpHighlight = () => {
        clearTimeout(highlightTimer);
        const highlighted = document.querySelector('.highlight-help');
        if (highlighted) {
            highlighted.classList.remove('highlight-help');
        }
    };

    // =================================================================================
    // --- EVENT HANDLERS & LOGIC ---
    // =================================================================================

    const checkTaskCompletion = () => {
        const currentTask = tasks[currentTaskIndex];
        if (currentTask.isComplete({ cameras, networkConfig })) {
            removeHelpHighlight();
            showToast(currentTask.description.split('.')[0], 'success');
            logEvent(`Task ${currentTask.id} completed.`, 'SUCCESS');
            
            if (currentTaskIndex < tasks.length - 1) {
                currentTaskIndex++;
                setTimeout(renderTask, 1500); // Wait before showing next task
            }
        }
    };

    // Navigation
    navItems.forEach(item => item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = e.currentTarget.dataset.target;
        navItems.forEach(i => i.classList.remove('active'));
        e.currentTarget.classList.add('active');
        contentSections.forEach(s => s.classList.toggle('active', s.id === targetId));
    }));

    // Modals
    const toggleModal = (modal, show) => {
        if (show) modal.classList.remove('hidden');
        else modal.classList.add('hidden');
    };

    addCameraButton.addEventListener('click', () => toggleModal(addCameraModal, true));
    cancelAddButton.addEventListener('click', () => toggleModal(addCameraModal, false));
    cancelEditButton.addEventListener('click', () => toggleModal(editCameraModal, false));

    // Device Actions (Reboot, Edit)
    deviceListBody.addEventListener('click', (e) => {
        const target = e.target;
        const id = parseInt(target.dataset.id);
        const camera = cameras.find(c => c.id === id);

        if (target.classList.contains('btn-reboot')) {
            if (!camera) return;
            logEvent(`Rebooting camera '${camera.name}'...`);
            camera.status = 'Offline';
            renderAll();
            showToast(`Rebooting ${camera.name}...`);
            setTimeout(() => {
                camera.status = 'Online';
                logEvent(`Camera '${camera.name}' is back online.`, 'SUCCESS');
                showToast(`${camera.name} is now online.`, 'success');
                renderAll();
                checkTaskCompletion();
            }, 2500); // Simulate reboot time
        }
        
        if (target.classList.contains('btn-edit')) {
             if (!camera) return;
             document.getElementById('edit-cam-id').value = camera.id;
             document.getElementById('edit-cam-name').value = camera.name;
             document.getElementById('edit-cam-ip').value = camera.ip;
             document.getElementById('edit-cam-user').value = camera.username;
             document.getElementById('edit-cam-pass').value = ''; // Don't show old password
             toggleModal(editCameraModal, true);
        }
    });

    // Form Submissions
    addCameraForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newCamera = {
            id: cameras.length > 0 ? Math.max(...cameras.map(c => c.id)) + 1 : 1,
            name: document.getElementById('cam-name').value,
            ip: document.getElementById('cam-ip').value,
            model: 'IPC-Generic-5MP',
            status: 'Online',
            username: document.getElementById('cam-user').value,
            password: document.getElementById('cam-pass').value
        };

        if (cameras.some(c => c.ip === newCamera.ip)) {
            showToast('A camera with this IP already exists.', 'error');
            return;
        }

        cameras.push(newCamera);
        logEvent(`Added camera '${newCamera.name}' (${newCamera.ip}).`, 'SUCCESS');
        showToast(`Camera '${newCamera.name}' added.`, 'success');
        toggleModal(addCameraModal, false);
        addCameraForm.reset();
        renderAll();
        checkTaskCompletion();
    });

    editCameraForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('edit-cam-id').value);
        const camera = cameras.find(c => c.id === id);
        if(!camera) return;

        camera.name = document.getElementById('edit-cam-name').value;
        camera.username = document.getElementById('edit-cam-user').value;
        camera.password = document.getElementById('edit-cam-pass').value;

        // Simulate checking credentials
        if (camera.ip === '192.168.1.105' && camera.password === 'Password123!') {
             camera.status = 'Online';
             logEvent(`Correct credentials entered for '${camera.name}'. Status is now Online.`, 'SUCCESS');
        } else {
            logEvent(`Credentials updated for '${camera.name}'.`, 'SYSTEM');
        }

        showToast(`'${camera.name}' settings have been updated.`, 'success');
        toggleModal(editCameraModal, false);
        renderAll();
        checkTaskCompletion();
    });

    networkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        networkConfig.mode = ipTypeSelect.value;
        if (networkConfig.mode === 'static') {
            networkConfig.ip = ipAddressInput.value;
            networkConfig.subnet = subnetMaskInput.value;
            networkConfig.gateway = gatewayInput.value;
        }
        logEvent(`NVR network settings updated. Mode: ${networkConfig.mode.toUpperCase()}.`);
        showToast('Network settings saved!', 'success');
        renderNetworkSettings();
        checkTaskCompletion();
    });
    
    ipTypeSelect.addEventListener('change', (e) => {
        const isStatic = e.target.value === 'static';
        ipAddressInput.disabled = !isStatic;
        subnetMaskInput.disabled = !isStatic;
        gatewayInput.disabled = !isStatic;
    });

    scanNetworkButton.addEventListener('click', () => {
        showToast('Scanning network... 1 device found.', 'info');
        document.getElementById('cam-name').value = 'Found Patio Cam';
        document.getElementById('cam-ip').value = '192.168.1.130';
        document.getElementById('cam-pass').value = 'default_pass';
    });


    // =================================================================================
    // --- INITIALIZATION ---
    // =================================================================================
    const init = () => {
        logEvent('System initialized. VMS_Lab_Pro v2.0 running.');
        logEvent("Camera 'Parking Lot 1' has lost connection.", 'ERROR');
        logEvent("Authentication failed for camera 'Side Entrance'.", 'ERROR');
        renderAll();
    };

    init();
});
