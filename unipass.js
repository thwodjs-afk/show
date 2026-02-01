// Vercel Serverless Function - 유니패스 통관 조회 API
// 파일 위치: /api/unipass.js

export default async function handler(req, res) {
    // CORS 설정 (아임웹에서 호출 가능하도록)
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

    // 유니패스 API 키 (본인 키로 교체하세요)
    const UNIPASS_KEY = 'j290w206j092b052c060x050a0';

    try {
        const uniUrl = `https://unipass.customs.go.kr/csp/handler/RetrieveCargoClearanceProgress?crkyCn=${UNIPASS_KEY}&hblNo=${bl.trim()}`;
        
        const response = await fetch(uniUrl);
        const xmlText = await response.text();

        // 간단한 XML 파싱 (정규식 사용)
        const getValue = (xml, tag) => {
            const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
            return match ? match[1] : '';
        };

        // 여러 개의 cargClrcPrgsInfoQryVo 중 첫 번째 항목 찾기
        const infoMatch = xmlText.match(/<cargClrcPrgsInfoQryVo>([\s\S]*?)<\/cargClrcPrgsInfoQryVo>/);
        
        if (!infoMatch) {
            return res.status(200).json({
                success: false,
                message: '조회 결과가 없습니다. B/L 번호를 확인해주세요.',
                data: null
            });
        }

        const infoXml = infoMatch[1];
        const status = getValue(infoXml, 'prgsStts') || getValue(infoXml, 'cargTrcnRelaBsopTpcd');
        const location = getValue(infoXml, 'shcoNm') || getValue(infoXml, 'shedNm') || '인천항';
        const product = getValue(infoXml, 'prnm') || '-';
        const time = getValue(infoXml, 'prcsDttm') || '-';
        const blNo = getValue(infoXml, 'hblNo') || bl;
        const mblNo = getValue(infoXml, 'mblNo') || '-';

        // 진행 단계 계산
        let step = 1;
        const statusLower = status.toLowerCase();
        if (status.includes('하선') || status.includes('반입') || statusLower.includes('carry')) step = 2;
        if (status.includes('수리') || status.includes('결재') || status.includes('신고수리')) step = 3;
        if (status.includes('반출') || statusLower.includes('release') || statusLower.includes('delivery')) step = 4;

        return res.status(200).json({
            success: true,
            data: {
                blNo,
                mblNo,
                status,
                location,
                product,
                time,
                step
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: '유니패스 API 호출 중 오류가 발생했습니다.',
            error: error.message
        });
    }
}
