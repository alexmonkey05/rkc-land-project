#-*-coding: utf-8-*-

import cv2
import numpy as np
import json
from PIL import Image

im = Image.open('./rkc.png')
IMG_WIDTH, IMG_HEIGHT = im.size


MAGNIFICATION = 2 # 2:1
EXTENT = [0, 0, 1024, 1024]
file_path = "./vector.json"

img_rgb = cv2.imread('./rkc.png')
template = cv2.imread('./data/zero_zero.png')

res = cv2.matchTemplate(img_rgb, template, cv2.TM_CCOEFF_NORMED)

threshold = .9

loc = np.where(res >= threshold)

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
with open('./data/owner.json', "r", encoding="utf-8") as json_file:
    owner_json = json.load(json_file)
with open('./data/area.json', "r", encoding="utf-8") as json_file:
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
    try: polygon["properties"]["STROKE"] = owner_json[owner]["STROKE"]
    except: polygon["properties"]["STROKE"] = owner_json["없음"]["STROKE"]
    polygon["properties"]["id"] = idx
    polygon["properties"]["coordinates"] = feature["coordinates"]
    polygons["features"].append(polygon)
    idx += 1

with open(file_path, 'w', encoding='utf-8') as file:
    json.dump(polygons, file)

print("python done!")