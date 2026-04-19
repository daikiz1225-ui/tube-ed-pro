/* utils.js - 共通ユーティリティ */
const Utils = {
    timeAgo(dateString) {
        const now = new Date();
        const past = new Date(dateString);
        const diff = Math.floor((now - past) / 1000);
        if (diff < 60) return `${diff}秒前`;
        if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
        return `${Math.floor(diff / 86400)}日前`;
    },

    formatViews(views) {
        if (!views) return "0回";
        const num = parseInt(views);
        if (num >= 100000000) return `${(num / 100000000).toFixed(1)}億回`;
        if (num >= 10000) return `${(num / 10000).toFixed(1)}万回`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}千回`;
        return `${num}回`;
    },

    // 通知ポップアップ（旧Actions.showStatusNotification）
    showNotify(msg) {
        const div = document.createElement('div');
        div.className = 'status-notification';
        div.innerText = msg;
        document.body.appendChild(div);
        setTimeout(() => div.classList.add('show'), 10);
        setTimeout(() => {
            div.classList.remove('show');
            setTimeout(() => div.remove(), 300);
        }, 2000);
    }
};
