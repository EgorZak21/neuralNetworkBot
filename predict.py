import json, sys
from keras.models import model_from_json
import numpy
groups = 200

json_string = open('model.json').read()

model = model_from_json(json_string)
model.load_weights('model_weights.hdf5')

while True:
    line = sys.stdin.readline()
    if len(line) > 0:
        data = json.loads(line)
        inputs = numpy.zeros((1, groups))
        inputs[0] = data['data']
        result = model.predict(inputs)
        data['data'] = numpy.float64(result[0][0])
        print(json.dumps(data))