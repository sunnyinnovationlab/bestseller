import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPageBooks(browser) {
  const page = await browser.newPage();
  const url =
    'https://www.amazon.fr/gp/bestsellers/books?utm_source=chatgpt.com';
  await page.goto(url, { waitUntil: 'networkidle2' });
  await sleep(2000);

  const { books, links } = await page.evaluate(() => {
    const books = [];
    const links = [];

    const items = document.querySelectorAll('ol li.zg-no-numbers');
    for (let i = 0; i < items.length; i++) {
      if (books.length >= 30) break;

      const li = items[i];
      const detailHref = li.querySelector('div a.a-link-normal')?.href || '';
      const title =
        li.querySelector('div a.a-link-normal span div')?.innerText || '';

      const imgEl = li.querySelector('img');
      const imageSrc = imgEl ? imgEl.src : '';

      const image = imageSrc
        ? imageSrc
            .replace(/\._AC_UL\d+_/g, '._AC_UL1500_')
            .replace(/\._SX\d+_/g, '._SX1500_')
            .replace(/\._SY\d+_/g, '._SY1500_')
        : '';

      const author =
        li.querySelector('div a.a-size-small div')?.innerText || '';

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
    await detailPage.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    );

    await detailPage.goto(link, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    await detailPage.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await sleep(1000);

    try {
      const expanderButtons = await detailPage.$$(
        '[data-a-expander-name="book_description_expander"]',
      );
      for (const btn of expanderButtons) {
        await btn.click();
        await sleep(500);
      }
    } catch (err) {}

    const data = await detailPage.evaluate(() => {
      const description =
        document
          .querySelector(
            '#bookDescription_feature_div div.a-expander-content.a-expander-partial-collapse-content',
          )
          ?.innerText.trim() || '';
      const reviewSection =
        document
          .querySelector(
            '#editorialReviews_feature_div div.a-section.a-spacing-small.a-padding-base',
          )
          ?.innerText.trim() || '';
      const writerInfo =
        document
          .querySelector(
            'div._about-the-author-card_style_cardContentDiv__FXLPd div.a-fixed-left-grid-col.a-col-right div.a-cardui-body',
          )
          ?.innerText.trim() || '';

      let highResImage = '';
      const mainImageEl = document.querySelector(
        '#landingImage, #imgBlkFront, #ebooksImgBlkFront',
      );
      if (mainImageEl) {
        const dataSrc = mainImageEl.getAttribute('data-a-dynamic-image');
        if (dataSrc) {
          try {
            const imageUrls = JSON.parse(dataSrc);
            let maxResolution = 0;
            let bestImageUrl = '';

            for (const [url, dimensions] of Object.entries(imageUrls)) {
              const resolution = dimensions[0] * dimensions[1];
              if (resolution > maxResolution) {
                maxResolution = resolution;
                bestImageUrl = url;
              }
            }

            if (bestImageUrl) {
              highResImage = bestImageUrl;
            }
          } catch (e) {}
        }
        if (!highResImage) {
          highResImage = mainImageEl.src || '';
        }
      }

      return { description, other: reviewSection, writerInfo, highResImage };
    });

    await detailPage.close();
    return data;
  } catch (err) {
    await detailPage.close();
    console.error(`⚠️ 상세 정보 크롤링 실패 (${link}):`, err.message);
    return {
      description: '',
      other: '',
      writerInfo: '',
      highResImage: '',
    };
  }
}

export default async function amazonScrapper() {
  const startTime = Date.now();
  const date = new Date();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  console.log('🚀 Fetching France (Amazon) bestseller list...');
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
  const resultPath = path.join(outputDir, 'france.json');
  const sanitized = books.map(toPublicBook);
  fs.writeFileSync(resultPath, JSON.stringify(sanitized, null, 2), 'utf-8');

  console.log(`✅ Crawled ${books.length} books`);
  console.log(`💾 Saved to ${resultPath}`);
  console.log(`📆 Date ${date.getDate()}`);
  console.log(`⏱ Done in ${(Date.now() - startTime) / 1000}s`);
  await browser.close();
}

function toPublicBook(raw) {
  const clean = value => (value || '').trim();
  return {
    image: clean(raw.image),
    link: clean(raw.detailHref),
    title: clean(raw.title),
    author: clean(raw.author),
    writerInfo: clean(raw.writerInfo),
    description: clean(raw.description),
    other: clean(raw.other),
  };
}

amazonScrapper();
