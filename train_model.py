import numpy as np
import pymongo as mongo
import matplotlib.pyplot as plt
import keras
from keras.models import Sequential
from keras.layers import Dense, Dropout
from keras.optimizers import SGD
import json

batch = 20
test = 0.1
epochs = 500
groups = 200

dataset = mongo.MongoClient()['samples'].samplings.find()
counter = 0
in_train = np.zeros((dataset.count(), groups))
out_train = np.zeros((dataset.count()))

for pers in dataset:
    if len(pers['groups_id']) == groups and pers['person_id'] != -1:
        in_train[counter] = pers['groups_id']
        out_train[counter] = pers['mark']
        counter += 1

in_train = np.vsplit(in_train, (int(((counter*(1-test))//batch)*batch), counter))
in_test, in_train = in_train[1], in_train[0]
out_train = np.hsplit(out_train, (int(((counter*(1-test))//batch)*batch), counter))
out_test, out_train = out_train[1], out_train[0]


model = Sequential()
model.add(Dense(512, activation='relu', input_shape=(groups,)))
model.add(Dropout(0.2))
model.add(Dense(512, activation='relu', input_shape=(groups,)))
model.add(Dropout(0.2))
model.add(Dense(1, activation='relu'))

model.summary()

sd = SGD(lr=0.01, momentum=0.9, nesterov=True)
model.compile(loss='mean_squared_error',
              optimizer=sd,
              metrics=['accuracy'])

history = model.fit(in_train, out_train,
                    batch_size=20,
                    epochs=epochs,
                    verbose=1,
                    validation_data=(in_test,out_test))

model.save_weights('model_weights3D2.hdf5')
json_model = json.loads(model.to_json())
with open('model.json3D2', 'w') as outfile:
    json.dump(json_model, outfile)

score = model.evaluate(in_test, out_test, verbose=0)
print('all history')
print(history.history.keys())

plt.plot(history.history['acc'])
plt.plot(history.history['val_acc'])
plt.title('model accuracy')
plt.ylabel('accuracy')
plt.xlabel('epoch')
plt.legend(['train', 'test'], loc='upper left')
plt.show()

plt.plot(history.history['loss'])
plt.plot(history.history['val_loss'])
plt.title('model loss')
plt.ylabel('loss')
plt.xlabel('epoch')
plt.legend(['train', 'test'], loc='upper left')
plt.show()

print('test values');
for p in out_test:
    print(p)

res = model.predict(in_test)

print('Test predicts')

for p in res:
    print(p[0])

print('Test loss:', score[0])
print('Test accuracy:', score[1])
