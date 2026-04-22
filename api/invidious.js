/**
 * /api/invidious.js
 * フロントエンドからの要求を Invidious API に橋渡しするプロキシ
 */

export const config = {
    runtime: 'edge', // 高速応答のため Edge Runtime を使用
};

// 信頼性の高い Invidious インスタンス（必要に応じて変更可能）
const INVIDIOUS_BASE = 'https://inv.thepixora.com/api/v1';

export default async function handler(req) {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint');
    
    // パラメータの取得
    const id = searchParams.get('id') || searchParams.get('videoId');
    const q = searchParams.get('q');
    const channelId = searchParams.get('channelId');
    const playlistId = searchParams.get('playlistId');
    const pageToken = searchParams.get('pageToken') || searchParams.get('continuation');
    const region = searchParams.get('region') || 'JP';
    const type = searchParams.get('type') || 'video'; // video, channel, playlist

    let targetUrl = '';

    // フロントエンドのエンドポイント名に基づいて Invidious の URL を構築
    switch (endpoint) {
        case 'trending':
            targetUrl = `${INVIDIOUS_BASE}/trending?region=${region}`;
            break;

        case 'search':
            // 検索ワード、ページネーション、タイプ（動画/チャンネル等）をサポート
            targetUrl = `${INVIDIOUS_BASE}/search?q=${encodeURIComponent(q)}&type=${type}`;
            if (pageToken) targetUrl += `&page=${pageToken}`;
            break;

        case 'videos':
        case 'related':
            // 動画詳細と関連動画（Invidiousでは1つのAPIで両方取得可能）
            targetUrl = `${INVIDIOUS_BASE}/videos/${id}`;
            break;

        case 'channelVideos':
            // チャンネル内の動画一覧
            targetUrl = `${INVIDIOUS_BASE}/channels/${channelId}/videos`;
            if (pageToken) targetUrl += `?continuation=${pageToken}`;
            break;

        case 'channels':
            // チャンネルの基本情報（アイコン等）
            targetUrl = `${INVIDIOUS_BASE}/channels/${id}`;
            break;

        case 'playlists':
            // チャンネルが持っている再生リストの一覧
            targetUrl = `${INVIDIOUS_BASE}/channels/${channelId}/playlists`;
            break;

        case 'playlistItems':
            // 特定の再生リスト内の動画一覧
            targetUrl = `${INVIDIOUS_BASE}/playlists/${playlistId}`;
            break;

        default:
            // デフォルトはトレンドを返す
            targetUrl = `${INVIDIOUS_BASE}/trending?region=${region}`;
    }

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Vercel Serverless Function)'
            }
        });

        if (!response.ok) {
            throw new Error(`Invidious API error: ${response.status}`);
        }

        const data = await response.json();

        // クライアント側で YouTube 形式に変換しやすいよう、そのまま JSON で返す
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800', // キャッシュ設定
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Backend Error:', error);
        
        // エラー時はフロントエンドが止まらないよう、正常な形式の空データを返す
        return new Response(JSON.stringify({
            items: [],
            error: error.message,
            nextPageToken: null
        }), {
            status: 200, // フロントエンドのエラーハンドリングに合わせる
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
