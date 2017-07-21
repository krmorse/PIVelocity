describe('Calculator', function () {

    var data, store;

    function expectChartDataToBe(chartData, categories, cycleTimeSeriesData, percentileSeriesData) {
        expect(chartData.categories).toEqual(categories); 
        expect(chartData.series.length).toBe(2);
        var cycleTimeSeries = chartData.series[0];
        expect(cycleTimeSeries.name).toBe('Cycle Time');
        expect(cycleTimeSeries.type).toBe('column');
        expect(cycleTimeSeries.data).toEqual(cycleTimeSeriesData);
        var percentileSeries = chartData.series[1];
        expect(percentileSeries.name).toBe('p25 - p75');
        expect(percentileSeries.type).toBe('errorbar');
        expect(percentileSeries.data).toEqual(percentileSeriesData);
    }

    beforeEach(function () {
        var model = Rally.test.Mock.dataFactory.getModel('portfolioitem/feature');
        data = Rally.test.Mock.dataFactory.getRecords('portfolioitem/feature', {
            count: 5,
            values: [
                { ActualStartDate: '2017-03-02T00:00:00.000Z', ActualEndDate: '2017-03-06T00:00:00.000Z', Release: { _refObjectName: 'Release 1' } },
                { ActualStartDate: '2017-03-02T00:00:00.000Z', ActualEndDate: '2017-03-03T00:00:00.000Z', Release: { _refObjectName: 'Release 1' } },
                { ActualStartDate: '2017-06-04T00:00:00.000Z', ActualEndDate: '2017-06-10T00:00:00.000Z', Release: { _refObjectName: 'Release 2' } },
                { ActualStartDate: '2017-06-05T00:00:00.000Z', ActualEndDate: '2017-06-08T00:00:00.000Z', Release: { _refObjectName: 'Release 2' } },
                { ActualStartDate: '2017-06-06T00:00:00.000Z', ActualEndDate: '2017-06-13T00:00:00.000Z', Release: { _refObjectName: 'Release 2' } }
            ]
        });
        store = Ext.create('Rally.data.wsapi.Store', {
            model: model,
            data: data
        });
    });

    it('should bucket by quarter', function () {
        var calculator = Ext.create('Calculator', {
            bucketBy: 'quarter'
        });
        var chartData = calculator.prepareChartData(store);
        expectChartDataToBe(chartData, ['2017 Q1', '2017 Q2'], [['2017 Q1', 2.5], ['2017 Q2', 6]], [[1, 4], [3, 7]]);
    });

    it('should bucket by month', function () {
        var calculator = Ext.create('Calculator', {
            bucketBy: 'month'
        });
        var chartData = calculator.prepareChartData(store);
        expectChartDataToBe(chartData, ['Mar \'17', 'Jun \'17'], [['Mar \'17', 2.5], ['Jun \'17', 6]], [[1, 4], [3, 7]]);
    });

    it('should bucket by release', function () {
        var calculator = Ext.create('Calculator', {
            bucketBy: 'release'
        });
        var chartData = calculator.prepareChartData(store);
        expectChartDataToBe(chartData, ['Release 1', 'Release 2'], [['Release 1', 2.5], ['Release 2', 6]], [[1, 4], [3, 7]]);
    });
});