/* storage.js - ローカルデータの管理 */
const Storage = {
    get(key, def = '[]') {
        return JSON.parse(localStorage.getItem(key) || def);
    },
    set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // 履歴管理
    saveHistory(video) {
        let history = this.get('yt_history');
        history = history.filter(v => v.id !== video.id);
        history.unshift(video);
        this.set('yt_history', history.slice(0, 100)); // 最大100件
    },

    // 登録チャンネル管理
    toggleSub(channelId, channelTitle, channelThumb) {
        let subs = this.get('yt_subs');
        const idx = subs.findIndex(s => s.id === channelId);
        if (idx > -1) {
            subs.splice(idx, 1);
            Utils.showNotify("登録解除しました");
        } else {
            subs.push({ id: channelId, title: channelTitle, thumb: channelThumb });
            Utils.showNotify("チャンネル登録しました");
        }
        this.set('yt_subs', subs);
        return idx === -1; // 登録した場合はtrue
    }
    // ...その他のプレイリスト保存などもここに追加
};
