document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    // Holds the cameras that have been "added" to the system
    let cameras = [
        { id: 1, name: 'Lobby Cam', ip: '192.168.1.100', model: 'IPD-5MP-IR', online: true },
        { id: 2, name: 'Parking Lot 1', ip: '192.168.1.102', model: 'IPT-8MP-Z', online: true }
    ];

    // Holds the NVR's network configuration
    let networkConfig = {
        mode: 'dhcp',
        ip: '192.168.1.10',
        subnet: '255.255.255.0',
        gateway: '192.168.1.1'
    };

    // The guided tasks for the user to complete
    let tasks = [
        { 
            id: 1, 
            description: "A new camera was installed at the front door. Its IP is 192.168.1.110. Add it to the system. Name it 'Front Door' and use 'password123' as the password.",
            isComplete: (state) => state.cameras.some(c => c.ip === '192.168.1.110'),
            successMessage: "Great! The Front Door camera is now online."
        },
        { 
            id: 2, 
            description: "To prevent network conflicts, the NVR needs a static IP. Change its IP address to 192.168.1.250.",
            isComplete: (state) => state.networkConfig.mode === 'static' && state.networkConfig.ip === '192.168.1.250',
            successMessage: "Excellent. The NVR's IP is now static."
        },
        {
            id: 3,
            description: "All tasks complete! You're ready to practice on your own.",
            isComplete: () => false, // This task is never "complete"
            successMessage: "Feel free to explore and add more devices."
        }
    ];
    let currentTaskIndex = 0;

    // --- DOM ELEMENT SELECTORS ---
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const deviceListBody = document.getElementById('device-list');
    const cameraGrid = document.getElementById('camera-grid');
    
    const addCameraButton = document.getElementById('add-camera-btn');
    const modal = document.getElementById('add-camera-modal');
    const cancelAddButton = document.getElementById('cancel-add-btn');
    const addCameraForm = document.getElementById('add-camera-form');
    const scanNetworkButton = document.getElementById('scan-network-btn');
    
    const networkForm = document.getElementById('network-form');
    const ipTypeSelect = document.getElementById('ip-type');
    const ipAddressInput = document.getElementById('ip-address');
    const subnetMaskInput = document.getElementById('subnet-mask');
    const gatewayInput = document.getElementById('gateway');

    const taskText = document.getElementById('task-text');
    const taskFeedback = document.getElementById('task-feedback');

    // --- RENDER FUNCTIONS ---
    // Renders the list of cameras in the Device Management table
    const renderDeviceList = () => {
        deviceListBody.innerHTML = '';
        if (cameras.length === 0) {
            deviceListBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No devices found.</td></tr>`;
        } else {
            cameras.forEach(cam => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><span class="status-indicator"></span>Online</td>
                    <td>${cam.name}</td>
                    <td>${cam.ip}</td>
                    <td>${cam.model}</td>
                    <td><button class="btn btn-danger btn-sm">Remove</button></td>
                `;
                deviceListBody.appendChild(row);
            });
        }
    };

    // Renders the camera feeds on the Dashboard
    const renderCameraGrid = () => {
        cameraGrid.innerHTML = '';
        if (cameras.length === 0) {
            cameraGrid.innerHTML = `<p>No cameras added. Go to Device Management to add a camera.</p>`;
        } else {
            cameras.forEach(cam => {
                const feed = document.createElement('div');
                feed.className = 'camera-feed';
                // Using place-kitten for fun placeholder images.
                const kittenId = (cam.id % 16) + 1; // get a kitten from 1-16
                feed.innerHTML = `
                    <img src="https://placekitten.com/400/225?image=${kittenId}" alt="${cam.name}">
                    <div class="info">${cam.name}</div>
                `;
                cameraGrid.appendChild(feed);
            });
        }
    };

    // Renders the current NVR network settings in the form
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
    
    // Updates the text and feedback for the current task
    const renderTask = () => {
        taskText.textContent = tasks[currentTaskIndex].description;
        taskFeedback.style.display = 'none';
    };

    // --- EVENT HANDLERS & LOGIC ---
    // Handles navigation between Dashboard, Devices, etc.
    const handleNavClick = (e) => {
        e.preventDefault();
        const targetId = e.currentTarget.dataset.target;

        navItems.forEach(item => item.classList.remove('active'));
        e.currentTarget.classList.add('active');

        contentSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === targetId) {
                section.classList.add('active');
            }
        });
    };
    navItems.forEach(item => item.addEventListener('click', handleNavClick));

    // Handles showing/hiding the "Add Camera" modal
    const toggleModal = (show) => {
        if (show) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
            addCameraForm.reset();
        }
    };
    addCameraButton.addEventListener('click', () => toggleModal(true));
    cancelAddButton.addEventListener('click', () => toggleModal(false));

    // SIMULATES finding a device on the network
    scanNetworkButton.addEventListener('click', () => {
        // In a real app, this would be a complex network discovery process.
        // Here, we just pre-fill the form with a "found" device.
        alert('Scan complete! Found one device.');
        document.getElementById('cam-name').value = 'Back Porch Cam';
        document.getElementById('cam-ip').value = '192.168.1.115';
        document.getElementById('cam-pass').value = 'password123';
    });

    // Handles the submission of the Add Camera form
    addCameraForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newCamera = {
            id: cameras.length > 0 ? Math.max(...cameras.map(c => c.id)) + 1 : 1,
            name: document.getElementById('cam-name').value,
            ip: document.getElementById('cam-ip').value,
            model: 'IPC-Generic-5MP', // Assign a generic model
            online: true
        };

        // Basic validation
        if (cameras.some(c => c.ip === newCamera.ip)) {
            alert('Error: A camera with this IP address already exists.');
            return;
        }

        cameras.push(newCamera);
        console.log('Added camera:', newCamera);
        
        toggleModal(false);
        renderAll();
        checkTaskCompletion();
    });

    // Handles saving network settings
    networkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        networkConfig.mode = ipTypeSelect.value;
        if (networkConfig.mode === 'static') {
            networkConfig.ip = ipAddressInput.value;
            networkConfig.subnet = subnetMaskInput.value;
            networkConfig.gateway = gatewayInput.value;
        }
        alert('Network settings saved!');
        renderNetworkSettings();
        checkTaskCompletion();
    });
    
    // Updates form fields when switching between DHCP and Static
    ipTypeSelect.addEventListener('change', (e) => {
        const isStatic = e.target.value === 'static';
        ipAddressInput.disabled = !isStatic;
        subnetMaskInput.disabled = !isStatic;
        gatewayInput.disabled = !isStatic;
    });

    // Checks if the current task has been completed by the user's action
    const checkTaskCompletion = () => {
        const currentTask = tasks[currentTaskIndex];
        if (currentTask.isComplete({ cameras, networkConfig })) {
            taskFeedback.textContent = currentTask.successMessage;
            taskFeedback.className = 'feedback-message success';
            taskFeedback.style.display = 'block';

            // Move to the next task after a delay
            setTimeout(() => {
                if(currentTaskIndex < tasks.length - 1) {
                    currentTaskIndex++;
                    renderTask();
                }
            }, 3000);
        }
    };
    
    // --- INITIALIZATION ---
    // A single function to render all components
    const renderAll = () => {
        renderDeviceList();
        renderCameraGrid();
        renderNetworkSettings();
        renderTask();
    };

    // Initial load
    renderAll();
});