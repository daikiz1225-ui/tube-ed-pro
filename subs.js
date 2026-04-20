/* subs.js - 登録チャンネル専用ファイル */

const SubsManager = {
    // データの取得
    get() {
        const data = localStorage.getItem('yt_subs');
        try { return data ? JSON.parse(data) : []; } catch (e) { return []; }
    },

    // 登録・解除の切り替え
    toggle(ch, refresh = false) {
        let s = this.get();
        const i = s.findIndex(x => x.id === ch.id);
        let status = "";
        if (i > -1) {
            s.splice(i, 1);
            status = "登録解除しました";
        } else {
            s.push({ id: ch.id, name: ch.name, thumb: ch.thumb || '' });
            status = "チャンネル登録しました";
        }
        localStorage.setItem('yt_subs', JSON.stringify(s));
        
        if (typeof Actions !== 'undefined') {
            Actions.showStatusNotification(status);
            // 画面リフレッシュの指定があれば実行
            if (refresh) {
                if (Actions.currentView === "channel") Actions.showChannel(ch.id);
                else if (Actions.currentIndex !== -1 && Actions.currentView !== "subs") Actions.play(Actions.currentList[Actions.currentIndex]);
            }
        }
    },

    // サイドバーの描画 (app.jsのloadSidebarLatestの代わり)
    updateSidebar() {
        const container = document.getElementById('sidebar-subs-list'); // HTML側にこのIDのコンテナがある前提
        if (!container) return;
        const subs = this.get();
        if (subs.length === 0) {
            container.innerHTML = '<div style="font-size:10px; color:#666; padding:10px;">登録なし</div>';
            return;
        }
        container.innerHTML = subs.map(ch => `
            <div class="nav-item sub-item" onclick="Actions.showChannel('${ch.id}')" title="${ch.name}">
                <img src="${ch.thumb}" style="width:24px; height:24px; border-radius:50%; margin-right:10px;">
                <span class="sub-name">${ch.name}</span>
            </div>
        `).join('');
    },

    // 「登録済み」メイン画面 (app.jsのActions.showSubsから移植)
    async showSubs() {
        if (typeof Actions !== 'undefined') Actions.currentView = "subs";
        const subs = this.get();
        const container = document.getElementById('view-container');
        
        const scrollStyles = `display: flex; overflow-x: auto; gap: 20px; padding: 20px; background: #0f0f0f; border-bottom: 1px solid #333; scrollbar-width: none; -ms-overflow-style: none;`;
        const channelItemsHtml = subs.map(ch => `
            <div style="flex: 0 0 auto; text-align: center; width: 85px; cursor: pointer;" onclick="Actions.showChannel('${ch.id}')">
                <div style="position:relative; width:65px; height:65px; margin: 0 auto;">
                    <img src="${ch.thumb}" style="width: 100%; height: 100%; border-radius: 50%; border: 2px solid #444; object-fit: cover;">
                </div>
                <div style="font-size: 11px; color: #fff; margin-top: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 2px;">${ch.name}</div>
            </div>
        `).join('');

        container.innerHTML = `
            <div style="${scrollStyles}" class="no-scrollbar">${channelItemsHtml}</div>
            <div style="padding: 20px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h2 style="margin:0;">最新タイムライン</h2>
                    <span style="font-size:12px; color:#aaa;">(3日以内の一括取得)</span>
                </div>
                <div id="subs-timeline-grid" class="grid" style="margin-top:20px;">タイムライン読み込み中...</div>
            </div>
        `;

        try {
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            let allActivities = [];
            for (let i = 0; i < subs.length; i += 5) {
                const chunk = subs.slice(i, i + 5);
                const promises = chunk.map(ch => YT.fetchAPI('activities', { 
                    channelId: ch.id, part: 'snippet,contentDetails', maxResults: 5, publishedAfter: threeDaysAgo.toISOString() 
                }));
                const results = await Promise.all(promises);
                results.forEach(res => { if (res.items) allActivities = [...allActivities, ...res.items]; });
            }
            const timelineVideos = allActivities
                .filter(a => a.snippet.type === 'upload')
                .sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));

            if (typeof Actions !== 'undefined') {
                Actions.currentList = timelineVideos;
                await Actions.fillStats(Actions.currentList);
                const grid = document.getElementById('subs-timeline-grid');
                if (timelineVideos.length === 0) {
                    grid.innerHTML = `<p style="color:#aaa; text-align:center; grid-column: 1/-1; padding:40px;">最近の新着動画はありません。</p>`;
                } else {
                    grid.innerHTML = Actions.renderCards(timelineVideos);
                }
            }
        } catch (e) { console.error("Subs timeline error", e); }
    }
};
