Ext.define('Calculator', {

    config: {
        bucketBy: ''
    },

    constructor: function (config) {
        this.initConfig(config);
    },

    prepareChartData: function (store) {
        var groupedData = this._groupData(store.getRange(), 'ActualEndDate'),
            categories = _.keys(groupedData),
            groupedCycleTimes = _.transform(groupedData, function (result, pis, group) {
                result[group] = this._computeCycleTimes(pis);
            }, {}, this),
            cycleTimeData = _.map(groupedCycleTimes, function (cycleTimes, key) {
                return [key, this._computePercentile(0.5, cycleTimes)];
            }, this),
            percentileData = _.map(groupedCycleTimes, function(cycleTimes) {
                return this._computePercentiles(cycleTimes);
            }, this);

        return {
            categories: categories,
            series: [
                {
                    name: 'Cycle Time',
                    type: 'column',
                    data: cycleTimeData
                },
                {
                    name: 'p25 - p75',
                    type: 'errorbar',
                    data: percentileData
                }
            ]
        };
    },

    _computeCycleTimes: function (pis) {
        return _.sortBy(_.map(pis, function (pi) {
            var startDate = pi.get('ActualStartDate'),
                endDate = pi.get('ActualEndDate');
            return moment(endDate).diff(moment(startDate), 'days');
        }));
    },

    _computePercentiles: function(cycleTimes) {
        var p25 = this._computePercentile(0.25, cycleTimes), 
            p75 = this._computePercentile(0.75, cycleTimes);

        if (p25 === p75) {
            return [];
        } else {
            return [p25, p75];
        }
    },

    _computePercentile: function (p, cycleTimes) {
        var index = p * cycleTimes.length,
            floorIndex = Math.floor(index);

        if (cycleTimes.length === 1) {
            return cycleTimes[0];
        } else if(floorIndex === index) {
            return (cycleTimes[floorIndex] + cycleTimes[floorIndex - 1]) / 2;
        } else {
            return cycleTimes[floorIndex];
        }
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
