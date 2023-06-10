export const fetchStockDataLimited = async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const maxRequestsPerMinute = 5;
  const delayDuration = 60000 / maxRequestsPerMinute;

  let response;
  let result;

  try {
    response = await fetch(
      'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&apikey=RIBXT3XYLI69PC0Q'
    );
    result = await response.json();
  } catch (error) {
    throw new Error('Error fetching data from API: ', error);
  }

  await delay(delayDuration); // Delay before making the next API call

  return {
    metaData: result['Meta Data'],
    timeSeriesData: result['Time Series (5min)'],
  };
};
