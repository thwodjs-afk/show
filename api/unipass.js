export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const { bl } = req.query;

    if (!bl) {
        return res.status(400).json({ error: 'B/L 번호를 입력해주세요.' });
    }

    const API_KEY = 'j290w206j092b052c060x050a0';
    const blNo = bl.trim();

    try {
        const url = `https://unipass.customs.go.kr/csp/handler/RetrieveCargoClearanceProgress?crkyCn=${API_KEY}&blNo=${blNo}&blYy=2026`;
        
        const response = await fetch(url);
        const xmlText = await response.text();

        const getValue = (tag) => {
            const match = xmlText.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
            return match ? match[1] : '';
        };

        const status = getValue('prgsStts');
        const location = getValue('shcoNm') || getValue('shedNm') || '-';
        const product = getValue('prnm') || '-';
        const time = getValue('prcsDttm') || '-';

        if (!status) {
            return res.status(200).json({
                success: false,
                message: '조회 결과가 없습니다.',
                raw: xmlText.substring(0, 500)
            });
        }

        let step = 1;
        if (status.includes('하선') || status.includes('반입')) step = 2;
        if (status.includes('수리')) step = 3;
        if (status.includes('반출')) step = 4;

        return res.status(200).json({
            success: true,
            data: { status, location, product, time, step }
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
