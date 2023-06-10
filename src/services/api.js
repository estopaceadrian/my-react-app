export const fetchStockData = async () => {
  try {
    const response = await fetch(
      'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&apikey=demo'
    );
    const result = await response.json();
    const metaData = result['Meta Data'];
    const timeSeriesData = result['Time Series (5min)'];
    return { metaData, timeSeriesData }; // Return an object containing both metadata and time series data
  } catch (error) {
    throw new Error('Error fetching data from API: ', error);
  }
};
