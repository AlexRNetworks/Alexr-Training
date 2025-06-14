// Wait for the entire HTML document to be loaded and parsed before running the script.
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // --- STATE MANAGEMENT ---
    // A central object to hold all the application's data.
    // ==========================================================================
    const state = {
        devicesOnCanvas: [], 
        selectedDeviceId: null,
        nextDeviceId: 1,
        draggedElement: { id: null, initialX: 0, initialY: 0, mouseX: 0, mouseY: 0 },
        // NEW: Task Management System State
        tasks: {
            currentIndex: 0,
            list: [
                {
                    id: 1,
                    description: "Your first task is to build a basic office network. Drag a Router and a Switch onto the canvas.",
                    isComplete: (currentState) => {
                        const hasRouter = currentState.devicesOnCanvas.some(d => d.type === 'router');
                        const hasSwitch = currentState.devicesOnCanvas.some(d => d.type === 'switch');
                        return hasRouter && hasSwitch;
                    }
                },
                {
                    id: 2,
                    description: "Great! Next, configure the Router. Select it and set its LAN IP (Gateway) to '192.168.10.1'.",
                    isComplete: (currentState) => {
                        const router = currentState.devicesOnCanvas.find(d => d.type === 'router');
                        return router && router.gateway === '192.168.10.1';
                    }
                },
                {
                    id: 3,
                    description: "All tasks complete for now! More features to come. Feel free to continue building your network.",
                    isComplete: () => false // This task never completes automatically
                }
            ]
        }
    };

    // ==========================================================================
    // --- DOM ELEMENT SELECTORS ---
    // ==========================================================================
    const dom = {
        devicesInToolbar: document.querySelectorAll('#device-toolbar .device'),
        canvasContainer: document.getElementById('network-canvas-container'),
        configPanel: document.getElementById('config-panel'),
        configViews: document.querySelectorAll('.config-view'),
        defaultConfigView: document.getElementById('config-default'),
        routerConfigView: document.getElementById('config-router'),
        switchConfigView: document.getElementById('config-switch'),
        endpointConfigView: document.getElementById('config-endpoint'),
        firewallModal: document.getElementById('firewall-modal'),
        openFirewallBtn: document.getElementById('firewall-btn'),
        closeFirewallBtn: document.getElementById('close-firewall-btn'),
        // NEW: Task box text element
        taskText: document.getElementById('task-text')
    };

    // ==========================================================================
    // --- DRAG AND DROP LOGIC (Toolbar to Canvas) ---
    // ==========================================================================

    function handleToolbarDragStart(e) { /* Unchanged */ }
    function handleCanvasDragOver(e) { /* Unchanged */ }

    function handleCanvasDrop(e) {
        e.preventDefault();
        const deviceType = e.dataTransfer.getData('text/plain');
        const canvasRect = dom.canvasContainer.getBoundingClientRect();
        const x = e.clientX - canvasRect.left - 50;
        const y = e.clientY - canvasRect.top - 50;

        const newDevice = {
            id: state.nextDeviceId++,
            type: deviceType,
            name: `${deviceType}-${state.nextDeviceId - 1}`,
            top: y, left: x,
            ip: '192.168.1.1',
            subnet: '255.255.255.0',
            gateway: '192.168.1.1',
        };
        state.devicesOnCanvas.push(newDevice);
        
        renderDevicesOnCanvas();
        checkTaskCompletion(); // NEW: Check if the drop completed a task
    }

    // ==========================================================================
    // --- DRAGGING LOGIC (Inside the Canvas) ---
    // ==========================================================================
    function handleDeviceMouseDown(e, deviceId) { /* Unchanged */ }
    function handleDeviceMouseMove(e) { /* Unchanged */ }
    function handleDeviceMouseUp() { /* Unchanged */ }


    // ==========================================================================
    // --- TASK MANAGEMENT LOGIC - NEW ---
    // ==========================================================================
    /**
     * Checks if the current task's completion criteria are met. If so, advances to the next task.
     */
    function checkTaskCompletion() {
        const currentTask = state.tasks.list[state.tasks.currentIndex];
        // Ensure the task exists and is not the final one
        if (currentTask && currentTask.isComplete(state)) {
            console.log(`Task ${currentTask.id} complete!`);
            state.tasks.currentIndex++;
            renderTask(); // Update the UI with the new task description
        }
    }

    // ==========================================================================
    // --- RENDERING & UI UPDATES ---
    // ==========================================================================

    function renderDevicesOnCanvas() { /* Unchanged */ }
    function renderConfigPanel() { /* Unchanged */ }

    /**
     * NEW: Renders the current task description in the task box.
     */
    function renderTask() {
        const currentTask = state.tasks.list[state.tasks.currentIndex];
        if (currentTask) {
            dom.taskText.textContent = currentTask.description;
        }
    }

    /**
     * NEW: A master render function to update all dynamic parts of the UI.
     */
    function renderAll() {
        renderDevicesOnCanvas();
        renderConfigPanel();
        renderTask();
    }


    // ==========================================================================
    // --- EVENT HANDLERS & INITIALIZATION ---
    // ==========================================================================

    function selectDevice(deviceId) {
        state.selectedDeviceId = deviceId;
        renderAll(); // Use the master render function
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
                case 'router-name': case 'switch-name': case 'endpoint-name':
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
            // NEW: Check for task completion on every input change.
            checkTaskCompletion();
        });
        
        dom.openFirewallBtn.addEventListener('click', () => {
            dom.firewallModal.style.display = 'flex';
        });
        dom.closeFirewallBtn.addEventListener('click', () => {
            dom.firewallModal.style.display = 'none';
        });
    }

    // ==========================================================================
    // --- FULL IMPLEMENTATION OF UNCHANGED FUNCTIONS ---
    // This section ensures the file is complete with all necessary logic.
    // ==========================================================================
    function handleToolbarDragStart(e) { e.dataTransfer.setData('text/plain', e.currentTarget.dataset.type); e.dataTransfer.effectAllowed = 'copy'; }
    function handleCanvasDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }
    function handleDeviceMouseDown(e, deviceId) { if (e.button !== 0) return; const device = state.devicesOnCanvas.find(d => d.id === deviceId); if (device) { state.draggedElement.id = deviceId; state.draggedElement.initialX = device.left; state.draggedElement.initialY = device.top; state.draggedElement.mouseX = e.clientX; state.draggedElement.mouseY = e.clientY; window.addEventListener('mousemove', handleDeviceMouseMove); window.addEventListener('mouseup', handleDeviceMouseUp); } }
    function handleDeviceMouseMove(e) { if (state.draggedElement.id === null) return; const deltaX = e.clientX - state.draggedElement.mouseX; const deltaY = e.clientY - state.draggedElement.mouseY; const device = state.devicesOnCanvas.find(d => d.id === state.draggedElement.id); if (device) { device.left = state.draggedElement.initialX + deltaX; device.top = state.draggedElement.initialY + deltaY; renderDevicesOnCanvas(); } }
    function handleDeviceMouseUp() { state.draggedElement.id = null; window.removeEventListener('mousemove', handleDeviceMouseMove); window.removeEventListener('mouseup', handleDeviceMouseUp); }
    function renderDevicesOnCanvas() { dom.canvasContainer.innerHTML = ''; state.devicesOnCanvas.forEach(device => { const deviceEl = document.createElement('div'); deviceEl.className = 'canvas-device'; deviceEl.dataset.id = device.id; deviceEl.style.left = `${device.left}px`; deviceEl.style.top = `${device.top}px`; if (device.id === state.selectedDeviceId) { deviceEl.classList.add('selected'); } const template = document.querySelector(`.device[data-type="${device.type}"]`); deviceEl.innerHTML = template.innerHTML; deviceEl.addEventListener('click', (e) => { e.stopPropagation(); selectDevice(device.id); }); deviceEl.addEventListener('mousedown', (e) => handleDeviceMouseDown(e, device.id)); dom.canvasContainer.appendChild(deviceEl); }); }
    function renderConfigPanel() { dom.configViews.forEach(view => view.classList.remove('active')); const selectedDevice = state.devicesOnCanvas.find(d => d.id === state.selectedDeviceId); if (!selectedDevice) { dom.defaultConfigView.classList.add('active'); return; } let targetView; switch (selectedDevice.type) { case 'router': targetView = dom.routerConfigView; targetView.querySelector('#router-name').value = selectedDevice.name; targetView.querySelector('#router-lan-ip').value = selectedDevice.gateway; break; case 'switch': targetView = dom.switchConfigView; targetView.querySelector('#switch-name').value = selectedDevice.name; break; case 'ip-camera': case 'nvr': case 'workstation': targetView = dom.endpointConfigView; targetView.querySelector('#endpoint-name').value = selectedDevice.name; targetView.querySelector('#endpoint-ip').value = selectedDevice.ip; targetView.querySelector('#endpoint-subnet').value = selectedDevice.subnet; targetView.querySelector('#endpoint-gateway').value = selectedDevice.gateway; break; } if (targetView) { targetView.classList.add('active'); } }
    

    // ==========================================================================
    // --- APP INITIALIZATION ---
    // ==========================================================================
    console.log("Network Simulator Initializing (with Task System)...");
    initializeEventListeners();
    renderAll(); // Use the new master render function to show the first task
});
