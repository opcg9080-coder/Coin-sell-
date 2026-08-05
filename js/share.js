/**
 * Coin Exchange - Secure Peer Transfer Engine
 * Validates transmission credentials and enforces atomic ledger debit modifications.
 */
const ShareEngine = {
    init() {
        this.cacheElements();
        this.bindEvents();
    },

    cacheElements() {
        this.form = document.getElementById('share-form');
        this.assetSelect = document.getElementById('share-asset-type');
        this.receiverInput = document.getElementById('share-receiver-id');
        this.quantityInput = document.getElementById('share-quantity');
        this.secretInput = document.getElementById('share-secret-code');
    },

    bindEvents() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleAssetTransmission(e));
        }
    },

    handleAssetTransmission(e) {
        e.preventDefault();

        const assetType = this.assetSelect.value;
        const receiverId = this.receiverInput.value.trim();
        const amount = parseFloat(this.quantityInput.value);
        const secretCode = this.secretInput.value;

        if (!receiverId) {
            if (window.UIEngine) window.UIEngine.showToast('Please specify a valid receiver operational destination identifier.', 'error');
            return;
        }

        if (!amount || amount  availableBalance) {
            if (window.UIEngine) window.UIEngine.showToast('Source balance parameters insufficient for allocation amount.', 'error');
            return;
        }

        if (assetType === 'GC') {
            userState.wallet.gold -= amount;
        } else if (assetType === 'PC') {
            userState.wallet.purple -= amount;
        }

        userState.metrics.shareCount += 1;
        DataLayer.set(DataLayer.STORAGE_KEYS.USER_STATE, userState);

        const refId = `TXS-${Math.floor(100000 + Math.random() * 900000)}`;
        DataLayer.addLog('SHARE', `Transferred ${amount.toFixed(2)} ${assetType} directly to peer target account ${receiverId}`, refId);

        if (window.NotificationEngine) {
            window.NotificationEngine.add(
                'Coin Sent',
                `Successfully transmitted ${amount.toFixed(2)} ${assetType} to target peer identifier link address ${receiverId}.`,
                refId
            );
        }

        this.receiverInput.value = '';
        this.quantityInput.value = '';
        this.secretInput.value = '';

        if (window.UIEngine) {
            window.UIEngine.showToast(`Transmitted ${amount.toFixed(2)} ${assetType} securely.`, 'success');
            window.UIEngine.renderAll();
        }
    }
};
