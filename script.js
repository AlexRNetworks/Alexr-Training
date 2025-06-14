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
    // --- DRAG AND DROP LOGIC ---
    // ==========================================================================

    /**
     * Handles the start of a drag operation from the toolbar.
     * @param {DragEvent} e - The drag event.
     */
    function handleDragStart(e) {
        // Store the type of the device being dragged (e.g., 'router', 'switch').
        e.dataTransfer.setData('text/plain', e.currentTarget.dataset.type);
        e.dataTransfer.effectAllowed = 'copy';
    }

    /**
     * Handles when a dragged item is over the canvas.
     * @param {DragEvent} e - The drag event.
     */
    function handleDragOver(e) {
        e.preventDefault(); // This is necessary to allow a drop.
        e.dataTransfer.dropEffect = 'copy';
    }

    /**
     * Handles the drop operation onto the canvas.
     * @param {DragEvent} e - The drag event.
     */
    function handleDrop(e) {
        e.preventDefault();
        const deviceType = e.dataTransfer.getData('text/plain');

        // Get the drop position relative to the canvas container.
        const canvasRect = dom.canvasContainer.getBoundingClientRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;

        // Create a new device object and add it to our state.
        const newDevice = {
            id: state.nextDeviceId++,
            type: deviceType,
            name: `${deviceType}-${state.nextDeviceId - 1}`,
            top: y,
            left: x,
            // Add default properties based on type
            ip: '192.168.1.1',
            subnet: '255.255.255.0',
            gateway: '192.168.1.1',
        };
        state.devicesOnCanvas.push(newDevice);

        // Update the UI to show the new device.
        renderDevicesOnCanvas();
    }

    // ==========================================================================
    // --- RENDERING & UI UPDATES ---
    // ==========================================================================

    /**
     * Renders all devices from the state onto the canvas.
     */
    function renderDevicesOnCanvas() {
        // Clear any existing devices from the canvas.
        dom.canvasContainer.innerHTML = '';

        state.devicesOnCanvas.forEach(device => {
            const deviceEl = document.createElement('div');
            deviceEl.className = 'canvas-device';
            deviceEl.dataset.id = device.id;
            deviceEl.style.left = `${device.left}px`;
            deviceEl.style.top = `${device.top}px`;
            
            // Add a visual highlight if this device is the selected one.
            if (device.id === state.selectedDeviceId) {
                deviceEl.classList.add('selected');
            }

            // Get the corresponding icon and label from the toolbar.
            const template = document.querySelector(`.device[data-type="${device.type}"]`);
            deviceEl.innerHTML = template.innerHTML;

            // Add a click listener to select the device.
            deviceEl.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent click from bubbling up to the canvas.
                selectDevice(device.id);
            });

            dom.canvasContainer.appendChild(deviceEl);
        });
    }

    /**
     * Updates the configuration panel based on the selected device.
     */
    function renderConfigPanel() {
        // Hide all config views first.
        dom.configViews.forEach(view => view.classList.remove('active'));

        const selectedDevice = state.devicesOnCanvas.find(d => d.id === state.selectedDeviceId);

        if (!selectedDevice) {
            // If no device is selected, show the default message.
            dom.defaultConfigView.classList.add('active');
            return;
        }

        // Show the correct config panel and populate it with data.
        let targetView;
        switch (selectedDevice.type) {
            case 'router':
                targetView = dom.routerConfigView;
                targetView.querySelector('#router-name').value = selectedDevice.name;
                targetView.querySelector('#router-lan-ip').value = selectedDevice.gateway;
                break;
            case 'switch':
                targetView = dom.switchConfigView;
                targetView.querySelector('#switch-name').value = selectedDevice.name;
                // We'll add port rendering logic here later.
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

    /**
     * Sets the currently selected device and re-renders the UI.
     * @param {number | null} deviceId - The ID of the device to select, or null to deselect.
     */
    function selectDevice(deviceId) {
        state.selectedDeviceId = deviceId;
        renderDevicesOnCanvas(); // Re-render to update the '.selected' class.
        renderConfigPanel();
    }

    /**
     * Sets up all the initial event listeners for the application.
     */
    function initializeEventListeners() {
        // Add drag listeners to toolbar devices.
        dom.devicesInToolbar.forEach(device => {
            device.addEventListener('dragstart', handleDragStart);
        });

        // Add drop zone listeners to the canvas.
        dom.canvasContainer.addEventListener('dragover', handleDragOver);
        dom.canvasContainer.addEventListener('drop', handleDrop);

        // Listener to deselect devices when clicking on the canvas background.
        dom.canvasContainer.addEventListener('click', () => {
            selectDevice(null);
        });

        // Listen for input changes in the config panel to update state automatically.
        dom.configPanel.addEventListener('input', (e) => {
            if (!state.selectedDeviceId) return;

            const selectedDevice = state.devicesOnCanvas.find(d => d.id === state.selectedDeviceId);
            if (!selectedDevice) return;

            // Update the device property in the state based on the input's ID.
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
        
        // Modal listeners
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
    renderConfigPanel(); // Show the default config message initially.
});
