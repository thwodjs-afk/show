export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const { bl } = req.query;

    if (!bl) {
        return res.status(400).json({ error: 'B/L 번호를 입력해주세요.' });
    }

    const blNo = bl.trim();
    const year = new Date().getFullYear();

    try {
        const url = 'https://unipass.customs.go.kr/csp/myc/bsopspptinfo/cscllgstinfo/ImpCargPrgsInfoMtCtr/retrieveImpCargPrgsInfoLst.do';
        
        const formData = new URLSearchParams({
            firstIndex: '0',
            page: '1',
            pageIndex: '1',
            pageSize: '10',
            pageUnit: '10',
            recordCountPerPage: '10',
            qryTp: '2',
            cargMtNo: '',
            mblNo: '',
            hblNo: blNo,
            blYy: year.toString(),
            cntrNo: '',
            mrn: ''
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: formData.toString()
        });

        const text = await response.text();

        return res.status(200).json({
            raw: text.substring(0, 3000)
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
