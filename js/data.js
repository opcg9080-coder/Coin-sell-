/**
 * Coin Exchange - Asset Conversion Engine
 * Implements strict calculation processing, request staging logic, and balance confirmation validations.
 */
const ExchangeEngine = {
    init() {
        this.cacheElements();
        this.bindEvents();
    },

    cacheElements() {
        this.form = document.getElementById('exchange-form');
        this.directionSelect = document.getElementById('exchange-direction');
        this.quantityInput = document.getElementById('exchange-quantity');
        this.rateDisplay = document.getElementById('exchange-rate-display');
        this.outputDisplay = document.getElementById('exchange-output-display');
    },

    bindEvents() {
        if (this.directionSelect) {
            this.directionSelect.addEventListener('change', () => this.calculateConversionPreview());
        }
        if (this.quantityInput) {
            this.quantityInput.addEventListener('input', () => this.calculateConversionPreview());
        }
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleExchangeSubmission(e));
        }
    },

    calculateConversionPreview() {
        if (!this.directionSelect || !this.quantityInput || !this.outputDisplay || !this.rateDisplay) return;

        const rate = DataLayer.getExchangeRate();
        const direction = this.directionSelect.value;
        const amount = parseFloat(this.quantityInput.value) || 0;

        if (direction === 'gold_to_purple') {
            this.rateDisplay.textContent = `1 GC = ${rate.toFixed(1)} PC`;
            this.outputDisplay.textContent = `${(amount * rate).toFixed(2)} PC`;
        } else {
            this.rateDisplay.textContent = `${rate.toFixed(1)} PC = 1 GC`;
            this.outputDisplay.textContent = `${(amount / rate).toFixed(2)} GC`;
        }
    },

    handleExchangeSubmission(e) {
        e.preventDefault();
        
        const direction = this.directionSelect.value;
        const amount = parseFloat(this.quantityInput.value);

        if (!amount || amount <= 0) {
            if (window.UIEngine) window.UIEngine.showToast('Please enter a valid transactional quantity.', 'error');
            return;
        }

        const userState = DataLayer.get(DataLayer.STORAGE_KEYS.USER_STATE);
        const rate = DataLayer.getExchangeRate();
        let sourceBalance = 0;
        let expectedOutput = 0;

        if (direction === 'gold_to_purple') {
            sourceBalance = userState.wallet.gold;
            expectedOutput = amount * rate;
        } else {
            sourceBalance = userState.wallet.purple;
            expectedOutput = amount / rate;
        }

        if (amount > sourceBalance) {
            if (window.UIEngine) window.UIEngine.showToast('Insufficient funding available in chosen wallet category.', 'error');
            return;
        }

        // Deduct source amount from the active balances immediately
        if (direction === 'gold_to_purple') {
            userState.wallet.gold -= amount;
        } else {
            userState.wallet.purple -= amount;
        }

        // Track local execution count matrix indices parameters
        userState.metrics.exchangeCount += 1;
        DataLayer.set(DataLayer.STORAGE_KEYS.USER_STATE, userState);

        // Append item entry structure safely inside execution arrays
        const requests = DataLayer.get(DataLayer.STORAGE_KEYS.EXCHANGE_REQ) || [];
        const requestId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
        
        const now = new Date();
        const timestamp = now.toISOString().replace('T', ' ').substring(0, 16);

        const newRequest = {
            id: requestId,
            type: direction,
            amount: amount,
            output: expectedOutput,
            status: 'pending',
            timestamp: timestamp
        };

        requests.unshift(newRequest);
        DataLayer.set(DataLayer.STORAGE_KEYS.EXCHANGE_REQ, requests);

        // Update unified state telemetry data layers logs and notification engines systems
        DataLayer.addLog('EXCHANGE', `Requested swap of ${amount.toFixed(2)} to ${expectedOutput.toFixed(2)} assets`, requestId);
        
        if (window.NotificationEngine) {
            window.NotificationEngine.add(
                'Exchange Pending',
                `Conversion request tracking identifier ${requestId} entered system queue safely.`,
                requestId
            );
        }

        // Wipe clean localized application layout fields parameters
        this.quantityInput.value = '';
        this.calculateConversionPreview();

        if (window.UIEngine) {
            window.UIEngine.showToast('Conversion conversion transaction requested successfully.', 'success');
            window.UIEngine.renderAll();
        }
    }
};
