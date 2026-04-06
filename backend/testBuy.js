import axios from 'axios';

async function testBuy() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/signup', {
      name: 'Testy',
      email: `testy${Date.now()}@test.com`,
      password: 'Password123'
    });
    const token = loginRes.data.token;
    console.log('Logged in, token received');

    const buyRes = await axios.post('http://localhost:5000/api/portfolio/buy', {
      sym: 'HDFCBANK.NS',
      name: 'HDFC BANK LTD',
      quantity: 10
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Buy Success:', buyRes.data);
  } catch (error) {
    if (error.response) {
      console.error('Buy Failed:', error.response.data);
    } else {
      console.error('Request failed:', error.message);
    }
  }
}

testBuy();
