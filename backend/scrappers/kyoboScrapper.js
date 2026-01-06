import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPageBooks(browser) {
  const page = await browser.newPage();
  const url = 'https://store.kyobobook.co.kr/bestseller/total/weekly?page=1';
  await page.goto(url, { waitUntil: 'networkidle2' });
  await sleep(2000);

  const { books, links } = await page.evaluate(() => {
    const books = [];
    const links = [];

    document.querySelectorAll('ol li').forEach(li => {
      const titleEl = li.querySelector(
        'a.prod_link.line-clamp-2.font-medium.text-black',
      );
      const title = titleEl?.innerText.trim() || '';
      const detailHref = titleEl?.href || '';
      const image = li.querySelector('a.prod_link.relative img')?.src || '';
      const authorText =
        li.querySelector('div.line-clamp-2.flex')?.innerText || '';
      const author = authorText.split('·')[0]?.trim() || '';
      const publisher = authorText.split('·')[1]?.trim() || '';

      if (title && author && publisher && image && detailHref) {
        books.push({ title, author, publisher, image, detailHref });
        links.push(detailHref);
      }
    });

    return { books, links };
  });

  await page.close();
  return { books, links };
}

async function fetchBookDetail(browser, link) {
  const detailPage = await browser.newPage();
  await detailPage.goto(link, { waitUntil: 'networkidle2' });

  const data = await detailPage.evaluate(() => {
    function getTextWithSpacing(element) {
      if (!element) return '';

      let text = element.innerHTML
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<div[^>]*>/gi, '')
        .replace(/<\/li>/gi, '\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/ +/g, ' ')
        .replace(/\n +/g, '\n')
        .replace(/ +\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      return text;
    }

    // 책 소개 (description)
    const descriptionEl = document.querySelector(
      '#scrollSpyProdInfo div.product_detail_area.book_intro div.intro_bottom > div:last-child',
    );
    const description = getTextWithSpacing(descriptionEl);

    // 저자 소개 (writerInfo)
    const writerInfoEl = document.querySelector(
      '#scrollSpyProdInfo div.product_detail_area.product_person div.writer_info_box p',
    );
    const writerInfo = getTextWithSpacing(writerInfoEl);

    // other: 작가의 말, 추천사, 책 속으로, 출판사서평
    const otherSections = [];

    // 작가의 말
    const authorWordEl = document.querySelector(
      '#scrollSpyProdInfo div.product_detail_area.book_author_word',
    );
    if (authorWordEl) {
      const titleEl = authorWordEl.querySelector('.prod_title, h2');
      const title = titleEl ? titleEl.innerText.trim() : '작가의 말';

      const contentEl = authorWordEl.querySelector(
        '.intro_bottom > div:last-child, .auto_overflow_contents',
      );
      const content = getTextWithSpacing(contentEl);

      if (content) {
        otherSections.push(`[${title}]\n${content}`);
      }
    }

    // 추천사
    const recommendEl = document.querySelector(
      '#scrollSpyProdInfo div.product_detail_area.book_recommend',
    );
    if (recommendEl) {
      const titleEl = recommendEl.querySelector('.prod_title, h2');
      const title = titleEl ? titleEl.innerText.trim() : '추천사';

      const contentEl = recommendEl.querySelector(
        '.intro_bottom > div:last-child, .auto_overflow_contents',
      );
      const content = getTextWithSpacing(contentEl);

      if (content) {
        otherSections.push(`[${title}]\n${content}`);
      }
    }

    // 책 속으로
    const insideEl = document.querySelector(
      '#scrollSpyProdInfo div.product_detail_area.book_inside',
    );
    if (insideEl) {
      const titleEl = insideEl.querySelector('.prod_title, h2');
      const title = titleEl ? titleEl.innerText.trim() : '책 속으로';

      const contentEl = insideEl.querySelector(
        '.intro_bottom > div:last-child, .auto_overflow_contents',
      );
      const content = getTextWithSpacing(contentEl);

      if (content) {
        otherSections.push(`[${title}]\n${content}`);
      }
    }

    // 출판사 서평
    const publishReviewEl = document.querySelector(
      '#scrollSpyProdInfo div.product_detail_area.book_publish_review',
    );
    if (publishReviewEl) {
      const titleEl = publishReviewEl.querySelector('.prod_title, h2');
      const title = titleEl ? titleEl.innerText.trim() : '출판사 서평';

      const contentEl = publishReviewEl.querySelector(
        '.intro_bottom > div:last-child, .auto_overflow_contents',
      );
      const content = getTextWithSpacing(contentEl);

      if (content) {
        otherSections.push(`[${title}]\n${content}`);
      }
    }

    const other = otherSections.join('\n\n---\n\n');

    return { description, other, writerInfo };
  });

  await detailPage.close();
  return data;
}

export default async function kyoboScrapper() {
  const startTime = Date.now();
  const date = new Date();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  console.log('🚀 Fetching Korea (Kyobo) bestseller list...');
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
          : { description: '', other: '', writerInfo: '' };
      batchBooks[idx].description = data.description;
      batchBooks[idx].other = data.other;
      batchBooks[idx].writerInfo = data.writerInfo;
      console.log(`${i + idx + 1}. ${batchBooks[idx].title} ✅`);
    });
  }

  const toPublicBook = book => ({
    image: book.image || '',
    link: book.detailHref || '',
    title: book.title || '',
    author: book.author || '',
    publisher: book.publisher || '',
    writerInfo: book.writerInfo || '',
    description: book.description || '',
    other: book.other || '',
  });

  const outputDir = path.join(process.cwd(), 'json_results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const resultPath = path.join(outputDir, 'korea.json');
  fs.writeFileSync(
    resultPath,
    JSON.stringify(books.map(toPublicBook), null, 2),
    'utf-8',
  );

  console.log(`✅ Crawled ${books.length} books and saved to korea.json`);
  console.log(`⏱ Done in ${(Date.now() - startTime) / 1000}s`);
  console.log(`📆 Date ${date.getDate()}`);

  await browser.close();
}

// Run directly
kyoboScrapper();
