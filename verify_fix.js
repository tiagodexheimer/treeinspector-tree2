async function test() {
    const res = await fetch('http://localhost:3000/api/statistics/management-history?year=2026');
    const data = await res.json();

    // OS 3 is in February (month 2)
    const febData = data.data.find(d => d.month === 2);
    console.log('February Data:', JSON.stringify(febData, null, 2));
    console.log('Summary Total Cost:', data.summary.totalCost);
}

test().catch(console.error);
