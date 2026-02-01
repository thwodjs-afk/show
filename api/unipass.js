export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const { bl } = req.query;

    if (!bl) {
        return res.status(400).json({ error: 'B/L 번호를 입력해주세요.' });
    }

    const API_KEY = 'j290w206j092b052c060x050a0';
    const blNo = bl.trim();

    try {
        // 유니패스 공식 API URL 형식
        const url = `https://unipass.customs.go.kr/csp/myc/bsopspptinfo/cscllgstinfo/ImpCargPrgsInfoMtCtr/retrieveImpCargPrgsInfoLst.do?crkyCn=${API_KEY}&hblNo=${blNo}&blYy=2026`;
        
        const response = await fetch(url);
        const text = await response.text();

        return res.status(200).json({
            success: false,
            message: '응답 확인',
            raw: text.substring(0, 1000),
            url: url
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
