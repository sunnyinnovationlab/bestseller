import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPageBooks(browser) {
  const page = await browser.newPage();
  const url =
    'https://www.kinokuniya.co.jp/disp/CKnRankingPageCList.jsp?dispNo=107002001001&vTp=w';
  await page.goto(url, { waitUntil: 'networkidle2' });
  await sleep(2000);

  const { books, links } = await page.evaluate(() => {
    const books = [];
    const links = [];

    const items = document.querySelectorAll(
      '#main_contents form div.list_area_wrap div',
    );
    for (let i = 0; i < items.length; i++) {
      if (books.length >= 30) break;

      const li = items[i];
      const detailHref =
        li.querySelector('div.listrightbloc div.details.mt00 h3 a')?.href || '';
      const title =
        li.querySelector('div.listrightbloc div.details.mt00 h3 a')
          ?.innerText || '';
      const imgEl = li.querySelector('div.listphoto.clearfix a img');
      const imageSrc = imgEl?.src || '';

      const image = imageSrc
        ? imageSrc.replace(/_w=\d+/g, '_w=600').replace(/_h=\d+/g, '_h=600')
        : '';

      const author =
        li.querySelector('div.listrightbloc div.details.mt00 p')?.innerText ||
        '';

      if (title && author && image && detailHref) {
        books.push({ title, author, image, detailHref });
        links.push(detailHref);
      }
    }

    return { books, links };
  });

  await page.close();
  return { books, links };
}

async function fetchBookDetail(browser, link) {
  const detailPage = await browser.newPage();
  try {
    await detailPage.goto(link, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    const data = await detailPage.evaluate(() => {
      const description =
        document
          .querySelector('#main_contents div.career_box p:nth-child(4)')
          ?.innerText.trim() || '';
      const other =
        document
          .querySelector('#main_contents div.career_box p:nth-child(2)')
          ?.innerText.trim() || '';
      const writerInfo =
        document
          .querySelector('#main_contents div.career_box p:nth-child(6)')
          ?.innerText.trim() || '';

      let highResImage = '';
      const mainImg = document.querySelector(
        '#main_contents div.career_box img, #main_contents .product_img img',
      );
      if (mainImg) {
        const src = mainImg.src || '';
        highResImage = src
          .replace(/_w=\d+/g, '_w=1000')
          .replace(/_h=\d+/g, '_h=1000');
      }

      return { description, other, writerInfo, highResImage };
    });

    await detailPage.close();
    return data;
  } catch (err) {
    await detailPage.close();
    console.error(`⚠️ 상세 정보 크롤링 실패 (${link}):`, err.message);
    return { description: '', other: '', writerInfo: '', highResImage: '' };
  }
}

export default async function japanScrapper() {
  const startTime = Date.now();
  const date = new Date();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  console.log('🚀 Fetching Japan (Kinokuniya) bestseller list...');
  const { books, links } = await fetchPageBooks(browser);
  const concurrency = 5;

  for (let i = 0; i < books.length; i += concurrency) {
    const batchBooks = books.slice(i, i + concurrency);
    const batchLinks = links.slice(i, i + concurrency);

    const results = await Promise.allSettled(
      batchLinks.map(link => fetchBookDetail(browser, link)),
    );

    results.forEach((res, idx) => {
      const data =
        res.status === 'fulfilled'
          ? res.value
          : { description: '', other: '', writerInfo: '', highResImage: '' };

      batchBooks[idx].description = data.description;
      batchBooks[idx].other = data.other;
      batchBooks[idx].writerInfo = data.writerInfo;

      if (data.highResImage) {
        batchBooks[idx].image = data.highResImage;
      }

      console.log(`${i + idx + 1}. ${batchBooks[idx].title} ✅`);
    });
  }

  const outputDir = path.join(process.cwd(), 'json_results');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const resultPath = path.join(outputDir, 'japan.json');
  const sanitized = books.map(toPublicBook);
  fs.writeFileSync(resultPath, JSON.stringify(sanitized, null, 2), 'utf-8');

  console.log(`✅ Crawled ${books.length} books and saved to japan.json`);
  console.log(`⏱ Done in ${(Date.now() - startTime) / 1000}s`);
  console.log(`📆 Date ${date.getDate()}`);
  await browser.close();
}

function toPublicBook(raw) {
  const fallback = value => (value || '').trim();
  return {
    image: fallback(raw.image),
    link: fallback(raw.detailHref),
    title: fallback(raw.title),
    author: fallback(raw.author),
    writerInfo: fallback(raw.writerInfo),
    description: fallback(raw.description),
    other: fallback(raw.other),
  };
}
japanScrapper();
