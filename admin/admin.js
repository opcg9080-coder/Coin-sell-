/**
 * Coin Exchange - Administrative Operations Engine
 * Coordinates state mutations across queues, custom indexing controls, and client logs.
 */
document.addEventListener('DOMContentLoaded', () => {
    AdminEngine.init();
});

const AdminEngine = {
    init() {
        this.cacheElements();
        this.bindEvents();
        this.renderQueue();
        this.loadCurrentRate();
    },

    cacheElements() {
        this.rateForm = document.getElementById('admin-rate-form');
        this.rateInput = document.getElementById('rate-multiplier');
        this.coinForm = document.getElementById('admin-coin-form');
        this.coinNameInput = document.getElementById('new-coin-name');
        this.coinTickerInput = document.getElementById('new-coin-ticker');
        this.queueTbody = document.getElementById('admin-queue-tbody');
        this.refreshBtn = document.getElementById('refresh-queue-btn');
        this.toast = document.getElementById('admin-toast');
    },

    bindEvents() {
        if (this.rateForm) {
            this.rateForm.addEventListener('submit', (e) => this.handleRateUpdate(e));
        }
        if (this.coinForm) {
            this.coinForm.addEventListener('submit', (e) => this.handleCoinPublish(e));
        }
        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => this.renderQueue());
        }
    },

    loadCurrentRate() {
        if (!this.rateInput) return;
        const currentRate = typeof DataLayer !== 'undefined' ? DataLayer.getExchangeRate() : 2.5;
        this.rateInput.value = currentRate;
    },

    renderQueue() {
        if (!this.queueTbody || typeof DataLayer === 'undefined') return;
        const requests = DataLayer.get(DataLayer.STORAGE_KEYS.EXCHANGE_REQ) || [];
        const pendingRequests = requests.filter(r => r.status === 'pending');

        if (pendingRequests.length === 0) {
            this.queueTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--color-admin-muted);padding:24px 0;">No active swap actions inside request queues.</td></tr>`;
            return;
        }

        this.queueTbody.innerHTML = pendingRequests.map(req => {
            const operationLabel = req.type === 'gold_to_purple' ? 'GC &rarr; PC' : 'PC &rarr; GC';
            return `
                <tr>
                    <td><strong style="font-family:monospace;">${req.id}</strong></td>
                    <td>${operationLabel}</td>
                    <td>${req.amount.toFixed(2)}</td>
                    <td><small style="color:var(--color-admin-muted);">${req.timestamp}</small></td>
                    <td class="actions-cell">
                        <button onclick="AdminEngine.processRequest('${req.id}', 'approved')" class="btn-action-approve">Approve</button>
                        <button onclick="AdminEngine.processRequest('${req.id}', 'rejected')" class="btn-action-reject">Reject</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    processRequest(requestId, statusOption) {
        if (typeof DataLayer === 'undefined') return;

        const requests = DataLayer.get(DataLayer.STORAGE_KEYS.EXCHANGE_REQ) || [];
        const userState = DataLayer.get(DataLayer.STORAGE_KEYS.USER_STATE) || [];
        const targetedRequest = requests.find(r => r.id === requestId);

        if (!targetedRequest) return;

        targetedRequest.status = statusOption;

        // Perform balance modifications based on positive transaction confirmation states
        if (statusOption === 'approved') {
            if (targetedRequest.type === 'gold_to_purple') {
                userState.wallet.purple += targetedRequest.output;
            } else {
                userState.wallet.gold += targetedRequest.output;
            }
        } else {
            // Revert original funds back to the user account upon negative rejection outcomes
            if (targetedRequest.type === 'gold_to_purple') {
                userState.wallet.gold += targetedRequest.amount;
            } else {
                userState.wallet.purple += targetedRequest.amount;
            }
        }

        DataLayer.set(DataLayer.STORAGE_KEYS.USER_STATE, userState);
        DataLayer.set(DataLayer.STORAGE_KEYS.EXCHANGE_REQ, requests);

        // Record history updates into log entries and user alerts systems
        const logModule = statusOption.toUpperCase();
        DataLayer.addLog('ADMIN', `Exchange operation tracking link ID ${requestId} mark status setting: ${logModule}`, requestId);

        const notifications = DataLayer.get(DataLayer.STORAGE_KEYS.NOTIFICATIONS) || [];
        const now = new Date();
        const timestamp = now.toISOString().replace('T', ' ').substring(0, 16);

        notifications.unshift({
            id: `NOTI-${Math.floor(1000 + Math.random() * 9000)}`,
            title: statusOption === 'approved' ? 'Exchange Approved' : 'Exchange Rejected',
            desc: `Your conversion request tracking reference identifier ${requestId} has been verified and ${statusOption}.`,
            time: timestamp,
            read: false,
            ref: requestId
        });
        DataLayer.set(DataLayer.STORAGE_KEYS.NOTIFICATIONS, notifications);

        this.showToast(`Request tracking reference ${requestId} processing update: ${statusOption}.`, 'success');
        this.renderQueue();
    },

    handleRateUpdate(e) {
        e.preventDefault();
        const value = parseFloat(this.rateInput.value);

        if (!value || value <= 0) {
            this.showToast('Please insert valid, positive currency index value fields parameters.', 'error');
            return;
        }

        // Apply fallback manual function mapping override inside DataLayer settings profiles
        if (typeof DataLayer !== 'undefined') {
            DataLayer.getExchangeRate = () => value;
            DataLayer.addLog('ADMIN', `Global asset base pricing multipliers multiplier modified parameter setting: 1 GC = ${value} PC`, 'CFG-RATE');
        }

        this.showToast(`Conversion variables updated index rules state successfully: ${value}`, 'success');
    },

    handleCoinPublish(e) {
        e.preventDefault();
        const coinName = this.coinNameInput.value.trim();
        const coinTicker = this.coinTickerInput.value.trim().toUpperCase();

        if (!coinName || !coinTicker) {
            this.showToast('Asset name and shorthand ticker tracking identification properties cannot be blank.', 'error');
            return;
        }

        if (typeof DataLayer !== 'undefined') {
            DataLayer.addLog('ADMIN', `Published initialization configurations properties for asset token: ${coinName} (${coinTicker})`, 'CFG-COIN');
            
            // Route asset notification triggers out across user data storage environments
            const notifications = DataLayer.get(DataLayer.STORAGE_KEYS.NOTIFICATIONS) || [];
            const now = new Date();
            const timestamp = now.toISOString().replace('T', ' ').substring(0, 16);
            
            notifications.unshift({
                id: `NOTI-${Math.floor(1000 + Math.random() * 9000)}`,
                title: 'New Coin Available',
                desc: `${coinName} (${coinTicker}) configuration matrices have been initialized globally across portal nodes.`,
                time: timestamp,
                read: false,
                ref: coinTicker
            });
            DataLayer.set(DataLayer.STORAGE_KEYS.NOTIFICATIONS, notifications);
        }

        this.showToast(`Asset parameters successfully published into registry layers: ${coinTicker}`, 'success');
        this.coinNameInput.value = '';
        this.coinTickerInput.value = '';
    },

    showToast(text, designType = 'info') {
        if (!this.toast) return;
        this.toast.textContent = text;
        this.toast.className = `admin-toast-visible toast-${designType}`;

        setTimeout(() => {
            this.toast.className = 'admin-toast-hidden';
        }, 4000);
    }
};
