// Wait for the entire HTML document to be loaded and parsed before running the script.
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // --- STATE MANAGEMENT ---
    // A central object to hold all the application's data.
    // ==========================================================================
    const state = {
        devicesOnCanvas: [], // Stores device objects that are on the canvas.
        selectedDeviceId: null, // The ID of the currently selected device.
        nextDeviceId: 1, // Simple counter to ensure unique device IDs.
        // NEW: State for tracking the dragging of canvas elements
        draggedElement: {
            id: null,
            initialX: 0,
            initialY: 0,
            mouseX: 0,
            mouseY: 0
        }
    };

    // ==========================================================================
    // --- DOM ELEMENT SELECTORS ---
    // Grabbing references to all the HTML elements we'll need to interact with.
    // ==========================================================================
    const dom = {
        devicesInToolbar: document.querySelectorAll('#device-toolbar .device'),
        canvasContainer: document.getElementById('network-canvas-container'),
        configPanel: document.getElementById('config-panel'),
        configViews: document.querySelectorAll('.config-view'),
        // Configuration Forms
        defaultConfigView: document.getElementById('config-default'),
        routerConfigView: document.getElementById('config-router'),
        switchConfigView: document.getElementById('config-switch'),
        endpointConfigView: document.getElementById('config-endpoint'),
        // Modal elements
        firewallModal: document.getElementById('firewall-modal'),
        openFirewallBtn: document.getElementById('firewall-btn'),
        closeFirewallBtn: document.getElementById('close-firewall-btn'),
    };

    // ==========================================================================
    // --- DRAG AND DROP LOGIC (Toolbar to Canvas) ---
    // ==========================================================================

    function handleToolbarDragStart(e) {
        e.dataTransfer.setData('text/plain', e.currentTarget.dataset.type);
        e.dataTransfer.effectAllowed = 'copy';
    }

    function handleCanvasDragOver(e) {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'copy';
    }

    function handleCanvasDrop(e) {
        e.preventDefault();
        const deviceType = e.dataTransfer.getData('text/plain');
        const canvasRect = dom.canvasContainer.getBoundingClientRect();
        
        // Adjust drop position to center the element under the cursor
        const x = e.clientX - canvasRect.left - 50; // approx half of device width
        const y = e.clientY - canvasRect.top - 50;  // approx half of device height

        const newDevice = {
            id: state.nextDeviceId++,
            type: deviceType,
            name: `${deviceType}-${state.nextDeviceId - 1}`,
            top: y,
            left: x,
            ip: '192.168.1.1',
            subnet: '255.255.255.0',
            gateway: '192.168.1.1',
        };
        state.devicesOnCanvas.push(newDevice);
        renderDevicesOnCanvas();
    }

    // ==========================================================================
    // --- DRAGGING LOGIC (Inside the Canvas) - NEW ---
    // ==========================================================================
    
    /**
     * Initiates dragging for a device already on the canvas.
     * @param {MouseEvent} e - The mousedown event.
     * @param {number} deviceId - The ID of the device to drag.
     */
    function handleDeviceMouseDown(e, deviceId) {
        // Only start drag with the primary mouse button
        if (e.button !== 0) return;
        
        const device = state.devicesOnCanvas.find(d => d.id === deviceId);
        if (device) {
            state.draggedElement.id = deviceId;
            state.draggedElement.initialX = device.left;
            state.draggedElement.initialY = device.top;
            state.draggedElement.mouseX = e.clientX;
            state.draggedElement.mouseY = e.clientY;

            // Add move and up listeners to the whole window to catch mouse movement anywhere
            window.addEventListener('mousemove', handleDeviceMouseMove);
            window.addEventListener('mouseup', handleDeviceMouseUp);
        }
    }

    /**
     * Moves the device on the canvas as the mouse moves.
     * @param {MouseEvent} e - The mousemove event.
     */
    function handleDeviceMouseMove(e) {
        if (state.draggedElement.id === null) return;
        
        // Calculate the distance the mouse has moved
        const deltaX = e.clientX - state.draggedElement.mouseX;
        const deltaY = e.clientY - state.draggedElement.mouseY;

        const device = state.devicesOnCanvas.find(d => d.id === state.draggedElement.id);
        if (device) {
            // Update the device's position in the state
            device.left = state.draggedElement.initialX + deltaX;
            device.top = state.draggedElement.initialY + deltaY;
            
            // Re-render to show the move
            renderDevicesOnCanvas();
        }
    }

    /**
     * Stops the drag operation.
     */
    function handleDeviceMouseUp() {
        state.draggedElement.id = null; // Clear the dragged device ID
        
        // Clean up the global event listeners
        window.removeEventListener('mousemove', handleDeviceMouseMove);
        window.removeEventListener('mouseup', handleDeviceMouseUp);
    }


    // ==========================================================================
    // --- RENDERING & UI UPDATES ---
    // ==========================================================================

    function renderDevicesOnCanvas() {
        dom.canvasContainer.innerHTML = '';
        state.devicesOnCanvas.forEach(device => {
            const deviceEl = document.createElement('div');
            deviceEl.className = 'canvas-device';
            deviceEl.dataset.id = device.id;
            deviceEl.style.left = `${device.left}px`;
            deviceEl.style.top = `${device.top}px`;
            
            if (device.id === state.selectedDeviceId) {
                deviceEl.classList.add('selected');
            }

            const template = document.querySelector(`.device[data-type="${device.type}"]`);
            deviceEl.innerHTML = template.innerHTML;

            // --- EVENT LISTENER UPDATES ---
            deviceEl.addEventListener('click', (e) => {
                e.stopPropagation();
                selectDevice(device.id);
            });
            // NEW: Add mousedown listener to allow dragging this element
            deviceEl.addEventListener('mousedown', (e) => handleDeviceMouseDown(e, device.id));

            dom.canvasContainer.appendChild(deviceEl);
        });
    }

    function renderConfigPanel() {
        dom.configViews.forEach(view => view.classList.remove('active'));
        const selectedDevice = state.devicesOnCanvas.find(d => d.id === state.selectedDeviceId);

        if (!selectedDevice) {
            dom.defaultConfigView.classList.add('active');
            return;
        }

        let targetView;
        switch (selectedDevice.type) {
            case 'router':
                targetView = dom.routerConfigView;
                targetView.querySelector('#router-name').value = selectedDevice.name;
                targetVielue = selectedDevice.gateway;
                break;
            case 'switch':
                targetView = dom.switchConfigView;
                targetView.querySelector('#switch-name').value = selectedDevice.name;
                break;
            case 'ip-camera':
            case 'nvr':
            case 'workstation':
                targetView = dom.endpointConfigView;
                targetView.querySelector('#endpoint-name').value = selectedDevice.name;
                targetView.querySelector('#endpoint-ip').value = selectedDevice.ip;
                targetView.querySelector('#endpoint-subnet').value = selectedDevice.subnet;
                targetView.querySelector('#endpoint-gateway').value = selectedDevice.gateway;
                break;
        }
        if (targetView) {
            targetView.classList.add('active');
        }
    }

    // ==========================================================================
    // --- EVENT HANDLERS & INITIALIZATION ---
    // ==========================================================================

    function selectDevice(deviceId) {
        state.selectedDeviceId = deviceId;
        renderDevicesOnCanvas();
        renderConfigPanel();
    }

    function initializeEventListeners() {
        dom.devicesInToolbar.forEach(device => {
            device.addEventListener('dragstart', handleToolbarDragStart);
        });

        dom.canvasContainer.addEventListener('dragover', handleCanvasDragOver);
        dom.canvasContainer.addEventListener('drop', handleCanvasDrop);

        dom.canvasContainer.addEventListener('click', () => {
            selectDevice(null);
        });

        dom.configPanel.addEventListener('input', (e) => {
            if (!state.selectedDeviceId) return;
            const selectedDevice = state.devicesOnCanvas.find(d => d.id === state.selectedDeviceId);
            if (!selectedDevice) return;

            switch (e.target.id) {
                case 'router-name':
                case 'switch-name':
                case 'endpoint-name':
                    selectedDevice.name = e.target.value;
                    break;
                case 'router-lan-ip':
                    selectedDevice.gateway = e.target.value;
                    break;
                case 'endpoint-ip':
                    selectedDevice.ip = e.target.value;
                    break;
                case 'endpoint-subnet':
                    selectedDevice.subnet = e.target.value;
                    break;
                case 'endpoint-gateway':
                    selectedDevice.gateway = e.target.value;
                    break;
            }
        });
        
        dom.openFirewallBtn.addEventListener('click', () => {
            dom.firewallModal.style.display = 'flex';
        });
        dom.closeFirewallBtn.addEventListener('click', () => {
            dom.firewallModal.style.display = 'none';
        });
    }

    // ==========================================================================
    // --- APP INITIALIZATION ---
    // ==========================================================================
    console.log("Network Simulator Initializing...");
    initializeEventListeners();
    renderConfigPanel();
});
