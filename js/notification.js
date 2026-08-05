/**
 * Coin Exchange - Notification Core Engine
 * Manages array mutations, historical telemetry tracking, and badge counter synchronization.
 */
const NotificationEngine = {
    init() {
        this.cacheElements();
        this.bindEvents();
    },

    cacheElements() {
        this.clearBtn = document.getElementById('clear-notifications-btn');
    },

    bindEvents() {
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearAllNotifications());
        }
    },

    add(title, desc, referenceId) {
        const notifications = DataLayer.get(DataLayer.STORAGE_KEYS.NOTIFICATIONS) || [];
        const now = new Date();
        const timestamp = now.toISOString().replace('T', ' ').substring(0, 16);
        
        const newNoti = {
            id: `NOTI-${Math.floor(1000 + Math.random() * 9000)}`,
            title: title,
            desc: desc,
            time: timestamp,
            read: false,
            ref: referenceId
        };
        
        notifications.unshift(newNoti);
        DataLayer.set(DataLayer.STORAGE_KEYS.NOTIFICATIONS, notifications);
        
        if (window.UIEngine && typeof window.UIEngine.renderAll === 'function') {
            window.UIEngine.renderAll();
        }
    },

    clearAllNotifications() {
        DataLayer.set(DataLayer.STORAGE_KEYS.NOTIFICATIONS, []);
        DataLayer.addLog('SYSTEM', 'Cleared user notification database records', 'CLR-NOTI');
        
        if (window.UIEngine) {
            window.UIEngine.showToast('All notifications purged successfully.', 'info');
            window.UIEngine.renderAll();
        }
    }
};
