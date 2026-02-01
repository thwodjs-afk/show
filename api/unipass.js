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

    const UNIPASS_KEY = 'j290w206j092b052c060x050a0';

    try {
        const uniUrl = `https://unipass.customs.go.kr/csp/handler/RetrieveCargoClearanceProgress?crkyCn=${UNIPASS_KEY}&hblNo=${bl.trim()}`;
        
        const response = await fetch(uniUrl);
        const xmlText = await response.text();

        const getValue = (xml, tag) => {
            const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
            return match ? match[1] : '';
        };

        const infoMatch = xmlText.match(/<cargClrcPrgsInfoQryVo>([\s\S]*?)<\/cargClrcPrgsInfoQryVo>/);
        
        if (!infoMatch) {
            return res.status(200).json({
                success: false,
                message: '조회 결과가 없습니다.',
                data: null
            });
        }

        const infoXml = infoMatch[1];
        const status = getValue(infoXml, 'prgsStts');
        const location = getValue(infoXml, 'shcoNm') || '인천항';
        const product = getValue(infoXml, 'prnm') || '-';
        const time = getValue(infoXml, 'prcsDttm') || '-';

        let step = 1;
        if (status.includes('하선') || status.includes('반입')) step = 2;
        if (status.includes('수리') || status.includes('결재')) step = 3;
        if (status.includes('반출')) step = 4;

        return res.status(200).json({
            success: true,
            data: { status, location, product, time, step }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: '오류 발생',
            error: error.message
        });
    }
}
