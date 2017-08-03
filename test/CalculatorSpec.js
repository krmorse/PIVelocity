describe('Calculator', function () {

    describe('bucketing by actual end date', function () {

        var data, store;

        function expectChartDataToBe(chartData, categories, velocitySeriesData) {
            expect(chartData.categories).toEqual(categories);
            expect(chartData.series.length).toBe(1);
            var velocitySeries = chartData.series[0];
            expect(velocitySeries.name).toBe('Velocity');
            expect(velocitySeries.type).toBe('column');
            expect(velocitySeries.data).toEqual(velocitySeriesData);
        }

        beforeEach(function () {
            var model = Rally.test.Mock.dataFactory.getModel('portfolioitem/feature');
            data = Rally.test.Mock.dataFactory.getRecords('portfolioitem/feature', {
                count: 5,
                values: [
                    { ActualStartDate: '2017-03-02T00:00:00.000Z', ActualEndDate: '2017-03-06T00:00:00.000Z', Release: { _refObjectName: 'Release 1' }, RefinedEstimate: 20 },
                    { ActualStartDate: '2017-03-02T00:00:00.000Z', ActualEndDate: '2017-03-03T00:00:00.000Z', Release: { _refObjectName: 'Release 1' }, RefinedEstimate: 30 },
                    { ActualStartDate: '2017-06-04T00:00:00.000Z', ActualEndDate: '2017-06-10T00:00:00.000Z', Release: { _refObjectName: 'Release 2' }, RefinedEstimate: 10 },
                    { ActualStartDate: '2017-06-05T00:00:00.000Z', ActualEndDate: '2017-06-08T00:00:00.000Z', Release: { _refObjectName: 'Release 2' }, RefinedEstimate: 100 },
                    { ActualStartDate: '2017-06-06T00:00:00.000Z', ActualEndDate: '2017-06-13T00:00:00.000Z', Release: { _refObjectName: 'Release 2' }, RefinedEstimate: 50 }
                ]
            });
            store = Ext.create('Rally.data.wsapi.Store', {
                model: model,
                data: data
            });
        });

        it('should bucket by quarter', function () {
            var calculator = Ext.create('Calculator', {
                bucketBy: 'quarter',
                aggregateBy: 'refinedest'
            });
            var chartData = calculator.prepareChartData(store);
            expectChartDataToBe(chartData, ['2017 Q1', '2017 Q2'], [['2017 Q1', 50], ['2017 Q2', 160]]);
        });

        it('should bucket by month', function () {
            var calculator = Ext.create('Calculator', {
                bucketBy: 'month',
                aggregateBy: 'refinedest'
            });
            var chartData = calculator.prepareChartData(store);
            expectChartDataToBe(chartData, ['Mar \'17', 'Jun \'17'], [['Mar \'17', 50], ['Jun \'17', 160]]);
        });

        it('should bucket by year', function () {
            var calculator = Ext.create('Calculator', {
                bucketBy: 'year',
                aggregateBy: 'refinedest'
            });
            var chartData = calculator.prepareChartData(store);
            expectChartDataToBe(chartData, ['2017'], [['2017', 210]]);
        });
    });

    describe('bucketing by release', function () {

        var data, store;

        function expectChartDataToBe(chartData, categories, velocitySeriesData) {
            expect(chartData.categories).toEqual(categories);
            expect(chartData.series.length).toBe(1);
            var velocitySeries = chartData.series[0];
            expect(velocitySeries.name).toBe('Velocity');
            expect(velocitySeries.type).toBe('column');
            expect(velocitySeries.data).toEqual(velocitySeriesData);
        }

        beforeEach(function () {
            var model = Rally.test.Mock.dataFactory.getModel('portfolioitem/feature');
            data = Rally.test.Mock.dataFactory.getRecords('portfolioitem/feature', {
                count: 5,
                values: [
                    { ActualStartDate: '2017-03-02T00:00:00.000Z', ActualEndDate: null, Release: { _refObjectName: 'Release 1' }, RefinedEstimate: 20 },
                    { ActualStartDate: '2017-03-02T00:00:00.000Z', ActualEndDate: '2017-03-03T00:00:00.000Z', Release: { _refObjectName: 'Release 1' }, RefinedEstimate: 30 },
                    { ActualStartDate: null, ActualEndDate: null, Release: { _refObjectName: 'Release 2' }, RefinedEstimate: 10 },
                    { ActualStartDate: '2017-06-05T00:00:00.000Z', ActualEndDate: null, Release: { _refObjectName: 'Release 2' }, RefinedEstimate: 100 },
                    { ActualStartDate: '2017-06-06T00:00:00.000Z', ActualEndDate: '2017-06-13T00:00:00.000Z', Release: { _refObjectName: 'Release 2' }, RefinedEstimate: 50 }
                ]
            });
            store = Ext.create('Rally.data.wsapi.Store', {
                model: model,
                data: data
            });
        });

        it('should bucket by release', function () {
            var calculator = Ext.create('Calculator', {
                bucketBy: 'release',
                aggregateBy: 'refinedest'
            });
            var chartData = calculator.prepareChartData(store);
            expect(chartData.categories).toEqual(['Release 1', 'Release 2']);
            expect(chartData.series.length).toBe(3);
            var notStartedSeries = chartData.series[0];
            expect(notStartedSeries.name).toBe('Not Started');
            expect(notStartedSeries.type).toBe('column');
            expect(notStartedSeries.data).toEqual([0, 10]);
            var inProgressSeries = chartData.series[1];
            expect(inProgressSeries.name).toBe('In Progress');
            expect(inProgressSeries.type).toBe('column');
            expect(inProgressSeries.data).toEqual([20, 100]);
            var completedSeries = chartData.series[2];
            expect(completedSeries.name).toBe('Completed');
            expect(completedSeries.type).toBe('column');
            expect(completedSeries.data).toEqual([30, 50]);
        });
    });
});