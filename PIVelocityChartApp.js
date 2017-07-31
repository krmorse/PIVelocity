Ext.define('PIVelocityChartApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    layout: 'fit',
    autoScroll: false,

    requires: [
        'Calculator'
    ],

    config: {
        defaultSettings: {
            bucketBy: 'quarter',
            piType: 'portfolioitem/feature',
            aggregateBy: 'count',
            query: ''
        }
    },

    launch: function() {
        Rally.data.wsapi.ModelFactory.getModel({
            type: this.getSetting('piType'),
        }).then({
            success: function(model) {
                this.model = model;
                this._addChart();
            },
            scope: this
        });
    },

    getSettingsFields: function() {
        return [
            {
                name: 'piType',
                xtype: 'rallycombobox',
                plugins: ['rallyfieldvalidationui'],
                allowBlank: false,
                editable: false,
                autoSelect: false,
                validateOnChange: false,
                validateOnBlur: false,
                fieldLabel: 'Type', 
                shouldRespondToScopeChange: true,
                storeConfig: {
                    model: 'TypeDefinition',
                    sorters: [{ property: 'Ordinal' }],
                    fetch: ['DisplayName', 'TypePath'],
                    filters: [
                        { property: 'Parent.Name', value: 'Portfolio Item' },
                        { property: 'Creatable', value: true }
                    ],
                    autoLoad: false,
                    remoteFilter: true,
                    remoteSort: true
                },
                displayField: 'DisplayName',
                valueField: 'TypePath',
                listeners: {
                    change: function (combo) {
                        combo.fireEvent('typeselected', combo.getValue(), combo.context);
                    },
                    ready: function (combo) {
                      combo.fireEvent('typeselected', combo.getValue(), combo.context);
                    }
                },
                bubbleEvents: ['typeselected'],
                readyEvent: 'ready',
                handlesEvents: {
                    projectscopechanged: function (context) {
                        this.refreshWithNewContext(context);
                    }
                }
            },
            {
                name: 'aggregateBy',
                xtype: 'rallycombobox',
                plugins: ['rallyfieldvalidationui'],
                fieldLabel: 'Aggregate By',
                displayField: 'name',
                valueField: 'value',
                editable: false,
                allowBlank: false,
                width: 300,
                store: {
                    fields: ['name', 'value'],
                    data: [
                        { name: 'Accepted Leaf Story Count', value: 'acceptedleafcount' },
                        { name: 'Accepted Leaf Story Plan Estimate', value: 'acceptedleafplanest' },
                        { name: 'Count', value: 'count' },
                        { name: 'Leaf Story Count', value: 'leafcount' },
                        { name: 'Leaf Story Plan Estimate', value: 'leafplanest' },
                        { name: 'Preliminary Estimate', value: 'prelimest' },
                        { name: 'Refined Estimate', value: 'refinedest' }
                    ]
                },
                lastQuery: ''
            },
            {
                name: 'bucketBy',
                xtype: 'rallycombobox',
                plugins: ['rallyfieldvalidationui'],
                fieldLabel: 'Bucket By',
                displayField: 'name',
                valueField: 'value',
                editable: false,
                allowBlank: false,
                store: {
                    fields: ['name', 'value'],
                    data: [
                        { name: 'Month', value: 'month' },
                        { name: 'Quarter', value: 'quarter' },
                        { name: 'Release', value: 'release' }
                    ]
                },
                lastQuery: '',
                handlesEvents: {
                    typeselected: function (type) {
                         Rally.data.ModelFactory.getModel({
                            type: type,
                            success: function(model) {
                                this.store.filterBy(function(record) {
                                    return record.get('value') !== 'release' ||
                                        model.typeDefinition.Ordinal === 0;
                                });
                                if (!this.store.findRecord('value', this.getValue())) {
                                    this.setValue('month');
                                }
                            },
                            scope: this
                        });
                    }
                }
            },
            {
                type: 'query'
            }
        ];
    },

    _addChart: function() {
        var context = this.getContext(),
            whiteListFields = ['Milestones', 'Tags'],
            modelNames = [this.model.typePath],
            gridBoardConfig = {
                xtype: 'rallygridboard',
                toggleState: 'chart',
                chartConfig: this._getChartConfig(),
                plugins: [{
                    ptype:'rallygridboardinlinefiltercontrol',
                    showInChartMode: true,
                    inlineFilterButtonConfig: {
                        stateful: true,
                        stateId: context.getScopedStateId('filters'),
                        filterChildren: false,
                        modelNames: modelNames,
                        inlineFilterPanelConfig: {
                            quickFilterPanelConfig: {
                                defaultFields: [],
                                addQuickFilterConfig: {
                                   whiteListFields: whiteListFields
                                }
                            },
                            advancedFilterPanelConfig: {
                               advancedFilterRowsConfig: {
                                   propertyFieldConfig: {
                                       whiteListFields: whiteListFields
                                   }
                               }
                           }
                        }
                    }
                }],
                context: context,
                modelNames: modelNames,
                storeConfig: {
                    filters: this._getFilters()
                }
            };

        this.add(gridBoardConfig);
    },

    _getChartConfig: function() {
        return {
            xtype: 'rallychart',
            chartColors: [
                "#005EB8" // $blue
            ],
            storeType: 'Rally.data.wsapi.Store',
            storeConfig: {
                context: this.getContext().getDataContext(),
                limit: Infinity,
                fetch: this._getChartFetch(),
                sorters: this._getChartSort(),
                pageSize: 2000,
                model: this.model
            },
            calculatorType: 'Calculator',
            calculatorConfig: {
                bucketBy: this.getSetting('bucketBy'),
                aggregateBy: this.getSetting('aggregateBy')
            },
            chartConfig: {
                chart: { type: 'column' },
                legend: { enabled: false },
                title: {
                    text: ''
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: this._getYAxisLabel()
                    }
                },
                plotOptions: {
                    column: {
                        dataLabels: {
                            enabled: false
                        }
                    }
                }
            }
        };
    },

    onTimeboxScopeChange: function() {
        this.callParent(arguments);

        var gridBoard = this.down('rallygridboard');
        if (gridBoard) {
            gridBoard.destroy();
        }
        this._addChart();
    },

    _getYAxisLabel: function() {
        var estimateUnitName = this.getContext().getWorkspace().WorkspaceConfiguration.ReleaseEstimateUnitName;
        return this.getSetting('aggregateBy').indexOf('count') >= 0 ? 'Count' : estimateUnitName;
    },

    _getChartFetch: function() {
        return _.compact(['ActualStartDate', 'ActualEndDate', 'Release', Utils.getFieldForAggregationType(this.getSetting('aggregateBy'))]);
    },

    _getChartSort: function() {
        if (this.getSetting('bucketBy') === 'release') {
            return [{ property: 'Release.ReleaseDate', direction: 'ASC' }];
        } else {
            return [{ property: 'ActualEndDate', direction: 'ASC' }];
        }
    },

    _getFilters: function() {
        var queries = [{
            property: 'ActualEndDate',
            operator: '!=',
            value: null
        }];

        if (this.getSetting('bucketBy') === 'release') {
            queries.push({
                property: 'Release',
                operator: '!=',
                vaue: null
            });
        }

        var timeboxScope = this.getContext().getTimeboxScope();
        if (timeboxScope && timeboxScope.isApplicable(this.model)) {
            queries.push(timeboxScope.getQueryFilter());
        }
        if (this.getSetting('query')) {
            queries.push(Rally.data.QueryFilter.fromQueryString(this.getSetting('query')));
        }
        return queries;
    }
});
