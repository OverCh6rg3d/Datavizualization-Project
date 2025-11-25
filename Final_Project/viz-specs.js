// Visualization specifications embedded as JavaScript objects
// This ensures they load without CORS issues

const viz1Spec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "title": "",
  "data": {
    "url": "https://raw.githubusercontent.com/OverCh6rg3d/Datavizualization-Project/refs/heads/main/data/weekly_counts_by_community.csv",
    "format": {"type": "csv"}
  },
  "vconcat": [
    {
      "width": 800,
      "height": 500,
      "title": "Accident Intensity by Community",
      "projection": {
        "type": "mercator"
      },
      "layer": [
        {
          "data": {
            "url": "https://raw.githubusercontent.com/OverCh6rg3d/Datavizualization-Project/refs/heads/main/data/dubai_neighborhoods.geojson",
            "format": {"type": "json", "property": "features"}
          },
          "mark": {
            "type": "geoshape",
            "fill": "#ffffff",
            "stroke": "#ffffff",
            "strokeWidth": 1
          }
        },
        {
          "params": [
            {
              "name": "community_select",
              "select": {
                "type": "point",
                "fields": ["Community"],
                "on": "click",
                "clear": "dblclick"
              }
            }
          ],
          "transform": [
            {
              "filter": {"param": "time_brush"}
            },
            {
              "aggregate": [
                {"op": "sum", "field": "Accident_Count", "as": "Total_Accidents"}
              ],
              "groupby": ["Community"]
            },
            {
              "lookup": "Community",
              "from": {
                "data": {
                  "url": "https://raw.githubusercontent.com/OverCh6rg3d/Datavizualization-Project/refs/heads/main/data/dubai_neighborhoods.geojson",
                  "format": {"type": "json", "property": "features"}
                },
                "key": "properties.CNAME_E",
                "fields": ["type", "geometry", "properties"]
              }
            },
            {
              "filter": "isValid(datum.geometry)"
            }
          ],
          "mark": {"type": "geoshape", "cursor": "pointer"},
          "encoding": {
            "shape": {"field": "geometry", "type": "geojson"},
            "color": {
              "field": "Total_Accidents",
              "type": "quantitative",
              "scale": {"scheme": "oranges"},
              "legend": {"title": "Total Accidents"}
            },
            "opacity": {
              "condition": {"param": "community_select", "value": 1},
              "value": 0.2
            },
            "tooltip": [
              {"field": "Community", "type": "nominal", "title": "Community"},
              {"field": "Total_Accidents", "type": "quantitative", "title": "Accidents"}
            ]
          }
        }
      ]
    },
    {
      "width": 800,
      "height": 150,
      "title": "Weekly Accident Trend",
      "params": [
        {
          "name": "time_brush",
          "select": {"type": "interval", "encodings": ["x"]}
        }
      ],
      "transform": [
        {
          "filter": {"param": "community_select"}
        },
        {
          "filter": "datum.Accident_Count > 0"
        }
      ],
      "mark": "line",
      "encoding": {
        "x": {
          "field": "week_start",
          "type": "ordinal",
          "timeUnit": "yearmonthdate",
          "axis": {"title": "Week", "format": "%Y %b %d", "labelAngle": -45}
        },
        "y": {
          "field": "Accident_Count",
          "type": "quantitative",
          "aggregate": "sum",
          "axis": {"title": "Accidents"}
        },
        "color": {"value": "#d62728"}
      }
    }
  ],
  "config": {
    "view": {"stroke": "transparent"}
  }
};

