export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const { bl } = req.query;

    if (!bl) {
        return res.status(400).json({ error: 'B/L 번호를 입력해주세요.' });
    }

    const blNo = bl.trim();

    try {
        // 유니패스 웹 조회 URL (비로그인 조회)
        const url = `https://unipass.customs.go.kr/csp/myc/bsopspptinfo/cscllgstinfo/ImpCargPrgsInfoMtCtr/retrieveImpCargPrgsInfoLst.do`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: `blYy=2026&hblNo=${blNo}&mblNo=&blTpCd=2`
        });
        
        const text = await response.text();

        return res.status(200).json({
            raw: text.substring(0, 3000)
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
