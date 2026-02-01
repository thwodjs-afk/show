export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const { bl } = req.query;

    if (!bl) {
        return res.status(400).json({ error: 'B/L 번호를 입력해주세요.' });
    }

    const API_KEY = 'j290w206j092b052c060x050a0';
    const blNo = bl.trim();

    try {
        // 유니패스 Open API 공식 URL (XML)
        const url = `https://apis.customs.go.kr/openapi/service/cargCsclPrgsInfoQry/getCargCsclPrgsInfo?serviceKey=${API_KEY}&hblNo=${blNo}&year=2026`;

        const response = await fetch(url);
        const text = await response.text();

        return res.status(200).json({ 
            raw: text.substring(0, 3000),
            url: url
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