const viz2Spec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": {
    "url": "https://raw.githubusercontent.com/OverCh6rg3d/Datavizualization-Project/refs/heads/main/data/Accidents.csv"
  },
  "transform": [
    {
      "calculate": "timeParse(datum.acci_time, '%d/%m/%Y %H:%M')",
      "as": "parsed_date"
    },
    {
      "calculate": "hours(datum.parsed_date)",
      "as": "hour_of_day"
    },
    {
      "calculate": "day(datum.parsed_date) == 0 || day(datum.parsed_date) == 6 ? 'Weekend' : 'Weekday'",
      "as": "day_type"
    },
    {
      "timeUnit": "yearmonthdate",
      "field": "parsed_date",
      "as": "unique_date_identifier"
    },
    {
      "joinaggregate": [
        {
          "op": "distinct",
          "field": "unique_date_identifier",
          "as": "total_days_in_group"
        }
      ],
      "groupby": [
        "day_type"
      ]
    },
    {
      "calculate": "1 / datum.total_days_in_group",
      "as": "weighted_accident_count"
    }
  ],
  "vconcat": [
    {
      "width": 650,
      "height": 300,
      "title": "Average Accidents per Hour: Weekday vs Weekend (Drag to Filter)",
      "mark": "line",
      "params": [
        {
          "name": "time_brush",
          "select": {
            "type": "interval",
            "encodings": [
              "x"
            ]
          }
        }
      ],
      "transform": [
        {
          "filter": {
            "param": "category_filter"
          }
        }
      ],
      "encoding": {
        "x": {
          "field": "hour_of_day",
          "type": "quantitative",
          "title": "Hour of Day (0-23)",
          "scale": {
            "domain": [
              0,
              23
            ]
          }
        },
        "y": {
          "field": "weighted_accident_count",
          "aggregate": "sum",
          "title": "Average Accidents",
          "type": "quantitative"
        },
        "color": {
          "field": "day_type",
          "type": "nominal",
          "title": "Day Type",
          "scale": {
            "scheme": "set1"
          },
          "legend": {
            "orient": "top-right",
            "titleFontSize": 12,
            "labelFontSize": 12,
            "symbolSize": 100
          }
        },
        "tooltip": [
          {
            "field": "hour_of_day",
            "title": "Hour"
          },
          {
            "field": "day_type",
            "title": "Type"
          },
          {
            "field": "weighted_accident_count",
            "aggregate": "sum",
            "title": "Avg Accidents",
            "format": ".2f"
          }
        ]
      }
    },
    {
      "hconcat": [
        {
          "width": 350,
          "height": 300,
          "title": "Total Accidents by Category (Click to Filter Trend)",
          "mark": "bar",
          "params": [
            {
              "name": "category_filter",
              "select": {
                "type": "point",
                "fields": [
                  "Category"
                ]
              }
            }
          ],
          "transform": [
            {
              "filter": {
                "param": "time_brush"
              }
            }
          ],
          "encoding": {
            "y": {
              "field": "Category",
              "type": "nominal",
              "sort": "-x",
              "axis": {
                "labelLimit": 180
              }
            },
            "x": {
              "aggregate": "count",
              "title": "Total Count"
            },
            "color": {
              "condition": {
                "param": "category_filter",
                "field": "Category",
                "legend": null
              },
              "value": "lightgray"
            },
            "tooltip": [
              {
                "field": "Category"
              },
              {
                "aggregate": "count",
                "title": "Count"
              }
            ]
          }
        },
        {
          "width": 300,
          "height": 300,
          "title": "Category Distribution",
          "mark": "arc",
          "params": [
            {
              "name": "category_filter",
              "select": {
                "type": "point",
                "fields": [
                  "Category"
                ]
              }
            }
          ],
          "transform": [
            {
              "filter": {
                "param": "time_brush"
              }
            },
            {
              "joinaggregate": [
                {
                  "op": "count",
                  "as": "TotalCount"
                }
              ]
            },
            {
              "joinaggregate": [
                {
                  "op": "count",
                  "as": "CategoryCount"
                }
              ],
              "groupby": [
                "Category"
              ]
            },
            {
              "calculate": "datum.CategoryCount / datum.TotalCount",
              "as": "Percent"
            }
          ],
          "encoding": {
            "theta": {
              "aggregate": "count",
              "stack": true
            },
            "color": {
              "field": "Category",
              "type": "nominal",
              "legend": {
                "title": "Accident Category"
              }
            },
            "opacity": {
              "condition": {
                "param": "category_filter",
                "value": 1
              },
              "value": 0.2
            },
            "tooltip": [
              {
                "field": "Category"
              },
              {
                "field": "Percent",
                "title": "Percentage",
                "format": ".1%"
              }
            ]
          }
        }
      ]
    }
  ],
  "config": {
    "view": {
      "stroke": "transparent"
    },
    "axis": {
      "grid": true,
      "labelFont": "ui-sans-serif, system-ui, sans-serif",
      "titleFont": "ui-sans-serif, system-ui, sans-serif"
    },
    "legend": {
      "labelFont": "ui-sans-serif, system-ui, sans-serif",
      "titleFont": "ui-sans-serif, system-ui, sans-serif"
    },
    "title": {
      "font": "ui-sans-serif, system-ui, sans-serif",
      "fontSize": 16
    }
  }
};

