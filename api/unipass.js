export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const { bl } = req.query;

    if (!bl) {
        return res.status(400).json({ error: 'B/L 번호를 입력해주세요.' });
    }

    const API_KEY = 'j290w206j092b052c060x050a0';
    const blNo = bl.trim();

    try {
        // Open API 공식 URL
        const url = `https://unipass.customs.go.kr/csp/myc/bsopspptinfo/cscllgstinfo/ImpCargPrgsInfoMtCtr/retrieveImpCargPrgsInfoLstIvk.do?crkyCn=${API_KEY}&hblNo=${blNo}&blYy=2026&qryTp=2`;

        const response = await fetch(url);
        const text = await response.text();

        // JSON 파싱 시도
        try {
            const json = JSON.parse(text);
            return res.status(200).json(json);
        } catch {
            return res.status(200).json({ raw: text.substring(0, 2000) });
        }

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
