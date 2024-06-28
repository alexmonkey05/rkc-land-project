import GeoJSON from 'ol/format/GeoJSON.js';
import Map from 'ol/Map.js';
import Select from 'ol/interaction/Select.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import View from 'ol/View.js';
import {Fill, Stroke, Style, Circle as CircleStyle} from 'ol/style';
import ImageLayer from 'ol/layer/Image.js';
import Static from 'ol/source/ImageStatic.js';
import Projection from 'ol/proj/Projection.js';
import {getCenter} from 'ol/extent.js';
import {Feature} from 'ol';
import {Point, Polygon} from 'ol/geom';
import 'ol/ol.css';
import {fromLonLat} from 'ol/proj';
const polygonCoords = [
  [[-10, 40], [10, 40], [10, 30], [-10, 30], [-10, 40]] // Example coordinates
];

const vectorSource = new VectorSource({
  features: [
    new Feature({
      geometry: new Polygon([polygonCoords.map(fromLonLat)])
    })
  ]
});

const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: function (feature) {
    // Calculate desired size in pixels based on current map resolution
    const resolution = this.getMap().getView().getResolution();
    const desiredSize = 10; // Example size in pixels
    const size = desiredSize / resolution;

    // Return style with dynamic size
    return new Style({
      fill: new Fill({ color: 'rgba(255, 0, 0, 0.1)' }),
      stroke: new Stroke({ color: 'red', width: 1 }),
      geometry: function (feature) {
        // Return geometry with scaled coordinates
        const coords = feature.getGeometry().getCoordinates()[0].map(coord => {
          return [
            coord[0] * size,
            coord[1] * size
          ];
        });
        return new Polygon([coords]);
      }
    });
  }
});

const map = new Map({
  target: 'map',
  layers: [
    vectorLayer
  ],
  view: new View({
    center: fromLonLat([0, 35]), // Example center
    zoom: 2 // Example zoom level
  })
});
