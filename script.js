document.addEventListener('DOMContentLoaded', () => {
    // =================================================================================
    // --- STATE MANAGEMENT (v3.0 Final) ---
    // =================================================================================
    const state = {
        cameras: [
            { id: 1, name: 'Lobby Cam', ip: '192.168.1.100', gateway: '192.168.1.1', model: 'IPD-5MP-IR', status: 'Online', username: 'admin', password: 'password', recMode: 'Continuous' },
            { id: 2, name: 'Parking Lot 1', ip: '192.168.1.102', gateway: '192.168.1.1', model: 'IPT-8MP-Z', status: 'Offline', username: 'admin', password: 'password', recMode: 'Continuous' },
            { id: 3, name: 'Side Entrance', ip: '192.168.1.105', gateway: '192.168.1.1', model: 'IPB-2MP-VF', status: 'Auth Error', username: 'admin', password: 'wrongpassword', recMode: 'Continuous' },
        ],
        users: [
            { id: 1, username: 'admin', role: 'Administrator', status: 'Active' }
        ],
        networkConfig: { mode: 'dhcp', ip: '192.168.1.10', subnet: '255.255.255.0', gateway: '192.168.1.1' },
        eventLog: [],
        guidedTasks: {
            tasks: [
                { id: 1, description: "The 'Parking Lot 1' camera is offline. Find it in Device Management and use the 'Reboot' action to bring it back online.", highlightSelector: "[data-target='devices'] a", isComplete: (s) => s.cameras.find(c => c.ip === '192.168.1.102')?.status === 'Online' },
                { id: 2, description: "The 'Side Entrance' camera has an authentication error. The correct password is 'Password123!'. Edit the camera and update the password.", highlightSelector: `tr[data-ip='192.168.1.105'] .btn-edit`, isComplete: (s) => s.cameras.find(c => c.ip === '192.168.1.105')?.status === 'Online' },
                { id: 3, description: "The 'Lobby Cam' is using too much storage. Edit it and change its Recording Mode to 'On Motion'.", highlightSelector: `tr[data-ip='192.168.1.100'] .btn-edit`, isComplete: (s) => s.cameras.find(c => c.ip === '192.168.1.100')?.recMode === 'Motion' },
                { id: 4, description: "Create a new user for a junior tech. Go to User Management, add a user named 'operator' with the role 'Operator'.", highlightSelector: "[data-target='users'] a", isComplete: (s) => s.users.some(u => u.username === 'operator' && u.role === 'Operator') },
                { id: 5, description: "Add a camera for the secure VLAN 20. Name: 'Secure Cam', IP: '192.168.20.50', Gateway: '192.168.20.1'.", highlightSelector: "#add-camera-btn", isComplete: (s) => s.cameras.some(c => c.ip === '192.168.20.50') },
                { id: 6, description: "All guided tasks complete! The lab is now in 'Explore Mode'. The hint system is active if you make a mistake.", highlightSelector: null, isComplete: () => false },
            ],
            currentTaskIndex: 0,
            isComplete: false,
        },
        hintSystem: {
            currentHint: null,
            popupVisible: false,
            timeoutId: null,
        },
    };

    // =================================================================================
    // --- DOM SELECTORS ---
    // =================================================================================
    const dom = {
        // Navigation & Content
        navItems: document.querySelectorAll('.nav-item'),
        contentSections: document.querySelectorAll('.content-section'),
        // Tables
        deviceListBody: document.getElementById('device-list'),
        userListBody: document.getElementById('user-list'),
        // Views
        cameraGrid: document.getElementById('camera-grid'),
        eventLogList: document.getElementById('event-log-list'),
        // Modals
        addCameraModal: document.getElementById('add-camera-modal'),
        editCameraModal: document.getElementById('edit-camera-modal'),
        addUserModal: document.getElementById('add-user-modal'),
        // Forms
        addCameraForm: document.getElementById('add-camera-form'),
        editCameraForm: document.getElementById('edit-camera-form'),
        addUserForm: document.getElementById('add-user-form'),
        networkForm: document.getElementById('network-form'),
        // Network Form Fields
        ipTypeSelect: document.getElementById('ip-type'),
        ipAddressInput: document.getElementById('ip-address'),
        subnetMaskInput: document.getElementById('subnet-mask'),
        gatewayInput: document.getElementById('gateway'),
        // Buttons
        addCamBtn: document.getElementById('add-camera-btn'),
        cancelAddCamBtn: document.getElementById('cancel-add-btn'),
        cancelEditCamBtn: document.getElementById('cancel-edit-btn'),
        addUserBtn: document.getElementById('add-user-btn'),
        cancelUserBtn: document.getElementById('cancel-user-btn'),
        // Task & Hint UI
        taskBox: document.getElementById('task-box'),
        taskText: document.getElementById('task-text'),
        hintPopup: document.getElementById('hint-popup'),
        hintText: document.getElementById('hint-text'),
        hintCloseBtn: document.getElementById('hint-close-btn'),
        helpIcon: document.getElementById('help-icon'),
        // Toasts
        toastContainer: document.getElementById('toast-container'),
        // Edit Modal Tabs
        modalTabs: document.querySelector('.modal-tabs'),
    };

    // =================================================================================
    // --- CORE & UI FUNCTIONS ---
    // =================================================================================

    const showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        dom.toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 4000);
    };

    const logEvent = (message, type = 'SYSTEM') => {
        const timestamp = new Date().toLocaleTimeString();
        state.eventLog.unshift({ timestamp, message, type });
        if (state.eventLog.length > 100) state.eventLog.pop();
        renderEventLog();
    };
    
    const toggleModal = (modal, show) => {
        modal.classList.toggle('active', show);
    };

    // =================================================================================
    // --- HINT SYSTEM ---
    // =================================================================================

    const setHint = (message) => { state.hintSystem.currentHint = message; };

    const showHintPopup = () => {
        if (!state.hintSystem.currentHint || state.hintSystem.popupVisible) return;
        dom.hintText.textContent = state.hintSystem.currentHint;
        dom.hintPopup.classList.add('show');
        state.hintSystem.popupVisible = true;
        clearTimeout(state.hintSystem.timeoutId);
        state.hintSystem.timeoutId = setTimeout(hideHintPopup, 6000);
    };

    const hideHintPopup = () => {
        dom.hintPopup.classList.remove('show');
        state.hintSystem.popupVisible = false;
    };

    // =================================================================================
    // --- VALIDATION ---
    // =================================================================================
    
    const validateCameraIP = (ip, existingId = null) => {
        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        if (!ipRegex.test(ip)) return { valid: false, message: "Hint: IP address format is invalid (e.g., 192.168.1.100)." };
        if (state.cameras.some(c => c.ip === ip && c.id !== existingId)) return { valid: false, message: "Hint: This IP address is already in use by another camera." };
        return { valid: true };
    };

    // =================================================================================
    // --- RENDER FUNCTIONS ---
    // =================================================================================

    const renderDeviceList = () => {
        dom.deviceListBody.innerHTML = '';
        state.cameras.forEach(cam => {
            const statusClass = cam.status.toLowerCase().replace(' ', '-');
            const row = document.createElement('tr');
            row.dataset.ip = cam.ip;
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
            dom.deviceListBody.appendChild(row);
        });
    };

    const renderUserList = () => {
        dom.userListBody.innerHTML = '';
        state.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.role}</td>
                <td><span class="status-indicator active"></span>Active</td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" disabled>Edit</button>
                </td>
            `;
            dom.userListBody.appendChild(row);
        });
    };
    
    const renderCameraGrid = () => {
        dom.cameraGrid.innerHTML = '';
        state.cameras.forEach(cam => {
            const feed = document.createElement('div');
            feed.className = `camera-feed ${cam.status !== 'Online' ? 'offline' : ''}`;
            const kittenId = (cam.id % 16) + 1;
            feed.innerHTML = `
                ${cam.status !== 'Online' ? `<div class="offline-overlay">${cam.status}</div>` : ''}
                <img src="https://placekitten.com/400/225?image=${kittenId}" alt="${cam.name}">
                <div class="info">${cam.name}</div>
            `;
            dom.cameraGrid.appendChild(feed);
        });
    };

    const renderEventLog = () => {
        dom.eventLogList.innerHTML = state.eventLog.map(e => `
            <li><span class="event-time">${e.timestamp}</span><span class="event-type-${e.type}">${e.type}</span><span>${e.message}</span></li>
        `).join('');
    };
    
    const renderNetworkSettings = () => {
        dom.ipTypeSelect.value = state.networkConfig.mode;
        dom.ipAddressInput.value = state.networkConfig.ip;
        dom.subnetMaskInput.value = state.networkConfig.subnet;
        dom.gatewayInput.value = state.networkConfig.gateway;
        const isStatic = state.networkConfig.mode === 'static';
        dom.ipAddressInput.disabled = !isStatic;
        dom.subnetMaskInput.disabled = !isStatic;
        dom.gatewayInput.disabled = !isStatic;
    };

    const renderTask = () => {
        if (state.guidedTasks.isComplete) return;
        const currentTask = state.guidedTasks.tasks[state.guidedTasks.currentTaskIndex];
        dom.taskText.textContent = currentTask.description;
        applyHelpHighlight();
    };

    const removeHelpHighlight = () => {
        const highlighted = document.querySelector('.highlight-help');
        if (highlighted) highlighted.classList.remove('highlight-help');
    };

    const applyHelpHighlight = () => {
        removeHelpHighlight();
        const selector = state.guidedTasks.tasks[state.guidedTasks.currentTaskIndex].highlightSelector;
        if (selector) {
            setTimeout(() => {
                const element = document.querySelector(selector);
                if (element) element.classList.add('highlight-help');
            }, 100);
        }
    };
    
    const renderAll = () => {
        renderDeviceList();
        renderUserList();
        renderCameraGrid();
        renderNetworkSettings();
        renderEventLog();
        renderTask();
    };

    // =================================================================================
    // --- TASK & MODE LOGIC ---
    // =================================================================================

    const checkTaskCompletion = () => {
        if (state.guidedTasks.isComplete) return;
        const tasks = state.guidedTasks.tasks;
        const i = state.guidedTasks.currentTaskIndex;
        if (tasks[i].isComplete(state)) {
            removeHelpHighlight();
            showToast(`Task ${tasks[i].id} Complete!`, 'success');
            logEvent(`Task ${tasks[i].id} completed.`, 'SUCCESS');
            
            state.guidedTasks.currentTaskIndex++;
            
            if (state.guidedTasks.currentTaskIndex >= tasks.length - 1) {
                state.guidedTasks.isComplete = true;
                setTimeout(() => {
                    dom.taskBox.classList.add('hidden');
                    dom.helpIcon.classList.add('active');
                    showToast("All tasks done. Explore Mode activated!", 'info');
                    logEvent('Guided task mode completed. Switched to Explore Mode.', 'SYSTEM');
                }, 2000);
            }
            
            setTimeout(renderTask, 1500);
        }
    };

    // =================================================================================
    // --- EVENT HANDLERS SETUP ---
    // =================================================================================

    function setupEventListeners() {
        // Navigation
        dom.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = e.currentTarget.dataset.target;
                dom.navItems.forEach(i => i.classList.remove('active'));
                e.currentTarget.classList.add('active');
                dom.contentSections.forEach(s => s.classList.toggle('active', s.id === targetId));
                applyHelpHighlight();
            });
        });

        // Modal Buttons
        dom.addCamBtn.addEventListener('click', () => toggleModal(dom.addCameraModal, true));
        dom.cancelAddCamBtn.addEventListener('click', () => toggleModal(dom.addCameraModal, false));
        dom.cancelEditCamBtn.addEventListener('click', () => toggleModal(dom.editCameraModal, false));
        dom.addUserBtn.addEventListener('click', () => toggleModal(dom.addUserModal, true));
        dom.cancelUserBtn.addEventListener('click', () => toggleModal(dom.addUserModal, false));

        // Hint System
        dom.helpIcon.addEventListener('click', () => {
            if (state.hintSystem.currentHint) showToast(state.hintSystem.currentHint, 'info');
            else showToast("No hints right now. Keep up the good work!", 'success');
        });
        dom.hintCloseBtn.addEventListener('click', hideHintPopup);

        // Device Actions (Event Delegation)
        dom.deviceListBody.addEventListener('click', (e) => {
            const rebootButton = e.target.closest('.btn-reboot');
            if (rebootButton) {
                const id = parseInt(rebootButton.dataset.id);
                const camera = state.cameras.find(c => c.id === id);
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
                }, 2500);
            }
            const editButton = e.target.closest('.btn-edit');
            if (editButton) {
                const id = parseInt(editButton.dataset.id);
                const camera = state.cameras.find(c => c.id === id);
                if (!camera) return;
                const form = dom.editCameraForm;
                form.querySelector('#edit-cam-id').value = camera.id;
                form.querySelector('#edit-cam-name').value = camera.name;
                form.querySelector('#edit-cam-ip').value = camera.ip;
                form.querySelector('#edit-cam-gateway').value = camera.gateway;
                form.querySelector('#edit-cam-user').value = camera.username;
                form.querySelector('#edit-cam-rec-mode').value = camera.recMode;
                form.querySelector('#edit-cam-pass').value = '';
                toggleModal(dom.editCameraModal, true);
            }
        });

        // Form Submissions
        dom.addCameraForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const ip = dom.addCameraForm.querySelector('#cam-ip').value;
            const name = dom.addCameraForm.querySelector('#cam-name').value;
            if (state.guidedTasks.isComplete) {
                const validation = validateCameraIP(ip);
                if (!validation.valid) {
                    setHint(validation.message);
                    showHintPopup();
                    showToast("Invalid Input Detected.", "error");
                    return;
                }
            }
            const newCam = {
                id: Math.max(0, ...state.cameras.map(c => c.id)) + 1,
                name: name, ip: ip, gateway: dom.addCameraForm.querySelector('#cam-ip').value.replace(/\.\d+$/, '.1'), model: 'IPC-New-4K', status: 'Online',
                username: dom.addCameraForm.querySelector('#cam-user').value,
                password: dom.addCameraForm.querySelector('#cam-pass').value, recMode: 'Continuous'
            };
            state.cameras.push(newCam);
            logEvent(`Added camera '${name}' (${ip}).`, 'SUCCESS');
            toggleModal(dom.addCameraModal, false);
            dom.addCameraForm.reset();
            renderAll();
            checkTaskCompletion();
        });

        dom.editCameraForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = parseInt(dom.editCameraForm.querySelector('#edit-cam-id').value);
            const camera = state.cameras.find(c => c.id === id);
            if(!camera) return;
            const newIp = dom.editCameraForm.querySelector('#edit-cam-ip').value;
            if (state.guidedTasks.isComplete) {
                const validation = validateCameraIP(newIp, id);
                if (!validation.valid) {
                    setHint(validation.message);
                    showHintPopup();
                    showToast("Invalid Input Detected.", "error");
                    return;
                }
            }
            camera.name = dom.editCameraForm.querySelector('#edit-cam-name').value;
            camera.ip = newIp;
            camera.gateway = dom.editCameraForm.querySelector('#edit-cam-gateway').value;
            camera.username = dom.editCameraForm.querySelector('#edit-cam-user').value;
            const newPass = dom.editCameraForm.querySelector('#edit-cam-pass').value;
            if(newPass) camera.password = newPass;
            camera.recMode = dom.editCameraForm.querySelector('#edit-cam-rec-mode').value;
            if (camera.status === 'Auth Error' && camera.password === 'Password123!') {
                 camera.status = 'Online';
                 logEvent(`Correct credentials for '${camera.name}'. Status: Online.`, 'SUCCESS');
            }
            logEvent(`Updated settings for camera '${camera.name}'.`);
            toggleModal(dom.editCameraModal, false);
            renderAll();
            checkTaskCompletion();
        });
        
        dom.addUserForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = dom.addUserForm.querySelector('#user-username').value;
            const newUser = {
                id: Math.max(0, ...state.users.map(u => u.id)) + 1,
                username: username,
                role: dom.addUserForm.querySelector('#user-role').value,
                status: 'Active'
            };
            state.users.push(newUser);
            logEvent(`Created new user: '${username}' with role '${newUser.role}'.`, 'USER');
            toggleModal(dom.addUserModal, false);
            dom.addUserForm.reset();
            renderAll();
            checkTaskCompletion();
        });

        dom.networkForm.addEventListener('submit', (e) => {
            e.preventDefault();
            state.networkConfig.mode = dom.ipTypeSelect.value;
            if (state.networkConfig.mode === 'static') {
                state.networkConfig.ip = dom.ipAddressInput.value;
                state.networkConfig.subnet = dom.subnetMaskInput.value;
                state.networkConfig.gateway = dom.gatewayInput.value;
            }
            logEvent(`NVR network settings updated. Mode: ${state.networkConfig.mode.toUpperCase()}.`);
            showToast('Network settings saved!', 'success');
            renderNetworkSettings();
            checkTaskCompletion();
        });
        
        dom.ipTypeSelect.addEventListener('change', () => renderNetworkSettings());

        // Edit Modal Tab handler
        dom.modalTabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-link')) {
                const targetTab = e.target.dataset.tab;
                dom.modalTabs.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                dom.editCameraModal.querySelectorAll('.tab-content').forEach(c => {
                    c.classList.toggle('active', c.id === targetTab);
                });
            }
        });
    }

    // =================================================================================
    // --- INITIALIZATION ---
    // =================================================================================
    const init = () => {
        logEvent('System initialized. VMS_Lab_Pro v3.0 running.');
        logEvent("Camera 'Parking Lot 1' has lost connection.", 'ERROR');
        logEvent("Authentication failed for camera 'Side Entrance'.", 'ERROR');
        setupEventListeners();
        renderAll();
    };

    init();
});
