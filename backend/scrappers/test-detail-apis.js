import fetch from 'node-fetch';

async function testDetailAPIs() {
  console.log('🧪 서버 Detail API 테스트 시작...\n');
  
  // 한국 테스트 - aladin.json에서 실제 URL 사용
  console.log('='.repeat(60));
  console.log('📘 한국 API 테스트');
  console.log('='.repeat(60));
  const krUrl = 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=377892566';
  try {
    const krRes = await fetch(`http://localhost:4000/kr-book-detail?url=${encodeURIComponent(krUrl)}`);
    if (!krRes.ok) {
      console.log(`❌ HTTP ${krRes.status}: ${krRes.statusText}`);
    } else {
      const krData = await krRes.json();
      console.log('✅ 응답 받음');
      console.log('  - description:', krData.description ? `✅ (${krData.description.length}자)` : '❌ 없음');
      if (krData.description) console.log(`    "${krData.description.substring(0, 100)}..."`);
      console.log('  - plot:', krData.plot ? `✅ (${krData.plot.length}자)` : '❌ 없음');
      console.log('  - authorInfo:', krData.authorInfo ? `✅ (${krData.authorInfo.length}자)` : '❌ 없음');
      if (krData.authorInfo) console.log(`    "${krData.authorInfo.substring(0, 100)}..."`);
      console.log('  - publisherReview:', krData.publisherReview ? `✅ (${krData.publisherReview.length}자)` : '❌ 없음');
      if (krData.publisherReview) console.log(`    "${krData.publisherReview.substring(0, 100)}..."`);
      console.log('  - tableOfContents:', krData.tableOfContents ? `✅ (${krData.tableOfContents.length}자)` : '❌ 없음');
    }
  } catch (err) {
    console.log('❌ 오류:', err.message);
  }
  
  console.log('\n');
  
  // 대만 테스트 - taiwan.json에서 실제 URL 사용
  console.log('='.repeat(60));
  console.log('📘 대만 API 테스트');
  console.log('='.repeat(60));
  const twUrl = 'https://www.books.com.tw/products/0010868562';
  try {
    const twRes = await fetch(`http://localhost:4000/tw-book-detail?url=${encodeURIComponent(twUrl)}`);
    if (!twRes.ok) {
      console.log(`❌ HTTP ${twRes.status}: ${twRes.statusText}`);
    } else {
      const twData = await twRes.json();
      console.log('✅ 응답 받음');
      console.log('  - description:', twData.description ? `✅ (${twData.description.length}자)` : '❌ 없음');
      if (twData.description) console.log(`    "${twData.description.substring(0, 100)}..."`);
      console.log('  - plot:', twData.plot ? `✅ (${twData.plot.length}자)` : '❌ 없음');
      if (twData.plot) console.log(`    "${twData.plot.substring(0, 100)}..."`);
      console.log('  - authorInfo:', twData.authorInfo ? `✅ (${twData.authorInfo.length}자)` : '❌ 없음');
      if (twData.authorInfo) console.log(`    "${twData.authorInfo.substring(0, 100)}..."`);
      console.log('  - tableOfContents:', twData.tableOfContents ? `✅ (${twData.tableOfContents.length}자)` : '❌ 없음');
    }
  } catch (err) {
    console.log('❌ 오류:', err.message);
  }
  
  console.log('\n');
  
  // 프랑스 테스트 - amazon.json에서 실제 URL 사용
  console.log('='.repeat(60));
  console.log('📘 프랑스 API 테스트');
  console.log('='.repeat(60));
  const frUrl = 'https://www.amazon.fr/Ast%C3%A9rix-en-Lusitanie-n%C2%B041/dp/2017253707';
  try {
    const frRes = await fetch(`http://localhost:4000/fr-book-detail?url=${encodeURIComponent(frUrl)}`);
    if (!frRes.ok) {
      console.log(`❌ HTTP ${frRes.status}: ${frRes.statusText}`);
    } else {
      const frData = await frRes.json();
      console.log('✅ 응답 받음');
      console.log('  - description:', frData.description ? `✅ (${frData.description.length}자)` : '❌ 없음');
      if (frData.description) console.log(`    "${frData.description.substring(0, 100)}..."`);
      console.log('  - publisherReview:', frData.publisherReview ? `✅ (${frData.publisherReview.length}자)` : '❌ 없음');
      if (frData.publisherReview) console.log(`    "${frData.publisherReview.substring(0, 100)}..."`);
      console.log('  - authorInfo:', frData.authorInfo ? `✅ (${frData.authorInfo.length}자)` : '❌ 없음');
      if (frData.authorInfo) console.log(`    "${frData.authorInfo.substring(0, 100)}..."`);
    }
  } catch (err) {
    console.log('❌ 오류:', err.message);
  }
  
  console.log('\n');
  console.log('='.repeat(60));
  console.log('📊 테스트 완료');
  console.log('='.repeat(60));
}

testDetailAPIs().catch(console.error);







