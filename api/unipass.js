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

    // API 키들
    const API_KEYS = {
        cargo: 'j290w206j092b052c060x050a0',      // API001 화물통관진행정보
        entry: 'b280h246y032i092d030b050b0',      // API021 입항보고내역(해상)
        unload: 'h270i206z032q052l050s070g0',     // API038 하선신고목록
        release: 'b240f256d002a002h010e030i0',    // API048 반출신고정보
    };

    const blNo = bl.trim();

    try {
        // 1차: 화물통관진행정보 조회 (House B/L)
        let result = await fetchCargoProgress(API_KEYS.cargo, blNo);
        
        if (result.success) {
            return res.status(200).json(result);
        }

        // 2차: Master B/L로 재시도
        result = await fetchCargoProgressByMbl(API_KEYS.cargo, blNo);
        
        if (result.success) {
            return res.status(200).json(result);
        }

        // 3차: 입항보고내역 조회
        result = await fetchEntryReport(API_KEYS.entry, blNo);
        
        if (result.success) {
            return res.status(200).json(result);
        }

        return res.status(200).json({
            success: false,
            message: '조회 결과가 없습니다. B/L 번호를 확인해주세요.',
            data: null,
            searchedBl: blNo
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: '오류 발생: ' + error.message,
            error: error.message
        });
    }
}

// 화물통관진행정보 조회 (House B/L)
async function fetchCargoProgress(apiKey, hblNo) {
    const url = `https://unipass.customs.go.kr/csp/handler/RetrieveCargoClearanceProgress?crkyCn=${apiKey}&hblNo=${hblNo}`;
    
    const response = await fetch(url);
    const xmlText = await response.text();
    
    return parseCargoXml(xmlText);
}

// 화물통관진행정보 조회 (Master B/L)
async function fetchCargoProgressByMbl(apiKey, mblNo) {
    const url = `https://unipass.customs.go.kr/csp/handler/RetrieveCargoClearanceProgress?crkyCn=${apiKey}&mblNo=${mblNo}`;
    
    const response = await fetch(url);
    const xmlText = await response.text();
    
    return parseCargoXml(xmlText);
}

// 입항보고내역 조회
async function fetchEntryReport(apiKey, blNo) {
    const url = `https://unipass.customs.go.kr/csp/handler/RetrieveVesselEntryInfo?crkyCn=${apiKey}&blNo=${blNo}`;
    
    const response = await fetch(url);
    const xmlText = await response.text();
    
    const getValue = (xml, tag) => {
        const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
        return match ? match[1] : '';
    };

    // 데이터 존재 확인
    if (xmlText.includes('<tCntsCargClrcPrgsInfoQryRtnVo>') || xmlText.includes('<vesselEntryInfo>')) {
        const status = getValue(xmlText, 'prgsStts') || getValue(xmlText, 'etprCstm') || '입항';
        const location = getValue(xmlText, 'shcoNm') || getValue(xmlText, 'etprPrtCd') || '';
        const product = getValue(xmlText, 'prnm') || '';
        const time = getValue(xmlText, 'prcsDttm') || getValue(xmlText, 'etprDt') || '';
        
        if (status || location || time) {
            let step = 1;
            if (status.includes('하선') || status.includes('반입')) step = 2;
            if (status.includes('수리') || status.includes('결재')) step = 3;
            if (status.includes('반출')) step = 4;

            return {
                success: true,
                data: { status, location, product, time, step, blNo }
            };
        }
    }

    return { success: false };
}

// XML 파싱 함수
function parseCargoXml(xmlText) {
    const getValue = (xml, tag) => {
        const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
        return match ? match[1] : '';
    };

    const infoMatch = xmlText.match(/<cargClrcPrgsInfoQryVo>([\s\S]*?)<\/cargClrcPrgsInfoQryVo>/);
    
    if (!infoMatch) {
        return { success: false };
    }

    const infoXml = infoMatch[1];
    const status = getValue(infoXml, 'prgsStts') || getValue(infoXml, 'cargTrcnRelaBsopTpcd') || '';
    const location = getValue(infoXml, 'shcoNm') || getValue(infoXml, 'shedNm') || '인천항';
    const product = getValue(infoXml, 'prnm') || '-';
    const time = getValue(infoXml, 'prcsDttm') || '-';
    const hblNo = getValue(infoXml, 'hblNo') || '';
    const mblNo = getValue(infoXml, 'mblNo') || '';

    if (!status && !location && !product) {
        return { success: false };
    }

    let step = 1;
    if (status.includes('하선') || status.includes('반입')) step = 2;
    if (status.includes('수리') || status.includes('결재') || status.includes('신고수리')) step = 3;
    if (status.includes('반출')) step = 4;

    return {
        success: true,
        data: { status, location, product, time, step, hblNo, mblNo }
    };
}
