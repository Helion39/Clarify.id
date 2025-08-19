// Quick test to check if our API keys work
import 'dotenv/config';

const newsApiKey = process.env.NEWSAPI_KEY;
const gnewsApiKey = process.env.GNEWS_API_KEY;
const mediastackApiKey = process.env.MEDIASTACK_API_KEY;

console.log('Environment variables loaded:');
console.log('NewsAPI Key:', newsApiKey ? `${newsApiKey.substring(0, 8)}...` : 'MISSING');
console.log('GNews Key:', gnewsApiKey ? `${gnewsApiKey.substring(0, 8)}...` : 'MISSING');
console.log('Mediastack Key:', mediastackApiKey ? `${mediastackApiKey.substring(0, 8)}...` : 'MISSING');

// Test a simple API call
async function testNewsAPI() {
  if (!newsApiKey) {
    console.log('❌ NewsAPI key missing');
    return;
  }
  
  try {
    const url = `https://newsapi.org/v2/everything?q=technology&pageSize=5&apiKey=${newsApiKey}`;
    console.log('\n🔍 Testing NewsAPI...');
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'ok' && data.articles) {
      console.log('✅ NewsAPI working! Found', data.articles.length, 'articles');
      console.log('Sample article:', data.articles[0]?.title);
    } else {
      console.log('❌ NewsAPI error:', data.message || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ NewsAPI failed:', error.message);
  }
}

testNewsAPI();