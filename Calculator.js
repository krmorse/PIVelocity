Ext.define('Calculator', {

    config: {
        bucketBy: '',
        aggregateBy: ''
    },

    constructor: function (config) {
        this.initConfig(config);
    },

    prepareChartData: function (store) {
        var groupedData = this._groupData(store.getRange(), 'ActualEndDate'),
            categories = _.keys(groupedData),
            seriesData;

             if(this.aggregateBy === 'count') {
                seriesData = _.map(groupedData, function(value, key) {
                    return [key, value.length];
                });
            } else {
                seriesData = _.map(groupedData, function(value, key) {
                    var valueTotal = _.reduce(value, function(total, r) {
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
    },

    _groupData: function (records, field) {
        return _.groupBy(records, function (record) {
            if (this.bucketBy === 'month') {
                return moment(record.get(field)).startOf('month').format('MMM \'YY');
            } else if (this.bucketBy === 'quarter') {
                return moment(record.get(field)).startOf('quarter').format('YYYY [Q]Q');
            } else if (this.bucketBy === 'release') {
                return record.get('Release')._refObjectName;
            }
        }, this);
    }
});
