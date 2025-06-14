document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // --- STATE MANAGEMENT ---
    // A single object to hold all the data and state for the entire application.
    // ==========================================================================
    const state = {
        devices: [],
        connections: [],
        vlans: [],
        firewallRules: [],
        selectedDeviceId: null,
        nextDeviceId: 1,
        draggedElement: { id: null, initialX: 0, initialY: 0, mouseX: 0, mouseY: 0 },
        connectMode: { active: false, sourceId: null },
        tasks: {
            currentIndex: 0,
            list: [
                { id: 1, description: "Build the physical layout. Drag a Router and a Switch onto the canvas.", isComplete: s => s.devices.some(d=>d.type==='router') && s.devices.some(d=>d.type==='switch') },
                { id: 2, description: "Connect the Router to the Switch. Use the 'Connect' button (🔗) on a device, then click another device.", isComplete: s => s.connections.some(c => (s.devices.find(d=>d.id===c.from)?.type==='router' && s.devices.find(d=>d.id===c.to)?.type==='switch') || (s.devices.find(d=>d.id===c.from)?.type==='switch' && s.devices.find(d=>d.id===c.to)?.type==='router')) },
                { id: 3, description: "Create network segments. Select the Router and add two VLANs: 'Cameras' and 'Office'.", isComplete: s => s.vlans.length >= 2 && s.vlans.some(v=>v.name.toLowerCase()==='cameras') && s.vlans.some(v=>v.name.toLowerCase()==='office') },
                { id: 4, description: "Drag an IP Camera and an NVR onto the canvas. Connect both to the Switch.", isComplete: s => { const deviceTypes = new Set(s.devices.map(d=>d.type)); const connectionsToSwitch = s.connections.filter(c => s.devices.find(d=>d.id===c.from)?.type==='switch' || s.devices.find(d=>d.id===c.to)?.type==='switch').length; return deviceTypes.has('ip-camera') && deviceTypes.has('nvr') && connectionsToSwitch >= 3; }},
                { id: 5, description: "Isolate camera traffic. Select the Switch and assign the ports connected to the IP Camera and NVR to the 'Cameras' VLAN.", isComplete: s => { const sw = s.devices.find(d=>d.type==='switch'); if(!sw) return false; const camVlan = s.vlans.find(v=>v.name.toLowerCase()==='cameras'); if(!camVlan) return false; const connectedPorts = sw.ports.filter(p => p.connectedTo !== null); const portsInVlan = connectedPorts.filter(p => p.vlanId === camVlan.id); return portsInVlan.length >= 2; }},
                { id: 6, description: "Configure device IPs. Set the NVR's IP to '192.168.10.10' and the IP Camera's to '192.168.10.20'. Both need the gateway '192.168.10.1'.", isComplete: s => { const nvr = s.devices.find(d=>d.type==='nvr'); const cam = s.devices.find(d=>d.type==='ip-camera'); return nvr?.ip==='192.168.10.10' && cam?.ip==='192.168.10.20' && nvr?.gateway==='192.168.10.1' && cam?.gateway==='192.168.10.1'; }},
                { id: 7, description: "Secure the network. Open the Firewall and add a rule to 'Allow' traffic where the Source is 'VLAN10' and Destination is 'VLAN10'.", isComplete: s => s.firewallRules.some(r=>r.action==='Allow' && r.source.toUpperCase()==='VLAN10' && r.dest.toUpperCase()==='VLAN10') },
                { id: 8, description: "Allow remote access for the owner. Add a firewall rule to 'Allow' traffic from source '50.207.118.1' to destination '192.168.10.10' on port '8443'.", isComplete: s => s.firewallRules.some(r=>r.action==='Allow' && r.source==='50.207.118.1' && r.dest==='192.168.10.10' && r.port==='8443') },
                { id: 9, description: "Network configured and secured! This is a solid, professional setup. You can continue experimenting in this sandbox.", isComplete: () => false },
            ]
        }
    };

    // This single object will hold references to all DOM elements we need.
    const dom = {}; 

    /**
     * Master function to update all visual parts of the application based on the current state.
     */
    const renderAll = () => {
        renderDevices();
        renderConnections();
        renderConfigPanel();
        renderTask();
    };

    /**
     * Checks if the current task is complete and advances to the next one if it is.
     */
    const checkTaskCompletion = () => {
        const task = state.tasks.list[state.tasks.currentIndex];
        if (!task || task.isComplete(state) === false) return;
        
        console.log(`Task ${task.id} complete!`);
        if(task.id < state.tasks.list.length) {
            state.tasks.currentIndex++;
            renderTask();
        }
    };
    
    // ==========================================================================
    // --- RENDERING FUNCTIONS ---
    // These functions are responsible for drawing the UI based on the state.
    // ==========================================================================

    function renderDevices() {
        dom.canvasDevices.innerHTML = '';
        state.devices.forEach(device => {
            const el = document.createElement('div');
            el.className = 'canvas-device';
            el.dataset.id = device.id;
            el.style.left = `${device.left}px`;
            el.style.top = `${device.top}px`;
            if (device.id === state.selectedDeviceId) el.classList.add('selected');
            if (state.connectMode.active && state.connectMode.sourceId === device.id) el.classList.add('connect-source');
            
            const template = document.querySelector(`.device[data-type="${device.type}"]`);
            el.innerHTML = template.innerHTML;

            el.addEventListener('click', e => { e.stopPropagation(); if (state.connectMode.active) handleConnection(device.id); else selectDevice(device.id); });
            el.addEventListener('mousedown', e => handleDeviceMouseDown(e, device.id));
            dom.canvasDevices.appendChild(el);
        });
    }

    function renderConnections() {
        dom.connectionLines.innerHTML = '';
        state.connections.forEach(conn => {
            const fromDevice = state.devices.find(d => d.id === conn.from);
            const toDevice = state.devices.find(d => d.id === conn.to);
            if (!fromDevice || !toDevice) return;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', fromDevice.left + 50); line.setAttribute('y1', fromDevice.top + 50);
            line.setAttribute('x2', toDevice.left + 50); line.setAttribute('y2', toDevice.top + 50);
            dom.connectionLines.appendChild(line);
        });
    }

    function renderConfigPanel() {
        dom.configViews.forEach(v => v.classList.remove('active'));
        const device = state.devices.find(d => d.id === state.selectedDeviceId);
        if (!device) { dom.defaultConfigView.classList.add('active'); return; }

        let targetView;
        switch (device.type) {
            case 'router':
                targetView = dom.routerConfigView;
                targetView.querySelector('#router-name').value = device.name;
                const vlanList = targetView.querySelector('#vlan-list');
                vlanList.innerHTML = '';
                state.vlans.forEach(vlan => {
                    const vlanEl = document.createElement('div');
                    vlanEl.className = 'vlan-item';
                    vlanEl.innerHTML = `<span><b>VLAN ${vlan.id}:</b> ${vlan.name}</span> <span class="vlan-item-gateway">${vlan.gateway}</span>`;
                    vlanList.appendChild(vlanEl);
                });
                break;
            case 'switch':
                targetView = dom.switchConfigView;
                targetView.querySelector('#switch-name').value = device.name;
                const portBody = targetView.querySelector('#switch-ports');
                portBody.innerHTML = '';
                device.ports.forEach(port => {
                    const row = document.createElement('tr');
                    const vlanOptions = state.vlans.map(v => `<option value="${v.id}" ${port.vlanId === v.id ? 'selected' : ''}>${v.name} (VLAN ${v.id})</option>`).join('');
                    const isConnected = port.connectedTo ? `🔗 Connected` : '🔌 Unused';
                    row.innerHTML = `<td>${port.id} <small>${isConnected}</small></td><td><select data-port-id="${port.id}" class="vlan-select"><option value="1">Default</option>${vlanOptions}</select></td>`;
                    portBody.appendChild(row);
                });
                break;
            default: // Endpoints (NVR, Camera, Workstation)
                targetView = dom.endpointConfigView;
                targetView.querySelector('#endpoint-title').textContent = `${device.type.replace('-', ' ')} Settings`;
                targetView.querySelector('#endpoint-name').value = device.name;
                targetView.querySelector('#endpoint-ip').value = device.ip || '';
                targetView.querySelector('#endpoint-subnet').value = device.subnet || '';
                targetView.querySelector('#endpoint-gateway').value = device.gateway || '';
                break;
        }
        if (targetView) targetView.classList.add('active');
    }

    function renderTask() {
        const task = state.tasks.list[state.tasks.currentIndex];
        if (task) dom.taskText.textContent = task.description;
    }
    
    function renderFirewallRules() {
        dom.firewallRulesList.innerHTML = '';
        state.firewallRules.forEach((rule, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td class="${rule.action.toLowerCase()}">${rule.action}</td>
                <td>${rule.source}</td>
                <td>${rule.dest}</td>
                <td>${rule.port}</td>
                <td><button class="btn btn-danger btn-small" data-rule-index="${index}">Del</button></td>
            `;
            dom.firewallRulesList.appendChild(row);
        });
    }

    // ==========================================================================
    // --- INTERACTION LOGIC ---
    // Functions that handle user actions like clicks and drags.
    // ==========================================================================

    const selectDevice = id => {
        state.selectedDeviceId = id;
        // Exit connect mode if a device is selected normally
        if (state.connectMode.active) state.connectMode.active = false;
        renderAll();
    };

    const handleConnection = targetId => {
        if (!state.connectMode.active || state.connectMode.sourceId === targetId) return;
        
        const sourceDevice = state.devices.find(d => d.id === state.connectMode.sourceId);
        const targetDevice = state.devices.find(d => d.id === targetId);

        // Simple logic to "use up" a port on a switch
        if (sourceDevice.type === 'switch') {
            const port = sourceDevice.ports.find(p => !p.connectedTo);
            if (port) port.connectedTo = targetId;
        }
        if (targetDevice.type === 'switch') {
            const port = targetDevice.ports.find(p => !p.connectedTo);
            if (port) port.connectedTo = state.connectMode.sourceId;
        }
        
        state.connections.push({ from: state.connectMode.sourceId, to: targetId });
        state.connectMode.active = false; state.connectMode.sourceId = null;
        
        document.getElementById('network-canvas-container').classList.remove('connect-mode');
        renderAll();
        checkTaskCompletion();
    };
    
    function handleDeviceMouseDown(e, deviceId) {
        if (e.button !== 0) return;
        const device = state.devices.find(d => d.id === deviceId);
        if (device) {
            Object.assign(state.draggedElement, { id: deviceId, initialX: device.left, initialY: device.top, mouseX: e.clientX, mouseY: e.clientY });
            window.addEventListener('mousemove', handleDeviceMouseMove);
            window.addEventListener('mouseup', handleDeviceMouseUp);
        }
    }

    function handleDeviceMouseMove(e) {
        if (state.draggedElement.id === null) return;
        const deltaX = e.clientX - state.draggedElement.mouseX;
        const deltaY = e.clientY - state.draggedElement.mouseY;
        const device = state.devices.find(d => d.id === state.draggedElement.id);
        if (device) {
            device.left = state.draggedElement.initialX + deltaX;
            device.top = state.draggedElement.initialY + deltaY;
            // Only re-render connections during drag for performance
            renderDevices();
            renderConnections();
        }
    }

    function handleDeviceMouseUp() {
        state.draggedElement.id = null;
        window.removeEventListener('mousemove', handleDeviceMouseMove);
        window.removeEventListener('mouseup', handleDeviceMouseUp);
    }

    // ==========================================================================
    // --- INITIALIZATION ---
    // Sets up the application, populates the DOM object, and attaches event listeners.
    // ==========================================================================
    function init() {
        // Populate DOM object
        const ids = ['device-toolbar', 'network-canvas-container', 'canvas-devices', 'connection-lines', 'config-panel', 'config-content', 'config-default', 'config-router', 'config-switch', 'config-endpoint', 'task-box', 'task-text', 'router-name', 'switch-name', 'switch-ports', 'endpoint-name', 'endpoint-ip', 'endpoint-subnet', 'endpoint-gateway', 'endpoint-title', 'firewall-btn', 'firewall-modal', 'close-firewall-btn', 'firewall-rules-list', 'add-rule-btn', 'add-rule-modal', 'add-rule-form', 'cancel-rule-btn', 'vlan-list', 'add-vlan-btn', 'vlan-name-input'];
        ids.forEach(id => dom[id.replace(/-(\w)/g, (m, g) => g.toUpperCase())] = document.getElementById(id));
        
        // Toolbar Drag & Drop
        document.querySelectorAll('#device-toolbar .device').forEach(device => {
            device.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', e.currentTarget.dataset.type); e.dataTransfer.effectAllowed = 'copy'; });
        });
        dom.networkCanvasContainer.addEventListener('dragover', e => e.preventDefault());
        dom.networkCanvasContainer.addEventListener('drop', e => {
            e.preventDefault();
            const type = e.dataTransfer.getData('text/plain');
            const rect = dom.networkCanvasContainer.getBoundingClientRect();
            let newDevice = { id: state.nextDeviceId++, type, name: `${type}-${state.nextDeviceId-1}`, top: e.clientY - rect.top - 50, left: e.clientX - rect.left - 50, gateway: '', ip: '', subnet: '255.255.255.0' };
            if (type === 'switch') { newDevice.ports = Array.from({length: 8}, (_, i) => ({id: i+1, vlanId: 1, connectedTo: null})); }
            state.devices.push(newDevice);
            renderAll();
            checkTaskCompletion();
        });

        // Universal event listeners
        dom.networkCanvasContainer.addEventListener('click', () => selectDevice(null));
        dom.configPanel.addEventListener('click', e => {
            if(e.target.classList.contains('btn-connect')) { 
                state.connectMode = { active: true, sourceId: state.selectedDeviceId }; 
                document.getElementById('network-canvas-container').classList.add('connect-mode');
                renderAll(); 
            }
        });
        dom.configPanel.addEventListener('change', e => { // For select dropdowns
            if(e.target.classList.contains('vlan-select')) {
                const portId = parseInt(e.target.dataset.portId);
                const vlanId = parseInt(e.target.value);
                const sw = state.devices.find(d=>d.id===state.selectedDeviceId);
                if(sw) sw.ports.find(p=>p.id===portId).vlanId = vlanId;
                renderAll();
                checkTaskCompletion();
            }
        });
        dom.configPanel.addEventListener('input', e => {
            if (!state.selectedDeviceId) return;
            const device = state.devices.find(d => d.id === state.selectedDeviceId);
            if (!device || !e.target.id) return;
            const key = e.target.id.split('-')[1];
            if(key in device) device[key] = e.target.value;
            checkTaskCompletion();
        });

        // Specific Buttons
        dom.addVlanBtn.addEventListener('click', () => {
            const vlanName = dom.vlanNameInput.value.trim();
            if (!vlanName) return;
            const nextVlanId = state.vlans.length === 0 ? 10 : Math.max(...state.vlans.map(v => v.id)) + 10;
            state.vlans.push({ id: nextVlanId, name: vlanName, gateway: `192.168.${nextVlanId}.1` });
            dom.vlanNameInput.value = '';
            renderAll();
            checkTaskCompletion();
        });
        dom.firewallBtn.addEventListener('click', () => { renderFirewallRules(); toggleModal(dom.firewallModal, true); });
        dom.closeFirewallBtn.addEventListener('click', () => toggleModal(dom.firewallModal, false));
        dom.addRuleBtn.addEventListener('click', () => { dom.addRuleForm.reset(); toggleModal(dom.addRuleModal, true); });
        dom.cancelRuleBtn.addEventListener('click', () => toggleModal(dom.addRuleModal, false));
        dom.addRuleForm.addEventListener('submit', e => {
            e.preventDefault();
            state.firewallRules.push({
                action: document.getElementById('rule-action').value,
                source: document.getElementById('rule-source').value.trim(),
                dest: document.getElementById('rule-dest').value.trim(),
                port: document.getElementById('rule-port').value.trim(),
            });
            renderFirewallRules();
            toggleModal(dom.addRuleModal, false);
            checkTaskCompletion();
        });
        dom.firewallRulesList.addEventListener('click', e => {
            if(e.target.classList.contains('btn-danger')) {
                const ruleIndex = parseInt(e.target.dataset.ruleIndex);
                state.firewallRules.splice(ruleIndex, 1);
                renderFirewallRules();
                checkTaskCompletion();
            }
        });
        
        renderAll();
        console.log("Network & Firewall Simulator Initialized.");
    }

    // --- Let's go! ---
    init();
});
