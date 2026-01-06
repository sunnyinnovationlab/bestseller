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
      // 内容説明 (description) - <p itemprop="description">
      let description = '';
      const descEl = document.querySelector(
        '#main_contents div.career_box p[itemprop="description"]',
      );
      if (descEl) {
        description = descEl.innerText.trim();
      }

      // 出版社内容情報 (other) - <h3>出版社内容情報</h3> 다음의 <p>
      let other = '';
      const h3Elements = Array.from(
        document.querySelectorAll('#main_contents div.career_box h3'),
      );
      const publisherH3 = h3Elements.find(h3 =>
        h3.innerText.includes('出版社内容情報'),
      );
      if (publisherH3) {
        // h3 다음 형제 p 태그 찾기
        let nextEl = publisherH3.nextElementSibling;
        while (nextEl) {
          if (nextEl.tagName === 'P') {
            other = nextEl.innerText.trim();
            break;
          }
          nextEl = nextEl.nextElementSibling;
        }
      }

      // 著者等紹介 (writerInfo) - <h3>著者等紹介</h3> 다음의 <p>
      let writerInfo = '';
      const authorH3 = h3Elements.find(h3 =>
        h3.innerText.includes('著者等紹介'),
      );
      if (authorH3) {
        // h3 다음 형제 p 태그 찾기
        let nextEl = authorH3.nextElementSibling;
        while (nextEl) {
          if (nextEl.tagName === 'P') {
            writerInfo = nextEl.innerText.trim();
            break;
          }
          nextEl = nextEl.nextElementSibling;
        }
      }

      // 고화질 이미지 - 클릭 가능한 링크에서 가져오기
      let highResImage = '';
      const imgLink = document.querySelector(
        '#main_contents div.career_box a[href*="/images/goods/"]',
      );
      if (imgLink) {
        highResImage = imgLink.href;
      } else {
        // 대체: img src에서 크기 파라미터 변경
        const mainImg = document.querySelector(
          '#main_contents div.career_box img, #main_contents .product_img img',
        );
        if (mainImg) {
          const src = mainImg.src || '';
          highResImage = src
            .replace(/_w=\d+/g, '_w=1000')
            .replace(/_h=\d+/g, '_h=1000');
        }
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
