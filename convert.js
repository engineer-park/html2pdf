const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// HTMLファイル格納先パス
const targetFolderPath = path.join(__dirname, 'target');
// PDFファイル出力先パス
const outputFolderPath = path.join(__dirname, 'output');
// PDFファイルバックアップ先パス
const backupFolderPath = path.join(outputFolderPath, 'backup');

const convertHtmlToPdf = async(htmlPath, pdfPath) => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.pdf({ 
        path: pdfPath,
        format: 'A4',
        // margin: {
        //     top: '1cm',
        //     right: '1cm',
        //     bottom: '1cm',
        //     left: '1cm'
        // }
    });
    await browser.close();
}

const main = async() => {
    if (!fs.existsSync(backupFolderPath)) {
        fs.mkdirSync(backupFolderPath);
    }

    const files = fs.readdirSync(targetFolderPath);

    for (const file of files) {
        const ext = path.extname(file);
        if (ext === '.html') {
            const htmlPath = path.join(targetFolderPath, file);
            const pdfPath = path.join(outputFolderPath, path.basename(file, ext) + '.pdf');

            if (fs.existsSync(pdfPath)) {
                const timestamp = new Date().toISOString().replace(/:/g, '-');
                const backupPdfPath = path.join(backupFolderPath, path.basename(file, ext) + `_${timestamp}.pdf`);
                fs.renameSync(pdfPath, backupPdfPath);
            }

            await convertHtmlToPdf(htmlPath, pdfPath);
        }
    }
}

main().then(() => console.log('PDF変換完了')).catch(err => console.error('変換中エラー発生:', err));
