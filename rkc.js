
const url = "http://rkcwebmap.kro.kr:8081/";
// const url = "http://localhost:8081/";

const style = new ol.style.Style({
  fill: new ol.style.Fill({
    color: '#eeeeee',
  }),
  text: new ol.style.Text({
    text: "없음", // Text to display (city name)
    font: '18px Calibri,sans-serif', // Font style
    fill: new ol.style.Fill({ color: "#000" }), // Text color
    stroke: new ol.style.Stroke({ color: '#fff', width: 2 }), // Outline color and width
    textAlign: 'center', // Text alignment: center
    textBaseline: 'middle' // Text baseline: middle
  })

});



const extent = [0, 0, 1024, 1024];
const projection = new ol.proj.Projection({
  code: 'xkcd-image',
  units: 'pixels',
  extent: extent,
});
const imgLayer = new ol.layer.Image({
  source: new ol.source.ImageStatic({
    url: './rkc.png',
    projection: projection,
    imageExtent: extent,
  }),
});


const vector = new ol.layer.Vector({ // vector feature에서의 1 = 마크에서의 14칸
  source: new ol.source.Vector({
      url: 'vector.json',  // The location of the GeoJSON file
      format: new ol.format.GeoJSON(),        // Specifies that the data format is GeoJSON
  }),
  style: function (feature) {
    const color = feature.get('COLOR') || '#eeeeee';
    const font_color = feature.get('COLOR') || '#ffffff';
    const stroke_color = feature.get('STROKE') || '#ffffff';
    style.getFill().setColor(color);
    style.getText().getStroke().setColor(stroke_color);
    style.getText().setFill(new ol.style.Fill({ color: font_color }));
    style.getText().setText(feature.get('OWNER'));
    return style;
  },
});


const map = new ol.Map({
  layers: [
    imgLayer,
    vector,
  ],
  target: 'map',
  view: new ol.View({
    center: ol.extent.getCenter(extent),
    zoom: 2,
    projection: projection,
  }),
});

const selected = new ol.style.Style({ // 선택한 영역의 기본 스타일
  fill: new ol.style.Fill({
    color: '#eeeeee',
  }),
  stroke: new ol.style.Stroke({
    color: 'rgba(0, 0, 0, 0.7)',
    width: 2,
  }),
  text: new ol.style.Text({
    text: "없음", // Text to display (city name)
    font: '18px Calibri,sans-serif', // Font style
    fill: new ol.style.Fill({ color: "#000" }), // Text color
    stroke: new ol.style.Stroke({ color: '#fff', width: 2 }), // Outline color and width
    textAlign: 'center', // Text alignment: center
    textBaseline: 'middle' // Text baseline: middle
  })
});

function selectStyle(feature) { // 선택한 영역의 스타일 설정 함수
  const color = feature.get('COLOR') || '#0000ff';
  selected.getFill().setColor(color);
  const stroke_color = feature.get('STROKE') || '#ffffff';
  selected.getText().setFill(new ol.style.Fill({ color: color }));
  selected.getText().setStroke(new ol.style.Stroke({ color: stroke_color }));
  selected.getText().setText(feature.get('OWNER'));
  return selected;
}

const selectSingleClick = new ol.interaction.Select({style: selectStyle});

map.addInteraction(selectSingleClick);
map.on('moveend', unselect);

function unselect(){
  
  var owner_div = document.getElementById("owner_div");
  if(owner_div != null)
    owner_div.remove();
}

function sendReq(url, params, method = "GET") {
  var data = {
      headers: {
          'content-type': 'application/json; charset=UTF-8',
      },
      method: method,
  };

  if (method === 'POST') {
      data.body = JSON.stringify(params);
  }


  return fetch(url, data)
      .then((data) => data.json())
      .then((res) => res)
      .catch((error) => console.log(error));
}

var dialog = document.getElementById("add_req");
var idx_input = document.getElementById("land_idx");
var owner_input = document.getElementById("owner")
var reason_input = document.getElementById("reason")
const tlscjdrksmd = false
dialog.addEventListener("close", (e) => {
  if(dialog.returnValue == "confirm")
    sendReq(url + "req/add", {
      idx: land_idx.value - 1,
      owner: owner_input.value,
      reason: reason_input.value
    }, "POST").then((res) => {
      console.log(res)
      if(res.success){
        alert("신청되었습니다")
      } else {
        alert(res.result)
      }
      console.log(res)
    })
});

selectSingleClick.on('select', function (e) {
  var features = e.target.getFeatures()
  var len = features.getLength()
  if(len == 0){ // 선택 해제
    unselect()
    return
  }
  var feature = features.item(0);
  var owner = feature.get('OWNER');
  if(owner == undefined){
    unselect()
    return
  }

  var coordinate = feature.get('coordinates')
  var pos_list = []
  for(let i = 0; i < coordinate.length - 1; i++){
    pos_list.push('[' + coordinate[i] + ']<br>')
  }

  var owner_div = document.getElementById("owner_div");
  if(owner_div == null){
    owner_div = document.createElement("div");
    owner_div.id = "owner_div"
    
    document.body.appendChild(owner_div)
  }
  
  var land_id = feature.get('id') + 1
  if(owner == "없음"){
    owner = ""
  } else{
    owner = "<br>" + owner
  }
  owner_div.innerHTML = '<div><b>' + land_id + "번 땅" + owner + '</b></div>\
        <hr>\
        <details>\
            <summary>좌표 보기</summary>\
            <p> ' + pos_list + '\
            </p>\
            <hr>\
        </details>'
  if(owner == "" || tlscjdrksmd){
    var submit_btn = document.createElement("button")
    submit_btn.innerHTML = "신청"
    submit_btn.onclick = () => {
      idx_input.value = land_id;
      document.getElementById("pos_list").innerHTML = '<details>\
              <summary>좌표 보기</summary>\
              <p> ' + pos_list + '\
              </p>\
              <hr>\
          </details>'
      unselect()
      dialog.showModal();
    }
    owner_div.appendChild(submit_btn)

  }

  owner_div.style.left = (mouseX - owner_div.offsetWidth / 2) + 'px';
  owner_div.style.top = (mouseY - owner_div.offsetHeight) + 'px';
});



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
});


let mouseX
let mouseY
document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});