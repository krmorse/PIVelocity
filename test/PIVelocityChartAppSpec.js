describe('PIVelocityChartApp', function() {

    var app, gridboard, query;

    function renderChart(config) {
        app = Rally.test.Harness.launchApp('PIVelocityChartApp', config);
        return once(function() { return app.down('rallychart').componentReady; })
          .then(function() {
              gridboard = app.down('rallygridboard');
              chart = gridboard.down('rallychart');
              return chart;
          });
    }

    beforeEach(function() {
        var features = Rally.test.Mock.dataFactory.getData('portfolioitem/feature', { count: 10 });
        query = Rally.test.Mock.ajax.whenQuerying('portfolioitem/feature').respondWith(features);
        Rally.test.Mock.ajax.whenQuerying('portfolioitem/initiative').respondWith([]);
    });

    pit('should configure the calculator', function() {
        return renderChart({ settings: { bucketBy: 'quarter' }}).then(function() {
            expect(chart.calculator.bucketBy).toBe('quarter');
        });
    });

    pit('should query the right type', function() {
        return renderChart({ settings: { piType: 'portfolioitem/initiative' } }).then(function() {
            expect(gridboard.modelNames).toEqual(['portfolioitem/initiative']);
            expect(gridboard.chartConfig.storeConfig.model.typePath).toBe('portfolioitem/initiative');
            expect(gridboard.chartConfig.storeType).toEqual('Rally.data.wsapi.Store');
        });
    });

    pit('should only load finished pis', function() {
        return renderChart().then(function() {
            var filters = gridboard.storeConfig.filters;
            expect(filters.length).toBe(1);
            expect(filters[0]).toEqual({ property: 'ActualEndDate', operator: '!=', value: null });
        });
    });

    pit('should include a query if specified', function() {
        return renderChart({ settings: { query: '(Release.Name = "Release 1")' } }).then(function() {
            var filters = gridboard.storeConfig.filters;
            expect(filters.length).toBe(2);
            expect(filters[1].toString()).toBe('(Release.Name = "Release 1")');
        });
    });

    pit('should include a timeboxscope if available', function() {
        var release = Rally.test.Mock.dataFactory.getRecord('release');
        var timeboxScope = Ext.create('Rally.app.TimeboxScope', { record: release });
        var appContext = Rally.test.Harness.getAppContext({
            timebox: timeboxScope
        });
        return renderChart({ context: appContext, settings: { query: '(Name = "Foo")' } }).then(function(chart) {
            var filters = gridboard.storeConfig.filters;
            expect(filters.length).toBe(3);
            expect(filters[1].toString()).toBe(timeboxScope.getQueryFilter().toString());
            expect(filters[2].toString()).toBe('(Name = "Foo")');
        });
    });

    pit('should refresh when the timebox changes', function() {
        var release1 = Rally.test.Mock.dataFactory.getRecord('release'),
            release2 = Rally.test.Mock.dataFactory.getRecord('release'),
            timeboxScope1 = Ext.create('Rally.app.TimeboxScope', { record: release1 }),
            timeboxScope2 = Ext.create('Rally.app.TimeboxScope', { record: release2 }),
            appContext = Rally.test.Harness.getAppContext({
                timebox: timeboxScope1
            });

        return renderChart({ context: appContext}).then(function() {
            var destroySpy = Rally.test.Mock.spy(chart, 'destroy');
            app.onTimeboxScopeChange(timeboxScope2);
            expect(destroySpy).toHaveBeenCalled();
            return once(function() { return app.down('rallychart') && app.down('rallychart').componentReady; }).then(function() {
                var filters = app.down('rallygridboard').storeConfig.filters;
                expect(filters.length).toBe(2);
                expect(filters[1].toString()).toBe(timeboxScope2.getQueryFilter().toString());
            });
        });
    });

    pit('should fetch the right fields', function() {
        return renderChart().then(function() {
            expect(gridboard.chartConfig.storeConfig.fetch).toEqual(['ActualStartDate', 'ActualEndDate', 'Release']);
        });
    });

    pit('should order by actual end date', function() {
        return renderChart().then(function() {
            var sorters = gridboard.chartConfig.storeConfig.sorters;
            expect(sorters.length).toBe(1);
            expect(sorters[0]).toEqual({ property: 'ActualEndDate', direction: 'ASC' });
        });
    });

    pit('should order by release date when bucketing by release', function() {
        return renderChart({ settings: { bucketBy: 'release' }}).then(function() {
            var sorters = gridboard.chartConfig.storeConfig.sorters;
            expect(sorters.length).toBe(1);
            expect(sorters[0]).toEqual({ property: 'Release.ReleaseDate', direction: 'ASC' });
        });
    });

    pit('should pass the right context', function() {
        return renderChart().then(function() {
            expect(gridboard.context).toBe(app.getContext());
            expect(gridboard.chartConfig.storeConfig.context).toEqual(app.getContext().getDataContext());
        });
    });

    pit('should load all the data', function() {
        return renderChart().then(function() {
            expect(gridboard.chartConfig.storeConfig.limit).toBe(Infinity);
        });
    });

    pit('should generate the right y-axis label for throughput charts', function() {
        return renderChart({ settings: { aggregateBy: 'count' } }).then(function() {
            expect(gridboard.chartConfig.chartConfig.yAxis.title.text).toBe('Count');
        });
    });

    pit('should generate the right y-axis label for velocity charts', function() {
        return renderChart({ settings: { aggregateBy: 'refinedest' } }).then(function() {
            var estimateUnit = gridboard.getContext().getWorkspace().WorkspaceConfiguration.ReleaseEstimateUnitName;
            expect(gridboard.chartConfig.chartConfig.yAxis.title.text).toBe(estimateUnit);
        });
    });
});