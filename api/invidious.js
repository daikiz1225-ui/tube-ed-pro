export const config = { runtime: 'edge' };

const BASE = 'https://inv.thepixora.com/api/v1';

export default async function handler(req) {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint');
    
    let target = '';
    
    switch (endpoint) {
        case 'trending':
            target = `${BASE}/trending?region=${searchParams.get('region') || 'JP'}`;
            break;
        case 'search':
            target = `${BASE}/search?q=${encodeURIComponent(searchParams.get('q'))}`;
            break;
        case 'videos':
            target = `${BASE}/videos/${searchParams.get('id')}`;
            break;
        case 'related':
            target = `${BASE}/videos/${searchParams.get('id')}`; // Invidiousは動画詳細に関連動画が含まれる
            break;
        case 'channelVideos':
            target = `${BASE}/channels/${searchParams.get('channelId')}/videos`;
            break;
        default:
            return new Response("Invalid Endpoint", { status: 400 });
    }

    try {
        const res = await fetch(target);
        const data = await res.json();
        
        // 関連動画リクエストの場合は、レスポンスの 'related' 部分だけを抽出して返すなどの調整が可能
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: true, items: [] }), { status: 200 });
    }
}
