from keras import layers
from keras import models


model = models.Sequential()
model.add(layers.Conv2D(32,(10,10),activation="relu",input_shape=(256, 256,3)))
model.add(layers.MaxPooling2D((2, 2)))
model.add(layers.Conv2D(64, (5, 5), activation="relu"))
model.add(layers.MaxPooling2D((4, 4)))
model.add(layers.Conv2D(8, (5, 5), activation="relu"))
model.add(layers.MaxPooling2D((4, 4)))
model.add(layers.Flatten())
model.add(layers.Dense(1, activation="softmax"))
model.summary()


# Input data files are available in the "../input/" directory.
# For example, running this (by clicking run or pressing Shift+Enter) will list all files under the input directory

import os


# Clear working directory
for dirname, _, filenames in os.walk('/kaggle/working'):
    for filename in filenames:
        os.remove(os.path.join(dirname, filename))

# make some directories
try:
    os.mkdir('/kaggle/working/train')
    os.mkdir('/kaggle/working/test')
    os.mkdir('/kaggle/working/validation')

    os.mkdir('/kaggle/working/train/elefante')
    os.mkdir('/kaggle/working/train/gatto')
    os.mkdir('/kaggle/working/test/elefante')
    os.mkdir('/kaggle/working/test/gatto')
    os.mkdir('/kaggle/working/validation/elefante')
    os.mkdir('/kaggle/working/validation/gatto')
except Exception:
    pass
        
import random
import cv2
# split out images from raw image
for dirname, _, filenames in os.walk('/kaggle/input'):
    if (dirname.find('elefante')==-1 and dirname.find('gatto')==-1):
        continue
    for filename in filenames:
        if (filename.endswith('jpeg')):
            # preprocess by resizing to size we want
            oriimg=cv2.imread(os.path.join(dirname, filename))
            img = cv2.resize(oriimg,(256,256))
            section=random.random()
            destination = ""
            if section<0.75:
                destination=os.path.join('/kaggle/working',"train",os.path.basename(dirname), filename)
            elif section<0.9:
                destination=os.path.join('/kaggle/working',"test",os.path.basename(dirname), filename)
            else:
                destination=os.path.join('/kaggle/working',"validation",os.path.basename(dirname), filename)
            cv2.imwrite(destination,img)



from keras.preprocessing.image import ImageDataGenerator

datagen = ImageDataGenerator()
train_it = datagen.flow_from_directory('/kaggle/working/train/', class_mode='binary', batch_size=64)
val_it = datagen.flow_from_directory('/kaggle/working/validation/', class_mode='binary', batch_size=64)
test_it = datagen.flow_from_directory('/kaggle/working/test/', class_mode='binary', batch_size=64)        

model.compile(loss="binary_crossentropy",
              optimizer="sgd",
              metrics=["accuracy"])


model.fit_generator(train_it, steps_per_epoch=16, validation_data=val_it, epochs=5, verbose=1, validation_steps=8)

loss = model.evaluate_generator(test_it, steps=24)

print (loss)

# Any results you write to the current directory are saved as output.