const viz3Spec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": {
    "url": "https://raw.githubusercontent.com/OverCh6rg3d/Datavizualization-Project/refs/heads/main/data/Accidents.csv"
  },
  "transform": [
    {
      "lookup": "Community",
      "from": {
        "data": {
          "url": "https://raw.githubusercontent.com/OverCh6rg3d/Datavizualization-Project/refs/heads/main/data/community_population_density.csv"
        },
        "key": "Name",
        "fields": ["Population Density"]
      }
    }
  ],
  "vconcat": [
    {
      "title": "Accidents by Category (Click to Filter Scatterplot)",
      "height": 200,
      "width": 700,
      "mark": "bar",
      "params": [
        {
          "name": "category_selection",
          "select": {"type": "point", "fields": ["Category"]}
        }
      ],
      "transform": [
        {
          "aggregate": [{"op": "count", "as": "Accident_Count"}],
          "groupby": ["Category"]
        }
      ],
      "encoding": {
        "x": {
          "field": "Category",
          "type": "nominal",
          "sort": "-y",
          "axis": {"labelAngle": 0}
        },
        "y": {
          "title": "Number of Accidents",
          "field": "Accident_Count",
          "type": "quantitative"
        },
        "color": {
          "field": "Category",
          "type": "nominal",
          "legend": null
        },
        "opacity": {
          "condition": {"param": "category_selection", "value": 1},
          "value": 0.3
        },
        "tooltip": [
          {"field": "Accident_Count", "type": "quantitative", "title": "Accidents"}
        ]
      }
    },
    {
      "title": "Population Density vs Accident Count",
      "height": 300,
      "width": 700,
      "params": [
        {
          "name": "grid",
          "select": "interval",
          "bind": "scales"
        }
      ],
      "transform": [
        {"filter": {"param": "category_selection"}},
        {
          "aggregate": [{"op": "count", "as": "Accident_Count"}],
          "groupby": ["Community", "Population Density"]
        }
      ],
      "mark": "point",
      "encoding": {
        "x": {
          "field": "Population Density",
          "type": "quantitative",
          "title": "Population Density (per square kilometer)",
          "scale": {"type": "symlog", "constant": 1},
          "axis": {
            "grid": true,
            "tickCount": 10,
            "values": [
                0,1,2,3,4,5,6,7,8,9,10,
                20,30,40,50,60,70,80,90,100,
                200,300,400,500,600,700,800,900,1000,
                2000,3000,4000,5000,6000,7000,8000,9000,10000,
                20000,30000,40000,50000,60000,70000,80000,90000,100000,200000
              ]
            }
        },
        "y": {
          "field": "Accident_Count",
          "type": "quantitative",
          "title": "Number of Accidents",
          "scale": {"type": "log"},
          "axis": {"grid": true}
        },
        "tooltip": [
          {"field": "Community", "type": "nominal"},
          {"field": "Accident_Count", "type": "quantitative", "title": "Accidents"},
          {"field": "Population Density", "type": "quantitative", "format": ".2f"}
        ]
      }
    }
  ]
};
