import cv2
import numpy as np
import json


MAGNIFICATION = 2 # 2:1
IMG_WIDTH = 6624
IMG_HEIGHT = 5376
EXTENT = [0, 0, 1024, 1024]
file_path = "../vector.json"

img_rgb = cv2.imread('../rkc.png')
template = cv2.imread('./zero_zero.png')

res = cv2.matchTemplate(img_rgb, template, cv2.TM_CCOEFF_NORMED)

# 임계치 정하기 
threshold = .9

#임계치 이상만 배열에 저장
loc = np.where(res >= threshold)

#템플릿의 가로(w),세로(h)길이 저장
h, w = template.shape[:-1]
center = []


for pt in zip(*loc[::-1]):  # Switch collumns and rows
    center = [pt[0] + w / 2, pt[1] + h / 2]

def convert_list(pos):
    return [
        minX + (center[0] + pos[0] * MAGNIFICATION) * scaleX,
        maxY - (center[1] + pos[1] * MAGNIFICATION) * scaleY
    ]

def pixelToMapCoordinates(pixelCoords, imageWidth, imageHeight, mapExtent):
  global minX
  global maxY
  global scaleX
  global scaleY
  [minX, minY, maxX, maxY] = mapExtent
  scaleX = (maxX - minX) / imageWidth
  scaleY = (maxY - minY) / imageHeight
  result = list(map(convert_list, pixelCoords))
  return result


owner_json = {}
area = {}
with open('./owner.json', "r", encoding="utf-8") as json_file:
    owner_json = json.load(json_file)
with open('./area.json', "r", encoding="utf-8") as json_file:
    area = json.load(json_file)



polygons = {
    "type": "FeatureCollection",
    "features": []
}
idx = 0
for feature in area["features"]:
    polygon = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    []
                ]
            },
            "properties": {}
        }
    polygon["geometry"]["coordinates"] = [pixelToMapCoordinates(feature["coordinates"], IMG_WIDTH, IMG_HEIGHT, EXTENT)]
    try: owner = feature["properties"]["OWNER"]
    except: owner = "없음"
    polygon["properties"]["OWNER"] = owner
    try: polygon["properties"]["COLOR"] = owner_json[owner]["COLOR"]
    except: polygon["properties"]["COLOR"] = owner_json["없음"]["COLOR"]
    polygon["id"] = idx
    polygon["properties"]["coordinates"] = str(feature["coordinates"])
    polygons["features"].append(polygon)
    idx += 1

with open(file_path, 'w', encoding='utf-8') as file:
    json.dump(polygons, file)