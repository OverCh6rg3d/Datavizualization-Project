
const spec = {
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
            "fill": "#f0f0f0",
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

vegaEmbed('#vis', spec, {actions: true}).then(function(result) {
  // Visualization successfully loaded
}).catch(console.error);