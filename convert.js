const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const util = require('util');

// 비동기 fs 함수들을 Promise 기반으로 변환
const mkdir = util.promisify(fs.mkdir);
const rename = util.promisify(fs.rename);
const readdir = util.promisify(fs.readdir);
const exists = util.promisify(fs.exists);

// HTML 파일 경로 및 PDF 출력 경로 설정
const targetFolderPath = path.join(__dirname, 'target');
const outputFolderPath = path.join(__dirname, 'output');
const backupFolderPath = path.join(outputFolderPath, 'backup');

const convertHtmlToPdf = async (htmlPath, pdfPath) => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.pdf({
        path: pdfPath,
        format: 'A4',
    });
    await browser.close();
};

const backupExistingPdf = async (pdfPath) => {
    if (await exists(pdfPath)) {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const backupPdfPath = path.join(backupFolderPath, path.basename(pdfPath, '.pdf') + `_${timestamp}.pdf`);
        await rename(pdfPath, backupPdfPath);
    }
};

const main = async () => {
    try {
        // 백업 폴더 생성 (없을 경우에만)
        if (!(await exists(backupFolderPath))) {
            await mkdir(backupFolderPath, { recursive: true });
        }

        // HTML 파일 목록 읽기
        const files = await readdir(targetFolderPath);
        const htmlFiles = files.filter(file => path.extname(file) === '.html');

        // 모든 HTML 파일을 병렬로 PDF로 변환
        await Promise.all(htmlFiles.map(async (file) => {
            const htmlPath = path.join(targetFolderPath, file);
            const pdfPath = path.join(outputFolderPath, path.basename(file, '.html') + '.pdf');

            try {
                await backupExistingPdf(pdfPath);
                await convertHtmlToPdf(htmlPath, pdfPath);
                console.log(`${file} -> PDF 변환 완료`);
            } catch (err) {
                console.error(`${file} 변환 중 에러 발생:`, err);
            }
        }));

        console.log('모든 PDF 변환 작업이 완료되었습니다.');
    } catch (err) {
        console.error('프로그램 실행 중 에러 발생:', err);
    }
};

main();