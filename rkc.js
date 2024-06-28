import GeoJSON from 'ol/format/GeoJSON.js';
import Map from 'ol/Map.js';
import Select from 'ol/interaction/Select.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import View from 'ol/View.js';
import {Fill, Stroke, Style, Text} from 'ol/style';
import ImageLayer from 'ol/layer/Image.js';
import Static from 'ol/source/ImageStatic.js';
import Projection from 'ol/proj/Projection.js';
import {getCenter} from 'ol/extent.js';


const style = new Style({
  fill: new Fill({
    color: '#eeeeee',
  }),
  text: new Text({
    text: "없음", // Text to display (city name)
    font: '18px Calibri,sans-serif', // Font style
    fill: new Fill({ color: "#000" }), // Text color
    stroke: new Stroke({ color: '#fff', width: 2 }), // Outline color and width
    textAlign: 'center', // Text alignment: center
    textBaseline: 'middle' // Text baseline: middle
  })

});



const extent = [0, 0, 1024, 1024];
const projection = new Projection({
  code: 'xkcd-image',
  units: 'pixels',
  extent: extent,
});
const imgLayer = new ImageLayer({
  source: new Static({
    url: './rkc.png',
    projection: projection,
    imageExtent: extent,
  }),
});


const vector = new VectorLayer({ // vector feature에서의 1 = 마크에서의 14칸
  source: new VectorSource({
      url: 'vector.json',  // The location of the GeoJSON file
      format: new GeoJSON(),        // Specifies that the data format is GeoJSON
  }),
  style: function (feature) {
    const color = feature.get('COLOR') || '#eeeeee';
    const font_color = feature.get('COLOR') || '#ffffff';
    style.getFill().setColor(color);
    style.getText().setFill(new Fill({ color: font_color }));
    style.getText().setText(feature.get('OWNER'));
    return style;
  },
});

// const blankLayer = new VectorLayer({
//   source: new VectorSource(),
//   style: new Style({
//     fill: new Fill({
//       color: '#ffffff',
//     }),
//     stroke: new Stroke({
//       color: 'rgba(0, 0, 0, 1)',
//       width: 2,
//     })
//   })
// });


const map = new Map({
  layers: [
    imgLayer,
    vector,
    // blankLayer,
  ],
  target: 'map',
  view: new View({
    center: getCenter(extent),
    zoom: 2,
    projection: projection,
    // extent: extent
  }),
});

const selected = new Style({ // 선택한 영역의 기본 스타일
  fill: new Fill({
    color: '#eeeeee',
  }),
  stroke: new Stroke({
    color: 'rgba(0, 0, 0, 0.7)',
    width: 2,
  }),
});

function selectStyle(feature) { // 선택한 영역의 스타일 설정 함수
  const color = feature.get('COLOR') || '#0000ff';
  selected.getFill().setColor(color);
  return selected;
}

const selectSingleClick = new Select({style: selectStyle});

map.addInteraction(selectSingleClick);

function unselect(){
  console.log("unselect")
  
  // blankLayer.getSource().clear();
}

selectSingleClick.on('select', function (e) {
  console.log(e.coordinate)
  var features = e.target.getFeatures()
  var len = features.getLength()
  if(len == 0){ // 선택 해제
    unselect()
    return
  }
  
  // const geojsonObject = {
  //   'type': 'FeatureCollection',
  //   'crs': {
  //     'type': 'name',
  //     'properties': {
  //       'name': 'EPSG:3857',
  //     },
  //   },
  //   'features': [
  //     {
  //       'type': 'Feature',
  //       'geometry': {
  //         'type': 'Polygon',
  //         'coordinates': [
  //           [
  //             [mapCoord[0] + 10, mapCoord[1] + 10],
  //             [mapCoord[0] + 10, mapCoord[1] - 10],
  //             [mapCoord[0] - 10, mapCoord[1] - 10],
  //             [mapCoord[0] - 10, mapCoord[1] + 10],
  //             [mapCoord[0] + 10, mapCoord[1] + 10],
  //           ],
  //         ],
  //       },
  //     },
  //   ],
  // };
  // blankLayer.setSource(new VectorSource({
  //   features: new GeoJSON().readFeatures(geojsonObject),
  // }));
  var feature;
  var owner;
  var coordinate;
  for(let i = 0; i < len; i++){
    feature = features.item(i);
    owner = feature.get('OWNER');
    // if(owner == undefined){
    //   unselect()
    //   return
    // }
    coordinate = feature.get('coordinates')
    console.log(coordinate);
    alert(owner + "의 땅\n" + coordinate)
  }
});

// let mapCoord
// map.on('pointermove', function (event) {
//   const pixel = event.pixel; // Pixel coordinates of the pointer
//   mapCoord = map.getCoordinateFromPixel(pixel); // Map coordinates

// });



let button = document.getElementById("control_layer");
let is_layer_show = true
button.addEventListener("click", (e) => {
  if(is_layer_show){
    is_layer_show = false
    button.innerHTML = "땅 표시 보이기"
    map.removeLayer(vector)
  }
  else{
    is_layer_show = true
    button.innerHTML = "땅 표시 숨기기"
    map.addLayer(vector)
  }
})