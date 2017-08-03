Ext.define('Calculator', {

    config: {
        bucketBy: '',
        aggregateBy: ''
    },

    constructor: function (config) {
        this.initConfig(config);
    },

    prepareChartData: function (store) {
        var groupedData = this._groupData(store.getRange()),
            categories = _.keys(groupedData);

        if (this.bucketBy === 'release') {
            return this._generateStackedColumns(categories, groupedData);
        } else {
            return this._generateColumns(categories, groupedData);
        }
    },

    _groupData: function (records) {
        return _.groupBy(records, function (record) {
            var endDate = record.get('ActualEndDate');
            if (this.bucketBy === 'month') {
                return moment(endDate).startOf('month').format('MMM \'YY');
            } else if (this.bucketBy === 'quarter') {
                return moment(endDate).startOf('quarter').format('YYYY [Q]Q');
            } else if (this.bucketBy === 'release') {
                return record.get('Release')._refObjectName;
            } else if (this.bucketBy === 'year') {
                return moment(endDate).startOf('year').format('YYYY');
            }
        }, this);
    },

    _generateStackedColumns: function (categories, groupedData) {
        var stackValues = ['Not Started', 'In Progress', 'Completed'];
        var series = {};
        _.each(categories, function (category) {
            var group = groupedData[category];
            var recordsByStackValue = _.groupBy(group, function (record) {
                if (record.get('ActualEndDate')) {
                    return 'Completed';
                } else if (record.get('ActualStartDate')) {
                    return 'In Progress';
                } else {
                    return 'Not Started';
                }
            });
            _.each(stackValues, function (stackValue) {
                series[stackValue] = series[stackValue] || [];
                var records = recordsByStackValue[stackValue];
                if (this.aggregateBy === 'count') {
                    series[stackValue].push((records && records.length) || 0);
                } else {
                    var valueTotal = _.reduce(records, function (total, r) {
                        var valueField = Utils.getFieldForAggregationType(this.aggregateBy);
                        return total + r.get(valueField);
                    }, 0, this);
                    series[stackValue].push(valueTotal);
                }
            }, this);
        }, this);

        return {
            categories: categories,
            series: _.map(stackValues, function (value) {
                return {
                    name: value,
                    type: 'column',
                    data: series[value]
                };
            }, this)
        };
    },

    _generateColumns: function (categories, groupedData) {
        var seriesData;
        if (this.aggregateBy === 'count') {
            seriesData = _.map(groupedData, function (value, key) {
                return [key, value.length];
            });
        } else {
            seriesData = _.map(groupedData, function (value, key) {
                var valueTotal = _.reduce(value, function (total, r) {
                    var valueField = Utils.getFieldForAggregationType(this.aggregateBy);
                    return total + r.get(valueField);
                }, 0, this);
                return [key, valueTotal];
            }, this);
        }

        return {
            categories: categories,
            series: [
                {
                    name: this.aggregateBy.indexOf('count') >= 0 ? 'Throughput' : 'Velocity',
                    type: 'column',
                    data: seriesData
                }
            ]
        };
    }
});
