export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { bl } = req.query;

    if (!bl) {
        return res.status(400).json({ error: 'B/L 번호를 입력해주세요.' });
    }

    const API_KEY = 'j290w206j092b052c060x050a0';
    const blNo = bl.trim();
    const year = new Date().getFullYear();

    try {
        // 여러 방식으로 조회 시도
        const urls = [
            `https://unipass.customs.go.kr/csp/handler/RetrieveCargoClearanceProgress?crkyCn=${API_KEY}&hblNo=${blNo}&year=${year}`,
            `https://unipass.customs.go.kr/csp/handler/RetrieveCargoClearanceProgress?crkyCn=${API_KEY}&mblNo=${blNo}&year=${year}`,
            `https://unipass.customs.go.kr/csp/handler/RetrieveCargoClearanceProgress?crkyCn=${API_KEY}&hblNo=${blNo}`,
            `https://unipass.customs.go.kr/csp/handler/RetrieveCargoClearanceProgress?crkyCn=${API_KEY}&mblNo=${blNo}`,
            `https://unipass.customs.go.kr/csp/handler/RetrieveCargoClearanceProgress?crkyCn=${API_KEY}&blNo=${blNo}&blYy=${year}`,
        ];

        for (const url of urls) {
            const response = await fetch(url);
            const xmlText = await response.text();
            
            const result = parseXml(xmlText, blNo);
            if (result.success) {
                return res.status(200).json(result);
            }
        }

        return res.status(200).json({
            success: false,
            message: '조회 결과가 없습니다. B/L 번호를 확인해주세요.',
            data: null
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: '오류 발생',
            error: error.message
        });
    }
}

function parseXml(xmlText, blNo) {
    const getValue = (xml, tag) => {
        const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
        return match ? match[1] : '';
    };

    const infoMatch = xmlText.match(/<cargClrcPrgsInfoQryVo>([\s\S]*?)<\/cargClrcPrgsInfoQryVo>/);
    
    if (!infoMatch) {
        return { success: false };
    }

    const infoXml = infoMatch[1];
    const status = getValue(infoXml, 'prgsStts') || '';
    const location = getValue(infoXml, 'shcoNm') || getValue(infoXml, 'shedNm') || '-';
    const product = getValue(infoXml, 'prnm') || '-';
    const time = getValue(infoXml, 'prcsDttm') || '-';

    if (!status) {
        return { success: false };
    }

    let step = 1;
    if (status.includes('하선') || status.includes('반입')) step = 2;
    if (status.includes('수리
